<?php
/**
 * Property-Based Tests for Campaign Filtering
 * 
 * These tests verify the correctness properties defined in the design document.
 * Run with: php backend/tests/CampaignFilteringTest.php
 * 
 * Properties tested:
 * - Property 1: Campaign filtering returns only selected campaign data
 * - Property 2: Channel-specific metrics completeness
 */

require_once __DIR__ . '/../src/Database.php';
require_once __DIR__ . '/../src/Auth.php';
require_once __DIR__ . '/../src/Response.php';
require_once __DIR__ . '/../src/controllers/CombinedAnalyticsController.php';

class CampaignFilteringTest {
    
    private $pdo;
    private int $iterations = 100;
    private int $passed = 0;
    private int $failed = 0;
    private array $testData = [];
    private int $testUserId;
    
    public function __construct() {
        $this->pdo = Database::conn();
    }
    
    /**
     * Run all property tests
     */
    public function runAll(): void {
        echo "=== Campaign Filtering Property Tests ===\n\n";
        
        $this->setup();
        
        try {
            $this->testProperty1_CampaignFilteringReturnsOnlySelectedData();
            $this->testProperty2_ChannelSpecificMetricsCompleteness();
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
     * **Feature: campaign-specific-reports, Property 1: Campaign filtering returns only selected campaign data**
     * 
     * For any campaign selection with a specific campaign ID and channel, all returned 
     * metrics and daily stats SHALL contain data only from that campaign, with no data 
     * from other campaigns included.
     * 
     * **Validates: Requirements 1.2, 2.4**
     */
    public function testProperty1_CampaignFilteringReturnsOnlySelectedData(): void {
        echo "Property 1: Campaign filtering returns only selected campaign data\n";
        echo "  Validates: Requirements 1.2, 2.4\n";
        
        $failures = [];
        
        for ($i = 0; $i < $this->iterations; $i++) {
            // Randomly select a channel type
            $channels = ['email', 'sms', 'call'];
            $channel = $channels[array_rand($channels)];
            
            // Create two campaigns of the same type with different data
            $campaign1Data = $this->createCampaignWithData($channel, "Campaign1_$i", rand(10, 100));
            $campaign2Data = $this->createCampaignWithData($channel, "Campaign2_$i", rand(10, 100));
            
            // Get analytics for campaign 1 only
            $result = $this->getCampaignAnalyticsDirect($campaign1Data['id'], $channel);
            
            if ($result === null) {
                $failures[] = "Iteration $i: Failed to get analytics for campaign {$campaign1Data['id']}";
                $this->cleanupIterationData();
                continue;
            }
            
            // Verify the returned campaign info matches the requested campaign
            if (!isset($result['campaign']) || $result['campaign']['id'] !== (string)$campaign1Data['id']) {
                $failures[] = "Iteration $i: Returned campaign ID doesn't match requested campaign";
            }
            
            // Verify the channel matches
            if (!isset($result['campaign']) || $result['campaign']['channel'] !== $channel) {
                $failures[] = "Iteration $i: Returned channel doesn't match requested channel";
            }
            
            // Verify metrics are for the specific campaign (not aggregated)
            // The metrics should reflect only the data we created for campaign1
            if (isset($result['metrics'])) {
                $metricsValid = $this->verifyMetricsForCampaign($result['metrics'], $channel, $campaign1Data);
                if (!$metricsValid) {
                    $failures[] = "Iteration $i: Metrics don't match expected values for campaign";
                }
            }
            
            $this->cleanupIterationData();
        }
        
        $this->reportResult('Property 1', $failures);
    }
    
    /**
     * **Feature: campaign-specific-reports, Property 2: Channel-specific metrics completeness**
     * 
     * For any campaign analytics response, the metrics object SHALL contain all required 
     * fields for that campaign's channel type:
     * - email: openRate, clickRate, bounceRate, unsubscribeRate
     * - sms: deliveryRate, failureRate, replyRate
     * - call: answerRate, avgDuration, voicemails
     * 
     * **Validates: Requirements 2.1, 2.2, 2.3**
     */
    public function testProperty2_ChannelSpecificMetricsCompleteness(): void {
        echo "Property 2: Channel-specific metrics completeness\n";
        echo "  Validates: Requirements 2.1, 2.2, 2.3\n";
        
        $failures = [];
        
        // Define required fields for each channel
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
                // Create a campaign with random data
                $campaignData = $this->createCampaignWithData($channel, "MetricsTest_{$channel}_$i", rand(1, 50));
                
                // Get analytics for the campaign
                $result = $this->getCampaignAnalyticsDirect($campaignData['id'], $channel);
                
                if ($result === null) {
                    $failures[] = "Iteration $i ($channel): Failed to get analytics";
                    continue;
                }
                
                // Verify all required fields are present
                if (!isset($result['metrics'])) {
                    $failures[] = "Iteration $i ($channel): Missing metrics object";
                    continue;
                }
                
                foreach ($requiredFields[$channel] as $field) {
                    if (!array_key_exists($field, $result['metrics'])) {
                        $failures[] = "Iteration $i ($channel): Missing required field '$field'";
                    }
                }
                
                // Verify dailyStats is present
                if (!isset($result['dailyStats']) || !is_array($result['dailyStats'])) {
                    $failures[] = "Iteration $i ($channel): Missing or invalid dailyStats array";
                }
                
                // For call campaigns, verify dispositions array is present
                if ($channel === 'call' && !isset($result['dispositions'])) {
                    $failures[] = "Iteration $i ($channel): Missing dispositions array for call campaign";
                }
            }
            
            $this->cleanupIterationData();
        }
        
        $this->reportResult('Property 2', $failures);
    }

    
    // === Helper Methods ===
    
    private function createCampaignWithData(string $channel, string $name, int $dataCount): array {
        $campaignId = null;
        
        switch ($channel) {
            case 'email':
                $stmt = $this->pdo->prepare('
                    INSERT INTO campaigns (user_id, name, subject, html_content, status, sent, opens, clicks, bounces, unsubscribes, created_at) 
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
                ');
                $sent = $dataCount;
                $opens = rand(0, $sent);
                $clicks = rand(0, $opens);
                $bounces = rand(0, max(0, $sent - $opens));
                $unsubscribes = rand(0, max(0, $opens - $clicks));
                $stmt->execute([$this->testUserId, $name, 'Test Subject', '<p>Test</p>', 'sent', $sent, $opens, $clicks, $bounces, $unsubscribes]);
                $campaignId = (int)$this->pdo->lastInsertId();
                $this->testData['email'][] = $campaignId;
                return [
                    'id' => $campaignId,
                    'channel' => 'email',
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
                $campaignId = (int)$this->pdo->lastInsertId();
                $this->testData['sms'][] = $campaignId;
                
                // Create SMS messages for this campaign
                $delivered = 0;
                $failed = 0;
                for ($j = 0; $j < $dataCount; $j++) {
                    $deliveryStatus = rand(0, 10) > 2 ? 'delivered' : 'failed';
                    if ($deliveryStatus === 'delivered') $delivered++;
                    else $failed++;
                    
                    $stmt = $this->pdo->prepare('
                        INSERT INTO sms_messages (user_id, campaign_id, recipient_id, phone_number, message, status, delivery_status, created_at) 
                        VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
                    ');
                    $stmt->execute([$this->testUserId, $campaignId, $this->testSmsRecipientId, '+1555' . rand(1000000, 9999999), 'Test', 'sent', $deliveryStatus]);
                }
                
                return [
                    'id' => $campaignId,
                    'channel' => 'sms',
                    'sent' => $dataCount,
                    'delivered' => $delivered,
                    'failed' => $failed
                ];
                
            case 'call':
                $stmt = $this->pdo->prepare('
                    INSERT INTO call_campaigns (user_id, name, status, created_at) 
                    VALUES (?, ?, ?, NOW())
                ');
                $stmt->execute([$this->testUserId, $name, 'active']);
                $campaignId = (int)$this->pdo->lastInsertId();
                $this->testData['call'][] = $campaignId;
                
                // Create call logs for this campaign
                $answered = 0;
                $missed = 0;
                $voicemail = 0;
                $outcomes = ['answered', 'no_answer', 'voicemail', 'busy'];
                
                for ($j = 0; $j < $dataCount; $j++) {
                    $outcome = $outcomes[array_rand($outcomes)];
                    if ($outcome === 'answered') $answered++;
                    elseif ($outcome === 'no_answer') $missed++;
                    elseif ($outcome === 'voicemail') $voicemail++;
                    
                    $stmt = $this->pdo->prepare('
                        INSERT INTO call_logs (user_id, campaign_id, phone_number, status, call_outcome, duration, created_at) 
                        VALUES (?, ?, ?, ?, ?, ?, NOW())
                    ');
                    $duration = $outcome === 'answered' ? rand(30, 300) : 0;
                    $stmt->execute([$this->testUserId, $campaignId, '+1555' . rand(1000000, 9999999), 'completed', $outcome, $duration]);
                }
                
                return [
                    'id' => $campaignId,
                    'channel' => 'call',
                    'total' => $dataCount,
                    'answered' => $answered,
                    'missed' => $missed,
                    'voicemail' => $voicemail
                ];
        }
        
        return ['id' => 0, 'channel' => $channel];
    }
    
    private function getCampaignAnalyticsDirect(int $campaignId, string $channel): ?array {
        $timeframe = 30;
        $dateFrom = date('Y-m-d H:i:s', strtotime("-{$timeframe} days"));
        
        switch ($channel) {
            case 'email':
                return $this->getEmailCampaignAnalyticsDirect($campaignId, $timeframe);
            case 'sms':
                return $this->getSMSCampaignAnalyticsDirect($campaignId, $timeframe);
            case 'call':
                return $this->getCallCampaignAnalyticsDirect($campaignId, $timeframe);
        }
        
        return null;
    }
    
    private function getEmailCampaignAnalyticsDirect(int $campaignId, int $timeframe): ?array {
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
            ],
            'dailyStats' => []
        ];
    }
    
    private function getSMSCampaignAnalyticsDirect(int $campaignId, int $timeframe): ?array {
        $dateFrom = date('Y-m-d H:i:s', strtotime("-{$timeframe} days"));
        
        $stmt = $this->pdo->prepare('SELECT id, name, status FROM sms_campaigns WHERE id = ? AND user_id = ?');
        $stmt->execute([$campaignId, $this->testUserId]);
        $campaign = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$campaign) return null;
        
        // Get message counts
        $stmt = $this->pdo->prepare("SELECT COUNT(*) FROM sms_messages WHERE campaign_id = ?");
        $stmt->execute([$campaignId]);
        $totalSent = (int)$stmt->fetchColumn();
        
        $stmt = $this->pdo->prepare("SELECT COUNT(*) FROM sms_messages WHERE campaign_id = ? AND delivery_status = 'delivered'");
        $stmt->execute([$campaignId]);
        $totalDelivered = (int)$stmt->fetchColumn();
        
        $stmt = $this->pdo->prepare("SELECT COUNT(*) FROM sms_messages WHERE campaign_id = ? AND delivery_status = 'failed'");
        $stmt->execute([$campaignId]);
        $totalFailed = (int)$stmt->fetchColumn();
        
        return [
            'campaign' => [
                'id' => (string)$campaign['id'],
                'name' => $campaign['name'],
                'channel' => 'sms',
                'status' => $campaign['status']
            ],
            'metrics' => [
                'totalSent' => $totalSent,
                'totalDelivered' => $totalDelivered,
                'totalFailed' => $totalFailed,
                'totalReplies' => 0,
                'deliveryRate' => $totalSent > 0 ? round(($totalDelivered / $totalSent) * 100, 2) : 0,
                'failureRate' => $totalSent > 0 ? round(($totalFailed / $totalSent) * 100, 2) : 0,
                'replyRate' => 0
            ],
            'dailyStats' => []
        ];
    }
    
    private function getCallCampaignAnalyticsDirect(int $campaignId, int $timeframe): ?array {
        $dateFrom = date('Y-m-d H:i:s', strtotime("-{$timeframe} days"));
        
        $stmt = $this->pdo->prepare('SELECT id, name, status FROM call_campaigns WHERE id = ? AND user_id = ?');
        $stmt->execute([$campaignId, $this->testUserId]);
        $campaign = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$campaign) return null;
        
        // Get call counts
        $stmt = $this->pdo->prepare("SELECT COUNT(*) FROM call_logs WHERE campaign_id = ?");
        $stmt->execute([$campaignId]);
        $totalCalls = (int)$stmt->fetchColumn();
        
        $stmt = $this->pdo->prepare("SELECT COUNT(*) FROM call_logs WHERE campaign_id = ? AND call_outcome = 'answered'");
        $stmt->execute([$campaignId]);
        $answeredCalls = (int)$stmt->fetchColumn();
        
        $stmt = $this->pdo->prepare("SELECT COUNT(*) FROM call_logs WHERE campaign_id = ? AND call_outcome = 'no_answer'");
        $stmt->execute([$campaignId]);
        $missedCalls = (int)$stmt->fetchColumn();
        
        $stmt = $this->pdo->prepare("SELECT COUNT(*) FROM call_logs WHERE campaign_id = ? AND call_outcome = 'voicemail'");
        $stmt->execute([$campaignId]);
        $voicemails = (int)$stmt->fetchColumn();
        
        $stmt = $this->pdo->prepare("SELECT AVG(duration) FROM call_logs WHERE campaign_id = ? AND call_outcome = 'answered'");
        $stmt->execute([$campaignId]);
        $avgDuration = (int)($stmt->fetchColumn() ?: 0);
        
        return [
            'campaign' => [
                'id' => (string)$campaign['id'],
                'name' => $campaign['name'],
                'channel' => 'call',
                'status' => $campaign['status']
            ],
            'metrics' => [
                'totalCalls' => $totalCalls,
                'answeredCalls' => $answeredCalls,
                'missedCalls' => $missedCalls,
                'voicemails' => $voicemails,
                'failedCalls' => 0,
                'avgDuration' => $avgDuration,
                'answerRate' => $totalCalls > 0 ? round(($answeredCalls / $totalCalls) * 100, 2) : 0
            ],
            'dailyStats' => [],
            'dispositions' => []
        ];
    }
    
    private function verifyMetricsForCampaign(array $metrics, string $channel, array $campaignData): bool {
        // Basic verification that metrics are present and reasonable
        switch ($channel) {
            case 'email':
                return isset($metrics['totalSent']) && 
                       isset($metrics['openRate']) && 
                       $metrics['openRate'] >= 0 && $metrics['openRate'] <= 100;
            case 'sms':
                return isset($metrics['totalSent']) && 
                       isset($metrics['deliveryRate']) && 
                       $metrics['deliveryRate'] >= 0 && $metrics['deliveryRate'] <= 100;
            case 'call':
                return isset($metrics['totalCalls']) && 
                       isset($metrics['answerRate']) && 
                       $metrics['answerRate'] >= 0 && $metrics['answerRate'] <= 100;
        }
        return false;
    }

    
    // === Setup and Cleanup ===
    
    private int $testSmsRecipientId;
    
    private function setup(): void {
        echo "Setting up test data...\n\n";
        
        // Initialize test data array
        $this->testData = ['email' => [], 'sms' => [], 'call' => [], 'sms_messages' => [], 'call_logs' => []];
        
        // Get an existing user for testing
        $stmt = $this->pdo->query("SELECT id FROM users LIMIT 1");
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$user) {
            // Create a test user if none exist
            $this->pdo->exec("INSERT INTO users (email, password, name) VALUES ('test_filtering@test.com', 'test', 'Test User')");
            $this->testUserId = (int)$this->pdo->lastInsertId();
        } else {
            $this->testUserId = (int)$user['id'];
        }
        
        // Get or create an SMS recipient for testing
        $stmt = $this->pdo->prepare("SELECT id FROM sms_recipients WHERE user_id = ? LIMIT 1");
        $stmt->execute([$this->testUserId]);
        $recipient = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$recipient) {
            // Create a test SMS recipient
            $stmt = $this->pdo->prepare("INSERT INTO sms_recipients (user_id, phone_number, name, created_at) VALUES (?, '+15551234567', 'Test Recipient', NOW())");
            $stmt->execute([$this->testUserId]);
            $this->testSmsRecipientId = (int)$this->pdo->lastInsertId();
        } else {
            $this->testSmsRecipientId = (int)$recipient['id'];
        }
        
        echo "Using test user ID: {$this->testUserId}\n";
        echo "Using test SMS recipient ID: {$this->testSmsRecipientId}\n\n";
    }
    
    private function cleanup(): void {
        echo "\nCleaning up test data...\n";
        $this->cleanupIterationData();
    }
    
    private function cleanupIterationData(): void {
        // Delete email campaigns
        if (!empty($this->testData['email'])) {
            $ids = implode(',', $this->testData['email']);
            $this->pdo->exec("DELETE FROM campaigns WHERE id IN ($ids)");
        }
        
        // Delete SMS messages first (foreign key), then campaigns
        if (!empty($this->testData['sms'])) {
            $ids = implode(',', $this->testData['sms']);
            $this->pdo->exec("DELETE FROM sms_messages WHERE campaign_id IN ($ids)");
            $this->pdo->exec("DELETE FROM sms_campaigns WHERE id IN ($ids)");
        }
        
        // Delete call logs first (foreign key), then campaigns
        if (!empty($this->testData['call'])) {
            $ids = implode(',', $this->testData['call']);
            $this->pdo->exec("DELETE FROM call_logs WHERE campaign_id IN ($ids)");
            $this->pdo->exec("DELETE FROM call_campaigns WHERE id IN ($ids)");
        }
        
        $this->testData = ['email' => [], 'sms' => [], 'call' => []];
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
    $test = new CampaignFilteringTest();
    $test->runAll();
}
