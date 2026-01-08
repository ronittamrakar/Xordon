<?php
// Test permissions for user ID 1
require_once __DIR__ . '/backend/src/Database.php';
require_once __DIR__ . '/backend/src/Response.php';
require_once __DIR__ . '/backend/src/Auth.php';
require_once __DIR__ . '/backend/src/services/RBACService.php';

// Mock the tenant context for testing
$GLOBALS['tenantContext'] = null;

try {
    echo "Testing permissions for user ID 1...\n";
    
    $rbac = RBACService::getInstance();
    
    // Check if user has email.campaigns.view permission
    $hasPermission = $rbac->hasPermission(1, 'email.campaigns.view');
    echo "User 1 has email.campaigns.view permission: " . ($hasPermission ? 'YES' : 'NO') . "\n";
    
    // Get user's role
    $role = $rbac->getUserRole(1);
    if ($role) {
        echo "User 1 role: {$role['name']} (ID: {$role['id']})\n";
        echo "Role permissions: " . implode(', ', $role['permissions']) . "\n";
    } else {
        echo "User 1 has no role assigned\n";
    }
    
    // Check if user is admin
    $isAdmin = $rbac->isAdmin(1);
    echo "User 1 is admin: " . ($isAdmin ? 'YES' : 'NO') . "\n";
    
    // Get all available permissions
    $permissions = $rbac->getAllPermissions();
    echo "Total permissions available: " . count($permissions) . "\n";
    
    // Check specifically for email.campaigns permissions
    $emailCampaignPermissions = array_filter($permissions, function($p) {
        return strpos($p['key'], 'email.campaigns') !== false;
    });
    
    echo "Email campaign permissions:\n";
    foreach ($emailCampaignPermissions as $perm) {
        echo "  - {$perm['key']}: {$perm['name']}\n";
    }
    
} catch (Exception $e) {
    echo "✗ Error: " . $e->getMessage() . "\n";
    exit(1);
}
