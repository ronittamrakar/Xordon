<?php
require_once __DIR__ . '/../backend/src/Database.php';

try {
    $pdo = Database::conn();
    echo "Connected to database.\n";

    // 1. Update booking_types table
    echo "Updating booking_types table...\n";
    $columns = [
        "ADD COLUMN is_group_event BOOLEAN DEFAULT FALSE",
        "ADD COLUMN max_participants INT DEFAULT 1",
        "ADD COLUMN min_participants INT DEFAULT 1",
        "ADD COLUMN waitlist_enabled BOOLEAN DEFAULT FALSE",
        "ADD COLUMN participant_confirmation BOOLEAN DEFAULT FALSE"
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

    // 2. Update availability_schedules table
    echo "Updating availability_schedules table...\n";
    try {
        $pdo->exec("ALTER TABLE availability_schedules ADD COLUMN advanced_settings JSON DEFAULT NULL");
        echo "Successfully added 'advanced_settings' to availability_schedules\n";
    } catch (PDOException $e) {
        if (strpos($e->getMessage(), "Duplicate column name") !== false) {
            echo "Column 'advanced_settings' already exists in availability_schedules\n";
        } else {
             echo "Error adding 'advanced_settings': " . $e->getMessage() . "\n";
        }
    }

    // 3. Update appointments table
    echo "Updating appointments table...\n";
     try {
        $pdo->exec("ALTER TABLE appointments ADD COLUMN payment_status VARCHAR(50) DEFAULT 'unpaid'");
        echo "Successfully added 'payment_status' to appointments\n";
    } catch (PDOException $e) {
        if (strpos($e->getMessage(), "Duplicate column name") !== false) {
            echo "Column 'payment_status' already exists in appointments\n";
        } else {
             echo "Error adding 'payment_status': " . $e->getMessage() . "\n";
        }
    }

    // 4. Update staff_members table
    echo "Updating staff_members table...\n";
    try {
        $pdo->exec("ALTER TABLE staff_members ADD COLUMN timezone VARCHAR(100) DEFAULT 'UTC'");
        echo "Successfully added 'timezone' to staff_members\n";
    } catch (PDOException $e) {
        if (strpos($e->getMessage(), "Duplicate column name") !== false) {
            echo "Column 'timezone' already exists in staff_members\n";
        } else {
             echo "Error adding 'timezone': " . $e->getMessage() . "\n";
        }
    }

    echo "Schema updates completed.\n";

} catch (Exception $e) {
    echo "Fatal Error: " . $e->getMessage() . "\n";
    exit(1);
}
