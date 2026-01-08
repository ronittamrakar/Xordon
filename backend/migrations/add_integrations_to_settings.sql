-- Add integrations column to listing_settings
ALTER TABLE listing_settings ADD COLUMN IF NOT EXISTS integrations JSON NULL AFTER hours;
