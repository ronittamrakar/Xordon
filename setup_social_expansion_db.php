<?php
require_once __DIR__ . '/backend/src/Database.php';

// Load .env
$envFile = __DIR__ . '/.env';
if (file_exists($envFile)) {
    $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos(trim($line), '#') === 0) continue;
        if (strpos($line, '=') !== false) {
            list($name, $value) = explode('=', $line, 2);
            $_ENV[trim($name)] = trim($value);
            putenv(sprintf('%s=%s', trim($name), trim($value)));
        }
    }
}

try {
    $db = Database::conn();
    echo "Connected to database.\n";

    $queries = [
        // Instagram Accounts
        "CREATE TABLE IF NOT EXISTS instagram_accounts (
            id INT AUTO_INCREMENT PRIMARY KEY,
            workspace_id INT NOT NULL,
            company_id INT NOT NULL,
            instagram_user_id VARCHAR(255) NOT NULL,
            username VARCHAR(255) NOT NULL,
            full_name VARCHAR(255),
            profile_picture_url TEXT,
            access_token TEXT,
            token_expires_at DATETIME,
            is_business_account BOOLEAN DEFAULT 0,
            connected_facebook_page_id VARCHAR(255),
            status VARCHAR(50) DEFAULT 'connected',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_company (company_id),
            INDEX idx_instagram_user (instagram_user_id)
        )",

        // Instagram Conversations
        "CREATE TABLE IF NOT EXISTS instagram_conversations (
            id INT AUTO_INCREMENT PRIMARY KEY,
            instagram_account_id INT NOT NULL,
            remote_thread_id VARCHAR(255) NOT NULL,
            contact_id INT,
            participant_username VARCHAR(255),
            participant_full_name VARCHAR(255),
            participant_profile_pic TEXT,
            last_message_content TEXT,
            last_message_at DATETIME,
            unread_count INT DEFAULT 0,
            status VARCHAR(50) DEFAULT 'active',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            UNIQUE KEY unique_thread (instagram_account_id, remote_thread_id),
            FOREIGN KEY (instagram_account_id) REFERENCES instagram_accounts(id) ON DELETE CASCADE
        )",

        // Instagram Messages
        "CREATE TABLE IF NOT EXISTS instagram_messages (
            id INT AUTO_INCREMENT PRIMARY KEY,
            conversation_id INT NOT NULL,
            remote_message_id VARCHAR(255) NOT NULL,
            direction ENUM('inbound', 'outbound') NOT NULL,
            content TEXT,
            media_url TEXT,
            media_type VARCHAR(50) DEFAULT 'text',
            status VARCHAR(50) DEFAULT 'sent',
            sent_at DATETIME,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_conversation (conversation_id),
            FOREIGN KEY (conversation_id) REFERENCES instagram_conversations(id) ON DELETE CASCADE
        )",

        // TikTok Accounts
        "CREATE TABLE IF NOT EXISTS tiktok_accounts (
            id INT AUTO_INCREMENT PRIMARY KEY,
            workspace_id INT NOT NULL,
            company_id INT NOT NULL,
            tiktok_open_id VARCHAR(255) NOT NULL,
            username VARCHAR(255) NOT NULL,
            display_name VARCHAR(255),
            avatar_url TEXT,
            access_token TEXT,
            refresh_token TEXT,
            token_expires_at DATETIME,
            refresh_expires_at DATETIME,
            status VARCHAR(50) DEFAULT 'connected',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_company (company_id),
            INDEX idx_tiktok_open (tiktok_open_id)
        )",

        // TikTok Conversations
        "CREATE TABLE IF NOT EXISTS tiktok_conversations (
            id INT AUTO_INCREMENT PRIMARY KEY,
            tiktok_account_id INT NOT NULL,
            conversation_id VARCHAR(255) NOT NULL,
            contact_id INT,
            participant_open_id VARCHAR(255),
            participant_username VARCHAR(255),
            participant_avatar TEXT,
            last_message_content TEXT,
            last_message_at DATETIME,
            unread_count INT DEFAULT 0,
            status VARCHAR(50) DEFAULT 'active',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            UNIQUE KEY unique_convo (tiktok_account_id, conversation_id),
            FOREIGN KEY (tiktok_account_id) REFERENCES tiktok_accounts(id) ON DELETE CASCADE
        )",

        // TikTok Messages
        "CREATE TABLE IF NOT EXISTS tiktok_messages (
            id INT AUTO_INCREMENT PRIMARY KEY,
            conversation_id INT NOT NULL,
            remote_message_id VARCHAR(255) NOT NULL,
            direction ENUM('inbound', 'outbound') NOT NULL,
            content TEXT,
            message_type VARCHAR(50) DEFAULT 'text',
            status VARCHAR(50) DEFAULT 'sent',
            sent_at DATETIME,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_conversation (conversation_id),
            FOREIGN KEY (conversation_id) REFERENCES tiktok_conversations(id) ON DELETE CASCADE
        )"
    ];

    foreach ($queries as $sql) {
        $db->exec($sql);
        echo "Executed table creation.\n";
    }

    echo "Social expansion tables setup complete.\n";

} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
