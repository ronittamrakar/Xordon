<?php
require_once __DIR__ . '/backend/src/Database.php';

try {
    $db = Database::conn();
    $stmt = $db->query("DESCRIBE products");
    $columns = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    foreach ($columns as $column) {
        echo $column['Field'] . " (" . $column['Type'] . ")\n";
    }
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
