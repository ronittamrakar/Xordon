-- Migration: Add workspace_id column to folders table
-- This table is used for generic folder management (Projects, Campaigns, etc.)

SET @db := DATABASE();

-- Add workspace_id column if it doesn't exist
SET @has_col := (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'folders' AND COLUMN_NAME = 'workspace_id'
);
SET @sql := IF(@has_col = 0, 'ALTER TABLE folders ADD COLUMN workspace_id INT NULL AFTER user_id', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Backfill workspace_id from user's primary workspace if null
-- This is a best-effort backfill
UPDATE folders f
LEFT JOIN workspace_members wm ON wm.user_id = f.user_id
SET f.workspace_id = wm.workspace_id
WHERE f.workspace_id IS NULL AND wm.workspace_id IS NOT NULL;

-- If still null, default to workspace 1 if it exists
UPDATE folders SET workspace_id = 1 WHERE workspace_id IS NULL;

-- Make it NOT NULL and add index
ALTER TABLE folders MODIFY workspace_id INT NOT NULL;

SET @has_idx := (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.STATISTICS
  WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'folders' AND INDEX_NAME = 'idx_folders_workspace'
);
SET @sql := IF(@has_idx = 0, 'CREATE INDEX idx_folders_workspace ON folders(workspace_id)', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
