<?php
// verify_fix.php
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Define basic mocks if needed, but we'll try to load real files first
require_once __DIR__ . '/backend/src/Database.php';
require_once __DIR__ . '/backend/src/Response.php';
require_once __DIR__ . '/backend/src/Auth.php';
require_once __DIR__ . '/backend/src/Logger.php';
require_once __DIR__ . '/backend/src/services/RBACService.php';

// Load the controller we just fixed
require_once __DIR__ . '/backend/src/controllers/SystemHealthController.php';

echo "✅ SystemHealthController loaded successfully (Syntax is OK)\n\n";

// Mock environment for methods
$_SESSION['user_id'] = 3; // We know User 3 is admin from previous steps
$_SERVER['REQUEST_METHOD'] = 'GET';
$_SERVER['SERVER_SOFTWARE'] = 'MockServer';
$_SERVER['REMOTE_ADDR'] = '127.0.0.1';

// Override Response to just echo instead of exit
namespace Xordon;
class Response {
    public static function json($data, $code = 200) {
        echo "   [{$code}] JSON Response: " . (is_array($data) ? json_encode($data) : $data) . "\n";
    }
    public static function error($message, $code = 500) {
        echo "   [{$code}] ERROR Response: $message\n";
    }
}

// Back to global namespace to run tests
namespace Global;
use SystemHealthController;

echo "=== TESTING METHODS ===\n";

$methods = [
    'getHealth', // This one caused 500 errors
    'getPerformanceMetrics', // This one had the syntax error
    'getConnectivity',
    'getTrends'
];

foreach ($methods as $method) {
    echo "\nTesting SystemHealthController::$method()...\n";
    try {
        if (is_callable(['SystemHealthController', $method])) {
            SystemHealthController::$method();
            echo "   ✅ Method executed without crashing\n";
        } else {
            echo "   ❌ Method not callable!\n";
        }
    } catch (\Exception $e) {
        echo "   ❌ Runtime Exception: " . $e->getMessage() . "\n";
    } catch (\Error $e) {
        echo "   ❌ Fatal Error: " . $e->getMessage() . "\n";
    }
}
