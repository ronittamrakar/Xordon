-- CRM Advanced Features Migration
-- Creates tables for: Goals, Forecasting, Playbooks (CRM-specific), Settings, and enhanced integrations

-- =====================================================
-- SALES GOALS & TARGETS
-- =====================================================

CREATE TABLE IF NOT EXISTS crm_goals (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    workspace_id INT NULL,
    company_id INT NULL,
    goal_type ENUM('daily', 'weekly', 'monthly', 'quarterly', 'yearly') NOT NULL DEFAULT 'daily',
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    
    -- Activity Goals
    calls_goal INT DEFAULT 0,
    calls_completed INT DEFAULT 0,
    emails_goal INT DEFAULT 0,
    emails_completed INT DEFAULT 0,
    meetings_goal INT DEFAULT 0,
    meetings_completed INT DEFAULT 0,
    tasks_goal INT DEFAULT 0,
    tasks_completed INT DEFAULT 0,
    
    -- Revenue Goals
    revenue_goal DECIMAL(15,2) DEFAULT 0,
    revenue_achieved DECIMAL(15,2) DEFAULT 0,
    deals_goal INT DEFAULT 0,
    deals_closed INT DEFAULT 0,
    
    -- Lead Goals
    leads_goal INT DEFAULT 0,
    leads_created INT DEFAULT 0,
    qualified_leads_goal INT DEFAULT 0,
    qualified_leads_achieved INT DEFAULT 0,
    
    status ENUM('active', 'completed', 'failed', 'archived') DEFAULT 'active',
    notes TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_user_id (user_id),
    INDEX idx_workspace_id (workspace_id),
    INDEX idx_company_id (company_id),
    INDEX idx_goal_type (goal_type),
    INDEX idx_period (period_start, period_end),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS crm_goal_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    goal_id INT NOT NULL,
    field_name VARCHAR(100) NOT NULL,
    old_value VARCHAR(255),
    new_value VARCHAR(255),
    changed_by INT NOT NULL,
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (goal_id) REFERENCES crm_goals(id) ON DELETE CASCADE,
    INDEX idx_goal_id (goal_id),
    INDEX idx_changed_at (changed_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =====================================================
-- REVENUE FORECASTING
-- =====================================================

CREATE TABLE IF NOT EXISTS crm_forecasts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    workspace_id INT NULL,
    company_id INT NULL,
    forecast_period ENUM('monthly', 'quarterly', 'yearly') NOT NULL DEFAULT 'monthly',
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    
    -- Forecast Data
    expected_revenue DECIMAL(15,2) DEFAULT 0,
    weighted_pipeline DECIMAL(15,2) DEFAULT 0,
    best_case DECIMAL(15,2) DEFAULT 0,
    worst_case DECIMAL(15,2) DEFAULT 0,
    confidence_score DECIMAL(5,2) DEFAULT 0, -- 0-100
    
    -- Pipeline Breakdown
    pipeline_data JSON NULL, -- Stores stage-wise breakdown
    
    -- Actual Performance (updated as period progresses)
    actual_revenue DECIMAL(15,2) DEFAULT 0,
    deals_closed INT DEFAULT 0,
    
    -- Calculation Metadata
    calculation_method ENUM('probability_weighted', 'historical_average', 'manual') DEFAULT 'probability_weighted',
    calculated_at TIMESTAMP NULL,
    calculated_by INT NULL,
    
    notes TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_user_id (user_id),
    INDEX idx_workspace_id (workspace_id),
    INDEX idx_company_id (company_id),
    INDEX idx_period (period_start, period_end)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS crm_forecast_snapshots (
    id INT AUTO_INCREMENT PRIMARY KEY,
    forecast_id INT NOT NULL,
    snapshot_date DATE NOT NULL,
    expected_revenue DECIMAL(15,2) DEFAULT 0,
    weighted_pipeline DECIMAL(15,2) DEFAULT 0,
    confidence_score DECIMAL(5,2) DEFAULT 0,
    pipeline_data JSON NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (forecast_id) REFERENCES crm_forecasts(id) ON DELETE CASCADE,
    INDEX idx_forecast_id (forecast_id),
    INDEX idx_snapshot_date (snapshot_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =====================================================
-- SALES PLAYBOOKS (CRM-specific, different from sales enablement)
-- =====================================================

CREATE TABLE IF NOT EXISTS crm_playbooks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    workspace_id INT NULL,
    company_id INT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT NULL,
    
    -- Playbook Configuration
    playbook_type ENUM('prospecting', 'qualification', 'demo', 'negotiation', 'closing', 'custom') DEFAULT 'custom',
    target_persona VARCHAR(255) NULL,
    target_industry VARCHAR(255) NULL,
    deal_size_min DECIMAL(15,2) NULL,
    deal_size_max DECIMAL(15,2) NULL,
    
    -- Playbook Steps (JSON array of steps)
    steps JSON NULL,
    
    -- Messaging & Scripts
    email_templates JSON NULL,
    call_scripts JSON NULL,
    objection_handlers JSON NULL,
    
    -- Performance Tracking
    times_used INT DEFAULT 0,
    success_rate DECIMAL(5,2) DEFAULT 0,
    avg_deal_size DECIMAL(15,2) DEFAULT 0,
    avg_time_to_close INT DEFAULT 0, -- days
    
    -- Status & Permissions
    status ENUM('draft', 'active', 'archived') DEFAULT 'draft',
    is_shared BOOLEAN DEFAULT FALSE,
    shared_with JSON NULL, -- Array of user IDs or team IDs
    
    created_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_user_id (user_id),
    INDEX idx_workspace_id (workspace_id),
    INDEX idx_company_id (company_id),
    INDEX idx_playbook_type (playbook_type),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS crm_playbook_usage (
    id INT AUTO_INCREMENT PRIMARY KEY,
    playbook_id INT NOT NULL,
    lead_id INT NOT NULL,
    user_id INT NOT NULL,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL,
    outcome ENUM('won', 'lost', 'ongoing', 'abandoned') DEFAULT 'ongoing',
    deal_value DECIMAL(15,2) NULL,
    time_to_close INT NULL, -- days
    notes TEXT NULL,
    
    FOREIGN KEY (playbook_id) REFERENCES crm_playbooks(id) ON DELETE CASCADE,
    FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE,
    INDEX idx_playbook_id (playbook_id),
    INDEX idx_lead_id (lead_id),
    INDEX idx_user_id (user_id),
    INDEX idx_outcome (outcome)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =====================================================
-- CRM SETTINGS & PREFERENCES
-- =====================================================

CREATE TABLE IF NOT EXISTS crm_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NULL,
    workspace_id INT NULL,
    company_id INT NULL,
    setting_key VARCHAR(100) NOT NULL,
    setting_value TEXT NULL,
    setting_type ENUM('user', 'workspace', 'company', 'system') DEFAULT 'user',
    data_type ENUM('string', 'number', 'boolean', 'json') DEFAULT 'string',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE KEY unique_setting (user_id, workspace_id, company_id, setting_key),
    INDEX idx_user_id (user_id),
    INDEX idx_workspace_id (workspace_id),
    INDEX idx_company_id (company_id),
    INDEX idx_setting_type (setting_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =====================================================
-- DEAL PRODUCTS & LINE ITEMS
-- =====================================================

CREATE TABLE IF NOT EXISTS crm_products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    workspace_id INT NULL,
    company_id INT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT NULL,
    sku VARCHAR(100) NULL,
    category VARCHAR(100) NULL,
    unit_price DECIMAL(15,2) DEFAULT 0,
    cost_price DECIMAL(15,2) DEFAULT 0,
    currency VARCHAR(3) DEFAULT 'USD',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_user_id (user_id),
    INDEX idx_workspace_id (workspace_id),
    INDEX idx_company_id (company_id),
    INDEX idx_category (category),
    INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS crm_deal_products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    deal_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity DECIMAL(10,2) DEFAULT 1,
    unit_price DECIMAL(15,2) NOT NULL,
    discount_percent DECIMAL(5,2) DEFAULT 0,
    discount_amount DECIMAL(15,2) DEFAULT 0,
    tax_percent DECIMAL(5,2) DEFAULT 0,
    tax_amount DECIMAL(15,2) DEFAULT 0,
    total_amount DECIMAL(15,2) NOT NULL,
    notes TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (deal_id) REFERENCES deals(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES crm_products(id) ON DELETE RESTRICT,
    INDEX idx_deal_id (deal_id),
    INDEX idx_product_id (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =====================================================
-- SALES TERRITORIES
-- =====================================================

CREATE TABLE IF NOT EXISTS crm_territories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT NULL,
    territory_type ENUM('geographic', 'industry', 'account_size', 'custom') DEFAULT 'geographic',
    
    -- Geographic Data
    countries JSON NULL,
    states JSON NULL,
    cities JSON NULL,
    zip_codes JSON NULL,
    
    -- Industry/Vertical Data
    industries JSON NULL,
    
    -- Account Size Data
    revenue_min DECIMAL(15,2) NULL,
    revenue_max DECIMAL(15,2) NULL,
    employee_count_min INT NULL,
    employee_count_max INT NULL,
    
    -- Assignment
    assigned_users JSON NULL, -- Array of user IDs
    
    -- Performance
    quota DECIMAL(15,2) DEFAULT 0,
    
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_workspace_id (workspace_id),
    INDEX idx_territory_type (territory_type),
    INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =====================================================
-- LEAD SCORING RULES
-- =====================================================

CREATE TABLE IF NOT EXISTS crm_scoring_rules (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    rule_name VARCHAR(255) NOT NULL,
    rule_type ENUM('demographic', 'firmographic', 'behavioral', 'engagement') NOT NULL,
    
    -- Rule Conditions (JSON)
    conditions JSON NOT NULL,
    
    -- Scoring
    score_value INT NOT NULL,
    score_operation ENUM('add', 'subtract', 'set') DEFAULT 'add',
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    priority INT DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_workspace_id (workspace_id),
    INDEX idx_rule_type (rule_type),
    INDEX idx_is_active (is_active),
    INDEX idx_priority (priority)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =====================================================
-- SALES SEQUENCES (CRM-specific automation)
-- =====================================================

CREATE TABLE IF NOT EXISTS crm_sequences (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    workspace_id INT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT NULL,
    
    -- Sequence Configuration
    sequence_type ENUM('prospecting', 'nurture', 'follow_up', 're_engagement') DEFAULT 'prospecting',
    trigger_type ENUM('manual', 'stage_change', 'tag_added', 'score_threshold') DEFAULT 'manual',
    trigger_config JSON NULL,
    
    -- Steps (JSON array)
    steps JSON NULL,
    
    -- Performance
    enrollments INT DEFAULT 0,
    completions INT DEFAULT 0,
    opt_outs INT DEFAULT 0,
    
    status ENUM('draft', 'active', 'paused', 'archived') DEFAULT 'draft',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_user_id (user_id),
    INDEX idx_workspace_id (workspace_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS crm_sequence_enrollments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sequence_id INT NOT NULL,
    lead_id INT NOT NULL,
    current_step INT DEFAULT 0,
    status ENUM('active', 'completed', 'paused', 'opted_out') DEFAULT 'active',
    enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL,
    last_step_at TIMESTAMP NULL,
    next_step_at TIMESTAMP NULL,
    
    FOREIGN KEY (sequence_id) REFERENCES crm_sequences(id) ON DELETE CASCADE,
    FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE,
    INDEX idx_sequence_id (sequence_id),
    INDEX idx_lead_id (lead_id),
    INDEX idx_status (status),
    INDEX idx_next_step_at (next_step_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =====================================================
-- Insert Default Data
-- =====================================================

-- Insert default CRM settings
INSERT INTO crm_settings (workspace_id, setting_key, setting_value, setting_type, data_type) VALUES
(NULL, 'default_lead_score', '0', 'system', 'number'),
(NULL, 'auto_assign_leads', 'false', 'system', 'boolean'),
(NULL, 'lead_rotation_enabled', 'false', 'system', 'boolean'),
(NULL, 'default_currency', 'USD', 'system', 'string'),
(NULL, 'fiscal_year_start', '01-01', 'system', 'string'),
(NULL, 'enable_territories', 'false', 'system', 'boolean'),
(NULL, 'enable_products', 'true', 'system', 'boolean'),
(NULL, 'enable_forecasting', 'true', 'system', 'boolean')
ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value);

-- Insert default scoring rules
INSERT INTO crm_scoring_rules (workspace_id, rule_name, rule_type, conditions, score_value, score_operation, is_active, priority) VALUES
(1, 'Email Opened', 'engagement', '{"action": "email_opened"}', 5, 'add', TRUE, 10),
(1, 'Email Clicked', 'engagement', '{"action": "email_clicked"}', 10, 'add', TRUE, 20),
(1, 'Form Submitted', 'behavioral', '{"action": "form_submitted"}', 15, 'add', TRUE, 30),
(1, 'Meeting Booked', 'behavioral', '{"action": "meeting_booked"}', 25, 'add', TRUE, 40),
(1, 'Enterprise Company Size', 'firmographic', '{"employee_count": {"min": 1000}}', 20, 'add', TRUE, 15),
(1, 'Target Industry', 'firmographic', '{"industry": ["Technology", "Finance", "Healthcare"]}', 10, 'add', TRUE, 5)
ON DUPLICATE KEY UPDATE rule_name = VALUES(rule_name);

