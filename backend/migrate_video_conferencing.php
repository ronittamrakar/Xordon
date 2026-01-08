<?php
/**
 * Migration: Add Video Conferencing Support
 * Adds video meeting fields to appointments and booking_types tables
 */

require_once __DIR__ . '/src/Database.php';

try {
    $pdo = Database::conn();
    
    echo "Starting video conferencing migration...\n\n";
    
    // Add video fields to appointments table
    echo "1. Adding video fields to appointments table...\n";
    
    $appointmentsColumns = [
        "ALTER TABLE appointments ADD COLUMN IF NOT EXISTS video_provider ENUM('none', 'zoom', 'google_meet', 'microsoft_teams') DEFAULT 'none' AFTER location_details",
        "ALTER TABLE appointments ADD COLUMN IF NOT EXISTS video_meeting_url VARCHAR(500) NULL AFTER video_provider",
        "ALTER TABLE appointments ADD COLUMN IF NOT EXISTS video_meeting_id VARCHAR(255) NULL AFTER video_meeting_url",
        "ALTER TABLE appointments ADD COLUMN IF NOT EXISTS video_meeting_password VARCHAR(100) NULL AFTER video_meeting_id",
        "ALTER TABLE appointments ADD COLUMN IF NOT EXISTS video_provider_data JSON NULL AFTER video_meeting_password COMMENT 'Stores provider-specific data like join URLs, host keys, etc.'"
    ];
    
    foreach ($appointmentsColumns as $sql) {
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
    
    // Add video fields to booking_types table
    echo "\n2. Adding video fields to booking_types table...\n";
    
    $bookingTypesColumns = [
        "ALTER TABLE booking_types ADD COLUMN IF NOT EXISTS auto_generate_video_link TINYINT(1) DEFAULT 0 AFTER location_details COMMENT 'Automatically create video meeting link when booked'",
        "ALTER TABLE booking_types ADD COLUMN IF NOT EXISTS preferred_video_provider ENUM('none', 'zoom', 'google_meet', 'microsoft_teams') DEFAULT 'none' AFTER auto_generate_video_link"
    ];
    
    foreach ($bookingTypesColumns as $sql) {
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
    
    // Create video_provider_connections table
    echo "\n3. Creating video_provider_connections table...\n";
    
    $createTableSQL = "
    CREATE TABLE IF NOT EXISTS video_provider_connections (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        workspace_id INT NULL,
        provider ENUM('zoom', 'google_meet', 'microsoft_teams') NOT NULL,
        access_token TEXT NOT NULL,
        refresh_token TEXT NULL,
        token_expires_at DATETIME NULL,
        provider_user_id VARCHAR(255) NULL COMMENT 'User ID from the video provider',
        provider_email VARCHAR(255) NULL,
        provider_data JSON NULL COMMENT 'Additional provider-specific data',
        is_active TINYINT(1) DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY unique_user_provider (user_id, provider),
        INDEX idx_workspace (workspace_id),
        INDEX idx_provider (provider)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ";
    
    try {
        $pdo->exec($createTableSQL);
        echo "  ✓ Table created successfully\n";
    } catch (PDOException $e) {
        if (strpos($e->getMessage(), 'already exists') !== false) {
            echo "  - Table already exists\n";
        } else {
            echo "  ✗ Error: " . $e->getMessage() . "\n";
        }
    }
    
    // Create video_meetings_log table for tracking
    echo "\n4. Creating video_meetings_log table...\n";
    
    $createLogTableSQL = "
    CREATE TABLE IF NOT EXISTS video_meetings_log (
        id INT AUTO_INCREMENT PRIMARY KEY,
        appointment_id INT NOT NULL,
        provider ENUM('zoom', 'google_meet', 'microsoft_teams') NOT NULL,
        meeting_id VARCHAR(255) NOT NULL,
        action ENUM('created', 'updated', 'deleted', 'started', 'ended') NOT NULL,
        response_data JSON NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_appointment (appointment_id),
        INDEX idx_provider (provider),
        FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ";
    
    try {
        $pdo->exec($createLogTableSQL);
        echo "  ✓ Table created successfully\n";
    } catch (PDOException $e) {
        if (strpos($e->getMessage(), 'already exists') !== false) {
            echo "  - Table already exists\n";
        } else {
            echo "  ✗ Error: " . $e->getMessage() . "\n";
        }
    }
    
    echo "\n✅ Video conferencing migration completed successfully!\n";
    
} catch (Exception $e) {
    echo "\n❌ Migration failed: " . $e->getMessage() . "\n";
    exit(1);
}
