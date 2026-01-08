-- Add account_type to workspaces for agency vs individual distinction
-- Agency accounts can manage multiple client companies with team access
-- Individual accounts have simpler UX but can still have multiple businesses

-- Add account_type column to workspaces
ALTER TABLE workspaces 
ADD COLUMN IF NOT EXISTS account_type ENUM('agency', 'individual') NOT NULL DEFAULT 'individual' AFTER owner_user_id;

-- Add settings JSON for workspace-level configuration
ALTER TABLE workspaces
ADD COLUMN IF NOT EXISTS settings JSON NULL AFTER account_type;

-- Add branding fields for white-label agency support (future)
ALTER TABLE workspaces
ADD COLUMN IF NOT EXISTS logo_url VARCHAR(500) NULL AFTER settings,
ADD COLUMN IF NOT EXISTS primary_color VARCHAR(7) NULL DEFAULT '#6366f1' AFTER logo_url;

-- Index for filtering by account type
ALTER TABLE workspaces ADD INDEX IF NOT EXISTS idx_workspaces_account_type (account_type);

-- Enhance companies table to better support agency client management
-- Add client-specific fields
ALTER TABLE companies
ADD COLUMN IF NOT EXISTS is_client BOOLEAN NOT NULL DEFAULT TRUE AFTER workspace_id,
ADD COLUMN IF NOT EXISTS client_since DATE NULL AFTER is_client,
ADD COLUMN IF NOT EXISTS monthly_retainer DECIMAL(10,2) NULL AFTER client_since,
ADD COLUMN IF NOT EXISTS billing_email VARCHAR(255) NULL AFTER monthly_retainer,
ADD COLUMN IF NOT EXISTS notes TEXT NULL AFTER billing_email,
ADD COLUMN IF NOT EXISTS archived_at DATETIME NULL AFTER notes;

-- Add index for client filtering
ALTER TABLE companies ADD INDEX IF NOT EXISTS idx_companies_is_client (workspace_id, is_client);
ALTER TABLE companies ADD INDEX IF NOT EXISTS idx_companies_archived (workspace_id, archived_at);

-- Create client_portal_access table for future client portal feature
CREATE TABLE IF NOT EXISTS client_portal_access (
  id INT AUTO_INCREMENT PRIMARY KEY,
  company_id INT NOT NULL,
  email VARCHAR(255) NOT NULL,
  name VARCHAR(255) NULL,
  password_hash VARCHAR(255) NULL,
  magic_link_token VARCHAR(100) NULL,
  magic_link_expires_at DATETIME NULL,
  last_login_at DATETIME NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  permissions JSON NULL COMMENT 'What the client can see/do in portal',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_client_portal_email (company_id, email),
  INDEX idx_client_portal_company (company_id),
  INDEX idx_client_portal_token (magic_link_token),
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Ensure all major tables have company_id for proper client scoping
-- These ALTER statements are idempotent (IF NOT EXISTS style handled by checking)

-- For tables that may not have company_id yet, we add it
-- campaigns
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS company_id INT NULL AFTER workspace_id;
ALTER TABLE campaigns ADD INDEX IF NOT EXISTS idx_campaigns_company (workspace_id, company_id);

-- templates  
ALTER TABLE templates ADD COLUMN IF NOT EXISTS company_id INT NULL AFTER workspace_id;
ALTER TABLE templates ADD INDEX IF NOT EXISTS idx_templates_company (workspace_id, company_id);

-- sequences
ALTER TABLE sequences ADD COLUMN IF NOT EXISTS company_id INT NULL AFTER workspace_id;
ALTER TABLE sequences ADD INDEX IF NOT EXISTS idx_sequences_company (workspace_id, company_id);

-- sending_accounts
ALTER TABLE sending_accounts ADD COLUMN IF NOT EXISTS company_id INT NULL AFTER workspace_id;
ALTER TABLE sending_accounts ADD INDEX IF NOT EXISTS idx_sending_accounts_company (workspace_id, company_id);

-- sms_campaigns
ALTER TABLE sms_campaigns ADD COLUMN IF NOT EXISTS company_id INT NULL AFTER workspace_id;
ALTER TABLE sms_campaigns ADD INDEX IF NOT EXISTS idx_sms_campaigns_company (workspace_id, company_id);

-- sms_templates
ALTER TABLE sms_templates ADD COLUMN IF NOT EXISTS company_id INT NULL AFTER workspace_id;
ALTER TABLE sms_templates ADD INDEX IF NOT EXISTS idx_sms_templates_company (workspace_id, company_id);

-- call_campaigns
ALTER TABLE call_campaigns ADD COLUMN IF NOT EXISTS company_id INT NULL AFTER workspace_id;
ALTER TABLE call_campaigns ADD INDEX IF NOT EXISTS idx_call_campaigns_company (workspace_id, company_id);

-- call_scripts
ALTER TABLE call_scripts ADD COLUMN IF NOT EXISTS company_id INT NULL AFTER workspace_id;
ALTER TABLE call_scripts ADD INDEX IF NOT EXISTS idx_call_scripts_company (workspace_id, company_id);

-- forms (opt-in forms)
ALTER TABLE forms ADD COLUMN IF NOT EXISTS company_id INT NULL AFTER workspace_id;
ALTER TABLE forms ADD INDEX IF NOT EXISTS idx_forms_company (workspace_id, company_id);

-- landing_pages
ALTER TABLE landing_pages ADD COLUMN IF NOT EXISTS company_id INT NULL AFTER workspace_id;
ALTER TABLE landing_pages ADD INDEX IF NOT EXISTS idx_landing_pages_company (workspace_id, company_id);

-- proposals
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS company_id INT NULL AFTER workspace_id;
ALTER TABLE proposals ADD INDEX IF NOT EXISTS idx_proposals_company (workspace_id, company_id);

-- flows
ALTER TABLE flows ADD COLUMN IF NOT EXISTS company_id INT NULL AFTER workspace_id;
ALTER TABLE flows ADD INDEX IF NOT EXISTS idx_flows_company (workspace_id, company_id);

-- followup_automations
ALTER TABLE followup_automations ADD COLUMN IF NOT EXISTS company_id INT NULL AFTER workspace_id;
ALTER TABLE followup_automations ADD INDEX IF NOT EXISTS idx_followup_automations_company (workspace_id, company_id);

-- pipelines
ALTER TABLE pipelines ADD COLUMN IF NOT EXISTS company_id INT NULL AFTER workspace_id;
ALTER TABLE pipelines ADD INDEX IF NOT EXISTS idx_pipelines_company (workspace_id, company_id);

-- opportunities
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS company_id INT NULL AFTER workspace_id;
ALTER TABLE opportunities ADD INDEX IF NOT EXISTS idx_opportunities_company (workspace_id, company_id);

-- appointments
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS company_id INT NULL AFTER workspace_id;
ALTER TABLE appointments ADD INDEX IF NOT EXISTS idx_appointments_company (workspace_id, company_id);

-- invoices
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS company_id INT NULL AFTER workspace_id;
ALTER TABLE invoices ADD INDEX IF NOT EXISTS idx_invoices_company (workspace_id, company_id);

-- phone_numbers
ALTER TABLE phone_numbers ADD COLUMN IF NOT EXISTS company_id INT NULL AFTER workspace_id;
ALTER TABLE phone_numbers ADD INDEX IF NOT EXISTS idx_phone_numbers_company (workspace_id, company_id);

-- webforms_forms
ALTER TABLE webforms_forms ADD COLUMN IF NOT EXISTS company_id INT NULL AFTER workspace_id;
ALTER TABLE webforms_forms ADD INDEX IF NOT EXISTS idx_webforms_forms_company (workspace_id, company_id);

-- contact_lists
ALTER TABLE contact_lists ADD COLUMN IF NOT EXISTS company_id INT NULL AFTER workspace_id;
ALTER TABLE contact_lists ADD INDEX IF NOT EXISTS idx_contact_lists_company (workspace_id, company_id);

-- segments
ALTER TABLE segments ADD COLUMN IF NOT EXISTS company_id INT NULL AFTER workspace_id;
ALTER TABLE segments ADD INDEX IF NOT EXISTS idx_segments_company (workspace_id, company_id);

-- tags
ALTER TABLE tags ADD COLUMN IF NOT EXISTS company_id INT NULL AFTER workspace_id;
ALTER TABLE tags ADD INDEX IF NOT EXISTS idx_tags_company (workspace_id, company_id);

-- recipients (contacts)
ALTER TABLE recipients ADD COLUMN IF NOT EXISTS workspace_id INT NULL AFTER user_id;
ALTER TABLE recipients ADD INDEX IF NOT EXISTS idx_recipients_workspace_company (workspace_id, company_id);

-- Backfill: For existing workspaces, default to 'individual' (already set by DEFAULT)
-- For workspaces with multiple companies, suggest they might be agencies
UPDATE workspaces w
SET w.account_type = 'agency'
WHERE (SELECT COUNT(*) FROM companies c WHERE c.workspace_id = w.id) > 3;

-- Create default company for workspaces that have none
INSERT INTO companies (workspace_id, user_id, name, status, is_client)
SELECT w.id, w.owner_user_id, CONCAT(w.name, ' - Default'), 'active', FALSE
FROM workspaces w
WHERE NOT EXISTS (SELECT 1 FROM companies c WHERE c.workspace_id = w.id);
