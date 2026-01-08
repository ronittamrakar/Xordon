-- Add sync and review fields to business_listings table
-- For Whitespark/Yext-like citation management functionality

ALTER TABLE business_listings 
ADD COLUMN IF NOT EXISTS external_id VARCHAR(255) DEFAULT NULL COMMENT 'External provider listing ID',
ADD COLUMN IF NOT EXISTS sync_provider VARCHAR(50) DEFAULT NULL COMMENT 'yext, whitespark, manual, etc',
ADD COLUMN IF NOT EXISTS sync_status VARCHAR(50) DEFAULT 'pending' COMMENT 'pending, syncing, synced, error, claimed, verified',
ADD COLUMN IF NOT EXISTS claim_url TEXT DEFAULT NULL COMMENT 'URL to claim this listing',
ADD COLUMN IF NOT EXISTS claim_status VARCHAR(50) DEFAULT 'unclaimed' COMMENT 'unclaimed, claimed, verified',
ADD COLUMN IF NOT EXISTS review_count INT DEFAULT 0 COMMENT 'Total number of reviews',
ADD COLUMN IF NOT EXISTS rating_avg DECIMAL(3,2) DEFAULT NULL COMMENT 'Average rating (0-5)',
ADD COLUMN IF NOT EXISTS last_synced_at TIMESTAMP NULL DEFAULT NULL COMMENT 'Last successful sync timestamp',
ADD COLUMN IF NOT EXISTS sync_error TEXT DEFAULT NULL COMMENT 'Last sync error message if any',
ADD INDEX idx_sync_status (sync_status),
ADD INDEX idx_claim_status (claim_status),
ADD INDEX idx_sync_provider (sync_provider),
ADD INDEX idx_external_id (external_id);
