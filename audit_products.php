<?php
require_once __DIR__ . '/backend/src/Database.php';

try {
    $db = Database::conn();
    $stmt = $db->query("DESCRIBE products");
    $columns = $stmt->fetchAll(PDO::FETCH_COLUMN);
    
    $needed = ['recurring_interval', 'recurring_interval_count', 'trial_days', 'setup_fee'];
    
    echo "Checking for needed columns in products:\n";
    foreach ($needed as $col) {
        if (in_array($col, $columns)) {
            echo "[OK] $col exists\n";
        } else {
            echo "[MISSING] $col\n";
        }
    }
    
    echo "\nAll existing columns:\n";
    echo implode(", ", $columns) . "\n";
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
