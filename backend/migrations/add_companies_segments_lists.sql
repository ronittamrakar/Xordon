-- Add Companies, Segments, and Lists tables for enhanced contact management
-- Companies: Organizations that contacts belong to
-- Segments: Dynamic groups based on filter criteria (saved filters)
-- Lists: Static groups of contacts (manual assignment)

-- Companies table
CREATE TABLE IF NOT EXISTS companies (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  domain VARCHAR(255) NULL,
  industry VARCHAR(100) NULL,
  size VARCHAR(50) NULL COMMENT 'e.g., 1-10, 11-50, 51-200, 201-500, 500+',
  annual_revenue VARCHAR(50) NULL,
  phone VARCHAR(50) NULL,
  email VARCHAR(255) NULL,
  website VARCHAR(255) NULL,
  address VARCHAR(255) NULL,
  city VARCHAR(100) NULL,
  state VARCHAR(100) NULL,
  country VARCHAR(100) NULL,
  postal_code VARCHAR(20) NULL,
  linkedin VARCHAR(255) NULL,
  twitter VARCHAR(255) NULL,
  description TEXT NULL,
  logo_url VARCHAR(500) NULL,
  status ENUM('active', 'inactive', 'prospect', 'customer', 'churned') DEFAULT 'active',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_companies_user (user_id),
  INDEX idx_companies_name (name),
  INDEX idx_companies_domain (domain),
  INDEX idx_companies_industry (industry),
  INDEX idx_companies_status (status),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Lists table (static contact groups)
CREATE TABLE IF NOT EXISTS contact_lists (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT NULL,
  color VARCHAR(7) NULL DEFAULT '#3b82f6' COMMENT 'Hex color for UI display',
  icon VARCHAR(50) NULL DEFAULT 'users' COMMENT 'Icon name for UI',
  is_default BOOLEAN DEFAULT FALSE COMMENT 'Default list for new contacts',
  contact_count INT DEFAULT 0 COMMENT 'Cached count of contacts',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_lists_user (user_id),
  INDEX idx_lists_name (name),
  UNIQUE KEY unique_user_list_name (user_id, name),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Contact-List junction table (many-to-many)
CREATE TABLE IF NOT EXISTS contact_list_members (
  id INT AUTO_INCREMENT PRIMARY KEY,
  contact_id INT NOT NULL,
  list_id INT NOT NULL,
  added_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  added_by VARCHAR(50) NULL COMMENT 'manual, import, automation, segment',
  INDEX idx_clm_contact (contact_id),
  INDEX idx_clm_list (list_id),
  UNIQUE KEY unique_contact_list (contact_id, list_id),
  FOREIGN KEY (contact_id) REFERENCES recipients(id) ON DELETE CASCADE,
  FOREIGN KEY (list_id) REFERENCES contact_lists(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Segments table (dynamic groups based on filters)
CREATE TABLE IF NOT EXISTS segments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT NULL,
  color VARCHAR(7) NULL DEFAULT '#8b5cf6' COMMENT 'Hex color for UI display',
  icon VARCHAR(50) NULL DEFAULT 'filter' COMMENT 'Icon name for UI',
  filter_criteria JSON NOT NULL COMMENT 'JSON object defining filter rules',
  match_type ENUM('all', 'any') DEFAULT 'all' COMMENT 'Match all or any criteria',
  contact_count INT DEFAULT 0 COMMENT 'Cached count of matching contacts',
  last_calculated_at DATETIME NULL COMMENT 'When count was last updated',
  is_active BOOLEAN DEFAULT TRUE,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_segments_user (user_id),
  INDEX idx_segments_name (name),
  INDEX idx_segments_active (is_active),
  UNIQUE KEY unique_user_segment_name (user_id, name),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Add company_id to recipients table
ALTER TABLE recipients ADD COLUMN company_id INT NULL AFTER user_id;
ALTER TABLE recipients ADD INDEX idx_recipients_company (company_id);
ALTER TABLE recipients ADD FOREIGN KEY fk_recipients_company (company_id) REFERENCES companies(id) ON DELETE SET NULL;

-- Company tags junction table
CREATE TABLE IF NOT EXISTS company_tags (
  id INT AUTO_INCREMENT PRIMARY KEY,
  company_id INT NOT NULL,
  tag_id INT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_ct_company (company_id),
  INDEX idx_ct_tag (tag_id),
  UNIQUE KEY unique_company_tag (company_id, tag_id),
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
  FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Company notes table
CREATE TABLE IF NOT EXISTS company_notes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  company_id INT NOT NULL,
  user_id INT NOT NULL,
  content TEXT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_cn_company (company_id),
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Company activities table (for tracking interactions)
CREATE TABLE IF NOT EXISTS company_activities (
  id INT AUTO_INCREMENT PRIMARY KEY,
  company_id INT NOT NULL,
  user_id INT NOT NULL,
  activity_type ENUM('note', 'email', 'call', 'meeting', 'task', 'deal', 'status_change') NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT NULL,
  metadata JSON NULL COMMENT 'Additional activity-specific data',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_ca_company (company_id),
  INDEX idx_ca_type (activity_type),
  INDEX idx_ca_created (created_at),
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Insert default lists for existing users
INSERT INTO contact_lists (user_id, name, description, color, icon, is_default)
SELECT DISTINCT user_id, 'All Contacts', 'Default list containing all contacts', '#3b82f6', 'users', TRUE
FROM recipients
WHERE user_id NOT IN (SELECT user_id FROM contact_lists WHERE is_default = TRUE);
