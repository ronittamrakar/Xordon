-- Add groups table for organizing campaigns, sequences, and templates

CREATE TABLE IF NOT EXISTS groups (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT NULL,
  parent_id INT NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  INDEX (user_id),
  INDEX (parent_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (parent_id) REFERENCES groups(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_group_name (user_id, name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Add group_id column to existing tables
ALTER TABLE campaigns ADD COLUMN group_id INT NULL AFTER user_id;
ALTER TABLE campaigns ADD INDEX (group_id);
ALTER TABLE campaigns ADD FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE SET NULL;

ALTER TABLE sequences ADD COLUMN group_id INT NULL AFTER user_id;
ALTER TABLE sequences ADD INDEX (group_id);
ALTER TABLE sequences ADD FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE SET NULL;

ALTER TABLE templates ADD COLUMN group_id INT NULL AFTER user_id;
ALTER TABLE templates ADD INDEX (group_id);
ALTER TABLE templates ADD FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE SET NULL;

-- Add group_id to SMS tables if they exist
ALTER TABLE sms_campaigns ADD COLUMN group_id INT NULL AFTER user_id;
ALTER TABLE sms_campaigns ADD INDEX (group_id);
ALTER TABLE sms_campaigns ADD FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE SET NULL;

ALTER TABLE sms_sequences ADD COLUMN group_id INT NULL AFTER user_id;
ALTER TABLE sms_sequences ADD INDEX (group_id);
ALTER TABLE sms_sequences ADD FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE SET NULL;

ALTER TABLE sms_templates ADD COLUMN group_id INT NULL AFTER user_id;
ALTER TABLE sms_templates ADD INDEX (group_id);
ALTER TABLE sms_templates ADD FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE SET NULL;