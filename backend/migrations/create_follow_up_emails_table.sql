-- Create follow_up_emails table to replace complex sequence system
-- This follows hunter.io's design pattern of simple follow-up emails attached to campaigns

CREATE TABLE IF NOT EXISTS follow_up_emails (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  campaign_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  subject TEXT NOT NULL,
  content TEXT NOT NULL,
  delay_days INTEGER NOT NULL DEFAULT 1, -- 1-30 days delay like hunter.io
  email_order INTEGER NOT NULL DEFAULT 1, -- Order of follow-up (1-5)
  is_active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_follow_up_emails_campaign_id ON follow_up_emails(campaign_id);
CREATE INDEX IF NOT EXISTS idx_follow_up_emails_user_id ON follow_up_emails(user_id);
CREATE INDEX IF NOT EXISTS idx_follow_up_emails_order ON follow_up_emails(campaign_id, email_order);

-- Add constraint to ensure max 5 follow-ups per campaign (like hunter.io)
-- SQLite doesn't support CHECK constraints with subqueries, so we'll handle this in the application layer