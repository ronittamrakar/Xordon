-- Consolidated migration for Listings & SEO Tables with Company Scoping

-- Business Listings
CREATE TABLE IF NOT EXISTS business_listings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    company_id INT NOT NULL,
    directory VARCHAR(50) NOT NULL,
    directory_name VARCHAR(100) NOT NULL,
    listing_url VARCHAR(500) NULL,
    status ENUM('not_listed', 'pending', 'claimed', 'verified', 'needs_update', 'error') DEFAULT 'not_listed',
    claim_status ENUM('unclaimed', 'claimed', 'verified') DEFAULT 'unclaimed',
    claim_url VARCHAR(500) NULL,
    business_name VARCHAR(255) NULL,
    address VARCHAR(500) NULL,
    phone VARCHAR(20) NULL,
    website VARCHAR(500) NULL,
    categories JSON NULL,
    name_accurate TINYINT(1) NULL,
    address_accurate TINYINT(1) NULL,
    phone_accurate TINYINT(1) NULL,
    website_accurate TINYINT(1) NULL,
    hours_accurate TINYINT(1) NULL,
    accuracy_score INT NULL,
    last_checked_at TIMESTAMP NULL,
    last_updated_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_workspace_company_directory (workspace_id, company_id, directory)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- SEO Keywords
CREATE TABLE IF NOT EXISTS seo_keywords (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    company_id INT NOT NULL,
    keyword VARCHAR(255) NOT NULL,
    search_volume INT NULL,
    difficulty INT NULL,
    current_position INT NULL,
    previous_position INT NULL,
    best_position INT NULL,
    target_url VARCHAR(500) NULL,
    is_tracked TINYINT(1) DEFAULT 1,
    location VARCHAR(100) NULL,
    last_checked_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_workspace_company_keyword_location (workspace_id, company_id, keyword, location)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- SEO Pages
CREATE TABLE IF NOT EXISTS seo_pages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    company_id INT NOT NULL,
    url VARCHAR(500) NOT NULL,
    title VARCHAR(255) NULL,
    meta_description TEXT NULL,
    seo_score INT NULL,
    page_speed_score INT NULL,
    mobile_score INT NULL,
    issues JSON NULL,
    word_count INT NULL,
    h1_count INT NULL,
    image_count INT NULL,
    images_without_alt INT NULL,
    internal_links INT NULL,
    external_links INT NULL,
    last_crawled_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_workspace_company_url (workspace_id, company_id, url(255))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- SEO Competitors
CREATE TABLE IF NOT EXISTS seo_competitors (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    company_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    domain VARCHAR(255) NOT NULL,
    domain_authority INT NULL,
    organic_traffic INT NULL,
    keywords_count INT NULL,
    backlinks_count INT NULL,
    is_active TINYINT(1) DEFAULT 1,
    last_checked_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_workspace_company_domain (workspace_id, company_id, domain)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Listing Reviews
CREATE TABLE IF NOT EXISTS listing_reviews (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  workspace_id INT UNSIGNED NOT NULL,
  company_id INT UNSIGNED NOT NULL,
  listing_id INT UNSIGNED NOT NULL, -- Logical link, might not be FK if listing deleted? Better valid FK.
  source VARCHAR(100) NOT NULL,
  external_review_id VARCHAR(255) DEFAULT NULL,
  reviewer_name VARCHAR(255) DEFAULT NULL,
  reviewer_avatar TEXT DEFAULT NULL,
  rating DECIMAL(3,2) NOT NULL,
  review_text TEXT DEFAULT NULL,
  review_date DATE DEFAULT NULL,
  reply_text TEXT DEFAULT NULL,
  replied_at TIMESTAMP NULL DEFAULT NULL,
  sentiment VARCHAR(50) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_external_review (listing_id, source, external_review_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Listing Audits
CREATE TABLE IF NOT EXISTS listing_audits (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    company_id INT NOT NULL,
    scan_type VARCHAR(50) DEFAULT 'full',
    status VARCHAR(50) DEFAULT 'pending',
    report_data JSON,
    score INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Listing Duplicates
CREATE TABLE IF NOT EXISTS listing_duplicates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    company_id INT NOT NULL,
    directory_name VARCHAR(100),
    duplicate_url VARCHAR(500),
    status VARCHAR(50) DEFAULT 'detected',
    suppression_log JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
