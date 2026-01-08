-- Seed Product Modules for Xordon Business OS
-- This creates the core product modules: Outreach, Forms, Operations

-- Ensure modules table exists (from add_modules_registry.sql)
CREATE TABLE IF NOT EXISTS modules (
    id INT AUTO_INCREMENT PRIMARY KEY,
    module_key VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    icon VARCHAR(50) DEFAULT 'Package',
    is_core BOOLEAN DEFAULT FALSE COMMENT 'Core modules cannot be disabled',
    version VARCHAR(20) DEFAULT '1.0.0',
    dependencies JSON COMMENT 'Array of module_keys this module depends on',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_module_key (module_key),
    INDEX idx_is_core (is_core)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Ensure workspace_modules table exists
CREATE TABLE IF NOT EXISTS workspace_modules (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    module_key VARCHAR(50) NOT NULL,
    status ENUM('installed', 'disabled') DEFAULT 'installed',
    installed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    installed_by INT COMMENT 'user_id who installed',
    disabled_at TIMESTAMP NULL,
    disabled_by INT COMMENT 'user_id who disabled',
    settings JSON COMMENT 'Module-specific settings for this workspace',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_workspace_module (workspace_id, module_key),
    INDEX idx_workspace_id (workspace_id),
    INDEX idx_module_key (module_key),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Clear existing modules and re-seed with product-focused modules
DELETE FROM modules WHERE module_key IN ('core', 'outreach', 'forms', 'operations', 'crm', 'landing_pages', 'proposals', 'automations', 'accounting', 'projects', 'marketing');

-- Seed the three main product modules
INSERT INTO modules (module_key, name, description, icon, is_core, dependencies) VALUES
    -- Core is always enabled
    ('core', 'Core Platform', 'Core platform functionality including auth, settings, dashboard, contacts, companies, lists, segments', 'Settings', TRUE, NULL),
    
    -- XordonOutreach - Email/SMS/Calls marketing suite (like ActiveCampaign/Brevo)
    ('outreach', 'Outreach', 'Email, SMS, and Call campaigns with sequences, templates, automations, landing pages, proposals, and A/B testing', 'Mail', FALSE, '["core"]'),
    
    -- XordonForms - Standalone forms product (like Typeform/Jotform)
    ('forms', 'Forms', 'Standalone form builder with submissions, analytics, and integrations - Typeform/Jotform alternative', 'ClipboardList', FALSE, '["core"]'),
    
    -- Operations Module - Field Service Management (postponed)
    ('operations', 'Operations', 'Field Service Management - jobs, estimates, appointments, payments, staff, services, and dispatch', 'Wrench', FALSE, '["core"]'),
    
    -- CRM is part of core for now (always available)
    ('crm', 'CRM', 'Customer Relationship Management - leads, pipeline, activities, and analytics', 'TrendingUp', FALSE, '["core"]')
ON DUPLICATE KEY UPDATE 
    name = VALUES(name),
    description = VALUES(description),
    icon = VALUES(icon),
    is_core = VALUES(is_core),
    dependencies = VALUES(dependencies);

-- Auto-install Outreach and CRM for all existing workspaces (default product bundle)
-- Forms is opt-in, Operations is disabled by default
INSERT IGNORE INTO workspace_modules (workspace_id, module_key, status, installed_at)
SELECT w.id, 'outreach', 'installed', NOW()
FROM workspaces w
WHERE NOT EXISTS (
    SELECT 1 FROM workspace_modules wm 
    WHERE wm.workspace_id = w.id AND wm.module_key = 'outreach'
);

INSERT IGNORE INTO workspace_modules (workspace_id, module_key, status, installed_at)
SELECT w.id, 'crm', 'installed', NOW()
FROM workspaces w
WHERE NOT EXISTS (
    SELECT 1 FROM workspace_modules wm 
    WHERE wm.workspace_id = w.id AND wm.module_key = 'crm'
);

-- Forms is installed by default (can be disabled)
INSERT IGNORE INTO workspace_modules (workspace_id, module_key, status, installed_at)
SELECT w.id, 'forms', 'installed', NOW()
FROM workspaces w
WHERE NOT EXISTS (
    SELECT 1 FROM workspace_modules wm 
    WHERE wm.workspace_id = w.id AND wm.module_key = 'forms'
);

-- Operations is NOT installed by default (hidden/postponed)
-- Workspaces can enable it later when the product is ready
