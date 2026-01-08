-- Add reminder tracking columns to appointments table
-- These columns track whether reminder automations have been triggered

ALTER TABLE appointments ADD COLUMN IF NOT EXISTS reminder_24h_sent TINYINT(1) DEFAULT 0;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS reminder_1h_sent TINYINT(1) DEFAULT 0;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS followup_sent TINYINT(1) DEFAULT 0;

-- Add index for efficient reminder queries
CREATE INDEX IF NOT EXISTS idx_appointments_reminder_status ON appointments(status, scheduled_at, reminder_24h_sent, reminder_1h_sent);
