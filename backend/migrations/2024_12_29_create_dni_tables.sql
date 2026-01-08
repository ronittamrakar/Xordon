-- DNI (Dynamic Number Insertion) Database Schema
-- This migration adds tables for visitor tracking and number pools

-- Number Pools table - Groups of phone numbers for DNI
CREATE TABLE IF NOT EXISTS number_pools (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    workspace_id INT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT NULL,
    source_type ENUM('google_ads', 'google_organic', 'facebook', 'bing', 'direct', 'referral', 'custom') NOT NULL DEFAULT 'custom',
    custom_source VARCHAR(255) NULL COMMENT 'Custom source name if source_type is custom',
    target_number VARCHAR(20) NOT NULL COMMENT 'The number to replace on the website',
    session_timeout_minutes INT DEFAULT 30 COMMENT 'How long a visitor session lasts',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_user_id (user_id),
    INDEX idx_workspace_id (workspace_id),
    INDEX idx_source_type (source_type),
    INDEX idx_is_active (is_active),
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Pool Numbers - Phone numbers assigned to pools
CREATE TABLE IF NOT EXISTS pool_numbers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    pool_id INT NOT NULL,
    phone_number_id INT NOT NULL,
    is_available BOOLEAN DEFAULT TRUE COMMENT 'Whether number is currently available for assignment',
    last_assigned_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_pool_id (pool_id),
    INDEX idx_phone_number_id (phone_number_id),
    INDEX idx_is_available (is_available),
    
    FOREIGN KEY (pool_id) REFERENCES number_pools(id) ON DELETE CASCADE,
    FOREIGN KEY (phone_number_id) REFERENCES phone_numbers(id) ON DELETE CASCADE,
    UNIQUE KEY unique_pool_number (pool_id, phone_number_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Visitor Sessions - Tracks website visitors for number assignment
CREATE TABLE IF NOT EXISTS visitor_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    pool_id INT NOT NULL,
    visitor_id VARCHAR(64) NOT NULL COMMENT 'Fingerprint or cookie-based visitor ID',
    assigned_number_id INT NULL COMMENT 'The pool_number assigned to this visitor',
    
    -- Attribution data
    utm_source VARCHAR(255) NULL,
    utm_medium VARCHAR(255) NULL,
    utm_campaign VARCHAR(255) NULL,
    utm_term VARCHAR(255) NULL,
    utm_content VARCHAR(255) NULL,
    gclid VARCHAR(255) NULL COMMENT 'Google Click ID',
    fbclid VARCHAR(255) NULL COMMENT 'Facebook Click ID',
    msclkid VARCHAR(255) NULL COMMENT 'Microsoft Click ID',
    referrer TEXT NULL,
    landing_page TEXT NULL,
    
    -- Visitor info
    ip_address VARCHAR(45) NULL,
    user_agent TEXT NULL,
    device_type ENUM('desktop', 'mobile', 'tablet', 'unknown') DEFAULT 'unknown',
    
    -- Session timing
    first_visit_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_activity_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NULL,
    
    -- Status
    has_called BOOLEAN DEFAULT FALSE,
    call_log_id INT NULL,
    
    INDEX idx_pool_id (pool_id),
    INDEX idx_visitor_id (visitor_id),
    INDEX idx_assigned_number (assigned_number_id),
    INDEX idx_gclid (gclid),
    INDEX idx_expires_at (expires_at),
    INDEX idx_has_called (has_called),
    
    FOREIGN KEY (pool_id) REFERENCES number_pools(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_number_id) REFERENCES pool_numbers(id) ON DELETE SET NULL,
    FOREIGN KEY (call_log_id) REFERENCES phone_call_logs(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Page Visits - Tracks visitor journey before calling
CREATE TABLE IF NOT EXISTS visitor_page_visits (
    id INT AUTO_INCREMENT PRIMARY KEY,
    session_id INT NOT NULL,
    page_url TEXT NOT NULL,
    page_title VARCHAR(500) NULL,
    visited_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    time_on_page_seconds INT NULL,
    
    INDEX idx_session_id (session_id),
    
    FOREIGN KEY (session_id) REFERENCES visitor_sessions(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add attribution fields to phone_call_logs for call attribution
ALTER TABLE phone_call_logs 
ADD COLUMN visitor_session_id INT NULL AFTER call_flow_id,
ADD COLUMN attribution_source VARCHAR(255) NULL AFTER visitor_session_id,
ADD COLUMN attribution_medium VARCHAR(255) NULL AFTER attribution_source,
ADD COLUMN attribution_campaign VARCHAR(255) NULL AFTER attribution_medium,
ADD COLUMN attribution_keyword VARCHAR(255) NULL AFTER attribution_campaign,
ADD COLUMN gclid VARCHAR(255) NULL AFTER attribution_keyword,
ADD INDEX idx_visitor_session (visitor_session_id),
ADD INDEX idx_attribution_source (attribution_source),
ADD FOREIGN KEY (visitor_session_id) REFERENCES visitor_sessions(id) ON DELETE SET NULL;
