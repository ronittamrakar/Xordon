<?php
/**
 * Property-Based Tests for AttributionService
 * 
 * **Feature: crm-enhancements, Property 26: Lead Source Capture**
 * **Feature: crm-enhancements, Property 27: Touchpoint History Completeness**
 * **Feature: crm-enhancements, Property 28: Attribution Model Calculation**
 * **Feature: crm-enhancements, Property 29: Attribution Aggregation**
 */

require_once __DIR__ . '/../src/Database.php';
require_once __DIR__ . '/../src/services/AttributionService.php';

class AttributionServiceTest {
    private $db;
    private $service;
    private $testUserId;
    private $testContactIds = [];
    
    public function __construct() {
        $this->db = Database::conn();
        $this->service = new AttributionService();
    }
    
    public function setUp(): void {
        $stmt = $this->db->prepare("SELECT id FROM users WHERE email = 'attribution_test@test.com'");
        $stmt->execute();
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($user) {
            $this->testUserId = $user['id'];
        } else {
            $stmt = $this->db->prepare("
                INSERT INTO users (email, password, name, created_at) 
                VALUES ('attribution_test@test.com', 'test', 'Attribution Test User', NOW())
            ");
            $stmt->execute();
            $this->testUserId = (int) $this->db->lastInsertId();
        }
        
        // Create test contacts
        for ($i = 0; $i < 5; $i++) {
            $email = "attr_contact_{$i}_" . time() . "@test.com";
            $stmt = $this->db->prepare("
                INSERT INTO contacts (email, name, user_id, created_at) 
                VALUES (?, ?, ?, NOW())
            ");
            $stmt->execute([$email, "Attribution Contact {$i}", $this->testUserId]);
            $this->testContactIds[] = (int) $this->db->lastInsertId();
        }
    }
    
    public function tearDown(): void {
        foreach ($this->testContactIds as $id) {
            $this->db->prepare("DELETE FROM touchpoints WHERE contact_id = ?")->execute([$id]);
            $this->db->prepare("DELETE FROM lead_sources WHERE contact_id = ?")->execute([$id]);
            $this->db->prepare("DELETE FROM contacts WHERE id = ?")->execute([$id]);
        }
    }
    
    /**
     * Property 26: Lead Source Capture
     * **Validates: Requirements 9.1**
     * 
     * For any lead created, the system SHALL capture and store the original source
     * including UTM parameters, referrer, and landing page.
     */
    public function testProperty26_LeadSourceCapture(): array {
        $results = ['passed' => 0, 'failed' => 0, 'errors' => []];
        $iterations = 30;
        
        echo "Property 26: Lead Source Capture\n";
        echo "  **Validates: Requirements 9.1**\n";
        
        $sourceTypes = ['form', 'call', 'campaign', 'referral', 'import', 'api'];
        
        for ($i = 0; $i < $iterations; $i++) {
            try {
                $contactId = $this->testContactIds[array_rand($this->testContactIds)];
                $sourceType = $sourceTypes[array_rand($sourceTypes)];
                
                $sourceData = [
                    'source_type' => $sourceType,
                    'source_id' => 'source_' . $i,
                    'campaign_id' => rand(1, 100),
                    'utm_source' => 'google',
                    'utm_medium' => 'cpc',
                    'utm_campaign' => 'test_campaign_' . $i,
                    'utm_term' => 'test keyword',
                    'utm_content' => 'ad_variant_a',
                    'referrer_url' => 'https://google.com/search?q=test',
                    'landing_page' => 'https://example.com/landing/' . $i
                ];
                
                $sourceId = $this->service->captureSource($contactId, $sourceData);
                
                if (!$sourceId) {
                    throw new Exception("Source ID should be returned");
                }
                
                // Verify source was captured
                $source = $this->service->getLeadSource($contactId);
                
                if (!$source) {
                    throw new Exception("Lead source should be retrievable");
                }
                
                // Verify all fields are captured
                if ($source['source_type'] !== $sourceType) {
                    throw new Exception("Source type mismatch");
                }
                
                if ($source['utm_source'] !== 'google') {
                    throw new Exception("UTM source not captured");
                }
                
                if ($source['utm_medium'] !== 'cpc') {
                    throw new Exception("UTM medium not captured");
                }
                
                if ($source['utm_campaign'] !== $sourceData['utm_campaign']) {
                    throw new Exception("UTM campaign not captured");
                }
                
                if ($source['referrer_url'] !== $sourceData['referrer_url']) {
                    throw new Exception("Referrer URL not captured");
                }
                
                if ($source['landing_page'] !== $sourceData['landing_page']) {
                    throw new Exception("Landing page not captured");
                }
                
                // Verify first touchpoint was also created
                $journey = $this->service->getContactJourney($contactId);
                if (empty($journey)) {
                    throw new Exception("First touchpoint should be created with source");
                }
                
                $results['passed']++;
                
            } catch (Exception $e) {
                $results['failed']++;
                if (count($results['errors']) < 5) {
                    $results['errors'][] = "Iteration {$i}: " . $e->getMessage();
                }
            }
        }
        
        $status = $results['failed'] === 0 ? '✓ PASSED' : '✗ FAILED';
        echo "  {$status} ({$results['passed']}/{$iterations} iterations)\n\n";
        
        return $results;
    }
    
    /**
     * Property 27: Touchpoint History Completeness
     * **Validates: Requirements 9.2**
     * 
     * For any contact, the touchpoint history SHALL contain all interactions
     * in chronological order with channel, action, and timestamp.
     */
    public function testProperty27_TouchpointHistoryCompleteness(): array {
        $results = ['passed' => 0, 'failed' => 0, 'errors' => []];
        $iterations = 30;
        
        echo "Property 27: Touchpoint History Completeness\n";
        echo "  **Validates: Requirements 9.2**\n";
        
        $channels = ['email', 'sms', 'call', 'form', 'linkedin', 'website'];
        $actions = ['opened', 'clicked', 'replied', 'submitted', 'viewed', 'converted'];
        
        for ($i = 0; $i < $iterations; $i++) {
            try {
                $contactId = $this->testContactIds[array_rand($this->testContactIds)];
                
                // Clear existing touchpoints
                $this->db->prepare("DELETE FROM touchpoints WHERE contact_id = ?")->execute([$contactId]);
                
                // Create multiple touchpoints
                $numTouchpoints = rand(3, 8);
                $expectedTouchpoints = [];
                
                for ($j = 0; $j < $numTouchpoints; $j++) {
                    $channel = $channels[array_rand($channels)];
                    $action = $actions[array_rand($actions)];
                    
                    $touchpointId = $this->service->addTouchpoint($contactId, [
                        'channel' => $channel,
                        'action' => $action,
                        'campaign_id' => rand(1, 100),
                        'metadata' => ['step' => $j]
                    ]);
                    
                    $expectedTouchpoints[] = [
                        'id' => $touchpointId,
                        'channel' => $channel,
                        'action' => $action
                    ];
                }
                
                // Get journey
                $journey = $this->service->getContactJourney($contactId);
                
                // Verify count
                if (count($journey) !== $numTouchpoints) {
                    throw new Exception("Expected {$numTouchpoints} touchpoints, got " . count($journey));
                }
                
                // Verify chronological order
                $prevTime = null;
                foreach ($journey as $tp) {
                    if ($prevTime !== null && strtotime($tp['created_at']) < strtotime($prevTime)) {
                        throw new Exception("Touchpoints should be in chronological order");
                    }
                    $prevTime = $tp['created_at'];
                    
                    // Verify required fields
                    if (empty($tp['channel'])) {
                        throw new Exception("Touchpoint missing channel");
                    }
                    
                    if (empty($tp['action'])) {
                        throw new Exception("Touchpoint missing action");
                    }
                    
                    if (empty($tp['created_at'])) {
                        throw new Exception("Touchpoint missing timestamp");
                    }
                }
                
                $results['passed']++;
                
            } catch (Exception $e) {
                $results['failed']++;
                if (count($results['errors']) < 5) {
                    $results['errors'][] = "Iteration {$i}: " . $e->getMessage();
                }
            }
        }
        
        $status = $results['failed'] === 0 ? '✓ PASSED' : '✗ FAILED';
        echo "  {$status} ({$results['passed']}/{$iterations} iterations)\n\n";
        
        return $results;
    }
    
    /**
     * Property 28: Attribution Model Calculation
     * **Validates: Requirements 9.3**
     * 
     * For any attribution calculation, the total credit SHALL equal 1.0 (100%)
     * and revenue SHALL be distributed according to the selected model.
     */
    public function testProperty28_AttributionModelCalculation(): array {
        $results = ['passed' => 0, 'failed' => 0, 'errors' => []];
        $iterations = 30;
        
        echo "Property 28: Attribution Model Calculation\n";
        echo "  **Validates: Requirements 9.3**\n";
        
        $models = ['first_touch', 'last_touch', 'linear', 'time_decay', 'u_shaped'];
        
        for ($i = 0; $i < $iterations; $i++) {
            try {
                $contactId = $this->testContactIds[array_rand($this->testContactIds)];
                
                // Clear and create touchpoints
                $this->db->prepare("DELETE FROM touchpoints WHERE contact_id = ?")->execute([$contactId]);
                
                $numTouchpoints = rand(2, 6);
                for ($j = 0; $j < $numTouchpoints; $j++) {
                    $this->service->addTouchpoint($contactId, [
                        'channel' => 'email',
                        'action' => 'clicked'
                    ]);
                }
                
                $revenue = rand(1000, 10000);
                
                foreach ($models as $model) {
                    $attribution = $this->service->calculateAttribution($contactId, $model, $revenue);
                    
                    if (empty($attribution)) {
                        throw new Exception("Attribution should not be empty for model: {$model}");
                    }
                    
                    // Verify total credit equals 1.0
                    $totalCredit = array_sum(array_column($attribution, 'credit'));
                    if (abs($totalCredit - 1.0) > 0.001) {
                        throw new Exception("Total credit should be 1.0 for {$model}, got {$totalCredit}");
                    }
                    
                    // Verify total revenue equals input
                    $totalRevenue = array_sum(array_column($attribution, 'revenue'));
                    if (abs($totalRevenue - $revenue) > 0.01) {
                        throw new Exception("Total revenue should be {$revenue} for {$model}, got {$totalRevenue}");
                    }
                    
                    // Model-specific validations
                    if ($model === 'first_touch') {
                        $credits = array_column($attribution, 'credit');
                        if (max($credits) !== 1.0) {
                            throw new Exception("First touch should give 100% to first touchpoint");
                        }
                    }
                    
                    if ($model === 'last_touch') {
                        $credits = array_column($attribution, 'credit');
                        if (max($credits) !== 1.0) {
                            throw new Exception("Last touch should give 100% to last touchpoint");
                        }
                    }
                    
                    if ($model === 'linear') {
                        $expectedCredit = 1.0 / $numTouchpoints;
                        foreach ($attribution as $attr) {
                            if (abs($attr['credit'] - $expectedCredit) > 0.001) {
                                throw new Exception("Linear should distribute equally");
                            }
                        }
                    }
                }
                
                $results['passed']++;
                
            } catch (Exception $e) {
                $results['failed']++;
                if (count($results['errors']) < 5) {
                    $results['errors'][] = "Iteration {$i}: " . $e->getMessage();
                }
            }
        }
        
        $status = $results['failed'] === 0 ? '✓ PASSED' : '✗ FAILED';
        echo "  {$status} ({$results['passed']}/{$iterations} iterations)\n\n";
        
        return $results;
    }
    
    /**
     * Property 29: Attribution Aggregation
     * **Validates: Requirements 9.4**
     * 
     * For any attribution report, the aggregations SHALL correctly sum
     * touchpoints, contacts, and revenue by channel/campaign/source.
     */
    public function testProperty29_AttributionAggregation(): array {
        $results = ['passed' => 0, 'failed' => 0, 'errors' => []];
        $iterations = 20;
        
        echo "Property 29: Attribution Aggregation\n";
        echo "  **Validates: Requirements 9.4**\n";
        
        for ($i = 0; $i < $iterations; $i++) {
            try {
                // Clear existing data
                foreach ($this->testContactIds as $contactId) {
                    $this->db->prepare("DELETE FROM touchpoints WHERE contact_id = ?")->execute([$contactId]);
                    $this->db->prepare("DELETE FROM lead_sources WHERE contact_id = ?")->execute([$contactId]);
                }
                
                // Create touchpoints with known values
                $expectedByChannel = [];
                $totalTouchpoints = 0;
                $totalRevenue = 0;
                
                foreach ($this->testContactIds as $contactId) {
                    $channel = ['email', 'sms', 'call'][array_rand(['email', 'sms', 'call'])];
                    $revenue = rand(100, 1000);
                    
                    $this->service->addTouchpoint($contactId, [
                        'channel' => $channel,
                        'action' => 'converted',
                        'revenue_attributed' => $revenue
                    ]);
                    
                    if (!isset($expectedByChannel[$channel])) {
                        $expectedByChannel[$channel] = ['touchpoints' => 0, 'revenue' => 0];
                    }
                    $expectedByChannel[$channel]['touchpoints']++;
                    $expectedByChannel[$channel]['revenue'] += $revenue;
                    $totalTouchpoints++;
                    $totalRevenue += $revenue;
                }
                
                // Get report
                $report = $this->service->getAttributionReport($this->testUserId);
                
                // Verify totals
                if ($report['totals']['total_touchpoints'] !== $totalTouchpoints) {
                    throw new Exception("Total touchpoints mismatch");
                }
                
                if (abs($report['totals']['total_revenue'] - $totalRevenue) > 0.01) {
                    throw new Exception("Total revenue mismatch");
                }
                
                // Verify by channel
                foreach ($report['by_channel'] as $channelData) {
                    $channel = $channelData['channel'];
                    if (isset($expectedByChannel[$channel])) {
                        if ($channelData['touchpoints'] != $expectedByChannel[$channel]['touchpoints']) {
                            throw new Exception("Channel {$channel} touchpoint count mismatch");
                        }
                    }
                }
                
                $results['passed']++;
                
            } catch (Exception $e) {
                $results['failed']++;
                if (count($results['errors']) < 5) {
                    $results['errors'][] = "Iteration {$i}: " . $e->getMessage();
                }
            }
        }
        
        $status = $results['failed'] === 0 ? '✓ PASSED' : '✗ FAILED';
        echo "  {$status} ({$results['passed']}/{$iterations} iterations)\n\n";
        
        return $results;
    }
    
    public function runAllTests(): array {
        echo "=== AttributionService Property Tests ===\n\n";
        
        $this->setUp();
        
        $allResults = [
            'property26' => $this->testProperty26_LeadSourceCapture(),
            'property27' => $this->testProperty27_TouchpointHistoryCompleteness(),
            'property28' => $this->testProperty28_AttributionModelCalculation(),
            'property29' => $this->testProperty29_AttributionAggregation()
        ];
        
        $this->tearDown();
        
        $totalPassed = array_sum(array_column($allResults, 'passed'));
        $totalFailed = array_sum(array_column($allResults, 'failed'));
        
        echo "=== Test Summary ===\n";
        echo "Total Passed: {$totalPassed}\n";
        echo "Total Failed: {$totalFailed}\n";
        
        return $allResults;
    }
}

if (php_sapi_name() === 'cli' && basename(__FILE__) === basename($_SERVER['SCRIPT_FILENAME'])) {
    $test = new AttributionServiceTest();
    $results = $test->runAllTests();
    exit(array_sum(array_column($results, 'failed')) > 0 ? 1 : 0);
}
