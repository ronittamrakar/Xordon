-- Speed dial entries for softphone
CREATE TABLE IF NOT EXISTS call_speed_dials (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  label VARCHAR(100) NOT NULL,
  phone_number VARCHAR(32) NOT NULL,
  notes VARCHAR(255),
  sort_order INT DEFAULT 0,
  metadata TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_speed_dial_per_user (user_id, label),
  INDEX idx_speed_dial_user_order (user_id, sort_order),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
