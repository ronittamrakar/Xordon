<?php
require_once __DIR__ . '/../src/Database.php';

echo "=== Creating call_logs table ===\n\n";

try {
    $db = Database::conn();
    
    // Create call_logs table
    $sql = "CREATE TABLE IF NOT EXISTS call_logs (
        id VARCHAR(36) PRIMARY KEY,
        user_id VARCHAR(36) NOT NULL,
        campaign_id VARCHAR(36),
        recipient_id VARCHAR(36),
        phone_number VARCHAR(50) NOT NULL,
        caller_id VARCHAR(50),
        direction ENUM('outbound', 'inbound') DEFAULT 'outbound',
        status ENUM('initiated', 'ringing', 'answered', 'completed', 'busy', 'no-answer', 'failed', 'voicemail') NOT NULL,
        duration INT DEFAULT 0,
        started_at DATETIME,
        ended_at DATETIME,
        recording_url VARCHAR(500),
        notes TEXT,
        disposition VARCHAR(100),
        cost DECIMAL(10, 4) DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_user_id (user_id),
        INDEX idx_campaign_id (campaign_id),
        INDEX idx_recipient_id (recipient_id),
        INDEX idx_phone_number (phone_number),
        INDEX idx_status (status),
        INDEX idx_started_at (started_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";
    
    $db->exec($sql);
    echo "✓ Call logs table created successfully\n";
    
} catch (Exception $e) {
    echo "✗ Error: " . $e->getMessage() . "\n";
    exit(1);
}
