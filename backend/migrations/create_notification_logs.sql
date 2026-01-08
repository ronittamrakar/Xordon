-- Notification logs table for tracking sent emails/SMS
CREATE TABLE IF NOT EXISTS notification_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    
    -- Delivery details
    channel ENUM('email', 'sms', 'push') NOT NULL,
    recipient VARCHAR(255) NOT NULL,
    subject VARCHAR(255) NULL,
    
    -- Status
    status ENUM('pending', 'sent', 'delivered', 'failed', 'bounced') DEFAULT 'pending',
    error_message TEXT NULL,
    
    -- Provider info
    provider VARCHAR(50) NULL,
    provider_message_id VARCHAR(255) NULL,
    
    -- Metadata
    metadata JSON NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_notification_logs_workspace (workspace_id, created_at DESC),
    INDEX idx_notification_logs_recipient (recipient, created_at DESC),
    INDEX idx_notification_logs_status (status, created_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
