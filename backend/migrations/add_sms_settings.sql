-- SMS Settings Migration for Xordon

CREATE TABLE IF NOT EXISTS sms_settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  data JSON NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_sms_settings (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Add index for better performance
CREATE INDEX idx_sms_settings_user ON sms_settings(user_id);