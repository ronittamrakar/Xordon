<?php
require_once __DIR__ . '/../src/Database.php';

try {
    $pdo = Database::conn();
    
    // Check if column exists
    $stmt = $pdo->query("SHOW COLUMNS FROM recipients LIKE 'technology'");
    if ($stmt->rowCount() == 0) {
        echo "Adding technology column to recipients table...\n";
        $pdo->exec("ALTER TABLE recipients ADD COLUMN technology TEXT DEFAULT NULL AFTER annual_revenue");
        echo "Column added successfully.\n";
    } else {
        echo "Column technology already exists.\n";
    }
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
    exit(1);
}
