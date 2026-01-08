<?php
// Test the campaigns API endpoint directly
require_once __DIR__ . '/backend/src/Database.php';
require_once __DIR__ . '/backend/src/Response.php';
require_once __DIR__ . '/backend/src/Auth.php';
require_once __DIR__ . '/backend/src/controllers/CampaignsController.php';

// Mock the tenant context for testing
$GLOBALS['tenantContext'] = null;

try {
    // Test the campaigns API endpoint
    echo "Testing campaigns API endpoint...\n";
    
    // Simulate a GET request to /campaigns
    $_SERVER['REQUEST_METHOD'] = 'GET';
    
    // Call the index method
    CampaignsController::index();
    
} catch (Exception $e) {
    echo "✗ Error: " . $e->getMessage() . "\n";
    exit(1);
}