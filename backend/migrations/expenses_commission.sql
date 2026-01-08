-- Phase 4: Expenses & Commission Management
-- Employee expenses, reimbursements, and commission tracking

-- Expense categories
CREATE TABLE IF NOT EXISTS expense_categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    
    name VARCHAR(100) NOT NULL,
    description TEXT NULL,
    
    -- Limits
    requires_receipt TINYINT(1) DEFAULT 1,
    max_amount DECIMAL(10,2) NULL,
    requires_approval TINYINT(1) DEFAULT 1,
    
    -- GL code for accounting
    gl_code VARCHAR(50) NULL,
    
    is_active TINYINT(1) DEFAULT 1,
    sort_order INT DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE KEY uk_workspace_name (workspace_id, name),
    INDEX idx_expense_categories (workspace_id, is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Expense reports
CREATE TABLE IF NOT EXISTS expense_reports (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    user_id INT NOT NULL,
    
    -- Report info
    report_number VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NULL,
    
    -- Period
    period_start DATE NULL,
    period_end DATE NULL,
    
    -- Totals
    total_amount DECIMAL(12,2) DEFAULT 0,
    approved_amount DECIMAL(12,2) DEFAULT 0,
    reimbursed_amount DECIMAL(12,2) DEFAULT 0,
    currency VARCHAR(3) DEFAULT 'USD',
    
    -- Status
    status ENUM('draft', 'submitted', 'under_review', 'approved', 'rejected', 'reimbursed', 'partially_reimbursed') DEFAULT 'draft',
    
    -- Submission
    submitted_at TIMESTAMP NULL,
    
    -- Approval
    approved_by INT NULL,
    approved_at TIMESTAMP NULL,
    rejection_reason TEXT NULL,
    
    -- Reimbursement
    reimbursed_at TIMESTAMP NULL,
    reimbursement_method VARCHAR(50) NULL,
    reimbursement_reference VARCHAR(255) NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE KEY uk_workspace_number (workspace_id, report_number),
    INDEX idx_expense_reports_user (user_id, created_at DESC),
    INDEX idx_expense_reports_status (workspace_id, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Individual expenses
CREATE TABLE IF NOT EXISTS expenses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    user_id INT NOT NULL,
    expense_report_id INT NULL,
    
    -- Category
    category_id INT NULL,
    category_name VARCHAR(100) NULL,
    
    -- Expense details
    description VARCHAR(255) NOT NULL,
    merchant VARCHAR(255) NULL,
    expense_date DATE NOT NULL,
    
    -- Amount
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    
    -- Receipt
    receipt_url VARCHAR(500) NULL,
    receipt_file_id INT NULL,
    
    -- Related records
    job_id INT NULL,
    contact_id INT NULL,
    
    -- Mileage (for travel expenses)
    is_mileage TINYINT(1) DEFAULT 0,
    miles DECIMAL(10,2) NULL,
    mileage_rate DECIMAL(5,3) NULL,
    
    -- Status
    status ENUM('pending', 'approved', 'rejected', 'reimbursed') DEFAULT 'pending',
    approved_by INT NULL,
    approved_at TIMESTAMP NULL,
    rejection_reason TEXT NULL,
    
    -- Billable to client
    is_billable TINYINT(1) DEFAULT 0,
    billed_to_contact_id INT NULL,
    invoice_id INT NULL,
    
    notes TEXT NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_expenses_user (user_id, expense_date DESC),
    INDEX idx_expenses_report (expense_report_id),
    INDEX idx_expenses_workspace (workspace_id, status, expense_date DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Commission plans
CREATE TABLE IF NOT EXISTS commission_plans (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    
    name VARCHAR(100) NOT NULL,
    description TEXT NULL,
    
    -- Plan type
    plan_type ENUM('percentage', 'tiered', 'flat', 'custom') DEFAULT 'percentage',
    
    -- Base rate (for percentage type)
    base_rate DECIMAL(5,2) NULL COMMENT 'Percentage',
    
    -- Tiers (JSON for tiered plans)
    tiers JSON NULL COMMENT '[{min: 0, max: 10000, rate: 5}, {min: 10000, max: null, rate: 10}]',
    
    -- Flat amount (for flat type)
    flat_amount DECIMAL(10,2) NULL,
    
    -- What it applies to
    applies_to ENUM('revenue', 'profit', 'deals_closed', 'appointments', 'custom') DEFAULT 'revenue',
    
    -- Calculation period
    calculation_period ENUM('per_transaction', 'weekly', 'biweekly', 'monthly', 'quarterly') DEFAULT 'monthly',
    
    -- Minimum threshold
    minimum_threshold DECIMAL(12,2) NULL,
    
    is_active TINYINT(1) DEFAULT 1,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_commission_plans (workspace_id, is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- User commission assignments
CREATE TABLE IF NOT EXISTS user_commission_plans (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    commission_plan_id INT NOT NULL,
    
    -- Override rates
    custom_rate DECIMAL(5,2) NULL,
    custom_tiers JSON NULL,
    
    -- Effective dates
    effective_from DATE NOT NULL,
    effective_to DATE NULL,
    
    is_active TINYINT(1) DEFAULT 1,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_user_commission (user_id, is_active),
    
    FOREIGN KEY (commission_plan_id) REFERENCES commission_plans(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Commission records
CREATE TABLE IF NOT EXISTS commissions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    user_id INT NOT NULL,
    commission_plan_id INT NULL,
    
    -- Period
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    
    -- Source
    source_type VARCHAR(50) NULL COMMENT 'invoice, opportunity, appointment, etc.',
    source_id INT NULL,
    source_description VARCHAR(255) NULL,
    
    -- Amounts
    base_amount DECIMAL(12,2) NOT NULL COMMENT 'Revenue/profit amount',
    commission_rate DECIMAL(5,2) NULL,
    commission_amount DECIMAL(12,2) NOT NULL,
    
    -- Status
    status ENUM('pending', 'approved', 'paid', 'cancelled') DEFAULT 'pending',
    
    -- Approval
    approved_by INT NULL,
    approved_at TIMESTAMP NULL,
    
    -- Payment
    paid_at TIMESTAMP NULL,
    payroll_id INT NULL,
    
    notes TEXT NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_commissions_user (user_id, period_start DESC),
    INDEX idx_commissions_workspace (workspace_id, status, period_start DESC),
    INDEX idx_commissions_source (source_type, source_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Commission summaries (for reporting)
CREATE TABLE IF NOT EXISTS commission_summaries (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    user_id INT NOT NULL,
    
    -- Period
    period_type ENUM('weekly', 'biweekly', 'monthly', 'quarterly', 'yearly') NOT NULL,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    
    -- Totals
    total_base_amount DECIMAL(12,2) DEFAULT 0,
    total_commission DECIMAL(12,2) DEFAULT 0,
    transactions_count INT DEFAULT 0,
    
    -- Status
    status ENUM('calculated', 'approved', 'paid') DEFAULT 'calculated',
    
    calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE KEY uk_user_period (user_id, period_type, period_start),
    INDEX idx_commission_summaries (workspace_id, period_start DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default expense categories
INSERT INTO expense_categories (workspace_id, name, requires_receipt, sort_order) VALUES
(1, 'Travel', 1, 1),
(1, 'Meals & Entertainment', 1, 2),
(1, 'Office Supplies', 1, 3),
(1, 'Equipment', 1, 4),
(1, 'Software & Subscriptions', 1, 5),
(1, 'Mileage', 0, 6),
(1, 'Professional Development', 1, 7),
(1, 'Other', 1, 99)
ON DUPLICATE KEY UPDATE name = VALUES(name);
