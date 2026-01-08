-- Migration: Add Citation Audit and Duplicate Suppression
-- Features to match Yext/Whitespark capabilities

-- 1. Listing Audits table
CREATE TABLE IF NOT EXISTS listing_audits (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    company_id INT NOT NULL,
    scan_type ENUM('full', 'quick', 'scheduled') DEFAULT 'full',
    status ENUM('pending', 'running', 'completed', 'failed') DEFAULT 'pending',
    score INT DEFAULT 0,
    total_directories_checked INT DEFAULT 0,
    listings_found INT DEFAULT 0,
    nap_errors INT DEFAULT 0,
    duplicates_found INT DEFAULT 0,
    report_data JSON NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL,
    INDEX idx_workspace_company (workspace_id, company_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Listing Duplicates table
CREATE TABLE IF NOT EXISTS listing_duplicates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    company_id INT NOT NULL,
    listing_id INT NULL, -- Reference to our tracked listing if it exists
    directory_id INT NULL,
    directory_name VARCHAR(100) NOT NULL,
    external_url VARCHAR(500) NOT NULL,
    business_name VARCHAR(255) NULL,
    address VARCHAR(500) NULL,
    phone VARCHAR(20) NULL,
    status ENUM('detected', 'suppressing', 'suppressed', 'ignored') DEFAULT 'detected',
    suppression_method VARCHAR(50) NULL,
    suppression_log JSON NULL,
    last_checked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_workspace_company (workspace_id, company_id),
    FOREIGN KEY (listing_id) REFERENCES business_listings(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Add Audit columns to business_listings
ALTER TABLE business_listings
ADD COLUMN nap_consistency_score INT DEFAULT 100 AFTER accuracy_score,
ADD COLUMN is_duplicate BOOLEAN DEFAULT FALSE AFTER nap_consistency_score,
ADD COLUMN duplicate_of_id INT NULL AFTER is_duplicate;
