-- Fix webforms foreign keys to point to main users table instead of webforms_users
-- This resolves the 500 error (Integrity constraint violation) when creating forms

-- First, update orphaned user_ids to a valid user (id=3 is the first admin in users table)
UPDATE webforms_forms SET user_id = 3 WHERE user_id NOT IN (SELECT id FROM users);
UPDATE webforms_folders SET user_id = 3 WHERE user_id NOT IN (SELECT id FROM users);
UPDATE webforms_activity_logs SET user_id = 3 WHERE user_id NOT IN (SELECT id FROM users);
UPDATE webforms_user_settings SET user_id = 3 WHERE user_id NOT IN (SELECT id FROM users);
UPDATE webforms_spam_rules SET user_id = 3 WHERE user_id NOT IN (SELECT id FROM users);
UPDATE webforms_webhooks SET user_id = 3 WHERE user_id NOT IN (SELECT id FROM users);

-- webforms_forms
ALTER TABLE webforms_forms DROP FOREIGN KEY IF EXISTS webforms_forms_ibfk_1;
ALTER TABLE webforms_forms ADD CONSTRAINT webforms_forms_user_fk FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- webforms_folders
ALTER TABLE webforms_folders DROP FOREIGN KEY IF EXISTS webforms_folders_ibfk_2;
ALTER TABLE webforms_folders ADD CONSTRAINT webforms_folders_user_fk FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- webforms_spam_rules
ALTER TABLE webforms_spam_rules DROP FOREIGN KEY IF EXISTS webforms_spam_rules_ibfk_1;
ALTER TABLE webforms_spam_rules ADD CONSTRAINT webforms_spam_rules_user_fk FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- webforms_webhooks
ALTER TABLE webforms_webhooks DROP FOREIGN KEY IF EXISTS webforms_webhooks_ibfk_1;
ALTER TABLE webforms_webhooks ADD CONSTRAINT webforms_webhooks_user_fk FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- webforms_activity_logs
ALTER TABLE webforms_activity_logs DROP FOREIGN KEY IF EXISTS webforms_activity_logs_ibfk_1;
ALTER TABLE webforms_activity_logs ADD CONSTRAINT webforms_activity_logs_user_fk FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- webforms_user_settings
ALTER TABLE webforms_user_settings DROP FOREIGN KEY IF EXISTS webforms_user_settings_ibfk_1;
ALTER TABLE webforms_user_settings ADD CONSTRAINT webforms_user_settings_user_fk FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
