-- Create listing_reviews table for review aggregation and management
-- Integrates review data from multiple directory sources

CREATE TABLE IF NOT EXISTS listing_reviews (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  workspace_id INT UNSIGNED NOT NULL,
  company_id INT UNSIGNED NOT NULL,
  listing_id INT UNSIGNED NOT NULL,
  source VARCHAR(100) NOT NULL COMMENT 'google, yelp, facebook, etc',
  external_review_id VARCHAR(255) DEFAULT NULL,
  reviewer_name VARCHAR(255) DEFAULT NULL,
  reviewer_avatar TEXT DEFAULT NULL,
  rating DECIMAL(3,2) NOT NULL COMMENT '0-5 rating',
  review_text TEXT DEFAULT NULL,
  review_date DATE DEFAULT NULL,
  reply_text TEXT DEFAULT NULL,
  replied_at TIMESTAMP NULL DEFAULT NULL,
  sentiment VARCHAR(50) DEFAULT NULL COMMENT 'positive, neutral, negative',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_listing (listing_id),
  INDEX idx_workspace (workspace_id),
  INDEX idx_company (company_id),
  INDEX idx_source (source),
  INDEX idx_rating (rating),
  INDEX idx_sentiment (sentiment),
  INDEX idx_review_date (review_date),
  UNIQUE KEY unique_external_review (listing_id, source, external_review_id),
  FOREIGN KEY (listing_id) REFERENCES business_listings(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
