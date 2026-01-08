-- Migration to add blocks and global_styles columns to templates table
-- This allows storing the visual editor block structure for proper template editing

ALTER TABLE templates ADD COLUMN IF NOT EXISTS blocks TEXT DEFAULT NULL;
ALTER TABLE templates ADD COLUMN IF NOT EXISTS global_styles TEXT DEFAULT NULL;

-- Add index for faster lookups
-- CREATE INDEX IF NOT EXISTS idx_templates_user_id ON templates(user_id);
