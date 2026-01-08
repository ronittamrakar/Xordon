-- Phase 3: Listings & SEO Management
-- Business listings, local SEO, and citation management

-- Business listings across directories
CREATE TABLE IF NOT EXISTS business_listings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    
    -- Directory info
    directory VARCHAR(50) NOT NULL COMMENT 'google, yelp, facebook, bing, apple, yellowpages, etc.',
    directory_name VARCHAR(100) NOT NULL,
    listing_url VARCHAR(500) NULL,
    
    -- Listing status
    status ENUM('not_listed', 'pending', 'claimed', 'verified', 'needs_update', 'error') DEFAULT 'not_listed',
    claim_url VARCHAR(500) NULL,
    
    -- Business info on this directory
    business_name VARCHAR(255) NULL,
    address VARCHAR(500) NULL,
    phone VARCHAR(20) NULL,
    website VARCHAR(500) NULL,
    categories JSON NULL,
    
    -- Accuracy tracking
    name_accurate TINYINT(1) NULL,
    address_accurate TINYINT(1) NULL,
    phone_accurate TINYINT(1) NULL,
    website_accurate TINYINT(1) NULL,
    hours_accurate TINYINT(1) NULL,
    accuracy_score INT NULL COMMENT '0-100',
    
    -- Sync
    last_checked_at TIMESTAMP NULL,
    last_updated_at TIMESTAMP NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE KEY uk_workspace_directory (workspace_id, directory),
    INDEX idx_listings_workspace (workspace_id, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- SEO keywords tracking
CREATE TABLE IF NOT EXISTS seo_keywords (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    
    keyword VARCHAR(255) NOT NULL,
    search_volume INT NULL,
    difficulty INT NULL COMMENT '0-100',
    
    -- Current ranking
    current_position INT NULL,
    previous_position INT NULL,
    best_position INT NULL,
    
    -- Target
    target_url VARCHAR(500) NULL,
    is_tracked TINYINT(1) DEFAULT 1,
    
    -- Location-based
    location VARCHAR(100) NULL COMMENT 'City, State for local SEO',
    
    last_checked_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE KEY uk_workspace_keyword_location (workspace_id, keyword, location),
    INDEX idx_keywords_workspace (workspace_id, is_tracked)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- SEO keyword ranking history
CREATE TABLE IF NOT EXISTS seo_keyword_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    keyword_id INT NOT NULL,
    
    position INT NULL,
    url VARCHAR(500) NULL,
    checked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_keyword_history (keyword_id, checked_at DESC),
    
    FOREIGN KEY (keyword_id) REFERENCES seo_keywords(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Website pages for SEO audit
CREATE TABLE IF NOT EXISTS seo_pages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    
    url VARCHAR(500) NOT NULL,
    title VARCHAR(255) NULL,
    meta_description TEXT NULL,
    
    -- SEO metrics
    seo_score INT NULL COMMENT '0-100',
    page_speed_score INT NULL,
    mobile_score INT NULL,
    
    -- Issues
    issues JSON NULL COMMENT 'Array of SEO issues found',
    
    -- Content analysis
    word_count INT NULL,
    h1_count INT NULL,
    image_count INT NULL,
    images_without_alt INT NULL,
    internal_links INT NULL,
    external_links INT NULL,
    
    last_crawled_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE KEY uk_workspace_url (workspace_id, url(255)),
    INDEX idx_pages_workspace (workspace_id, seo_score)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Competitor tracking
CREATE TABLE IF NOT EXISTS seo_competitors (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    
    name VARCHAR(255) NOT NULL,
    domain VARCHAR(255) NOT NULL,
    
    -- Metrics
    domain_authority INT NULL,
    organic_traffic INT NULL,
    keywords_count INT NULL,
    backlinks_count INT NULL,
    
    -- Tracking
    is_active TINYINT(1) DEFAULT 1,
    last_checked_at TIMESTAMP NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE KEY uk_workspace_domain (workspace_id, domain),
    INDEX idx_competitors_workspace (workspace_id, is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
