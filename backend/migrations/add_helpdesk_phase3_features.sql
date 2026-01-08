-- Phase 3 Advanced Features Migration
-- Add tables for: saved filters, bulk actions log, CSAT automation, merge history

-- Saved Filters Table
CREATE TABLE IF NOT EXISTS ticket_saved_filters (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    user_id INT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT NULL,
    filter_criteria JSON NOT NULL,
    is_shared BOOLEAN DEFAULT FALSE,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_saved_filters_workspace ON ticket_saved_filters(workspace_id);
CREATE INDEX idx_saved_filters_user ON ticket_saved_filters(user_id);

-- Bulk Actions Log Table
CREATE TABLE IF NOT EXISTS ticket_bulk_actions_log (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    user_id INT NOT NULL,
    action_type ENUM('assign', 'close', 'tag', 'priority', 'status', 'team', 'merge', 'split', 'delete') NOT NULL,
    ticket_ids JSON NOT NULL,
    action_data JSON NULL,
    tickets_affected INT DEFAULT 0,
    status ENUM('pending', 'processing', 'completed', 'failed') DEFAULT 'pending',
    error_message TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL,
    FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_bulk_actions_workspace ON ticket_bulk_actions_log(workspace_id);
CREATE INDEX idx_bulk_actions_user ON ticket_bulk_actions_log(user_id);
CREATE INDEX idx_bulk_actions_created ON ticket_bulk_actions_log(created_at);

-- CSAT Survey Configurations Table
CREATE TABLE IF NOT EXISTS ticket_csat_surveys (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    trigger_event ENUM('ticket_closed', 'ticket_resolved', 'manual') DEFAULT 'ticket_closed',
    delay_minutes INT DEFAULT 0,
    email_subject VARCHAR(200) NOT NULL,
    email_body TEXT NOT NULL,
    survey_question VARCHAR(255) NOT NULL,
    rating_scale ENUM('1-5', '1-10', 'thumbs', 'emoji') DEFAULT '1-5',
    ask_comment BOOLEAN DEFAULT TRUE,
    comment_required BOOLEAN DEFAULT FALSE,
    send_to_email VARCHAR(255) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_csat_surveys_workspace ON ticket_csat_surveys(workspace_id);

-- CSAT Survey Sends Table (track what was sent)
CREATE TABLE IF NOT EXISTS ticket_csat_survey_sends (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    survey_id INT NOT NULL,
    ticket_id INT NOT NULL,
    sent_to_email VARCHAR(255) NOT NULL,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    opened_at TIMESTAMP NULL,
    responded_at TIMESTAMP NULL,
    response_token VARCHAR(64) UNIQUE,
    FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
    FOREIGN KEY (survey_id) REFERENCES ticket_csat_surveys(id) ON DELETE CASCADE,
    FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_csat_sends_workspace ON ticket_csat_survey_sends(workspace_id);
CREATE INDEX idx_csat_sends_ticket ON ticket_csat_survey_sends(ticket_id);
CREATE INDEX idx_csat_sends_token ON ticket_csat_survey_sends(response_token);

-- Ticket Merge History Table
CREATE TABLE IF NOT EXISTS ticket_merge_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    primary_ticket_id INT NOT NULL,
    merged_ticket_id INT NOT NULL,
    merged_ticket_number VARCHAR(50) NOT NULL,
    merged_by_user_id INT NOT NULL,
    merge_reason TEXT NULL,
    merged_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
    FOREIGN KEY (primary_ticket_id) REFERENCES tickets(id) ON DELETE CASCADE,
    FOREIGN KEY (merged_by_user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_merge_history_workspace ON ticket_merge_history(workspace_id);
CREATE INDEX idx_merge_history_primary ON ticket_merge_history(primary_ticket_id);

-- Ticket Split History Table
CREATE TABLE IF NOT EXISTS ticket_split_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    original_ticket_id INT NOT NULL,
    new_ticket_id INT NOT NULL,
    split_by_user_id INT NOT NULL,
    split_reason TEXT NULL,
    split_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
    FOREIGN KEY (original_ticket_id) REFERENCES tickets(id) ON DELETE CASCADE,
    FOREIGN KEY (new_ticket_id) REFERENCES tickets(id) ON DELETE CASCADE,
    FOREIGN KEY (split_by_user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_split_history_workspace ON ticket_split_history(workspace_id);
CREATE INDEX idx_split_history_original ON ticket_split_history(original_ticket_id);

-- Reporting Metrics Cache Table (optional - for performance)
CREATE TABLE IF NOT EXISTS ticket_reporting_metrics (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    metric_date DATE NOT NULL,
    metric_type VARCHAR(50) NOT NULL,
    metric_value DECIMAL(10,2) NOT NULL,
    metric_data JSON NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_metric (workspace_id, metric_date, metric_type),
    FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_reporting_workspace_date ON ticket_reporting_metrics(workspace_id, metric_date);

-- Insert default CSAT survey
INSERT INTO ticket_csat_surveys (workspace_id, name, description, trigger_event, delay_minutes, email_subject, email_body, survey_question, rating_scale, ask_comment) 
VALUES (
    1,
    'Default Post-Resolution Survey',
    'Automatically sent when tickets are resolved',
    'ticket_resolved',
    60,
    'How was your support experience?',
    'Hi {{firstName}},\n\nYour ticket {{ticketNumber}} was recently resolved. We would love to hear about your experience.\n\nPlease take a moment to rate your support experience.',
    'How satisfied were you with the support you received?',
    '1-5',
    TRUE
);

-- Insert sample saved filters
INSERT INTO ticket_saved_filters (workspace_id, user_id, name, description, filter_criteria, is_shared)
VALUES
(1, NULL, 'My Open Tickets', 'All open tickets assigned to me', '{"status": "open", "assigned_to": "me"}', FALSE),
(1, NULL, 'Urgent & High Priority', 'All urgent and high priority tickets', '{"priority": ["urgent", "high"]}', TRUE),
(1, NULL, 'SLA Breached', 'Tickets that have breached SLA', '{"sla_breached": true}', TRUE),
(1, NULL, 'Unassigned Tickets', 'All unassigned tickets', '{"assigned_to": "unassigned"}', TRUE);
