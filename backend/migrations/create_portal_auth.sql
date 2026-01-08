-- Phase 7: Customer Portal Authentication
-- Magic link + OTP SMS login for customer self-service portal

-- Portal identities (links contacts to portal access)
CREATE TABLE IF NOT EXISTS portal_identities (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    company_id INT NULL,
    contact_id INT NOT NULL,
    
    -- Identity
    email VARCHAR(255) NULL,
    phone VARCHAR(20) NULL,
    
    -- Status
    is_active TINYINT(1) DEFAULT 1,
    email_verified TINYINT(1) DEFAULT 0,
    phone_verified TINYINT(1) DEFAULT 0,
    
    -- Preferences
    preferred_auth_method ENUM('email', 'sms') DEFAULT 'email',
    timezone VARCHAR(50) NULL,
    locale VARCHAR(10) DEFAULT 'en',
    
    -- Security
    last_login_at TIMESTAMP NULL,
    last_login_ip VARCHAR(45) NULL,
    login_count INT DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE KEY uk_workspace_contact (workspace_id, contact_id),
    INDEX idx_portal_email (email),
    INDEX idx_portal_phone (phone),
    INDEX idx_portal_company (company_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Portal sessions (active login sessions)
CREATE TABLE IF NOT EXISTS portal_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    portal_identity_id INT NOT NULL,
    
    -- Session token (hashed)
    token_hash VARCHAR(64) NOT NULL,
    
    -- Session info
    ip_address VARCHAR(45) NULL,
    user_agent TEXT NULL,
    device_type VARCHAR(20) NULL COMMENT 'desktop, mobile, tablet',
    
    -- Expiration
    expires_at TIMESTAMP NOT NULL,
    last_activity_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Status
    is_active TINYINT(1) DEFAULT 1,
    revoked_at TIMESTAMP NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE KEY uk_token (token_hash),
    INDEX idx_sessions_identity (portal_identity_id, is_active),
    INDEX idx_sessions_expires (expires_at),
    
    FOREIGN KEY (portal_identity_id) REFERENCES portal_identities(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Magic link tokens (for email login)
CREATE TABLE IF NOT EXISTS portal_magic_links (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    
    -- Target
    email VARCHAR(255) NOT NULL,
    contact_id INT NULL,
    
    -- Token (hashed)
    token_hash VARCHAR(64) NOT NULL,
    
    -- Expiration (short-lived)
    expires_at TIMESTAMP NOT NULL,
    
    -- Usage
    used_at TIMESTAMP NULL,
    used_ip VARCHAR(45) NULL,
    
    -- Redirect after login
    redirect_url VARCHAR(500) NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE KEY uk_token (token_hash),
    INDEX idx_magic_email (email, expires_at),
    INDEX idx_magic_expires (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- OTP codes (for SMS login)
CREATE TABLE IF NOT EXISTS portal_otps (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    
    -- Target
    phone VARCHAR(20) NOT NULL,
    contact_id INT NULL,
    
    -- Code (hashed)
    code_hash VARCHAR(64) NOT NULL,
    
    -- Expiration (very short-lived)
    expires_at TIMESTAMP NOT NULL,
    
    -- Usage
    used_at TIMESTAMP NULL,
    
    -- Rate limiting
    attempts INT DEFAULT 0,
    max_attempts INT DEFAULT 5,
    locked_until TIMESTAMP NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_otp_phone (phone, expires_at),
    INDEX idx_otp_expires (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Portal login audit log
CREATE TABLE IF NOT EXISTS portal_login_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    portal_identity_id INT NULL,
    
    -- Login attempt details
    auth_method ENUM('magic_link', 'otp') NOT NULL,
    identifier VARCHAR(255) NOT NULL COMMENT 'email or phone',
    
    -- Result
    success TINYINT(1) NOT NULL,
    failure_reason VARCHAR(100) NULL,
    
    -- Request info
    ip_address VARCHAR(45) NULL,
    user_agent TEXT NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_login_logs_workspace (workspace_id, created_at DESC),
    INDEX idx_login_logs_identity (portal_identity_id, created_at DESC),
    INDEX idx_login_logs_ip (ip_address, created_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
