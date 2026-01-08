-- Additional Missing Tables Migration
-- Tables referenced by controllers but not yet created

-- ============================================
-- 1. SNAPSHOTS TABLES
-- ============================================

-- Snapshots (for cloning/exporting workspaces)
CREATE TABLE IF NOT EXISTS snapshots (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT NULL,
    snapshot_type ENUM('full', 'partial', 'template') DEFAULT 'full',
    status ENUM('creating', 'ready', 'failed', 'archived') DEFAULT 'creating',
    snapshot_data JSON NULL COMMENT 'Contains pipelines, automations, forms, templates',
    configuration JSON NULL COMMENT 'What to include in snapshot',
    version VARCHAR(20) DEFAULT '1.0',
    file_path VARCHAR(500) NULL,
    file_size_bytes BIGINT NULL,
    error_message TEXT NULL,
    is_public TINYINT(1) DEFAULT 0,
    is_template TINYINT(1) DEFAULT 0,
    download_count INT DEFAULT 0,
    created_by INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_snapshots_workspace (workspace_id, status),
    INDEX idx_snapshots_public (is_public, is_template)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Snapshot Imports (tracking restored snapshots)
CREATE TABLE IF NOT EXISTS snapshot_imports (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    snapshot_id INT NULL,
    source_workspace_id INT NULL,
    source_snapshot_name VARCHAR(255) NULL,
    import_type ENUM('restore', 'template', 'merge') DEFAULT 'restore',
    status ENUM('pending', 'in_progress', 'completed', 'failed') DEFAULT 'pending',
    configuration JSON NULL COMMENT 'What was imported',
    mapping JSON NULL COMMENT 'ID mappings for imported items',
    items_imported INT DEFAULT 0,
    items_failed INT DEFAULT 0,
    error_log JSON NULL,
    started_at TIMESTAMP NULL,
    completed_at TIMESTAMP NULL,
    created_by INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_snapshot_imports_workspace (workspace_id, status),
    FOREIGN KEY (snapshot_id) REFERENCES snapshots(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 2. EMAIL TEMPLATES
-- ============================================

CREATE TABLE IF NOT EXISTS email_templates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    subject VARCHAR(500) NULL,
    content TEXT NOT NULL,
    content_html TEXT NULL,
    template_type ENUM('marketing', 'transactional', 'notification', 'system') DEFAULT 'marketing',
    category VARCHAR(100) NULL,
    thumbnail_url VARCHAR(500) NULL,
    variables JSON NULL COMMENT 'Available merge variables',
    settings JSON NULL COMMENT 'Template settings like headers/footers',
    is_active TINYINT(1) DEFAULT 1,
    is_default TINYINT(1) DEFAULT 0,
    usage_count INT DEFAULT 0,
    last_used_at TIMESTAMP NULL,
    created_by INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email_templates_workspace (workspace_id, template_type, is_active),
    INDEX idx_email_templates_category (workspace_id, category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 3. AUTOMATION WORKFLOW TABLES
-- ============================================

-- Automation Workflows (visual workflow builder)
CREATE TABLE IF NOT EXISTS automation_workflows (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT NULL,
    workflow_type ENUM('trigger', 'scheduled', 'manual') DEFAULT 'trigger',
    trigger_type VARCHAR(100) NULL COMMENT 'e.g., form_submission, contact_created',
    trigger_config JSON NULL,
    status ENUM('draft', 'active', 'paused', 'archived') DEFAULT 'draft',
    version INT DEFAULT 1,
    nodes_config JSON NULL COMMENT 'Visual node positions and connections',
    stats JSON NULL COMMENT 'Cached execution stats',
    total_executions INT DEFAULT 0,
    successful_executions INT DEFAULT 0,
    failed_executions INT DEFAULT 0,
    last_executed_at TIMESTAMP NULL,
    created_by INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_automation_workflows_workspace (workspace_id, status),
    INDEX idx_automation_workflows_trigger (workspace_id, trigger_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Automation Actions (steps within workflows)
CREATE TABLE IF NOT EXISTS automation_actions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workflow_id INT NOT NULL,
    action_type VARCHAR(100) NOT NULL COMMENT 'e.g., send_email, add_tag, wait',
    name VARCHAR(255) NULL,
    config JSON NOT NULL COMMENT 'Action-specific configuration',
    sort_order INT DEFAULT 0,
    parent_action_id INT NULL COMMENT 'For branching/conditions',
    branch_type ENUM('main', 'yes', 'no') DEFAULT 'main',
    is_active TINYINT(1) DEFAULT 1,
    execution_count INT DEFAULT 0,
    success_count INT DEFAULT 0,
    failure_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_automation_actions_workflow (workflow_id, sort_order),
    INDEX idx_automation_actions_parent (parent_action_id),
    FOREIGN KEY (workflow_id) REFERENCES automation_workflows(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_action_id) REFERENCES automation_actions(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 4. HELPDESK EXTENDED TABLES
-- ============================================

-- Ticket Team Members
CREATE TABLE IF NOT EXISTS ticket_team_members (
    id INT AUTO_INCREMENT PRIMARY KEY,
    team_id INT NOT NULL,
    user_id INT NOT NULL,
    role ENUM('member', 'lead', 'manager') DEFAULT 'member',
    is_active TINYINT(1) DEFAULT 1,
    notification_settings JSON NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_team_member (team_id, user_id),
    INDEX idx_ticket_team_members_user (user_id),
    FOREIGN KEY (team_id) REFERENCES ticket_teams(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Knowledge Base Categories
CREATE TABLE IF NOT EXISTS knowledge_base_categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    parent_id INT NULL,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL,
    description TEXT NULL,
    icon VARCHAR(50) NULL,
    color VARCHAR(7) DEFAULT '#6366F1',
    visibility ENUM('public', 'private', 'internal') DEFAULT 'public',
    is_active TINYINT(1) DEFAULT 1,
    display_order INT DEFAULT 0,
    article_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_kb_category_slug (workspace_id, slug),
    INDEX idx_kb_categories_workspace (workspace_id, is_active),
    INDEX idx_kb_categories_parent (parent_id),
    FOREIGN KEY (parent_id) REFERENCES knowledge_base_categories(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Ticket Attachments
CREATE TABLE IF NOT EXISTS ticket_attachments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ticket_id INT NOT NULL,
    message_id INT NULL,
    filename VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size_bytes BIGINT NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    is_inline TINYINT(1) DEFAULT 0,
    content_id VARCHAR(255) NULL COMMENT 'For inline images',
    uploaded_by INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_ticket_attachments_ticket (ticket_id),
    INDEX idx_ticket_attachments_message (message_id),
    FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE,
    FOREIGN KEY (message_id) REFERENCES ticket_messages(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Ticket Watchers
CREATE TABLE IF NOT EXISTS ticket_watchers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ticket_id INT NOT NULL,
    user_id INT NULL,
    email VARCHAR(255) NULL,
    watcher_type ENUM('agent', 'requester', 'cc', 'email') DEFAULT 'agent',
    notify_on_update TINYINT(1) DEFAULT 1,
    notify_on_resolution TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_ticket_watcher (ticket_id, user_id),
    INDEX idx_ticket_watchers_user (user_id),
    FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 5. SEED DATA
-- ============================================

-- Seed default email templates
INSERT INTO email_templates (workspace_id, name, subject, content, template_type, is_default) VALUES
(1, 'Welcome Email', 'Welcome to {{company_name}}!', 'Hi {{first_name}},\n\nWelcome to {{company_name}}! We''re excited to have you on board.\n\nBest regards,\nThe Team', 'transactional', 1),
(1, 'Password Reset', 'Reset Your Password', 'Hi {{first_name}},\n\nClick the link below to reset your password:\n\n{{reset_link}}\n\nIf you didn''t request this, please ignore this email.', 'system', 1),
(1, 'Appointment Confirmation', 'Your Appointment is Confirmed', 'Hi {{first_name}},\n\nYour appointment has been confirmed:\n\nDate: {{appointment_date}}\nTime: {{appointment_time}}\nWith: {{staff_name}}\n\nSee you soon!', 'transactional', 1)
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- Seed default KB categories
INSERT INTO knowledge_base_categories (workspace_id, name, slug, description, display_order) VALUES
(1, 'Getting Started', 'getting-started', 'Learn the basics and get up and running quickly', 1),
(1, 'Frequently Asked Questions', 'faq', 'Common questions and answers', 2),
(1, 'Troubleshooting', 'troubleshooting', 'Solutions to common problems', 3),
(1, 'Best Practices', 'best-practices', 'Tips and recommendations for optimal usage', 4)
ON DUPLICATE KEY UPDATE name = VALUES(name);
