<?php
// Test System Health Backend
error_reporting(E_ALL);
ini_set('display_errors', 1);

require_once __DIR__ . '/backend/src/Database.php';
require_once __DIR__ . '/backend/src/Response.php';
require_once __DIR__ . '/backend/src/Auth.php';
require_once __DIR__ . '/backend/src/Logger.php';
require_once __DIR__ . '/backend/src/services/RBACService.php';
require_once __DIR__ . '/backend/src/controllers/SystemHealthController.php';
require_once __DIR__ . '/backend/src/controllers/SecurityController.php';

echo "=== TESTING SYSTEM HEALTH BACKEND ===\n\n";

// Test 1: Database Connection
echo "1. Testing Database Connection...\n";
try {
    $pdo = \Xordon\Database::conn();
    echo "   ✅ Database connected\n\n";
} catch (Exception $e) {
    echo "   ❌ Database error: " . $e->getMessage() . "\n\n";
    exit(1);
}

// Test 2: Check security_events table
echo "2. Checking security_events table...\n";
try {
    $stmt = $pdo->query("SHOW TABLES LIKE 'security_events'");
    if ($stmt->rowCount() > 0) {
        echo "   ✅ security_events table exists\n";
        $stmt = $pdo->query("SELECT COUNT(*) as cnt FROM security_events");
        $count = $stmt->fetch(PDO::FETCH_ASSOC);
        echo "   📊 Records: " . $count['cnt'] . "\n\n";
    } else {
        echo "   ❌ security_events table NOT found\n\n";
    }
} catch (Exception $e) {
    echo "   ❌ Error: " . $e->getMessage() . "\n\n";
}

// Test 3: Check system_health_snapshots table
echo "3. Checking system_health_snapshots table...\n";
try {
    $stmt = $pdo->query("SHOW TABLES LIKE 'system_health_snapshots'");
    if ($stmt->rowCount() > 0) {
        echo "   ✅ system_health_snapshots table exists\n";
        $stmt = $pdo->query("SELECT COUNT(*) as cnt FROM system_health_snapshots");
        $count = $stmt->fetch(PDO::FETCH_ASSOC);
        echo "   📊 Records: " . $count['cnt'] . "\n\n";
    } else {
        echo "   ❌ system_health_snapshots table NOT found\n\n";
    }
} catch (Exception $e) {
    echo "   ❌ Error: " . $e->getMessage() . "\n\n";
}

// Test 4: Test Database::getHealthStatus()
echo "4. Testing Database::getHealthStatus()...\n";
try {
    if (method_exists('\Xordon\Database', 'getHealthStatus')) {
        $status = \Xordon\Database::getHealthStatus();
        echo "   ✅ Method exists\n";
        echo "   📊 Status: " . json_encode($status, JSON_PRETTY_PRINT) . "\n\n";
    } else {
        echo "   ❌ getHealthStatus() method NOT found in Database class\n\n";
    }
} catch (Exception $e) {
    echo "   ❌ Error: " . $e->getMessage() . "\n\n";
}

// Test 5: Test RBACService
echo "5. Testing RBACService...\n";
try {
    $rbac = RBACService::getInstance();
    echo "   ✅ RBACService loaded\n\n";
} catch (Exception $e) {
    echo "   ❌ Error: " . $e->getMessage() . "\n\n";
}

echo "=== TEST COMPLETE ===\n";
