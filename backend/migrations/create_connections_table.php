<?php
require_once __DIR__ . '/../src/Database.php';

echo "=== Creating connections table ===\n\n";

try {
    $db = Database::conn();
    
    // Create connections table
    $sql = "CREATE TABLE IF NOT EXISTS connections (
        id VARCHAR(36) PRIMARY KEY,
        user_id VARCHAR(36) NOT NULL,
        name VARCHAR(255) NOT NULL,
        provider ENUM('signalwire', 'twilio', 'vonage') NOT NULL,
        status ENUM('active', 'inactive', 'error', 'testing') DEFAULT 'inactive',
        config JSON NOT NULL,
        phone_numbers JSON,
        error_message TEXT,
        last_sync_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_user_id (user_id),
        INDEX idx_provider (provider),
        INDEX idx_status (status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";
    
    $db->exec($sql);
    echo "✓ Connections table created successfully\n";
    
} catch (Exception $e) {
    echo "✗ Error: " . $e->getMessage() . "\n";
    exit(1);
}
