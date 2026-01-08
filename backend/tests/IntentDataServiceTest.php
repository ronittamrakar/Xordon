<?php
/**
 * Property-Based Tests for IntentDataService
 * 
 * **Feature: crm-enhancements, Property 14: Intent Signal Contact Matching**
 * **Feature: crm-enhancements, Property 15: Intent Signal Display Completeness**
 * **Feature: crm-enhancements, Property 16: High Intent Trigger Availability**
 * **Feature: crm-enhancements, Property 17: Intent Signal Staleness**
 */

require_once __DIR__ . '/../src/Database.php';
require_once __DIR__ . '/../src/services/IntentDataService.php';

class IntentDataServiceTest {
    private $db;
    private $service;
    private $testUserId;
    private $testContactIds = [];
    
    public function __construct() {
        $this->db = Database::conn();
        $this->service = new IntentDataService();
    }
    
    public function setUp(): void {
        // Create test user
        $stmt = $this->db->prepare("SELECT id FROM users WHERE email = 'intent_test@test.com'");
        $stmt->execute();
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($user) {
            $this->testUserId = $user['id'];
        } else {
            $stmt = $this->db->prepare("
                INSERT INTO users (email, password_hash, name, created_at) 
                VALUES ('intent_test@test.com', 'test', 'Intent Test User', NOW())
            ");
            $stmt->execute();
            $this->testUserId = (int) $this->db->lastInsertId();
        }
        
        // Create test contacts with various domains and companies
        $testData = [
            ['email' => 'john@acme.com', 'company' => 'Acme Corp'],
            ['email' => 'jane@techstart.io', 'company' => 'TechStart Inc'],
            ['email' => 'bob@enterprise.net', 'company' => 'Enterprise Solutions'],
            ['email' => 'alice@startup.co', 'company' => 'Startup Labs'],
            ['email' => 'charlie@bigcorp.com', 'company' => 'BigCorp International']
        ];
        
        foreach ($testData as $i => $data) {
            $email = str_replace('@', "_" . time() . "@", $data['email']);
            $stmt = $this->db->prepare("
                INSERT INTO contacts (email, name, company, user_id, created_at) 
                VALUES (?, ?, ?, ?, NOW())
            ");
            $stmt->execute([$email, "Test Contact {$i}", $data['company'], $this->testUserId]);
            $this->testContactIds[] = (int) $this->db->lastInsertId();
        }
    }
    
    public function tearDown(): void {
        foreach ($this->testContactIds as $contactId) {
            $this->db->prepare("DELETE FROM intent_signals WHERE contact_id = ?")->execute([$contactId]);
            $this->db->prepare("DELETE FROM contacts WHERE id = ?")->execute([$contactId]);
        }
    }
    
    /**
     * Property 14: Intent Signal Contact Matching
     * **Validates: Requirements 5.1**
     * 
     * For any intent signal with email domain or company name, the system SHALL 
     * match to contacts with matching email domain or company name.
     */
    public function testProperty14_IntentSignalContactMatching(): array {
        $results = ['passed' => 0, 'failed' => 0, 'errors' => []];
        $iterations = 50;
        
        echo "Property 14: Intent Signal Contact Matching\n";
        echo "  **Validates: Requirements 5.1**\n";
        
        for ($i = 0; $i < $iterations; $i++) {
            try {
                // Get a random test contact
                $contactId = $this->testContactIds[array_rand($this->testContactIds)];
                $stmt = $this->db->prepare("SELECT email, company FROM contacts WHERE id = ?");
                $stmt->execute([$contactId]);
                $contact = $stmt->fetch(PDO::FETCH_ASSOC);
                
                // Extract domain from email
                $emailParts = explode('@', $contact['email']);
                $domain = $emailParts[1] ?? null;
                
                // Test email domain matching
                if ($domain) {
                    $match = $this->service->matchToContact($domain, null);
                    
                    if (!$match) {
                        throw new Exception("Email domain match failed for domain: {$domain}");
                    }
                    
                    if ($match['match_type'] !== 'email_domain') {
                        throw new Exception("Match type should be 'email_domain'");
                    }
                    
                    if ($match['confidence'] < 0.8) {
                        throw new Exception("Email domain match confidence should be >= 0.8");
                    }
                }
                
                // Test company name matching
                if ($contact['company']) {
                    $match = $this->service->matchToContact(null, $contact['company']);
                    
                    if (!$match) {
                        throw new Exception("Company name match failed for: {$contact['company']}");
                    }
                    
                    if ($match['match_type'] !== 'company_name') {
                        throw new Exception("Match type should be 'company_name'");
                    }
                }
                
                // Test ingestion with matching
                $signals = [[
                    'topic' => 'Test Topic ' . $i,
                    'strength' => ['low', 'medium', 'high'][array_rand(['low', 'medium', 'high'])],
                    'source' => 'test_provider',
                    'email_domain' => $domain,
                    'company_name' => $contact['company'],
                    'detected_at' => date('Y-m-d H:i:s')
                ]];
                
                $ingested = $this->service->ingestIntentData($signals);
                
                if ($ingested !== 1) {
                    throw new Exception("Signal should be ingested");
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
     * Property 15: Intent Signal Display Completeness
     * **Validates: Requirements 5.2**
     * 
     * For any contact with active intent signals, the profile SHALL display 
     * topic, strength, and detection date for each signal.
     */
    public function testProperty15_IntentSignalDisplayCompleteness(): array {
        $results = ['passed' => 0, 'failed' => 0, 'errors' => []];
        $iterations = 50;
        
        echo "Property 15: Intent Signal Display Completeness\n";
        echo "  **Validates: Requirements 5.2**\n";
        
        for ($i = 0; $i < $iterations; $i++) {
            try {
                $contactId = $this->testContactIds[array_rand($this->testContactIds)];
                
                // Create intent signal directly
                $topic = "Research Topic {$i}";
                $strength = ['low', 'medium', 'high'][array_rand(['low', 'medium', 'high'])];
                $detectedAt = date('Y-m-d H:i:s', strtotime('-' . rand(1, 20) . ' days'));
                
                $stmt = $this->db->prepare("
                    INSERT INTO intent_signals 
                    (contact_id, topic, strength, source, detected_at, is_stale, created_at)
                    VALUES (?, ?, ?, 'test', ?, FALSE, NOW())
                ");
                $stmt->execute([$contactId, $topic, $strength, $detectedAt]);
                
                // Get signals for contact
                $signals = $this->service->getContactIntentSignals($contactId);
                
                if (empty($signals)) {
                    throw new Exception("No signals returned for contact with signals");
                }
                
                // Find our signal
                $found = false;
                foreach ($signals as $signal) {
                    if ($signal['topic'] === $topic) {
                        $found = true;
                        
                        // Verify required fields are present
                        if (!isset($signal['topic']) || empty($signal['topic'])) {
                            throw new Exception("Signal missing topic");
                        }
                        
                        if (!isset($signal['strength']) || empty($signal['strength'])) {
                            throw new Exception("Signal missing strength");
                        }
                        
                        if (!isset($signal['detected_at']) || empty($signal['detected_at'])) {
                            throw new Exception("Signal missing detected_at");
                        }
                        
                        // Verify strength is valid
                        if (!in_array($signal['strength'], ['low', 'medium', 'high'])) {
                            throw new Exception("Invalid strength value: {$signal['strength']}");
                        }
                        
                        break;
                    }
                }
                
                if (!$found) {
                    throw new Exception("Created signal not found in results");
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
     * Property 16: High Intent Trigger Availability
     * **Validates: Requirements 5.3**
     * 
     * For any intent signal with strength='high', the signal SHALL be 
     * available as an automation trigger condition.
     */
    public function testProperty16_HighIntentTriggerAvailability(): array {
        $results = ['passed' => 0, 'failed' => 0, 'errors' => []];
        $iterations = 30;
        
        echo "Property 16: High Intent Trigger Availability\n";
        echo "  **Validates: Requirements 5.3**\n";
        
        for ($i = 0; $i < $iterations; $i++) {
            try {
                $contactId = $this->testContactIds[array_rand($this->testContactIds)];
                
                // Create high-strength intent signal
                $topic = "High Intent Topic {$i}";
                $detectedAt = date('Y-m-d H:i:s', strtotime('-' . rand(1, 10) . ' days'));
                
                $stmt = $this->db->prepare("
                    INSERT INTO intent_signals 
                    (contact_id, topic, strength, source, detected_at, is_stale, created_at)
                    VALUES (?, ?, 'high', 'test', ?, FALSE, NOW())
                ");
                $stmt->execute([$contactId, $topic, $detectedAt]);
                $signalId = (int) $this->db->lastInsertId();
                
                // Get high intent signals (for automation triggers)
                $highIntentSignals = $this->service->getHighIntentSignals();
                
                // Find our signal
                $found = false;
                foreach ($highIntentSignals as $signal) {
                    if ((int)$signal['id'] === $signalId) {
                        $found = true;
                        
                        // Verify it has contact association
                        if ((int)$signal['contact_id'] !== $contactId) {
                            throw new Exception("Signal contact_id mismatch");
                        }
                        
                        // Verify strength is high
                        if ($signal['strength'] !== 'high') {
                            throw new Exception("Signal strength should be 'high'");
                        }
                        
                        // Verify not stale
                        if ($signal['is_stale']) {
                            throw new Exception("High intent signal should not be stale");
                        }
                        
                        break;
                    }
                }
                
                if (!$found) {
                    throw new Exception("High intent signal not available for automation triggers");
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
     * Property 17: Intent Signal Staleness
     * **Validates: Requirements 5.4**
     * 
     * For any intent signal where (current_date - detected_at) > 30 days, 
     * the signal SHALL be marked as stale AND excluded from automation triggers.
     */
    public function testProperty17_IntentSignalStaleness(): array {
        $results = ['passed' => 0, 'failed' => 0, 'errors' => []];
        $iterations = 30;
        
        echo "Property 17: Intent Signal Staleness\n";
        echo "  **Validates: Requirements 5.4**\n";
        
        for ($i = 0; $i < $iterations; $i++) {
            try {
                $contactId = $this->testContactIds[array_rand($this->testContactIds)];
                
                // Create old signal (> 30 days)
                $oldDetectedAt = date('Y-m-d H:i:s', strtotime('-' . (31 + rand(1, 30)) . ' days'));
                
                $stmt = $this->db->prepare("
                    INSERT INTO intent_signals 
                    (contact_id, topic, strength, source, detected_at, is_stale, created_at)
                    VALUES (?, ?, 'high', 'test', ?, FALSE, NOW())
                ");
                $stmt->execute([$contactId, "Old Topic {$i}", $oldDetectedAt]);
                $oldSignalId = (int) $this->db->lastInsertId();
                
                // Create recent signal (< 30 days)
                $recentDetectedAt = date('Y-m-d H:i:s', strtotime('-' . rand(1, 20) . ' days'));
                
                $stmt->execute([$contactId, "Recent Topic {$i}", $recentDetectedAt]);
                $recentSignalId = (int) $this->db->lastInsertId();
                
                // Test staleness check
                if (!$this->service->isSignalStale($oldDetectedAt)) {
                    throw new Exception("Signal from > 30 days ago should be stale");
                }
                
                if ($this->service->isSignalStale($recentDetectedAt)) {
                    throw new Exception("Signal from < 30 days ago should not be stale");
                }
                
                // Mark stale signals
                $this->service->markStaleSignals();
                
                // Verify old signal is now marked stale
                $stmt = $this->db->prepare("SELECT is_stale FROM intent_signals WHERE id = ?");
                $stmt->execute([$oldSignalId]);
                $oldSignal = $stmt->fetch(PDO::FETCH_ASSOC);
                
                if (!$oldSignal['is_stale']) {
                    throw new Exception("Old signal should be marked as stale");
                }
                
                // Verify recent signal is not stale
                $stmt->execute([$recentSignalId]);
                $recentSignal = $stmt->fetch(PDO::FETCH_ASSOC);
                
                if ($recentSignal['is_stale']) {
                    throw new Exception("Recent signal should not be marked as stale");
                }
                
                // Verify stale signals excluded from high intent triggers
                $highIntentSignals = $this->service->getHighIntentSignals();
                foreach ($highIntentSignals as $signal) {
                    if ((int)$signal['id'] === $oldSignalId) {
                        throw new Exception("Stale signal should be excluded from automation triggers");
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
     * Run all property tests
     */
    public function runAllTests(): array {
        echo "=== IntentDataService Property Tests ===\n\n";
        
        $this->setUp();
        
        $allResults = [
            'property14' => $this->testProperty14_IntentSignalContactMatching(),
            'property15' => $this->testProperty15_IntentSignalDisplayCompleteness(),
            'property16' => $this->testProperty16_HighIntentTriggerAvailability(),
            'property17' => $this->testProperty17_IntentSignalStaleness()
        ];
        
        $this->tearDown();
        
        // Summary
        $totalPassed = array_sum(array_column($allResults, 'passed'));
        $totalFailed = array_sum(array_column($allResults, 'failed'));
        
        echo "=== Test Summary ===\n";
        echo "Total Passed: {$totalPassed}\n";
        echo "Total Failed: {$totalFailed}\n";
        
        return $allResults;
    }
}

// Run tests if executed directly
if (php_sapi_name() === 'cli' && basename(__FILE__) === basename($_SERVER['SCRIPT_FILENAME'])) {
    $test = new IntentDataServiceTest();
    $results = $test->runAllTests();
    exit(array_sum(array_column($results, 'failed')) > 0 ? 1 : 0);
}
