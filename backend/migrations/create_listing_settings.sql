-- Migration: Create listing_settings table
-- Stores default business information for directory listings

CREATE TABLE IF NOT EXISTS listing_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    company_id INT NOT NULL,
    
    -- Default Business Info
    business_name VARCHAR(255) NULL,
    address VARCHAR(500) NULL,
    phone VARCHAR(20) NULL,
    website VARCHAR(500) NULL,
    description TEXT NULL,
    categories JSON NULL,
    
    -- Social Links
    facebook_url VARCHAR(500) NULL,
    instagram_url VARCHAR(500) NULL,
    twitter_url VARCHAR(500) NULL,
    linkedin_url VARCHAR(500) NULL,
    
    -- Hours
    hours JSON NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE KEY uk_workspace_company (workspace_id, company_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
