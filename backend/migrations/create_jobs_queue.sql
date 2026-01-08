-- Phase 0: Background Jobs Queue System
-- Handles scheduled tasks like reminders, syncs, webhooks processing

CREATE TABLE IF NOT EXISTS jobs_queue (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NULL COMMENT 'NULL for system jobs',
    
    -- Job identification
    job_type VARCHAR(100) NOT NULL COMMENT 'appointment.reminder, invoice.send, calendar.sync, etc.',
    job_key VARCHAR(255) NULL COMMENT 'Unique key to prevent duplicates (e.g., appointment_reminder_123_24h)',
    
    -- Payload
    payload JSON NOT NULL,
    
    -- Scheduling
    scheduled_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    priority INT DEFAULT 0 COMMENT 'Higher = more urgent',
    
    -- Status
    status ENUM('pending', 'processing', 'completed', 'failed', 'cancelled') DEFAULT 'pending',
    
    -- Processing
    locked_by VARCHAR(100) NULL COMMENT 'Worker ID that locked this job',
    locked_at TIMESTAMP NULL,
    started_at TIMESTAMP NULL,
    completed_at TIMESTAMP NULL,
    
    -- Results
    result JSON NULL,
    error_message TEXT NULL,
    
    -- Retry handling
    attempts INT DEFAULT 0,
    max_attempts INT DEFAULT 3,
    next_retry_at TIMESTAMP NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE KEY uk_job_key (job_key),
    INDEX idx_jobs_pending (status, scheduled_at, priority DESC),
    INDEX idx_jobs_workspace (workspace_id, status, created_at DESC),
    INDEX idx_jobs_type (job_type, status),
    INDEX idx_jobs_locked (locked_by, locked_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Job execution history (for debugging and analytics)
CREATE TABLE IF NOT EXISTS jobs_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    job_id INT NULL,
    workspace_id INT NULL,
    
    job_type VARCHAR(100) NOT NULL,
    payload JSON NULL,
    
    status ENUM('completed', 'failed') NOT NULL,
    result JSON NULL,
    error_message TEXT NULL,
    
    duration_ms INT NULL,
    attempts INT DEFAULT 1,
    
    executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_history_workspace (workspace_id, executed_at DESC),
    INDEX idx_history_type (job_type, status, executed_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Scheduled/recurring jobs configuration
CREATE TABLE IF NOT EXISTS scheduled_jobs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NULL,
    
    name VARCHAR(100) NOT NULL,
    job_type VARCHAR(100) NOT NULL,
    
    -- Schedule (cron-like)
    schedule_type ENUM('interval', 'daily', 'weekly', 'monthly', 'cron') DEFAULT 'interval',
    interval_minutes INT NULL COMMENT 'For interval type',
    run_at_time TIME NULL COMMENT 'For daily/weekly/monthly',
    run_on_day INT NULL COMMENT 'Day of week (0-6) or month (1-31)',
    cron_expression VARCHAR(100) NULL,
    timezone VARCHAR(50) DEFAULT 'UTC',
    
    -- Payload template
    payload_template JSON NULL,
    
    -- Status
    is_active TINYINT(1) DEFAULT 1,
    last_run_at TIMESTAMP NULL,
    next_run_at TIMESTAMP NULL,
    last_status ENUM('success', 'failed') NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_scheduled_next (is_active, next_run_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default scheduled jobs
INSERT INTO scheduled_jobs (workspace_id, name, job_type, schedule_type, interval_minutes, is_active) VALUES
(NULL, 'Process Appointment Reminders', 'appointment.process_reminders', 'interval', 1, 1),
(NULL, 'Process Invoice Reminders', 'invoice.process_reminders', 'interval', 60, 1),
(NULL, 'Sync Calendars', 'calendar.sync_all', 'interval', 15, 1),
(NULL, 'Process Recurring Invoices', 'invoice.process_recurring', 'daily', NULL, 1),
(NULL, 'Cleanup Expired Sessions', 'system.cleanup_sessions', 'daily', NULL, 1),
(NULL, 'Sync Reviews', 'reviews.sync', 'interval', 60, 1)
ON DUPLICATE KEY UPDATE name = VALUES(name);
