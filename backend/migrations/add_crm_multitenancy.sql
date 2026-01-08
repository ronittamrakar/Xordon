-- Add multi-tenancy support to CRM tables
-- Adds workspace_id and company_id columns to leads, lead_activities, lead_tags, and crm_tasks

-- 1. Add workspace_id and company_id to leads table
ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS workspace_id INT NULL AFTER user_id,
ADD COLUMN IF NOT EXISTS company_id INT NULL AFTER workspace_id;

-- 2. Add indexes for workspace and company scoping
CREATE INDEX IF NOT EXISTS idx_leads_workspace ON leads(workspace_id);
CREATE INDEX IF NOT EXISTS idx_leads_company ON leads(company_id);
CREATE INDEX IF NOT EXISTS idx_leads_workspace_company ON leads(workspace_id, company_id);

-- 3. Add workspace_id to lead_activities
ALTER TABLE lead_activities
ADD COLUMN IF NOT EXISTS workspace_id INT NULL AFTER user_id;

CREATE INDEX IF NOT EXISTS idx_lead_activities_workspace ON lead_activities(workspace_id);

-- 4. Add workspace_id to lead_tags
ALTER TABLE lead_tags
ADD COLUMN IF NOT EXISTS workspace_id INT NULL AFTER user_id;

CREATE INDEX IF NOT EXISTS idx_lead_tags_workspace ON lead_tags(workspace_id);

-- 5. Add workspace_id to crm_tasks
ALTER TABLE crm_tasks
ADD COLUMN IF NOT EXISTS workspace_id INT NULL AFTER created_by;

CREATE INDEX IF NOT EXISTS idx_crm_tasks_workspace ON crm_tasks(workspace_id);

-- 6. Backfill workspace_id from user_id for existing records
-- This assumes a workspaces table exists with user_id mapping
UPDATE leads l
LEFT JOIN workspaces w ON w.id = (
    SELECT workspace_id FROM user_workspaces uw WHERE uw.user_id = l.user_id LIMIT 1
)
SET l.workspace_id = w.id
WHERE l.workspace_id IS NULL AND w.id IS NOT NULL;

UPDATE lead_activities la
LEFT JOIN workspaces w ON w.id = (
    SELECT workspace_id FROM user_workspaces uw WHERE uw.user_id = la.user_id LIMIT 1
)
SET la.workspace_id = w.id
WHERE la.workspace_id IS NULL AND w.id IS NOT NULL;

UPDATE lead_tags lt
LEFT JOIN workspaces w ON w.id = (
    SELECT workspace_id FROM user_workspaces uw WHERE uw.user_id = lt.user_id LIMIT 1
)
SET lt.workspace_id = w.id
WHERE lt.workspace_id IS NULL AND w.id IS NOT NULL;

UPDATE crm_tasks ct
LEFT JOIN workspaces w ON w.id = (
    SELECT workspace_id FROM user_workspaces uw WHERE uw.user_id = ct.created_by LIMIT 1
)
SET ct.workspace_id = w.id
WHERE ct.workspace_id IS NULL AND w.id IS NOT NULL;
