-- Add vendor widget integration settings to workspace settings
-- Supports Intercom, Zendesk, and other helpdesk widget embeds

-- Add vendor widget settings columns to workspaces table
ALTER TABLE workspaces
ADD COLUMN IF NOT EXISTS vendor_widget_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS vendor_widget_provider VARCHAR(50) NULL,
ADD COLUMN IF NOT EXISTS vendor_widget_app_id VARCHAR(255) NULL,
ADD COLUMN IF NOT EXISTS vendor_widget_settings JSON NULL;

-- Update workspace_settings to include vendor widget configuration
-- This allows per-workspace control of third-party helpdesk widgets
