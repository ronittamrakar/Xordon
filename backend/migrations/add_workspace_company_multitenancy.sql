-- Workspace + Company multitenancy hardening
-- NOTE: Column additions are handled in Database.php for idempotency.
-- This file only contains safe CREATE TABLE IF NOT EXISTS and backfill statements.

-- user_company_access mapping
CREATE TABLE IF NOT EXISTS user_company_access (
  id INT AUTO_INCREMENT PRIMARY KEY,
  workspace_id INT NOT NULL,
  user_id INT NOT NULL,
  company_id INT NOT NULL,
  role ENUM('owner','admin','member','viewer') NOT NULL DEFAULT 'member',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_user_company (workspace_id, user_id, company_id),
  INDEX idx_uca_workspace_user (workspace_id, user_id),
  INDEX idx_uca_company (company_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Backfill: set workspace_id based on existing user ownership where possible
-- companies.user_id -> workspace
UPDATE companies c
JOIN workspace_members wm ON wm.user_id = c.user_id
SET c.workspace_id = wm.workspace_id
WHERE c.workspace_id IS NULL;

-- campaigns.user_id -> workspace
UPDATE campaigns c
JOIN workspace_members wm ON wm.user_id = c.user_id
SET c.workspace_id = wm.workspace_id
WHERE c.workspace_id IS NULL;

-- templates.user_id -> workspace
UPDATE templates t
JOIN workspace_members wm ON wm.user_id = t.user_id
SET t.workspace_id = wm.workspace_id
WHERE t.workspace_id IS NULL;

-- sending_accounts.user_id -> workspace
UPDATE sending_accounts sa
JOIN workspace_members wm ON wm.user_id = sa.user_id
SET sa.workspace_id = wm.workspace_id
WHERE sa.workspace_id IS NULL;

-- sequences.user_id -> workspace
UPDATE sequences s
JOIN workspace_members wm ON wm.user_id = s.user_id
SET s.workspace_id = wm.workspace_id
WHERE s.workspace_id IS NULL;

-- settings.user_id -> workspace
UPDATE settings s
JOIN workspace_members wm ON wm.user_id = s.user_id
SET s.workspace_id = wm.workspace_id
WHERE s.workspace_id IS NULL;

-- recipients: derive workspace from campaign
UPDATE recipients r
JOIN campaigns c ON c.id = r.campaign_id
SET r.workspace_id = c.workspace_id
WHERE r.workspace_id IS NULL;

-- Backfill user_company_access: grant creators access to their companies
INSERT IGNORE INTO user_company_access (workspace_id, user_id, company_id, role)
SELECT c.workspace_id, c.user_id, c.id, 'owner'
FROM companies c
WHERE c.workspace_id IS NOT NULL;
