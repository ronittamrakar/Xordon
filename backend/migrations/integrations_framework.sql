-- Phase 0: Integrations Framework
-- Standard connector framework for third-party services

CREATE TABLE IF NOT EXISTS integrations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    
    -- Provider identification
    provider VARCHAR(50) NOT NULL COMMENT 'stripe, google, twilio, signalwire, facebook, linkedin, quickbooks, etc.',
    provider_account_id VARCHAR(255) NULL COMMENT 'External account ID',
    provider_account_name VARCHAR(255) NULL COMMENT 'Display name from provider',
    
    -- Connection status
    status ENUM('disconnected', 'pending', 'connected', 'error', 'expired') DEFAULT 'disconnected',
    error_message TEXT NULL,
    last_error_at TIMESTAMP NULL,
    
    -- Credentials (encrypted in application layer)
    credentials_encrypted TEXT NULL COMMENT 'Encrypted JSON with tokens/keys',
    access_token_expires_at TIMESTAMP NULL,
    refresh_token_expires_at TIMESTAMP NULL,
    
    -- Scopes/permissions granted
    scopes JSON NULL COMMENT '["read", "write", "admin"]',
    
    -- Configuration
    config JSON NULL COMMENT 'Provider-specific settings',
    
    -- Sync state
    last_sync_at TIMESTAMP NULL,
    last_sync_status ENUM('success', 'partial', 'failed') NULL,
    sync_cursor VARCHAR(255) NULL COMMENT 'Pagination cursor for incremental sync',
    
    -- Metadata
    connected_by INT NULL COMMENT 'User who connected',
    connected_at TIMESTAMP NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE KEY uk_workspace_provider (workspace_id, provider),
    INDEX idx_integrations_provider (provider, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Webhook endpoints for receiving data from providers
CREATE TABLE IF NOT EXISTS integration_webhooks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NULL COMMENT 'NULL for global webhooks',
    integration_id INT NULL,
    
    -- Webhook identification
    provider VARCHAR(50) NOT NULL,
    webhook_id VARCHAR(255) NULL COMMENT 'ID from provider',
    endpoint_path VARCHAR(255) NOT NULL COMMENT 'Our endpoint path',
    secret VARCHAR(255) NULL COMMENT 'Webhook signing secret',
    
    -- Events subscribed
    events JSON NULL COMMENT '["payment.completed", "review.created"]',
    
    -- Status
    is_active TINYINT(1) DEFAULT 1,
    last_received_at TIMESTAMP NULL,
    last_status ENUM('success', 'failed', 'invalid_signature') NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_webhooks_provider (provider, is_active),
    INDEX idx_webhooks_path (endpoint_path)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Webhook delivery log
CREATE TABLE IF NOT EXISTS integration_webhook_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    webhook_id INT NULL,
    workspace_id INT NULL,
    
    -- Request details
    provider VARCHAR(50) NOT NULL,
    event_type VARCHAR(100) NULL,
    event_id VARCHAR(255) NULL COMMENT 'Provider event ID for deduplication',
    
    -- Payload
    headers JSON NULL,
    payload JSON NULL,
    
    -- Processing
    status ENUM('received', 'processing', 'processed', 'failed', 'ignored') DEFAULT 'received',
    error_message TEXT NULL,
    processed_at TIMESTAMP NULL,
    
    -- Response we sent
    response_code INT NULL,
    response_body TEXT NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_webhook_logs_provider (provider, created_at DESC),
    INDEX idx_webhook_logs_event (event_id),
    INDEX idx_webhook_logs_status (status, created_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Background sync jobs
CREATE TABLE IF NOT EXISTS integration_sync_jobs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    integration_id INT NOT NULL,
    
    -- Job details
    job_type VARCHAR(50) NOT NULL COMMENT 'full_sync, incremental_sync, import, export',
    entity_type VARCHAR(50) NULL COMMENT 'contacts, invoices, reviews, etc.',
    
    -- Status
    status ENUM('pending', 'running', 'completed', 'failed', 'cancelled') DEFAULT 'pending',
    progress INT DEFAULT 0 COMMENT 'Percentage 0-100',
    
    -- Results
    items_processed INT DEFAULT 0,
    items_created INT DEFAULT 0,
    items_updated INT DEFAULT 0,
    items_failed INT DEFAULT 0,
    error_log JSON NULL,
    
    -- Timing
    started_at TIMESTAMP NULL,
    completed_at TIMESTAMP NULL,
    
    -- Retry handling
    attempts INT DEFAULT 0,
    max_attempts INT DEFAULT 3,
    next_retry_at TIMESTAMP NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_sync_jobs_workspace (workspace_id, status, created_at DESC),
    INDEX idx_sync_jobs_pending (status, next_retry_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- OAuth state storage (for OAuth flow)
CREATE TABLE IF NOT EXISTS oauth_states (
    id INT AUTO_INCREMENT PRIMARY KEY,
    state VARCHAR(64) NOT NULL COMMENT 'Random state parameter',
    workspace_id INT NOT NULL,
    user_id INT NOT NULL,
    provider VARCHAR(50) NOT NULL,
    
    redirect_uri VARCHAR(500) NULL,
    scopes JSON NULL,
    
    expires_at TIMESTAMP NOT NULL,
    used_at TIMESTAMP NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE KEY uk_state (state),
    INDEX idx_oauth_expires (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
