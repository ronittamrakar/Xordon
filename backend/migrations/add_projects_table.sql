-- Projects Management Module
-- Creates projects table and links tasks to projects

CREATE TABLE IF NOT EXISTS projects (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    workspace_id INT DEFAULT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status ENUM('planning', 'active', 'on_hold', 'completed', 'archived') DEFAULT 'active',
    priority ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium',
    start_date DATE,
    due_date DATE,
    completed_at DATETIME,
    progress_percentage INT DEFAULT 0,
    color VARCHAR(7) DEFAULT '#3B82F6',
    tags JSON,
    settings JSON,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_workspace_id (workspace_id),
    INDEX idx_status (status),
    INDEX idx_due_date (due_date),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Add project_id to sales_tasks table
ALTER TABLE sales_tasks 
ADD COLUMN project_id INT DEFAULT NULL AFTER deal_id,
ADD INDEX idx_project_id (project_id),
ADD FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL;

-- Create project members table for team collaboration
CREATE TABLE IF NOT EXISTS project_members (
    id INT AUTO_INCREMENT PRIMARY KEY,
    project_id INT NOT NULL,
    user_id INT NOT NULL,
    role ENUM('owner', 'admin', 'member', 'viewer') DEFAULT 'member',
    added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_project_user (project_id, user_id),
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Create project activity log
CREATE TABLE IF NOT EXISTS project_activity (
    id INT AUTO_INCREMENT PRIMARY KEY,
    project_id INT NOT NULL,
    user_id INT NOT NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50),
    entity_id INT,
    metadata JSON,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_project_id (project_id),
    INDEX idx_created_at (created_at),
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
