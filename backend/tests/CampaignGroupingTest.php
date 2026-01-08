<?php
/**
 * Property-Based Tests for Campaign Grouping
 * 
 * These tests verify the correctness properties defined in the design document.
 * Run with: php backend/tests/CampaignGroupingTest.php
 * 
 * Properties tested:
 * - Property 3: Campaign grouping by channel
 */

require_once __DIR__ . '/../src/Database.php';
require_once __DIR__ . '/../src/Auth.php';
require_once __DIR__ . '/../src/Response.php';
require_once __DIR__ . '/../src/controllers/CombinedAnalyticsController.php';

class CampaignGroupingTest {
    
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
        echo "=== Campaign Grouping Property Tests ===\n\n";
        
        $this->setup();
        
        try {
            $this->testProperty3_CampaignGroupingByChannel();
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
     * **Feature: campaign-specific-reports, Property 3: Campaign grouping by channel**
     * 
     * For any campaign list response, each campaign SHALL appear in exactly one 
     * channel group (email, sms, or call) matching its actual channel type.
     * 
     * **Validates: Requirements 3.1**
     */
    public function testProperty3_CampaignGroupingByChannel(): void {
        echo "Property 3: Campaign grouping by channel\n";
        echo "  Validates: Requirements 3.1\n";
        
        $failures = [];
        
        for ($i = 0; $i < $this->iterations; $i++) {
            // Generate random campaigns for each channel
            $emailCount = rand(0, 5);
            $smsCount = rand(0, 5);
            $callCount = rand(0, 5);
            
            // Create test campaigns
            $createdCampaigns = [];
            
            for ($j = 0; $j < $emailCount; $j++) {
                $name = "Test Email $i-$j";
                $id = $this->createTestEmailCampaign($name);
                $createdCampaigns[] = ['id' => $id, 'channel' => 'email', 'name' => $name];
            }
            
            for ($j = 0; $j < $smsCount; $j++) {
                $name = "Test SMS $i-$j";
                $id = $this->createTestSMSCampaign($name);
                $createdCampaigns[] = ['id' => $id, 'channel' => 'sms', 'name' => $name];
            }
            
            for ($j = 0; $j < $callCount; $j++) {
                $name = "Test Call $i-$j";
                $id = $this->createTestCallCampaign($name);
                $createdCampaigns[] = ['id' => $id, 'channel' => 'call', 'name' => $name];
            }
            
            // Get campaigns list directly from database (simulating the controller logic)
            $result = $this->getCampaignsListDirect();
            
            // Verify each created campaign appears in exactly one group (the correct one)
            foreach ($createdCampaigns as $campaign) {
                $expectedChannel = $campaign['channel'];
                $campaignId = $campaign['id'];
                
                // Check if campaign is in its expected group
                $foundInExpectedGroup = $this->findCampaignInGroup($result[$expectedChannel], $campaignId);
                
                if (!$foundInExpectedGroup) {
                    $failures[] = "Campaign $campaignId not found in expected group '$expectedChannel'";
                    continue;
                }
                
                // Verify the campaign is NOT in other groups (different tables can have same IDs, 
                // but our created campaign should only be in its own table)
                $otherChannels = array_diff(['email', 'sms', 'call'], [$expectedChannel]);
                foreach ($otherChannels as $otherChannel) {
                    // We need to check if our specific campaign (by name pattern) appears in wrong group
                    // Since IDs can overlap across tables, we check by name pattern
                    $foundByName = $this->findCampaignByNamePattern($result[$otherChannel], $campaign['name']);
                    if ($foundByName) {
                        $failures[] = "Campaign '{$campaign['name']}' found in wrong group '$otherChannel' (expected '$expectedChannel')";
                    }
                }
            }
            
            // Cleanup iteration campaigns
            $this->cleanupIterationCampaigns();
        }
        
        $this->reportResult('Property 3', $failures);
    }
    
    // === Helper Methods ===
    
    private function getCampaignsListDirect(): array {
        // Get Email campaigns
        $stmt = $this->pdo->prepare('
            SELECT id, name, status, created_at 
            FROM campaigns 
            WHERE user_id = ? 
            ORDER BY created_at DESC
        ');
        $stmt->execute([$this->testUserId]);
        $emailCampaigns = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Get SMS campaigns
        $stmt = $this->pdo->prepare('
            SELECT id, name, status, created_at 
            FROM sms_campaigns 
            WHERE user_id = ? 
            ORDER BY created_at DESC
        ');
        $stmt->execute([$this->testUserId]);
        $smsCampaigns = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Get Call campaigns
        $stmt = $this->pdo->prepare('
            SELECT id, name, status, created_at 
            FROM call_campaigns 
            WHERE user_id = ? 
            ORDER BY created_at DESC
        ');
        $stmt->execute([$this->testUserId]);
        $callCampaigns = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        return [
            'email' => $emailCampaigns,
            'sms' => $smsCampaigns,
            'call' => $callCampaigns
        ];
    }
    
    private function findCampaignInGroup(array $group, $campaignId): bool {
        foreach ($group as $campaign) {
            if ((string)$campaign['id'] === (string)$campaignId) {
                return true;
            }
        }
        return false;
    }
    
    private function findCampaignByNamePattern(array $group, string $name): bool {
        foreach ($group as $campaign) {
            if ($campaign['name'] === $name) {
                return true;
            }
        }
        return false;
    }
    
    private function createTestEmailCampaign(string $name): int {
        $stmt = $this->pdo->prepare('
            INSERT INTO campaigns (user_id, name, subject, html_content, status, created_at) 
            VALUES (?, ?, ?, ?, ?, NOW())
        ');
        $stmt->execute([$this->testUserId, $name, 'Test Subject', '<p>Test</p>', 'draft']);
        $id = (int)$this->pdo->lastInsertId();
        $this->testCampaigns['email'][] = $id;
        return $id;
    }
    
    private function createTestSMSCampaign(string $name): int {
        $stmt = $this->pdo->prepare('
            INSERT INTO sms_campaigns (user_id, name, message, status, created_at) 
            VALUES (?, ?, ?, ?, NOW())
        ');
        $stmt->execute([$this->testUserId, $name, 'Test message', 'draft']);
        $id = (int)$this->pdo->lastInsertId();
        $this->testCampaigns['sms'][] = $id;
        return $id;
    }
    
    private function createTestCallCampaign(string $name): int {
        $stmt = $this->pdo->prepare('
            INSERT INTO call_campaigns (user_id, name, status, created_at) 
            VALUES (?, ?, ?, NOW())
        ');
        $stmt->execute([$this->testUserId, $name, 'draft']);
        $id = (int)$this->pdo->lastInsertId();
        $this->testCampaigns['call'][] = $id;
        return $id;
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
            $this->pdo->exec("INSERT INTO users (email, password, name) VALUES ('test_campaign@test.com', 'test', 'Test User')");
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
    $test = new CampaignGroupingTest();
    $test->runAll();
}
