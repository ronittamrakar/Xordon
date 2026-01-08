<?php
require_once __DIR__ . '/backend/src/Database.php';

try {
    $db = Database::conn();
    
    echo "Existing Contacts:\n";
    $contacts = $db->query("SELECT id, first_name, last_name, email FROM contacts LIMIT 5")->fetchAll(PDO::FETCH_ASSOC);
    foreach ($contacts as $c) {
        echo "ID: {$c['id']} - {$c['first_name']} {$c['last_name']} ({$c['email']})\n";
    }
    
    echo "\nExisting Recurring Products:\n";
    $products = $db->query("SELECT id, name, price, recurring_interval FROM products WHERE is_recurring = 1 LIMIT 5")->fetchAll(PDO::FETCH_ASSOC);
    foreach ($products as $p) {
        echo "ID: {$p['id']} - {$p['name']} ({$p['price']} / {$p['recurring_interval']})\n";
    }
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
