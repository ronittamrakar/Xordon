<?php
require_once 'src/Database.php';

echo "Running custom fields migration...\n";

try {
    $pdo = Database::conn();
    $sql = file_get_contents('migrations/add_custom_fields.sql');
    
    foreach (array_filter(array_map('trim', explode(';', $sql))) as $chunk) {
        if ($chunk !== '') {
            $pdo->exec($chunk);
            echo 'Executed: ' . substr($chunk, 0, 50) . "...\n";
        }
    }
    
    echo "Migration completed successfully!\n";
    
    // Verify the column was added
    $stmt = $pdo->query("SHOW COLUMNS FROM recipients LIKE 'custom_fields'");
    $column = $stmt->fetch();
    
    $hasCustomFields = $column !== false;
    
    if ($hasCustomFields) {
        echo "✓ custom_fields column added successfully!\n";
    } else {
        echo "✗ custom_fields column not found!\n";
    }
    
} catch (Exception $e) {
    echo "Migration failed: " . $e->getMessage() . "\n";
}