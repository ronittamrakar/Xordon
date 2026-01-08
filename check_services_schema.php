<?php
require_once __DIR__ . '/backend/vendor/autoload.php';
require_once __DIR__ . '/backend/src/Database.php';

try {
    $pdo = Database::conn();
    $stmt = $pdo->query("DESCRIBE services");
    $columns = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo "Services table columns:\n";
    foreach ($columns as $col) {
        echo "- " . $col['Field'] . " (" . $col['Type'] . ")\n";
    }
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
