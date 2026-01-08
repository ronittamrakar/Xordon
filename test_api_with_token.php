<?php
// Test the campaigns API with proper authentication
require_once __DIR__ . '/backend/src/Database.php';
require_once __DIR__ . '/backend/src/Response.php';
require_once __DIR__ . '/backend/src/Auth.php';
require_once __DIR__ . '/backend/src/services/RBACService.php';
require_once __DIR__ . '/backend/src/controllers/CampaignsController.php';

// Mock the tenant context for testing
$GLOBALS['tenantContext'] = null;

try {
    echo "Testing campaigns API with proper authentication...\n";
    
    // First, let's create a token for User 3
    $db = Database::conn();
    
    // Check if User 3 exists
    $stmt = $db->prepare('SELECT id, email, name FROM users WHERE id = ?');
    $stmt->execute([3]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$user) {
        echo "User 3 not found\n";
        exit(1);
    }
    
    echo "User 3 found: {$user['name']} ({$user['email']})\n";
    
    // Create a token for User 3
    $token = bin2hex(random_bytes(24));
    $stmt = $db->prepare('INSERT INTO auth_tokens (user_id, token, created_at, expires_at) VALUES (?, ?, CURRENT_TIMESTAMP, DATE_ADD(CURRENT_TIMESTAMP, INTERVAL 1 DAY))');
    $stmt->execute([3, $token]);
    
    echo "Created token for User 3: $token\n";
    
    // Set the Authorization header
    $_SERVER['HTTP_AUTHORIZATION'] = "Bearer $token";
    
    // Set the workspace header
    $_SERVER['HTTP_X_WORKSPACE_ID'] = "1";
    
    // Now test the campaigns API
    echo "\nCalling CampaignsController::index()...\n";
    
    CampaignsController::index();
    
} catch (Exception $e) {
    echo "✗ Error: " . $e->getMessage() . "\n";
    exit(1);
}