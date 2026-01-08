<?php
// Test diagnostics endpoint
require_once __DIR__ . '/backend/src/bootstrap.php';
require_once __DIR__ . '/backend/src/Database.php';
require_once __DIR__ . '/backend/src/Response.php';
require_once __DIR__ . '/backend/src/Auth.php';
require_once __DIR__ . '/backend/src/Logger.php';
require_once __DIR__ . '/backend/src/services/RBACService.php';
require_once __DIR__ . '/backend/src/controllers/SystemHealthController.php';

// Mock admin authentication
class MockAuth {
    public static function userIdOrFail() {
        return 1;
    }
    public static function userId() {
        return 1;
    }
}

class MockRBAC {
    private static $instance;
    public static function getInstance() {
        if (!self::$instance) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    public function isAdmin($userId) {
        return true;
    }
}

// Override Auth and RBAC for testing
class_alias('MockAuth', 'Auth', true);

echo "Testing SystemHealthController::runDiagnostics()...\n\n";

try {
    ob_start();
    SystemHealthController::runDiagnostics();
    $output = ob_get_clean();
    
    echo "Response:\n";
    echo $output;
    echo "\n\nTest completed successfully!\n";
} catch (Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
    echo "Trace: " . $e->getTraceAsString() . "\n";
}
