-- Add OAuth states table for secure OAuth flow

CREATE TABLE IF NOT EXISTS oauth_states (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  state VARCHAR(64) NOT NULL UNIQUE,
  provider VARCHAR(32) NOT NULL,
  created_at DATETIME NOT NULL,
  INDEX (user_id),
  INDEX (state),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;