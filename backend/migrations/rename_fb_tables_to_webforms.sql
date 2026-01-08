-- ============================================================================
-- Migration: Rename fb_* tables to webforms_* (Webforms module naming)
-- Database: xordon
--
-- This migration:
-- 1) Renames existing fb_* tables to webforms_*
-- 2) Creates backward-compatible views named fb_* pointing to webforms_*
--
-- MariaDB 10.4 compatibility:
-- - No RENAME TABLE IF EXISTS
-- - No CREATE VIEW IF NOT EXISTS
-- So we use INFORMATION_SCHEMA checks + dynamic SQL.
-- ============================================================================

SET @db := DATABASE();

-- Helper: rename fb_table -> webforms_table when fb exists and webforms does not
-- ============================================================================

-- fb_folders
SET @has_fb := (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.TABLES
  WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'fb_folders'
);
SET @has_webforms := (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.TABLES
  WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'webforms_folders'
);
SET @sql := IF(@has_fb > 0 AND @has_webforms = 0, 'RENAME TABLE fb_folders TO webforms_folders', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- fb_forms
SET @has_fb := (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.TABLES
  WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'fb_forms'
);
SET @has_webforms := (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.TABLES
  WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'webforms_forms'
);
SET @sql := IF(@has_fb > 0 AND @has_webforms = 0, 'RENAME TABLE fb_forms TO webforms_forms', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- fb_form_fields
SET @has_fb := (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.TABLES
  WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'fb_form_fields'
);
SET @has_webforms := (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.TABLES
  WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'webforms_form_fields'
);
SET @sql := IF(@has_fb > 0 AND @has_webforms = 0, 'RENAME TABLE fb_form_fields TO webforms_form_fields', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- fb_field_options
SET @has_fb := (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.TABLES
  WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'fb_field_options'
);
SET @has_webforms := (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.TABLES
  WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'webforms_field_options'
);
SET @sql := IF(@has_fb > 0 AND @has_webforms = 0, 'RENAME TABLE fb_field_options TO webforms_field_options', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- fb_form_submissions
SET @has_fb := (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.TABLES
  WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'fb_form_submissions'
);
SET @has_webforms := (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.TABLES
  WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'webforms_form_submissions'
);
SET @sql := IF(@has_fb > 0 AND @has_webforms = 0, 'RENAME TABLE fb_form_submissions TO webforms_form_submissions', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- fb_field_responses
SET @has_fb := (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.TABLES
  WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'fb_field_responses'
);
SET @has_webforms := (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.TABLES
  WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'webforms_field_responses'
);
SET @sql := IF(@has_fb > 0 AND @has_webforms = 0, 'RENAME TABLE fb_field_responses TO webforms_field_responses', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- fb_form_templates
SET @has_fb := (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.TABLES
  WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'fb_form_templates'
);
SET @has_webforms := (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.TABLES
  WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'webforms_form_templates'
);
SET @sql := IF(@has_fb > 0 AND @has_webforms = 0, 'RENAME TABLE fb_form_templates TO webforms_form_templates', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- fb_spam_rules
SET @has_fb := (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.TABLES
  WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'fb_spam_rules'
);
SET @has_webforms := (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.TABLES
  WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'webforms_spam_rules'
);
SET @sql := IF(@has_fb > 0 AND @has_webforms = 0, 'RENAME TABLE fb_spam_rules TO webforms_spam_rules', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- fb_webhooks
SET @has_fb := (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.TABLES
  WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'fb_webhooks'
);
SET @has_webforms := (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.TABLES
  WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'webforms_webhooks'
);
SET @sql := IF(@has_fb > 0 AND @has_webforms = 0, 'RENAME TABLE fb_webhooks TO webforms_webhooks', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- fb_webhook_deliveries
SET @has_fb := (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.TABLES
  WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'fb_webhook_deliveries'
);
SET @has_webforms := (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.TABLES
  WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'webforms_webhook_deliveries'
);
SET @sql := IF(@has_fb > 0 AND @has_webforms = 0, 'RENAME TABLE fb_webhook_deliveries TO webforms_webhook_deliveries', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- fb_form_views
SET @has_fb := (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.TABLES
  WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'fb_form_views'
);
SET @has_webforms := (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.TABLES
  WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'webforms_form_views'
);
SET @sql := IF(@has_fb > 0 AND @has_webforms = 0, 'RENAME TABLE fb_form_views TO webforms_form_views', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- fb_form_starts
SET @has_fb := (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.TABLES
  WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'fb_form_starts'
);
SET @has_webforms := (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.TABLES
  WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'webforms_form_starts'
);
SET @sql := IF(@has_fb > 0 AND @has_webforms = 0, 'RENAME TABLE fb_form_starts TO webforms_form_starts', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- fb_field_interactions
SET @has_fb := (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.TABLES
  WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'fb_field_interactions'
);
SET @has_webforms := (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.TABLES
  WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'webforms_field_interactions'
);
SET @sql := IF(@has_fb > 0 AND @has_webforms = 0, 'RENAME TABLE fb_field_interactions TO webforms_field_interactions', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- fb_form_analytics
SET @has_fb := (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.TABLES
  WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'fb_form_analytics'
);
SET @has_webforms := (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.TABLES
  WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'webforms_form_analytics'
);
SET @sql := IF(@has_fb > 0 AND @has_webforms = 0, 'RENAME TABLE fb_form_analytics TO webforms_form_analytics', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- fb_activity_logs
SET @has_fb := (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.TABLES
  WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'fb_activity_logs'
);
SET @has_webforms := (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.TABLES
  WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'webforms_activity_logs'
);
SET @sql := IF(@has_fb > 0 AND @has_webforms = 0, 'RENAME TABLE fb_activity_logs TO webforms_activity_logs', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- fb_user_settings
SET @has_fb := (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.TABLES
  WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'fb_user_settings'
);
SET @has_webforms := (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.TABLES
  WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'webforms_user_settings'
);
SET @sql := IF(@has_fb > 0 AND @has_webforms = 0, 'RENAME TABLE fb_user_settings TO webforms_user_settings', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- fb_users
SET @has_fb := (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.TABLES
  WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'fb_users'
);
SET @has_webforms := (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.TABLES
  WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'webforms_users'
);
SET @sql := IF(@has_fb > 0 AND @has_webforms = 0, 'RENAME TABLE fb_users TO webforms_users', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- ============================================================================
-- Backward compatibility: create fb_* views pointing to webforms_* tables
-- ============================================================================

-- Helper: create view when fb_* name is free and webforms_* exists

-- fb_folders view
SET @has_fb := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES
  WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'fb_folders'
);
SET @has_webforms := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES
  WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'webforms_folders'
);
SET @sql := IF(@has_fb = 0 AND @has_webforms > 0, 'CREATE VIEW fb_folders AS SELECT * FROM webforms_folders', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- fb_forms view
SET @has_fb := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES
  WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'fb_forms'
);
SET @has_webforms := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES
  WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'webforms_forms'
);
SET @sql := IF(@has_fb = 0 AND @has_webforms > 0, 'CREATE VIEW fb_forms AS SELECT * FROM webforms_forms', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- fb_form_fields view
SET @has_fb := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES
  WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'fb_form_fields'
);
SET @has_webforms := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES
  WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'webforms_form_fields'
);
SET @sql := IF(@has_fb = 0 AND @has_webforms > 0, 'CREATE VIEW fb_form_fields AS SELECT * FROM webforms_form_fields', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- fb_field_options view
SET @has_fb := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES
  WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'fb_field_options'
);
SET @has_webforms := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES
  WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'webforms_field_options'
);
SET @sql := IF(@has_fb = 0 AND @has_webforms > 0, 'CREATE VIEW fb_field_options AS SELECT * FROM webforms_field_options', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- fb_form_submissions view
SET @has_fb := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES
  WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'fb_form_submissions'
);
SET @has_webforms := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES
  WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'webforms_form_submissions'
);
SET @sql := IF(@has_fb = 0 AND @has_webforms > 0, 'CREATE VIEW fb_form_submissions AS SELECT * FROM webforms_form_submissions', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- fb_field_responses view
SET @has_fb := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES
  WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'fb_field_responses'
);
SET @has_webforms := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES
  WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'webforms_field_responses'
);
SET @sql := IF(@has_fb = 0 AND @has_webforms > 0, 'CREATE VIEW fb_field_responses AS SELECT * FROM webforms_field_responses', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- fb_form_templates view
SET @has_fb := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES
  WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'fb_form_templates'
);
SET @has_webforms := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES
  WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'webforms_form_templates'
);
SET @sql := IF(@has_fb = 0 AND @has_webforms > 0, 'CREATE VIEW fb_form_templates AS SELECT * FROM webforms_form_templates', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- fb_spam_rules view
SET @has_fb := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES
  WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'fb_spam_rules'
);
SET @has_webforms := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES
  WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'webforms_spam_rules'
);
SET @sql := IF(@has_fb = 0 AND @has_webforms > 0, 'CREATE VIEW fb_spam_rules AS SELECT * FROM webforms_spam_rules', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- fb_webhooks view
SET @has_fb := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES
  WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'fb_webhooks'
);
SET @has_webforms := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES
  WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'webforms_webhooks'
);
SET @sql := IF(@has_fb = 0 AND @has_webforms > 0, 'CREATE VIEW fb_webhooks AS SELECT * FROM webforms_webhooks', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- fb_webhook_deliveries view
SET @has_fb := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES
  WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'fb_webhook_deliveries'
);
SET @has_webforms := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES
  WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'webforms_webhook_deliveries'
);
SET @sql := IF(@has_fb = 0 AND @has_webforms > 0, 'CREATE VIEW fb_webhook_deliveries AS SELECT * FROM webforms_webhook_deliveries', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- fb_form_views view
SET @has_fb := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES
  WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'fb_form_views'
);
SET @has_webforms := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES
  WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'webforms_form_views'
);
SET @sql := IF(@has_fb = 0 AND @has_webforms > 0, 'CREATE VIEW fb_form_views AS SELECT * FROM webforms_form_views', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- fb_form_starts view
SET @has_fb := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES
  WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'fb_form_starts'
);
SET @has_webforms := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES
  WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'webforms_form_starts'
);
SET @sql := IF(@has_fb = 0 AND @has_webforms > 0, 'CREATE VIEW fb_form_starts AS SELECT * FROM webforms_form_starts', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- fb_field_interactions view
SET @has_fb := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES
  WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'fb_field_interactions'
);
SET @has_webforms := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES
  WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'webforms_field_interactions'
);
SET @sql := IF(@has_fb = 0 AND @has_webforms > 0, 'CREATE VIEW fb_field_interactions AS SELECT * FROM webforms_field_interactions', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- fb_form_analytics view
SET @has_fb := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES
  WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'fb_form_analytics'
);
SET @has_webforms := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES
  WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'webforms_form_analytics'
);
SET @sql := IF(@has_fb = 0 AND @has_webforms > 0, 'CREATE VIEW fb_form_analytics AS SELECT * FROM webforms_form_analytics', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- fb_activity_logs view
SET @has_fb := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES
  WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'fb_activity_logs'
);
SET @has_webforms := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES
  WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'webforms_activity_logs'
);
SET @sql := IF(@has_fb = 0 AND @has_webforms > 0, 'CREATE VIEW fb_activity_logs AS SELECT * FROM webforms_activity_logs', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- fb_user_settings view
SET @has_fb := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES
  WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'fb_user_settings'
);
SET @has_webforms := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES
  WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'webforms_user_settings'
);
SET @sql := IF(@has_fb = 0 AND @has_webforms > 0, 'CREATE VIEW fb_user_settings AS SELECT * FROM webforms_user_settings', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- fb_users view
SET @has_fb := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES
  WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'fb_users'
);
SET @has_webforms := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES
  WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'webforms_users'
);
SET @sql := IF(@has_fb = 0 AND @has_webforms > 0, 'CREATE VIEW fb_users AS SELECT * FROM webforms_users', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
