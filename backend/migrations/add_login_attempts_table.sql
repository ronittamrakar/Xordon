-- Login Attempts Table for Brute-Force Protection
-- This table tracks failed login attempts to prevent brute-force attacks

CREATE TABLE IF NOT EXISTS login_attempts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    identifier VARCHAR(255) NOT NULL COMMENT 'IP address or email',
    identifier_type ENUM('ip', 'email') NOT NULL,
    attempt_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    success TINYINT(1) NOT NULL DEFAULT 0,
    user_agent VARCHAR(500) NULL,
    INDEX idx_identifier_type (identifier, identifier_type),
    INDEX idx_attempt_time (attempt_time),
    INDEX idx_cleanup (attempt_time, success)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add index for efficient cleanup queries
-- This allows quick deletion of old records
