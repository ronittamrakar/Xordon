-- Fix call_scripts table to match frontend expectations
-- Add tags column and rename content to script

-- Add tags column if it doesn't exist
ALTER TABLE call_scripts ADD COLUMN IF NOT EXISTS tags TEXT;

-- Rename content to script (MySQL doesn't support IF EXISTS for column rename)
-- Check if content column exists and script doesn't
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'call_scripts' 
    AND COLUMN_NAME = 'content');

SET @script_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'call_scripts' 
    AND COLUMN_NAME = 'script');

-- Only rename if content exists and script doesn't
SET @sql = IF(@col_exists > 0 AND @script_exists = 0,
    'ALTER TABLE call_scripts CHANGE COLUMN content script TEXT NOT NULL',
    'SELECT "Column already renamed or does not exist" AS message');

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
