-- SMS Tables Migration for Xordon (SQLite)

-- SMS Campaigns table
CREATE TABLE IF NOT EXISTS sms_campaigns (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  message TEXT NOT NULL,
  sender_id TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  recipient_method TEXT NOT NULL DEFAULT 'all',
  recipient_tags TEXT,
  scheduled_at TEXT NULL,
  throttle_rate INTEGER DEFAULT 1,
  throttle_unit TEXT DEFAULT 'minute',
  enable_retry INTEGER DEFAULT 0,
  retry_attempts INTEGER DEFAULT 3,
  respect_quiet_hours INTEGER DEFAULT 1,
  quiet_hours_start TEXT DEFAULT '22:00:00',
  quiet_hours_end TEXT DEFAULT '08:00:00',
  total_recipients INTEGER DEFAULT 0,
  sent_count INTEGER DEFAULT 0,
  delivered_count INTEGER DEFAULT 0,
  failed_count INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- SMS Sequences table
CREATE TABLE IF NOT EXISTS sms_sequences (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- SMS Sequence Steps table
CREATE TABLE IF NOT EXISTS sms_sequence_steps (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sequence_id INTEGER NOT NULL,
  message TEXT NOT NULL,
  delay_days INTEGER NOT NULL DEFAULT 0,
  delay_hours INTEGER NOT NULL DEFAULT 0,
  delay_minutes INTEGER NOT NULL DEFAULT 0,
  step_order INTEGER NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (sequence_id) REFERENCES sms_sequences(id) ON DELETE CASCADE
);

-- SMS Templates table
CREATE TABLE IF NOT EXISTS sms_templates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  message TEXT NOT NULL,
  category TEXT,
  is_favorite INTEGER DEFAULT 0,
  usage_count INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- SMS Recipients table
CREATE TABLE IF NOT EXISTS sms_recipients (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  phone_number TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  company TEXT,
  tags TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  opt_in_status TEXT NOT NULL DEFAULT 'pending',
  opt_in_date TEXT NULL,
  opt_out_date TEXT NULL,
  last_activity TEXT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- SMS Messages table (for tracking sent messages)
CREATE TABLE IF NOT EXISTS sms_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  campaign_id INTEGER NULL,
  sequence_id INTEGER NULL,
  sequence_step_id INTEGER NULL,
  recipient_id INTEGER NOT NULL,
  phone_number TEXT NOT NULL,
  message TEXT NOT NULL,
  sender_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  external_id TEXT,
  delivery_status TEXT,
  delivery_timestamp TEXT NULL,
  error_message TEXT,
  cost REAL DEFAULT 0.0000,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (campaign_id) REFERENCES sms_campaigns(id) ON DELETE SET NULL,
  FOREIGN KEY (sequence_id) REFERENCES sms_sequences(id) ON DELETE SET NULL,
  FOREIGN KEY (sequence_step_id) REFERENCES sms_sequence_steps(id) ON DELETE SET NULL,
  FOREIGN KEY (recipient_id) REFERENCES sms_recipients(id) ON DELETE CASCADE
);

-- SMS Replies table (for incoming messages)
CREATE TABLE IF NOT EXISTS sms_replies (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  campaign_id INTEGER NULL,
  recipient_id INTEGER NULL,
  phone_number TEXT NOT NULL,
  message TEXT NOT NULL,
  sender_id TEXT,
  external_id TEXT,
  is_read INTEGER DEFAULT 0,
  is_starred INTEGER DEFAULT 0,
  is_archived INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (campaign_id) REFERENCES sms_campaigns(id) ON DELETE SET NULL,
  FOREIGN KEY (recipient_id) REFERENCES sms_recipients(id) ON DELETE SET NULL
);

-- SMS Analytics table
CREATE TABLE IF NOT EXISTS sms_analytics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  campaign_id INTEGER NULL,
  sequence_id INTEGER NULL,
  date TEXT NOT NULL,
  sent_count INTEGER DEFAULT 0,
  delivered_count INTEGER DEFAULT 0,
  failed_count INTEGER DEFAULT 0,
  reply_count INTEGER DEFAULT 0,
  opt_out_count INTEGER DEFAULT 0,
  total_cost REAL DEFAULT 0.0000,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (campaign_id) REFERENCES sms_campaigns(id) ON DELETE SET NULL,
  FOREIGN KEY (sequence_id) REFERENCES sms_sequences(id) ON DELETE SET NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_sms_campaigns_user_status ON sms_campaigns(user_id, status);
CREATE INDEX IF NOT EXISTS idx_sms_recipients_user_status ON sms_recipients(user_id, status);
CREATE INDEX IF NOT EXISTS idx_sms_recipients_phone ON sms_recipients(phone_number);
CREATE INDEX IF NOT EXISTS idx_sms_messages_campaign ON sms_messages(campaign_id);
CREATE INDEX IF NOT EXISTS idx_sms_messages_recipient ON sms_messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_sms_messages_status ON sms_messages(status);
CREATE INDEX IF NOT EXISTS idx_sms_replies_user ON sms_replies(user_id);
CREATE INDEX IF NOT EXISTS idx_sms_replies_campaign ON sms_replies(campaign_id);
CREATE INDEX IF NOT EXISTS idx_sms_analytics_date ON sms_analytics(date);

-- Create unique constraint for user-phone combination
CREATE UNIQUE INDEX IF NOT EXISTS idx_sms_recipients_unique_user_phone ON sms_recipients(user_id, phone_number);

-- Create unique constraint for analytics
CREATE UNIQUE INDEX IF NOT EXISTS idx_sms_analytics_unique ON sms_analytics(user_id, campaign_id, sequence_id, date);
