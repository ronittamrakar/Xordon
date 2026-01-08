-- Time-Zone Aware Sending & Send-Time Optimization

CREATE TABLE IF NOT EXISTS send_time_analytics (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    contact_id INT NOT NULL,
    channel ENUM('email', 'sms') NOT NULL,
    hour_of_day TINYINT NOT NULL,
    day_of_week TINYINT NOT NULL,
    opens INT DEFAULT 0,
    clicks INT DEFAULT 0,
    replies INT DEFAULT 0,
    total_sent INT DEFAULT 0,
    engagement_score DECIMAL(5,2) DEFAULT 0,
    last_updated DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_contact_time (contact_id, channel, hour_of_day, day_of_week),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS campaign_send_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    campaign_id INT NOT NULL,
    campaign_type ENUM('email', 'sms') NOT NULL,
    send_mode ENUM('immediate', 'scheduled', 'timezone_optimized', 'ai_optimized') DEFAULT 'immediate',
    scheduled_time DATETIME,
    timezone_mode ENUM('sender', 'recipient', 'specific') DEFAULT 'sender',
    specific_timezone VARCHAR(50),
    send_window_start TIME DEFAULT '09:00:00',
    send_window_end TIME DEFAULT '18:00:00',
    exclude_weekends BOOLEAN DEFAULT FALSE,
    throttle_per_hour INT DEFAULT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_campaign (campaign_id, campaign_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
