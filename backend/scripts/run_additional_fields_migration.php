<?php
require_once __DIR__ . '/src/Database.php';

try {
    echo "Running additional contact fields migration...\n";
    
    $pdo = Database::conn();
    $sql = file_get_contents(__DIR__ . '/migrations/add_additional_contact_fields.sql');
    
    $statements = array_filter(array_map('trim', explode(';', $sql)));
    
    foreach ($statements as $stmt) {
        if (empty($stmt) || strpos($stmt, '--') === 0) {
            continue;
        }
        
        try {
            $pdo->exec($stmt);
            echo "✓ Executed: " . substr($stmt, 0, 60) . "...\n";
        } catch (Exception $e) {
            if (strpos($e->getMessage(), 'Duplicate') === false && 
                strpos($e->getMessage(), 'already exists') === false) {
                throw $e;
            }
            echo "⚠ Skipped (exists): " . substr($stmt, 0, 60) . "...\n";
        }
    }
    
    echo "\n✓ Migration completed!\n";
    
} catch (Exception $e) {
    echo "✗ Migration failed: " . $e->getMessage() . "\n";
    exit(1);
}
