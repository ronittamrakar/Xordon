<?php
/**
 * Run Performance Billing Migration
 */

require_once __DIR__ . '/../src/Database.php';

// Load .env
$envFile = __DIR__ . '/../.env';
if (file_exists($envFile)) {
    $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos(trim($line), '#') === 0) continue;
        if (strpos($line, '=') !== false) {
            list($name, $value) = explode('=', $line, 2);
            putenv(trim($name) . '=' . trim($value));
        }
    }
}

try {
    $pdo = Database::conn();
    $sql = file_get_contents(__DIR__ . '/../migrations/performance_billing.sql');
    
    // Split by semicolon but handle multi-line statements
    $statements = preg_split('/;[\r\n]+/', $sql);
    
    $successCount = 0;
    $warningCount = 0;
    
    foreach ($statements as $stmt) {
        $stmt = trim($stmt);
        
        // Skip empty statements and comments
        if (empty($stmt) || strpos($stmt, '--') === 0) {
            continue;
        }
        
        try {
            $pdo->exec($stmt);
            $preview = substr(preg_replace('/\s+/', ' ', $stmt), 0, 60);
            echo "OK: {$preview}...\n";
            $successCount++;
        } catch (PDOException $e) {
            // Ignore "Duplicate column" and "Table already exists" warnings
            if (strpos($e->getMessage(), 'Duplicate column') !== false ||
                strpos($e->getMessage(), 'already exists') !== false) {
                echo "SKIP: Already exists - " . substr($stmt, 0, 40) . "...\n";
            } else {
                echo "WARN: " . $e->getMessage() . "\n";
                $warningCount++;
            }
        }
    }
    
    echo "\n=== Migration Complete ===\n";
    echo "Successful: $successCount\n";
    echo "Warnings: $warningCount\n";
    
} catch (Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
    exit(1);
}
