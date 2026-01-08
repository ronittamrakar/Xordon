<?php
require_once __DIR__ . '/backend/src/Database.php';

try {
    $db = Database::conn();
    $stmt = $db->query("SHOW TABLES LIKE 'customer_subscriptions'");
    $table = $stmt->fetch();
    
    if ($table) {
        echo "Table customer_subscriptions EXISTS\n";
    } else {
        echo "Table customer_subscriptions DOES NOT EXIST\n";
    }
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
