-- Module Settings Migration
-- Settings for Growth and HR modules

-- ==================== MODULE SETTINGS TABLE ====================
-- Generic key-value settings storage for modules
CREATE TABLE IF NOT EXISTS module_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    company_id INT NULL,  -- NULL for workspace-level settings, set for company-scoped settings
    module VARCHAR(50) NOT NULL,  -- 'growth.social', 'growth.listings', 'growth.ads', 'hr.time', 'hr.expenses', 'hr.commissions'
    setting_key VARCHAR(100) NOT NULL,
    setting_value JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE KEY uk_module_setting (workspace_id, company_id, module, setting_key),
    INDEX idx_workspace_module (workspace_id, module),
    INDEX idx_company_module (company_id, module)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ==================== DEFAULT SETTINGS ====================
-- These are inserted when a workspace/company is created or when settings are first accessed

-- Growth Social Settings (company-scoped)
-- Keys: default_approval_required, auto_schedule_enabled, posting_timezone, best_times_enabled

-- Growth Listings Settings (company-scoped)
-- Keys: auto_sync_enabled, sync_frequency, alert_on_changes, monitored_directories

-- Growth Ads Settings (company-scoped)
-- Keys: budget_alerts_enabled, alert_threshold_percent, auto_pause_on_budget, conversion_tracking_enabled

-- HR Time Tracking Settings (workspace-scoped)
-- Keys: require_clock_in, allow_manual_entries, overtime_threshold_hours, overtime_multiplier, 
--       require_approval, auto_approve_under_hours, billable_default, default_hourly_rate

-- HR Expenses Settings (workspace-scoped)
-- Keys: require_receipt_over_amount, auto_approve_under_amount, mileage_rate, 
--       allowed_categories, require_approval, max_expense_amount

-- HR Commissions Settings (workspace-scoped)
-- Keys: default_commission_rate, calculation_period, payout_schedule, 
--       require_approval, auto_calculate_enabled
