-- Shift Scheduling Tables

-- Shift Types
CREATE TABLE IF NOT EXISTS shift_types (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    color VARCHAR(7) DEFAULT '#3B82F6',
    default_start_time TIME,
    default_end_time TIME,
    default_break_minutes INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_workspace (workspace_id),
    UNIQUE KEY unique_shift_type (workspace_id, name),
    FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Shifts
CREATE TABLE IF NOT EXISTS shifts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    user_id INT NOT NULL,
    shift_type_id INT,
    shift_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    break_duration_minutes INT DEFAULT 0,
    location VARCHAR(255),
    notes TEXT,
    status ENUM('scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show') DEFAULT 'scheduled',
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_workspace (workspace_id),
    INDEX idx_user (user_id),
    INDEX idx_date (shift_date),
    INDEX idx_status (status),
    INDEX idx_shift_type (shift_type_id),
    FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (shift_type_id) REFERENCES shift_types(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Shift Swap Requests
CREATE TABLE IF NOT EXISTS shift_swap_requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    original_shift_id INT NOT NULL,
    target_shift_id INT NOT NULL,
    reason TEXT,
    status ENUM('pending', 'approved', 'rejected', 'cancelled') DEFAULT 'pending',
    responded_at DATETIME,
    responded_by INT,
    rejection_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_workspace (workspace_id),
    INDEX idx_original_shift (original_shift_id),
    INDEX idx_target_shift (target_shift_id),
    INDEX idx_status (status),
    FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
    FOREIGN KEY (original_shift_id) REFERENCES shifts(id) ON DELETE CASCADE,
    FOREIGN KEY (target_shift_id) REFERENCES shifts(id) ON DELETE CASCADE,
    FOREIGN KEY (responded_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Employee Availability
CREATE TABLE IF NOT EXISTS employee_availability (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    user_id INT NOT NULL,
    day_of_week TINYINT NOT NULL COMMENT '0=Sunday, 1=Monday, ..., 6=Saturday',
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_workspace (workspace_id),
    INDEX idx_user (user_id),
    INDEX idx_day (day_of_week),
    UNIQUE KEY unique_availability (workspace_id, user_id, day_of_week),
    FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Time Off Requests (if not already exists)
CREATE TABLE IF NOT EXISTS time_off_requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    user_id INT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    request_type ENUM('vacation', 'sick', 'personal', 'unpaid') DEFAULT 'vacation',
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    reason TEXT,
    approved_by INT,
    approved_at DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_workspace (workspace_id),
    INDEX idx_user (user_id),
    INDEX idx_status (status),
    INDEX idx_dates (start_date, end_date),
    FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
