-- SMS Tables Migration for Xordon

-- SMS Campaigns table
CREATE TABLE IF NOT EXISTS sms_campaigns (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  message TEXT NOT NULL,
  sender_id VARCHAR(50),
  status VARCHAR(50) NOT NULL DEFAULT 'draft',
  recipient_method VARCHAR(50) NOT NULL DEFAULT 'all',
  recipient_tags TEXT,
  scheduled_at DATETIME NULL,
  throttle_rate INT DEFAULT 1,
  throttle_unit VARCHAR(20) DEFAULT 'minute',
  enable_retry BOOLEAN DEFAULT FALSE,
  retry_attempts INT DEFAULT 3,
  respect_quiet_hours BOOLEAN DEFAULT TRUE,
  quiet_hours_start TIME DEFAULT '22:00:00',
  quiet_hours_end TIME DEFAULT '08:00:00',
  total_recipients INT DEFAULT 0,
  sent_count INT DEFAULT 0,
  delivered_count INT DEFAULT 0,
  failed_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- SMS Sequences table
CREATE TABLE IF NOT EXISTS sms_sequences (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(50) NOT NULL DEFAULT 'active',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- SMS Sequence Steps table
CREATE TABLE IF NOT EXISTS sms_sequence_steps (
  id INT AUTO_INCREMENT PRIMARY KEY,
  sequence_id INT NOT NULL,
  message TEXT NOT NULL,
  delay_amount INT NOT NULL DEFAULT 0,
  delay_unit VARCHAR(20) NOT NULL DEFAULT 'hours',
  step_order INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (sequence_id) REFERENCES sms_sequences(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- SMS Templates table
CREATE TABLE IF NOT EXISTS sms_templates (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  message TEXT NOT NULL,
  category VARCHAR(100),
  is_favorite BOOLEAN DEFAULT FALSE,
  usage_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- SMS Recipients table
CREATE TABLE IF NOT EXISTS sms_recipients (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  phone_number VARCHAR(20) NOT NULL,
  first_name VARCHAR(255),
  last_name VARCHAR(255),
  email VARCHAR(255),
  company VARCHAR(255),
  tags TEXT,
  status VARCHAR(50) NOT NULL DEFAULT 'active',
  opt_in_status VARCHAR(50) NOT NULL DEFAULT 'pending',
  opt_in_date DATETIME NULL,
  opt_out_date DATETIME NULL,
  last_activity DATETIME NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_phone (user_id, phone_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- SMS Messages table (for tracking sent messages)
CREATE TABLE IF NOT EXISTS sms_messages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  campaign_id INT NULL,
  sequence_id INT NULL,
  sequence_step_id INT NULL,
  recipient_id INT NOT NULL,
  phone_number VARCHAR(20) NOT NULL,
  message TEXT NOT NULL,
  sender_id VARCHAR(50),
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  external_id VARCHAR(255),
  delivery_status VARCHAR(50),
  delivery_timestamp DATETIME NULL,
  error_message TEXT,
  cost DECIMAL(10, 4) DEFAULT 0.0000,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (campaign_id) REFERENCES sms_campaigns(id) ON DELETE SET NULL,
  FOREIGN KEY (sequence_id) REFERENCES sms_sequences(id) ON DELETE SET NULL,
  FOREIGN KEY (sequence_step_id) REFERENCES sms_sequence_steps(id) ON DELETE SET NULL,
  FOREIGN KEY (recipient_id) REFERENCES sms_recipients(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- SMS Replies table (for incoming messages)
CREATE TABLE IF NOT EXISTS sms_replies (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  campaign_id INT NULL,
  recipient_id INT NULL,
  phone_number VARCHAR(20) NOT NULL,
  message TEXT NOT NULL,
  sender_id VARCHAR(50),
  external_id VARCHAR(255),
  is_read BOOLEAN DEFAULT FALSE,
  is_starred BOOLEAN DEFAULT FALSE,
  is_archived BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (campaign_id) REFERENCES sms_campaigns(id) ON DELETE SET NULL,
  FOREIGN KEY (recipient_id) REFERENCES sms_recipients(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- SMS Analytics table
CREATE TABLE IF NOT EXISTS sms_analytics (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  campaign_id INT NULL,
  sequence_id INT NULL,
  date DATE NOT NULL,
  sent_count INT DEFAULT 0,
  delivered_count INT DEFAULT 0,
  failed_count INT DEFAULT 0,
  reply_count INT DEFAULT 0,
  opt_out_count INT DEFAULT 0,
  total_cost DECIMAL(10, 4) DEFAULT 0.0000,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (campaign_id) REFERENCES sms_campaigns(id) ON DELETE SET NULL,
  FOREIGN KEY (sequence_id) REFERENCES sms_sequences(id) ON DELETE SET NULL,
  UNIQUE KEY unique_analytics (user_id, campaign_id, sequence_id, date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Add indexes for better performance
CREATE INDEX idx_sms_campaigns_user_status ON sms_campaigns(user_id, status);
CREATE INDEX idx_sms_recipients_user_status ON sms_recipients(user_id, status);
CREATE INDEX idx_sms_recipients_phone ON sms_recipients(phone_number);
CREATE INDEX idx_sms_messages_campaign ON sms_messages(campaign_id);
CREATE INDEX idx_sms_messages_recipient ON sms_messages(recipient_id);
CREATE INDEX idx_sms_messages_status ON sms_messages(status);
CREATE INDEX idx_sms_replies_user ON sms_replies(user_id);
CREATE INDEX idx_sms_replies_campaign ON sms_replies(campaign_id);
CREATE INDEX idx_sms_analytics_date ON sms_analytics(date);