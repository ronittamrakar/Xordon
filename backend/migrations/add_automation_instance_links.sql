-- Add automation_id and flow_id columns to user_automation_instances
-- Links recipe instances to their created automations and flows

ALTER TABLE user_automation_instances 
ADD COLUMN IF NOT EXISTS automation_id INT NULL AFTER trigger_config,
ADD COLUMN IF NOT EXISTS flow_id INT NULL AFTER automation_id;

-- Add automation_id column to campaign_flows to link flows to automations
ALTER TABLE campaign_flows 
ADD COLUMN IF NOT EXISTS automation_id INT NULL AFTER nodes,
ADD COLUMN IF NOT EXISTS flow_type VARCHAR(50) DEFAULT 'campaign' AFTER automation_id;

-- Add indexes for efficient lookups
CREATE INDEX IF NOT EXISTS idx_instances_automation ON user_automation_instances(automation_id);
CREATE INDEX IF NOT EXISTS idx_instances_flow ON user_automation_instances(flow_id);
CREATE INDEX IF NOT EXISTS idx_flows_automation ON campaign_flows(automation_id);
