-- Migration: Add directory catalog and complex submission fields
-- For comprehensive citation management

CREATE TABLE IF NOT EXISTS directories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE COMMENT 'e.g. google_business, yelp, facebook',
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50) DEFAULT 'general' COMMENT 'general, social, maps, industry_specific',
    description TEXT NULL,
    website_url VARCHAR(500) NULL,
    logo_url VARCHAR(500) NULL,
    
    -- Form Schema (JSON Schema format)
    form_schema JSON NULL COMMENT 'Comprehensive fields required for this directory',
    
    is_active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Update business_listings to link to directory catalog and store complex fields
ALTER TABLE business_listings 
ADD COLUMN IF NOT EXISTS directory_id INT NULL AFTER workspace_id,
ADD COLUMN IF NOT EXISTS submission_data JSON NULL AFTER categories,
ADD INDEX idx_directory_id (directory_id);
