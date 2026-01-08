-- Add custom_fields column to recipients table
ALTER TABLE recipients ADD COLUMN custom_fields TEXT NULL;

-- Add index for better performance when querying custom fields
CREATE INDEX IF NOT EXISTS idx_recipients_custom_fields ON recipients(custom_fields);