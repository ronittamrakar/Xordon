-- Migration: Add workspace_id columns to tables for multi-tenancy support
-- Run this migration before running the backfill script

-- Companies table
ALTER TABLE companies ADD COLUMN IF NOT EXISTS workspace_id INT NULL AFTER user_id;
ALTER TABLE companies ADD INDEX IF NOT EXISTS idx_companies_workspace (workspace_id);

-- Recipients (contacts) table
ALTER TABLE recipients ADD COLUMN IF NOT EXISTS workspace_id INT NULL AFTER user_id;
ALTER TABLE recipients ADD INDEX IF NOT EXISTS idx_recipients_workspace (workspace_id);

-- Campaigns table
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS workspace_id INT NULL AFTER user_id;
ALTER TABLE campaigns ADD INDEX IF NOT EXISTS idx_campaigns_workspace (workspace_id);

-- Call campaigns table
ALTER TABLE call_campaigns ADD COLUMN IF NOT EXISTS workspace_id INT NULL AFTER user_id;
ALTER TABLE call_campaigns ADD INDEX IF NOT EXISTS idx_call_campaigns_workspace (workspace_id);

-- Call recipients table
ALTER TABLE call_recipients ADD COLUMN IF NOT EXISTS workspace_id INT NULL AFTER user_id;
ALTER TABLE call_recipients ADD INDEX IF NOT EXISTS idx_call_recipients_workspace (workspace_id);

-- Call logs table
ALTER TABLE call_logs ADD COLUMN IF NOT EXISTS workspace_id INT NULL AFTER user_id;
ALTER TABLE call_logs ADD INDEX IF NOT EXISTS idx_call_logs_workspace (workspace_id);

-- Call agents table
ALTER TABLE call_agents ADD COLUMN IF NOT EXISTS workspace_id INT NULL AFTER user_id;
ALTER TABLE call_agents ADD INDEX IF NOT EXISTS idx_call_agents_workspace (workspace_id);

-- Call disposition types table
ALTER TABLE call_disposition_types ADD COLUMN IF NOT EXISTS workspace_id INT NULL AFTER user_id;
ALTER TABLE call_disposition_types ADD INDEX IF NOT EXISTS idx_call_disposition_types_workspace (workspace_id);

-- Connections table
ALTER TABLE connections ADD COLUMN IF NOT EXISTS workspace_id INT NULL AFTER user_id;
ALTER TABLE connections ADD INDEX IF NOT EXISTS idx_connections_workspace (workspace_id);

-- Phone numbers table
ALTER TABLE phone_numbers ADD COLUMN IF NOT EXISTS workspace_id INT NULL AFTER user_id;
ALTER TABLE phone_numbers ADD INDEX IF NOT EXISTS idx_phone_numbers_workspace (workspace_id);

-- Booking types table
ALTER TABLE booking_types ADD COLUMN IF NOT EXISTS workspace_id INT NULL AFTER user_id;
ALTER TABLE booking_types ADD INDEX IF NOT EXISTS idx_booking_types_workspace (workspace_id);

-- Availability schedules table
ALTER TABLE availability_schedules ADD COLUMN IF NOT EXISTS workspace_id INT NULL AFTER user_id;
ALTER TABLE availability_schedules ADD INDEX IF NOT EXISTS idx_availability_schedules_workspace (workspace_id);

-- Availability overrides table
ALTER TABLE availability_overrides ADD COLUMN IF NOT EXISTS workspace_id INT NULL AFTER user_id;
ALTER TABLE availability_overrides ADD INDEX IF NOT EXISTS idx_availability_overrides_workspace (workspace_id);

-- Appointments table
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS workspace_id INT NULL AFTER user_id;
ALTER TABLE appointments ADD INDEX IF NOT EXISTS idx_appointments_workspace (workspace_id);

-- Tags table
ALTER TABLE tags ADD COLUMN IF NOT EXISTS workspace_id INT NULL AFTER user_id;
ALTER TABLE tags ADD INDEX IF NOT EXISTS idx_tags_workspace (workspace_id);

-- Email templates table
ALTER TABLE email_templates ADD COLUMN IF NOT EXISTS workspace_id INT NULL AFTER user_id;
ALTER TABLE email_templates ADD INDEX IF NOT EXISTS idx_email_templates_workspace (workspace_id);

-- SMS templates table
ALTER TABLE sms_templates ADD COLUMN IF NOT EXISTS workspace_id INT NULL AFTER user_id;
ALTER TABLE sms_templates ADD INDEX IF NOT EXISTS idx_sms_templates_workspace (workspace_id);

-- Proposals table
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS workspace_id INT NULL AFTER user_id;
ALTER TABLE proposals ADD INDEX IF NOT EXISTS idx_proposals_workspace (workspace_id);

-- Payments table
ALTER TABLE payments ADD COLUMN IF NOT EXISTS workspace_id INT NULL AFTER user_id;
ALTER TABLE payments ADD INDEX IF NOT EXISTS idx_payments_workspace (workspace_id);

-- Invoices table
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS workspace_id INT NULL AFTER user_id;
ALTER TABLE invoices ADD INDEX IF NOT EXISTS idx_invoices_workspace (workspace_id);
