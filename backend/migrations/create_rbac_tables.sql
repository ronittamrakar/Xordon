-- RBAC (Role-Based Access Control) Database Schema
-- Migration for roles, permissions, role_permissions, and audit logging

-- Roles table
CREATE TABLE IF NOT EXISTS roles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  is_system BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_roles_name (name),
  INDEX idx_roles_is_system (is_system)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Permissions table
CREATE TABLE IF NOT EXISTS permissions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  `key` VARCHAR(100) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_permissions_key (`key`),
  INDEX idx_permissions_category (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Role-Permission mapping (junction table)
CREATE TABLE IF NOT EXISTS role_permissions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  role_id INT NOT NULL,
  permission_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
  FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE,
  UNIQUE KEY unique_role_permission (role_id, permission_id),
  INDEX idx_role_permissions_role (role_id),
  INDEX idx_role_permissions_permission (permission_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- RBAC Audit Log table
CREATE TABLE IF NOT EXISTS rbac_audit_log (
  id INT AUTO_INCREMENT PRIMARY KEY,
  action VARCHAR(100) NOT NULL,
  actor_id INT NOT NULL,
  target_type VARCHAR(50),
  target_id INT,
  old_value JSON,
  new_value JSON,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (actor_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_rbac_audit_action (action),
  INDEX idx_rbac_audit_actor (actor_id),
  INDEX idx_rbac_audit_created (created_at),
  INDEX idx_rbac_audit_target (target_type, target_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add role_id column to users table (handled separately in migration runner)
