-- Migration: Add file features (starred, sharing, activity tracking)
-- Created: 2026-01-01

-- Add new columns to files table
ALTER TABLE files 
ADD COLUMN IF NOT EXISTS starred TINYINT(1) DEFAULT 0 COMMENT 'Whether file is starred/favorited',
ADD COLUMN IF NOT EXISTS shared_with JSON DEFAULT NULL COMMENT 'JSON array of user emails file is shared with',
ADD COLUMN IF NOT EXISTS owner_id INT DEFAULT NULL COMMENT 'User ID of file owner',
ADD COLUMN IF NOT EXISTS last_accessed_at TIMESTAMP NULL COMMENT 'Last time file was accessed',
ADD COLUMN IF NOT EXISTS download_count INT DEFAULT 0 COMMENT 'Number of times file was downloaded';

-- Add indexes for performance
ALTER TABLE files
ADD INDEX IF NOT EXISTS idx_starred (starred),
ADD INDEX IF NOT EXISTS idx_folder (folder),
ADD INDEX IF NOT EXISTS idx_owner (owner_id),
ADD INDEX IF NOT EXISTS idx_created (created_at);

-- Create file_shares table for robust sharing functionality
CREATE TABLE IF NOT EXISTS file_shares (
    id INT AUTO_INCREMENT PRIMARY KEY,
    file_id INT NOT NULL,
    shared_with_email VARCHAR(255) NOT NULL,
    shared_with_user_id INT DEFAULT NULL,
    permission ENUM('view', 'edit') DEFAULT 'view',
    shared_by_user_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NULL,
    accessed_at TIMESTAMP NULL,
    access_count INT DEFAULT 0,
    FOREIGN KEY (file_id) REFERENCES files(id) ON DELETE CASCADE,
    INDEX idx_file (file_id),
    INDEX idx_email (shared_with_email),
    INDEX idx_shared_by (shared_by_user_id),
    INDEX idx_expires (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create file_activities table for activity logging
CREATE TABLE IF NOT EXISTS file_activities (
    id INT AUTO_INCREMENT PRIMARY KEY,
    file_id INT NOT NULL,
    user_id INT DEFAULT NULL,
    activity_type ENUM('upload', 'download', 'share', 'move', 'rename', 'delete', 'restore', 'star', 'unstar', 'view') NOT NULL,
    description TEXT,
    metadata JSON DEFAULT NULL,
    ip_address VARCHAR(45) DEFAULT NULL,
    user_agent VARCHAR(255) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (file_id) REFERENCES files(id) ON DELETE CASCADE,
    INDEX idx_file (file_id),
    INDEX idx_user (user_id),
    INDEX idx_type (activity_type),
    INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create folders table for proper folder management
CREATE TABLE IF NOT EXISTS folders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    parent_id INT DEFAULT NULL,
    path VARCHAR(1000) NOT NULL,
    description TEXT,
    color VARCHAR(7) DEFAULT NULL,
    icon VARCHAR(50) DEFAULT NULL,
    is_shared TINYINT(1) DEFAULT 0,
    created_by_user_id INT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    FOREIGN KEY (parent_id) REFERENCES folders(id) ON DELETE CASCADE,
    INDEX idx_workspace (workspace_id),
    INDEX idx_parent (parent_id),
    INDEX idx_path (path(255)),
    INDEX idx_deleted (deleted_at),
    UNIQUE KEY unique_folder_path (workspace_id, path(255))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Update existing files to set owner_id (if user_id exists)
UPDATE files SET owner_id = user_id WHERE owner_id IS NULL AND user_id IS NOT NULL;

-- Insert default activity for existing files
INSERT INTO file_activities (file_id, user_id, activity_type, description, created_at)
SELECT id, user_id, 'upload', CONCAT('File uploaded: ', original_filename), created_at
FROM files
WHERE id NOT IN (SELECT DISTINCT file_id FROM file_activities WHERE activity_type = 'upload');
