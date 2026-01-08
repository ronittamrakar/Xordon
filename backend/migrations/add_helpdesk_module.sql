-- Comprehensive Helpdesk Module Schema
-- Phase 1: Tickets MVP with full team, SLA, and automation support

-- ============================================================================
-- HELPDESK CORE TABLES
-- ============================================================================

-- Ticket Teams (support teams/departments)
CREATE TABLE IF NOT EXISTS ticket_teams (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT NULL,
    email_alias VARCHAR(255) NULL COMMENT 'support@, sales@, etc.',
    is_active BOOLEAN DEFAULT TRUE,
    business_hours JSON NULL COMMENT 'Operating hours for SLA calculation',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_workspace (workspace_id)
);

-- Team members
CREATE TABLE IF NOT EXISTS ticket_team_members (
    id INT AUTO_INCREMENT PRIMARY KEY,
    team_id INT NOT NULL,
    user_id INT NOT NULL,
    role ENUM('member', 'lead', 'manager') DEFAULT 'member',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_team (team_id),
    INDEX idx_user (user_id),
    UNIQUE KEY unique_team_user (team_id, user_id),
    FOREIGN KEY (team_id) REFERENCES ticket_teams(id) ON DELETE CASCADE
);

-- Ticket Stages (customizable workflow stages)
CREATE TABLE IF NOT EXISTS ticket_stages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT NULL,
    stage_type ENUM('new', 'in_progress', 'waiting', 'resolved', 'closed') DEFAULT 'in_progress',
    color VARCHAR(7) DEFAULT '#3b82f6',
    sequence INT DEFAULT 0,
    is_closed BOOLEAN DEFAULT FALSE COMMENT 'Marks ticket as completed',
    fold BOOLEAN DEFAULT FALSE COMMENT 'Fold in kanban view',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_workspace (workspace_id),
    INDEX idx_sequence (sequence)
);

-- Ticket Types (Bug, Question, Feature Request, etc.)
CREATE TABLE IF NOT EXISTS ticket_types (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT NULL,
    icon VARCHAR(50) NULL,
    color VARCHAR(7) DEFAULT '#3b82f6',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_workspace (workspace_id)
);

-- SLA Policies
CREATE TABLE IF NOT EXISTS sla_policies (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Priority-based response/resolution times (in minutes)
    priority_low_response_time INT DEFAULT 480 COMMENT 'Minutes',
    priority_low_resolution_time INT DEFAULT 2880 COMMENT 'Minutes',
    priority_medium_response_time INT DEFAULT 240,
    priority_medium_resolution_time INT DEFAULT 1440,
    priority_high_response_time INT DEFAULT 60,
    priority_high_resolution_time INT DEFAULT 480,
    priority_urgent_response_time INT DEFAULT 15,
    priority_urgent_resolution_time INT DEFAULT 120,
    
    -- Business hours
    use_business_hours BOOLEAN DEFAULT TRUE,
    business_hours JSON NULL,
    
    -- Assignment
    applies_to_teams JSON NULL COMMENT 'Team IDs this policy applies to',
    applies_to_types JSON NULL COMMENT 'Ticket type IDs',
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_workspace (workspace_id),
    INDEX idx_active (is_active)
);

-- Main Tickets table
CREATE TABLE IF NOT EXISTS tickets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    ticket_number VARCHAR(50) NOT NULL COMMENT 'User-facing ticket #',
    
    -- Basic info
    title VARCHAR(500) NOT NULL,
    description TEXT NULL,
    
    -- Status & assignment
    stage_id INT NULL,
    status ENUM('new', 'open', 'pending', 'on_hold', 'resolved', 'closed', 'cancelled') DEFAULT 'new',
    priority ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium',
    assigned_user_id INT NULL,
    team_id INT NULL,
    
    -- Classification
    ticket_type_id INT NULL,
    
    -- Contact/requester
    contact_id INT NULL COMMENT 'Link to contacts table',
    requester_name VARCHAR(255) NULL,
    requester_email VARCHAR(255) NULL,
    requester_phone VARCHAR(50) NULL,
    
    -- Source
    source_channel ENUM('email', 'webchat', 'phone', 'form', 'api', 'manual', 'sms', 'whatsapp') DEFAULT 'email',
    source_id VARCHAR(255) NULL COMMENT 'External reference (email message ID, form submission ID, etc.)',
    
    -- SLA tracking
    sla_policy_id INT NULL,
    first_response_at TIMESTAMP NULL,
    first_response_due_at TIMESTAMP NULL,
    resolved_at TIMESTAMP NULL,
    resolution_due_at TIMESTAMP NULL,
    sla_response_breached BOOLEAN DEFAULT FALSE,
    sla_resolution_breached BOOLEAN DEFAULT FALSE,
    
    -- Metadata
    tags JSON NULL,
    custom_fields JSON NULL,
    metadata JSON NULL,
    
    -- Ratings
    csat_score INT NULL COMMENT '1-5 rating',
    csat_comment TEXT NULL,
    csat_rated_at TIMESTAMP NULL,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    closed_at TIMESTAMP NULL,
    created_by INT NULL,
    
    INDEX idx_workspace (workspace_id),
    INDEX idx_ticket_number (ticket_number),
    INDEX idx_status (status),
    INDEX idx_priority (priority),
    INDEX idx_assigned (assigned_user_id),
    INDEX idx_team (team_id),
    INDEX idx_contact (contact_id),
    INDEX idx_stage (stage_id),
    INDEX idx_type (ticket_type_id),
    INDEX idx_created (created_at),
    INDEX idx_sla_policy (sla_policy_id),
    UNIQUE KEY unique_ticket_number (workspace_id, ticket_number),
    FOREIGN KEY (stage_id) REFERENCES ticket_stages(id) ON DELETE SET NULL,
    FOREIGN KEY (team_id) REFERENCES ticket_teams(id) ON DELETE SET NULL,
    FOREIGN KEY (ticket_type_id) REFERENCES ticket_types(id) ON DELETE SET NULL,
    FOREIGN KEY (sla_policy_id) REFERENCES sla_policies(id) ON DELETE SET NULL
);

-- Ticket Messages (conversation thread)
CREATE TABLE IF NOT EXISTS ticket_messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    ticket_id INT NOT NULL,
    
    -- Author
    author_user_id INT NULL COMMENT 'Internal user',
    author_contact_id INT NULL COMMENT 'External contact/customer',
    author_name VARCHAR(255) NULL,
    author_email VARCHAR(255) NULL,
    
    -- Content
    body TEXT NOT NULL,
    body_html TEXT NULL,
    direction ENUM('inbound', 'outbound', 'internal') DEFAULT 'outbound',
    message_type ENUM('comment', 'note', 'email', 'sms', 'call', 'system') DEFAULT 'comment',
    
    -- Visibility
    is_private BOOLEAN DEFAULT FALSE COMMENT 'Internal note not visible to customer',
    
    -- Email-specific
    from_email VARCHAR(255) NULL,
    to_email VARCHAR(255) NULL,
    cc_email TEXT NULL,
    subject VARCHAR(500) NULL,
    
    -- Attachments
    attachments JSON NULL,
    
    -- Metadata
    metadata JSON NULL,
    external_id VARCHAR(255) NULL COMMENT 'Email message ID, etc.',
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_workspace (workspace_id),
    INDEX idx_ticket (ticket_id),
    INDEX idx_author_user (author_user_id),
    INDEX idx_direction (direction),
    INDEX idx_created (created_at),
    FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE
);

-- Canned Responses / Macros
CREATE TABLE IF NOT EXISTS ticket_canned_responses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    shortcut VARCHAR(50) NULL COMMENT 'Quick insert shortcut like /thanks',
    subject VARCHAR(500) NULL,
    body TEXT NOT NULL,
    body_html TEXT NULL,
    category VARCHAR(100) NULL,
    
    -- Actions that macro can perform
    actions JSON NULL COMMENT 'Auto-assign, change status, add tags, etc.',
    
    is_shared BOOLEAN DEFAULT TRUE COMMENT 'Available to all team members',
    created_by INT NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_workspace (workspace_id),
    INDEX idx_shortcut (shortcut),
    INDEX idx_category (category)
);

-- Knowledge Base Articles
CREATE TABLE IF NOT EXISTS kb_articles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    title VARCHAR(500) NOT NULL,
    slug VARCHAR(500) NOT NULL,
    body TEXT NOT NULL,
    body_html TEXT NULL,
    excerpt TEXT NULL,
    
    -- Organization
    category_id INT NULL,
    tags JSON NULL,
    
    -- Visibility
    is_published BOOLEAN DEFAULT FALSE,
    is_internal BOOLEAN DEFAULT FALSE COMMENT 'Only visible to agents',
    
    -- SEO
    meta_title VARCHAR(255) NULL,
    meta_description TEXT NULL,
    
    -- Stats
    view_count INT DEFAULT 0,
    helpful_count INT DEFAULT 0,
    not_helpful_count INT DEFAULT 0,
    
    -- Author
    author_id INT NULL,
    
    published_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_workspace (workspace_id),
    INDEX idx_slug (slug),
    INDEX idx_category (category_id),
    INDEX idx_published (is_published),
    UNIQUE KEY unique_slug (workspace_id, slug)
);

-- KB Categories
CREATE TABLE IF NOT EXISTS kb_categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL,
    description TEXT NULL,
    icon VARCHAR(50) NULL,
    parent_id INT NULL,
    sequence INT DEFAULT 0,
    
    is_published BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_workspace (workspace_id),
    INDEX idx_parent (parent_id),
    INDEX idx_sequence (sequence),
    UNIQUE KEY unique_slug (workspace_id, slug)
);

-- Ticket Activity/Audit Log
CREATE TABLE IF NOT EXISTS ticket_activities (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    ticket_id INT NOT NULL,
    user_id INT NULL,
    
    activity_type ENUM('created', 'assigned', 'status_changed', 'priority_changed', 'commented', 'closed', 'reopened', 'tagged', 'custom_field_changed', 'merged', 'split') NOT NULL,
    description TEXT NULL,
    
    -- Changes
    field_name VARCHAR(100) NULL,
    old_value TEXT NULL,
    new_value TEXT NULL,
    
    metadata JSON NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_workspace (workspace_id),
    INDEX idx_ticket (ticket_id),
    INDEX idx_type (activity_type),
    INDEX idx_created (created_at),
    FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE
);

-- CSAT Surveys
CREATE TABLE IF NOT EXISTS ticket_csat_responses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    ticket_id INT NOT NULL,
    
    score INT NOT NULL COMMENT '1-5 rating',
    comment TEXT NULL,
    
    survey_sent_at TIMESTAMP NULL,
    responded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    metadata JSON NULL,
    
    INDEX idx_workspace (workspace_id),
    INDEX idx_ticket (ticket_id),
    INDEX idx_score (score),
    FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE
);

-- Ticket Tags
CREATE TABLE IF NOT EXISTS ticket_tags (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    color VARCHAR(7) DEFAULT '#6b7280',
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_workspace (workspace_id),
    UNIQUE KEY unique_tag_name (workspace_id, name)
);

-- Integration mappings (for Zendesk/Intercom sync)
CREATE TABLE IF NOT EXISTS ticket_external_mappings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    ticket_id INT NOT NULL,
    
    provider VARCHAR(50) NOT NULL COMMENT 'zendesk, intercom, freshdesk, etc.',
    external_id VARCHAR(255) NOT NULL,
    external_url VARCHAR(500) NULL,
    
    sync_status ENUM('synced', 'pending', 'error') DEFAULT 'synced',
    last_synced_at TIMESTAMP NULL,
    sync_error TEXT NULL,
    
    metadata JSON NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_workspace (workspace_id),
    INDEX idx_ticket (ticket_id),
    INDEX idx_provider_external (provider, external_id),
    UNIQUE KEY unique_provider_ticket (provider, ticket_id),
    FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE
);

-- ============================================================================
-- SEED DATA
-- ============================================================================

-- Default ticket stages
INSERT INTO ticket_stages (workspace_id, name, stage_type, color, sequence, is_closed) VALUES
(1, 'New', 'new', '#3b82f6', 1, FALSE),
(1, 'In Progress', 'in_progress', '#f59e0b', 2, FALSE),
(1, 'Waiting on Customer', 'waiting', '#8b5cf6', 3, FALSE),
(1, 'Resolved', 'resolved', '#10b981', 4, TRUE),
(1, 'Closed', 'closed', '#6b7280', 5, TRUE)
ON DUPLICATE KEY UPDATE name=name;

-- Default ticket types
INSERT INTO ticket_types (workspace_id, name, description, icon, color) VALUES
(1, 'Question', 'General inquiry or question', 'HelpCircle', '#3b82f6'),
(1, 'Bug Report', 'Technical issue or bug', 'Bug', '#ef4444'),
(1, 'Feature Request', 'New feature suggestion', 'Lightbulb', '#8b5cf6'),
(1, 'Support', 'Customer support request', 'LifeBuoy', '#10b981'),
(1, 'Billing', 'Billing or payment related', 'DollarSign', '#f59e0b')
ON DUPLICATE KEY UPDATE name=name;

-- Default team
INSERT INTO ticket_teams (workspace_id, name, description, email_alias) VALUES
(1, 'Support Team', 'General customer support', 'support')
ON DUPLICATE KEY UPDATE name=name;

-- Default SLA policy
INSERT INTO sla_policies (workspace_id, name, description, is_active) VALUES
(1, 'Standard SLA', 'Default service level agreement for all tickets', TRUE)
ON DUPLICATE KEY UPDATE name=name;

-- Sample canned responses
INSERT INTO ticket_canned_responses (workspace_id, name, shortcut, subject, body, category, is_shared) VALUES
(1, 'Thank You', '/thanks', NULL, 'Thank you for contacting us! We appreciate your patience.', 'common', TRUE),
(1, 'Working On It', '/working', NULL, 'We are currently working on your request and will update you shortly.', 'common', TRUE),
(1, 'Resolved', '/resolved', 'Issue Resolved', 'Your issue has been resolved. Please let us know if you need any further assistance.', 'closing', TRUE),
(1, 'Need More Info', '/info', 'Need Additional Information', 'To better assist you, could you please provide more details about {{issue}}?', 'common', TRUE)
ON DUPLICATE KEY UPDATE name=name;

-- Sample KB category
INSERT INTO kb_categories (workspace_id, name, slug, description, icon, sequence) VALUES
(1, 'Getting Started', 'getting-started', 'Everything you need to know to get started', 'Rocket', 1),
(1, 'FAQs', 'faqs', 'Frequently asked questions', 'HelpCircle', 2),
(1, 'Troubleshooting', 'troubleshooting', 'Common issues and how to resolve them', 'Wrench', 3)
ON DUPLICATE KEY UPDATE name=name;
