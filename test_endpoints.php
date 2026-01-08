<?php
// test_all_endpoints.php
// Manual verification script for System Health Endpoints

// Use built-in PHP server URL assuming it's running on 8080 (backend) or 5173 (if via proxy, but direct backend is better for test)
// The user said: php -S localhost:8080 -t public
$baseUrl = 'http://localhost:8080';

// Mock Authentication - In a real scenario, we'd need to login first.
// However, since we are testing internal methods usually, or if we have a way to inject a token.
// For this script, we will assume we might hit public endpoints or we need to simulate a login.
// Actually, the user asked to test the *controller methods directly* in the previous guide, specifically by including the files.
// Let's do that - it's faster and tests the logic without needing a running server state for the script itself.

error_reporting(E_ALL);
ini_set('display_errors', 1);

// Define constants expected by the app if not already defined
if (!defined('PDO::FETCH_ASSOC')) define('PDO::FETCH_ASSOC', 2);

echo "=== 🏥 SYSTEM HEALTH DIAGNOSTICS ===\n\n";

// Load Application Context
$backendPath = __DIR__ . '/backend/src';

// We need to mock the Auth class because we can't easily login via script without HTTP context
class MockAuth {
    public static function user() { return ['id' => 1, 'role_id' => 1, 'workspace_id' => 1]; }
    public static function userId() { return 1; }
    public static function userIdOrFail() { return 1; }
}

// Mock Response class to capture JSON output instead of exiting
class MockResponse {
    public static function json($data, $code = 200) {
        echo json_encode($data, JSON_PRETTY_PRINT) . "\n";
        if ($code >= 400) throw new Exception("HTTP $code Response");
    }
    public static function error($msg, $code = 500) {
        echo "ERROR ($code): $msg\n";
        throw new Exception("HTTP $code Error");
    }
}

// Mock Logger
class MockLogger {
    public static function info($msg, $ctx=[]) { echo "[INFO] $msg\n"; }
    public static function error($msg, $ctx=[]) { echo "[ERROR] $msg\n"; }
}

// Mock Database (Partial) - we will try to load the real one, but fall back if connection fails
// ACTUALLY, we should check if the real files exist and require them.
require_once $backendPath . '/Database.php';

// Override classes with mocks using class_alias if they don't allow re-declaration, 
// OR simpler: we rely on the fact that existing code uses `Auth::` and we can perhaps alias it if it's not loaded.
// BUT, the require_once lines in the controller will fail if we haven't set up the include path correctly.
// Let's try to mock the specific dependencies by defining them *before* requiring the controller, 
// IF they aren't already class files.
// However, SystemHealthController requires them at the top.
// The best way here is to actually mock the `isAdminOrFail` method or the dependencies it calls.
// Since we can't redeclare, we will trust the database connection works (since `npm run dev` and `php -S` are running).

// Bootstrap
require_once $backendPath . '/Database.php';

// We need to bypass the real Auth checks which check session/headers.
// We can't easily rewrite the class on the fly.
// ALTERNATIVE: Use curl to hit the running server?
// PRO: Tests actual route + middleware + database.
// CON: Authentication.
// Let's try to use the *Controller* directly but validly authenticated.
// Since `Auth::userIdOrFail()` uses $_SESSION or Headers, we can inject a mock session.
session_start();
$_SESSION['user_id'] = 1; // Assuming admin ID is 1

// Start Tests
require_once $backendPath . '/controllers/SystemHealthController.php';

echo "1. Testing getHealth()...\n";
try {
    SystemHealthController::getHealth();
    echo "✅ getHealth OK\n";
} catch (Throwable $e) {
    echo "❌ getHealth Failed: " . $e->getMessage() . "\n";
}

echo "\n2. Testing getConnectivity()...\n";
try {
    SystemHealthController::getConnectivity();
    echo "✅ getConnectivity OK\n";
} catch (Throwable $e) {
    echo "❌ getConnectivity Failed: " . $e->getMessage() . "\n";
}

echo "\n3. Testing getDatabaseInsights()...\n";
try {
    SystemHealthController::getDatabaseInsights();
    echo "✅ getDatabaseInsights OK\n";
} catch (Throwable $e) {
    echo "❌ getDatabaseInsights Failed: " . $e->getMessage() . "\n";
}

echo "\nTests Complete.\n";
