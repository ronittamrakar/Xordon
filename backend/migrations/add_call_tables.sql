-- Call Tables Migration for Xordon

-- Call Campaigns table
CREATE TABLE IF NOT EXISTS call_campaigns (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  caller_id VARCHAR(50),
  call_script VARCHAR(255),
  status VARCHAR(50) NOT NULL DEFAULT 'draft',
  call_provider VARCHAR(50) NOT NULL DEFAULT 'signalwire',
  sequence_id INT NULL,
  group_id INT NULL,
  group_name VARCHAR(255),
  scheduled_at DATETIME NULL,
  total_recipients INT DEFAULT 0,
  completed_calls INT DEFAULT 0,
  successful_calls INT DEFAULT 0,
  failed_calls INT DEFAULT 0,
  answered_calls INT DEFAULT 0,
  voicemail_calls INT DEFAULT 0,
  busy_calls INT DEFAULT 0,
  no_answer_calls INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Call Scripts table
CREATE TABLE IF NOT EXISTS call_scripts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  content TEXT NOT NULL,
  category VARCHAR(100),
  variables TEXT,
  is_favorite BOOLEAN DEFAULT FALSE,
  usage_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Call Disposition Types table
CREATE TABLE IF NOT EXISTS call_disposition_types (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(50) NOT NULL, -- positive, negative, neutral, follow_up
  color VARCHAR(7) DEFAULT '#6B7280',
  is_system BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Call Recipients table (call-specific recipients)
CREATE TABLE IF NOT EXISTS call_recipients (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  campaign_id INT NULL,
  phone_number VARCHAR(20) NOT NULL,
  first_name VARCHAR(255),
  last_name VARCHAR(255),
  email VARCHAR(255),
  company VARCHAR(255),
  tags TEXT,
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  priority VARCHAR(50) DEFAULT 'normal',
  notes TEXT,
  last_called_at DATETIME NULL,
  call_count INT DEFAULT 0,
  successful_calls INT DEFAULT 0,
  last_disposition VARCHAR(255),
  dnc_status BOOLEAN DEFAULT FALSE,
  consent_status VARCHAR(50) DEFAULT 'unknown',
  consent_date DATETIME NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (campaign_id) REFERENCES call_campaigns(id) ON DELETE SET NULL,
  INDEX idx_campaign_status (campaign_id, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Call Logs table (for tracking call history)
CREATE TABLE IF NOT EXISTS call_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  campaign_id INT NULL,
  recipient_id INT NULL,
  script_id INT NULL,
  phone_number VARCHAR(20) NOT NULL,
  external_id VARCHAR(255),
  status VARCHAR(50) NOT NULL DEFAULT 'completed', -- completed, failed, in_progress
  call_duration INT DEFAULT 0,
  call_outcome VARCHAR(255),
  disposition VARCHAR(255),
  disposition_type_id INT NULL,
  recording_url VARCHAR(500),
  recording_duration INT DEFAULT 0,
  call_cost DECIMAL(10, 4) DEFAULT 0.0000,
  notes TEXT,
  error_message TEXT,
  started_at DATETIME NULL,
  ended_at DATETIME NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (campaign_id) REFERENCES call_campaigns(id) ON DELETE SET NULL,
  FOREIGN KEY (recipient_id) REFERENCES call_recipients(id) ON DELETE SET NULL,
  FOREIGN KEY (script_id) REFERENCES call_scripts(id) ON DELETE SET NULL,
  FOREIGN KEY (disposition_type_id) REFERENCES call_disposition_types(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Call Analytics table
CREATE TABLE IF NOT EXISTS call_analytics (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  campaign_id INT NULL,
  date DATE NOT NULL,
  total_calls INT DEFAULT 0,
  successful_calls INT DEFAULT 0,
  failed_calls INT DEFAULT 0,
  answered_calls INT DEFAULT 0,
  voicemail_calls INT DEFAULT 0,
  busy_calls INT DEFAULT 0,
  no_answer_calls INT DEFAULT 0,
  avg_call_duration INT DEFAULT 0,
  total_cost DECIMAL(10, 4) DEFAULT 0.0000,
  success_rate DECIMAL(5, 2) DEFAULT 0.00,
  answer_rate DECIMAL(5, 2) DEFAULT 0.00,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (campaign_id) REFERENCES call_campaigns(id) ON DELETE SET NULL,
  UNIQUE KEY unique_analytics (user_id, campaign_id, date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- DNC (Do Not Call) Lists table
CREATE TABLE IF NOT EXISTS dnc_lists (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  phone_number VARCHAR(20) NOT NULL,
  reason VARCHAR(255),
  source VARCHAR(255),
  expires_at DATETIME NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_dnc (user_id, phone_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Consent Logs table
CREATE TABLE IF NOT EXISTS consent_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  recipient_id INT NULL,
  phone_number VARCHAR(20) NOT NULL,
  consent_type VARCHAR(50) NOT NULL, -- call, sms, email
  action VARCHAR(50) NOT NULL, -- given, revoked, expired
  source VARCHAR(255),
  ip_address VARCHAR(45),
  user_agent TEXT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (recipient_id) REFERENCES call_recipients(id) ON DELETE SET NULL,
  INDEX idx_phone_consent (phone_number, consent_type, action)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Call Settings table
CREATE TABLE IF NOT EXISTS call_settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  data TEXT NOT NULL, -- JSON data for settings
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_settings (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Add indexes for better performance
CREATE INDEX idx_call_campaigns_user_status ON call_campaigns(user_id, status);
CREATE INDEX idx_call_campaigns_scheduled ON call_campaigns(scheduled_at);
CREATE INDEX idx_call_scripts_user_category ON call_scripts(user_id, category);
CREATE INDEX idx_call_recipients_user_status ON call_recipients(user_id, status);
CREATE INDEX idx_call_recipients_phone ON call_recipients(phone_number);
CREATE INDEX idx_call_recipients_campaign ON call_recipients(campaign_id);
CREATE INDEX idx_call_logs_campaign ON call_logs(campaign_id);
CREATE INDEX idx_call_logs_recipient ON call_logs(recipient_id);
CREATE INDEX idx_call_logs_status ON call_logs(status);
CREATE INDEX idx_call_logs_created ON call_logs(created_at);
CREATE INDEX idx_call_analytics_date ON call_analytics(date);
CREATE INDEX idx_dnc_lists_phone ON dnc_lists(phone_number);
CREATE INDEX idx_consent_logs_phone ON consent_logs(phone_number);