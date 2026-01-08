<?php
/**
 * Property-Based Tests for NotificationService
 * 
 * **Feature: crm-enhancements, Property 24: Notification Delivery**
 * **Feature: crm-enhancements, Property 25: Notification Action Handling**
 */

require_once __DIR__ . '/../src/Database.php';
require_once __DIR__ . '/../src/services/NotificationService.php';

class NotificationServiceTest {
    private $db;
    private $service;
    private $testUserId;
    private $testConfigIds = [];
    
    public function __construct() {
        $this->db = Database::conn();
        $this->service = new NotificationService();
    }
    
    public function setUp(): void {
        $stmt = $this->db->prepare("SELECT id FROM users WHERE email = 'notification_test@test.com'");
        $stmt->execute();
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($user) {
            $this->testUserId = $user['id'];
        } else {
            $stmt = $this->db->prepare("
                INSERT INTO users (email, password, name, created_at) 
                VALUES ('notification_test@test.com', 'test', 'Notification Test User', NOW())
            ");
            $stmt->execute();
            $this->testUserId = (int) $this->db->lastInsertId();
        }
    }
    
    public function tearDown(): void {
        foreach ($this->testConfigIds as $id) {
            $this->db->prepare("DELETE FROM notification_actions WHERE notification_log_id IN (SELECT id FROM notification_logs WHERE config_id = ?)")->execute([$id]);
            $this->db->prepare("DELETE FROM notification_logs WHERE config_id = ?")->execute([$id]);
            $this->db->prepare("DELETE FROM notification_configs WHERE id = ?")->execute([$id]);
        }
    }
    
    /**
     * Property 24: Notification Delivery
     * **Validates: Requirements 8.2, 8.3**
     * 
     * For any notification sent, the system SHALL:
     * (1) create a delivery log, (2) retry on failure up to max retries, (3) record final status.
     */
    public function testProperty24_NotificationDelivery(): array {
        $results = ['passed' => 0, 'failed' => 0, 'errors' => []];
        $iterations = 30;
        
        echo "Property 24: Notification Delivery\n";
        echo "  **Validates: Requirements 8.2, 8.3**\n";
        
        for ($i = 0; $i < $iterations; $i++) {
            try {
                // Create notification config (with invalid webhook to test failure handling)
                $configId = $this->service->configureIntegration($this->testUserId, [
                    'provider' => ['slack', 'teams'][array_rand(['slack', 'teams'])],
                    'channel_id' => 'test_channel_' . $i,
                    'channel_name' => 'Test Channel',
                    'webhook_url' => 'https://invalid-webhook-url-' . time() . '.test/webhook',
                    'triggers' => ['new_lead', 'deal_won']
                ]);
                $this->testConfigIds[] = $configId;
                
                // Verify config was created
                $config = $this->service->getConfigById($configId);
                if (!$config) {
                    throw new Exception("Config should be created");
                }
                
                // Send notification (will fail due to invalid webhook)
                $logId = $this->service->sendNotification(
                    $configId,
                    'test_notification',
                    'Test Title ' . $i,
                    'Test message content',
                    [
                        ['id' => 'view', 'label' => 'View'],
                        ['id' => 'complete', 'label' => 'Complete']
                    ]
                );
                
                // Verify log was created
                $status = $this->service->getDeliveryStatus($logId);
                if (!$status) {
                    throw new Exception("Delivery log should be created");
                }
                
                // Verify log has required fields
                if (!isset($status['notification_type'])) {
                    throw new Exception("Log should have notification_type");
                }
                
                if (!isset($status['title'])) {
                    throw new Exception("Log should have title");
                }
                
                if (!isset($status['status'])) {
                    throw new Exception("Log should have status");
                }
                
                // Verify retry count is recorded
                if (!isset($status['retry_count'])) {
                    throw new Exception("Log should have retry_count");
                }
                
                // Status should be 'failed' or 'sent' (failed due to invalid webhook)
                if (!in_array($status['status'], ['sent', 'failed', 'pending'])) {
                    throw new Exception("Invalid status: {$status['status']}");
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
     * Property 25: Notification Action Handling
     * **Validates: Requirements 8.4**
     * 
     * For any notification action callback, the system SHALL:
     * (1) record the action response, (2) update notification status, (3) identify action type.
     */
    public function testProperty25_NotificationActionHandling(): array {
        $results = ['passed' => 0, 'failed' => 0, 'errors' => []];
        $iterations = 30;
        
        echo "Property 25: Notification Action Handling\n";
        echo "  **Validates: Requirements 8.4**\n";
        
        $actionTypes = ['view_lead', 'complete_task', 'snooze_reminder', 'custom_action'];
        
        for ($i = 0; $i < $iterations; $i++) {
            try {
                // Create config
                $configId = $this->service->configureIntegration($this->testUserId, [
                    'provider' => 'slack',
                    'channel_id' => 'action_test_' . $i,
                    'webhook_url' => 'https://test.webhook/' . $i
                ]);
                $this->testConfigIds[] = $configId;
                
                // Create notification log directly for testing
                $stmt = $this->db->prepare("
                    INSERT INTO notification_logs (config_id, notification_type, title, message, actions, status, created_at)
                    VALUES (?, 'test', 'Test', 'Test message', ?, 'sent', NOW())
                ");
                $stmt->execute([$configId, json_encode([['id' => 'test_action', 'label' => 'Test']])]);
                $logId = (int) $this->db->lastInsertId();
                
                // Handle action
                $actionId = $actionTypes[array_rand($actionTypes)];
                $responseData = ['user' => 'test_user', 'timestamp' => time()];
                
                $success = $this->service->handleAction($logId, $actionId, $responseData);
                
                if (!$success) {
                    throw new Exception("Action handling should succeed");
                }
                
                // Verify action was recorded
                $stmt = $this->db->prepare("
                    SELECT * FROM notification_actions WHERE notification_log_id = ?
                ");
                $stmt->execute([$logId]);
                $action = $stmt->fetch(PDO::FETCH_ASSOC);
                
                if (!$action) {
                    throw new Exception("Action should be recorded");
                }
                
                if ($action['action_id'] !== $actionId) {
                    throw new Exception("Action ID should match");
                }
                
                // Verify action type was identified
                $expectedType = 'custom';
                if (strpos($actionId, 'view') !== false) $expectedType = 'view';
                if (strpos($actionId, 'complete') !== false) $expectedType = 'complete';
                if (strpos($actionId, 'snooze') !== false) $expectedType = 'snooze';
                
                if ($action['action_type'] !== $expectedType) {
                    throw new Exception("Action type should be '{$expectedType}', got '{$action['action_type']}'");
                }
                
                // Verify notification status was updated
                $status = $this->service->getDeliveryStatus($logId);
                if ($status['status'] !== 'delivered') {
                    throw new Exception("Notification status should be 'delivered' after action");
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
        echo "=== NotificationService Property Tests ===\n\n";
        
        $this->setUp();
        
        $allResults = [
            'property24' => $this->testProperty24_NotificationDelivery(),
            'property25' => $this->testProperty25_NotificationActionHandling()
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
    $test = new NotificationServiceTest();
    $results = $test->runAllTests();
    exit(array_sum(array_column($results, 'failed')) > 0 ? 1 : 0);
}
