-- Add missing fields to recipients table for unified contacts
-- Use IF NOT EXISTS syntax to avoid errors if columns already exist
ALTER TABLE recipients 
ADD COLUMN IF NOT EXISTS phone VARCHAR(20) NULL AFTER email,
ADD COLUMN IF NOT EXISTS type VARCHAR(20) NOT NULL DEFAULT 'email' AFTER phone,
ADD COLUMN IF NOT EXISTS title VARCHAR(255) NULL AFTER company,
ADD COLUMN IF NOT EXISTS updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER created_at;

-- Add indexes for performance (only if they don't exist)
CREATE INDEX IF NOT EXISTS idx_recipients_phone ON recipients(phone);
CREATE INDEX IF NOT EXISTS idx_recipients_type ON recipients(type);
CREATE INDEX IF NOT EXISTS idx_recipients_status ON recipients(status);

-- Update existing recipients to have type 'email'
UPDATE recipients SET type = 'email' WHERE type IS NULL OR type = '';