-- Advanced Reporting and Analytics Module
-- Tables for custom reports, dashboards, and data aggregation

-- Report definitions (saved reports)
CREATE TABLE IF NOT EXISTS report_definitions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    report_type ENUM('email', 'sms', 'calls', 'pipeline', 'revenue', 'contacts', 'forms', 'appointments', 'custom') NOT NULL,
    -- Query configuration
    metrics JSON NOT NULL, -- ["sent", "opened", "clicked", "revenue"]
    dimensions JSON NULL, -- ["date", "campaign", "tag"]
    filters JSON NULL, -- {"date_range": "last_30_days", "campaign_id": [1,2,3]}
    sort_by VARCHAR(100) NULL,
    sort_direction ENUM('asc', 'desc') NOT NULL DEFAULT 'desc',
    -- Display settings
    chart_type ENUM('line', 'bar', 'pie', 'table', 'funnel', 'area', 'donut', 'metric') NOT NULL DEFAULT 'table',
    chart_config JSON NULL,
    -- Scheduling
    is_scheduled BOOLEAN NOT NULL DEFAULT FALSE,
    schedule_frequency ENUM('daily', 'weekly', 'monthly') NULL,
    schedule_day INT NULL, -- Day of week (0-6) or day of month (1-31)
    schedule_time TIME NULL,
    schedule_recipients JSON NULL, -- Email addresses to send report to
    last_run_at DATETIME NULL,
    next_run_at DATETIME NULL,
    -- Sharing
    is_public BOOLEAN NOT NULL DEFAULT FALSE,
    share_token VARCHAR(64) NULL UNIQUE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_reports_user (user_id),
    INDEX idx_reports_type (report_type),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Dashboard definitions
CREATE TABLE IF NOT EXISTS dashboards (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    layout JSON NULL, -- Grid layout configuration
    theme VARCHAR(50) DEFAULT 'default',
    refresh_interval INT NULL, -- Auto-refresh in seconds
    is_public BOOLEAN NOT NULL DEFAULT FALSE,
    share_token VARCHAR(64) NULL UNIQUE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_dashboards_user (user_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Dashboard widgets
CREATE TABLE IF NOT EXISTS dashboard_widgets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    dashboard_id INT NOT NULL,
    report_id INT NULL, -- Link to saved report, or NULL for custom widget
    widget_type ENUM('metric', 'chart', 'table', 'list', 'funnel', 'goal', 'leaderboard', 'activity_feed') NOT NULL,
    title VARCHAR(255) NOT NULL,
    -- Position and size
    position_x INT NOT NULL DEFAULT 0,
    position_y INT NOT NULL DEFAULT 0,
    width INT NOT NULL DEFAULT 4, -- Grid units
    height INT NOT NULL DEFAULT 3,
    -- Configuration
    config JSON NULL, -- Widget-specific settings
    data_source VARCHAR(100) NULL, -- 'campaigns', 'contacts', 'revenue', etc.
    metric VARCHAR(100) NULL,
    filters JSON NULL,
    comparison_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    comparison_period VARCHAR(50) NULL, -- 'previous_period', 'previous_year'
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_widgets_dashboard (dashboard_id),
    FOREIGN KEY (dashboard_id) REFERENCES dashboards(id) ON DELETE CASCADE,
    FOREIGN KEY (report_id) REFERENCES report_definitions(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Goals and targets
CREATE TABLE IF NOT EXISTS goals (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    metric_type ENUM('revenue', 'contacts', 'deals', 'emails_sent', 'calls_made', 'appointments', 'form_submissions', 'custom') NOT NULL,
    target_value DECIMAL(15, 2) NOT NULL,
    current_value DECIMAL(15, 2) NOT NULL DEFAULT 0,
    period_type ENUM('daily', 'weekly', 'monthly', 'quarterly', 'yearly', 'custom') NOT NULL DEFAULT 'monthly',
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status ENUM('on_track', 'at_risk', 'behind', 'achieved', 'not_started') NOT NULL DEFAULT 'not_started',
    notify_at_percent INT NULL, -- Notify when reaching this percentage
    notification_sent BOOLEAN NOT NULL DEFAULT FALSE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_goals_user (user_id),
    INDEX idx_goals_status (status),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Goal progress history
CREATE TABLE IF NOT EXISTS goal_progress (
    id INT AUTO_INCREMENT PRIMARY KEY,
    goal_id INT NOT NULL,
    recorded_at DATE NOT NULL,
    value DECIMAL(15, 2) NOT NULL,
    notes TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_progress_goal (goal_id),
    INDEX idx_progress_date (recorded_at),
    FOREIGN KEY (goal_id) REFERENCES goals(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Data aggregations (pre-computed metrics for faster reporting)
CREATE TABLE IF NOT EXISTS report_aggregations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    aggregation_date DATE NOT NULL,
    aggregation_type ENUM('daily', 'weekly', 'monthly') NOT NULL DEFAULT 'daily',
    -- Email metrics
    emails_sent INT NOT NULL DEFAULT 0,
    emails_delivered INT NOT NULL DEFAULT 0,
    emails_opened INT NOT NULL DEFAULT 0,
    emails_clicked INT NOT NULL DEFAULT 0,
    emails_bounced INT NOT NULL DEFAULT 0,
    emails_unsubscribed INT NOT NULL DEFAULT 0,
    emails_replied INT NOT NULL DEFAULT 0,
    -- SMS metrics
    sms_sent INT NOT NULL DEFAULT 0,
    sms_delivered INT NOT NULL DEFAULT 0,
    sms_failed INT NOT NULL DEFAULT 0,
    sms_replied INT NOT NULL DEFAULT 0,
    -- Call metrics
    calls_made INT NOT NULL DEFAULT 0,
    calls_answered INT NOT NULL DEFAULT 0,
    calls_duration_seconds INT NOT NULL DEFAULT 0,
    calls_voicemail INT NOT NULL DEFAULT 0,
    -- Contact metrics
    contacts_created INT NOT NULL DEFAULT 0,
    contacts_updated INT NOT NULL DEFAULT 0,
    contacts_unsubscribed INT NOT NULL DEFAULT 0,
    -- Revenue metrics
    revenue_total DECIMAL(15, 2) NOT NULL DEFAULT 0,
    invoices_sent INT NOT NULL DEFAULT 0,
    invoices_paid INT NOT NULL DEFAULT 0,
    payments_received INT NOT NULL DEFAULT 0,
    -- Pipeline metrics
    deals_created INT NOT NULL DEFAULT 0,
    deals_won INT NOT NULL DEFAULT 0,
    deals_lost INT NOT NULL DEFAULT 0,
    deals_value_won DECIMAL(15, 2) NOT NULL DEFAULT 0,
    -- Appointment metrics
    appointments_booked INT NOT NULL DEFAULT 0,
    appointments_completed INT NOT NULL DEFAULT 0,
    appointments_cancelled INT NOT NULL DEFAULT 0,
    appointments_no_show INT NOT NULL DEFAULT 0,
    -- Form metrics
    form_submissions INT NOT NULL DEFAULT 0,
    form_views INT NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_user_date_type (user_id, aggregation_date, aggregation_type),
    INDEX idx_aggregations_user (user_id),
    INDEX idx_aggregations_date (aggregation_date),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Report exports history
CREATE TABLE IF NOT EXISTS report_exports (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    report_id INT NULL,
    export_type ENUM('csv', 'xlsx', 'pdf', 'json') NOT NULL DEFAULT 'csv',
    file_name VARCHAR(255) NOT NULL,
    file_url VARCHAR(500) NULL,
    file_size INT NULL,
    status ENUM('pending', 'processing', 'completed', 'failed') NOT NULL DEFAULT 'pending',
    error_message TEXT,
    expires_at DATETIME NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_exports_user (user_id),
    INDEX idx_exports_status (status),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (report_id) REFERENCES report_definitions(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Scheduled report runs
CREATE TABLE IF NOT EXISTS scheduled_report_runs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    report_id INT NOT NULL,
    scheduled_for DATETIME NOT NULL,
    status ENUM('pending', 'running', 'completed', 'failed') NOT NULL DEFAULT 'pending',
    started_at DATETIME NULL,
    completed_at DATETIME NULL,
    recipients_notified INT NOT NULL DEFAULT 0,
    error_message TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_scheduled_runs_report (report_id),
    INDEX idx_scheduled_runs_status (status),
    INDEX idx_scheduled_runs_scheduled (scheduled_for),
    FOREIGN KEY (report_id) REFERENCES report_definitions(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Attribution tracking
CREATE TABLE IF NOT EXISTS attribution_events (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    contact_id INT NOT NULL,
    event_type ENUM('first_touch', 'lead_created', 'opportunity_created', 'deal_won', 'revenue') NOT NULL,
    source_type ENUM('email_campaign', 'sms_campaign', 'call_campaign', 'form', 'landing_page', 'direct', 'referral', 'organic', 'paid', 'other') NOT NULL,
    source_id INT NULL, -- Campaign ID, form ID, etc.
    source_name VARCHAR(255) NULL,
    channel VARCHAR(50) NULL,
    utm_source VARCHAR(255) NULL,
    utm_medium VARCHAR(255) NULL,
    utm_campaign VARCHAR(255) NULL,
    utm_content VARCHAR(255) NULL,
    utm_term VARCHAR(255) NULL,
    value DECIMAL(15, 2) NULL,
    event_at DATETIME NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_attribution_user (user_id),
    INDEX idx_attribution_contact (contact_id),
    INDEX idx_attribution_event_type (event_type),
    INDEX idx_attribution_source (source_type),
    INDEX idx_attribution_date (event_at),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
