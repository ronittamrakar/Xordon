-- Call Tables Migration for Xordon (SQLite)

-- Call Campaigns table
CREATE TABLE IF NOT EXISTS call_campaigns (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  caller_id TEXT,
  call_script TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  call_provider TEXT NOT NULL DEFAULT 'signalwire',
  sequence_id INTEGER,
  group_id INTEGER,
  group_name TEXT,
  scheduled_at TEXT,
  total_recipients INTEGER DEFAULT 0,
  completed_calls INTEGER DEFAULT 0,
  successful_calls INTEGER DEFAULT 0,
  failed_calls INTEGER DEFAULT 0,
  answered_calls INTEGER DEFAULT 0,
  voicemail_calls INTEGER DEFAULT 0,
  busy_calls INTEGER DEFAULT 0,
  no_answer_calls INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Call Scripts table
CREATE TABLE IF NOT EXISTS call_scripts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  content TEXT NOT NULL,
  category TEXT,
  variables TEXT,
  is_favorite BOOLEAN DEFAULT 0,
  usage_count INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Call Disposition Types table
CREATE TABLE IF NOT EXISTS call_disposition_types (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL, -- positive, negative, neutral, follow_up
  color TEXT DEFAULT '#6B7280',
  is_system BOOLEAN DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Call Recipients table (call-specific recipients)
CREATE TABLE IF NOT EXISTS call_recipients (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  campaign_id INTEGER,
  phone_number TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  company TEXT,
  tags TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  priority TEXT DEFAULT 'normal',
  notes TEXT,
  last_called_at TEXT,
  call_count INTEGER DEFAULT 0,
  successful_calls INTEGER DEFAULT 0,
  last_disposition TEXT,
  dnc_status BOOLEAN DEFAULT 0,
  consent_status TEXT DEFAULT 'unknown',
  consent_date TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (campaign_id) REFERENCES call_campaigns(id) ON DELETE SET NULL
);

-- Call Logs table (for tracking call history)
CREATE TABLE IF NOT EXISTS call_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  campaign_id INTEGER,
  recipient_id INTEGER,
  script_id INTEGER,
  phone_number TEXT NOT NULL,
  external_id TEXT,
  status TEXT NOT NULL DEFAULT 'completed', -- completed, failed, in_progress
  call_duration INTEGER DEFAULT 0,
  call_outcome TEXT,
  disposition TEXT,
  disposition_type_id INTEGER,
  recording_url TEXT,
  recording_duration INTEGER DEFAULT 0,
  call_cost REAL DEFAULT 0.0,
  notes TEXT,
  error_message TEXT,
  started_at TEXT,
  ended_at TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (campaign_id) REFERENCES call_campaigns(id) ON DELETE SET NULL,
  FOREIGN KEY (recipient_id) REFERENCES call_recipients(id) ON DELETE SET NULL,
  FOREIGN KEY (script_id) REFERENCES call_scripts(id) ON DELETE SET NULL,
  FOREIGN KEY (disposition_type_id) REFERENCES call_disposition_types(id) ON DELETE SET NULL
);

-- Call Analytics table
CREATE TABLE IF NOT EXISTS call_analytics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  campaign_id INTEGER,
  date TEXT NOT NULL,
  total_calls INTEGER DEFAULT 0,
  successful_calls INTEGER DEFAULT 0,
  failed_calls INTEGER DEFAULT 0,
  answered_calls INTEGER DEFAULT 0,
  voicemail_calls INTEGER DEFAULT 0,
  busy_calls INTEGER DEFAULT 0,
  no_answer_calls INTEGER DEFAULT 0,
  avg_call_duration INTEGER DEFAULT 0,
  total_cost REAL DEFAULT 0.0,
  success_rate REAL DEFAULT 0.0,
  answer_rate REAL DEFAULT 0.0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (campaign_id) REFERENCES call_campaigns(id) ON DELETE SET NULL,
  UNIQUE (user_id, campaign_id, date)
);

-- DNC (Do Not Call) Lists table
CREATE TABLE IF NOT EXISTS dnc_lists (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  phone_number TEXT NOT NULL,
  reason TEXT,
  source TEXT,
  expires_at TEXT,
  is_active BOOLEAN DEFAULT 1,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE (user_id, phone_number)
);

-- Consent Logs table
CREATE TABLE IF NOT EXISTS consent_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  recipient_id INTEGER,
  phone_number TEXT NOT NULL,
  consent_type TEXT NOT NULL, -- call, sms, email
  action TEXT NOT NULL, -- given, revoked, expired
  source TEXT,
  ip_address TEXT,
  user_agent TEXT,
  notes TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (recipient_id) REFERENCES call_recipients(id) ON DELETE SET NULL
);

-- Call Settings table
CREATE TABLE IF NOT EXISTS call_settings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  data TEXT NOT NULL, -- JSON data for settings
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE (user_id)
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_call_campaigns_user_status ON call_campaigns(user_id, status);
CREATE INDEX IF NOT EXISTS idx_call_campaigns_scheduled ON call_campaigns(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_call_scripts_user_category ON call_scripts(user_id, category);
CREATE INDEX IF NOT EXISTS idx_call_recipients_user_status ON call_recipients(user_id, status);
CREATE INDEX IF NOT EXISTS idx_call_recipients_phone ON call_recipients(phone_number);
CREATE INDEX IF NOT EXISTS idx_call_recipients_campaign ON call_recipients(campaign_id);
CREATE INDEX IF NOT EXISTS idx_call_logs_campaign ON call_logs(campaign_id);
CREATE INDEX IF NOT EXISTS idx_call_logs_recipient ON call_logs(recipient_id);
CREATE INDEX IF NOT EXISTS idx_call_logs_status ON call_logs(status);
CREATE INDEX IF NOT EXISTS idx_call_logs_created ON call_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_call_analytics_date ON call_analytics(date);
CREATE INDEX IF NOT EXISTS idx_dnc_lists_phone ON dnc_lists(phone_number);
CREATE INDEX IF NOT EXISTS idx_consent_logs_phone ON consent_logs(phone_number);
