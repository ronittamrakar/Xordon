-- Create listing_sync_jobs table for scheduled directory synchronization
-- Tracks sync job history and status for each listing

CREATE TABLE IF NOT EXISTS listing_sync_jobs (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  workspace_id INT UNSIGNED NOT NULL,
  company_id INT UNSIGNED NOT NULL,
  listing_id INT UNSIGNED NOT NULL,
  provider VARCHAR(50) NOT NULL COMMENT 'yext, whitespark, google_business, etc',
  status VARCHAR(50) NOT NULL DEFAULT 'pending' COMMENT 'pending, running, completed, failed',
  started_at TIMESTAMP NULL DEFAULT NULL,
  finished_at TIMESTAMP NULL DEFAULT NULL,
  error_message TEXT DEFAULT NULL,
  metadata JSON DEFAULT NULL COMMENT 'Provider-specific metadata',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_listing (listing_id),
  INDEX idx_workspace (workspace_id),
  INDEX idx_company (company_id),
  INDEX idx_status (status),
  INDEX idx_provider (provider),
  FOREIGN KEY (listing_id) REFERENCES business_listings(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
