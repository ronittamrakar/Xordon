<?php
require_once __DIR__ . '/../backend/src/Database.php';

try {
    $pdo = Database::conn();
    echo "Connected to database.\n";

    // 1. Update booking_types table for Smart Scheduling
    echo "Updating booking_types table for Smart Scheduling...\n";
    $columns = [
        "ADD COLUMN smart_buffer_mode VARCHAR(20) DEFAULT 'fixed'",
        "ADD COLUMN overlap_prevention VARCHAR(20) DEFAULT 'strict'",
        "ADD COLUMN travel_time_minutes INT DEFAULT 0"
    ];
    
    foreach ($columns as $col) {
        try {
            $pdo->exec("ALTER TABLE booking_types $col");
            echo "Successfully executed: ALTER TABLE booking_types $col\n";
        } catch (PDOException $e) {
            // Check if error is "duplicate column name"
            if (strpos($e->getMessage(), "Duplicate column name") !== false) {
                echo "Column already exists (skipped): $col\n";
            } else {
                echo "Error executing '$col': " . $e->getMessage() . "\n";
            }
        }
    }

    echo "Schema updates (Round 2) completed.\n";

} catch (Exception $e) {
    echo "Fatal Error: " . $e->getMessage() . "\n";
    exit(1);
}
