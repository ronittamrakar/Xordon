<?php
require_once __DIR__ . '/src/Database.php';

echo "Running Requests migration...\n";

try {
    $db = Database::conn();
    
    $migrationFile = __DIR__ . '/migrations/create_requests.sql';
    
    if (!file_exists($migrationFile)) {
        throw new Exception("Migration file not found: $migrationFile");
    }
    
    $sql = file_get_contents($migrationFile);
    
    // Split by semicolons and execute each statement
    $statements = array_filter(
        array_map('trim', explode(';', $sql)),
        function($stmt) {
            return !empty($stmt) && strpos($stmt, '--') !== 0;
        }
    );
    
    foreach ($statements as $statement) {
        if (!empty($statement)) {
            echo "Executing: " . substr($statement, 0, 100) . "...\n";
            $db->exec($statement);
        }
    }
    
    echo "✓ Requests migration completed successfully!\n";
    
} catch (Exception $e) {
    echo "✗ Migration failed: " . $e->getMessage() . "\n";
    exit(1);
}
