<?php
/**
 * Run Field Service & GPS Tracking Migration
 */

require_once __DIR__ . '/../src/Database.php';

try {
    $pdo = Database::conn();
    
    echo "Running Field Service & GPS Tracking migration...\n";
    
    $sql = file_get_contents(__DIR__ . '/field_service_gps_tracking.sql');
    
    // Split by semicolons and execute each statement
    $statements = array_filter(array_map('trim', explode(';', $sql)));
    
    foreach ($statements as $statement) {
        if (empty($statement) || strpos($statement, '--') === 0) {
            continue;
        }
        
        try {
            $pdo->exec($statement);
            // Extract table name from CREATE TABLE statement
            if (preg_match('/CREATE TABLE IF NOT EXISTS\s+`?(\w+)`?/i', $statement, $matches)) {
                echo "✓ Created table: {$matches[1]}\n";
            }
        } catch (PDOException $e) {
            echo "✗ Error: " . $e->getMessage() . "\n";
        }
    }
    
    echo "\n✓ Migration completed successfully!\n";
    
} catch (Exception $e) {
    echo "✗ Migration failed: " . $e->getMessage() . "\n";
    exit(1);
}
