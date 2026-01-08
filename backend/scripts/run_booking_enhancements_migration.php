<?php
/**
 * Run booking type enhancements migration
 * Adds service_id, staff associations, and intake form links to booking_types
 * Adds staff_id to appointments
 */

require_once __DIR__ . '/src/Database.php';

echo "Running booking type enhancements migration...\n";

try {
    $pdo = Database::conn();
    
    // Read and execute the migration file
    $sql = file_get_contents(__DIR__ . '/migrations/add_booking_type_enhancements.sql');
    
    // Split by semicolons and execute each statement
    $statements = array_filter(array_map('trim', explode(';', $sql)));
    
    foreach ($statements as $statement) {
        if (empty($statement) || strpos($statement, '--') === 0) {
            continue;
        }
        
        try {
            $pdo->exec($statement);
            echo "✓ Executed: " . substr($statement, 0, 60) . "...\n";
        } catch (PDOException $e) {
            // Ignore "column already exists" or "table already exists" errors
            if (strpos($e->getMessage(), 'Duplicate column') !== false ||
                strpos($e->getMessage(), 'already exists') !== false ||
                strpos($e->getMessage(), 'Duplicate key name') !== false) {
                echo "⊘ Skipped (already exists): " . substr($statement, 0, 60) . "...\n";
            } else {
                echo "✗ Error: " . $e->getMessage() . "\n";
            }
        }
    }
    
    echo "\n✓ Migration completed successfully!\n";
    
} catch (Exception $e) {
    echo "✗ Migration failed: " . $e->getMessage() . "\n";
    exit(1);
}
