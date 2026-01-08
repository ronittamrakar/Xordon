-- Make campaign_id nullable in recipients table
ALTER TABLE recipients MODIFY COLUMN campaign_id INT UNSIGNED NULL;

-- Also make type column nullable since we removed it as required
ALTER TABLE recipients MODIFY COLUMN type VARCHAR(20) NULL;