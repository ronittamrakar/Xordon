<?php
/**
 * Property Test: Module Permission Registration
 * Property 30: Module Permission Registration
 * Validates: Requirements 10.1
 * 
 * For any CRM module, when it is registered, the corresponding permissions
 * should be available in the RBAC system.
 */

namespace Tests;

require_once __DIR__ . '/../src/Database.php';
require_once __DIR__ . '/../src/services/ModuleManager.php';
require_once __DIR__ . '/../src/services/RBACService.php';

use App\Services\ModuleManager;
use App\Services\RBACService;

class ModulePermissionRegistrationTest
{
    private ModuleManager $moduleManager;
    private RBACService $rbacService;
    private array $testResults = [];

    public function __construct()
    {
        $this->moduleManager = new ModuleManager();
        $this->rbacService = new RBACService();
    }

    /**
     * Property 30: Module Permission Registration
     * For any registered module, its permissions should exist in the RBAC system
     */
    public function testModulePermissionRegistration(): bool
    {
        echo "Testing Property 30: Module Permission Registration\n";
        echo "================================================\n\n";

        $modules = [
            'lead_scoring' => ['crm.lead_scoring.view', 'crm.lead_scoring.manage'],
            'sequences' => ['crm.sequences.view', 'crm.sequences.create', 'crm.sequences.edit', 'crm.sequences.delete'],
            'meetings' => ['crm.meetings.view', 'crm.meetings.create', 'crm.meetings.edit', 'crm.meetings.delete'],
            'conversation_intelligence' => ['crm.conversation_intelligence.view', 'crm.conversation_intelligence.manage'],
            'intent_data' => ['crm.intent_data.view', 'crm.intent_data.manage'],
            'pipeline' => ['crm.pipeline.view', 'crm.pipeline.manage', 'crm.pipeline.forecast'],
            'playbooks' => ['crm.playbooks.view', 'crm.playbooks.create', 'crm.playbooks.edit', 'crm.playbooks.delete'],
            'notifications' => ['crm.notifications.view', 'crm.notifications.manage'],
            'attribution' => ['crm.attribution.view', 'crm.attribution.manage'],
        ];

        $allPassed = true;
        $iterations = 0;

        foreach ($modules as $moduleName => $expectedPermissions) {
            $iterations++;
            echo "Iteration $iterations: Testing module '$moduleName'\n";

            // Get all permissions from RBAC
            $allPermissions = $this->rbacService->getAllPermissions();
            $permissionKeys = array_column($allPermissions, 'key');

            foreach ($expectedPermissions as $permKey) {
                $found = in_array($permKey, $permissionKeys);
                
                if (!$found) {
                    echo "  ✗ FAILED: Permission '$permKey' not found for module '$moduleName'\n";
                    $allPassed = false;
                } else {
                    echo "  ✓ Permission '$permKey' exists\n";
                }
            }
        }

        echo "\n";
        if ($allPassed) {
            echo "✓ Property 30 PASSED: All module permissions are registered\n";
        } else {
            echo "✗ Property 30 FAILED: Some module permissions are missing\n";
        }

        return $allPassed;
    }

    /**
     * Property: Permission categories are correctly assigned
     */
    public function testPermissionCategories(): bool
    {
        echo "\nTesting Permission Categories\n";
        echo "=============================\n\n";

        $allPermissions = $this->rbacService->getAllPermissions();
        $crmPermissions = array_filter($allPermissions, function($p) {
            return strpos($p['key'], 'crm.') === 0;
        });

        $allPassed = true;
        foreach ($crmPermissions as $perm) {
            $hasCategory = !empty($perm['category']) && strpos($perm['category'], 'CRM') !== false;
            if (!$hasCategory) {
                echo "  ✗ Permission '{$perm['key']}' has invalid category: '{$perm['category']}'\n";
                $allPassed = false;
            }
        }

        if ($allPassed) {
            echo "✓ All CRM permissions have correct categories\n";
        }

        return $allPassed;
    }

    public function runAllTests(): bool
    {
        $results = [];
        
        $results['module_permission_registration'] = $this->testModulePermissionRegistration();
        $results['permission_categories'] = $this->testPermissionCategories();

        echo "\n=== Test Summary ===\n";
        $passed = 0;
        $failed = 0;
        foreach ($results as $name => $result) {
            if ($result) {
                $passed++;
                echo "✓ $name: PASSED\n";
            } else {
                $failed++;
                echo "✗ $name: FAILED\n";
            }
        }

        echo "\nTotal: $passed passed, $failed failed\n";
        return $failed === 0;
    }
}

// Run tests if executed directly
if (php_sapi_name() === 'cli' && basename(__FILE__) === basename($_SERVER['SCRIPT_FILENAME'])) {
    $test = new ModulePermissionRegistrationTest();
    $success = $test->runAllTests();
    exit($success ? 0 : 1);
}
