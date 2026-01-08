<?php
require_once __DIR__ . '/backend/src/Database.php';

try {
    $db = Database::conn();
    $stmt = $db->query("DESCRIBE products");
    $columns = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo "Columns in products table:\n";
    foreach ($columns as $column) {
        printf("%-30s %-20s\n", $column['Field'], $column['Type']);
    }
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
