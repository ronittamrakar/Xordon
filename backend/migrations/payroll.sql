-- Payroll Management System
-- Comprehensive payroll processing, pay periods, deductions, and payments

-- Pay periods
CREATE TABLE IF NOT EXISTS pay_periods (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    
    -- Period details
    period_type ENUM('weekly', 'bi-weekly', 'semi-monthly', 'monthly') NOT NULL,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    pay_date DATE NOT NULL,
    
    -- Status
    status ENUM('draft', 'processing', 'approved', 'paid', 'cancelled') DEFAULT 'draft',
    
    -- Totals
    total_gross_pay DECIMAL(12,2) DEFAULT 0,
    total_deductions DECIMAL(12,2) DEFAULT 0,
    total_net_pay DECIMAL(12,2) DEFAULT 0,
    total_employer_taxes DECIMAL(12,2) DEFAULT 0,
    
    -- Processing
    processed_by INT NULL,
    processed_at TIMESTAMP NULL,
    approved_by INT NULL,
    approved_at TIMESTAMP NULL,
    
    -- Notes
    notes TEXT NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE KEY uk_workspace_period (workspace_id, period_start, period_end),
    INDEX idx_pay_periods_workspace (workspace_id, period_start DESC),
    INDEX idx_pay_periods_status (workspace_id, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Employee payroll records
CREATE TABLE IF NOT EXISTS payroll_records (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    pay_period_id INT NOT NULL,
    user_id INT NOT NULL,
    
    -- Hours
    regular_hours DECIMAL(10,2) DEFAULT 0,
    overtime_hours DECIMAL(10,2) DEFAULT 0,
    double_time_hours DECIMAL(10,2) DEFAULT 0,
    pto_hours DECIMAL(10,2) DEFAULT 0,
    sick_hours DECIMAL(10,2) DEFAULT 0,
    holiday_hours DECIMAL(10,2) DEFAULT 0,
    
    -- Rates
    regular_rate DECIMAL(10,2) NOT NULL,
    overtime_rate DECIMAL(10,2) NULL,
    double_time_rate DECIMAL(10,2) NULL,
    
    -- Gross pay
    regular_pay DECIMAL(10,2) DEFAULT 0,
    overtime_pay DECIMAL(10,2) DEFAULT 0,
    double_time_pay DECIMAL(10,2) DEFAULT 0,
    pto_pay DECIMAL(10,2) DEFAULT 0,
    sick_pay DECIMAL(10,2) DEFAULT 0,
    holiday_pay DECIMAL(10,2) DEFAULT 0,
    bonus DECIMAL(10,2) DEFAULT 0,
    commission DECIMAL(10,2) DEFAULT 0,
    reimbursements DECIMAL(10,2) DEFAULT 0,
    gross_pay DECIMAL(10,2) DEFAULT 0,
    
    -- Deductions
    federal_tax DECIMAL(10,2) DEFAULT 0,
    state_tax DECIMAL(10,2) DEFAULT 0,
    social_security DECIMAL(10,2) DEFAULT 0,
    medicare DECIMAL(10,2) DEFAULT 0,
    health_insurance DECIMAL(10,2) DEFAULT 0,
    dental_insurance DECIMAL(10,2) DEFAULT 0,
    vision_insurance DECIMAL(10,2) DEFAULT 0,
    retirement_401k DECIMAL(10,2) DEFAULT 0,
    other_deductions DECIMAL(10,2) DEFAULT 0,
    total_deductions DECIMAL(10,2) DEFAULT 0,
    
    -- Net pay
    net_pay DECIMAL(10,2) DEFAULT 0,
    
    -- Employer taxes
    employer_social_security DECIMAL(10,2) DEFAULT 0,
    employer_medicare DECIMAL(10,2) DEFAULT 0,
    employer_unemployment DECIMAL(10,2) DEFAULT 0,
    employer_workers_comp DECIMAL(10,2) DEFAULT 0,
    total_employer_taxes DECIMAL(10,2) DEFAULT 0,
    
    -- Payment
    payment_method ENUM('direct_deposit', 'check', 'cash', 'paycard') DEFAULT 'direct_deposit',
    payment_status ENUM('pending', 'processing', 'paid', 'failed', 'cancelled') DEFAULT 'pending',
    payment_date DATE NULL,
    payment_reference VARCHAR(255) NULL,
    
    -- Notes
    notes TEXT NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE KEY uk_period_user (pay_period_id, user_id),
    INDEX idx_payroll_records_workspace (workspace_id, user_id),
    INDEX idx_payroll_records_status (workspace_id, payment_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Employee compensation settings
CREATE TABLE IF NOT EXISTS employee_compensation (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    user_id INT NOT NULL,
    
    -- Employment type
    employment_type ENUM('full-time', 'part-time', 'contractor', 'intern') DEFAULT 'full-time',
    pay_type ENUM('hourly', 'salary', 'commission') DEFAULT 'hourly',
    
    -- Pay rates
    hourly_rate DECIMAL(10,2) NULL,
    salary_amount DECIMAL(12,2) NULL,
    pay_frequency ENUM('weekly', 'bi-weekly', 'semi-monthly', 'monthly') NULL,
    
    -- Overtime
    overtime_eligible TINYINT(1) DEFAULT 1,
    overtime_rate_multiplier DECIMAL(4,2) DEFAULT 1.5,
    double_time_rate_multiplier DECIMAL(4,2) DEFAULT 2.0,
    
    -- Benefits
    health_insurance_deduction DECIMAL(10,2) DEFAULT 0,
    dental_insurance_deduction DECIMAL(10,2) DEFAULT 0,
    vision_insurance_deduction DECIMAL(10,2) DEFAULT 0,
    retirement_401k_percent DECIMAL(5,2) DEFAULT 0,
    retirement_401k_employer_match DECIMAL(5,2) DEFAULT 0,
    
    -- Tax info
    federal_withholding_allowances INT DEFAULT 0,
    state_withholding_allowances INT DEFAULT 0,
    additional_withholding DECIMAL(10,2) DEFAULT 0,
    tax_filing_status ENUM('single', 'married', 'head_of_household') DEFAULT 'single',
    
    -- Payment method
    payment_method ENUM('direct_deposit', 'check', 'cash', 'paycard') DEFAULT 'direct_deposit',
    bank_name VARCHAR(255) NULL,
    account_type ENUM('checking', 'savings') NULL,
    routing_number VARCHAR(20) NULL,
    account_number_last4 VARCHAR(4) NULL,
    
    -- Effective dates
    effective_date DATE NOT NULL,
    end_date DATE NULL,
    
    -- Status
    is_active TINYINT(1) DEFAULT 1,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_employee_compensation_workspace (workspace_id, user_id),
    INDEX idx_employee_compensation_active (workspace_id, is_active, effective_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Payroll deductions (custom deductions)
CREATE TABLE IF NOT EXISTS payroll_deductions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    user_id INT NOT NULL,
    
    -- Deduction details
    deduction_name VARCHAR(255) NOT NULL,
    deduction_type ENUM('pre-tax', 'post-tax', 'employer-paid') DEFAULT 'post-tax',
    calculation_type ENUM('fixed', 'percentage') DEFAULT 'fixed',
    
    -- Amount
    fixed_amount DECIMAL(10,2) NULL,
    percentage DECIMAL(5,2) NULL,
    
    -- Frequency
    frequency ENUM('per-paycheck', 'monthly', 'quarterly', 'annual', 'one-time') DEFAULT 'per-paycheck',
    
    -- Limits
    annual_limit DECIMAL(10,2) NULL,
    ytd_amount DECIMAL(10,2) DEFAULT 0,
    
    -- Status
    is_active TINYINT(1) DEFAULT 1,
    start_date DATE NOT NULL,
    end_date DATE NULL,
    
    -- Notes
    notes TEXT NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_payroll_deductions_workspace (workspace_id, user_id),
    INDEX idx_payroll_deductions_active (workspace_id, is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Payroll adjustments (bonuses, reimbursements, etc.)
CREATE TABLE IF NOT EXISTS payroll_adjustments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    user_id INT NOT NULL,
    pay_period_id INT NULL,
    
    -- Adjustment details
    adjustment_type ENUM('bonus', 'commission', 'reimbursement', 'correction', 'other') NOT NULL,
    description VARCHAR(255) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    
    -- Tax treatment
    is_taxable TINYINT(1) DEFAULT 1,
    
    -- Status
    status ENUM('pending', 'approved', 'paid', 'cancelled') DEFAULT 'pending',
    approved_by INT NULL,
    approved_at TIMESTAMP NULL,
    
    -- Notes
    notes TEXT NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_payroll_adjustments_workspace (workspace_id, user_id),
    INDEX idx_payroll_adjustments_period (pay_period_id),
    INDEX idx_payroll_adjustments_status (workspace_id, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Payroll tax rates (for calculation)
CREATE TABLE IF NOT EXISTS payroll_tax_rates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    
    -- Tax jurisdiction
    tax_type ENUM('federal', 'state', 'local', 'social_security', 'medicare', 'unemployment') NOT NULL,
    jurisdiction VARCHAR(100) NULL COMMENT 'State/city code',
    
    -- Rates
    employee_rate DECIMAL(6,4) NULL,
    employer_rate DECIMAL(6,4) NULL,
    
    -- Limits
    wage_base_limit DECIMAL(12,2) NULL COMMENT 'Max wages subject to tax',
    
    -- Effective dates
    effective_date DATE NOT NULL,
    end_date DATE NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_payroll_tax_rates_workspace (workspace_id, tax_type),
    INDEX idx_payroll_tax_rates_effective (workspace_id, effective_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Payroll history/audit log
CREATE TABLE IF NOT EXISTS payroll_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    payroll_record_id INT NOT NULL,
    
    -- Change details
    changed_by INT NOT NULL,
    change_type ENUM('created', 'updated', 'approved', 'paid', 'cancelled') NOT NULL,
    field_name VARCHAR(100) NULL,
    old_value TEXT NULL,
    new_value TEXT NULL,
    
    -- Notes
    notes TEXT NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_payroll_history_record (payroll_record_id),
    INDEX idx_payroll_history_workspace (workspace_id, created_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
