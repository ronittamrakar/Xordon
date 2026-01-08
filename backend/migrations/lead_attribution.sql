-- Phase 1: Lead Attribution & Source Tracking
-- Track where leads come from for ROI analysis

CREATE TABLE IF NOT EXISTS lead_sources (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    
    name VARCHAR(100) NOT NULL,
    type ENUM('organic', 'paid', 'referral', 'direct', 'social', 'email', 'phone', 'form', 'api', 'import', 'other') DEFAULT 'other',
    
    -- For paid sources
    cost_per_lead DECIMAL(10,2) NULL,
    monthly_budget DECIMAL(10,2) NULL,
    
    -- Tracking
    is_active TINYINT(1) DEFAULT 1,
    color VARCHAR(7) DEFAULT '#6366f1',
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE KEY uk_workspace_name (workspace_id, name),
    INDEX idx_lead_sources_workspace (workspace_id, is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- UTM tracking for web leads
CREATE TABLE IF NOT EXISTS lead_attributions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    
    -- Link to contact/lead
    contact_id INT NOT NULL,
    
    -- Source tracking
    lead_source_id INT NULL,
    source VARCHAR(100) NULL COMMENT 'utm_source or manual source',
    medium VARCHAR(100) NULL COMMENT 'utm_medium',
    campaign VARCHAR(255) NULL COMMENT 'utm_campaign',
    term VARCHAR(255) NULL COMMENT 'utm_term',
    content VARCHAR(255) NULL COMMENT 'utm_content',
    
    -- Referral tracking
    referrer_url VARCHAR(500) NULL,
    landing_page VARCHAR(500) NULL,
    
    -- Device/session info
    device_type VARCHAR(20) NULL COMMENT 'desktop, mobile, tablet',
    browser VARCHAR(50) NULL,
    os VARCHAR(50) NULL,
    ip_address VARCHAR(45) NULL,
    
    -- Conversion tracking
    first_touch TINYINT(1) DEFAULT 1 COMMENT 'Is this the first attribution?',
    conversion_type VARCHAR(50) NULL COMMENT 'form_submit, phone_call, chat, booking, etc.',
    conversion_value DECIMAL(10,2) NULL,
    
    -- Timestamps
    attributed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_attribution_contact (contact_id),
    INDEX idx_attribution_workspace (workspace_id, attributed_at DESC),
    INDEX idx_attribution_source (workspace_id, lead_source_id),
    INDEX idx_attribution_campaign (workspace_id, campaign),
    
    FOREIGN KEY (lead_source_id) REFERENCES lead_sources(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default lead sources
INSERT INTO lead_sources (workspace_id, name, type, color) VALUES
(1, 'Website', 'organic', '#3b82f6'),
(1, 'Google Ads', 'paid', '#ea4335'),
(1, 'Facebook Ads', 'paid', '#1877f2'),
(1, 'Referral', 'referral', '#22c55e'),
(1, 'Phone Call', 'phone', '#f97316'),
(1, 'Walk-in', 'direct', '#8b5cf6'),
(1, 'Email Campaign', 'email', '#06b6d4'),
(1, 'Social Media', 'social', '#ec4899')
ON DUPLICATE KEY UPDATE name = VALUES(name);
