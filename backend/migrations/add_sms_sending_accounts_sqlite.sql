-- ARCHIVED: SQLite migration replaced by `add_sms_sending_accounts.sql` (MySQL).
-- Original SQLite migration moved to `migrations/archived_sqlite_migrations/add_sms_sending_accounts_sqlite.sql`.
-- This file is intentionally left as a stub to avoid accidental use.

-- No SQL in this archived stub.

  provider TEXT NOT NULL DEFAULT 'signalwire',
  status TEXT NOT NULL DEFAULT 'active',
  account_sid TEXT,
  auth_token TEXT,
  project_id TEXT,
  space_url TEXT,
  webhook_url TEXT,
  daily_limit INTEGER DEFAULT 1000,
  sent_today INTEGER DEFAULT 0,
  last_reset_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(user_id, phone_number)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_sms_sending_accounts_user_status ON sms_sending_accounts(user_id, status);
CREATE INDEX IF NOT EXISTS idx_sms_sending_accounts_phone ON sms_sending_accounts(phone_number);