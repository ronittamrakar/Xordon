-- Add extended fields to forms table for visual builder support

-- Add group_id for organization (using existing groups system)
ALTER TABLE forms ADD COLUMN IF NOT EXISTS group_id INT NULL AFTER status;

-- Add multi-step form support
ALTER TABLE forms ADD COLUMN IF NOT EXISTS is_multi_step BOOLEAN DEFAULT FALSE AFTER group_id;
ALTER TABLE forms ADD COLUMN IF NOT EXISTS steps JSON NULL AFTER is_multi_step;

-- Add settings JSON for form configuration (theme, security, notifications, etc.)
ALTER TABLE forms ADD COLUMN IF NOT EXISTS settings JSON NULL AFTER steps;

-- Add campaign association
ALTER TABLE forms ADD COLUMN IF NOT EXISTS campaign_id INT NULL AFTER settings;

-- Add workspace_id if not exists
ALTER TABLE forms ADD COLUMN IF NOT EXISTS workspace_id INT NULL AFTER user_id;

-- Add response tracking
ALTER TABLE forms ADD COLUMN IF NOT EXISTS response_count INT DEFAULT 0 AFTER campaign_id;
ALTER TABLE forms ADD COLUMN IF NOT EXISTS last_response_at TIMESTAMP NULL AFTER response_count;

-- Add indexes for filtering
CREATE INDEX IF NOT EXISTS idx_forms_group_id ON forms(group_id);
CREATE INDEX IF NOT EXISTS idx_forms_campaign_id ON forms(campaign_id);
CREATE INDEX IF NOT EXISTS idx_forms_workspace_id ON forms(workspace_id);
CREATE INDEX IF NOT EXISTS idx_forms_status ON forms(status);

-- Add read/starred tracking to form_responses
ALTER TABLE form_responses ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT FALSE AFTER user_agent;
ALTER TABLE form_responses ADD COLUMN IF NOT EXISTS is_starred BOOLEAN DEFAULT FALSE AFTER is_read;

CREATE INDEX IF NOT EXISTS idx_form_responses_is_read ON form_responses(is_read);
CREATE INDEX IF NOT EXISTS idx_form_responses_is_starred ON form_responses(is_starred);

-- Add category and niche to form_templates for gallery organization
ALTER TABLE form_templates ADD COLUMN IF NOT EXISTS category VARCHAR(100) DEFAULT 'other' AFTER steps;
ALTER TABLE form_templates ADD COLUMN IF NOT EXISTS niche VARCHAR(100) NULL AFTER category;
ALTER TABLE form_templates ADD COLUMN IF NOT EXISTS preview_image VARCHAR(500) NULL AFTER niche;
ALTER TABLE form_templates ADD COLUMN IF NOT EXISTS is_system BOOLEAN DEFAULT FALSE AFTER preview_image;
ALTER TABLE form_templates ADD COLUMN IF NOT EXISTS usage_count INT DEFAULT 0 AFTER is_system;

CREATE INDEX IF NOT EXISTS idx_form_templates_category ON form_templates(category);
CREATE INDEX IF NOT EXISTS idx_form_templates_niche ON form_templates(niche);
CREATE INDEX IF NOT EXISTS idx_form_templates_is_system ON form_templates(is_system);
