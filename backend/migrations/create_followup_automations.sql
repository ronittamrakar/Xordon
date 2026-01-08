-- Follow-up Automations Tables
-- Stores automation rules based on prospect outcomes for email, SMS, and calls

-- Main automations table
CREATE TABLE IF NOT EXISTS followup_automations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    channel VARCHAR(50) NOT NULL,
    trigger_type VARCHAR(100) NOT NULL,
    trigger_conditions JSON,
    action_type VARCHAR(100) NOT NULL,
    action_config JSON NOT NULL,
    delay_amount INT DEFAULT 0,
    delay_unit VARCHAR(20) DEFAULT 'minutes',
    is_active BOOLEAN DEFAULT TRUE,
    priority INT DEFAULT 0,
    campaign_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_followup_automations_user (user_id),
    INDEX idx_followup_automations_channel (channel),
    INDEX idx_followup_automations_trigger (trigger_type),
    INDEX idx_followup_automations_active (is_active)
);

-- Automation execution log
CREATE TABLE IF NOT EXISTS automation_executions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    automation_id INT NOT NULL,
    contact_id INT NOT NULL,
    trigger_event VARCHAR(100) NOT NULL,
    trigger_data JSON,
    action_result JSON,
    status VARCHAR(50) DEFAULT 'pending',
    scheduled_at DATETIME,
    executed_at DATETIME,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_automation_executions_automation (automation_id),
    INDEX idx_automation_executions_contact (contact_id),
    INDEX idx_automation_executions_status (status),
    INDEX idx_automation_executions_scheduled (scheduled_at)
);

-- Contact disposition/outcome tracking
CREATE TABLE IF NOT EXISTS contact_outcomes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    contact_id INT NOT NULL,
    user_id INT NOT NULL,
    channel VARCHAR(50) NOT NULL,
    campaign_id INT,
    outcome_type VARCHAR(100) NOT NULL,
    outcome_data JSON,
    sentiment VARCHAR(50),
    notes TEXT,
    recorded_by VARCHAR(50) DEFAULT 'system',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_contact_outcomes_contact (contact_id),
    INDEX idx_contact_outcomes_user (user_id),
    INDEX idx_contact_outcomes_channel (channel),
    INDEX idx_contact_outcomes_type (outcome_type)
);

-- Call dispositions (specific outcomes for calls)
CREATE TABLE IF NOT EXISTS call_dispositions_types (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    category VARCHAR(50),
    color VARCHAR(20) DEFAULT '#6B7280',
    icon VARCHAR(50),
    is_default BOOLEAN DEFAULT FALSE,
    requires_callback BOOLEAN DEFAULT FALSE,
    requires_notes BOOLEAN DEFAULT FALSE,
    sort_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_call_dispositions_user (user_id)
);
