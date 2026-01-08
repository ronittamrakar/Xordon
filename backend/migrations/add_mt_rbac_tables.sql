-- Multi-Tenant RBAC Schema Extension
-- Adds invite tokens and audit logging tables

-- =====================================================
-- INVITE TOKENS (For agency/subaccount invitations)
-- =====================================================
CREATE TABLE IF NOT EXISTS invite_tokens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    agency_id INT DEFAULT NULL,
    subaccount_id INT DEFAULT NULL,
    token VARCHAR(64) NOT NULL,
    expires_at DATETIME NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE KEY uniq_invite_token (token),
    INDEX idx_invite_user (user_id),
    INDEX idx_invite_agency (agency_id),
    INDEX idx_invite_expires (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- MULTI-TENANT AUDIT LOG
-- =====================================================
CREATE TABLE IF NOT EXISTS mt_audit_log (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    action VARCHAR(100) NOT NULL,
    actor_id INT DEFAULT NULL,
    agency_id INT DEFAULT NULL,
    subaccount_id INT DEFAULT NULL,
    details JSON DEFAULT NULL,
    ip_address VARCHAR(45) DEFAULT NULL,
    user_agent TEXT DEFAULT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_audit_action (action),
    INDEX idx_audit_actor (actor_id),
    INDEX idx_audit_agency (agency_id),
    INDEX idx_audit_subaccount (subaccount_id),
    INDEX idx_audit_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- PERMISSION OVERRIDES (Per-resource custom permissions)
-- =====================================================
CREATE TABLE IF NOT EXISTS mt_permission_overrides (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    resource_type ENUM('agency', 'subaccount', 'workspace') NOT NULL,
    resource_id INT NOT NULL,
    permission_key VARCHAR(100) NOT NULL,
    allowed BOOLEAN NOT NULL DEFAULT TRUE,
    granted_by INT DEFAULT NULL,
    expires_at DATETIME DEFAULT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE KEY uniq_override (user_id, resource_type, resource_id, permission_key),
    INDEX idx_override_user (user_id),
    INDEX idx_override_resource (resource_type, resource_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- API KEYS (Per-agency/subaccount API access)
-- =====================================================
CREATE TABLE IF NOT EXISTS mt_api_keys (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    api_key VARCHAR(64) NOT NULL,
    api_secret_hash VARCHAR(255) NOT NULL,
    agency_id INT DEFAULT NULL,
    subaccount_id INT DEFAULT NULL,
    created_by INT NOT NULL,
    
    -- Scope/permissions
    scopes JSON DEFAULT NULL,
    rate_limit_per_minute INT DEFAULT 60,
    
    -- Tracking
    last_used_at DATETIME DEFAULT NULL,
    request_count BIGINT DEFAULT 0,
    
    status ENUM('active', 'revoked') DEFAULT 'active',
    expires_at DATETIME DEFAULT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE KEY uniq_api_key (api_key),
    INDEX idx_apikey_agency (agency_id),
    INDEX idx_apikey_subaccount (subaccount_id),
    INDEX idx_apikey_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
