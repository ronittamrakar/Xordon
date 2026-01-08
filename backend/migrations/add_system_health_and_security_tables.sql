-- Migration to add system health monitoring tables
-- These tables support the System Health Dashboard and Security Monitoring

-- System Health Snapshots for trend tracking
CREATE TABLE IF NOT EXISTS `system_health_snapshots` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `status` ENUM('healthy', 'yellow', 'red') NOT NULL DEFAULT 'healthy',
    `score` INT NOT NULL DEFAULT 100,
    `metrics` JSON NOT NULL COMMENT 'JSON storage for CPU, memory, disk, response time',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Security Events for Audit and Security Monitoring
CREATE TABLE IF NOT EXISTS `security_events` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `type` VARCHAR(50) NOT NULL COMMENT 'e.g., login_fail, rate_limit_exceeded, unauthorized_access',
    `severity` ENUM('info', 'low', 'medium', 'high', 'critical') DEFAULT 'info',
    `message` TEXT NOT NULL,
    `ip_address` VARCHAR(45) NULL,
    `user_id` INT NULL,
    `metadata` JSON NULL COMMENT 'Additional context like user agent, requested path, etc.',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_type` (`type`),
    INDEX `idx_severity` (`severity`),
    INDEX `idx_ip` (`ip_address`),
    INDEX `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
