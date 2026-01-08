-- Reputation Module Database Schema
-- This migration creates all necessary tables for the reputation management system

-- Reviews table
CREATE TABLE IF NOT EXISTS reviews (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    contact_id INT,
    platform VARCHAR(50) NOT NULL,
    rating DECIMAL(2,1) NOT NULL,
    author_name VARCHAR(255) NOT NULL,
    author_email VARCHAR(255),
    review_text TEXT,
    review_date DATETIME NOT NULL,
    sentiment VARCHAR(20) DEFAULT 'neutral',
    replied BOOLEAN DEFAULT FALSE,
    reply_text TEXT,
    reply_date DATETIME,
    is_spam BOOLEAN DEFAULT FALSE,
    source_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_workspace (workspace_id),
    INDEX idx_contact (contact_id),
    INDEX idx_platform (platform),
    INDEX idx_rating (rating),
    INDEX idx_sentiment (sentiment),
    INDEX idx_review_date (review_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Review Requests table
CREATE TABLE IF NOT EXISTS review_requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    contact_id INT NOT NULL,
    contact_name VARCHAR(255) NOT NULL,
    contact_email VARCHAR(255),
    contact_phone VARCHAR(50),
    status VARCHAR(20) DEFAULT 'pending',
    channel VARCHAR(20) NOT NULL,
    template_id INT,
    sent_at DATETIME,
    opened_at DATETIME,
    clicked_at DATETIME,
    completed_at DATETIME,
    retry_count INT DEFAULT 0,
    max_retries INT DEFAULT 3,
    next_retry_at DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_workspace (workspace_id),
    INDEX idx_contact (contact_id),
    INDEX idx_status (status),
    INDEX idx_channel (channel),
    INDEX idx_sent_at (sent_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Review Widgets table
CREATE TABLE IF NOT EXISTS review_widgets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) DEFAULT 'carousel',
    platforms JSON,
    min_rating DECIMAL(2,1) DEFAULT 4.0,
    max_reviews INT DEFAULT 10,
    show_ai_summary BOOLEAN DEFAULT FALSE,
    design_settings JSON,
    embed_code TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_workspace (workspace_id),
    INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- AI Agents table
CREATE TABLE IF NOT EXISTS reputation_ai_agents (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    instructions TEXT,
    tone JSON,
    language VARCHAR(10) DEFAULT 'en',
    review_sources JSON,
    review_types JSON,
    footer TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    response_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_workspace (workspace_id),
    INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- SMS/Email Templates table
CREATE TABLE IF NOT EXISTS review_request_templates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(20) NOT NULL,
    channel VARCHAR(20) NOT NULL,
    subject VARCHAR(255),
    message TEXT NOT NULL,
    variables JSON,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_workspace (workspace_id),
    INDEX idx_type (type),
    INDEX idx_channel (channel)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Reputation Settings table
CREATE TABLE IF NOT EXISTS reputation_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL UNIQUE,
    ai_mode VARCHAR(20) DEFAULT 'off',
    drip_mode_enabled BOOLEAN DEFAULT FALSE,
    review_link VARCHAR(500),
    review_balancing_enabled BOOLEAN DEFAULT FALSE,
    review_platforms JSON,
    sms_enabled BOOLEAN DEFAULT TRUE,
    sms_timing VARCHAR(20) DEFAULT 'immediately',
    sms_repeat VARCHAR(20) DEFAULT 'dont-repeat',
    sms_max_retries INT DEFAULT 3,
    email_enabled BOOLEAN DEFAULT TRUE,
    email_timing VARCHAR(20) DEFAULT 'immediately',
    email_repeat VARCHAR(20) DEFAULT 'dont-repeat',
    email_max_retries INT DEFAULT 1,
    whatsapp_enabled BOOLEAN DEFAULT FALSE,
    spam_detection_enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_workspace (workspace_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Business Listings table
CREATE TABLE IF NOT EXISTS business_listings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    platform VARCHAR(50) NOT NULL,
    business_name VARCHAR(255) NOT NULL,
    address TEXT,
    phone VARCHAR(50),
    website VARCHAR(500),
    status VARCHAR(20) DEFAULT 'pending',
    listing_url TEXT,
    is_verified BOOLEAN DEFAULT FALSE,
    sync_enabled BOOLEAN DEFAULT TRUE,
    last_synced_at DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_workspace (workspace_id),
    INDEX idx_platform (platform),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Platform Integrations table
CREATE TABLE IF NOT EXISTS reputation_integrations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    platform VARCHAR(50) NOT NULL,
    is_connected BOOLEAN DEFAULT FALSE,
    credentials JSON,
    settings JSON,
    last_sync_at DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_workspace_platform (workspace_id, platform),
    INDEX idx_workspace (workspace_id),
    INDEX idx_platform (platform)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default settings for existing workspaces
INSERT INTO reputation_settings (workspace_id)
SELECT DISTINCT id FROM workspaces
WHERE id NOT IN (SELECT workspace_id FROM reputation_settings)
ON DUPLICATE KEY UPDATE workspace_id = workspace_id;

-- Insert some sample reviews for testing
INSERT INTO reviews (workspace_id, platform, rating, author_name, author_email, review_text, review_date, sentiment)
VALUES
(1, 'Google', 5.0, 'John Doe', 'john@example.com', 'Excellent service! Highly recommend.', NOW() - INTERVAL 2 DAY, 'positive'),
(1, 'Google', 4.5, 'Jane Smith', 'jane@example.com', 'Very good experience overall.', NOW() - INTERVAL 5 DAY, 'positive'),
(1, 'Yelp', 3.0, 'Bob Johnson', 'bob@example.com', 'Average service, could be better.', NOW() - INTERVAL 7 DAY, 'neutral'),
(1, 'Facebook', 5.0, 'Alice Brown', 'alice@example.com', 'Amazing! Will definitely come back.', NOW() - INTERVAL 1 DAY, 'positive'),
(1, 'Google', 4.0, 'Charlie Wilson', 'charlie@example.com', 'Good service, friendly staff.', NOW() - INTERVAL 3 DAY, 'positive');
