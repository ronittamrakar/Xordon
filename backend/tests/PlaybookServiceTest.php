<?php
/**
 * Property-Based Tests for PlaybookService
 * 
 * **Feature: crm-enhancements, Property 21: Playbook Validation**
 * **Feature: crm-enhancements, Property 22: Playbook RBAC Enforcement**
 * **Feature: crm-enhancements, Property 23: Playbook Version History**
 */

require_once __DIR__ . '/../src/Database.php';
require_once __DIR__ . '/../src/services/PlaybookService.php';

class PlaybookServiceTest {
    private $db;
    private $service;
    private $testUserIds = [];
    private $testPlaybookIds = [];
    
    public function __construct() {
        $this->db = Database::conn();
        $this->service = new PlaybookService();
    }
    
    public function setUp(): void {
        // Create test users
        for ($i = 0; $i < 3; $i++) {
            $email = "playbook_test_{$i}_" . time() . "@test.com";
            $stmt = $this->db->prepare("
                INSERT INTO users (email, password, name, created_at) 
                VALUES (?, 'test', ?, NOW())
            ");
            $stmt->execute([$email, "Playbook Test User {$i}"]);
            $this->testUserIds[] = (int) $this->db->lastInsertId();
        }
    }
    
    public function tearDown(): void {
        foreach ($this->testPlaybookIds as $id) {
            $this->db->prepare("DELETE FROM playbook_versions WHERE playbook_id = ?")->execute([$id]);
            $this->db->prepare("DELETE FROM playbooks WHERE id = ?")->execute([$id]);
        }
        
        foreach ($this->testUserIds as $id) {
            $this->db->prepare("DELETE FROM users WHERE id = ?")->execute([$id]);
        }
    }
    
    /**
     * Property 21: Playbook Validation
     * **Validates: Requirements 7.2**
     * 
     * For any playbook creation/update, the templates SHALL be validated for:
     * (1) valid channel types, (2) content length limits, (3) required fields.
     */
    public function testProperty21_PlaybookValidation(): array {
        $results = ['passed' => 0, 'failed' => 0, 'errors' => []];
        $iterations = 30;
        
        echo "Property 21: Playbook Validation\n";
        echo "  **Validates: Requirements 7.2**\n";
        
        for ($i = 0; $i < $iterations; $i++) {
            try {
                $userId = $this->testUserIds[0];
                
                // Test valid templates
                $validTemplates = [
                    'email' => ['subject' => 'Test Subject', 'body' => 'Test body content'],
                    'sms' => ['body' => 'Short SMS message'],
                    'call' => ['script' => 'Call script content'],
                    'linkedin' => ['message' => 'LinkedIn message']
                ];
                
                $playbookId = $this->service->createPlaybook($userId, [
                    'name' => "Valid Playbook {$i}",
                    'templates' => $validTemplates
                ]);
                $this->testPlaybookIds[] = $playbookId;
                
                // Verify playbook was created
                $playbook = $this->service->getPlaybookById($playbookId);
                if (!$playbook) {
                    throw new Exception("Valid playbook should be created");
                }
                
                // Test invalid channel
                $invalidChannel = false;
                try {
                    $this->service->validateTemplates(['invalid_channel' => ['body' => 'test']]);
                } catch (InvalidArgumentException $e) {
                    $invalidChannel = true;
                }
                
                if (!$invalidChannel) {
                    throw new Exception("Invalid channel should be rejected");
                }
                
                // Test email subject too long
                $longSubject = false;
                try {
                    $this->service->validateTemplates([
                        'email' => ['subject' => str_repeat('a', 501)]
                    ]);
                } catch (InvalidArgumentException $e) {
                    $longSubject = true;
                }
                
                if (!$longSubject) {
                    throw new Exception("Long email subject should be rejected");
                }
                
                // Test SMS body too long
                $longSms = false;
                try {
                    $this->service->validateTemplates([
                        'sms' => ['body' => str_repeat('a', 1601)]
                    ]);
                } catch (InvalidArgumentException $e) {
                    $longSms = true;
                }
                
                if (!$longSms) {
                    throw new Exception("Long SMS body should be rejected");
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
     * Property 22: Playbook RBAC Enforcement
     * **Validates: Requirements 7.3, 7.5**
     * 
     * For any playbook access, the system SHALL enforce:
     * (1) owner has full access, (2) editors can modify, (3) viewers can only read.
     */
    public function testProperty22_PlaybookRBACEnforcement(): array {
        $results = ['passed' => 0, 'failed' => 0, 'errors' => []];
        $iterations = 30;
        
        echo "Property 22: Playbook RBAC Enforcement\n";
        echo "  **Validates: Requirements 7.3, 7.5**\n";
        
        for ($i = 0; $i < $iterations; $i++) {
            try {
                $ownerId = $this->testUserIds[0];
                $editorId = $this->testUserIds[1];
                $viewerId = $this->testUserIds[2];
                
                // Create playbook with permissions
                $playbookId = $this->service->createPlaybook($ownerId, [
                    'name' => "RBAC Test Playbook {$i}",
                    'templates' => ['email' => ['subject' => 'Test']],
                    'permissions' => [
                        'editors' => [$editorId],
                        'viewers' => [$viewerId]
                    ]
                ]);
                $this->testPlaybookIds[] = $playbookId;
                
                // Test owner can edit
                if (!$this->service->canEditPlaybook($playbookId, $ownerId)) {
                    throw new Exception("Owner should be able to edit");
                }
                
                // Test owner can view
                if (!$this->service->canViewPlaybook($playbookId, $ownerId)) {
                    throw new Exception("Owner should be able to view");
                }
                
                // Test editor can edit
                if (!$this->service->canEditPlaybook($playbookId, $editorId)) {
                    throw new Exception("Editor should be able to edit");
                }
                
                // Test editor can view
                if (!$this->service->canViewPlaybook($playbookId, $editorId)) {
                    throw new Exception("Editor should be able to view");
                }
                
                // Test viewer cannot edit
                if ($this->service->canEditPlaybook($playbookId, $viewerId)) {
                    throw new Exception("Viewer should NOT be able to edit");
                }
                
                // Test viewer can view
                if (!$this->service->canViewPlaybook($playbookId, $viewerId)) {
                    throw new Exception("Viewer should be able to view");
                }
                
                // Test random user cannot access
                $randomUserId = 999999;
                if ($this->service->canViewPlaybook($playbookId, $randomUserId)) {
                    throw new Exception("Random user should NOT be able to view");
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
     * Property 23: Playbook Version History
     * **Validates: Requirements 7.4**
     * 
     * For any playbook update, a new version SHALL be created with:
     * (1) incremented version number, (2) previous content preserved, (3) editor recorded.
     */
    public function testProperty23_PlaybookVersionHistory(): array {
        $results = ['passed' => 0, 'failed' => 0, 'errors' => []];
        $iterations = 20;
        
        echo "Property 23: Playbook Version History\n";
        echo "  **Validates: Requirements 7.4**\n";
        
        for ($i = 0; $i < $iterations; $i++) {
            try {
                $userId = $this->testUserIds[0];
                
                // Create playbook
                $playbookId = $this->service->createPlaybook($userId, [
                    'name' => "Version Test Playbook {$i}",
                    'templates' => ['email' => ['subject' => 'Version 1']]
                ]);
                $this->testPlaybookIds[] = $playbookId;
                
                // Verify initial version
                $versions = $this->service->getVersionHistory($playbookId);
                if (count($versions) !== 1) {
                    throw new Exception("Should have 1 initial version");
                }
                
                if ($versions[0]['version'] !== 1) {
                    throw new Exception("Initial version should be 1");
                }
                
                // Update playbook multiple times
                $numUpdates = rand(2, 5);
                for ($j = 1; $j <= $numUpdates; $j++) {
                    $this->service->updatePlaybook($playbookId, $userId, [
                        'templates' => ['email' => ['subject' => "Version " . ($j + 1)]],
                        'change_summary' => "Update {$j}"
                    ]);
                }
                
                // Verify version history
                $versions = $this->service->getVersionHistory($playbookId);
                
                if (count($versions) !== $numUpdates + 1) {
                    throw new Exception("Should have " . ($numUpdates + 1) . " versions, got " . count($versions));
                }
                
                // Verify versions are in descending order
                $prevVersion = PHP_INT_MAX;
                foreach ($versions as $version) {
                    if ($version['version'] >= $prevVersion) {
                        throw new Exception("Versions should be in descending order");
                    }
                    $prevVersion = $version['version'];
                    
                    // Verify editor is recorded
                    if ($version['edited_by'] != $userId) {
                        throw new Exception("Editor should be recorded");
                    }
                }
                
                // Verify latest version number
                if ($versions[0]['version'] !== $numUpdates + 1) {
                    throw new Exception("Latest version should be " . ($numUpdates + 1));
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
        echo "=== PlaybookService Property Tests ===\n\n";
        
        $this->setUp();
        
        $allResults = [
            'property21' => $this->testProperty21_PlaybookValidation(),
            'property22' => $this->testProperty22_PlaybookRBACEnforcement(),
            'property23' => $this->testProperty23_PlaybookVersionHistory()
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
    $test = new PlaybookServiceTest();
    $results = $test->runAllTests();
    exit(array_sum(array_column($results, 'failed')) > 0 ? 1 : 0);
}
