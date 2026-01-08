<?php
require_once 'backend/src/Database.php';
try {
    $pdo = Database::conn();
    
    // Add call_flow_id to phone_numbers
    $pdo->exec("ALTER TABLE phone_numbers ADD COLUMN IF NOT EXISTS call_flow_id INT(11) NULL AFTER destination_type");
    $pdo->exec("ALTER TABLE phone_numbers ADD CONSTRAINT fk_phone_numbers_call_flow FOREIGN KEY IF NOT EXISTS (call_flow_id) REFERENCES call_flows(id) ON DELETE SET NULL");
    
    echo "Schema updated successfully";
} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
