<?php
// Fix user permissions by assigning appropriate role
require_once __DIR__ . '/backend/src/Database.php';
require_once __DIR__ . '/backend/src/Response.php';
require_once __DIR__ . '/backend/src/Auth.php';
require_once __DIR__ . '/backend/src/services/RBACService.php';

// Mock the tenant context for testing
$GLOBALS['tenantContext'] = null;

try {
    echo "Fixing user permissions...\n";
    
    $rbac = RBACService::getInstance();
    
    // Get all roles
    $roles = $rbac->getAllRoles();
    echo "Available roles:\n";
    foreach ($roles as $role) {
        echo "  - ID: {$role['id']}, Name: {$role['name']}, System: " . ($role['is_system'] ? 'YES' : 'NO') . "\n";
    }
    
    // Get default role
    $defaultRole = $rbac->getDefaultRole();
    if ($defaultRole) {
        echo "\nDefault role: {$defaultRole['name']} (ID: {$defaultRole['id']})\n";
        
        // Assign default role to user 1
        $result = $rbac->assignDefaultRole(1);
        echo "Assigned default role to user 1: " . ($result ? 'SUCCESS' : 'FAILED') . "\n";
        
        // Verify the assignment
        $userRole = $rbac->getUserRole(1);
        if ($userRole) {
            echo "User 1 now has role: {$userRole['name']}\n";
            echo "User 1 permissions: " . implode(', ', $userRole['permissions']) . "\n";
            
            // Test if user now has email.campaigns.view permission
            $hasPermission = $rbac->hasPermission(1, 'email.campaigns.view');
            echo "User 1 now has email.campaigns.view permission: " . ($hasPermission ? 'YES' : 'NO') . "\n";
        }
    } else {
        echo "No default role found. Creating one...\n";
        
        // Create a basic role with email campaign permissions
        $permissions = [
            'email.campaigns.view',
            'email.campaigns.create', 
            'email.campaigns.edit',
            'email.campaigns.send',
            'email.campaigns.delete'
        ];
        
        $role = $rbac->createRole('Outreach Specialist', 'Basic outreach role with email campaign permissions', $permissions, false);
        echo "Created role: {$role['name']} (ID: {$role['id']})\n";
        
        // Assign to user 1
        $rbac->setUserRole(1, (int)$role['id'], 1);
        echo "Assigned role to user 1\n";
        
        // Verify
        $userRole = $rbac->getUserRole(1);
        if ($userRole) {
            echo "User 1 now has role: {$userRole['name']}\n";
            echo "User 1 permissions: " . implode(', ', $userRole['permissions']) . "\n";
            
            $hasPermission = $rbac->hasPermission(1, 'email.campaigns.view');
            echo "User 1 now has email.campaigns.view permission: " . ($hasPermission ? 'YES' : 'NO') . "\n";
        }
    }
    
    echo "\n✓ User permissions fixed successfully!\n";
    
} catch (Exception $e) {
    echo "✗ Error: " . $e->getMessage() . "\n";
    exit(1);
}