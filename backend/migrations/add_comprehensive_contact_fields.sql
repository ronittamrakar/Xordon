-- Add comprehensive contact fields to recipients table for unified contacts
-- This migration adds all fields needed by the Contacts page

-- Add address fields
ALTER TABLE recipients ADD COLUMN IF NOT EXISTS address VARCHAR(255) NULL;
ALTER TABLE recipients ADD COLUMN IF NOT EXISTS city VARCHAR(100) NULL;
ALTER TABLE recipients ADD COLUMN IF NOT EXISTS state VARCHAR(100) NULL;
ALTER TABLE recipients ADD COLUMN IF NOT EXISTS country VARCHAR(100) NULL;
ALTER TABLE recipients ADD COLUMN IF NOT EXISTS postal_code VARCHAR(20) NULL;

-- Add social and web fields
ALTER TABLE recipients ADD COLUMN IF NOT EXISTS website VARCHAR(255) NULL;
ALTER TABLE recipients ADD COLUMN IF NOT EXISTS linkedin VARCHAR(255) NULL;
ALTER TABLE recipients ADD COLUMN IF NOT EXISTS twitter VARCHAR(255) NULL;

-- Add business fields
ALTER TABLE recipients ADD COLUMN IF NOT EXISTS industry VARCHAR(100) NULL;
ALTER TABLE recipients ADD COLUMN IF NOT EXISTS company_size VARCHAR(50) NULL;
ALTER TABLE recipients ADD COLUMN IF NOT EXISTS annual_revenue VARCHAR(50) NULL;
ALTER TABLE recipients ADD COLUMN IF NOT EXISTS technology VARCHAR(255) NULL;

-- Add additional fields
ALTER TABLE recipients ADD COLUMN IF NOT EXISTS notes TEXT NULL;
ALTER TABLE recipients ADD COLUMN IF NOT EXISTS birthday DATE NULL;
ALTER TABLE recipients ADD COLUMN IF NOT EXISTS lead_source VARCHAR(100) NULL;

-- Add indexes for commonly filtered fields
CREATE INDEX IF NOT EXISTS idx_recipients_city ON recipients(city);
CREATE INDEX IF NOT EXISTS idx_recipients_state ON recipients(state);
CREATE INDEX IF NOT EXISTS idx_recipients_country ON recipients(country);
CREATE INDEX IF NOT EXISTS idx_recipients_industry ON recipients(industry);
CREATE INDEX IF NOT EXISTS idx_recipients_lead_source ON recipients(lead_source);
