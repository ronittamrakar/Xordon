-- Add missing columns to call_recipients table
-- Run this migration to add campaign_id, notes, disposition_id, call_count, last_call_at, and tags columns

-- Add campaign_id column if not exists
ALTER TABLE call_recipients ADD COLUMN IF NOT EXISTS campaign_id INT NULL AFTER user_id;

-- Add phone_number column if not exists (some systems use phone, others phone_number)
ALTER TABLE call_recipients ADD COLUMN IF NOT EXISTS phone_number VARCHAR(50) NULL AFTER phone;

-- Add notes column if not exists
ALTER TABLE call_recipients ADD COLUMN IF NOT EXISTS notes TEXT NULL AFTER status;

-- Add disposition_id column if not exists
ALTER TABLE call_recipients ADD COLUMN IF NOT EXISTS disposition_id VARCHAR(100) NULL AFTER notes;

-- Add call_count column if not exists
ALTER TABLE call_recipients ADD COLUMN IF NOT EXISTS call_count INT DEFAULT 0 AFTER disposition_id;

-- Add last_call_at column if not exists
ALTER TABLE call_recipients ADD COLUMN IF NOT EXISTS last_call_at TIMESTAMP NULL AFTER call_count;

-- Add tags column if not exists
ALTER TABLE call_recipients ADD COLUMN IF NOT EXISTS tags JSON NULL AFTER last_call_at;

-- Add index on campaign_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_call_recipients_campaign_id ON call_recipients(campaign_id);

-- Add index on user_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_call_recipients_user_id ON call_recipients(user_id);
