-- Phase 0: Activity Timeline System
-- Universal activity log for all entities (contacts, jobs, invoices, etc.)

CREATE TABLE IF NOT EXISTS activities (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    company_id INT NULL,
    
    -- Who performed the action
    user_id INT NULL COMMENT 'NULL for system actions',
    user_name VARCHAR(100) NULL COMMENT 'Cached for display',
    
    -- What entity was affected (polymorphic)
    entity_type VARCHAR(50) NOT NULL COMMENT 'contact, job, invoice, opportunity, appointment, etc.',
    entity_id INT NOT NULL,
    
    -- Secondary entity (for relationships)
    related_entity_type VARCHAR(50) NULL,
    related_entity_id INT NULL,
    
    -- Activity details
    activity_type VARCHAR(50) NOT NULL COMMENT 'created, updated, status_changed, note_added, email_sent, call_made, etc.',
    title VARCHAR(255) NOT NULL,
    description TEXT NULL,
    
    -- What changed (for updates)
    changes JSON NULL COMMENT '{"field": {"old": "x", "new": "y"}}',
    metadata JSON NULL COMMENT 'Additional context',
    
    -- Visibility
    is_system TINYINT(1) DEFAULT 0 COMMENT 'System-generated vs user action',
    is_pinned TINYINT(1) DEFAULT 0,
    is_internal TINYINT(1) DEFAULT 0 COMMENT 'Internal note vs visible to client',
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_activities_entity (workspace_id, entity_type, entity_id, created_at DESC),
    INDEX idx_activities_workspace (workspace_id, created_at DESC),
    INDEX idx_activities_user (workspace_id, user_id, created_at DESC),
    INDEX idx_activities_type (workspace_id, activity_type, created_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Activity comments/replies (for threaded discussions on activities)
CREATE TABLE IF NOT EXISTS activity_comments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    activity_id INT NOT NULL,
    user_id INT NOT NULL,
    user_name VARCHAR(100) NULL,
    
    body TEXT NOT NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_activity_comments (activity_id, created_at),
    
    FOREIGN KEY (activity_id) REFERENCES activities(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
