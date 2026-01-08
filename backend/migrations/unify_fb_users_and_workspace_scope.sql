-- ============================================================================
-- Migration: Unify fb_users with main users table and enforce workspace_id
-- Database: xordon (merged)
-- 
-- This migration:
-- 1. Adds workspace_id column to all fb_* tables that need tenant scoping
-- 2. Maps fb_users to main users table (by email)
-- 3. Updates user_id references in fb_* tables to point to main users.id
-- 4. Backfills workspace_id for existing data
-- 
-- IMPORTANT: Run a backup before executing this migration!
-- ============================================================================

-- MariaDB 10.4 compatibility notes:
-- - MariaDB 10.4 does NOT support `ADD COLUMN IF NOT EXISTS`.
-- - Index creation also lacks `CREATE INDEX IF NOT EXISTS`.
-- This script uses INFORMATION_SCHEMA checks + dynamic SQL to stay idempotent.

-- Safety preconditions (used later for fallback assignments)
-- Expect workspace_id=1 and user_id=1 to exist.
-- If you do not have these, update the fallback values in STEP 6.

-- ============================================================================
-- STEP 1: Add workspace_id columns to fb_* tables (if not exists)
-- ============================================================================

-- webforms_folders
SET @db := DATABASE();

SET @has_col := (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'webforms_folders' AND COLUMN_NAME = 'workspace_id'
);
SET @sql := IF(@has_col = 0, 'ALTER TABLE webforms_folders ADD COLUMN workspace_id INT NULL AFTER user_id', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- webforms_forms
SET @has_col := (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'webforms_forms' AND COLUMN_NAME = 'workspace_id'
);
SET @sql := IF(@has_col = 0, 'ALTER TABLE webforms_forms ADD COLUMN workspace_id INT NULL AFTER user_id', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- webforms_spam_rules
SET @has_col := (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'webforms_spam_rules' AND COLUMN_NAME = 'workspace_id'
);
SET @sql := IF(@has_col = 0, 'ALTER TABLE webforms_spam_rules ADD COLUMN workspace_id INT NULL AFTER user_id', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- webforms_webhooks
SET @has_col := (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'webforms_webhooks' AND COLUMN_NAME = 'workspace_id'
);
SET @sql := IF(@has_col = 0, 'ALTER TABLE webforms_webhooks ADD COLUMN workspace_id INT NULL AFTER user_id', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- webforms_activity_logs
SET @has_col := (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'webforms_activity_logs' AND COLUMN_NAME = 'workspace_id'
);
SET @sql := IF(@has_col = 0, 'ALTER TABLE webforms_activity_logs ADD COLUMN workspace_id INT NULL AFTER user_id', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- webforms_user_settings
SET @has_col := (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'webforms_user_settings' AND COLUMN_NAME = 'workspace_id'
);
SET @sql := IF(@has_col = 0, 'ALTER TABLE webforms_user_settings ADD COLUMN workspace_id INT NULL AFTER user_id', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- ============================================================================
-- STEP 2: Create temporary mapping table (fb_users.id -> users.id)
-- ============================================================================

DROP TABLE IF EXISTS _webforms_user_map;

CREATE TABLE _webforms_user_map (
    webforms_user_id INT PRIMARY KEY,
    main_user_id INT NOT NULL,
    main_workspace_id INT NOT NULL,
    email VARCHAR(255)
);

-- ============================================================================
-- STEP 3: Insert users from fb_users that don't exist in main users table
-- ============================================================================

INSERT INTO users (email, name, password_hash, created_at)
SELECT 
    fu.email,
    CONCAT(COALESCE(fu.first_name, ''), ' ', COALESCE(fu.last_name, '')),
    fu.password_hash,
    NOW()
FROM fb_users fu
LEFT JOIN users u ON LOWER(u.email) = LOWER(fu.email)
WHERE fu.email IS NOT NULL 
  AND fu.email <> '' 
  AND u.id IS NULL;

-- ============================================================================
-- STEP 4: Populate the mapping table
-- We map each fb_user to the corresponding main user (by email)
-- and assign them to workspace 1 (default workspace) if they don't have one
-- ============================================================================

INSERT INTO _webforms_user_map (webforms_user_id, main_user_id, main_workspace_id, email)
SELECT 
    fu.id AS webforms_user_id,
    u.id AS main_user_id,
    COALESCE(
        (SELECT wm.workspace_id FROM workspace_members wm WHERE wm.user_id = u.id LIMIT 1),
        1  -- Default to workspace 1 if user has no workspace membership
    ) AS main_workspace_id,
    fu.email
FROM fb_users fu
JOIN users u ON LOWER(u.email) = LOWER(fu.email);

-- ============================================================================
-- STEP 5: Update fb_* tables to use main users.id and set workspace_id
-- ============================================================================

-- webforms_folders
UPDATE webforms_folders f
JOIN _webforms_user_map m ON m.webforms_user_id = f.user_id
SET f.user_id = m.main_user_id,
    f.workspace_id = m.main_workspace_id
WHERE f.workspace_id IS NULL OR f.user_id IN (SELECT webforms_user_id FROM _webforms_user_map);

-- webforms_forms
UPDATE webforms_forms f
JOIN _webforms_user_map m ON m.webforms_user_id = f.user_id
SET f.user_id = m.main_user_id,
    f.workspace_id = m.main_workspace_id
WHERE f.workspace_id IS NULL OR f.user_id IN (SELECT webforms_user_id FROM _webforms_user_map);

-- webforms_spam_rules
UPDATE webforms_spam_rules sr
JOIN _webforms_user_map m ON m.webforms_user_id = sr.user_id
SET sr.user_id = m.main_user_id,
    sr.workspace_id = m.main_workspace_id
WHERE sr.workspace_id IS NULL OR sr.user_id IN (SELECT webforms_user_id FROM _webforms_user_map);

-- webforms_webhooks
UPDATE webforms_webhooks w
JOIN _webforms_user_map m ON m.webforms_user_id = w.user_id
SET w.user_id = m.main_user_id,
    w.workspace_id = m.main_workspace_id
WHERE w.workspace_id IS NULL OR w.user_id IN (SELECT webforms_user_id FROM _webforms_user_map);

-- webforms_activity_logs
UPDATE webforms_activity_logs al
JOIN _webforms_user_map m ON m.webforms_user_id = al.user_id
SET al.user_id = m.main_user_id,
    al.workspace_id = m.main_workspace_id
WHERE al.workspace_id IS NULL OR al.user_id IN (SELECT webforms_user_id FROM _webforms_user_map);

-- webforms_user_settings
UPDATE webforms_user_settings us
JOIN _webforms_user_map m ON m.webforms_user_id = us.user_id
SET us.user_id = m.main_user_id,
    us.workspace_id = m.main_workspace_id
WHERE us.workspace_id IS NULL OR us.user_id IN (SELECT webforms_user_id FROM _webforms_user_map);

-- ============================================================================
-- STEP 6: Handle orphaned rows (user_id not in fb_users or mapping failed)
-- Assign them to workspace 1 and user 1 (admin fallback)
-- ============================================================================

SET @fallback_user_id := (SELECT MIN(id) FROM users);
SET @fallback_user_id := IFNULL(@fallback_user_id, 0);

UPDATE webforms_folders SET workspace_id = 1, user_id = @fallback_user_id 
WHERE workspace_id IS NULL;

UPDATE webforms_forms SET workspace_id = 1, user_id = @fallback_user_id 
WHERE workspace_id IS NULL;

UPDATE webforms_spam_rules SET workspace_id = 1, user_id = @fallback_user_id 
WHERE workspace_id IS NULL;

UPDATE webforms_webhooks SET workspace_id = 1, user_id = @fallback_user_id 
WHERE workspace_id IS NULL;

UPDATE webforms_activity_logs SET workspace_id = 1, user_id = @fallback_user_id 
WHERE workspace_id IS NULL;

UPDATE webforms_user_settings SET workspace_id = 1, user_id = @fallback_user_id 
WHERE workspace_id IS NULL;

-- ============================================================================
-- STEP 7: Make workspace_id NOT NULL and add indexes
-- ============================================================================

ALTER TABLE webforms_folders MODIFY workspace_id INT NOT NULL;
ALTER TABLE webforms_forms MODIFY workspace_id INT NOT NULL;
ALTER TABLE webforms_spam_rules MODIFY workspace_id INT NOT NULL;
ALTER TABLE webforms_webhooks MODIFY workspace_id INT NOT NULL;
ALTER TABLE webforms_activity_logs MODIFY workspace_id INT NOT NULL;
ALTER TABLE webforms_user_settings MODIFY workspace_id INT NOT NULL;

-- Add indexes for workspace_id
SET @has_idx := (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.STATISTICS
  WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'webforms_folders' AND INDEX_NAME = 'idx_webforms_folders_workspace'
);
SET @sql := IF(@has_idx = 0, 'CREATE INDEX idx_webforms_folders_workspace ON webforms_folders(workspace_id)', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @has_idx := (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.STATISTICS
  WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'webforms_forms' AND INDEX_NAME = 'idx_webforms_forms_workspace'
);
SET @sql := IF(@has_idx = 0, 'CREATE INDEX idx_webforms_forms_workspace ON webforms_forms(workspace_id)', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @has_idx := (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.STATISTICS
  WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'webforms_spam_rules' AND INDEX_NAME = 'idx_webforms_spam_rules_workspace'
);
SET @sql := IF(@has_idx = 0, 'CREATE INDEX idx_webforms_spam_rules_workspace ON webforms_spam_rules(workspace_id)', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @has_idx := (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.STATISTICS
  WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'webforms_webhooks' AND INDEX_NAME = 'idx_webforms_webhooks_workspace'
);
SET @sql := IF(@has_idx = 0, 'CREATE INDEX idx_webforms_webhooks_workspace ON webforms_webhooks(workspace_id)', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @has_idx := (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.STATISTICS
  WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'webforms_activity_logs' AND INDEX_NAME = 'idx_webforms_activity_logs_workspace'
);
SET @sql := IF(@has_idx = 0, 'CREATE INDEX idx_webforms_activity_logs_workspace ON webforms_activity_logs(workspace_id)', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @has_idx := (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.STATISTICS
  WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'webforms_user_settings' AND INDEX_NAME = 'idx_webforms_user_settings_workspace'
);
SET @sql := IF(@has_idx = 0, 'CREATE INDEX idx_webforms_user_settings_workspace ON webforms_user_settings(workspace_id)', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- ============================================================================
-- STEP 8: Verification queries (run these to confirm migration success)
-- ============================================================================

-- Check for any remaining NULL workspace_id values
SELECT 'webforms_folders' AS tbl, COUNT(*) AS null_count FROM webforms_folders WHERE workspace_id IS NULL
UNION ALL
SELECT 'webforms_forms', COUNT(*) FROM webforms_forms WHERE workspace_id IS NULL
UNION ALL
SELECT 'webforms_spam_rules', COUNT(*) FROM webforms_spam_rules WHERE workspace_id IS NULL
UNION ALL
SELECT 'webforms_webhooks', COUNT(*) FROM webforms_webhooks WHERE workspace_id IS NULL
UNION ALL
SELECT 'webforms_activity_logs', COUNT(*) FROM webforms_activity_logs WHERE workspace_id IS NULL
UNION ALL
SELECT 'webforms_user_settings', COUNT(*) FROM webforms_user_settings WHERE workspace_id IS NULL;

-- Show mapping summary
SELECT 
    COUNT(*) AS total_mapped,
    COUNT(DISTINCT main_user_id) AS unique_main_users,
    COUNT(DISTINCT main_workspace_id) AS unique_workspaces
FROM _webforms_user_map;

-- ============================================================================
-- STEP 9: Cleanup (optional - run after confirming migration success)
-- ============================================================================

-- Keep the mapping table for reference, or drop it:
-- DROP TABLE IF EXISTS _fb_user_map;

-- fb_users table can be kept for reference or dropped later:
-- RENAME TABLE fb_users TO fb_users_deprecated;
-- or: DROP TABLE fb_users;

-- ============================================================================
-- NOTES:
-- - fb_users is now DEPRECATED - do not use for new auth
-- - All fb_* tables now reference main users.id
-- - All fb_* tables now have workspace_id for tenant scoping
-- - Queries should filter by workspace_id for proper isolation
-- ============================================================================
