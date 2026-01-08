-- Ads Manager Tables Migration

-- Ad Accounts table (stores connected advertising platform accounts)
CREATE TABLE IF NOT EXISTS ad_accounts (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    workspace_id BIGINT UNSIGNED NOT NULL,
    platform VARCHAR(50) NOT NULL, -- 'google', 'facebook', 'instagram', 'linkedin', 'twitter'
    account_id VARCHAR(255) NOT NULL, -- Platform-specific account ID
    account_name VARCHAR(255) NOT NULL,
    access_token TEXT, -- OAuth access token (encrypted in production)
    refresh_token TEXT, -- OAuth refresh token (encrypted in production)
    access_token_expires_at DATETIME,
    status ENUM('active', 'disconnected', 'error') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_account (workspace_id, platform, account_id),
    INDEX idx_workspace (workspace_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Ad Campaigns table
CREATE TABLE IF NOT EXISTS ad_campaigns (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    account_id BIGINT UNSIGNED NOT NULL,
    budget_id BIGINT UNSIGNED NULL, -- Reference to ad_budgets
    campaign_id VARCHAR(255) NOT NULL, -- Platform-specific campaign ID
    name VARCHAR(255) NOT NULL,
    platform VARCHAR(50) NOT NULL,
    status ENUM('active', 'paused', 'ended', 'deleted') DEFAULT 'active',
    objective VARCHAR(100), -- 'conversions', 'traffic', 'awareness', 'engagement'
    daily_budget DECIMAL(10, 2),
    total_spent DECIMAL(10, 2) DEFAULT 0,
    impressions INT DEFAULT 0,
    clicks INT DEFAULT 0,
    conversions INT DEFAULT 0,
    ctr DECIMAL(5, 2) DEFAULT 0, -- Click-through rate
    cpc DECIMAL(10, 2) DEFAULT 0, -- Cost per click
    start_date DATE,
    end_date DATE,
    last_synced_at DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (account_id) REFERENCES ad_accounts(id) ON DELETE CASCADE,
    FOREIGN KEY (budget_id) REFERENCES ad_budgets(id) ON DELETE SET NULL,
    UNIQUE KEY unique_campaign (account_id, campaign_id),
    INDEX idx_account (account_id),
    INDEX idx_budget (budget_id),
    INDEX idx_status (status),
    INDEX idx_platform (platform)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Ad Budgets table (custom budget management)
CREATE TABLE IF NOT EXISTS ad_budgets (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    workspace_id BIGINT UNSIGNED NOT NULL,
    name VARCHAR(255) NOT NULL,
    total_budget DECIMAL(10, 2) NOT NULL,
    spent DECIMAL(10, 2) DEFAULT 0,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status ENUM('active', 'paused', 'completed', 'exceeded') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_workspace (workspace_id),
    INDEX idx_status (status),
    INDEX idx_dates (start_date, end_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Ad Conversions table (track conversion events)
CREATE TABLE IF NOT EXISTS ad_conversions (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    campaign_id BIGINT UNSIGNED NOT NULL,
    conversion_id VARCHAR(255), -- Platform-specific conversion ID
    conversion_type VARCHAR(100), -- 'purchase', 'signup', 'lead', 'download', etc.
    value DECIMAL(10, 2) DEFAULT 0, -- Conversion value in currency
    customer_email VARCHAR(255),
    customer_name VARCHAR(255),
    metadata JSON, -- Additional conversion data
    converted_at DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (campaign_id) REFERENCES ad_campaigns(id) ON DELETE CASCADE,
    INDEX idx_campaign (campaign_id),
    INDEX idx_type (conversion_type),
    INDEX idx_converted_at (converted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Ad Performance Metrics (daily snapshots for historical tracking)
CREATE TABLE IF NOT EXISTS ad_performance_metrics (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    campaign_id BIGINT UNSIGNED NOT NULL,
    date DATE NOT NULL,
    impressions INT DEFAULT 0,
    clicks INT DEFAULT 0,
    spent DECIMAL(10, 2) DEFAULT 0,
    conversions INT DEFAULT 0,
    conversion_value DECIMAL(10, 2) DEFAULT 0,
    ctr DECIMAL(5, 2) DEFAULT 0,
    cpc DECIMAL(10, 2) DEFAULT 0,
    cpa DECIMAL(10, 2) DEFAULT 0, -- Cost per acquisition
    roas DECIMAL(10, 2) DEFAULT 0, -- Return on ad spend
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (campaign_id) REFERENCES ad_campaigns(id) ON DELETE CASCADE,
    UNIQUE KEY unique_metric (campaign_id, date),
    INDEX idx_campaign (campaign_id),
    INDEX idx_date (date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert sample data for testing
INSERT INTO ad_accounts (workspace_id, platform, account_id, account_name, status) VALUES
(1, 'google', 'gads-123456', 'Google Ads Account', 'active'),
(1, 'facebook', 'fb-act-789012', 'Facebook Ad Account', 'active'),
(1, 'linkedin', 'li-123456', 'LinkedIn Ads', 'active');

INSERT INTO ad_budgets (workspace_id, name, total_budget, spent, start_date, end_date, status) VALUES
(1, 'Q1 2024 Campaign', 5000.00, 1250.00, '2024-01-01', '2024-03-31', 'active'),
(1, 'Product Launch', 10000.00, 3500.00, '2024-02-01', '2024-04-30', 'active'),
(1, 'Brand Awareness', 2500.00, 2100.00, '2024-01-15', '2024-02-15', 'completed');

INSERT INTO ad_campaigns (account_id, budget_id, campaign_id, name, platform, status, objective, daily_budget, total_spent, impressions, clicks, conversions, ctr, cpc, start_date, end_date) VALUES
(1, 1, 'gc-001', 'Search Campaign - Product Keywords', 'google', 'active', 'conversions', 150.00, 450.00, 12500, 380, 42, 3.04, 1.18, '2024-01-01', '2024-03-31'),
(1, 1, 'gc-002', 'Display Network - Remarketing', 'google', 'active', 'conversions', 100.00, 280.00, 45000, 540, 18, 1.20, 0.52, '2024-01-01', '2024-03-31'),
(2, 2, 'fb-001', 'Facebook Lead Gen Campaign', 'facebook', 'active', 'conversions', 200.00, 1850.00, 85000, 1200, 95, 1.41, 1.54, '2024-02-01', '2024-04-30'),
(2, 2, 'ig-001', 'Instagram Stories - Product Showcase', 'instagram', 'paused', 'traffic', 120.00, 840.00, 52000, 890, 12, 1.71, 0.94, '2024-02-01', '2024-04-30'),
(3, NULL, 'li-001', 'LinkedIn Sponsored Content - B2B', 'linkedin', 'active', 'engagement', 180.00, 520.00, 18500, 420, 28, 2.27, 1.24, '2024-01-15', '2024-12-31');

INSERT INTO ad_conversions (campaign_id, conversion_type, value, customer_email, converted_at) VALUES
(1, 'purchase', 89.99, 'customer1@example.com', '2024-02-15 14:23:00'),
(1, 'purchase', 129.99, 'customer2@example.com', '2024-02-16 09:45:00'),
(3, 'lead', 0.00, 'lead1@company.com', '2024-02-14 11:30:00'),
(3, 'lead', 0.00, 'lead2@company.com', '2024-02-15 16:20:00'),
(5, 'signup', 0.00, 'user@business.com', '2024-02-13 10:15:00');
