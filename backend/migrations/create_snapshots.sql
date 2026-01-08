-- GHL-style Snapshots System
-- Export/import pipelines, automations, forms, templates

-- Snapshots (saved configurations)
CREATE TABLE IF NOT EXISTS snapshots (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    company_id INT DEFAULT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT DEFAULT NULL,
    version VARCHAR(20) DEFAULT '1.0.0',
    category ENUM('full', 'pipelines', 'automations', 'forms', 'templates', 'custom') DEFAULT 'custom',
    is_template BOOLEAN DEFAULT FALSE,
    is_public BOOLEAN DEFAULT FALSE,
    thumbnail_url VARCHAR(500) DEFAULT NULL,
    contents JSON NOT NULL,
    metadata JSON DEFAULT NULL,
    created_by INT DEFAULT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_snapshots_workspace (workspace_id),
    INDEX idx_snapshots_company (workspace_id, company_id),
    INDEX idx_snapshots_category (workspace_id, category),
    INDEX idx_snapshots_template (is_template, is_public),
    
    FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Snapshot imports (track what was imported)
CREATE TABLE IF NOT EXISTS snapshot_imports (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    company_id INT DEFAULT NULL,
    snapshot_id INT DEFAULT NULL,
    source_type ENUM('internal', 'file', 'marketplace') DEFAULT 'internal',
    source_name VARCHAR(255) DEFAULT NULL,
    status ENUM('pending', 'processing', 'completed', 'failed') DEFAULT 'pending',
    items_imported JSON DEFAULT NULL,
    error_message TEXT DEFAULT NULL,
    imported_by INT DEFAULT NULL,
    started_at DATETIME DEFAULT NULL,
    completed_at DATETIME DEFAULT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_imports_workspace (workspace_id),
    INDEX idx_imports_snapshot (snapshot_id),
    INDEX idx_imports_status (workspace_id, status),
    
    FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
    FOREIGN KEY (snapshot_id) REFERENCES snapshots(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Snapshot marketplace (shared templates)
CREATE TABLE IF NOT EXISTS snapshot_marketplace (
    id INT AUTO_INCREMENT PRIMARY KEY,
    snapshot_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT DEFAULT NULL,
    category VARCHAR(100) DEFAULT NULL,
    tags JSON DEFAULT NULL,
    preview_images JSON DEFAULT NULL,
    price DECIMAL(10, 2) DEFAULT 0.00,
    currency VARCHAR(3) DEFAULT 'USD',
    is_free BOOLEAN DEFAULT TRUE,
    is_featured BOOLEAN DEFAULT FALSE,
    is_approved BOOLEAN DEFAULT FALSE,
    download_count INT DEFAULT 0,
    rating_sum INT DEFAULT 0,
    rating_count INT DEFAULT 0,
    author_name VARCHAR(255) DEFAULT NULL,
    author_workspace_id INT DEFAULT NULL,
    published_at DATETIME DEFAULT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_marketplace_category (category),
    INDEX idx_marketplace_featured (is_featured, is_approved),
    INDEX idx_marketplace_downloads (download_count DESC),
    
    FOREIGN KEY (snapshot_id) REFERENCES snapshots(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
