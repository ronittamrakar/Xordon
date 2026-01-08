-- Integrations table for storing third-party integration configurations
CREATE TABLE IF NOT EXISTS integrations (
    id VARCHAR(64) PRIMARY KEY,
    user_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL, -- zapier, google_sheets, webhook, hubspot, salesforce, pipedrive
    config JSON,
    status VARCHAR(20) DEFAULT 'inactive', -- active, inactive, error
    last_tested TIMESTAMP NULL,
    error_message TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_integrations_user (user_id),
    INDEX idx_integrations_type (type),
    INDEX idx_integrations_status (status)
);

-- Webhook logs for debugging and monitoring
CREATE TABLE IF NOT EXISTS webhook_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    event VARCHAR(100) NOT NULL,
    payload JSON,
    results JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_webhook_logs_user (user_id),
    INDEX idx_webhook_logs_event (event),
    INDEX idx_webhook_logs_created (created_at)
);

-- Add zapier_api_key column to users table if not exists
ALTER TABLE users ADD COLUMN IF NOT EXISTS zapier_api_key VARCHAR(64) NULL;
