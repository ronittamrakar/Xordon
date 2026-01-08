<?php
require_once 'src/Database.php';

try {
    $pdo = Database::conn();
    
    // Check if sms_sending_accounts table exists
    $stmt = $pdo->query("SHOW TABLES LIKE 'sms_sending_accounts'");
    $exists = $stmt->fetch();
    
    if ($exists) {
        echo "sms_sending_accounts table already exists\n";
    } else {
        // Create the sms_sending_accounts table
        $sql = "CREATE TABLE IF NOT EXISTS sms_sending_accounts (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            name VARCHAR(255) NOT NULL,
            phone_number VARCHAR(20) NOT NULL,
            provider VARCHAR(50) NOT NULL DEFAULT 'signalwire',
            status VARCHAR(50) NOT NULL DEFAULT 'active',
            account_sid VARCHAR(255),
            auth_token VARCHAR(255),
            project_id VARCHAR(255),
            space_url VARCHAR(255),
            webhook_url VARCHAR(255),
            daily_limit INT DEFAULT 1000,
            sent_today INT DEFAULT 0,
            last_reset_date DATE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            UNIQUE KEY unique_user_phone (user_id, phone_number),
            KEY idx_user_status (user_id, status),
            KEY idx_phone_number (phone_number)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;";
        
        $pdo->exec($sql);
        echo "Created sms_sending_accounts table\n";
    }
    
    echo "SMS sending accounts migration completed successfully\n";
} catch (Exception $e) {
    echo "Migration failed: " . $e->getMessage() . "\n";
}