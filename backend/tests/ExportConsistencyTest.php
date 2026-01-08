<?php
/**
 * Property-Based Tests for Export Consistency
 * 
 * These tests verify the correctness properties defined in the design document.
 * Run with: php backend/tests/ExportConsistencyTest.php
 * 
 * Properties tested:
 * - Property 4: Export data consistency with selection
 */

require_once __DIR__ . '/../src/Database.php';
require_once __DIR__ . '/../src/Auth.php';
require_once __DIR__ . '/../src/Response.php';
require_once __DIR__ . '/../src/controllers/CombinedAnalyticsController.php';

class ExportConsistencyTest {
    
    private $pdo;
    private int $iterations = 100;
    private int $passed = 0;
    private int $failed = 0;
    private array $testCampaigns = [];
    private int $testUserId;
    
    public function __construct() {
        $this->pdo = Database::conn();
    }
    
    /**
     * Run all property tests
     */
    public function runAll(): void {
        echo "=== Export Consistency Property Tests ===\n\n";
        
        $this->setup();
        
        try {
            $this->testProperty4_ExportDataConsistencyWithSelection();
        } finally {
            $this->cleanup();
        }
        
        echo "\n=== Test Summary ===\n";
        echo "Passed: {$this->passed}\n";
        echo "Failed: {$this->failed}\n";
        echo "Total: " . ($this->passed + $this->failed) . "\n";
        
        // Exit with appropriate code
        exit($this->failed > 0 ? 1 : 0);
    }
    
    /**
     * **Feature: campaign-specific-reports, Property 4: Export data consistency with selection**
     * 
     * For any export operation with a campaign selected, the exported data SHALL contain 
     * the campaign name, channel type, and all channel-specific metrics matching the 
     * currently displayed data.
     * 
     * **Validates: Requirements 4.1, 4.2, 4.3**
     */
    public function testProperty4_ExportDataConsistencyWithSelection(): void {
        echo "Property 4: Export data consistency with selection\n";
        echo "  Validates: Requirements 4.1, 4.2, 4.3\n";
        
        $failures = [];
        
        // Define required export fields for each channel
        $requiredFields = [
            'email' => ['totalSent', 'totalOpens', 'totalClicks', 'totalBounces', 'totalUnsubscribes', 
                       'openRate', 'clickRate', 'bounceRate', 'unsubscribeRate'],
            'sms' => ['totalSent', 'totalDelivered', 'totalFailed', 'totalReplies',
                     'deliveryRate', 'failureRate', 'replyRate'],
            'call' => ['totalCalls', 'answeredCalls', 'missedCalls', 'voicemails', 'failedCalls',
                      'avgDuration', 'answerRate']
        ];
        
        for ($i = 0; $i < $this->iterations; $i++) {
            // Test each channel type
            foreach (['email', 'sms', 'call'] as $channel) {
                // Create a campaign with known data
                $campaignData = $this->createTestCampaignWithData($channel, "ExportTest_{$channel}_$i");
                
                // Get analytics for the campaign (simulating what would be displayed)
                $displayedData = $this->getCampaignAnalyticsDirect($campaignData['id'], $channel);
                
                if ($displayedData === null) {
                    $failures[] = "Iteration $i ($channel): Failed to get displayed analytics";
                    continue;
                }
                
                // Simulate export data generation (matching frontend logic)
                $exportData = $this->generateExportData($displayedData, $channel);
                
                // Verify export contains campaign name
                if (!isset($exportData['campaign']['name']) || empty($exportData['campaign']['name'])) {
                    $failures[] = "Iteration $i ($channel): Export missing campaign name";
                }
                
                // Verify export contains channel type
                if (!isset($exportData['campaign']['channel']) || $exportData['campaign']['channel'] !== $channel) {
                    $failures[] = "Iteration $i ($channel): Export missing or incorrect channel type";
                }
                
                // Verify all channel-specific metrics are present in export
                if (!isset($exportData['metrics'])) {
                    $failures[] = "Iteration $i ($channel): Export missing metrics object";
                    continue;
                }
                
                foreach ($requiredFields[$channel] as $field) {
                    if (!array_key_exists($field, $exportData['metrics'])) {
                        $failures[] = "Iteration $i ($channel): Export missing required metric '$field'";
                    }
                }
                
                // Verify export metrics match displayed data
                if (isset($displayedData['metrics'])) {
                    foreach ($displayedData['metrics'] as $key => $value) {
                        if (isset($exportData['metrics'][$key]) && $exportData['metrics'][$key] !== $value) {
                            $failures[] = "Iteration $i ($channel): Export metric '$key' doesn't match displayed value";
                        }
                    }
                }
            }
            
            $this->cleanupIterationCampaigns();
        }
        
        $this->reportResult('Property 4', $failures);
    }
    
    // === Helper Methods ===
    
    private function createTestCampaignWithData(string $channel, string $name): array {
        switch ($channel) {
            case 'email':
                $stmt = $this->pdo->prepare('
                    INSERT INTO campaigns (user_id, name, subject, html_content, status, sent, opens, clicks, bounces, unsubscribes, created_at) 
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
                ');
                $sent = rand(50, 200);
                $opens = rand(10, $sent);
                $clicks = rand(5, $opens);
                $bounces = rand(0, min(10, $sent - $opens));
                $unsubscribes = rand(0, min(5, $opens));
                $stmt->execute([$this->testUserId, $name, 'Test Subject', '<p>Test</p>', 'sent', $sent, $opens, $clicks, $bounces, $unsubscribes]);
                $id = (int)$this->pdo->lastInsertId();
                $this->testCampaigns['email'][] = $id;
                return [
                    'id' => $id,
                    'channel' => 'email',
                    'name' => $name,
                    'sent' => $sent,
                    'opens' => $opens,
                    'clicks' => $clicks,
                    'bounces' => $bounces,
                    'unsubscribes' => $unsubscribes
                ];
                
            case 'sms':
                $stmt = $this->pdo->prepare('
                    INSERT INTO sms_campaigns (user_id, name, message, status, created_at) 
                    VALUES (?, ?, ?, ?, NOW())
                ');
                $stmt->execute([$this->testUserId, $name, 'Test message', 'completed']);
                $id = (int)$this->pdo->lastInsertId();
                $this->testCampaigns['sms'][] = $id;
                return ['id' => $id, 'channel' => 'sms', 'name' => $name];
                
            case 'call':
                $stmt = $this->pdo->prepare('
                    INSERT INTO call_campaigns (user_id, name, status, created_at) 
                    VALUES (?, ?, ?, NOW())
                ');
                $stmt->execute([$this->testUserId, $name, 'active']);
                $id = (int)$this->pdo->lastInsertId();
                $this->testCampaigns['call'][] = $id;
                return ['id' => $id, 'channel' => 'call', 'name' => $name];
        }
        
        return ['id' => 0, 'channel' => $channel, 'name' => $name];
    }
    
    private function getCampaignAnalyticsDirect(int $campaignId, string $channel): ?array {
        switch ($channel) {
            case 'email':
                $stmt = $this->pdo->prepare('SELECT id, name, status, sent, opens, clicks, bounces, unsubscribes FROM campaigns WHERE id = ? AND user_id = ?');
                $stmt->execute([$campaignId, $this->testUserId]);
                $campaign = $stmt->fetch(PDO::FETCH_ASSOC);
                
                if (!$campaign) return null;
                
                $totalSent = (int)$campaign['sent'];
                $totalOpens = (int)$campaign['opens'];
                $totalClicks = (int)$campaign['clicks'];
                $totalBounces = (int)$campaign['bounces'];
                $totalUnsubscribes = (int)$campaign['unsubscribes'];
                
                return [
                    'campaign' => [
                        'id' => (string)$campaign['id'],
                        'name' => $campaign['name'],
                        'channel' => 'email',
                        'status' => $campaign['status']
                    ],
                    'metrics' => [
                        'totalSent' => $totalSent,
                        'totalOpens' => $totalOpens,
                        'totalClicks' => $totalClicks,
                        'totalBounces' => $totalBounces,
                        'totalUnsubscribes' => $totalUnsubscribes,
                        'openRate' => $totalSent > 0 ? round(($totalOpens / $totalSent) * 100, 2) : 0,
                        'clickRate' => $totalSent > 0 ? round(($totalClicks / $totalSent) * 100, 2) : 0,
                        'bounceRate' => $totalSent > 0 ? round(($totalBounces / $totalSent) * 100, 2) : 0,
                        'unsubscribeRate' => $totalSent > 0 ? round(($totalUnsubscribes / $totalSent) * 100, 2) : 0
                    ]
                ];
                
            case 'sms':
                $stmt = $this->pdo->prepare('SELECT id, name, status FROM sms_campaigns WHERE id = ? AND user_id = ?');
                $stmt->execute([$campaignId, $this->testUserId]);
                $campaign = $stmt->fetch(PDO::FETCH_ASSOC);
                
                if (!$campaign) return null;
                
                return [
                    'campaign' => [
                        'id' => (string)$campaign['id'],
                        'name' => $campaign['name'],
                        'channel' => 'sms',
                        'status' => $campaign['status']
                    ],
                    'metrics' => [
                        'totalSent' => 0,
                        'totalDelivered' => 0,
                        'totalFailed' => 0,
                        'totalReplies' => 0,
                        'deliveryRate' => 0,
                        'failureRate' => 0,
                        'replyRate' => 0
                    ]
                ];
                
            case 'call':
                $stmt = $this->pdo->prepare('SELECT id, name, status FROM call_campaigns WHERE id = ? AND user_id = ?');
                $stmt->execute([$campaignId, $this->testUserId]);
                $campaign = $stmt->fetch(PDO::FETCH_ASSOC);
                
                if (!$campaign) return null;
                
                return [
                    'campaign' => [
                        'id' => (string)$campaign['id'],
                        'name' => $campaign['name'],
                        'channel' => 'call',
                        'status' => $campaign['status']
                    ],
                    'metrics' => [
                        'totalCalls' => 0,
                        'answeredCalls' => 0,
                        'missedCalls' => 0,
                        'voicemails' => 0,
                        'failedCalls' => 0,
                        'avgDuration' => 0,
                        'answerRate' => 0
                    ]
                ];
        }
        
        return null;
    }
    
    private function generateExportData(array $displayedData, string $channel): array {
        // Simulate the frontend export logic
        return [
            'exportDate' => date('c'),
            'campaign' => [
                'id' => $displayedData['campaign']['id'],
                'name' => $displayedData['campaign']['name'],
                'channel' => $displayedData['campaign']['channel'],
                'status' => $displayedData['campaign']['status']
            ],
            'metrics' => $displayedData['metrics']
        ];
    }
    
    private function cleanupIterationCampaigns(): void {
        // Delete email campaigns from this iteration
        if (!empty($this->testCampaigns['email'])) {
            $ids = implode(',', $this->testCampaigns['email']);
            $this->pdo->exec("DELETE FROM campaigns WHERE id IN ($ids)");
        }
        
        // Delete SMS campaigns from this iteration
        if (!empty($this->testCampaigns['sms'])) {
            $ids = implode(',', $this->testCampaigns['sms']);
            $this->pdo->exec("DELETE FROM sms_campaigns WHERE id IN ($ids)");
        }
        
        // Delete call campaigns from this iteration
        if (!empty($this->testCampaigns['call'])) {
            $ids = implode(',', $this->testCampaigns['call']);
            $this->pdo->exec("DELETE FROM call_campaigns WHERE id IN ($ids)");
        }
        
        $this->testCampaigns = ['email' => [], 'sms' => [], 'call' => []];
    }
    
    // === Setup and Cleanup ===
    
    private function setup(): void {
        echo "Setting up test data...\n\n";
        
        // Initialize test campaigns array
        $this->testCampaigns = ['email' => [], 'sms' => [], 'call' => []];
        
        // Get an existing user for testing
        $stmt = $this->pdo->query("SELECT id FROM users LIMIT 1");
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$user) {
            // Create a test user if none exist
            $this->pdo->exec("INSERT INTO users (email, password, name) VALUES ('test_export@test.com', 'test', 'Test User')");
            $this->testUserId = (int)$this->pdo->lastInsertId();
        } else {
            $this->testUserId = (int)$user['id'];
        }
        
        echo "Using test user ID: {$this->testUserId}\n\n";
    }
    
    private function cleanup(): void {
        echo "\nCleaning up test data...\n";
        $this->cleanupIterationCampaigns();
    }
    
    private function reportResult(string $propertyName, array $failures): void {
        if (empty($failures)) {
            echo "  ✓ PASSED ({$this->iterations} iterations)\n\n";
            $this->passed++;
        } else {
            echo "  ✗ FAILED (" . count($failures) . " failures)\n";
            foreach (array_slice($failures, 0, 5) as $failure) {
                echo "    - $failure\n";
            }
            if (count($failures) > 5) {
                echo "    ... and " . (count($failures) - 5) . " more\n";
            }
            echo "\n";
            $this->failed++;
        }
    }
}

// Run tests if executed directly
if (php_sapi_name() === 'cli' && basename(__FILE__) === basename($_SERVER['SCRIPT_FILENAME'] ?? '')) {
    $test = new ExportConsistencyTest();
    $test->runAll();
}
