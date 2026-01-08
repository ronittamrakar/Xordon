<?php
// Generic migration runner
error_reporting(E_ALL);
ini_set('display_errors', 1);

require_once __DIR__ . '/../vendor/autoload.php';

use Xordon\Database;

if ($argc < 2) {
    die("Usage: php run_migration_generic.php <migration_file_path>\n");
}

$migrationFile = $argv[1];
if (!file_exists($migrationFile)) {
    // Try relative to migrations folder
    $migrationFile = __DIR__ . '/../migrations/' . $argv[1];
    if (!file_exists($migrationFile)) {
        die("Migration file not found: " . $argv[1] . "\n");
    }
}

try {
    $pdo = Database::conn();
    echo "Database connection: SUCCESS\n";
    
    $sql = file_get_contents($migrationFile);
    
    // Split into individual statements
    $statements = array_filter(array_map('trim', explode(';', $sql)));
    
    foreach ($statements as $statement) {
        if (empty($statement)) continue;
        
        echo "Executing: " . substr($statement, 0, 50) . "...\n";
        try {
            $pdo->exec($statement);
            echo "SUCCESS\n";
        } catch (Exception $e) {
            echo "ERROR: " . $e->getMessage() . "\n";
        }
    }
    
    echo "\nMigration completed!\n";
    
} catch (Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
}
