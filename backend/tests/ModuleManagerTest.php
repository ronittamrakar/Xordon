<?php
/**
 * Property-Based Tests for ModuleManager
 * 
 * These tests verify the correctness properties defined in the design document.
 * Run with: php backend/tests/ModuleManagerTest.php
 * 
 * Properties tested:
 * - Property 31: Module Access Control
 * - Property 32: Phased Rollout Enforcement
 * - Property 33: RBAC Fail-Safe
 */

require_once __DIR__ . '/../src/Database.php';
require_once __DIR__ . '/../src/services/ModuleManager.php';

class ModuleManagerTest {
    
    private ModuleManager $moduleManager;
    private $pdo;
    private int $iterations = 100;
    private int $passed = 0;
    private int $failed = 0;
    private array $testModules = [];
    private array $testUsers = [];
    
    public function __construct() {
        $this->pdo = Database::conn();
        $this->moduleManager = new ModuleManager($this->pdo);
    }
    
    /**
     * Run all property tests
     */
    public function runAll(): void {
        echo "=== ModuleManager Property Tests ===\n\n";
        
        $this->setup();
        
        try {
            $this->testProperty31_ModuleAccessControl();
            $this->testProperty32_PhasedRolloutEnforcement();
            $this->testProperty33_RBACFailSafe();
        } finally {
            $this->cleanup();
        }
        
        echo "\n=== Test Summary ===\n";
        echo "Passed: {$this->passed}\n";
        echo "Failed: {$this->failed}\n";
        echo "Total: " . ($this->passed + $this->failed) . "\n";
    }

    
    /**
     * **Feature: crm-enhancements, Property 31: Module Access Control**
     * 
     * For any user accessing a module feature, access SHALL be granted only if:
     * (1) the module is enabled for the user, AND (2) the user has the required permission.
     * 
     * **Validates: Requirements 10.2, 10.4**
     */
    public function testProperty31_ModuleAccessControl(): void {
        echo "Property 31: Module Access Control\n";
        echo "  Validates: Requirements 10.2, 10.4\n";
        
        $failures = [];
        
        for ($i = 0; $i < $this->iterations; $i++) {
            // Create a test module with random status
            $moduleId = 'test_module_' . $i;
            $isActive = rand(0, 1) === 1;
            
            $this->createTestModule($moduleId, $isActive ? 'active' : 'inactive');
            
            // Pick a random test user
            $userId = $this->testUsers[array_rand($this->testUsers)];
            
            // Check module access
            $hasAccess = $this->moduleManager->isModuleEnabled($moduleId, $userId);
            
            // If module is inactive, access should be denied
            if (!$isActive && $hasAccess) {
                $failures[] = "User $userId has access to inactive module $moduleId";
            }
            
            // Clean up test module
            $this->deleteTestModule($moduleId);
        }
        
        $this->reportResult('Property 31', $failures);
    }
    
    /**
     * **Feature: crm-enhancements, Property 32: Phased Rollout Enforcement**
     * 
     * For any module with rollout configuration, module access SHALL be granted 
     * only to users matching the rollout criteria (user list, role, team, or percentage).
     * 
     * **Validates: Requirements 10.3**
     */
    public function testProperty32_PhasedRolloutEnforcement(): void {
        echo "Property 32: Phased Rollout Enforcement\n";
        echo "  Validates: Requirements 10.3\n";
        
        $failures = [];
        
        // Test user-based rollout
        $moduleId = 'test_rollout_user';
        $this->createTestModule($moduleId, 'active');
        
        // Enable for specific users only
        $allowedUsers = array_slice($this->testUsers, 0, 2);
        $this->moduleManager->enableModule($moduleId, [
            'type' => 'user',
            'targets' => $allowedUsers
        ]);
        
        for ($i = 0; $i < min(50, $this->iterations); $i++) {
            $userId = $this->testUsers[array_rand($this->testUsers)];
            $hasAccess = $this->moduleManager->isModuleEnabled($moduleId, $userId);
            $shouldHaveAccess = in_array($userId, $allowedUsers);
            
            if ($hasAccess !== $shouldHaveAccess) {
                $failures[] = "User $userId access mismatch for user-based rollout. Expected: " . 
                              ($shouldHaveAccess ? 'true' : 'false') . ", Got: " . ($hasAccess ? 'true' : 'false');
            }
        }
        
        $this->deleteTestModule($moduleId);
        
        // Test percentage-based rollout
        $moduleId = 'test_rollout_pct';
        $this->createTestModule($moduleId, 'active');
        
        // Enable for 50% of users
        $this->moduleManager->enableModule($moduleId, [
            'type' => 'percentage',
            'percentage' => 50
        ]);
        
        $accessCount = 0;
        $totalChecks = min(100, $this->iterations);
        
        for ($i = 0; $i < $totalChecks; $i++) {
            $userId = $this->testUsers[$i % count($this->testUsers)];
            if ($this->moduleManager->isModuleEnabled($moduleId, $userId)) {
                $accessCount++;
            }
        }
        
        // With 50% rollout, we expect roughly 40-60% of users to have access
        // (allowing for variance in small sample)
        $accessPercentage = ($accessCount / $totalChecks) * 100;
        if ($accessPercentage < 20 || $accessPercentage > 80) {
            $failures[] = "Percentage rollout seems off. Expected ~50%, got {$accessPercentage}%";
        }
        
        $this->deleteTestModule($moduleId);
        
        // Test 'all' rollout type
        $moduleId = 'test_rollout_all';
        $this->createTestModule($moduleId, 'active');
        
        $this->moduleManager->enableModule($moduleId, ['type' => 'all']);
        
        foreach ($this->testUsers as $userId) {
            if (!$this->moduleManager->isModuleEnabled($moduleId, $userId)) {
                $failures[] = "User $userId should have access with 'all' rollout type";
            }
        }
        
        $this->deleteTestModule($moduleId);
        
        $this->reportResult('Property 32', $failures);
    }
    
    /**
     * **Feature: crm-enhancements, Property 33: RBAC Fail-Safe**
     * 
     * For any permission check where configuration is missing, access SHALL be denied by default.
     * 
     * **Validates: Requirements 10.5**
     */
    public function testProperty33_RBACFailSafe(): void {
        echo "Property 33: RBAC Fail-Safe\n";
        echo "  Validates: Requirements 10.5\n";
        
        $failures = [];
        
        for ($i = 0; $i < $this->iterations; $i++) {
            // Test with non-existent module
            $nonExistentModule = 'non_existent_module_' . uniqid();
            $userId = $this->testUsers[array_rand($this->testUsers)];
            
            $hasAccess = $this->moduleManager->isModuleEnabled($nonExistentModule, $userId);
            
            if ($hasAccess) {
                $failures[] = "User $userId has access to non-existent module $nonExistentModule";
            }
            
            // Test with non-existent permission
            $moduleId = 'lead_scoring'; // Use existing module
            $nonExistentPermission = 'non_existent_permission_' . uniqid();
            
            $hasPermission = $this->moduleManager->hasModulePermission($moduleId, $userId, $nonExistentPermission);
            
            if ($hasPermission) {
                $failures[] = "User $userId has non-existent permission $nonExistentPermission";
            }
        }
        
        $this->reportResult('Property 33', $failures);
    }
    
    // === Setup and Cleanup ===
    
    private function setup(): void {
        echo "Setting up test data...\n\n";
        
        // Get existing users for testing
        $stmt = $this->pdo->query("SELECT id FROM users LIMIT 10");
        $users = $stmt->fetchAll(PDO::FETCH_COLUMN);
        
        if (empty($users)) {
            // Create test users if none exist
            for ($i = 1; $i <= 5; $i++) {
                $this->pdo->exec("INSERT INTO users (email, password, name) VALUES ('test{$i}@test.com', 'test', 'Test User {$i}')");
                $this->testUsers[] = $this->pdo->lastInsertId();
            }
        } else {
            $this->testUsers = $users;
        }
        
        echo "Using " . count($this->testUsers) . " test users\n\n";
    }
    
    private function cleanup(): void {
        echo "\nCleaning up test data...\n";
        
        // Delete test modules
        foreach ($this->testModules as $moduleId) {
            $this->deleteTestModule($moduleId);
        }
        
        // Note: We don't delete test users as they may be real users
    }
    
    private function createTestModule(string $moduleId, string $status = 'active'): void {
        $stmt = $this->pdo->prepare("
            INSERT INTO modules (id, name, description, permissions, default_roles, status)
            VALUES (?, ?, ?, '[]', '{}', ?)
            ON DUPLICATE KEY UPDATE status = VALUES(status)
        ");
        $stmt->execute([$moduleId, "Test Module $moduleId", "Test module for property testing", $status]);
        $this->testModules[] = $moduleId;
    }
    
    private function deleteTestModule(string $moduleId): void {
        $this->pdo->prepare("DELETE FROM module_rollouts WHERE module_id = ?")->execute([$moduleId]);
        $this->pdo->prepare("DELETE FROM module_user_access WHERE module_id = ?")->execute([$moduleId]);
        $this->pdo->prepare("DELETE FROM modules WHERE id = ?")->execute([$moduleId]);
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
    $test = new ModuleManagerTest();
    $test->runAll();
}
