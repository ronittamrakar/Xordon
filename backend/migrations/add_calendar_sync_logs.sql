-- Calendar Sync Logs Table
CREATE TABLE IF NOT EXISTS calendar_sync_logs (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    calendar_id INT UNSIGNED NOT NULL,
    provider ENUM('google', 'outlook') NOT NULL,
    direction ENUM('import', 'export', 'disconnect') NOT NULL,
    status ENUM('success', 'failed', 'partial') NOT NULL,
    details TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_calendar_provider (calendar_id, provider),
    INDEX idx_status (status),
    INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add external_id and external_source to calendar_blocks if not exists
ALTER TABLE calendar_blocks 
ADD COLUMN IF NOT EXISTS external_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS external_source ENUM('google', 'outlook'),
ADD UNIQUE INDEX IF NOT EXISTS idx_external (calendar_id, external_source, external_id);
