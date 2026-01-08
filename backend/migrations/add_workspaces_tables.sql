CREATE TABLE IF NOT EXISTS workspaces (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) NOT NULL,
  owner_user_id INT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_workspaces_slug (slug),
  INDEX idx_workspaces_owner (owner_user_id),
  FOREIGN KEY (owner_user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS workspace_members (
  id INT AUTO_INCREMENT PRIMARY KEY,
  workspace_id INT NOT NULL,
  user_id INT NOT NULL,
  role ENUM('owner', 'admin', 'member') NOT NULL DEFAULT 'member',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_workspace_member (workspace_id, user_id),
  INDEX idx_workspace_members_user (user_id),
  INDEX idx_workspace_members_workspace (workspace_id),
  FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
