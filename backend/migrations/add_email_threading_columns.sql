-- Add missing columns to email_replies table for threading and functionality
ALTER TABLE email_replies ADD COLUMN thread_id VARCHAR(255);
ALTER TABLE email_replies ADD COLUMN parent_id INT;
ALTER TABLE email_replies ADD COLUMN message_id VARCHAR(255);
ALTER TABLE email_replies ADD COLUMN is_starred BOOLEAN DEFAULT FALSE;
ALTER TABLE email_replies ADD COLUMN is_archived BOOLEAN DEFAULT FALSE;

-- Add index for better performance on threading queries
CREATE INDEX IF NOT EXISTS idx_email_replies_thread_id ON email_replies(thread_id);
CREATE INDEX IF NOT EXISTS idx_email_replies_message_id ON email_replies(message_id);
CREATE INDEX IF NOT EXISTS idx_email_replies_parent_id ON email_replies(parent_id);