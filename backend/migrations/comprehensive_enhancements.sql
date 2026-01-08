-- Comprehensive Feature Enhancements
-- Deposits, Tipping, Partial Payments, Dunning, Webchat, WhatsApp, Review Monitoring, Webhooks

-- ============================================================================
-- PAYMENTS & INVOICING ENHANCEMENTS
-- ============================================================================

-- Add deposit and tipping support to invoices
ALTER TABLE invoices 
ADD COLUMN IF NOT EXISTS deposit_amount DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS deposit_paid DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS deposit_required BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS tip_amount DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS tip_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS allow_partial_payments BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS payment_terms TEXT,
ADD COLUMN IF NOT EXISTS late_fee_percentage DECIMAL(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS late_fee_amount DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS dunning_enabled BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS last_dunning_sent_at TIMESTAMP NULL,
ADD COLUMN IF NOT EXISTS dunning_count INT DEFAULT 0;

-- Payment transactions table for tracking partial payments
CREATE TABLE IF NOT EXISTS payment_transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    company_id INT NULL,
    invoice_id INT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    payment_method VARCHAR(50) DEFAULT 'manual',
    payment_type ENUM('full', 'partial', 'deposit', 'tip') DEFAULT 'partial',
    transaction_id VARCHAR(255) NULL,
    gateway VARCHAR(50) NULL,
    status ENUM('pending', 'completed', 'failed', 'refunded') DEFAULT 'completed',
    notes TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INT NULL,
    INDEX idx_workspace (workspace_id),
    INDEX idx_company (company_id),
    INDEX idx_invoice (invoice_id),
    INDEX idx_status (status),
    FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE
);

-- Dunning/reminder schedule
CREATE TABLE IF NOT EXISTS dunning_schedules (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    days_after_due INT NOT NULL,
    email_template_id INT NULL,
    sms_template_id INT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_workspace (workspace_id)
);

-- ============================================================================
-- WEBCHAT & OMNI-CHANNEL MESSAGING
-- ============================================================================

-- Webchat widget configurations
CREATE TABLE IF NOT EXISTS webchat_widgets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    company_id INT NULL,
    name VARCHAR(255) NOT NULL,
    widget_key VARCHAR(64) UNIQUE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Appearance
    theme_color VARCHAR(7) DEFAULT '#3b82f6',
    position ENUM('bottom-right', 'bottom-left', 'top-right', 'top-left') DEFAULT 'bottom-right',
    greeting_message TEXT,
    offline_message TEXT,
    
    -- Behavior
    auto_open BOOLEAN DEFAULT FALSE,
    auto_open_delay INT DEFAULT 5,
    show_agent_avatars BOOLEAN DEFAULT TRUE,
    enable_file_uploads BOOLEAN DEFAULT TRUE,
    enable_emojis BOOLEAN DEFAULT TRUE,
    
    -- Routing
    assigned_user_id INT NULL,
    assigned_team_id INT NULL,
    business_hours_only BOOLEAN DEFAULT FALSE,
    
    -- Integration
    domains_whitelist TEXT NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_workspace (workspace_id),
    INDEX idx_widget_key (widget_key)
);

-- Webchat sessions
CREATE TABLE IF NOT EXISTS webchat_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    widget_id INT NOT NULL,
    conversation_id INT NULL,
    session_key VARCHAR(64) UNIQUE NOT NULL,
    visitor_id VARCHAR(255) NULL,
    visitor_name VARCHAR(255) NULL,
    visitor_email VARCHAR(255) NULL,
    visitor_phone VARCHAR(50) NULL,
    
    -- Tracking
    ip_address VARCHAR(45) NULL,
    user_agent TEXT NULL,
    referrer TEXT NULL,
    current_page TEXT NULL,
    
    status ENUM('active', 'ended') DEFAULT 'active',
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMP NULL,
    
    INDEX idx_widget (widget_id),
    INDEX idx_conversation (conversation_id),
    INDEX idx_session_key (session_key),
    FOREIGN KEY (widget_id) REFERENCES webchat_widgets(id) ON DELETE CASCADE
);

-- Add channel support to conversations
ALTER TABLE conversations
ADD COLUMN IF NOT EXISTS channel ENUM('email', 'sms', 'call', 'webchat', 'whatsapp', 'facebook', 'instagram', 'gmb', 'note') DEFAULT 'email',
ADD COLUMN IF NOT EXISTS channel_identifier VARCHAR(255) NULL,
ADD COLUMN IF NOT EXISTS metadata JSON NULL;

-- Add channel to messages
ALTER TABLE conversation_messages
ADD COLUMN IF NOT EXISTS channel ENUM('email', 'sms', 'call', 'webchat', 'whatsapp', 'facebook', 'instagram', 'gmb', 'note', 'system') DEFAULT 'note',
ADD COLUMN IF NOT EXISTS media_urls JSON NULL,
ADD COLUMN IF NOT EXISTS metadata JSON NULL;

-- WhatsApp integration
CREATE TABLE IF NOT EXISTS whatsapp_accounts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    company_id INT NULL,
    provider ENUM('twilio', '360dialog', 'whatsapp_business') DEFAULT 'twilio',
    phone_number VARCHAR(50) NOT NULL,
    account_sid VARCHAR(255) NULL,
    auth_token VARCHAR(255) NULL,
    api_key VARCHAR(255) NULL,
    webhook_url VARCHAR(500) NULL,
    status ENUM('active', 'inactive', 'suspended') DEFAULT 'active',
    is_verified BOOLEAN DEFAULT FALSE,
    
    -- Settings
    business_profile JSON NULL,
    message_templates JSON NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_workspace (workspace_id),
    INDEX idx_phone (phone_number)
);

-- WhatsApp message log
CREATE TABLE IF NOT EXISTS whatsapp_messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    account_id INT NOT NULL,
    conversation_id INT NULL,
    contact_id INT NULL,
    
    direction ENUM('inbound', 'outbound') NOT NULL,
    from_number VARCHAR(50) NOT NULL,
    to_number VARCHAR(50) NOT NULL,
    
    message_type ENUM('text', 'image', 'video', 'audio', 'document', 'location', 'template') DEFAULT 'text',
    content TEXT NULL,
    media_url VARCHAR(500) NULL,
    media_type VARCHAR(50) NULL,
    
    external_id VARCHAR(255) NULL,
    status ENUM('queued', 'sent', 'delivered', 'read', 'failed') DEFAULT 'queued',
    error_message TEXT NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    delivered_at TIMESTAMP NULL,
    read_at TIMESTAMP NULL,
    
    INDEX idx_workspace (workspace_id),
    INDEX idx_account (account_id),
    INDEX idx_conversation (conversation_id),
    INDEX idx_contact (contact_id),
    INDEX idx_external_id (external_id),
    FOREIGN KEY (account_id) REFERENCES whatsapp_accounts(id) ON DELETE CASCADE
);

-- ============================================================================
-- REVIEW MONITORING & REPUTATION
-- ============================================================================

-- Review platform connections
CREATE TABLE IF NOT EXISTS review_platform_connections (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    company_id INT NULL,
    platform ENUM('google', 'facebook', 'yelp', 'trustpilot', 'g2', 'capterra', 'custom') NOT NULL,
    platform_name VARCHAR(255) NOT NULL,
    
    -- OAuth/API credentials
    access_token TEXT NULL,
    refresh_token TEXT NULL,
    token_expires_at TIMESTAMP NULL,
    api_key VARCHAR(255) NULL,
    
    -- Platform-specific IDs
    location_id VARCHAR(255) NULL,
    page_id VARCHAR(255) NULL,
    business_id VARCHAR(255) NULL,
    
    review_url VARCHAR(500) NULL,
    status ENUM('active', 'paused', 'disconnected', 'error') DEFAULT 'active',
    last_sync_at TIMESTAMP NULL,
    sync_frequency_minutes INT DEFAULT 60,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_workspace (workspace_id),
    INDEX idx_platform (platform),
    INDEX idx_status (status)
);

-- External reviews from monitoring
CREATE TABLE IF NOT EXISTS external_reviews (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    company_id INT NULL,
    connection_id INT NOT NULL,
    
    external_id VARCHAR(255) NOT NULL,
    platform VARCHAR(50) NOT NULL,
    
    reviewer_name VARCHAR(255) NULL,
    reviewer_avatar VARCHAR(500) NULL,
    reviewer_profile_url VARCHAR(500) NULL,
    
    rating INT NOT NULL,
    title TEXT NULL,
    content TEXT NOT NULL,
    
    review_url VARCHAR(500) NULL,
    review_date TIMESTAMP NOT NULL,
    
    -- Response tracking
    has_response BOOLEAN DEFAULT FALSE,
    response_text TEXT NULL,
    response_date TIMESTAMP NULL,
    responded_by INT NULL,
    
    -- Sentiment & status
    sentiment ENUM('positive', 'neutral', 'negative') NULL,
    status ENUM('new', 'read', 'responded', 'flagged', 'archived') DEFAULT 'new',
    
    -- Internal notes
    internal_notes TEXT NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE KEY unique_external_review (connection_id, external_id),
    INDEX idx_workspace (workspace_id),
    INDEX idx_company (company_id),
    INDEX idx_connection (connection_id),
    INDEX idx_platform (platform),
    INDEX idx_status (status),
    INDEX idx_sentiment (sentiment),
    INDEX idx_review_date (review_date),
    FOREIGN KEY (connection_id) REFERENCES review_platform_connections(id) ON DELETE CASCADE
);

-- Review response templates
CREATE TABLE IF NOT EXISTS review_response_templates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    category ENUM('positive', 'neutral', 'negative', 'general') DEFAULT 'general',
    template_text TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    usage_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_workspace (workspace_id),
    INDEX idx_category (category)
);

-- ============================================================================
-- WEBHOOKS & INTEGRATIONS
-- ============================================================================

-- Webhook endpoints
CREATE TABLE IF NOT EXISTS webhook_endpoints (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    url VARCHAR(500) NOT NULL,
    secret VARCHAR(255) NULL,
    
    -- Events to subscribe to
    events JSON NOT NULL,
    
    is_active BOOLEAN DEFAULT TRUE,
    retry_failed BOOLEAN DEFAULT TRUE,
    max_retries INT DEFAULT 3,
    
    -- Headers
    custom_headers JSON NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_workspace (workspace_id),
    INDEX idx_active (is_active)
);

-- Webhook delivery log
CREATE TABLE IF NOT EXISTS webhook_deliveries (
    id INT AUTO_INCREMENT PRIMARY KEY,
    endpoint_id INT NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    payload JSON NOT NULL,
    
    status ENUM('pending', 'success', 'failed') DEFAULT 'pending',
    http_status INT NULL,
    response_body TEXT NULL,
    error_message TEXT NULL,
    
    attempt_count INT DEFAULT 0,
    next_retry_at TIMESTAMP NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    delivered_at TIMESTAMP NULL,
    
    INDEX idx_endpoint (endpoint_id),
    INDEX idx_status (status),
    INDEX idx_event_type (event_type),
    INDEX idx_next_retry (next_retry_at),
    FOREIGN KEY (endpoint_id) REFERENCES webhook_endpoints(id) ON DELETE CASCADE
);

-- QuickBooks sync mappings
CREATE TABLE IF NOT EXISTS quickbooks_sync_mappings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    entity_type ENUM('customer', 'invoice', 'payment', 'product', 'expense') NOT NULL,
    local_id INT NOT NULL,
    quickbooks_id VARCHAR(255) NOT NULL,
    
    last_synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    sync_status ENUM('synced', 'pending', 'error') DEFAULT 'synced',
    error_message TEXT NULL,
    
    UNIQUE KEY unique_mapping (workspace_id, entity_type, local_id),
    INDEX idx_workspace (workspace_id),
    INDEX idx_qb_id (quickbooks_id),
    INDEX idx_entity (entity_type, local_id)
);

-- QuickBooks connection
CREATE TABLE IF NOT EXISTS quickbooks_connections (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL UNIQUE,
    realm_id VARCHAR(255) NOT NULL,
    access_token TEXT NOT NULL,
    refresh_token TEXT NOT NULL,
    token_expires_at TIMESTAMP NOT NULL,
    
    company_name VARCHAR(255) NULL,
    country VARCHAR(10) NULL,
    
    sync_enabled BOOLEAN DEFAULT TRUE,
    auto_sync_invoices BOOLEAN DEFAULT TRUE,
    auto_sync_payments BOOLEAN DEFAULT TRUE,
    auto_sync_customers BOOLEAN DEFAULT TRUE,
    
    last_sync_at TIMESTAMP NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_workspace (workspace_id)
);

-- ============================================================================
-- CLIENT PORTAL ENHANCEMENTS
-- ============================================================================

-- Portal branding per workspace
CREATE TABLE IF NOT EXISTS portal_branding (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL UNIQUE,
    
    logo_url VARCHAR(500) NULL,
    favicon_url VARCHAR(500) NULL,
    primary_color VARCHAR(7) DEFAULT '#3b82f6',
    secondary_color VARCHAR(7) DEFAULT '#1e40af',
    
    company_name VARCHAR(255) NULL,
    support_email VARCHAR(255) NULL,
    support_phone VARCHAR(50) NULL,
    
    custom_css TEXT NULL,
    custom_domain VARCHAR(255) NULL,
    
    show_powered_by BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_workspace (workspace_id)
);

-- Portal activity log
CREATE TABLE IF NOT EXISTS portal_activity_log (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    contact_id INT NOT NULL,
    
    activity_type ENUM('login', 'view_invoice', 'pay_invoice', 'view_proposal', 'approve_proposal', 'view_document', 'send_message') NOT NULL,
    entity_type VARCHAR(50) NULL,
    entity_id INT NULL,
    
    ip_address VARCHAR(45) NULL,
    user_agent TEXT NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_workspace (workspace_id),
    INDEX idx_contact (contact_id),
    INDEX idx_activity_type (activity_type),
    INDEX idx_created_at (created_at)
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_invoices_overdue ON invoices(workspace_id, status, due_date) WHERE status IN ('sent', 'partial');
CREATE INDEX IF NOT EXISTS idx_conversations_channel ON conversations(workspace_id, channel, status);
CREATE INDEX IF NOT EXISTS idx_messages_channel ON conversation_messages(conversation_id, channel, created_at);
