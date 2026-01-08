<?php
/**
 * Run the enhancement migration
 */
require_once __DIR__ . '/backend/src/Database.php';

use Xordon\Database;

try {
    $db = Database::conn();
    $sql = file_get_contents(__DIR__ . '/backend/migrations/enhance_listings_automation.sql');
    
    // Split by semicolon and execute each statement
    $statements = array_filter(array_map('trim', explode(';', $sql)));
    
    foreach ($statements as $statement) {
        if (empty($statement)) continue;
        echo "Executing: " . substr($statement, 0, 50) . "...\n";
        try {
            $db->exec($statement);
            echo "Success.\n";
        } catch (PDOException $e) {
            echo "Error: " . $e->getMessage() . "\n";
            // Continue if column already exists
            if (strpos($e->getMessage(), 'Duplicate column name') !== false) {
                echo "Column already exists, skipping.\n";
            } else {
                throw $e;
            }
        }
    }
    
    echo "Migration completed successfully.\n";
} catch (Exception $e) {
    echo "Fatal Error: " . $e->getMessage() . "\n";
    exit(1);
}
