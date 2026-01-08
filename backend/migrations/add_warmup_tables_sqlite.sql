-- ARCHIVED: SQLite migration replaced by `add_warmup_tables.sql` (MySQL).
-- Original SQLite migration moved to `migrations/archived_sqlite_migrations/add_warmup_tables_sqlite.sql`.
-- This file is intentionally left as a stub to avoid accidental use.

-- No SQL in this archived stub.

  domain TEXT NOT NULL,
  start_volume INTEGER NOT NULL DEFAULT 10,
  ramp_increment INTEGER NOT NULL DEFAULT 5,
  ramp_interval_days INTEGER NOT NULL DEFAULT 3,
  target_volume INTEGER NOT NULL DEFAULT 150,
  maintenance_volume INTEGER NOT NULL DEFAULT 20,
  pause_on_issue INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'active',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (sending_account_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (sending_account_id) REFERENCES sending_accounts(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS warmup_runs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  profile_id INTEGER NOT NULL,
  sending_account_id INTEGER NOT NULL,
  run_date DATE NOT NULL,
  planned_volume INTEGER NOT NULL DEFAULT 0,
  sent_volume INTEGER NOT NULL DEFAULT 0,
  inbox_hits INTEGER NOT NULL DEFAULT 0,
  spam_hits INTEGER NOT NULL DEFAULT 0,
  replies INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'scheduled',
  last_error TEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (sending_account_id, run_date),
  FOREIGN KEY (profile_id) REFERENCES warmup_profiles(id) ON DELETE CASCADE,
  FOREIGN KEY (sending_account_id) REFERENCES sending_accounts(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS warmup_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  run_id INTEGER NOT NULL,
  sending_account_id INTEGER NOT NULL,
  recipient_email TEXT NOT NULL,
  partner_account TEXT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  inbox_hit INTEGER NOT NULL DEFAULT 1,
  spam_hit INTEGER NOT NULL DEFAULT 0,
  delivered_at DATETIME NULL,
  opened_at DATETIME NULL,
  reply_received_at DATETIME NULL,
  error TEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (run_id) REFERENCES warmup_runs(id) ON DELETE CASCADE,
  FOREIGN KEY (sending_account_id) REFERENCES sending_accounts(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS dns_checks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  domain TEXT NOT NULL,
  spf_record TEXT NULL,
  spf_status TEXT NOT NULL DEFAULT 'unknown',
  dkim_selector TEXT NULL,
  dkim_record TEXT NULL,
  dkim_status TEXT NOT NULL DEFAULT 'unknown',
  dmarc_record TEXT NULL,
  dmarc_policy TEXT NULL,
  dmarc_status TEXT NOT NULL DEFAULT 'unknown',
  issues TEXT NULL,
  checked_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (user_id, domain),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
