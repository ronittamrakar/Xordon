-- Phase 3: Advanced Features
-- Visual Builders, AI Features, Advanced Analytics, Mobile APIs, Enterprise Features

-- ============================================================================
-- VISUAL WORKFLOW BUILDER
-- ============================================================================

-- Enhanced workflows with visual builder data
ALTER TABLE workflows
ADD COLUMN IF NOT EXISTS canvas_data JSON NULL,
ADD COLUMN IF NOT EXISTS node_positions JSON NULL,
ADD COLUMN IF NOT EXISTS zoom_level DECIMAL(3,2) DEFAULT 1.0,
ADD COLUMN IF NOT EXISTS is_template BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS category VARCHAR(100) NULL,
ADD COLUMN IF NOT EXISTS tags JSON NULL;

-- Workflow nodes (steps in visual builder)
CREATE TABLE IF NOT EXISTS workflow_nodes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workflow_id INT NOT NULL,
    node_type VARCHAR(50) NOT NULL,
    node_config JSON NOT NULL,
    position_x INT NOT NULL,
    position_y INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_workflow (workflow_id),
    FOREIGN KEY (workflow_id) REFERENCES workflows(id) ON DELETE CASCADE
);

-- Workflow connections (edges between nodes)
CREATE TABLE IF NOT EXISTS workflow_connections (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workflow_id INT NOT NULL,
    source_node_id INT NOT NULL,
    target_node_id INT NOT NULL,
    condition_type VARCHAR(50) NULL,
    condition_config JSON NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_workflow (workflow_id),
    INDEX idx_source (source_node_id),
    INDEX idx_target (target_node_id),
    FOREIGN KEY (workflow_id) REFERENCES workflows(id) ON DELETE CASCADE
);

-- ============================================================================
-- AI FEATURES
-- ============================================================================

-- AI content generation history
CREATE TABLE IF NOT EXISTS ai_content_generations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    user_id INT NULL,
    content_type ENUM('email', 'sms', 'social', 'blog', 'ad_copy', 'subject_line') NOT NULL,
    prompt TEXT NOT NULL,
    generated_content TEXT NOT NULL,
    model VARCHAR(50) DEFAULT 'gpt-4',
    tokens_used INT DEFAULT 0,
    quality_rating INT NULL,
    was_used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_workspace (workspace_id),
    INDEX idx_user (user_id),
    INDEX idx_type (content_type),
    INDEX idx_created (created_at)
);

-- AI sentiment analysis results
CREATE TABLE IF NOT EXISTS ai_sentiment_analysis (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    entity_type ENUM('review', 'email', 'sms', 'chat', 'social') NOT NULL,
    entity_id INT NOT NULL,
    content TEXT NOT NULL,
    sentiment ENUM('positive', 'neutral', 'negative') NOT NULL,
    sentiment_score DECIMAL(3,2) NOT NULL,
    emotions JSON NULL,
    keywords JSON NULL,
    analyzed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_workspace (workspace_id),
    INDEX idx_entity (entity_type, entity_id),
    INDEX idx_sentiment (sentiment)
);

-- AI recommendations
CREATE TABLE IF NOT EXISTS ai_recommendations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    recommendation_type ENUM('campaign', 'content', 'timing', 'audience', 'product') NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    confidence_score DECIMAL(3,2) NOT NULL,
    data JSON NULL,
    status ENUM('pending', 'accepted', 'rejected', 'implemented') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_workspace (workspace_id),
    INDEX idx_type (recommendation_type),
    INDEX idx_status (status)
);

-- ============================================================================
-- ADVANCED ANALYTICS
-- ============================================================================

-- Custom dashboards
CREATE TABLE IF NOT EXISTS custom_dashboards (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    user_id INT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT NULL,
    layout JSON NOT NULL,
    widgets JSON NOT NULL,
    is_default BOOLEAN DEFAULT FALSE,
    is_shared BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_workspace (workspace_id),
    INDEX idx_user (user_id)
);

-- Analytics events (for custom tracking)
CREATE TABLE IF NOT EXISTS analytics_events (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    event_name VARCHAR(255) NOT NULL,
    properties JSON NULL,
    user_id INT NULL,
    contact_id INT NULL,
    session_id VARCHAR(64) NULL,
    ip_address VARCHAR(45) NULL,
    user_agent TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_workspace (workspace_id),
    INDEX idx_event_type (event_type),
    INDEX idx_event_name (event_name),
    INDEX idx_contact (contact_id),
    INDEX idx_created (created_at)
) ENGINE=InnoDB;

-- Funnel analytics
CREATE TABLE IF NOT EXISTS funnel_analytics (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    funnel_id INT NULL,
    date DATE NOT NULL,
    step_name VARCHAR(255) NOT NULL,
    step_order INT NOT NULL,
    visitors INT DEFAULT 0,
    conversions INT DEFAULT 0,
    conversion_rate DECIMAL(5,2) DEFAULT 0,
    avg_time_on_step INT DEFAULT 0,
    drop_off_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_funnel_step (workspace_id, funnel_id, date, step_name),
    INDEX idx_workspace (workspace_id),
    INDEX idx_funnel (funnel_id),
    INDEX idx_date (date)
);

-- Cohort analysis
CREATE TABLE IF NOT EXISTS cohort_analysis (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    cohort_date DATE NOT NULL,
    cohort_type ENUM('signup', 'first_purchase', 'campaign') NOT NULL,
    cohort_size INT NOT NULL,
    period_number INT NOT NULL,
    retained_count INT NOT NULL,
    retention_rate DECIMAL(5,2) NOT NULL,
    revenue DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_cohort (workspace_id, cohort_date, cohort_type, period_number),
    INDEX idx_workspace (workspace_id),
    INDEX idx_cohort_date (cohort_date),
    INDEX idx_type (cohort_type)
);

-- ============================================================================
-- MOBILE API & PUSH NOTIFICATIONS
-- ============================================================================

-- Mobile devices
CREATE TABLE IF NOT EXISTS mobile_devices (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    user_id INT NULL,
    contact_id INT NULL,
    device_type ENUM('ios', 'android') NOT NULL,
    device_token VARCHAR(255) NOT NULL,
    device_name VARCHAR(255) NULL,
    os_version VARCHAR(50) NULL,
    app_version VARCHAR(50) NULL,
    is_active BOOLEAN DEFAULT TRUE,
    last_active_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_device (device_token),
    INDEX idx_workspace (workspace_id),
    INDEX idx_user (user_id),
    INDEX idx_contact (contact_id)
);

-- Push notifications
CREATE TABLE IF NOT EXISTS push_notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    device_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    body TEXT NOT NULL,
    data JSON NULL,
    status ENUM('queued', 'sent', 'delivered', 'failed') DEFAULT 'queued',
    sent_at TIMESTAMP NULL,
    delivered_at TIMESTAMP NULL,
    error_message TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_workspace (workspace_id),
    INDEX idx_device (device_id),
    INDEX idx_status (status),
    FOREIGN KEY (device_id) REFERENCES mobile_devices(id) ON DELETE CASCADE
);

-- Mobile sessions
CREATE TABLE IF NOT EXISTS mobile_sessions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    device_id INT NOT NULL,
    session_id VARCHAR(64) NOT NULL,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMP NULL,
    duration_seconds INT NULL,
    screens_viewed INT DEFAULT 0,
    actions_performed INT DEFAULT 0,
    INDEX idx_workspace (workspace_id),
    INDEX idx_device (device_id),
    INDEX idx_session (session_id)
);

-- ============================================================================
-- ADVANCED REPORTING
-- ============================================================================

-- Scheduled reports
CREATE TABLE IF NOT EXISTS scheduled_reports (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    report_type VARCHAR(100) NOT NULL,
    frequency ENUM('daily', 'weekly', 'monthly') NOT NULL,
    recipients JSON NOT NULL,
    filters JSON NULL,
    format ENUM('pdf', 'csv', 'excel') DEFAULT 'pdf',
    is_active BOOLEAN DEFAULT TRUE,
    last_sent_at TIMESTAMP NULL,
    next_send_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_workspace (workspace_id),
    INDEX idx_next_send (next_send_at)
);

-- Report exports
CREATE TABLE IF NOT EXISTS report_exports (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    user_id INT NULL,
    report_type VARCHAR(100) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_url VARCHAR(500) NOT NULL,
    file_size INT NULL,
    format VARCHAR(20) NOT NULL,
    filters JSON NULL,
    status ENUM('processing', 'completed', 'failed') DEFAULT 'processing',
    expires_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_workspace (workspace_id),
    INDEX idx_user (user_id),
    INDEX idx_status (status)
);

-- ============================================================================
-- WHITE-LABEL & MULTI-BRAND
-- ============================================================================

-- Brand configurations
CREATE TABLE IF NOT EXISTS brand_configurations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    company_id INT NULL,
    brand_name VARCHAR(255) NOT NULL,
    logo_url VARCHAR(500) NULL,
    favicon_url VARCHAR(500) NULL,
    primary_color VARCHAR(7) NOT NULL,
    secondary_color VARCHAR(7) NULL,
    accent_color VARCHAR(7) NULL,
    font_family VARCHAR(100) NULL,
    custom_css TEXT NULL,
    custom_domain VARCHAR(255) NULL,
    email_from_name VARCHAR(255) NULL,
    email_from_address VARCHAR(255) NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_workspace (workspace_id),
    INDEX idx_company (company_id),
    INDEX idx_domain (custom_domain)
);

-- Email templates with brand support
ALTER TABLE templates
ADD COLUMN IF NOT EXISTS brand_id INT NULL,
ADD COLUMN IF NOT EXISTS supports_variables BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS preview_text VARCHAR(255) NULL;

-- Landing pages with brand support
ALTER TABLE landing_pages
ADD COLUMN IF NOT EXISTS brand_id INT NULL,
ADD COLUMN IF NOT EXISTS seo_title VARCHAR(255) NULL,
ADD COLUMN IF NOT EXISTS seo_description TEXT NULL,
ADD COLUMN IF NOT EXISTS seo_keywords VARCHAR(500) NULL,
ADD COLUMN IF NOT EXISTS og_image VARCHAR(500) NULL;

-- ============================================================================
-- ADVANCED AUTOMATION FEATURES
-- ============================================================================

-- Automation split tests
CREATE TABLE IF NOT EXISTS automation_split_tests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    automation_id INT NOT NULL,
    test_name VARCHAR(255) NOT NULL,
    variant_a_config JSON NOT NULL,
    variant_b_config JSON NOT NULL,
    traffic_split INT DEFAULT 50,
    winner_variant CHAR(1) NULL,
    status ENUM('draft', 'running', 'completed', 'paused') DEFAULT 'draft',
    started_at TIMESTAMP NULL,
    ended_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_automation (automation_id),
    INDEX idx_status (status)
);

-- Automation performance metrics
CREATE TABLE IF NOT EXISTS automation_metrics (
    id INT AUTO_INCREMENT PRIMARY KEY,
    automation_id INT NOT NULL,
    date DATE NOT NULL,
    contacts_entered INT DEFAULT 0,
    contacts_completed INT DEFAULT 0,
    contacts_exited INT DEFAULT 0,
    emails_sent INT DEFAULT 0,
    emails_opened INT DEFAULT 0,
    emails_clicked INT DEFAULT 0,
    conversions INT DEFAULT 0,
    revenue DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_automation_date (automation_id, date),
    INDEX idx_automation (automation_id),
    INDEX idx_date (date)
);

-- ============================================================================
-- ADVANCED INTEGRATIONS
-- ============================================================================

-- API keys for external integrations
CREATE TABLE IF NOT EXISTS api_keys (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    key_name VARCHAR(255) NOT NULL,
    api_key VARCHAR(64) UNIQUE NOT NULL,
    permissions JSON NOT NULL,
    rate_limit INT DEFAULT 1000,
    is_active BOOLEAN DEFAULT TRUE,
    last_used_at TIMESTAMP NULL,
    expires_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_workspace (workspace_id),
    INDEX idx_api_key (api_key)
);

-- Webhook logs (enhanced)
CREATE TABLE IF NOT EXISTS webhook_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    webhook_endpoint_id INT NULL,
    event_type VARCHAR(100) NOT NULL,
    payload JSON NOT NULL,
    response_status INT NULL,
    response_body TEXT NULL,
    attempt_count INT DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_workspace (workspace_id),
    INDEX idx_endpoint (webhook_endpoint_id),
    INDEX idx_event (event_type),
    INDEX idx_created (created_at)
) ENGINE=InnoDB;

-- ============================================================================
-- PERFORMANCE INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_analytics_events_workspace_date ON analytics_events(workspace_id, created_at);
CREATE INDEX IF NOT EXISTS idx_ai_content_workspace_type ON ai_content_generations(workspace_id, content_type, created_at);
CREATE INDEX IF NOT EXISTS idx_mobile_devices_active ON mobile_devices(workspace_id, is_active, last_active_at);
CREATE INDEX IF NOT EXISTS idx_push_notifications_status ON push_notifications(workspace_id, status, created_at);
