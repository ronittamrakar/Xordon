<?php
/**
 * Run Critical Indexes Migration
 * Adds performance indexes to high-traffic tables
 */

require_once __DIR__ . '/backend/src/Database.php';

echo "=== CRITICAL INDEXES MIGRATION ===\n";
echo "Adding performance indexes to high-traffic tables...\n\n";

$pdo = Database::conn();

// Read index definitions from migration file
$sqlFile = __DIR__ . '/backend/migrations/add_critical_indexes_v2.sql';
$sql = file_get_contents($sqlFile);

// Parse out CREATE INDEX statements
preg_match_all('/CREATE INDEX IF NOT EXISTS (\S+) ON (\S+)\(([^)]+)\);/i', $sql, $matches, PREG_SET_ORDER);

$success = 0;
$skipped = 0;
$failed = 0;

foreach ($matches as $match) {
    $indexName = $match[1];
    $tableName = $match[2];
    $columns = $match[3];
    
    // Check if table exists
    try {
        $stmt = $pdo->query("SHOW TABLES LIKE '$tableName'");
        if ($stmt->rowCount() === 0) {
            echo "⚠️  SKIP: Table '$tableName' does not exist\n";
            $skipped++;
            continue;
        }
    } catch (Exception $e) {
        $skipped++;
        continue;
    }
    
    // Check if index already exists
    try {
        $stmt = $pdo->query("SHOW INDEX FROM `$tableName` WHERE Key_name = '$indexName'");
        if ($stmt->rowCount() > 0) {
            echo "✓  OK: Index '$indexName' already exists on '$tableName'\n";
            $skipped++;
            continue;
        }
    } catch (Exception $e) {
        // Table might not have the column, skip
        $skipped++;
        continue;
    }
    
    // Create the index
    try {
        $createSql = "CREATE INDEX `$indexName` ON `$tableName`($columns)";
        $pdo->exec($createSql);
        echo "✅ CREATED: Index '$indexName' on '$tableName'($columns)\n";
        $success++;
    } catch (PDOException $e) {
        $msg = $e->getMessage();
        if (strpos($msg, 'Duplicate key name') !== false) {
            echo "✓  OK: Index '$indexName' already exists\n";
            $skipped++;
        } elseif (strpos($msg, 'Key column') !== false && strpos($msg, "doesn't exist") !== false) {
            echo "⚠️  SKIP: Column doesn't exist for index '$indexName'\n";
            $skipped++;
        } else {
            echo "❌ FAILED: '$indexName' - " . $msg . "\n";
            $failed++;
        }
    }
}

echo "\n=== MIGRATION COMPLETE ===\n";
echo "Created: $success | Skipped: $skipped | Failed: $failed\n";

// Show total index count
$stmt = $pdo->query("
    SELECT COUNT(*) as cnt 
    FROM information_schema.STATISTICS 
    WHERE TABLE_SCHEMA = DATABASE()
");
$result = $stmt->fetch(PDO::FETCH_ASSOC);
echo "\nTotal indexes in database: " . $result['cnt'] . "\n";
