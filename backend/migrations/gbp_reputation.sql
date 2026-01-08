-- Phase 2: Google Business Profile & Reputation Management
-- GBP integration, review management, and reputation monitoring

-- GBP account connections
CREATE TABLE IF NOT EXISTS gbp_accounts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    
    -- Google account
    google_account_id VARCHAR(255) NULL,
    google_email VARCHAR(255) NULL,
    
    -- GBP location
    location_id VARCHAR(255) NULL COMMENT 'accounts/xxx/locations/xxx',
    location_name VARCHAR(255) NULL,
    
    -- Business info
    business_name VARCHAR(255) NULL,
    address VARCHAR(500) NULL,
    phone VARCHAR(20) NULL,
    website VARCHAR(500) NULL,
    
    -- Categories
    primary_category VARCHAR(255) NULL,
    additional_categories JSON NULL,
    
    -- Status
    status ENUM('pending', 'connected', 'error', 'disconnected') DEFAULT 'pending',
    verification_status VARCHAR(50) NULL,
    
    -- Sync
    last_sync_at TIMESTAMP NULL,
    sync_error TEXT NULL,
    
    -- OAuth tokens (encrypted)
    access_token_encrypted TEXT NULL,
    refresh_token_encrypted TEXT NULL,
    token_expires_at TIMESTAMP NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE KEY uk_workspace (workspace_id),
    INDEX idx_gbp_location (location_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- GBP posts
CREATE TABLE IF NOT EXISTS gbp_posts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    gbp_account_id INT NOT NULL,
    
    -- Google reference
    google_post_id VARCHAR(255) NULL,
    
    -- Post content
    post_type ENUM('standard', 'event', 'offer', 'product') DEFAULT 'standard',
    summary TEXT NOT NULL,
    
    -- Media
    media_url VARCHAR(500) NULL,
    media_type ENUM('photo', 'video') NULL,
    
    -- Call to action
    cta_type ENUM('book', 'order', 'shop', 'learn_more', 'sign_up', 'call') NULL,
    cta_url VARCHAR(500) NULL,
    
    -- Event details (for event posts)
    event_title VARCHAR(255) NULL,
    event_start DATETIME NULL,
    event_end DATETIME NULL,
    
    -- Offer details (for offer posts)
    offer_code VARCHAR(50) NULL,
    offer_terms TEXT NULL,
    offer_start DATE NULL,
    offer_end DATE NULL,
    
    -- Status
    status ENUM('draft', 'scheduled', 'published', 'failed', 'deleted') DEFAULT 'draft',
    scheduled_at TIMESTAMP NULL,
    published_at TIMESTAMP NULL,
    error_message TEXT NULL,
    
    -- Metrics
    views INT DEFAULT 0,
    clicks INT DEFAULT 0,
    
    created_by INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_gbp_posts_workspace (workspace_id, status, created_at DESC),
    INDEX idx_gbp_posts_scheduled (status, scheduled_at),
    
    FOREIGN KEY (gbp_account_id) REFERENCES gbp_accounts(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Review platforms
CREATE TABLE IF NOT EXISTS review_platforms (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    
    platform VARCHAR(50) NOT NULL COMMENT 'google, yelp, facebook, tripadvisor, etc.',
    platform_name VARCHAR(100) NOT NULL,
    
    -- Platform-specific ID
    platform_account_id VARCHAR(255) NULL,
    platform_url VARCHAR(500) NULL,
    
    -- Status
    is_connected TINYINT(1) DEFAULT 0,
    is_active TINYINT(1) DEFAULT 1,
    
    -- Sync
    last_sync_at TIMESTAMP NULL,
    sync_error TEXT NULL,
    
    -- Stats
    total_reviews INT DEFAULT 0,
    average_rating DECIMAL(2,1) NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE KEY uk_workspace_platform (workspace_id, platform),
    INDEX idx_platforms_workspace (workspace_id, is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Reviews (from all platforms)
CREATE TABLE IF NOT EXISTS reviews (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    platform_id INT NULL,
    
    -- Platform reference
    platform VARCHAR(50) NOT NULL,
    platform_review_id VARCHAR(255) NULL,
    
    -- Reviewer
    reviewer_name VARCHAR(255) NULL,
    reviewer_avatar_url VARCHAR(500) NULL,
    reviewer_profile_url VARCHAR(500) NULL,
    
    -- Review content
    rating TINYINT NOT NULL COMMENT '1-5 stars',
    title VARCHAR(255) NULL,
    content TEXT NULL,
    
    -- Response
    response TEXT NULL,
    response_at TIMESTAMP NULL,
    responded_by INT NULL,
    
    -- Status
    status ENUM('new', 'read', 'responded', 'flagged', 'hidden') DEFAULT 'new',
    is_verified TINYINT(1) DEFAULT 0,
    
    -- Sentiment (AI-analyzed)
    sentiment ENUM('positive', 'neutral', 'negative') NULL,
    sentiment_score DECIMAL(3,2) NULL,
    
    -- Link to contact
    contact_id INT NULL,
    
    -- Timestamps
    review_date TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE KEY uk_platform_review (platform, platform_review_id),
    INDEX idx_reviews_workspace (workspace_id, status, review_date DESC),
    INDEX idx_reviews_platform (platform_id, review_date DESC),
    INDEX idx_reviews_rating (workspace_id, rating),
    INDEX idx_reviews_contact (contact_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Review request campaigns
CREATE TABLE IF NOT EXISTS review_request_campaigns (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    
    name VARCHAR(100) NOT NULL,
    
    -- Trigger
    trigger_type ENUM('manual', 'after_job', 'after_invoice_paid', 'after_appointment', 'scheduled') DEFAULT 'manual',
    trigger_delay_hours INT DEFAULT 24,
    
    -- Channels
    send_email TINYINT(1) DEFAULT 1,
    send_sms TINYINT(1) DEFAULT 0,
    
    -- Templates
    email_subject VARCHAR(255) NULL,
    email_body TEXT NULL,
    sms_body VARCHAR(500) NULL,
    
    -- Review link
    review_page_url VARCHAR(500) NULL COMMENT 'Custom review landing page',
    google_review_url VARCHAR(500) NULL,
    
    -- Settings
    is_active TINYINT(1) DEFAULT 1,
    
    -- Stats
    total_sent INT DEFAULT 0,
    total_opened INT DEFAULT 0,
    total_clicked INT DEFAULT 0,
    total_reviews INT DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_campaigns_workspace (workspace_id, is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Review requests sent
CREATE TABLE IF NOT EXISTS review_requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    campaign_id INT NULL,
    contact_id INT NOT NULL,
    
    -- Related entity
    entity_type VARCHAR(50) NULL COMMENT 'job, invoice, appointment',
    entity_id INT NULL,
    
    -- Delivery
    channel ENUM('email', 'sms') NOT NULL,
    sent_to VARCHAR(255) NOT NULL,
    sent_at TIMESTAMP NULL,
    
    -- Tracking
    opened_at TIMESTAMP NULL,
    clicked_at TIMESTAMP NULL,
    review_submitted_at TIMESTAMP NULL,
    review_id INT NULL,
    
    -- Status
    status ENUM('pending', 'sent', 'opened', 'clicked', 'reviewed', 'failed', 'unsubscribed') DEFAULT 'pending',
    error_message TEXT NULL,
    
    -- Unique tracking
    tracking_token VARCHAR(64) NOT NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE KEY uk_tracking_token (tracking_token),
    INDEX idx_requests_workspace (workspace_id, status, created_at DESC),
    INDEX idx_requests_contact (contact_id),
    INDEX idx_requests_campaign (campaign_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Review response templates
CREATE TABLE IF NOT EXISTS review_response_templates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    
    name VARCHAR(100) NOT NULL,
    
    -- Conditions
    rating_min TINYINT NULL,
    rating_max TINYINT NULL,
    sentiment ENUM('positive', 'neutral', 'negative') NULL,
    
    -- Template
    response_template TEXT NOT NULL,
    
    -- Usage
    use_count INT DEFAULT 0,
    
    is_active TINYINT(1) DEFAULT 1,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_templates_workspace (workspace_id, is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default response templates
INSERT INTO review_response_templates (workspace_id, name, rating_min, rating_max, sentiment, response_template) VALUES
(1, '5-Star Thank You', 5, 5, 'positive', 'Thank you so much for the wonderful 5-star review, {{reviewer_name}}! We truly appreciate your kind words and are thrilled that you had a great experience with us. We look forward to serving you again!'),
(1, '4-Star Thank You', 4, 4, 'positive', 'Thank you for the great review, {{reviewer_name}}! We''re glad you had a positive experience. If there''s anything we can do to earn that 5th star next time, please let us know!'),
(1, 'Neutral Response', 3, 3, 'neutral', 'Thank you for taking the time to leave a review, {{reviewer_name}}. We appreciate your feedback and would love the opportunity to improve your experience. Please reach out to us directly so we can address any concerns.'),
(1, 'Negative Response', 1, 2, 'negative', 'We''re sorry to hear about your experience, {{reviewer_name}}. This is not the level of service we strive for. Please contact us directly at {{business_phone}} so we can make this right.')
ON DUPLICATE KEY UPDATE name = VALUES(name);
