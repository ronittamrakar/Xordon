-- Modules Registry for Odoo-style App Management
-- This creates the foundation for per-workspace module enable/disable

-- Table: modules (registry of available apps/modules)
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

-- Table: workspace_modules (installed/enabled modules per workspace)
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
    INDEX idx_status (status),
    FOREIGN KEY (module_key) REFERENCES modules(module_key) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed default modules
INSERT INTO modules (module_key, name, description, icon, is_core, dependencies) VALUES
    ('core', 'Core Platform', 'Core platform functionality (auth, settings, dashboard)', 'Settings', TRUE, NULL),
    ('crm', 'CRM', 'Customer Relationship Management - leads, pipeline, activities', 'TrendingUp', FALSE, '["core"]'),
    ('outreach', 'Outreach', 'Email, SMS, and Call campaigns with sequences and templates', 'Mail', FALSE, '["core"]'),
    ('forms', 'Forms', 'Form builder and management with submissions tracking', 'ClipboardList', FALSE, '["core"]'),
    ('landing_pages', 'Landing Pages', 'Landing page builder and management', 'Globe', FALSE, '["core"]'),
    ('proposals', 'Proposals', 'Proposal builder and management', 'FileText', FALSE, '["core"]'),
    ('automations', 'Automations', 'Workflow automation and flow builder', 'Zap', FALSE, '["core"]'),
    ('operations', 'Operations', 'Field Service Management - jobs, estimates, services, staff', 'Wrench', FALSE, '["core"]'),
    ('accounting', 'Accounting', 'Invoicing, payments, and financial management', 'DollarSign', FALSE, '["core"]'),
    ('projects', 'Projects', 'Project management and task tracking', 'Kanban', FALSE, '["core"]'),
    ('marketing', 'Marketing', 'Marketing automation and campaign management', 'Megaphone', FALSE, '["core", "outreach"]')
ON DUPLICATE KEY UPDATE 
    name = VALUES(name),
    description = VALUES(description),
    icon = VALUES(icon),
    is_core = VALUES(is_core),
    dependencies = VALUES(dependencies);

-- Table: module_migrations (track which migrations have run per module)
CREATE TABLE IF NOT EXISTS module_migrations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    module_key VARCHAR(50) NOT NULL,
    migration_name VARCHAR(255) NOT NULL,
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_module_migration (module_key, migration_name),
    INDEX idx_module_key (module_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
