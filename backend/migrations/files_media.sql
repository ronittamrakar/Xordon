-- Phase 0: Files & Media Library
-- Supports file uploads for receipts, job photos, attachments, blog images, proposal assets, etc.

CREATE TABLE IF NOT EXISTS files (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    company_id INT NULL,
    user_id INT NULL COMMENT 'Uploader',
    
    -- File metadata
    filename VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    file_size INT NOT NULL COMMENT 'Size in bytes',
    storage_path VARCHAR(500) NOT NULL COMMENT 'Path in storage (local or S3)',
    storage_provider ENUM('local', 's3', 'cloudinary') DEFAULT 'local',
    public_url VARCHAR(500) NULL COMMENT 'Public URL if applicable',
    
    -- Categorization
    folder VARCHAR(100) NULL COMMENT 'Virtual folder for organization',
    category ENUM('attachment', 'image', 'document', 'receipt', 'photo', 'video', 'audio', 'other') DEFAULT 'attachment',
    
    -- Entity attachment (polymorphic)
    entity_type VARCHAR(50) NULL COMMENT 'contact, job, invoice, proposal, blog_post, etc.',
    entity_id INT NULL,
    
    -- Metadata
    metadata JSON NULL COMMENT 'Width, height, duration, etc.',
    alt_text VARCHAR(255) NULL,
    description TEXT NULL,
    
    -- Status
    is_public TINYINT(1) DEFAULT 0,
    is_archived TINYINT(1) DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    
    INDEX idx_files_workspace (workspace_id),
    INDEX idx_files_workspace_entity (workspace_id, entity_type, entity_id),
    INDEX idx_files_workspace_folder (workspace_id, folder),
    INDEX idx_files_workspace_category (workspace_id, category),
    INDEX idx_files_created (workspace_id, created_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- File tags for better organization
CREATE TABLE IF NOT EXISTS file_tags (
    id INT AUTO_INCREMENT PRIMARY KEY,
    file_id INT NOT NULL,
    tag VARCHAR(50) NOT NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE KEY uk_file_tag (file_id, tag),
    INDEX idx_file_tags_tag (tag),
    
    FOREIGN KEY (file_id) REFERENCES files(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
