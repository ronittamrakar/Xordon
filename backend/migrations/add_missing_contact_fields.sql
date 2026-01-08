-- Add missing contact fields to recipients table
-- These fields are used by ContactsController but may not exist

-- Add additional_details column
ALTER TABLE recipients ADD COLUMN IF NOT EXISTS additional_details TEXT NULL;

-- Add company_size_selection column  
ALTER TABLE recipients ADD COLUMN IF NOT EXISTS company_size_selection VARCHAR(50) NULL;

-- Ensure all other comprehensive fields exist
ALTER TABLE recipients ADD COLUMN IF NOT EXISTS address VARCHAR(255) NULL;
ALTER TABLE recipients ADD COLUMN IF NOT EXISTS city VARCHAR(100) NULL;
ALTER TABLE recipients ADD COLUMN IF NOT EXISTS state VARCHAR(100) NULL;
ALTER TABLE recipients ADD COLUMN IF NOT EXISTS country VARCHAR(100) NULL;
ALTER TABLE recipients ADD COLUMN IF NOT EXISTS postal_code VARCHAR(20) NULL;
ALTER TABLE recipients ADD COLUMN IF NOT EXISTS website VARCHAR(255) NULL;
ALTER TABLE recipients ADD COLUMN IF NOT EXISTS linkedin VARCHAR(255) NULL;
ALTER TABLE recipients ADD COLUMN IF NOT EXISTS twitter VARCHAR(255) NULL;
ALTER TABLE recipients ADD COLUMN IF NOT EXISTS industry VARCHAR(100) NULL;
ALTER TABLE recipients ADD COLUMN IF NOT EXISTS company_size VARCHAR(50) NULL;
ALTER TABLE recipients ADD COLUMN IF NOT EXISTS annual_revenue VARCHAR(50) NULL;
ALTER TABLE recipients ADD COLUMN IF NOT EXISTS technology VARCHAR(255) NULL;
ALTER TABLE recipients ADD COLUMN IF NOT EXISTS notes TEXT NULL;
ALTER TABLE recipients ADD COLUMN IF NOT EXISTS birthday DATE NULL;
ALTER TABLE recipients ADD COLUMN IF NOT EXISTS lead_source VARCHAR(100) NULL;
ALTER TABLE recipients ADD COLUMN IF NOT EXISTS user_id INT NULL;
ALTER TABLE recipients ADD COLUMN IF NOT EXISTS unsubscribed_at DATETIME NULL;
