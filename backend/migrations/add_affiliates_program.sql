-- Affiliates Program Tables
-- Workspace-scoped affiliate management

CREATE TABLE IF NOT EXISTS affiliates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    status ENUM('active', 'pending', 'inactive', 'suspended') DEFAULT 'pending',
    commission_rate DECIMAL(5,2) DEFAULT 20.00 COMMENT 'Commission percentage',
    unique_code VARCHAR(50) NOT NULL UNIQUE COMMENT 'Unique referral code',
    referral_url VARCHAR(500) NULL,
    
    -- Tracking
    total_referrals INT DEFAULT 0,
    total_earnings DECIMAL(10,2) DEFAULT 0.00,
    unpaid_balance DECIMAL(10,2) DEFAULT 0.00,
    
    -- Contact & Details
    phone VARCHAR(50) NULL,
    company_name VARCHAR(255) NULL,
    payment_method VARCHAR(50) NULL COMMENT 'paypal, bank_transfer, etc',
    payment_email VARCHAR(255) NULL,
    
    -- Cookie settings
    cookie_duration_days INT DEFAULT 30,
    
    -- Notes
    notes TEXT NULL,
    welcome_message TEXT NULL,
    
    -- Metadata
    invited_by INT NULL,
    approved_by INT NULL,
    approved_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_workspace (workspace_id),
    INDEX idx_email (email),
    INDEX idx_status (status),
    INDEX idx_code (unique_code),
    FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS affiliate_referrals (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    affiliate_id INT NOT NULL,
    
    -- Referral details
    contact_id INT NULL COMMENT 'Contact who was referred',
    customer_email VARCHAR(255) NULL,
    customer_name VARCHAR(255) NULL,
    
    -- Conversion details
    status ENUM('pending', 'converted', 'cancelled', 'rejected') DEFAULT 'pending',
    conversion_type VARCHAR(50) NULL COMMENT 'signup, purchase, subscription, etc',
    conversion_value DECIMAL(10,2) DEFAULT 0.00,
    commission_amount DECIMAL(10,2) DEFAULT 0.00,
    
    -- Source tracking
    referral_source VARCHAR(255) NULL COMMENT 'URL or campaign where click originated',
    landing_page VARCHAR(500) NULL,
    utm_source VARCHAR(255) NULL,
    utm_medium VARCHAR(255) NULL,
    utm_campaign VARCHAR(255) NULL,
    
    -- IP & User Agent
    ip_address VARCHAR(45) NULL,
    user_agent TEXT NULL,
    
    -- Timestamps
    referred_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    converted_at TIMESTAMP NULL,
    payout_id INT NULL COMMENT 'Links to affiliate_payouts',
    
    INDEX idx_workspace (workspace_id),
    INDEX idx_affiliate (affiliate_id),
    INDEX idx_contact (contact_id),
    INDEX idx_status (status),
    INDEX idx_referred_at (referred_at),
    FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
    FOREIGN KEY (affiliate_id) REFERENCES affiliates(id) ON DELETE CASCADE,
    FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS affiliate_payouts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    affiliate_id INT NOT NULL,
    
    -- Payout details
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    payment_method VARCHAR(50) NULL,
    payment_reference VARCHAR(255) NULL COMMENT 'Transaction ID, PayPal ID, etc',
    
    -- Status
    status ENUM('pending', 'processing', 'completed', 'failed', 'cancelled') DEFAULT 'pending',
    
    -- Period covered
    period_start DATE NULL,
    period_end DATE NULL,
    
    -- Notes
    notes TEXT NULL,
    
    -- Metadata
    processed_by INT NULL,
    processed_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_workspace (workspace_id),
    INDEX idx_affiliate (affiliate_id),
    INDEX idx_status (status),
    INDEX idx_created (created_at),
    FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
    FOREIGN KEY (affiliate_id) REFERENCES affiliates(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Affiliate clicks tracking (optional, for detailed analytics)
CREATE TABLE IF NOT EXISTS affiliate_clicks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    affiliate_id INT NOT NULL,
    
    -- Click details
    referral_url VARCHAR(500) NULL,
    landing_page VARCHAR(500) NULL,
    ip_address VARCHAR(45) NULL,
    user_agent TEXT NULL,
    
    -- UTM parameters
    utm_source VARCHAR(255) NULL,
    utm_medium VARCHAR(255) NULL,
    utm_campaign VARCHAR(255) NULL,
    utm_content VARCHAR(255) NULL,
    utm_term VARCHAR(255) NULL,
    
    -- Cookie tracking
    cookie_set BOOLEAN DEFAULT FALSE,
    cookie_expires_at TIMESTAMP NULL,
    
    -- Conversion tracking
    converted BOOLEAN DEFAULT FALSE,
    referral_id INT NULL COMMENT 'Links to affiliate_referrals if converted',
    
    clicked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_workspace (workspace_id),
    INDEX idx_affiliate (affiliate_id),
    INDEX idx_clicked_at (clicked_at),
    INDEX idx_converted (converted),
    FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
    FOREIGN KEY (affiliate_id) REFERENCES affiliates(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
