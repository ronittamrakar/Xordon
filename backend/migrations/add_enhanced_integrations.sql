-- Enhanced Integrations Module
-- Tables for broader integration support including CRM sync, webhooks, and OAuth

-- Integration providers catalog
CREATE TABLE IF NOT EXISTS integration_providers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    slug VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category ENUM('crm', 'email', 'calendar', 'payment', 'analytics', 'automation', 'communication', 'storage', 'other') NOT NULL,
    logo_url VARCHAR(500) NULL,
    auth_type ENUM('oauth2', 'api_key', 'basic', 'webhook', 'none') NOT NULL DEFAULT 'api_key',
    oauth_authorize_url VARCHAR(500) NULL,
    oauth_token_url VARCHAR(500) NULL,
    oauth_scopes TEXT NULL,
    documentation_url VARCHAR(500) NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- User integration connections
CREATE TABLE IF NOT EXISTS integration_connections (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    provider_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    status ENUM('active', 'inactive', 'error', 'expired') NOT NULL DEFAULT 'active',
    -- Auth credentials (encrypted)
    access_token_encrypted TEXT NULL,
    refresh_token_encrypted TEXT NULL,
    api_key_encrypted TEXT NULL,
    token_expires_at DATETIME NULL,
    -- Configuration
    config JSON NULL,
    sync_settings JSON NULL,
    -- Metadata
    external_account_id VARCHAR(255) NULL,
    external_account_name VARCHAR(255) NULL,
    last_sync_at DATETIME NULL,
    last_error TEXT NULL,
    error_count INT NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_connections_user (user_id),
    INDEX idx_connections_provider (provider_id),
    INDEX idx_connections_status (status),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (provider_id) REFERENCES integration_providers(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Webhook endpoints (outgoing)
CREATE TABLE IF NOT EXISTS webhook_endpoints (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    url VARCHAR(500) NOT NULL,
    secret VARCHAR(255) NULL,
    events JSON NOT NULL, -- ["contact.created", "campaign.sent", etc.]
    headers JSON NULL, -- Custom headers to send
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    last_triggered_at DATETIME NULL,
    success_count INT NOT NULL DEFAULT 0,
    failure_count INT NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_webhooks_user (user_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Webhook delivery log
CREATE TABLE IF NOT EXISTS webhook_deliveries (
    id INT AUTO_INCREMENT PRIMARY KEY,
    webhook_id INT NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    payload JSON NOT NULL,
    response_status INT NULL,
    response_body TEXT NULL,
    response_time_ms INT NULL,
    status ENUM('pending', 'success', 'failed', 'retrying') NOT NULL DEFAULT 'pending',
    attempts INT NOT NULL DEFAULT 0,
    next_retry_at DATETIME NULL,
    delivered_at DATETIME NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_deliveries_webhook (webhook_id),
    INDEX idx_deliveries_status (status),
    INDEX idx_deliveries_created (created_at),
    FOREIGN KEY (webhook_id) REFERENCES webhook_endpoints(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Incoming webhooks (for receiving data from external services)
CREATE TABLE IF NOT EXISTS incoming_webhooks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    token VARCHAR(64) NOT NULL UNIQUE,
    description TEXT,
    -- Actions to perform on webhook receipt
    action_type ENUM('create_contact', 'update_contact', 'add_tag', 'trigger_automation', 'custom') NOT NULL,
    action_config JSON NULL,
    field_mapping JSON NULL, -- Map incoming fields to contact fields
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    last_received_at DATETIME NULL,
    receive_count INT NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_incoming_user (user_id),
    INDEX idx_incoming_token (token),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Integration sync logs
CREATE TABLE IF NOT EXISTS integration_sync_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    connection_id INT NOT NULL,
    sync_type ENUM('full', 'incremental', 'manual') NOT NULL DEFAULT 'incremental',
    direction ENUM('import', 'export', 'bidirectional') NOT NULL DEFAULT 'bidirectional',
    status ENUM('running', 'completed', 'failed', 'cancelled') NOT NULL DEFAULT 'running',
    records_processed INT NOT NULL DEFAULT 0,
    records_created INT NOT NULL DEFAULT 0,
    records_updated INT NOT NULL DEFAULT 0,
    records_failed INT NOT NULL DEFAULT 0,
    error_details JSON NULL,
    started_at DATETIME NOT NULL,
    completed_at DATETIME NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_sync_logs_connection (connection_id),
    INDEX idx_sync_logs_status (status),
    FOREIGN KEY (connection_id) REFERENCES integration_connections(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Field mappings for integrations
CREATE TABLE IF NOT EXISTS integration_field_mappings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    connection_id INT NOT NULL,
    local_field VARCHAR(100) NOT NULL,
    remote_field VARCHAR(100) NOT NULL,
    direction ENUM('import', 'export', 'bidirectional') NOT NULL DEFAULT 'bidirectional',
    transform_type ENUM('none', 'lowercase', 'uppercase', 'date_format', 'custom') NOT NULL DEFAULT 'none',
    transform_config JSON NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_mappings_connection (connection_id),
    FOREIGN KEY (connection_id) REFERENCES integration_connections(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Insert default integration providers
INSERT INTO integration_providers (slug, name, description, category, auth_type, is_active) VALUES
('stripe', 'Stripe', 'Payment processing and subscription billing', 'payment', 'api_key', TRUE),
('paypal', 'PayPal', 'Online payments and invoicing', 'payment', 'oauth2', TRUE),
('google_calendar', 'Google Calendar', 'Calendar sync and scheduling', 'calendar', 'oauth2', TRUE),
('outlook_calendar', 'Outlook Calendar', 'Microsoft calendar integration', 'calendar', 'oauth2', TRUE),
('hubspot', 'HubSpot', 'CRM and marketing automation', 'crm', 'oauth2', TRUE),
('salesforce', 'Salesforce', 'Enterprise CRM platform', 'crm', 'oauth2', TRUE),
('pipedrive', 'Pipedrive', 'Sales CRM and pipeline management', 'crm', 'api_key', TRUE),
('zapier', 'Zapier', 'Workflow automation platform', 'automation', 'webhook', TRUE),
('make', 'Make (Integromat)', 'Visual automation platform', 'automation', 'webhook', TRUE),
('slack', 'Slack', 'Team communication and notifications', 'communication', 'oauth2', TRUE),
('google_sheets', 'Google Sheets', 'Spreadsheet data sync', 'storage', 'oauth2', TRUE),
('mailchimp', 'Mailchimp', 'Email marketing platform', 'email', 'api_key', TRUE),
('sendgrid', 'SendGrid', 'Email delivery service', 'email', 'api_key', TRUE),
('twilio', 'Twilio', 'SMS and voice communications', 'communication', 'api_key', TRUE),
('google_analytics', 'Google Analytics', 'Website analytics tracking', 'analytics', 'oauth2', TRUE)
ON DUPLICATE KEY UPDATE name = VALUES(name);
