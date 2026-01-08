<?php
/**
 * Run All Affiliate Migrations
 */

require_once __DIR__ . '/../src/Database.php';

use Xordon\Database;

try {
    $db = Database::conn();
    
    echo "Running Affiliate Migrations...\n";
    
    $migrationFiles = [
        'add_affiliates_program.sql',
        'add_affiliate_settings.sql'
    ];

    foreach ($migrationFiles as $file) {
        $sqlFile = __DIR__ . '/../migrations/' . $file;
        if (!file_exists($sqlFile)) {
            echo "Skipping $file: File not found\n";
            continue;
        }
        
        echo "Executing $file...\n";
        $sql = file_get_contents($sqlFile);
        
        // Remove comments
        $sql = preg_replace('/--.*$/m', '', $sql);
        
        // Split into individual statements
        $statements = array_filter(
            array_map('trim', explode(';', $sql)),
            fn($stmt) => !empty($stmt)
        );
        
        foreach ($statements as $statement) {
            try {
                $db->exec($statement);
            } catch (PDOException $e) {
                // Ignore table already exists errors
                if (strpos($e->getMessage(), 'already exists') === false) {
                    echo "Error in $file: " . $e->getMessage() . "\n";
                }
            }
        }
    }
    
    echo "Migrations completed successfully!\n";
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
    exit(1);
}
