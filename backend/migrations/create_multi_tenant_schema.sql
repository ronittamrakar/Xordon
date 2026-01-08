-- Multi-Tenant SaaS Schema Migration
-- Phase 1: Agencies, Sub-accounts, and Hierarchy
-- This migration is ADDITIVE - it does not delete or modify existing data

-- =====================================================
-- 1. AGENCIES (Top-level tenant - Your direct customers)
-- =====================================================
CREATE TABLE IF NOT EXISTS agencies (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) NOT NULL,
    owner_user_id INT NOT NULL,
    subscription_plan_id INT DEFAULT NULL,
    trial_ends_at DATETIME DEFAULT NULL,
    status ENUM('trial','active','suspended','canceled') DEFAULT 'trial',
    
    -- Limits
    max_subaccounts INT DEFAULT 5,
    max_users INT DEFAULT 10,
    max_contacts_per_subaccount INT DEFAULT 10000,
    
    -- Timestamps
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE KEY uniq_agencies_slug (slug),
    INDEX idx_agencies_owner (owner_user_id),
    INDEX idx_agencies_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 2. AGENCY MEMBERS (Users belonging to an agency)
-- =====================================================
CREATE TABLE IF NOT EXISTS agency_members (
    id INT AUTO_INCREMENT PRIMARY KEY,
    agency_id INT NOT NULL,
    user_id INT NOT NULL,
    role ENUM('owner','admin','member') NOT NULL DEFAULT 'member',
    status ENUM('invited','active','suspended') DEFAULT 'invited',
    invited_by INT DEFAULT NULL,
    invited_at DATETIME DEFAULT NULL,
    joined_at DATETIME DEFAULT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE KEY uniq_agency_member (agency_id, user_id),
    INDEX idx_agency_members_user (user_id),
    INDEX idx_agency_members_status (status),
    FOREIGN KEY (agency_id) REFERENCES agencies(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 3. AGENCY BRANDING (Whitelabel customization)
-- =====================================================
CREATE TABLE IF NOT EXISTS agency_branding (
    id INT AUTO_INCREMENT PRIMARY KEY,
    agency_id INT NOT NULL,
    
    -- Visual Identity
    logo_url VARCHAR(512) DEFAULT NULL,
    favicon_url VARCHAR(512) DEFAULT NULL,
    primary_color VARCHAR(7) DEFAULT '#3B82F6',
    secondary_color VARCHAR(7) DEFAULT '#1E40AF',
    accent_color VARCHAR(7) DEFAULT '#10B981',
    
    -- Company Info
    company_name VARCHAR(255) DEFAULT NULL,
    support_email VARCHAR(255) DEFAULT NULL,
    support_phone VARCHAR(50) DEFAULT NULL,
    
    -- Login Page Customization
    login_page_title VARCHAR(255) DEFAULT NULL,
    login_page_description TEXT DEFAULT NULL,
    login_background_url VARCHAR(512) DEFAULT NULL,
    
    -- Email Branding
    email_from_name VARCHAR(255) DEFAULT NULL,
    email_from_address VARCHAR(255) DEFAULT NULL,
    email_footer_text TEXT DEFAULT NULL,
    
    -- Advanced
    custom_css TEXT DEFAULT NULL,
    custom_head_scripts TEXT DEFAULT NULL,
    
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE KEY uniq_agency_branding (agency_id),
    FOREIGN KEY (agency_id) REFERENCES agencies(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 4. AGENCY DOMAINS (Custom domain support)
-- =====================================================
CREATE TABLE IF NOT EXISTS agency_domains (
    id INT AUTO_INCREMENT PRIMARY KEY,
    agency_id INT NOT NULL,
    domain VARCHAR(255) NOT NULL,
    domain_type ENUM('primary','alias','funnel') DEFAULT 'primary',
    
    -- SSL/DNS Status
    ssl_status ENUM('pending','provisioning','active','failed') DEFAULT 'pending',
    ssl_expires_at DATETIME DEFAULT NULL,
    ssl_certificate TEXT DEFAULT NULL,
    ssl_private_key TEXT DEFAULT NULL,
    dns_verified BOOLEAN DEFAULT FALSE,
    dns_verified_at DATETIME DEFAULT NULL,
    dns_txt_record VARCHAR(255) DEFAULT NULL,
    
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE KEY uniq_agency_domain (domain),
    INDEX idx_agency_domains_agency (agency_id),
    FOREIGN KEY (agency_id) REFERENCES agencies(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 5. SUBACCOUNTS (Agency's client businesses)
-- =====================================================
CREATE TABLE IF NOT EXISTS subaccounts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    agency_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) NOT NULL,
    
    -- Business Info
    industry VARCHAR(100) DEFAULT NULL,
    timezone VARCHAR(50) DEFAULT 'UTC',
    currency VARCHAR(3) DEFAULT 'USD',
    logo_url VARCHAR(512) DEFAULT NULL,
    
    -- Contact Info
    address TEXT DEFAULT NULL,
    city VARCHAR(100) DEFAULT NULL,
    state VARCHAR(100) DEFAULT NULL,
    country VARCHAR(100) DEFAULT NULL,
    postal_code VARCHAR(20) DEFAULT NULL,
    phone VARCHAR(50) DEFAULT NULL,
    email VARCHAR(255) DEFAULT NULL,
    website VARCHAR(255) DEFAULT NULL,
    
    -- Status & Metadata
    status ENUM('active','paused','canceled') DEFAULT 'active',
    created_by INT DEFAULT NULL,
    notes TEXT DEFAULT NULL,
    
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE KEY uniq_subaccount_slug (agency_id, slug),
    INDEX idx_subaccounts_agency (agency_id),
    INDEX idx_subaccounts_status (status),
    FOREIGN KEY (agency_id) REFERENCES agencies(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 6. SUBACCOUNT MEMBERS (Users with access to sub-account)
-- =====================================================
CREATE TABLE IF NOT EXISTS subaccount_members (
    id INT AUTO_INCREMENT PRIMARY KEY,
    subaccount_id INT NOT NULL,
    user_id INT NOT NULL,
    role ENUM('admin','user','readonly') NOT NULL DEFAULT 'user',
    
    -- Granular Permissions (stored as JSON for flexibility)
    permissions JSON DEFAULT NULL,
    
    status ENUM('invited','active','suspended') DEFAULT 'invited',
    invited_by INT DEFAULT NULL,
    invited_at DATETIME DEFAULT NULL,
    joined_at DATETIME DEFAULT NULL,
    last_accessed_at DATETIME DEFAULT NULL,
    
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE KEY uniq_subaccount_member (subaccount_id, user_id),
    INDEX idx_subaccount_members_user (user_id),
    FOREIGN KEY (subaccount_id) REFERENCES subaccounts(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 7. SUBACCOUNT SETTINGS (Feature flags & limits per sub-account)
-- =====================================================
CREATE TABLE IF NOT EXISTS subaccount_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    subaccount_id INT NOT NULL,
    
    -- Feature Flags (which modules are enabled)
    features JSON DEFAULT NULL,
    
    -- Resource Limits
    limits JSON DEFAULT NULL,
    
    -- Integration Configs
    integrations JSON DEFAULT NULL,
    
    -- Notification Preferences
    notifications JSON DEFAULT NULL,
    
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE KEY uniq_subaccount_settings (subaccount_id),
    FOREIGN KEY (subaccount_id) REFERENCES subaccounts(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 8. AGENCY SUBSCRIPTION PLANS (For billing)
-- =====================================================
CREATE TABLE IF NOT EXISTS agency_subscription_plans (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(50) NOT NULL,
    description TEXT DEFAULT NULL,
    
    -- Pricing
    price_monthly DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    price_yearly DECIMAL(10,2) DEFAULT NULL,
    
    -- Limits
    max_subaccounts INT DEFAULT 10,
    max_users INT DEFAULT 25,
    max_contacts INT DEFAULT 50000,
    max_emails_per_month INT DEFAULT 100000,
    max_sms_per_month INT DEFAULT 10000,
    
    -- Features (JSON array of feature keys)
    features JSON DEFAULT NULL,
    
    is_active BOOLEAN DEFAULT TRUE,
    is_public BOOLEAN DEFAULT TRUE,
    sort_order INT DEFAULT 0,
    
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE KEY uniq_plan_slug (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 9. AGENCY RESELLER PRICING (For reselling add-ons)
-- =====================================================
CREATE TABLE IF NOT EXISTS agency_reseller_pricing (
    id INT AUTO_INCREMENT PRIMARY KEY,
    agency_id INT NOT NULL,
    feature_key VARCHAR(100) NOT NULL,
    
    -- Pricing
    cost_price DECIMAL(10,4) NOT NULL DEFAULT 0.0000,
    resell_price DECIMAL(10,4) NOT NULL DEFAULT 0.0000,
    
    is_enabled BOOLEAN DEFAULT TRUE,
    
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE KEY uniq_agency_feature (agency_id, feature_key),
    FOREIGN KEY (agency_id) REFERENCES agencies(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 10. UPDATE EXISTING TABLES (Add hierarchy columns)
-- =====================================================

-- Add agency_id and user_type to users table
-- Using ALTER IGNORE to skip if column already exists
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'agency_id') = 0,
    'ALTER TABLE users ADD COLUMN agency_id INT DEFAULT NULL, ADD COLUMN user_type ENUM(''platform_admin'',''agency_user'',''subaccount_user'') DEFAULT ''subaccount_user'', ADD COLUMN current_subaccount_id INT DEFAULT NULL, ADD INDEX idx_users_agency (agency_id)',
    'SELECT 1'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add agency_id and subaccount_id to workspaces table
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'workspaces' AND COLUMN_NAME = 'agency_id') = 0,
    'ALTER TABLE workspaces ADD COLUMN agency_id INT DEFAULT NULL, ADD COLUMN subaccount_id INT DEFAULT NULL, ADD INDEX idx_workspaces_agency (agency_id), ADD INDEX idx_workspaces_subaccount (subaccount_id)',
    'SELECT 1'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- =====================================================
-- 11. INSERT DEFAULT SUBSCRIPTION PLANS
-- =====================================================
INSERT IGNORE INTO agency_subscription_plans (name, slug, description, price_monthly, price_yearly, max_subaccounts, max_users, max_contacts, features, sort_order) VALUES
('Starter', 'starter', 'Perfect for small agencies just getting started', 97.00, 970.00, 3, 5, 5000, '["crm", "email", "forms", "calendar"]', 1),
('Professional', 'professional', 'For growing agencies with multiple clients', 297.00, 2970.00, 10, 25, 25000, '["crm", "email", "sms", "forms", "calendar", "automation", "reporting"]', 2),
('Agency', 'agency', 'Full-featured plan for established agencies', 497.00, 4970.00, 50, 100, 100000, '["crm", "email", "sms", "whatsapp", "forms", "calendar", "automation", "reporting", "whitelabel", "api"]', 3),
('Enterprise', 'enterprise', 'Custom solutions for large organizations', 997.00, 9970.00, -1, -1, -1, '["crm", "email", "sms", "whatsapp", "forms", "calendar", "automation", "reporting", "whitelabel", "api", "dedicated_support", "custom_integrations"]', 4);

-- =====================================================
-- 12. CREATE DEFAULT AGENCY FOR EXISTING DATA
-- =====================================================
-- This creates a "Platform Default" agency and migrates existing users into it

INSERT INTO agencies (name, slug, owner_user_id, status, max_subaccounts, max_users, max_contacts_per_subaccount)
SELECT 'Platform Default', 'platform-default', MIN(id), 'active', 999, 999, 999999
FROM users
WHERE NOT EXISTS (SELECT 1 FROM agencies WHERE slug = 'platform-default')
LIMIT 1;

-- Get the default agency ID and link existing users
SET @default_agency_id = (SELECT id FROM agencies WHERE slug = 'platform-default' LIMIT 1);

-- Update existing users to belong to default agency (only if agency_id is NULL)
UPDATE users SET agency_id = @default_agency_id, user_type = 'agency_user' WHERE agency_id IS NULL AND @default_agency_id IS NOT NULL;

-- Add existing workspace owners as agency members
INSERT IGNORE INTO agency_members (agency_id, user_id, role, status, joined_at)
SELECT @default_agency_id, owner_user_id, 'admin', 'active', NOW()
FROM workspaces
WHERE @default_agency_id IS NOT NULL;

-- Update existing workspaces to belong to default agency
UPDATE workspaces SET agency_id = @default_agency_id WHERE agency_id IS NULL AND @default_agency_id IS NOT NULL;

-- Create a default sub-account from each existing workspace
INSERT IGNORE INTO subaccounts (agency_id, name, slug, status, created_by, created_at)
SELECT @default_agency_id, w.name, w.slug, 'active', w.owner_user_id, w.created_at
FROM workspaces w
WHERE @default_agency_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM subaccounts s WHERE s.agency_id = @default_agency_id AND s.slug = w.slug);

-- Link workspaces to their corresponding subaccounts
UPDATE workspaces w
JOIN subaccounts s ON s.slug = w.slug AND s.agency_id = @default_agency_id
SET w.subaccount_id = s.id
WHERE w.subaccount_id IS NULL AND @default_agency_id IS NOT NULL;

-- Add workspace members as subaccount members
INSERT IGNORE INTO subaccount_members (subaccount_id, user_id, role, status, joined_at)
SELECT s.id, wm.user_id, 
    CASE wm.role WHEN 'owner' THEN 'admin' WHEN 'admin' THEN 'admin' ELSE 'user' END,
    'active', NOW()
FROM workspace_members wm
JOIN workspaces w ON w.id = wm.workspace_id
JOIN subaccounts s ON s.id = w.subaccount_id
WHERE s.id IS NOT NULL;
