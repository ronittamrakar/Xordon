<?php
require_once __DIR__ . '/backend/src/Database.php';

try {
    $db = Database::conn();
    $sql = "CREATE TABLE IF NOT EXISTS calendar_sync_settings (
        workspace_id INT PRIMARY KEY,
        auto_sync_interval_minutes INT DEFAULT 30,
        default_sync_direction ENUM('one_way_to_local', 'one_way_to_external', 'two_way') DEFAULT 'two_way',
        default_conflict_resolution ENUM('local_wins', 'external_wins', 'most_recent') DEFAULT 'most_recent',
        block_appointments_on_external_events BOOLEAN DEFAULT 1,
        show_external_events_in_calendar BOOLEAN DEFAULT 1,
        sync_past_days INT DEFAULT 30,
        sync_future_days INT DEFAULT 90,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )";
    $db->exec($sql);
    echo "Table calendar_sync_settings created successfully.\n";

    // Create calendar_connections if missing
    $sql = "CREATE TABLE IF NOT EXISTS calendar_connections (
        id VARCHAR(50) PRIMARY KEY,
        workspace_id INT,
        user_id INT,
        provider ENUM('google', 'outlook', 'apple', 'ical'),
        email VARCHAR(255),
        calendar_id VARCHAR(255),
        calendar_name VARCHAR(255),
        sync_enabled BOOLEAN DEFAULT 1,
        sync_direction ENUM('one_way_to_local', 'one_way_to_external', 'two_way') DEFAULT 'two_way',
        last_synced_at TIMESTAMP NULL,
        sync_status ENUM('active', 'paused', 'error') DEFAULT 'active',
        error_message TEXT,
        access_token_expires_at TIMESTAMP NULL,
        settings JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_workspace (workspace_id),
        INDEX idx_user (user_id)
    )";
    $db->exec($sql);
    echo "Table calendar_connections created successfully.\n";

} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
