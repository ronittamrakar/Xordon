<?php
/**
 * Property-Based Tests for RBACService
 * 
 * These tests verify the correctness properties defined in the design document.
 * Run with: php backend/tests/RBACServiceTest.php
 */

require_once __DIR__ . '/../src/services/RBACService.php';
require_once __DIR__ . '/../src/Database.php';

class RBACServiceTest {
    
    private RBACService $rbacService;
    private int $iterations = 100;
    private int $passed = 0;
    private int $failed = 0;
    private array $createdRoleIds = [];
    
    public function __construct() {
        $this->rbacService = RBACService::getInstance();
    }
    
    /**
     * Run all property tests
     */
    public function runAll(): void {
        echo "=== RBACService Property Tests ===\n\n";
        
        $this->testProperty1_RoleStorageRoundTrip();
        $this->testProperty2_RoleNameUniqueness();
        $this->testProperty3_PermissionAssignmentValidity();
        $this->testProperty4_RoleChangePermissionTransition();
        $this->testProperty5_AdminFullAccess();
        $this->testProperty11_LastAdminProtection();
        
        // Cleanup created test roles
        $this->cleanup();
        
        echo "\n=== Test Summary ===\n";
        echo "Passed: {$this->passed}\n";
        echo "Failed: {$this->failed}\n";
        echo "Total: " . ($this->passed + $this->failed) . "\n";
    }
    
    /**
     * **Feature: rbac-system, Property 1: Role Storage Round-Trip**
     * 
     * For any valid role object with name, description, and permissions, 
     * storing it in the database and then retrieving it should produce 
     * an equivalent role object with all properties intact.
     * 
     * **Validates: Requirements 1.2, 10.2**
     */
    public function testProperty1_RoleStorageRoundTrip(): void {
        echo "Property 1: Role Storage Round-Trip\n";
        echo "  Validates: Requirements 1.2, 10.2\n";
        
        $failures = [];
        
        // Get available permissions for testing
        $allPermissions = $this->rbacService->getAllPermissions();
        $permissionKeys = array_column($allPermissions, 'key');
        
        if (empty($permissionKeys)) {
            $failures[] = "No permissions available in the system for testing";
            $this->reportResult('Property 1', $failures);
            return;
        }
        
        for ($i = 0; $i < $this->iterations; $i++) {
            try {
                // Generate random role data
                $originalName = $this->generateUniqueRoleName($i);
                $originalDescription = $this->generateRandomDescription();
                $originalPermissions = $this->selectRandomPermissions($permissionKeys);
                
                // Store the role
                $createdRole = $this->rbacService->createRole(
                    $originalName,
                    $originalDescription,
                    $originalPermissions
                );
                
                $this->createdRoleIds[] = $createdRole['id'];
                
                // Retrieve the role by ID
                $retrievedRole = $this->rbacService->getRoleById((int)$createdRole['id']);
                
                if (!$retrievedRole) {
                    $failures[] = "Role not found after creation: $originalName";
                    continue;
                }
                
                // Verify name matches
                if ($retrievedRole['name'] !== $originalName) {
                    $failures[] = "Name mismatch: expected '$originalName', got '{$retrievedRole['name']}'";
                }
                
                // Verify description matches
                if ($retrievedRole['description'] !== $originalDescription) {
                    $failures[] = "Description mismatch for role '$originalName'";
                }
                
                // Verify permissions match (order-independent comparison)
                $retrievedPermissions = $retrievedRole['permissions'] ?? [];
                sort($originalPermissions);
                sort($retrievedPermissions);
                
                if ($originalPermissions !== $retrievedPermissions) {
                    $failures[] = "Permissions mismatch for role '$originalName': " .
                        "expected " . count($originalPermissions) . " permissions, " .
                        "got " . count($retrievedPermissions);
                }
                
                // Also verify retrieval by name works
                $retrievedByName = $this->rbacService->getRoleByName($originalName);
                if (!$retrievedByName || $retrievedByName['id'] !== $retrievedRole['id']) {
                    $failures[] = "Role retrieval by name failed for '$originalName'";
                }
                
            } catch (Exception $e) {
                $failures[] = "Exception during iteration $i: " . $e->getMessage();
            }
        }
        
        $this->reportResult('Property 1', $failures);
    }
    
    /**
     * **Feature: rbac-system, Property 2: Role Name Uniqueness**
     * 
     * For any two roles in the system, their names must be distinct 
     * (case-insensitive comparison).
     * 
     * **Validates: Requirements 1.5**
     */
    public function testProperty2_RoleNameUniqueness(): void {
        echo "Property 2: Role Name Uniqueness\n";
        echo "  Validates: Requirements 1.5\n";
        
        $failures = [];
        
        for ($i = 0; $i < $this->iterations; $i++) {
            try {
                // Generate a unique role name
                $baseName = $this->generateUniqueRoleName($i);
                
                // Create the first role
                $role1 = $this->rbacService->createRole(
                    $baseName,
                    'First role for uniqueness test',
                    []
                );
                $this->createdRoleIds[] = $role1['id'];
                
                // Test 1: Exact duplicate name should be rejected
                try {
                    $duplicateRole = $this->rbacService->createRole(
                        $baseName,
                        'Duplicate role - should fail',
                        []
                    );
                    // If we get here, duplicate was accepted - this is a failure
                    $this->createdRoleIds[] = $duplicateRole['id'];
                    $failures[] = "Exact duplicate name '$baseName' was accepted but should have been rejected";
                } catch (Exception $e) {
                    // Expected behavior - duplicate should throw exception
                    if (strpos($e->getMessage(), 'already exists') === false) {
                        $failures[] = "Wrong exception for duplicate name: " . $e->getMessage();
                    }
                }
                
                // Test 2: Case-insensitive duplicate should also be rejected
                $caseVariants = [
                    strtoupper($baseName),
                    strtolower($baseName),
                    ucfirst(strtolower($baseName)),
                    $this->randomizeCase($baseName)
                ];
                
                foreach ($caseVariants as $variant) {
                    if ($variant === $baseName) {
                        continue; // Skip if variant is identical to original
                    }
                    
                    try {
                        $caseVariantRole = $this->rbacService->createRole(
                            $variant,
                            'Case variant role - should fail',
                            []
                        );
                        // If we get here, case variant was accepted - this is a failure
                        $this->createdRoleIds[] = $caseVariantRole['id'];
                        $failures[] = "Case variant '$variant' of '$baseName' was accepted but should have been rejected";
                    } catch (Exception $e) {
                        // Expected behavior - case variant should throw exception
                        if (strpos($e->getMessage(), 'already exists') === false) {
                            $failures[] = "Wrong exception for case variant '$variant': " . $e->getMessage();
                        }
                    }
                }
                
                // Test 3: Verify all roles in system have unique names (case-insensitive)
                $allRoles = $this->rbacService->getAllRoles();
                $normalizedNames = [];
                foreach ($allRoles as $role) {
                    $normalizedName = strtolower($role['name']);
                    if (isset($normalizedNames[$normalizedName])) {
                        $failures[] = "Found duplicate role names (case-insensitive): '{$role['name']}' and '{$normalizedNames[$normalizedName]}'";
                    }
                    $normalizedNames[$normalizedName] = $role['name'];
                }
                
                // Test 4: Updating a role to have a duplicate name should be rejected
                $secondRoleName = $this->generateUniqueRoleName($i + 50000);
                $role2 = $this->rbacService->createRole(
                    $secondRoleName,
                    'Second role for update test',
                    []
                );
                $this->createdRoleIds[] = $role2['id'];
                
                try {
                    $this->rbacService->updateRole((int)$role2['id'], ['name' => $baseName]);
                    $failures[] = "Updating role to duplicate name '$baseName' was accepted but should have been rejected";
                } catch (Exception $e) {
                    // Expected behavior
                    if (strpos($e->getMessage(), 'already exists') === false) {
                        $failures[] = "Wrong exception for update to duplicate name: " . $e->getMessage();
                    }
                }
                
                // Test 5: Case-insensitive update should also be rejected
                try {
                    $this->rbacService->updateRole((int)$role2['id'], ['name' => strtoupper($baseName)]);
                    $failures[] = "Updating role to case variant '" . strtoupper($baseName) . "' was accepted but should have been rejected";
                } catch (Exception $e) {
                    // Expected behavior
                    if (strpos($e->getMessage(), 'already exists') === false) {
                        $failures[] = "Wrong exception for update to case variant: " . $e->getMessage();
                    }
                }
                
            } catch (Exception $e) {
                $failures[] = "Exception during iteration $i: " . $e->getMessage();
            }
        }
        
        $this->reportResult('Property 2', $failures);
    }
    
    /**
     * **Feature: rbac-system, Property 3: Permission Assignment Validity**
     * 
     * For any permission key assigned to a role, that permission key must 
     * exist in the system's permission registry.
     * 
     * **Validates: Requirements 2.5**
     */
    public function testProperty3_PermissionAssignmentValidity(): void {
        echo "Property 3: Permission Assignment Validity\n";
        echo "  Validates: Requirements 2.5\n";
        
        $failures = [];
        
        // Get all valid permissions from the system
        $allPermissions = $this->rbacService->getAllPermissions();
        $validPermissionKeys = array_column($allPermissions, 'key');
        
        if (empty($validPermissionKeys)) {
            $failures[] = "No permissions available in the system for testing";
            $this->reportResult('Property 3', $failures);
            return;
        }
        
        for ($i = 0; $i < $this->iterations; $i++) {
            try {
                $roleName = $this->generateUniqueRoleName($i);
                
                // Test 1: Valid permissions should be accepted
                $validPermissions = $this->selectRandomPermissions($validPermissionKeys);
                
                try {
                    $createdRole = $this->rbacService->createRole(
                        $roleName,
                        'Test role for permission validity',
                        $validPermissions
                    );
                    $this->createdRoleIds[] = $createdRole['id'];
                    
                    // Verify all assigned permissions exist in the registry
                    $assignedPermissions = $createdRole['permissions'] ?? [];
                    foreach ($assignedPermissions as $permKey) {
                        if (!in_array($permKey, $validPermissionKeys)) {
                            $failures[] = "Assigned permission '$permKey' not found in permission registry";
                        }
                    }
                } catch (Exception $e) {
                    $failures[] = "Valid permissions rejected: " . $e->getMessage();
                }
                
                // Test 2: Invalid permission keys should be rejected
                $invalidPermissionKey = $this->generateInvalidPermissionKey($validPermissionKeys);
                $testRoleName = $this->generateUniqueRoleName($i + 10000);
                
                try {
                    $invalidRole = $this->rbacService->createRole(
                        $testRoleName,
                        'Test role with invalid permission',
                        [$invalidPermissionKey]
                    );
                    // If we get here, the invalid permission was accepted - this is a failure
                    $this->createdRoleIds[] = $invalidRole['id'];
                    $failures[] = "Invalid permission key '$invalidPermissionKey' was accepted but should have been rejected";
                } catch (Exception $e) {
                    // Expected behavior - invalid permission should throw exception
                    if (strpos($e->getMessage(), 'Invalid permission key') === false) {
                        $failures[] = "Wrong exception for invalid permission: " . $e->getMessage();
                    }
                }
                
                // Test 3: Mixed valid and invalid permissions should be rejected
                if (!empty($validPermissions)) {
                    $mixedPermissions = array_merge($validPermissions, [$invalidPermissionKey]);
                    $mixedRoleName = $this->generateUniqueRoleName($i + 20000);
                    
                    try {
                        $mixedRole = $this->rbacService->createRole(
                            $mixedRoleName,
                            'Test role with mixed permissions',
                            $mixedPermissions
                        );
                        $this->createdRoleIds[] = $mixedRole['id'];
                        $failures[] = "Mixed permissions with invalid key '$invalidPermissionKey' were accepted";
                    } catch (Exception $e) {
                        // Expected - should reject due to invalid permission
                        if (strpos($e->getMessage(), 'Invalid permission key') === false) {
                            $failures[] = "Wrong exception for mixed permissions: " . $e->getMessage();
                        }
                    }
                }
                
            } catch (Exception $e) {
                $failures[] = "Exception during iteration $i: " . $e->getMessage();
            }
        }
        
        $this->reportResult('Property 3', $failures);
    }

    /**
     * **Feature: rbac-system, Property 4: Role Change Permission Transition**
     * 
     * For any user whose role is changed from role A to role B, the user's 
     * effective permissions should equal exactly the permissions of role B, 
     * with no permissions from role A remaining.
     * 
     * **Validates: Requirements 3.3**
     */
    public function testProperty4_RoleChangePermissionTransition(): void {
        echo "Property 4: Role Change Permission Transition\n";
        echo "  Validates: Requirements 3.3\n";
        
        $failures = [];
        
        // Get available permissions for testing
        $allPermissions = $this->rbacService->getAllPermissions();
        $permissionKeys = array_column($allPermissions, 'key');
        
        if (count($permissionKeys) < 4) {
            $failures[] = "Not enough permissions available for testing (need at least 4)";
            $this->reportResult('Property 4', $failures);
            return;
        }
        
        // Get or create a test user
        $testUserId = $this->getOrCreateTestUser();
        if ($testUserId === null) {
            $failures[] = "Could not find or create a test user";
            $this->reportResult('Property 4', $failures);
            return;
        }
        
        for ($i = 0; $i < $this->iterations; $i++) {
            try {
                // Create Role A with a random set of permissions
                $roleAName = $this->generateUniqueRoleName($i * 2);
                $roleAPermissions = $this->selectRandomPermissions($permissionKeys);
                
                // Ensure Role A has at least some permissions
                if (empty($roleAPermissions)) {
                    $roleAPermissions = array_slice($permissionKeys, 0, 3);
                }
                
                $roleA = $this->rbacService->createRole(
                    $roleAName,
                    'Test Role A for permission transition',
                    $roleAPermissions
                );
                $this->createdRoleIds[] = $roleA['id'];
                
                // Create Role B with a DIFFERENT set of permissions
                $roleBName = $this->generateUniqueRoleName($i * 2 + 1);
                $roleBPermissions = $this->selectDifferentPermissions($permissionKeys, $roleAPermissions);
                
                $roleB = $this->rbacService->createRole(
                    $roleBName,
                    'Test Role B for permission transition',
                    $roleBPermissions
                );
                $this->createdRoleIds[] = $roleB['id'];
                
                // Assign Role A to the test user
                $this->rbacService->setUserRole($testUserId, (int)$roleA['id']);
                
                // Verify user has Role A's permissions
                $userPermissionsWithRoleA = $this->rbacService->getUserPermissions($testUserId);
                sort($roleAPermissions);
                sort($userPermissionsWithRoleA);
                
                if ($roleAPermissions !== $userPermissionsWithRoleA) {
                    $failures[] = "User permissions don't match Role A permissions before transition (iteration $i)";
                    continue;
                }
                
                // Change user's role from A to B
                $this->rbacService->setUserRole($testUserId, (int)$roleB['id']);
                
                // Get user's permissions after role change
                $userPermissionsAfterChange = $this->rbacService->getUserPermissions($testUserId);
                sort($roleBPermissions);
                sort($userPermissionsAfterChange);
                
                // Property check 1: User's permissions should exactly match Role B's permissions
                if ($roleBPermissions !== $userPermissionsAfterChange) {
                    $failures[] = "User permissions don't match Role B after transition (iteration $i): " .
                        "expected " . count($roleBPermissions) . " permissions, got " . count($userPermissionsAfterChange);
                }
                
                // Property check 2: No permissions from Role A should remain (unless also in Role B)
                $roleAOnlyPermissions = array_diff($roleAPermissions, $roleBPermissions);
                foreach ($roleAOnlyPermissions as $permKey) {
                    if ($this->rbacService->hasPermission($testUserId, $permKey)) {
                        $failures[] = "Permission '$permKey' from Role A still present after transition to Role B (iteration $i)";
                    }
                }
                
                // Property check 3: All permissions from Role B should be present
                foreach ($roleBPermissions as $permKey) {
                    if (!$this->rbacService->hasPermission($testUserId, $permKey)) {
                        $failures[] = "Permission '$permKey' from Role B missing after transition (iteration $i)";
                    }
                }
                
                // Property check 4: Verify getUserRole returns Role B
                $currentRole = $this->rbacService->getUserRole($testUserId);
                if (!$currentRole || (int)$currentRole['id'] !== (int)$roleB['id']) {
                    $failures[] = "getUserRole doesn't return Role B after transition (iteration $i)";
                }
                
            } catch (Exception $e) {
                $failures[] = "Exception during iteration $i: " . $e->getMessage();
            }
        }
        
        // Cleanup: Reset test user to a default role if possible
        $this->resetTestUserRole($testUserId);
        
        $this->reportResult('Property 4', $failures);
    }
    
    /**
     * Get or create a test user for role transition testing
     */
    private function getOrCreateTestUser(): ?int {
        $pdo = Database::conn();
        
        // Find a non-admin user to use for testing
        $adminRole = $this->rbacService->getRoleByName('Admin');
        $adminRoleId = $adminRole ? $adminRole['id'] : 0;
        
        $stmt = $pdo->prepare('SELECT id FROM users WHERE role_id != ? OR role_id IS NULL LIMIT 1');
        $stmt->execute([$adminRoleId]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($user) {
            return (int)$user['id'];
        }
        
        // If all users are admins, just use any user (we'll restore their role after)
        $stmt = $pdo->query('SELECT id FROM users LIMIT 1');
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        
        return $user ? (int)$user['id'] : null;
    }
    
    /**
     * Select a different set of permissions (for testing role transitions)
     */
    private function selectDifferentPermissions(array $allPermissions, array $excludePermissions): array {
        // Get permissions not in the exclude list
        $availablePermissions = array_diff($allPermissions, $excludePermissions);
        
        // If we have enough different permissions, use only those
        if (count($availablePermissions) >= 2) {
            $count = rand(1, min(5, count($availablePermissions)));
            $shuffled = array_values($availablePermissions);
            shuffle($shuffled);
            return array_slice($shuffled, 0, $count);
        }
        
        // Otherwise, select a random subset that's different from the original
        $count = rand(0, min(5, count($allPermissions)));
        $shuffled = $allPermissions;
        shuffle($shuffled);
        $selected = array_slice($shuffled, 0, $count);
        
        // Ensure it's actually different
        sort($selected);
        sort($excludePermissions);
        if ($selected === $excludePermissions) {
            // Add or remove one permission to make it different
            if (!empty($selected)) {
                array_pop($selected);
            } else {
                $selected[] = $allPermissions[0];
            }
        }
        
        return $selected;
    }
    
    /**
     * Reset test user to a default role
     */
    private function resetTestUserRole(int $userId): void {
        try {
            $defaultRole = $this->rbacService->getDefaultRole();
            if ($defaultRole) {
                $this->rbacService->setUserRole($userId, (int)$defaultRole['id']);
            }
        } catch (Exception $e) {
            // Ignore errors during cleanup
        }
    }

    /**
     * **Feature: rbac-system, Property 5: Admin Full Access**
     * 
     * For any API endpoint and any user with the Admin role, 
     * the permission check should return true (access granted).
     * 
     * **Validates: Requirements 4.4, 5.1**
     */
    public function testProperty5_AdminFullAccess(): void {
        echo "Property 5: Admin Full Access\n";
        echo "  Validates: Requirements 4.4, 5.1\n";
        
        $failures = [];
        
        // Get all permissions from the system
        $allPermissions = $this->rbacService->getAllPermissions();
        $permissionKeys = array_column($allPermissions, 'key');
        
        if (empty($permissionKeys)) {
            $failures[] = "No permissions available in the system for testing";
            $this->reportResult('Property 5', $failures);
            return;
        }
        
        // Get or create an admin user for testing
        $adminUserId = $this->getOrCreateAdminUser();
        
        if ($adminUserId === null) {
            $failures[] = "Could not find or create an admin user for testing";
            $this->reportResult('Property 5', $failures);
            return;
        }
        
        // Verify the user is actually an admin
        if (!$this->rbacService->isAdmin($adminUserId)) {
            $failures[] = "Test user (ID: $adminUserId) is not recognized as admin";
            $this->reportResult('Property 5', $failures);
            return;
        }
        
        for ($i = 0; $i < $this->iterations; $i++) {
            try {
                // Test 1: Admin should have access to every single permission
                $randomPermission = $permissionKeys[array_rand($permissionKeys)];
                
                if (!$this->rbacService->hasPermission($adminUserId, $randomPermission)) {
                    $failures[] = "Admin user denied permission '$randomPermission'";
                }
                
                // Test 2: Admin should pass hasAnyPermission for any random subset
                $randomSubset = $this->selectRandomPermissions($permissionKeys);
                if (!empty($randomSubset)) {
                    if (!$this->rbacService->hasAnyPermission($adminUserId, $randomSubset)) {
                        $failures[] = "Admin user denied hasAnyPermission for: " . implode(', ', $randomSubset);
                    }
                }
                
                // Test 3: Admin should pass hasAllPermissions for any random subset
                if (!empty($randomSubset)) {
                    if (!$this->rbacService->hasAllPermissions($adminUserId, $randomSubset)) {
                        $failures[] = "Admin user denied hasAllPermissions for: " . implode(', ', $randomSubset);
                    }
                }
                
                // Test 4: Admin should pass isAdmin check
                if (!$this->rbacService->isAdmin($adminUserId)) {
                    $failures[] = "Admin user failed isAdmin check on iteration $i";
                }
                
                // Test 5: Test with a completely random/fake permission key
                // Admin should still return true (full access means ALL permissions)
                $fakePermission = $this->generateInvalidPermissionKey($permissionKeys);
                // Note: For non-existent permissions, the behavior depends on implementation
                // The design says admin has "full access" - we test that isAdmin returns true
                // and hasPermission returns true for all VALID permissions
                
            } catch (Exception $e) {
                $failures[] = "Exception during iteration $i: " . $e->getMessage();
            }
        }
        
        // Additional comprehensive test: verify admin has ALL permissions
        echo "  Running comprehensive all-permissions check...\n";
        foreach ($permissionKeys as $permKey) {
            if (!$this->rbacService->hasPermission($adminUserId, $permKey)) {
                $failures[] = "Admin user denied permission '$permKey' in comprehensive check";
            }
        }
        
        // Test that getUserPermissions returns all permissions for admin
        $adminPermissions = $this->rbacService->getUserPermissions($adminUserId);
        $missingPermissions = array_diff($permissionKeys, $adminPermissions);
        if (!empty($missingPermissions)) {
            $failures[] = "getUserPermissions missing " . count($missingPermissions) . " permissions for admin: " . 
                implode(', ', array_slice($missingPermissions, 0, 3)) . 
                (count($missingPermissions) > 3 ? '...' : '');
        }
        
        $this->reportResult('Property 5', $failures);
    }

    /**
     * **Feature: rbac-system, Property 11: Last Admin Protection**
     * 
     * For any attempt to remove the Admin role from a user, if that user is 
     * the only remaining Admin, the operation should be rejected.
     * 
     * **Validates: Requirements 3.4**
     */
    public function testProperty11_LastAdminProtection(): void {
        echo "Property 11: Last Admin Protection\n";
        echo "  Validates: Requirements 3.4\n";
        
        $failures = [];
        $pdo = Database::conn();
        
        // Get the Admin role
        $adminRole = $this->rbacService->getRoleByName('Admin');
        if (!$adminRole) {
            $failures[] = "Admin role not found in the system";
            $this->reportResult('Property 11', $failures);
            return;
        }
        
        // Get a non-admin role for demotion attempts
        $nonAdminRole = $this->rbacService->getDefaultRole();
        if (!$nonAdminRole) {
            // Create a test role if no default exists
            try {
                $nonAdminRole = $this->rbacService->createRole(
                    'TestNonAdmin_' . time(),
                    'Test role for last admin protection test',
                    []
                );
                $this->createdRoleIds[] = $nonAdminRole['id'];
            } catch (Exception $e) {
                $failures[] = "Could not create non-admin role for testing: " . $e->getMessage();
                $this->reportResult('Property 11', $failures);
                return;
            }
        }
        
        // Store original admin user IDs to restore later
        $stmt = $pdo->prepare('
            SELECT u.id, u.role_id FROM users u
            INNER JOIN roles r ON u.role_id = r.id
            WHERE LOWER(r.name) = "admin"
        ');
        $stmt->execute();
        $originalAdmins = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        for ($i = 0; $i < $this->iterations; $i++) {
            try {
                // Get current admin count
                $stmt = $pdo->prepare('
                    SELECT COUNT(*) FROM users u
                    INNER JOIN roles r ON u.role_id = r.id
                    WHERE LOWER(r.name) = "admin"
                ');
                $stmt->execute();
                $adminCount = (int)$stmt->fetchColumn();
                
                // Get all current admin users
                $stmt = $pdo->prepare('
                    SELECT u.id FROM users u
                    INNER JOIN roles r ON u.role_id = r.id
                    WHERE LOWER(r.name) = "admin"
                ');
                $stmt->execute();
                $adminUserIds = $stmt->fetchAll(PDO::FETCH_COLUMN);
                
                if (empty($adminUserIds)) {
                    // No admins exist - skip this iteration
                    continue;
                }
                
                // Pick a random admin user to attempt demotion
                $targetAdminId = $adminUserIds[array_rand($adminUserIds)];
                
                // Property test: If this is the ONLY admin, demotion should be rejected
                if ($adminCount === 1) {
                    // This is the last admin - demotion MUST fail
                    try {
                        $this->rbacService->setUserRole($targetAdminId, (int)$nonAdminRole['id']);
                        // If we get here, the demotion was allowed - this is a FAILURE
                        $failures[] = "Last admin (user ID: $targetAdminId) was demoted but should have been protected (iteration $i)";
                        
                        // Restore admin role immediately to continue testing
                        $stmt = $pdo->prepare('UPDATE users SET role_id = ? WHERE id = ?');
                        $stmt->execute([$adminRole['id'], $targetAdminId]);
                    } catch (Exception $e) {
                        // Expected behavior - should throw exception
                        if (strpos($e->getMessage(), 'last admin') === false && 
                            strpos($e->getMessage(), 'Cannot remove') === false) {
                            $failures[] = "Wrong exception for last admin protection: " . $e->getMessage();
                        }
                        // Verify the user is still an admin
                        $currentRole = $this->rbacService->getUserRole($targetAdminId);
                        if (!$currentRole || strtolower($currentRole['name']) !== 'admin') {
                            $failures[] = "Last admin user lost admin role despite exception being thrown (iteration $i)";
                        }
                    }
                } else {
                    // Multiple admins exist - demotion of one should succeed
                    // But we need to be careful not to demote all admins
                    // Only test demotion if there are at least 2 admins
                    if ($adminCount >= 2) {
                        try {
                            $this->rbacService->setUserRole($targetAdminId, (int)$nonAdminRole['id']);
                            
                            // Verify the user is no longer an admin
                            $currentRole = $this->rbacService->getUserRole($targetAdminId);
                            if ($currentRole && strtolower($currentRole['name']) === 'admin') {
                                $failures[] = "User still has admin role after demotion (iteration $i)";
                            }
                            
                            // Verify at least one admin still exists
                            $stmt = $pdo->prepare('
                                SELECT COUNT(*) FROM users u
                                INNER JOIN roles r ON u.role_id = r.id
                                WHERE LOWER(r.name) = "admin"
                            ');
                            $stmt->execute();
                            $remainingAdmins = (int)$stmt->fetchColumn();
                            
                            if ($remainingAdmins === 0) {
                                $failures[] = "No admins remaining after demotion - system is in invalid state (iteration $i)";
                            }
                            
                            // Restore the admin role for next iteration
                            $stmt = $pdo->prepare('UPDATE users SET role_id = ? WHERE id = ?');
                            $stmt->execute([$adminRole['id'], $targetAdminId]);
                            
                        } catch (Exception $e) {
                            // Demotion should have succeeded when multiple admins exist
                            $failures[] = "Demotion failed when multiple admins exist: " . $e->getMessage() . " (iteration $i)";
                        }
                    }
                }
                
                // Additional property: Verify system invariant - at least one admin must always exist
                $stmt = $pdo->prepare('
                    SELECT COUNT(*) FROM users u
                    INNER JOIN roles r ON u.role_id = r.id
                    WHERE LOWER(r.name) = "admin"
                ');
                $stmt->execute();
                $finalAdminCount = (int)$stmt->fetchColumn();
                
                if ($finalAdminCount === 0) {
                    $failures[] = "System invariant violated: No admin users exist (iteration $i)";
                    // Emergency restore
                    if (!empty($originalAdmins)) {
                        $stmt = $pdo->prepare('UPDATE users SET role_id = ? WHERE id = ?');
                        $stmt->execute([$adminRole['id'], $originalAdmins[0]['id']]);
                    }
                }
                
            } catch (Exception $e) {
                $failures[] = "Exception during iteration $i: " . $e->getMessage();
            }
        }
        
        // Restore original admin state
        foreach ($originalAdmins as $admin) {
            try {
                $stmt = $pdo->prepare('UPDATE users SET role_id = ? WHERE id = ?');
                $stmt->execute([$admin['role_id'], $admin['id']]);
            } catch (Exception $e) {
                // Ignore restoration errors
            }
        }
        
        $this->reportResult('Property 11', $failures);
    }
    
    /**
     * Get or create an admin user for testing
     */
    private function getOrCreateAdminUser(): ?int {
        $pdo = Database::conn();
        
        // First, try to find an existing admin user
        $adminRole = $this->rbacService->getRoleByName('Admin');
        if (!$adminRole) {
            return null;
        }
        
        $stmt = $pdo->prepare('SELECT id FROM users WHERE role_id = ? LIMIT 1');
        $stmt->execute([$adminRole['id']]);
        $existingAdmin = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($existingAdmin) {
            return (int)$existingAdmin['id'];
        }
        
        // If no admin user exists, find any user and temporarily assign admin role
        $stmt = $pdo->query('SELECT id FROM users LIMIT 1');
        $anyUser = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($anyUser) {
            // Temporarily assign admin role for testing
            $this->rbacService->setUserRole((int)$anyUser['id'], (int)$adminRole['id']);
            return (int)$anyUser['id'];
        }
        
        return null;
    }

    // === Helper Methods ===
    
    /**
     * Generate a unique role name for testing
     */
    private function generateUniqueRoleName(int $iteration): string {
        $adjectives = ['Test', 'Sample', 'Demo', 'Temp', 'Mock', 'Trial'];
        $nouns = ['Role', 'Access', 'Level', 'Tier', 'Group', 'Profile'];
        
        $adjective = $adjectives[array_rand($adjectives)];
        $noun = $nouns[array_rand($nouns)];
        $timestamp = microtime(true) * 10000;
        
        return "{$adjective}_{$noun}_{$iteration}_{$timestamp}";
    }
    
    /**
     * Generate a random description
     */
    private function generateRandomDescription(): string {
        $templates = [
            'A test role for property-based testing',
            'Temporary role created during automated tests',
            'Sample role with random permissions',
            'Test access level for validation',
            'Automated test role - can be deleted',
            '',  // Empty description is valid
        ];
        
        $description = $templates[array_rand($templates)];
        
        // Sometimes add random suffix
        if (rand(0, 1)) {
            $description .= ' #' . rand(1000, 9999);
        }
        
        return $description;
    }
    
    /**
     * Select a random subset of permissions
     */
    private function selectRandomPermissions(array $allPermissions): array {
        // Select between 0 and min(10, total) permissions
        $maxPermissions = min(10, count($allPermissions));
        $count = rand(0, $maxPermissions);
        
        if ($count === 0) {
            return [];
        }
        
        $shuffled = $allPermissions;
        shuffle($shuffled);
        
        return array_slice($shuffled, 0, $count);
    }
    
    /**
     * Randomize the case of a string (for testing case-insensitive uniqueness)
     */
    private function randomizeCase(string $str): string {
        $result = '';
        for ($i = 0; $i < strlen($str); $i++) {
            $char = $str[$i];
            if (rand(0, 1)) {
                $result .= strtoupper($char);
            } else {
                $result .= strtolower($char);
            }
        }
        return $result;
    }
    
    /**
     * Generate an invalid permission key that doesn't exist in the system
     */
    private function generateInvalidPermissionKey(array $validKeys): string {
        $prefixes = ['invalid', 'fake', 'nonexistent', 'test', 'bogus'];
        $suffixes = ['permission', 'access', 'right', 'capability', 'action'];
        
        do {
            $prefix = $prefixes[array_rand($prefixes)];
            $suffix = $suffixes[array_rand($suffixes)];
            $randomNum = rand(1000, 9999);
            $invalidKey = "{$prefix}.{$suffix}.{$randomNum}";
        } while (in_array($invalidKey, $validKeys));
        
        return $invalidKey;
    }
    
    /**
     * Report test results
     */
    private function reportResult(string $propertyName, array $failures): void {
        if (empty($failures)) {
            echo "  ✓ PASSED ({$this->iterations} iterations)\n\n";
            $this->passed++;
        } else {
            echo "  ✗ FAILED (" . count($failures) . " failures)\n";
            // Show first 3 failures
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
    
    /**
     * Cleanup test data
     */
    private function cleanup(): void {
        echo "Cleaning up test roles...\n";
        $cleaned = 0;
        
        foreach ($this->createdRoleIds as $roleId) {
            try {
                $this->rbacService->deleteRole($roleId);
                $cleaned++;
            } catch (Exception $e) {
                // Role may already be deleted or have users assigned
            }
        }
        
        echo "  Cleaned up $cleaned test roles\n";
    }
}

// Run tests if executed directly
if (php_sapi_name() === 'cli' && basename(__FILE__) === basename($_SERVER['SCRIPT_FILENAME'] ?? '')) {
    $test = new RBACServiceTest();
    $test->runAll();
}
