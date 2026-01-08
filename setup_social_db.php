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
        "CREATE TABLE IF NOT EXISTS social_accounts (
            id INT AUTO_INCREMENT PRIMARY KEY,
            workspace_id INT NOT NULL,
            company_id INT NOT NULL,
            platform VARCHAR(50) NOT NULL,
            account_type VARCHAR(50) DEFAULT 'user',
            platform_account_id VARCHAR(255) NOT NULL,
            account_name VARCHAR(255) NOT NULL,
            account_username VARCHAR(255),
            account_url VARCHAR(255),
            avatar_url TEXT,
            status VARCHAR(50) DEFAULT 'connected',
            can_post BOOLEAN DEFAULT 1,
            can_read_insights BOOLEAN DEFAULT 1,
            can_read_messages BOOLEAN DEFAULT 1,
            followers_count INT DEFAULT 0,
            following_count INT DEFAULT 0,
            posts_count INT DEFAULT 0,
            last_sync_at DATETIME,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            access_token_encrypted TEXT,
            refresh_token_encrypted TEXT,
            token_expires_at DATETIME,
            INDEX idx_company (company_id),
            INDEX idx_platform (platform)
        )",

        "CREATE TABLE IF NOT EXISTS social_posts (
            id INT AUTO_INCREMENT PRIMARY KEY,
            workspace_id INT NOT NULL,
            company_id INT NOT NULL,
            content TEXT,
            media_urls TEXT COMMENT 'JSON array',
            media_type VARCHAR(50) DEFAULT 'none',
            link_url TEXT,
            link_title VARCHAR(255),
            link_description TEXT,
            link_image TEXT,
            status VARCHAR(50) DEFAULT 'draft',
            scheduled_at DATETIME,
            published_at DATETIME,
            target_accounts TEXT COMMENT 'JSON array of social_account_ids',
            platform_settings TEXT COMMENT 'JSON object',
            campaign_id INT,
            category VARCHAR(50),
            requires_approval BOOLEAN DEFAULT 0,
            created_by INT,
            publish_results TEXT COMMENT 'JSON',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_company (company_id),
            INDEX idx_status (status),
            INDEX idx_scheduled (scheduled_at)
        )",

        "CREATE TABLE IF NOT EXISTS social_post_analytics (
            id INT AUTO_INCREMENT PRIMARY KEY,
            post_id INT NOT NULL,
            social_account_id INT NOT NULL,
            impressions INT DEFAULT 0,
            reach INT DEFAULT 0,
            likes INT DEFAULT 0,
            comments INT DEFAULT 0,
            shares INT DEFAULT 0,
            clicks INT DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE KEY unique_post_account (post_id, social_account_id),
            FOREIGN KEY (post_id) REFERENCES social_posts(id) ON DELETE CASCADE,
            FOREIGN KEY (social_account_id) REFERENCES social_accounts(id) ON DELETE CASCADE
        )",

        "CREATE TABLE IF NOT EXISTS social_categories (
            id INT AUTO_INCREMENT PRIMARY KEY,
            workspace_id INT NOT NULL,
            company_id INT NOT NULL,
            name VARCHAR(255) NOT NULL,
            color VARCHAR(50),
            description TEXT,
            default_times TEXT COMMENT 'JSON',
            sort_order INT DEFAULT 0,
            is_active BOOLEAN DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )",

        "CREATE TABLE IF NOT EXISTS social_templates (
            id INT AUTO_INCREMENT PRIMARY KEY,
            workspace_id INT NOT NULL,
            company_id INT NOT NULL,
            name VARCHAR(255) NOT NULL,
            content TEXT,
            media_urls TEXT COMMENT 'JSON',
            platforms TEXT COMMENT 'JSON',
            category_id INT,
            use_count INT DEFAULT 0,
            created_by INT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )",

        "CREATE TABLE IF NOT EXISTS hashtag_groups (
            id INT AUTO_INCREMENT PRIMARY KEY,
            workspace_id INT NOT NULL,
            company_id INT NOT NULL,
            name VARCHAR(255) NOT NULL,
            hashtags TEXT COMMENT 'JSON array of strings',
            platforms TEXT COMMENT 'JSON',
            use_count INT DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )"
    ];

    foreach ($queries as $sql) {
        $db->exec($sql);
        echo "Executed table creation.\n";
    }

    echo "Social tables setup complete.\n";

} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
