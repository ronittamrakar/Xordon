-- Warmup & deliverability support tables (MySQL)

CREATE TABLE IF NOT EXISTS warmup_profiles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  sending_account_id INT NOT NULL,
  domain VARCHAR(255) NOT NULL,
  start_volume INT NOT NULL DEFAULT 10,
  ramp_increment INT NOT NULL DEFAULT 5,
  ramp_interval_days INT NOT NULL DEFAULT 3,
  target_volume INT NOT NULL DEFAULT 150,
  maintenance_volume INT NOT NULL DEFAULT 20,
  pause_on_issue TINYINT(1) NOT NULL DEFAULT 1,
  status VARCHAR(32) NOT NULL DEFAULT 'active',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_warmup_profile_account (sending_account_id),
  INDEX idx_warmup_profiles_user (user_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (sending_account_id) REFERENCES sending_accounts(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS warmup_runs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  profile_id INT NOT NULL,
  sending_account_id INT NOT NULL,
  run_date DATE NOT NULL,
  planned_volume INT NOT NULL DEFAULT 0,
  sent_volume INT NOT NULL DEFAULT 0,
  inbox_hits INT NOT NULL DEFAULT 0,
  spam_hits INT NOT NULL DEFAULT 0,
  replies INT NOT NULL DEFAULT 0,
  status VARCHAR(32) NOT NULL DEFAULT 'scheduled',
  last_error TEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_warmup_run_account_date (sending_account_id, run_date),
  INDEX idx_warmup_runs_profile (profile_id),
  FOREIGN KEY (profile_id) REFERENCES warmup_profiles(id) ON DELETE CASCADE,
  FOREIGN KEY (sending_account_id) REFERENCES sending_accounts(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS warmup_messages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  run_id INT NOT NULL,
  sending_account_id INT NOT NULL,
  recipient_email VARCHAR(255) NOT NULL,
  partner_account VARCHAR(255) NULL,
  subject VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,
  inbox_hit TINYINT(1) NOT NULL DEFAULT 1,
  spam_hit TINYINT(1) NOT NULL DEFAULT 0,
  delivered_at DATETIME NULL,
  opened_at DATETIME NULL,
  reply_received_at DATETIME NULL,
  error TEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (run_id) REFERENCES warmup_runs(id) ON DELETE CASCADE,
  FOREIGN KEY (sending_account_id) REFERENCES sending_accounts(id) ON DELETE CASCADE,
  INDEX idx_warmup_messages_run (run_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS dns_checks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  domain VARCHAR(255) NOT NULL,
  spf_record TEXT NULL,
  spf_status VARCHAR(32) NOT NULL DEFAULT 'unknown',
  dkim_selector VARCHAR(64) NULL,
  dkim_record TEXT NULL,
  dkim_status VARCHAR(32) NOT NULL DEFAULT 'unknown',
  dmarc_record TEXT NULL,
  dmarc_policy VARCHAR(32) NULL,
  dmarc_status VARCHAR(32) NOT NULL DEFAULT 'unknown',
  issues TEXT NULL,
  checked_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_dns_domain (user_id, domain),
  INDEX idx_dns_checks_checked_at (checked_at),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
