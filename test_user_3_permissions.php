<?php
// Test permissions for user ID 3 (admin)
require_once __DIR__ . '/backend/src/Database.php';
require_once __DIR__ . '/backend/src/Response.php';
require_once __DIR__ . '/backend/src/Auth.php';
require_once __DIR__ . '/backend/src/services/RBACService.php';
require_once __DIR__ . '/backend/src/controllers/CampaignsController.php';

// Mock the tenant context for testing
$GLOBALS['tenantContext'] = null;

try {
    echo "Testing permissions for user ID 3 (admin)...\n";
    
    $rbac = RBACService::getInstance();
    
    // Check if user has email.campaigns.view permission
    $hasPermission = $rbac->hasPermission(3, 'email.campaigns.view');
    echo "User 3 has email.campaigns.view permission: " . ($hasPermission ? 'YES' : 'NO') . "\n";
    
    // Get user's role
    $role = $rbac->getUserRole(3);
    if ($role) {
        echo "User 3 role: {$role['name']} (ID: {$role['id']})\n";
        echo "Role permissions: " . implode(', ', $role['permissions']) . "\n";
    } else {
        echo "User 3 has no role assigned\n";
    }
    
    // Check if user is admin
    $isAdmin = $rbac->isAdmin(3);
    echo "User 3 is admin: " . ($isAdmin ? 'YES' : 'NO') . "\n";
    
    // Test campaigns API with user 3
    echo "\nTesting campaigns API with user 3...\n";
    
    // Mock authentication for user 3
    $_SESSION['user_id'] = 3;
    
    // Call the campaigns controller
    CampaignsController::index();
    
} catch (Exception $e) {
    echo "✗ Error: " . $e->getMessage() . "\n";
    exit(1);
}