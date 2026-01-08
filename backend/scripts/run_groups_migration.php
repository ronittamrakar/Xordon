<?php

require_once __DIR__ . '/src/Database.php';

try {
    $db = Database::conn();
    
    echo "Running groups table migration...\n";
    
    $sql = file_get_contents(__DIR__ . '/migrations/add_groups_table.sql');
    
    // Split by semicolon and execute each statement
    $statements = array_filter(array_map('trim', explode(';', $sql)));
    
    foreach ($statements as $statement) {
        if (!empty($statement)) {
            echo "Executing: " . substr($statement, 0, 50) . "...\n";
            try {
                $db->exec($statement);
                echo "✓ Success\n";
            } catch (Exception $e) {
                // Check if it's a "column already exists" error, which is OK
                if (strpos($e->getMessage(), 'Duplicate column name') !== false || 
                    strpos($e->getMessage(), 'already exists') !== false) {
                    echo "⚠ Column already exists, skipping\n";
                } else {
                    echo "✗ Error: " . $e->getMessage() . "\n";
                }
            }
        }
    }
    
    echo "\nMigration completed!\n";
    
    // Verify the table was created
    $stmt = $db->query("SHOW TABLES LIKE 'groups'");
    if ($stmt->rowCount() > 0) {
        echo "✓ Groups table exists\n";
        
        // Show table structure
        $stmt = $db->query("DESCRIBE groups");
        $columns = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo "\nGroups table structure:\n";
        foreach ($columns as $column) {
            echo "- {$column['Field']}: {$column['Type']}\n";
        }
    } else {
        echo "✗ Groups table not found\n";
    }
    
} catch (Exception $e) {
    echo "Migration failed: " . $e->getMessage() . "\n";
    exit(1);
}