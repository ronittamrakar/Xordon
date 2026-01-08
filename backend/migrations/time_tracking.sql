-- Phase 4: Time Tracking & Workforce Management
-- Employee time tracking, timesheets, and attendance

-- Time entries
CREATE TABLE IF NOT EXISTS time_entries (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    user_id INT NOT NULL,
    
    -- What was worked on
    job_id INT NULL,
    project_id INT NULL,
    task_description VARCHAR(255) NULL,
    
    -- Time
    start_time DATETIME NOT NULL,
    end_time DATETIME NULL,
    duration_minutes INT NULL COMMENT 'Calculated or manual',
    
    -- Break time
    break_minutes INT DEFAULT 0,
    
    -- Billing
    is_billable TINYINT(1) DEFAULT 1,
    hourly_rate DECIMAL(10,2) NULL,
    total_amount DECIMAL(10,2) NULL,
    
    -- Status
    status ENUM('running', 'paused', 'completed', 'approved', 'rejected') DEFAULT 'running',
    
    -- Location (for field workers)
    start_latitude DECIMAL(10,8) NULL,
    start_longitude DECIMAL(11,8) NULL,
    end_latitude DECIMAL(10,8) NULL,
    end_longitude DECIMAL(11,8) NULL,
    
    -- Notes
    notes TEXT NULL,
    
    -- Approval
    approved_by INT NULL,
    approved_at TIMESTAMP NULL,
    rejection_reason TEXT NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_time_entries_workspace (workspace_id, user_id, start_time DESC),
    INDEX idx_time_entries_user (user_id, start_time DESC),
    INDEX idx_time_entries_job (job_id),
    INDEX idx_time_entries_status (workspace_id, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Timesheets (weekly/bi-weekly summaries)
CREATE TABLE IF NOT EXISTS timesheets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    user_id INT NOT NULL,
    
    -- Period
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    
    -- Totals
    total_hours DECIMAL(10,2) DEFAULT 0,
    regular_hours DECIMAL(10,2) DEFAULT 0,
    overtime_hours DECIMAL(10,2) DEFAULT 0,
    break_hours DECIMAL(10,2) DEFAULT 0,
    billable_hours DECIMAL(10,2) DEFAULT 0,
    
    -- Amounts
    total_amount DECIMAL(12,2) DEFAULT 0,
    
    -- Status
    status ENUM('draft', 'submitted', 'approved', 'rejected', 'paid') DEFAULT 'draft',
    submitted_at TIMESTAMP NULL,
    approved_by INT NULL,
    approved_at TIMESTAMP NULL,
    rejection_reason TEXT NULL,
    
    -- Notes
    employee_notes TEXT NULL,
    manager_notes TEXT NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE KEY uk_user_period (user_id, period_start),
    INDEX idx_timesheets_workspace (workspace_id, period_start DESC),
    INDEX idx_timesheets_status (workspace_id, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Clock in/out records
CREATE TABLE IF NOT EXISTS clock_records (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    user_id INT NOT NULL,
    
    -- Clock type
    clock_type ENUM('clock_in', 'clock_out', 'break_start', 'break_end') NOT NULL,
    clock_time DATETIME NOT NULL,
    
    -- Location
    latitude DECIMAL(10,8) NULL,
    longitude DECIMAL(11,8) NULL,
    location_name VARCHAR(255) NULL,
    
    -- Device info
    device_type VARCHAR(50) NULL,
    ip_address VARCHAR(45) NULL,
    
    -- Photo (for verification)
    photo_url VARCHAR(500) NULL,
    
    -- Notes
    notes TEXT NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_clock_records_user (user_id, clock_time DESC),
    INDEX idx_clock_records_workspace (workspace_id, clock_time DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- PTO/Leave requests
CREATE TABLE IF NOT EXISTS leave_requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    user_id INT NOT NULL,
    
    -- Leave type
    leave_type ENUM('vacation', 'sick', 'personal', 'bereavement', 'jury_duty', 'military', 'unpaid', 'other') NOT NULL,
    
    -- Dates
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_half_day TINYINT(1) DEFAULT 0,
    half_day_type ENUM('morning', 'afternoon') NULL,
    
    -- Hours
    total_hours DECIMAL(10,2) NOT NULL,
    
    -- Status
    status ENUM('pending', 'approved', 'rejected', 'cancelled') DEFAULT 'pending',
    
    -- Approval
    approved_by INT NULL,
    approved_at TIMESTAMP NULL,
    rejection_reason TEXT NULL,
    
    -- Notes
    reason TEXT NULL,
    manager_notes TEXT NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_leave_requests_user (user_id, start_date DESC),
    INDEX idx_leave_requests_workspace (workspace_id, status, start_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Leave balances
CREATE TABLE IF NOT EXISTS leave_balances (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    user_id INT NOT NULL,
    
    -- Year
    year INT NOT NULL,
    
    -- Balances by type (in hours)
    vacation_balance DECIMAL(10,2) DEFAULT 0,
    vacation_used DECIMAL(10,2) DEFAULT 0,
    vacation_accrued DECIMAL(10,2) DEFAULT 0,
    
    sick_balance DECIMAL(10,2) DEFAULT 0,
    sick_used DECIMAL(10,2) DEFAULT 0,
    sick_accrued DECIMAL(10,2) DEFAULT 0,
    
    personal_balance DECIMAL(10,2) DEFAULT 0,
    personal_used DECIMAL(10,2) DEFAULT 0,
    
    -- Carryover from previous year
    carryover_hours DECIMAL(10,2) DEFAULT 0,
    
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE KEY uk_user_year (user_id, year),
    INDEX idx_leave_balances_workspace (workspace_id, year)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Schedules/Shifts
CREATE TABLE IF NOT EXISTS work_schedules (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    user_id INT NOT NULL,
    
    -- Schedule date
    schedule_date DATE NOT NULL,
    
    -- Shift times
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    break_minutes INT DEFAULT 0,
    
    -- Location
    location_id INT NULL,
    location_name VARCHAR(255) NULL,
    
    -- Status
    status ENUM('scheduled', 'confirmed', 'completed', 'no_show', 'cancelled') DEFAULT 'scheduled',
    
    -- Notes
    notes TEXT NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE KEY uk_user_date (user_id, schedule_date),
    INDEX idx_schedules_workspace (workspace_id, schedule_date),
    INDEX idx_schedules_user (user_id, schedule_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
