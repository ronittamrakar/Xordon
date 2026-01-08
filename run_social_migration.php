<?php
/**
 * Migration for Social Media Posting Engine missing tables
 */

require_once __DIR__ . '/backend/src/Database.php';

try {
    $db = Database::conn();

    $queries = [
        "Social Accounts Table" => "CREATE TABLE IF NOT EXISTS social_accounts (
            id INT AUTO_INCREMENT PRIMARY KEY,
            workspace_id INT NOT NULL,
            company_id INT NOT NULL,
            platform ENUM('facebook', 'instagram', 'linkedin', 'twitter', 'tiktok') NOT NULL,
            external_id VARCHAR(255) NOT NULL,
            name VARCHAR(255) NOT NULL,
            avatar_url TEXT,
            access_token TEXT,
            refresh_token TEXT,
            token_expires_at DATETIME,
            status ENUM('active', 'expired', 'error', 'disconnected') DEFAULT 'active',
            last_sync_at DATETIME,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_social_acc_workspace (workspace_id),
            UNIQUE KEY unique_platform_external (platform, external_id)
        )",

        "Social Posts Table" => "CREATE TABLE IF NOT EXISTS social_posts (
            id INT AUTO_INCREMENT PRIMARY KEY,
            workspace_id INT NOT NULL,
            company_id INT NOT NULL,
            content TEXT NOT NULL,
            media_urls JSON,
            status ENUM('draft', 'scheduled', 'published', 'failed') DEFAULT 'draft',
            created_by INT,
            published_at DATETIME,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_social_post_workspace (workspace_id)
        )"
    ];

    foreach ($queries as $name => $sql) {
        echo "Creating $name...\n";
        $db->exec($sql);
    }

    echo "Migration completed successfully!\n";
} catch (Exception $e) {
    die("Migration failed: " . $e->getMessage() . "\n");
}
