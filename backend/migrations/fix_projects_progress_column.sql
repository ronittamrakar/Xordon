-- Fix for projects table - ensure progress_percentage column exists
-- This is a safe migration that only adds the column if it doesn't exist

-- Check and add progress_percentage if missing
SET @dbname = DATABASE();
SET @tablename = 'projects';
SET @columnname = 'progress_percentage';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (column_name = @columnname)
  ) > 0,
  'SELECT 1',
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @columnname, ' INT DEFAULT 0 AFTER completed_at')
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Ensure the column has the right default value
ALTER TABLE projects MODIFY COLUMN progress_percentage INT DEFAULT 0;
