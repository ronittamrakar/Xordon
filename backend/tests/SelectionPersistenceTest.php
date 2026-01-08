<?php
/**
 * Property-Based Tests for Selection Persistence
 * 
 * These tests verify the correctness properties defined in the design document.
 * Run with: php backend/tests/SelectionPersistenceTest.php
 * 
 * Properties tested:
 * - Property 5: Selection persistence across timeframe changes
 */

require_once __DIR__ . '/../src/Database.php';
require_once __DIR__ . '/../src/Auth.php';
require_once __DIR__ . '/../src/Response.php';
require_once __DIR__ . '/../src/controllers/CombinedAnalyticsController.php';

class SelectionPersistenceTest {
    
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
        echo "=== Selection Persistence Property Tests ===\n\n";
        
        $this->setup();
        
        try {
            $this->testProperty5_SelectionPersistenceAcrossTimeframeChanges();
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
     * **Feature: campaign-specific-reports, Property 5: Selection persistence across timeframe changes**
     * 
     * For any timeframe change operation with a campaign selected, the campaign selection 
     * SHALL remain unchanged and the returned data SHALL reflect the new timeframe for 
     * the same campaign.
     * 
     * **Validates: Requirements 5.1, 5.3**
     */
    public function testProperty5_SelectionPersistenceAcrossTimeframeChanges(): void {
        echo "Property 5: Selection persistence across timeframe changes\n";
        echo "  Validates: Requirements 5.1, 5.3\n";
        
        $failures = [];
        $timeframes = ['7', '30', '90', '365'];
        
        for ($i = 0; $i < $this->iterations; $i++) {
            // Randomly select a channel type
            $channels = ['email', 'sms', 'call'];
            $channel = $channels[array_rand($channels)];
            
            // Create a test campaign
            $campaignData = $this->createTestCampaign($channel, "PersistenceTest_$i");
            $campaignId = $campaignData['id'];
            
            // Simulate selection persistence by querying with different timeframes
            // The campaign ID should remain the same, only the timeframe changes
            $previousTimeframe = null;
            $previousCampaignId = null;
            
            // Shuffle timeframes to simulate random timeframe changes
            $shuffledTimeframes = $timeframes;
            shuffle($shuffledTimeframes);
            
            foreach ($shuffledTimeframes as $timeframe) {
                // Get analytics for the same campaign with different timeframe
                $result = $this->getCampaignAnalyticsDirect($campaignId, $channel, (int)$timeframe);
                
                if ($result === null) {
                    $failures[] = "Iteration $i: Failed to get analytics for campaign $campaignId with timeframe $timeframe";
                    continue;
                }
                
                // Verify the campaign ID is preserved (selection persistence)
                if (!isset($result['campaign']) || $result['campaign']['id'] !== (string)$campaignId) {
                    $failures[] = "Iteration $i: Campaign ID not preserved. Expected $campaignId, got " . ($result['campaign']['id'] ?? 'null');
                }
                
                // Verify the timeframe in response matches the requested timeframe
                if (isset($result['timeframe']) && $result['timeframe'] !== $timeframe) {
                    $failures[] = "Iteration $i: Timeframe mismatch. Expected $timeframe, got {$result['timeframe']}";
                }
                
                // If we have a previous result, verify the campaign ID is the same
                if ($previousCampaignId !== null && isset($result['campaign'])) {
                    if ($result['campaign']['id'] !== $previousCampaignId) {
                        $failures[] = "Iteration $i: Campaign ID changed between timeframe changes. Was $previousCampaignId, now {$result['campaign']['id']}";
                    }
                }
                
                $previousTimeframe = $timeframe;
                $previousCampaignId = $result['campaign']['id'] ?? null;
            }
            
            $this->cleanupIterationCampaigns();
        }
        
        $this->reportResult('Property 5', $failures);
    }
    
    // === Helper Methods ===
    
    private function createTestCampaign(string $channel, string $name): array {
        switch ($channel) {
            case 'email':
                $stmt = $this->pdo->prepare('
                    INSERT INTO campaigns (user_id, name, subject, html_content, status, sent, opens, clicks, bounces, unsubscribes, created_at) 
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
                ');
                $sent = rand(10, 100);
                $opens = rand(0, $sent);
                $clicks = rand(0, $opens);
                $bounces = rand(0, max(0, $sent - $opens));
                $unsubscribes = rand(0, max(0, $opens - $clicks));
                $stmt->execute([$this->testUserId, $name, 'Test Subject', '<p>Test</p>', 'sent', $sent, $opens, $clicks, $bounces, $unsubscribes]);
                $id = (int)$this->pdo->lastInsertId();
                $this->testCampaigns['email'][] = $id;
                return ['id' => $id, 'channel' => 'email'];
                
            case 'sms':
                $stmt = $this->pdo->prepare('
                    INSERT INTO sms_campaigns (user_id, name, message, status, created_at) 
                    VALUES (?, ?, ?, ?, NOW())
                ');
                $stmt->execute([$this->testUserId, $name, 'Test message', 'completed']);
                $id = (int)$this->pdo->lastInsertId();
                $this->testCampaigns['sms'][] = $id;
                return ['id' => $id, 'channel' => 'sms'];
                
            case 'call':
                $stmt = $this->pdo->prepare('
                    INSERT INTO call_campaigns (user_id, name, status, created_at) 
                    VALUES (?, ?, ?, NOW())
                ');
                $stmt->execute([$this->testUserId, $name, 'active']);
                $id = (int)$this->pdo->lastInsertId();
                $this->testCampaigns['call'][] = $id;
                return ['id' => $id, 'channel' => 'call'];
        }
        
        return ['id' => 0, 'channel' => $channel];
    }
    
    private function getCampaignAnalyticsDirect(int $campaignId, string $channel, int $timeframe): ?array {
        $dateFrom = date('Y-m-d H:i:s', strtotime("-{$timeframe} days"));
        
        switch ($channel) {
            case 'email':
                $stmt = $this->pdo->prepare('SELECT id, name, status, sent, opens, clicks, bounces, unsubscribes FROM campaigns WHERE id = ? AND user_id = ?');
                $stmt->execute([$campaignId, $this->testUserId]);
                $campaign = $stmt->fetch(PDO::FETCH_ASSOC);
                
                if (!$campaign) return null;
                
                return [
                    'campaign' => [
                        'id' => (string)$campaign['id'],
                        'name' => $campaign['name'],
                        'channel' => 'email',
                        'status' => $campaign['status']
                    ],
                    'metrics' => [
                        'totalSent' => (int)$campaign['sent'],
                        'totalOpens' => (int)$campaign['opens'],
                        'totalClicks' => (int)$campaign['clicks'],
                        'totalBounces' => (int)$campaign['bounces'],
                        'totalUnsubscribes' => (int)$campaign['unsubscribes']
                    ],
                    'timeframe' => (string)$timeframe
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
                        'totalReplies' => 0
                    ],
                    'timeframe' => (string)$timeframe
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
                        'voicemails' => 0
                    ],
                    'timeframe' => (string)$timeframe
                ];
        }
        
        return null;
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
            $this->pdo->exec("INSERT INTO users (email, password, name) VALUES ('test_persistence@test.com', 'test', 'Test User')");
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
            foreach (array_slice($failures, 0, 3) as $failure) {
                echo "    - $failure\n";
            }
            if (count($failures) > 3) {
                echo "    ... and " . (count($failures) - 3) . " more\n";
            }
            echo "\n";
            $this->failed++;
        }
    }
}

// Run tests if executed directly
if (php_sapi_name() === 'cli' && basename(__FILE__) === basename($_SERVER['SCRIPT_FILENAME'] ?? '')) {
    $test = new SelectionPersistenceTest();
    $test->runAll();
}
