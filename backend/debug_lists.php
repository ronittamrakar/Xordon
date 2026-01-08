<?php
require_once __DIR__ . '/src/Database.php';
require_once __DIR__ . '/src/Auth.php';

use Xordon\Database;

try {
    $pdo = Database::conn();
    
    echo "Checking contact_lists table...\n";
    $stmt = $pdo->query("SELECT * FROM contact_lists");
    $lists = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo "Found " . count($lists) . " lists:\n";
    foreach ($lists as $list) {
        print_r($list);
    }
    
    echo "\nColumn Check:\n";
    $stmt = $pdo->query("SHOW COLUMNS FROM contact_lists");
    $columns = $stmt->fetchAll(PDO::FETCH_ASSOC);
    foreach ($columns as $col) {
        echo $col['Field'] . " (" . $col['Type'] . ")\n";
    }

} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
