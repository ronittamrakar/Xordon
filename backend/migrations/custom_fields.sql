-- Phase 0: Custom Fields System
-- Universal custom fields for contacts, opportunities, jobs, invoices, etc.

CREATE TABLE IF NOT EXISTS custom_field_definitions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    
    -- Which entity type this field applies to
    entity_type VARCHAR(50) NOT NULL COMMENT 'contact, opportunity, job, invoice, company, etc.',
    
    -- Field definition
    field_key VARCHAR(50) NOT NULL COMMENT 'snake_case identifier',
    field_label VARCHAR(100) NOT NULL COMMENT 'Display label',
    field_type ENUM('text', 'textarea', 'number', 'decimal', 'date', 'datetime', 'boolean', 'select', 'multiselect', 'url', 'email', 'phone', 'currency', 'file', 'user', 'contact', 'company') NOT NULL DEFAULT 'text',
    
    -- Field options (for select/multiselect)
    options JSON NULL COMMENT '["Option 1", "Option 2"] or [{"value": "opt1", "label": "Option 1"}]',
    
    -- Validation
    is_required TINYINT(1) DEFAULT 0,
    default_value VARCHAR(500) NULL,
    placeholder VARCHAR(255) NULL,
    help_text VARCHAR(500) NULL,
    validation_regex VARCHAR(255) NULL,
    min_value DECIMAL(15,2) NULL,
    max_value DECIMAL(15,2) NULL,
    max_length INT NULL,
    
    -- Display
    sort_order INT DEFAULT 0,
    field_group VARCHAR(50) NULL COMMENT 'Group fields together in UI',
    show_in_list TINYINT(1) DEFAULT 0 COMMENT 'Show in list/table views',
    show_in_filters TINYINT(1) DEFAULT 0 COMMENT 'Allow filtering by this field',
    
    -- Status
    is_active TINYINT(1) DEFAULT 1,
    is_system TINYINT(1) DEFAULT 0 COMMENT 'System fields cannot be deleted',
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE KEY uk_workspace_entity_key (workspace_id, entity_type, field_key),
    INDEX idx_custom_fields_entity (workspace_id, entity_type, is_active, sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Custom field values (polymorphic storage)
CREATE TABLE IF NOT EXISTS custom_field_values (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    field_id INT NOT NULL,
    
    -- Which entity this value belongs to
    entity_type VARCHAR(50) NOT NULL,
    entity_id INT NOT NULL,
    
    -- Value storage (use appropriate column based on field_type)
    value_text TEXT NULL,
    value_number DECIMAL(15,4) NULL,
    value_date DATE NULL,
    value_datetime DATETIME NULL,
    value_boolean TINYINT(1) NULL,
    value_json JSON NULL COMMENT 'For multiselect, file references, etc.',
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE KEY uk_field_entity (field_id, entity_type, entity_id),
    INDEX idx_cfv_entity (workspace_id, entity_type, entity_id),
    INDEX idx_cfv_field (field_id),
    
    FOREIGN KEY (field_id) REFERENCES custom_field_definitions(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Universal tags (can be applied to any entity)
CREATE TABLE IF NOT EXISTS tags (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    
    name VARCHAR(50) NOT NULL,
    color VARCHAR(7) DEFAULT '#6366f1' COMMENT 'Hex color',
    description VARCHAR(255) NULL,
    
    -- Scope (optional - limit to specific entity types)
    entity_types JSON NULL COMMENT '["contact", "opportunity"] or NULL for all',
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE KEY uk_workspace_name (workspace_id, name),
    INDEX idx_tags_workspace (workspace_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Entity-tag relationships
CREATE TABLE IF NOT EXISTS entity_tags (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    tag_id INT NOT NULL,
    
    entity_type VARCHAR(50) NOT NULL,
    entity_id INT NOT NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INT NULL,
    
    UNIQUE KEY uk_tag_entity (tag_id, entity_type, entity_id),
    INDEX idx_entity_tags (workspace_id, entity_type, entity_id),
    
    FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
