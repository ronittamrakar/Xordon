-- GHL-style Automations System
-- Standardized triggers, actions, and workflow recipes

-- Automation workflows (the main automation definition)
CREATE TABLE IF NOT EXISTS automation_workflows (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    company_id INT DEFAULT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT DEFAULT NULL,
    status ENUM('active', 'paused', 'draft') DEFAULT 'draft',
    trigger_type VARCHAR(100) NOT NULL,
    trigger_config JSON DEFAULT NULL,
    created_by INT DEFAULT NULL,
    run_count INT DEFAULT 0,
    last_run_at DATETIME DEFAULT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_workflows_workspace (workspace_id),
    INDEX idx_workflows_company (workspace_id, company_id),
    INDEX idx_workflows_status (workspace_id, status),
    INDEX idx_workflows_trigger (trigger_type),
    
    FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Automation actions (steps within a workflow)
CREATE TABLE IF NOT EXISTS automation_actions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workflow_id INT NOT NULL,
    action_type VARCHAR(100) NOT NULL,
    action_config JSON DEFAULT NULL,
    sort_order INT DEFAULT 0,
    delay_seconds INT DEFAULT 0,
    condition_config JSON DEFAULT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_actions_workflow (workflow_id),
    INDEX idx_actions_order (workflow_id, sort_order),
    
    FOREIGN KEY (workflow_id) REFERENCES automation_workflows(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Automation execution log
CREATE TABLE IF NOT EXISTS automation_executions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    workflow_id INT NOT NULL,
    workspace_id INT NOT NULL,
    company_id INT DEFAULT NULL,
    trigger_event_id BIGINT DEFAULT NULL,
    contact_id INT DEFAULT NULL,
    status ENUM('pending', 'running', 'completed', 'failed', 'cancelled') DEFAULT 'pending',
    current_action_index INT DEFAULT 0,
    started_at DATETIME DEFAULT NULL,
    completed_at DATETIME DEFAULT NULL,
    error_message TEXT DEFAULT NULL,
    execution_log JSON DEFAULT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_executions_workflow (workflow_id),
    INDEX idx_executions_workspace (workspace_id),
    INDEX idx_executions_status (status),
    INDEX idx_executions_contact (contact_id),
    INDEX idx_executions_pending (status, created_at),
    
    FOREIGN KEY (workflow_id) REFERENCES automation_workflows(id) ON DELETE CASCADE,
    FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Automation recipes (pre-built templates)
CREATE TABLE IF NOT EXISTS automation_recipes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT DEFAULT NULL,
    category VARCHAR(100) DEFAULT 'general',
    icon VARCHAR(50) DEFAULT NULL,
    trigger_type VARCHAR(100) NOT NULL,
    trigger_config JSON DEFAULT NULL,
    actions JSON NOT NULL,
    is_system BOOLEAN DEFAULT TRUE,
    popularity INT DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_recipes_category (category),
    INDEX idx_recipes_trigger (trigger_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default automation recipes
INSERT INTO automation_recipes (name, description, category, icon, trigger_type, trigger_config, actions) VALUES
('Welcome New Lead', 'Send a welcome email when a new contact is created from a form', 'lead_nurture', 'user-plus', 'form.submitted', '{}', '[{"action_type": "send_email", "action_config": {"template": "welcome", "delay_seconds": 0}}]'),
('Follow Up After Form', 'Send SMS follow-up 5 minutes after form submission', 'lead_nurture', 'message-circle', 'form.submitted', '{}', '[{"action_type": "wait", "action_config": {"seconds": 300}}, {"action_type": "send_sms", "action_config": {"message": "Thanks for reaching out! We will be in touch shortly."}}]'),
('Assign to Sales Rep', 'Auto-assign new opportunities to a sales rep', 'sales', 'user-check', 'opportunity.created', '{}', '[{"action_type": "assign_user", "action_config": {"assignment_type": "round_robin"}}]'),
('Won Deal Celebration', 'Send internal notification when deal is won', 'sales', 'trophy', 'opportunity.won', '{}', '[{"action_type": "internal_notification", "action_config": {"message": "Deal won! 🎉"}}]'),
('Lost Deal Follow-up', 'Tag contact and add note when deal is lost', 'sales', 'x-circle', 'opportunity.lost', '{}', '[{"action_type": "add_tag", "action_config": {"tag": "lost-deal"}}, {"action_type": "add_note", "action_config": {"note": "Deal was lost. Consider follow-up in 30 days."}}]'),
('Appointment Reminder', 'Send SMS reminder 1 hour before appointment', 'appointments', 'calendar', 'appointment.reminder', '{"hours_before": 1}', '[{"action_type": "send_sms", "action_config": {"message": "Reminder: Your appointment is in 1 hour."}}]'),
('New Message Alert', 'Notify team when new message is received', 'communication', 'bell', 'message.received', '{}', '[{"action_type": "internal_notification", "action_config": {"message": "New message received from contact"}}]'),
('Stage Change Notification', 'Notify owner when opportunity moves stages', 'sales', 'git-branch', 'opportunity.stage_changed', '{}', '[{"action_type": "internal_notification", "action_config": {"message": "Opportunity moved to new stage"}}]'),
('Review Request', 'Send review request 3 days after service completion', 'reviews', 'star', 'appointment.completed', '{}', '[{"action_type": "wait", "action_config": {"seconds": 259200}}, {"action_type": "send_sms", "action_config": {"message": "How was your experience? Leave us a review!"}}]'),
('Re-engagement Campaign', 'Send email to contacts inactive for 30 days', 'lead_nurture', 'refresh-cw', 'contact.inactive', '{"days": 30}', '[{"action_type": "send_email", "action_config": {"template": "reengagement"}}]')
ON DUPLICATE KEY UPDATE name = VALUES(name);
