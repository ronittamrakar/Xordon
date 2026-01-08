-- Migration to support cold and warm campaign features

-- Add campaign_type and stop_on_reply to campaigns table
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS campaign_type ENUM('cold', 'warm') DEFAULT 'warm';
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS stop_on_reply TINYINT(1) DEFAULT 1;

-- Add replied_at to recipients table
ALTER TABLE recipients ADD COLUMN IF NOT EXISTS replied_at DATETIME NULL;

-- Create email_replies table for IMAP sync if it doesn't exist
CREATE TABLE IF NOT EXISTS email_replies (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    campaign_id INT NULL,
    recipient_id INT NULL,
    from_email VARCHAR(255) NOT NULL,
    to_email VARCHAR(255) NOT NULL,
    subject VARCHAR(255) NULL,
    body MEDIUMTEXT NULL,
    is_read TINYINT(1) DEFAULT 0,
    thread_id VARCHAR(100) NULL,
    message_id VARCHAR(255) NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_campaign_id (campaign_id),
    INDEX idx_recipient_id (recipient_id),
    INDEX idx_message_id (message_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
