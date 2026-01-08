<?php
/**
 * Run Appointments Enhancements Migration
 * 
 * This script adds enhanced scheduling features similar to Calendly/Acuity
 */

require_once __DIR__ . '/src/Database.php';

echo "Running Appointments Enhancements Migration...\n";

try {
    $pdo = Database::conn();
    
    // Read and execute the migration SQL
    $sql = file_get_contents(__DIR__ . '/migrations/add_appointments_enhancements.sql');
    
    // Split by semicolons and execute each statement
    $statements = array_filter(array_map('trim', explode(';', $sql)));
    
    foreach ($statements as $statement) {
        if (empty($statement) || strpos($statement, '--') === 0) {
            continue;
        }
        
        try {
            $pdo->exec($statement);
            echo ".";
        } catch (PDOException $e) {
            // Ignore "column already exists" and "table already exists" errors
            if (strpos($e->getMessage(), 'Duplicate column') !== false ||
                strpos($e->getMessage(), 'already exists') !== false ||
                strpos($e->getMessage(), 'Duplicate key name') !== false) {
                echo "s"; // skipped
                continue;
            }
            throw $e;
        }
    }
    
    echo "\n\nMigration completed successfully!\n";
    echo "Enhanced appointment scheduling features are now available.\n";
    
} catch (Exception $e) {
    echo "\nMigration failed: " . $e->getMessage() . "\n";
    exit(1);
}
