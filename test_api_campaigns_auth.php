<?php
// Test the campaigns API endpoint with proper authentication
require_once __DIR__ . '/backend/src/Database.php';
require_once __DIR__ . '/backend/src/Response.php';
require_once __DIR__ . '/backend/src/Auth.php';
require_once __DIR__ . '/backend/src/controllers/CampaignsController.php';
require_once __DIR__ . '/backend/src/services/RBACService.php';

// Mock the tenant context for testing
$GLOBALS['tenantContext'] = null;

// Mock authentication
$_SESSION['user_id'] = 1; // Test with user ID 1

try {
    // Test the campaigns API endpoint
    echo "Testing campaigns API endpoint with user ID 1...\n";
    
    // Simulate a GET request to /campaigns
    $_SERVER['REQUEST_METHOD'] = 'GET';
    
    // Call the index method
    CampaignsController::index();
    
} catch (Exception $e) {
    echo "✗ Error: " . $e->getMessage() . "\n";
    exit(1);
}