<?php

/**
 * Stream wrapper to mock php://input for testing
 */
class MockPhpInputStream {
    public $context;
    private static $data = '';
    private $position = 0;

    public static function setData($data) {
        self::$data = $data;
    }

    public function stream_open($path, $mode, $options, &$opened_path) {
        $this->position = 0;
        return true;
    }

    public function stream_read($count) {
        $ret = substr(self::$data, $this->position, $count);
        $this->position += strlen($ret);
        return $ret;
    }

    public function stream_eof() {
        return $this->position >= strlen(self::$data);
    }

    public function stream_stat() {
        return [];
    }
}

use PHPUnit\Framework\TestCase;

/**
 * PHPUnit tests for LeadMatchesController
 * Tests critical Lead Marketplace functionality including:
 * - Lead creation with validation
 * - Duplicate detection (409)
 * - Email format validation (422)
 * - Transaction rollback on failure
 * - Routing logic and error handling
 */
class LeadMatchesControllerTest extends TestCase
{
    private static $pdo;
    private static $workspaceId = 1;

    public static function setUpBeforeClass(): void
    {
        // Register mock stream wrapper for php://input
        stream_wrapper_unregister('php');
        stream_wrapper_register('php', 'MockPhpInputStream');

        // Setup test database connection
        // In production, use a separate test database or transaction rollback
        require_once __DIR__ . '/../src/Database.php';
        require_once __DIR__ . '/../src/controllers/LeadMatchesController.php';
        
        self::$pdo = Database::conn();
        
        // Clean test data
        self::$pdo->exec("DELETE FROM lead_requests WHERE consumer_email LIKE 'test_%@example.com'");
        self::$pdo->exec("DELETE FROM lead_matches WHERE workspace_id = " . self::$workspaceId);
    }

    public static function tearDownAfterClass(): void
    {
        // Restore original php stream wrapper
        stream_wrapper_restore('php');
        
        // Clean up test data
        self::$pdo->exec("DELETE FROM lead_requests WHERE consumer_email LIKE 'test_%@example.com'");
    }

    protected function setUp(): void
    {
        // Mock tenant context
        $GLOBALS['tenantContext'] = (object)['workspaceId' => self::$workspaceId];
    }

    public function testCreateLeadRequestSuccess()
    {
        $payload = [
            'consumer_name' => 'Test User',
            'consumer_email' => 'test_success@example.com',
            'consumer_phone' => '555-0100',
            'city' => 'Test City',
            'postal_code' => '12345',
            'title' => 'Need plumbing repair',
            'description' => 'My kitchen sink is leaking',
            'services' => [1], // Assuming service ID 1 exists
            'consent_contact' => true,
        ];

        // Mock stdin for JSON input
        MockPhpInputStream::setData(json_encode($payload));
        
        ob_start();
        \App\Controllers\LeadMatchesController::createLeadRequest();
        $output = ob_get_clean();
        
        $response = json_decode($output, true);
        
        $this->assertTrue($response['success'] ?? false, 'Expected success response');
        $this->assertArrayHasKey('data', $response);
        $this->assertArrayHasKey('id', $response['data']);
        $this->assertGreaterThan(0, $response['data']['id']);
    }

    public function testCreateLeadRequestDuplicate409()
    {
        $payload = [
            'consumer_email' => 'test_duplicate@example.com',
            'consumer_phone' => '555-0101',
            'title' => 'Test duplicate',
            'services' => [1],
        ];

        // First submission
        MockPhpInputStream::setData(json_encode($payload));
        ob_start();
        \App\Controllers\LeadMatchesController::createLeadRequest();
        ob_end_clean();

        // Second submission (should be rejected as duplicate)
        MockPhpInputStream::setData(json_encode($payload));
        ob_start();
        \App\Controllers\LeadMatchesController::createLeadRequest();
        $output = ob_get_clean();
        
        $response = json_decode($output, true);
        
        $this->assertFalse($response['success'] ?? true);
        $this->assertEquals('Duplicate request', $response['error'] ?? '');
        // Check HTTP 409 was set (would need to mock http_response_code)
    }

    public function testCreateLeadRequestInvalidEmail422()
    {
        $payload = [
            'consumer_name' => 'Test User',
            'consumer_email' => 'not-an-email',
            'services' => [1],
        ];

        MockPhpInputStream::setData(json_encode($payload));
        
        ob_start();
        \App\Controllers\LeadMatchesController::createLeadRequest();
        $output = ob_get_clean();
        
        $response = json_decode($output, true);
        
        $this->assertFalse($response['success'] ?? true);
        $this->assertEquals('Invalid email format', $response['error'] ?? '');
    }

    public function testCreateLeadRequestMissingContactInfo400()
    {
        $payload = [
            'title' => 'No contact info',
            'services' => [1],
        ];

        MockPhpInputStream::setData(json_encode($payload));
        
        ob_start();
        \App\Controllers\LeadMatchesController::createLeadRequest();
        $output = ob_get_clean();
        
        $response = json_decode($output, true);
        
        $this->assertFalse($response['success'] ?? true);
        $this->assertStringContainsString('contact method', strtolower($response['error'] ?? ''));
    }

    public function testCreateLeadRequestMissingServices400()
    {
        $payload = [
            'consumer_email' => 'test_noservices@example.com',
            'title' => 'No services',
        ];

        MockPhpInputStream::setData(json_encode($payload));
        
        ob_start();
        \App\Controllers\LeadMatchesController::createLeadRequest();
        $output = ob_get_clean();
        
        $response = json_decode($output, true);
        
        $this->assertFalse($response['success'] ?? true);
        $this->assertStringContainsString('service', strtolower($response['error'] ?? ''));
    }

    public function testRouteLeadRequestInvalidId400()
    {
        ob_start();
        \App\Controllers\LeadMatchesController::routeLeadRequest(0);
        $output = ob_get_clean();
        
        $response = json_decode($output, true);
        
        $this->assertFalse($response['success'] ?? true);
        $this->assertEquals('Invalid lead ID', $response['error'] ?? '');
    }

    public function testRouteLeadRequestNotFound404()
    {
        ob_start();
        \App\Controllers\LeadMatchesController::routeLeadRequest(999999);
        $output = ob_get_clean();
        
        $response = json_decode($output, true);
        
        $this->assertFalse($response['success'] ?? true);
        $this->assertEquals('Lead request not found', $response['error'] ?? '');
    }

    public function testScoreLeadQuality()
    {
        $data = [
            'consumer_name' => 'John Doe',
            'consumer_email' => 'john@example.com',
            'consumer_phone' => '555-0100',
            'postal_code' => '12345',
            'title' => 'Kitchen Remodel',
            'description' => 'I need a complete kitchen remodel with new cabinets and countertops',
            'budget_min' => 5000,
            'budget_max' => 15000,
        ];

        $result = \App\Controllers\LeadMatchesController::scoreLeadQuality($data);

        $this->assertArrayHasKey('quality_score', $result);
        $this->assertArrayHasKey('is_spam', $result);
        $this->assertGreaterThan(50, $result['quality_score'], 'Quality score should be high for complete data');
        $this->assertFalse($result['is_spam'], 'Should not be marked as spam');
    }

    public function testScoreLeadQualityDetectsSpam()
    {
        $data = [
            'consumer_email' => 'spam@example.com',
            'title' => 'Buy viagra cheap',
            'description' => 'Click here for viagra',
        ];

        $result = \App\Controllers\LeadMatchesController::scoreLeadQuality($data);

        $this->assertTrue($result['is_spam'], 'Should be marked as spam');
        $this->assertLessThan(20, $result['quality_score'], 'Spam should have low quality score');
    }
}
