-- Concurrency and distributed locking tables

-- Distributed locks table
CREATE TABLE IF NOT EXISTS distributed_locks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    lock_key VARCHAR(255) NOT NULL UNIQUE,
    lock_value VARCHAR(255) NOT NULL,
    expires_at DATETIME NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_expires_at (expires_at),
    INDEX idx_lock_key (lock_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Atomic counters table
CREATE TABLE IF NOT EXISTS atomic_counters (
    id INT AUTO_INCREMENT PRIMARY KEY,
    counter_key VARCHAR(255) NOT NULL UNIQUE,
    value BIGINT NOT NULL DEFAULT 0,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_counter_key (counter_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Task queue table
CREATE TABLE IF NOT EXISTS task_queue (
    id INT AUTO_INCREMENT PRIMARY KEY,
    task_type VARCHAR(100) NOT NULL,
    task_data JSON NOT NULL,
    priority INT NOT NULL DEFAULT 0,
    status ENUM('pending', 'processing', 'completed', 'failed') NOT NULL DEFAULT 'pending',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    started_at DATETIME NULL,
    completed_at DATETIME NULL,
    result JSON NULL,
    error_message TEXT NULL,
    INDEX idx_status_priority (status, priority DESC),
    INDEX idx_created_at (created_at),
    INDEX idx_task_type (task_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Rate limiting table
CREATE TABLE IF NOT EXISTS rate_limits (
    id INT AUTO_INCREMENT PRIMARY KEY,
    identifier VARCHAR(255) NOT NULL,
    window_start DATETIME NOT NULL,
    request_count INT NOT NULL DEFAULT 1,
    window_duration INT NOT NULL DEFAULT 300, -- 5 minutes in seconds
    max_requests INT NOT NULL DEFAULT 100,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_identifier_window (identifier, window_start),
    INDEX idx_identifier (identifier),
    INDEX idx_window_start (window_start)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Session management table for enhanced security
CREATE TABLE IF NOT EXISTS secure_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    session_id VARCHAR(255) NOT NULL UNIQUE,
    user_id INT NOT NULL,
    ip_address VARCHAR(45) NOT NULL,
    user_agent TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    last_activity DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_session_id (session_id),
    INDEX idx_expires_at (expires_at),
    INDEX idx_last_activity (last_activity),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Audit log table
CREATE TABLE IF NOT EXISTS audit_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NULL,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(100) NOT NULL,
    resource_id VARCHAR(255) NULL,
    old_values JSON NULL,
    new_values JSON NULL,
    ip_address VARCHAR(45) NOT NULL,
    user_agent TEXT NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_action (action),
    INDEX idx_resource_type (resource_type),
    INDEX idx_created_at (created_at),
    INDEX idx_ip_address (ip_address),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
