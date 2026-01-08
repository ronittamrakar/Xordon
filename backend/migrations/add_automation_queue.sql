-- Automation Execution Queue
-- Stores pending automation actions to be processed by a worker/cron

CREATE TABLE IF NOT EXISTS automation_queue (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    automation_id INT NULL,
    flow_id INT NULL,
    contact_id INT NOT NULL,
    action_type VARCHAR(100) NOT NULL,
    action_config JSON NOT NULL,
    priority INT DEFAULT 0,
    status ENUM('pending', 'processing', 'completed', 'failed', 'cancelled') DEFAULT 'pending',
    scheduled_for DATETIME NOT NULL,
    attempts INT DEFAULT 0,
    max_attempts INT DEFAULT 3,
    last_attempt_at DATETIME NULL,
    completed_at DATETIME NULL,
    error_message TEXT NULL,
    result JSON NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_queue_status (status, scheduled_for),
    INDEX idx_queue_user (user_id),
    INDEX idx_queue_automation (automation_id),
    INDEX idx_queue_flow (flow_id),
    INDEX idx_queue_contact (contact_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Automation execution logs (detailed history)
CREATE TABLE IF NOT EXISTS automation_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    automation_id INT NULL,
    flow_id INT NULL,
    queue_id INT NULL,
    contact_id INT NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    event_data JSON NULL,
    status ENUM('success', 'failed', 'skipped') DEFAULT 'success',
    error_message TEXT NULL,
    execution_time_ms INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_logs_automation (automation_id),
    INDEX idx_logs_flow (flow_id),
    INDEX idx_logs_contact (contact_id),
    INDEX idx_logs_created (created_at),
    INDEX idx_logs_event (event_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Automation rate limiting tracker
CREATE TABLE IF NOT EXISTS automation_rate_limits (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    channel VARCHAR(50) NOT NULL,
    period_start DATETIME NOT NULL,
    period_type ENUM('hour', 'day') NOT NULL,
    count INT DEFAULT 0,
    UNIQUE KEY unique_rate_limit (user_id, channel, period_start, period_type),
    INDEX idx_rate_user_channel (user_id, channel)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
