-- Phase 0: Notifications System
-- In-app notifications + email/SMS push preferences

CREATE TABLE IF NOT EXISTS notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    user_id INT NOT NULL COMMENT 'Recipient user',
    
    -- Notification content
    type VARCHAR(50) NOT NULL COMMENT 'appointment.reminder, invoice.paid, review.received, etc.',
    title VARCHAR(255) NOT NULL,
    body TEXT NULL,
    icon VARCHAR(50) NULL COMMENT 'Lucide icon name',
    
    -- Link to related entity
    entity_type VARCHAR(50) NULL,
    entity_id INT NULL,
    action_url VARCHAR(500) NULL COMMENT 'URL to navigate to on click',
    
    -- Metadata
    metadata JSON NULL,
    
    -- Status
    is_read TINYINT(1) DEFAULT 0,
    read_at TIMESTAMP NULL,
    is_archived TINYINT(1) DEFAULT 0,
    
    -- Delivery tracking
    email_sent TINYINT(1) DEFAULT 0,
    email_sent_at TIMESTAMP NULL,
    sms_sent TINYINT(1) DEFAULT 0,
    sms_sent_at TIMESTAMP NULL,
    push_sent TINYINT(1) DEFAULT 0,
    push_sent_at TIMESTAMP NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_notifications_user (user_id, is_read, created_at DESC),
    INDEX idx_notifications_workspace (workspace_id, created_at DESC),
    INDEX idx_notifications_type (workspace_id, type, created_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- User notification preferences
CREATE TABLE IF NOT EXISTS notification_preferences (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    workspace_id INT NULL COMMENT 'NULL = global preference',
    
    -- Notification type
    notification_type VARCHAR(50) NOT NULL COMMENT 'appointment.reminder, invoice.paid, etc. or * for all',
    
    -- Channel preferences
    in_app TINYINT(1) DEFAULT 1,
    email TINYINT(1) DEFAULT 1,
    sms TINYINT(1) DEFAULT 0,
    push TINYINT(1) DEFAULT 1,
    
    -- Timing preferences
    digest_mode ENUM('instant', 'hourly', 'daily', 'weekly') DEFAULT 'instant',
    quiet_hours_start TIME NULL COMMENT 'e.g. 22:00',
    quiet_hours_end TIME NULL COMMENT 'e.g. 08:00',
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE KEY uk_user_workspace_type (user_id, workspace_id, notification_type),
    INDEX idx_prefs_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Notification templates (for system-generated notifications)
CREATE TABLE IF NOT EXISTS notification_templates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NULL COMMENT 'NULL = system template',
    
    type VARCHAR(50) NOT NULL COMMENT 'appointment.reminder, invoice.paid, etc.',
    name VARCHAR(100) NOT NULL,
    
    -- Templates with merge tags
    title_template VARCHAR(255) NOT NULL,
    body_template TEXT NULL,
    email_subject_template VARCHAR(255) NULL,
    email_body_template TEXT NULL,
    sms_template VARCHAR(500) NULL,
    
    -- Default channels
    default_in_app TINYINT(1) DEFAULT 1,
    default_email TINYINT(1) DEFAULT 0,
    default_sms TINYINT(1) DEFAULT 0,
    
    is_active TINYINT(1) DEFAULT 1,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE KEY uk_workspace_type (workspace_id, type),
    INDEX idx_templates_type (type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default notification templates
INSERT INTO notification_templates (workspace_id, type, name, title_template, body_template, default_email, default_sms) VALUES
(NULL, 'appointment.reminder', 'Appointment Reminder', 'Upcoming appointment: {{title}}', 'You have an appointment "{{title}}" scheduled for {{start_time}}.', 1, 1),
(NULL, 'appointment.booked', 'New Appointment Booked', 'New appointment: {{title}}', '{{guest_name}} booked an appointment "{{title}}" for {{start_time}}.', 1, 0),
(NULL, 'appointment.cancelled', 'Appointment Cancelled', 'Appointment cancelled: {{title}}', 'The appointment "{{title}}" scheduled for {{start_time}} has been cancelled.', 1, 1),
(NULL, 'invoice.created', 'Invoice Created', 'Invoice #{{invoice_number}} created', 'A new invoice #{{invoice_number}} for {{total}} has been created.', 1, 0),
(NULL, 'invoice.sent', 'Invoice Sent', 'Invoice #{{invoice_number}} sent', 'Invoice #{{invoice_number}} for {{total}} has been sent to {{contact_name}}.', 0, 0),
(NULL, 'invoice.paid', 'Invoice Paid', 'Payment received: Invoice #{{invoice_number}}', 'Payment of {{amount}} received for invoice #{{invoice_number}}.', 1, 0),
(NULL, 'invoice.overdue', 'Invoice Overdue', 'Invoice #{{invoice_number}} is overdue', 'Invoice #{{invoice_number}} for {{total}} is now overdue.', 1, 0),
(NULL, 'review.received', 'New Review Received', 'New {{rating}}-star review', 'You received a new {{rating}}-star review from {{reviewer_name}} on {{platform}}.', 1, 0),
(NULL, 'review.request.clicked', 'Review Request Clicked', 'Review request clicked', '{{recipient_name}} clicked your review request link.', 0, 0),
(NULL, 'opportunity.won', 'Deal Won', 'Deal won: {{name}}', 'Congratulations! The deal "{{name}}" worth {{value}} has been marked as won.', 1, 0),
(NULL, 'opportunity.lost', 'Deal Lost', 'Deal lost: {{name}}', 'The deal "{{name}}" worth {{value}} has been marked as lost.', 1, 0),
(NULL, 'task.due', 'Task Due', 'Task due: {{title}}', 'Your task "{{title}}" is due {{due_date}}.', 1, 0),
(NULL, 'task.assigned', 'Task Assigned', 'New task assigned: {{title}}', 'You have been assigned a new task: "{{title}}".', 1, 0),
(NULL, 'message.received', 'New Message', 'New message from {{sender_name}}', 'You received a new {{channel}} message from {{sender_name}}.', 0, 0),
(NULL, 'form.submitted', 'Form Submission', 'New form submission: {{form_name}}', 'A new submission was received for "{{form_name}}" from {{submitter_name}}.', 1, 0),
(NULL, 'job.assigned', 'Job Assigned', 'New job assigned: {{title}}', 'You have been assigned to job "{{title}}" scheduled for {{scheduled_date}}.', 1, 1),
(NULL, 'job.status_changed', 'Job Status Updated', 'Job status: {{title}}', 'Job "{{title}}" status changed to {{status}}.', 0, 0),
(NULL, 'missed_call', 'Missed Call', 'Missed call from {{caller_name}}', 'You missed a call from {{caller_name}} ({{caller_phone}}).', 1, 1)
ON DUPLICATE KEY UPDATE name = VALUES(name);
