<?php
/**
 * Migration: Add Appointment Automation Support
 * Adds tables and fields for appointment lifecycle automation
 */

require_once __DIR__ . '/src/Database.php';

try {
    $pdo = Database::conn();
    
    echo "Starting appointment automation migration...\n\n";
    
    // Add automation trigger fields to appointments table
    echo "1. Adding automation fields to appointments table...\n";
    
    $appointmentFields = [
        "ALTER TABLE appointments ADD COLUMN IF NOT EXISTS confirmation_sent_at DATETIME NULL AFTER updated_at",
        "ALTER TABLE appointments ADD COLUMN IF NOT EXISTS reminder_sent_at DATETIME NULL AFTER confirmation_sent_at",
        "ALTER TABLE appointments ADD COLUMN IF NOT EXISTS follow_up_sent_at DATETIME NULL AFTER reminder_sent_at",
        "ALTER TABLE appointments ADD COLUMN IF NOT EXISTS automation_triggered TINYINT(1) DEFAULT 0 AFTER follow_up_sent_at"
    ];
    
    foreach ($appointmentFields as $sql) {
        try {
            $pdo->exec($sql);
            echo "  ✓ " . substr($sql, 0, 80) . "...\n";
        } catch (PDOException $e) {
            if (strpos($e->getMessage(), 'Duplicate column') === false) {
                echo "  ✗ Error: " . $e->getMessage() . "\n";
            } else {
                echo "  - Column already exists\n";
            }
        }
    }
    
    // Create appointment_automation_logs table
    echo "\n2. Creating appointment_automation_logs table...\n";
    
    $createLogsTable = "
    CREATE TABLE IF NOT EXISTS appointment_automation_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        appointment_id INT NOT NULL,
        trigger_event ENUM('booked', 'cancelled', 'rescheduled', 'no_show', 'completed', 'reminder') NOT NULL,
        automation_id INT NULL COMMENT 'ID of automation that was triggered',
        workflow_id INT NULL COMMENT 'ID of workflow that was started',
        action_taken VARCHAR(255) NOT NULL COMMENT 'Description of action',
        success TINYINT(1) DEFAULT 1,
        error_message TEXT NULL,
        metadata JSON NULL COMMENT 'Additional data about the trigger',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_appointment (appointment_id),
        INDEX idx_trigger (trigger_event),
        INDEX idx_created (created_at),
        FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ";
    
    try {
        $pdo->exec($createLogsTable);
        echo "  ✓ Table created successfully\n";
    } catch (PDOException $e) {
        if (strpos($e->getMessage(), 'already exists') !== false) {
            echo "  - Table already exists\n";
        } else {
            echo "  ✗ Error: " . $e->getMessage() . "\n";
        }
    }
    
    // Create appointment_analytics table
    echo "\n3. Creating appointment_analytics table...\n";
    
    $createAnalyticsTable = "
    CREATE TABLE IF NOT EXISTS appointment_analytics (
        id INT AUTO_INCREMENT PRIMARY KEY,
        date DATE NOT NULL,
        booking_type_id INT NULL,
        staff_id INT NULL,
        workspace_id INT NULL,
        total_bookings INT DEFAULT 0,
        completed_bookings INT DEFAULT 0,
        cancelled_bookings INT DEFAULT 0,
        no_show_bookings INT DEFAULT 0,
        rescheduled_bookings INT DEFAULT 0,
        total_revenue DECIMAL(10,2) DEFAULT 0.00,
        average_booking_value DECIMAL(10,2) DEFAULT 0.00,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY unique_daily_stats (date, booking_type_id, staff_id, workspace_id),
        INDEX idx_date (date),
        INDEX idx_booking_type (booking_type_id),
        INDEX idx_staff (staff_id),
        INDEX idx_workspace (workspace_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ";
    
    try {
        $pdo->exec($createAnalyticsTable);
        echo "  ✓ Table created successfully\n";
    } catch (PDOException $e) {
        if (strpos($e->getMessage(), 'already exists') !== false) {
            echo "  - Table already exists\n";
        } else {
            echo "  ✗ Error: " . $e->getMessage() . "\n";
        }
    }
    
    // Create booking_page_analytics table
    echo "\n4. Creating booking_page_analytics table...\n";
    
    $createPageAnalyticsTable = "
    CREATE TABLE IF NOT EXISTS booking_page_analytics (
        id INT AUTO_INCREMENT PRIMARY KEY,
        booking_page_id INT NOT NULL,
        session_id VARCHAR(255) NOT NULL,
        step ENUM('page_view', 'service_selected', 'time_selected', 'form_started', 'form_completed', 'booking_confirmed') NOT NULL,
        service_id INT NULL,
        metadata JSON NULL,
        ip_address VARCHAR(45) NULL,
        user_agent TEXT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_booking_page (booking_page_id),
        INDEX idx_session (session_id),
        INDEX idx_step (step),
        INDEX idx_created (created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ";
    
    try {
        $pdo->exec($createPageAnalyticsTable);
        echo "  ✓ Table created successfully\n";
    } catch (PDOException $e) {
        if (strpos($e->getMessage(), 'already exists') !== false) {
            echo "  - Table already exists\n";
        } else {
            echo "  ✗ Error: " . $e->getMessage() . "\n";
        }
    }
    
    // Create appointment_reminders table
    echo "\n5. Creating appointment_reminders table...\n";
    
    $createRemindersTable = "
    CREATE TABLE IF NOT EXISTS appointment_reminders (
        id INT AUTO_INCREMENT PRIMARY KEY,
        booking_type_id INT NULL COMMENT 'Default reminders for booking type',
        appointment_id INT NULL COMMENT 'Specific reminder for appointment',
        reminder_type ENUM('email', 'sms', 'notification', 'webhook') NOT NULL DEFAULT 'email',
        send_before_minutes INT NOT NULL COMMENT 'Minutes before appointment to send',
        template_id INT NULL COMMENT 'Email/SMS template to use',
        custom_message TEXT NULL,
        sent TINYINT(1) DEFAULT 0,
        sent_at DATETIME NULL,
        scheduled_for DATETIME NULL COMMENT 'Calculated send time',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_booking_type (booking_type_id),
        INDEX idx_appointment (appointment_id),
        INDEX idx_scheduled (scheduled_for, sent),
        FOREIGN KEY (booking_type_id) REFERENCES booking_types(id) ON DELETE CASCADE,
        FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ";
    
    try {
        $pdo->exec($createRemindersTable);
        echo "  ✓ Table created successfully\n";
    } catch (PDOException $e) {
        if (strpos($e->getMessage(), 'already exists') !== false) {
            echo "  - Table already exists\n";
        } else {
            echo "  ✗ Error: " . $e->getMessage() . "\n";
        }
    }
    
    echo "\n✅ Appointment automation migration completed successfully!\n";
    
} catch (Exception $e) {
    echo "\n❌ Migration failed: " . $e->getMessage() . "\n";
    exit(1);
}
