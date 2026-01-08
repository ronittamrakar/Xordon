-- =====================================================
-- Website Builder Database Schema
-- =====================================================

-- Main websites table
CREATE TABLE IF NOT EXISTS websites (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    workspace_id BIGINT UNSIGNED NOT NULL,
    user_id BIGINT UNSIGNED NOT NULL,
    name VARCHAR(255) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    slug VARCHAR(255),
    type ENUM('landing-page', 'business', 'ecommerce', 'portfolio', 'blog', 'saas', 'restaurant', 'real-estate', 'education', 'healthcare') DEFAULT 'landing-page',
    status ENUM('draft', 'published', 'archived') DEFAULT 'draft',
    
    -- SEO fields
    seo_title VARCHAR(255),
    seo_description TEXT,
    seo_keywords TEXT,
    og_image VARCHAR(500),
    
    -- Content stored as JSON
    content JSON,
    
    -- Publishing
    custom_domain VARCHAR(255),
    published_url VARCHAR(500),
    published_at TIMESTAMP NULL,
    
    -- Analytics
    views BIGINT UNSIGNED DEFAULT 0,
    conversions BIGINT UNSIGNED DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    
    INDEX idx_workspace_id (workspace_id),
    INDEX idx_user_id (user_id),
    INDEX idx_slug (slug),
    INDEX idx_type (type),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at),
    UNIQUE KEY unique_workspace_slug (workspace_id, slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Website versions for version control
CREATE TABLE IF NOT EXISTS website_versions (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    website_id BIGINT UNSIGNED NOT NULL,
    user_id BIGINT UNSIGNED NOT NULL,
    version_number INT UNSIGNED NOT NULL,
    content JSON NOT NULL,
    change_description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_website_id (website_id),
    INDEX idx_created_at (created_at),
    FOREIGN KEY (website_id) REFERENCES websites(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Website templates
CREATE TABLE IF NOT EXISTS website_templates (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    type ENUM('landing-page', 'business', 'ecommerce', 'portfolio', 'blog', 'saas', 'restaurant', 'real-estate', 'education', 'healthcare') DEFAULT 'landing-page',
    category VARCHAR(100),
    thumbnail VARCHAR(500),
    preview_url VARCHAR(500),
    content JSON NOT NULL,
    is_premium BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    usage_count INT UNSIGNED DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_type (type),
    INDEX idx_category (category),
    INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Website media/assets
CREATE TABLE IF NOT EXISTS website_media (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    website_id BIGINT UNSIGNED NOT NULL,
    workspace_id BIGINT UNSIGNED NOT NULL,
    filename VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_url VARCHAR(500) NOT NULL,
    file_type VARCHAR(100),
    file_size BIGINT UNSIGNED,
    mime_type VARCHAR(100),
    width INT UNSIGNED,
    height INT UNSIGNED,
    alt_text VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_website_id (website_id),
    INDEX idx_workspace_id (workspace_id),
    INDEX idx_file_type (file_type),
    FOREIGN KEY (website_id) REFERENCES websites(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Website analytics/tracking
CREATE TABLE IF NOT EXISTS website_analytics (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    website_id BIGINT UNSIGNED NOT NULL,
    event_type ENUM('view', 'conversion', 'click', 'form_submit', 'custom') NOT NULL,
    event_data JSON,
    visitor_ip VARCHAR(45),
    user_agent TEXT,
    referrer VARCHAR(500),
    country VARCHAR(100),
    city VARCHAR(100),
    device_type VARCHAR(50),
    browser VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_website_id (website_id),
    INDEX idx_event_type (event_type),
    INDEX idx_created_at (created_at),
    FOREIGN KEY (website_id) REFERENCES websites(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Website custom domains
CREATE TABLE IF NOT EXISTS website_domains (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    website_id BIGINT UNSIGNED NOT NULL,
    workspace_id BIGINT UNSIGNED NOT NULL,
    domain VARCHAR(255) NOT NULL,
    is_verified BOOLEAN DEFAULT FALSE,
    verification_token VARCHAR(255),
    ssl_enabled BOOLEAN DEFAULT FALSE,
    ssl_certificate TEXT,
    dns_records JSON,
    verified_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_website_id (website_id),
    INDEX idx_workspace_id (workspace_id),
    INDEX idx_domain (domain),
    UNIQUE KEY unique_domain (domain),
    FOREIGN KEY (website_id) REFERENCES websites(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Website forms/submissions (for forms created in websites)
CREATE TABLE IF NOT EXISTS website_form_submissions (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    website_id BIGINT UNSIGNED NOT NULL,
    form_id VARCHAR(100) NOT NULL,
    form_data JSON NOT NULL,
    visitor_ip VARCHAR(45),
    user_agent TEXT,
    referrer VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_website_id (website_id),
    INDEX idx_form_id (form_id),
    INDEX idx_created_at (created_at),
    FOREIGN KEY (website_id) REFERENCES websites(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert some default templates
INSERT INTO website_templates (name, description, type, category, content, is_active) VALUES
('Blank Canvas', 'Start from scratch with a blank website', 'landing-page', 'basic', '{"sections": [], "settings": {"seoTitle": "New Website", "backgroundColor": "#ffffff", "fontFamily": "Inter, sans-serif", "accentColor": "#3b82f6"}}', TRUE),
('Product Launch', 'Perfect for launching new products', 'landing-page', 'marketing', '{"sections": [], "settings": {"seoTitle": "Product Launch", "backgroundColor": "#ffffff", "fontFamily": "Inter, sans-serif", "accentColor": "#3b82f6"}}', TRUE),
('Business Professional', 'Professional business website template', 'business', 'business', '{"sections": [], "settings": {"seoTitle": "Business Website", "backgroundColor": "#ffffff", "fontFamily": "Inter, sans-serif", "accentColor": "#1e40af"}}', TRUE),
('Online Store', 'E-commerce website template', 'ecommerce', 'ecommerce', '{"sections": [], "settings": {"seoTitle": "Online Store", "backgroundColor": "#ffffff", "fontFamily": "Inter, sans-serif", "accentColor": "#059669"}}', TRUE),
('Creative Portfolio', 'Showcase your creative work', 'portfolio', 'creative', '{"sections": [], "settings": {"seoTitle": "Portfolio", "backgroundColor": "#ffffff", "fontFamily": "Inter, sans-serif", "accentColor": "#8b5cf6"}}', TRUE);
