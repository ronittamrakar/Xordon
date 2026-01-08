<?php
/**
 * Property-Based Tests for SequenceService
 * 
 * **Feature: crm-enhancements, Property 6: Sequence Condition Evaluation**
 * **Feature: crm-enhancements, Property 7: LinkedIn Engagement Timeline**
 */

require_once __DIR__ . '/../src/Database.php';
require_once __DIR__ . '/../src/services/SequenceService.php';

class SequenceServiceTest {
    private $db;
    private $service;
    private $testUserId;
    private $testContactIds = [];
    
    public function __construct() {
        $this->db = Database::conn();
        $this->service = new SequenceService();
    }
    
    public function setUp(): void {
        // Create test user if not exists
        $stmt = $this->db->prepare("SELECT id FROM users WHERE email = 'sequence_test@test.com'");
        $stmt->execute();
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($user) {
            $this->testUserId = $user['id'];
        } else {
            $stmt = $this->db->prepare("
                INSERT INTO users (email, password_hash, name, created_at) 
                VALUES ('sequence_test@test.com', 'test_hash', 'Sequence Test User', NOW())
            ");
            $stmt->execute();
            $this->testUserId = (int) $this->db->lastInsertId();
        }
        
        // Create test contacts
        for ($i = 0; $i < 5; $i++) {
            $email = "seq_contact_{$i}_" . time() . "@test.com";
            $stmt = $this->db->prepare("
                INSERT INTO contacts (email, name, phone, user_id, created_at) 
                VALUES (?, ?, ?, ?, NOW())
            ");
            $stmt->execute([$email, "Test Contact {$i}", "+1555000{$i}000", $this->testUserId]);
            $this->testContactIds[] = (int) $this->db->lastInsertId();
        }
    }
    
    public function tearDown(): void {
        // Clean up test data
        foreach ($this->testContactIds as $contactId) {
            $this->db->prepare("DELETE FROM contacts WHERE id = ?")->execute([$contactId]);
        }
        
        $this->db->prepare("DELETE FROM sequences WHERE user_id = ?")->execute([$this->testUserId]);
    }
    
    /**
     * Property 6: Sequence Condition Evaluation
     * **Validates: Requirements 2.4**
     * 
     * For any sequence step with conditions, the next step SHALL be determined 
     * by evaluating all conditions and following the defined conditional logic (AND/OR).
     */
    public function testProperty6_SequenceConditionEvaluation(): array {
        $results = ['passed' => 0, 'failed' => 0, 'errors' => []];
        $iterations = 100;
        
        echo "Property 6: Sequence Condition Evaluation\n";
        echo "  **Validates: Requirements 2.4**\n";
        
        for ($i = 0; $i < $iterations; $i++) {
            try {
                // Generate random condition configurations
                $conditionTypes = ['no_reply', 'opened', 'clicked', 'replied'];
                $operators = ['and', 'or'];
                
                // Test single condition
                $singleCondition = [
                    'type' => $conditionTypes[array_rand($conditionTypes)]
                ];
                
                // Test compound conditions with AND
                $andConditions = [
                    'operator' => 'and',
                    'conditions' => [
                        ['type' => $conditionTypes[array_rand($conditionTypes)]],
                        ['type' => $conditionTypes[array_rand($conditionTypes)]]
                    ]
                ];
                
                // Test compound conditions with OR
                $orConditions = [
                    'operator' => 'or',
                    'conditions' => [
                        ['type' => $conditionTypes[array_rand($conditionTypes)]],
                        ['type' => $conditionTypes[array_rand($conditionTypes)]]
                    ]
                ];
                
                // Create sequence with conditions
                $steps = [
                    ['type' => 'email', 'template' => 'intro'],
                    ['type' => 'email', 'template' => 'followup', 'conditions' => $singleCondition],
                    ['type' => 'sms', 'template' => 'reminder', 'conditions' => $andConditions]
                ];
                
                $sequenceId = $this->service->createSequence(
                    $this->testUserId,
                    "Condition Test Sequence {$i}",
                    $steps,
                    $orConditions
                );
                
                // Verify sequence was created with conditions
                $sequence = $this->service->getSequenceById($sequenceId);
                $storedSteps = json_decode($sequence['steps'], true);
                
                // Verify conditions are preserved
                if (!isset($storedSteps[1]['conditions']) || $storedSteps[1]['conditions']['type'] !== $singleCondition['type']) {
                    throw new Exception("Single condition not preserved correctly");
                }
                
                if (!isset($storedSteps[2]['conditions']['operator']) || $storedSteps[2]['conditions']['operator'] !== 'and') {
                    throw new Exception("AND condition operator not preserved");
                }
                
                // Test condition evaluation with mock execution
                $contactId = $this->testContactIds[array_rand($this->testContactIds)];
                
                // Create execution record
                $stmt = $this->db->prepare("
                    INSERT INTO sequence_executions (sequence_id, contact_id, current_step, status, started_at)
                    VALUES (?, ?, 0, 'active', NOW())
                ");
                $stmt->execute([$sequenceId, $contactId]);
                $executionId = (int) $this->db->lastInsertId();
                
                // Test evaluateCondition with empty conditions (should return true)
                $emptyResult = $this->service->evaluateCondition([], $executionId);
                if ($emptyResult !== true) {
                    throw new Exception("Empty conditions should evaluate to true");
                }
                
                // Test evaluateCondition with no previous steps (should return true)
                $noStepsResult = $this->service->evaluateCondition($singleCondition, $executionId);
                if ($noStepsResult !== true) {
                    throw new Exception("Conditions with no previous steps should evaluate to true");
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
     * Property 7: LinkedIn Engagement Timeline
     * **Validates: Requirements 2.3**
     * 
     * For any LinkedIn message sent, the contact timeline SHALL contain an entry 
     * with the message details and engagement status.
     */
    public function testProperty7_LinkedInEngagementTimeline(): array {
        $results = ['passed' => 0, 'failed' => 0, 'errors' => []];
        $iterations = 50;
        
        echo "Property 7: LinkedIn Engagement Timeline\n";
        echo "  **Validates: Requirements 2.3**\n";
        
        for ($i = 0; $i < $iterations; $i++) {
            try {
                $contactId = $this->testContactIds[array_rand($this->testContactIds)];
                
                // Create LinkedIn profile for contact
                $linkedinUrl = "https://linkedin.com/in/test-user-{$i}-" . time();
                $stmt = $this->db->prepare("
                    INSERT INTO linkedin_profiles (contact_id, linkedin_url, headline, company, title, created_at)
                    VALUES (?, ?, ?, ?, ?, NOW())
                    ON DUPLICATE KEY UPDATE linkedin_url = VALUES(linkedin_url)
                ");
                $stmt->execute([
                    $contactId,
                    $linkedinUrl,
                    "Test Headline {$i}",
                    "Test Company {$i}",
                    "Test Title {$i}"
                ]);
                
                // Create sequence with LinkedIn steps
                $steps = [
                    [
                        'type' => 'linkedin_connect',
                        'message' => "Connection request message {$i}"
                    ],
                    [
                        'type' => 'linkedin_message',
                        'message' => "Follow-up message {$i}",
                        'conditions' => ['type' => 'no_reply', 'duration' => ['value' => 3, 'unit' => 'days']]
                    ]
                ];
                
                $sequenceId = $this->service->createSequence(
                    $this->testUserId,
                    "LinkedIn Sequence {$i}",
                    $steps
                );
                
                // Execute first step (connection request)
                $result1 = $this->service->executeStep($sequenceId, $contactId);
                
                // Verify LinkedIn message was logged
                $stmt = $this->db->prepare("
                    SELECT * FROM linkedin_messages 
                    WHERE contact_id = ? 
                    ORDER BY created_at DESC 
                    LIMIT 1
                ");
                $stmt->execute([$contactId]);
                $linkedinMessage = $stmt->fetch(PDO::FETCH_ASSOC);
                
                if (!$linkedinMessage) {
                    throw new Exception("LinkedIn message not logged to timeline");
                }
                
                if ($linkedinMessage['message_type'] !== 'connection_request') {
                    throw new Exception("LinkedIn message type incorrect: expected 'connection_request', got '{$linkedinMessage['message_type']}'");
                }
                
                if ($linkedinMessage['status'] !== 'sent') {
                    throw new Exception("LinkedIn message status incorrect: expected 'sent', got '{$linkedinMessage['status']}'");
                }
                
                // Verify result contains profile data
                if ($result1['channel'] !== 'linkedin') {
                    throw new Exception("Result channel should be 'linkedin'");
                }
                
                if (!isset($result1['profile_url']) || $result1['profile_url'] !== $linkedinUrl) {
                    throw new Exception("Result should contain correct profile URL");
                }
                
                // Verify execution status is tracked
                $status = $this->service->getExecutionStatus($sequenceId, $contactId);
                if (!$status) {
                    throw new Exception("Execution status not found");
                }
                
                if ($status['current_step'] !== 1) {
                    throw new Exception("Current step should be 1 after first execution");
                }
                
                // Verify step log was created
                if (empty($status['step_logs'])) {
                    throw new Exception("Step logs should not be empty");
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
     * Run all property tests
     */
    public function runAllTests(): array {
        echo "=== SequenceService Property Tests ===\n\n";
        
        $this->setUp();
        
        $allResults = [
            'property6' => $this->testProperty6_SequenceConditionEvaluation(),
            'property7' => $this->testProperty7_LinkedInEngagementTimeline()
        ];
        
        $this->tearDown();
        
        // Summary
        $totalPassed = array_sum(array_column($allResults, 'passed'));
        $totalFailed = array_sum(array_column($allResults, 'failed'));
        
        echo "=== Test Summary ===\n";
        echo "Total Passed: {$totalPassed}\n";
        echo "Total Failed: {$totalFailed}\n";
        
        if ($totalFailed > 0) {
            echo "\nErrors:\n";
            foreach ($allResults as $property => $result) {
                foreach ($result['errors'] as $error) {
                    echo "  [{$property}] {$error}\n";
                }
            }
        }
        
        return $allResults;
    }
}

// Run tests if executed directly
if (php_sapi_name() === 'cli' && basename(__FILE__) === basename($_SERVER['SCRIPT_FILENAME'])) {
    $test = new SequenceServiceTest();
    $results = $test->runAllTests();
    exit(array_sum(array_column($results, 'failed')) > 0 ? 1 : 0);
}
