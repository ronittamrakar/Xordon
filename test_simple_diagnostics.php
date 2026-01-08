<?php
// Simple diagnostics test
echo "Testing diagnostics logic...\n\n";

// Test 1: Check log directory
$logDir = __DIR__ . '/backend/logs';
echo "1. Log directory: " . ($logDir) . "\n";
echo "   Exists: " . (is_dir($logDir) ? 'YES' : 'NO') . "\n";

if (is_dir($logDir)) {
    $logFiles = glob($logDir . '/*.log');
    echo "   Files found: " . count($logFiles) . "\n";
    foreach ($logFiles as $file) {
        $size = filesize($file);
        echo "   - " . basename($file) . " (" . round($size / 1024, 2) . " KB)\n";
    }
}

// Test 2: Check database connection
echo "\n2. Database connection test:\n";
try {
    require_once __DIR__ . '/backend/src/bootstrap.php';
    require_once __DIR__ . '/backend/src/Database.php';
    
    $pdo = \Xordon\Database::conn();
    echo "   Connected: YES\n";
    
    // Test a simple query
    $stmt = $pdo->query("SELECT 1");
    echo "   Query test: PASSED\n";
} catch (Exception $e) {
    echo "   Error: " . $e->getMessage() . "\n";
}

echo "\nAll basic tests completed!\n";
