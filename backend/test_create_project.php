<?php
require_once __DIR__ . '/src/Database.php';
require_once __DIR__ . '/src/Response.php';
require_once __DIR__ . '/src/Auth.php';
require_once __DIR__ . '/src/controllers/ProjectsController.php';

// Mock authentication
$GLOBALS['tenantContext'] = (object)[
    'workspaceId' => 1,
    'userId' => 1
];

// Mock the Auth class
class MockAuth {
    public static function userIdOrFail() {
        return 1;
    }
}

// Replace Auth with MockAuth
class_alias('MockAuth', 'Auth', true);

// Simulate POST request
$_SERVER['REQUEST_METHOD'] = 'POST';
$_POST = [];

// Mock get_json_body function
function get_json_body() {
    return [
        'title' => 'Test Project from Script',
        'description' => 'This is a test project',
        'status' => 'planning',
        'priority' => 'medium',
        'color' => '#3B82F6'
    ];
}

try {
    echo "Creating project...\n";
    
    // Call the create method
    ob_start();
    ProjectsController::create();
    $output = ob_get_clean();
    
    echo "Response: $output\n";
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
    echo "Stack trace:\n" . $e->getTraceAsString() . "\n";
}
