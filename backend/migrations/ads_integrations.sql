-- Phase 3: Ads Integrations
-- Google Ads, Facebook Ads, and advertising management

-- Ad accounts
CREATE TABLE IF NOT EXISTS ad_accounts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    
    -- Platform
    platform ENUM('google_ads', 'facebook_ads', 'microsoft_ads', 'linkedin_ads', 'tiktok_ads') NOT NULL,
    
    -- Account info
    platform_account_id VARCHAR(255) NOT NULL,
    account_name VARCHAR(255) NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    timezone VARCHAR(50) NULL,
    
    -- OAuth tokens (encrypted)
    access_token_encrypted TEXT NULL,
    refresh_token_encrypted TEXT NULL,
    token_expires_at TIMESTAMP NULL,
    
    -- Status
    status ENUM('connected', 'expired', 'error', 'disconnected') DEFAULT 'connected',
    error_message TEXT NULL,
    
    -- Sync settings
    sync_campaigns TINYINT(1) DEFAULT 1,
    sync_conversions TINYINT(1) DEFAULT 1,
    
    last_sync_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE KEY uk_workspace_platform_account (workspace_id, platform, platform_account_id),
    INDEX idx_ad_accounts_workspace (workspace_id, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Ad campaigns (synced from platforms)
CREATE TABLE IF NOT EXISTS ad_campaigns (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    ad_account_id INT NOT NULL,
    
    -- Platform reference
    platform_campaign_id VARCHAR(255) NOT NULL,
    
    -- Campaign info
    name VARCHAR(255) NOT NULL,
    status ENUM('enabled', 'paused', 'removed', 'ended') DEFAULT 'enabled',
    campaign_type VARCHAR(50) NULL COMMENT 'search, display, video, shopping, etc.',
    
    -- Budget
    daily_budget DECIMAL(12,2) NULL,
    total_budget DECIMAL(12,2) NULL,
    
    -- Dates
    start_date DATE NULL,
    end_date DATE NULL,
    
    -- Targeting summary
    targeting_summary TEXT NULL,
    
    last_sync_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE KEY uk_account_campaign (ad_account_id, platform_campaign_id),
    INDEX idx_campaigns_workspace (workspace_id, status),
    
    FOREIGN KEY (ad_account_id) REFERENCES ad_accounts(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Ad campaign metrics (daily)
CREATE TABLE IF NOT EXISTS ad_campaign_metrics (
    id INT AUTO_INCREMENT PRIMARY KEY,
    campaign_id INT NOT NULL,
    
    metric_date DATE NOT NULL,
    
    -- Spend
    spend DECIMAL(12,2) DEFAULT 0,
    
    -- Impressions & Clicks
    impressions INT DEFAULT 0,
    clicks INT DEFAULT 0,
    ctr DECIMAL(5,2) NULL COMMENT 'Click-through rate %',
    
    -- Conversions
    conversions INT DEFAULT 0,
    conversion_value DECIMAL(12,2) DEFAULT 0,
    cost_per_conversion DECIMAL(12,2) NULL,
    
    -- Engagement (for social ads)
    reach INT NULL,
    frequency DECIMAL(5,2) NULL,
    engagement INT NULL,
    
    -- Video metrics
    video_views INT NULL,
    video_view_rate DECIMAL(5,2) NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE KEY uk_campaign_date (campaign_id, metric_date),
    INDEX idx_metrics_date (metric_date),
    
    FOREIGN KEY (campaign_id) REFERENCES ad_campaigns(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Conversion tracking
CREATE TABLE IF NOT EXISTS ad_conversions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    ad_account_id INT NULL,
    campaign_id INT NULL,
    
    -- Conversion info
    conversion_name VARCHAR(255) NOT NULL,
    conversion_type VARCHAR(50) NULL COMMENT 'lead, purchase, signup, call, etc.',
    
    -- Attribution
    contact_id INT NULL,
    click_id VARCHAR(255) NULL COMMENT 'gclid, fbclid, etc.',
    
    -- Value
    conversion_value DECIMAL(12,2) NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    
    -- Source
    source VARCHAR(50) NULL,
    medium VARCHAR(50) NULL,
    campaign VARCHAR(255) NULL,
    
    converted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_conversions_workspace (workspace_id, converted_at DESC),
    INDEX idx_conversions_campaign (campaign_id),
    INDEX idx_conversions_contact (contact_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Ad spend budgets
CREATE TABLE IF NOT EXISTS ad_budgets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    
    -- Budget period
    period_type ENUM('monthly', 'quarterly', 'yearly') DEFAULT 'monthly',
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    
    -- Budget amounts
    total_budget DECIMAL(12,2) NOT NULL,
    spent DECIMAL(12,2) DEFAULT 0,
    remaining DECIMAL(12,2) GENERATED ALWAYS AS (total_budget - spent) STORED,
    
    -- Breakdown by platform
    google_ads_budget DECIMAL(12,2) NULL,
    facebook_ads_budget DECIMAL(12,2) NULL,
    other_budget DECIMAL(12,2) NULL,
    
    -- Alerts
    alert_threshold INT DEFAULT 80 COMMENT 'Alert when % spent',
    alert_sent TINYINT(1) DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_budgets_workspace (workspace_id, period_start)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Call tracking numbers for ads
CREATE TABLE IF NOT EXISTS ad_tracking_numbers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    
    -- Phone number
    tracking_number VARCHAR(20) NOT NULL,
    forward_to VARCHAR(20) NOT NULL,
    
    -- Source tracking
    source VARCHAR(50) NULL,
    campaign_id INT NULL,
    
    -- Stats
    total_calls INT DEFAULT 0,
    total_duration_seconds INT DEFAULT 0,
    
    is_active TINYINT(1) DEFAULT 1,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE KEY uk_tracking_number (tracking_number),
    INDEX idx_tracking_workspace (workspace_id, is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
