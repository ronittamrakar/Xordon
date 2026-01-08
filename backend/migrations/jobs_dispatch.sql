-- Phase 2: Jobs & Dispatch (Field Service Management)
-- Job scheduling, dispatch, and field service features

-- Job types/categories
CREATE TABLE IF NOT EXISTS job_types (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    
    name VARCHAR(100) NOT NULL,
    description TEXT NULL,
    color VARCHAR(7) DEFAULT '#6366f1',
    
    -- Default settings
    default_duration_minutes INT DEFAULT 60,
    default_price DECIMAL(10,2) NULL,
    requires_signature TINYINT(1) DEFAULT 0,
    requires_photos TINYINT(1) DEFAULT 0,
    
    -- Checklist template
    checklist_template JSON NULL,
    
    is_active TINYINT(1) DEFAULT 1,
    sort_order INT DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE KEY uk_workspace_name (workspace_id, name),
    INDEX idx_job_types_workspace (workspace_id, is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Jobs
CREATE TABLE IF NOT EXISTS jobs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    company_id INT NULL,
    contact_id INT NULL,
    
    -- Job details
    job_number VARCHAR(50) NOT NULL,
    job_type_id INT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NULL,
    
    -- Location
    location_type ENUM('customer', 'business', 'remote', 'other') DEFAULT 'customer',
    address_line1 VARCHAR(255) NULL,
    address_line2 VARCHAR(255) NULL,
    city VARCHAR(100) NULL,
    state VARCHAR(50) NULL,
    postal_code VARCHAR(20) NULL,
    country VARCHAR(50) DEFAULT 'US',
    latitude DECIMAL(10,8) NULL,
    longitude DECIMAL(11,8) NULL,
    location_notes TEXT NULL,
    
    -- Scheduling
    scheduled_start DATETIME NULL,
    scheduled_end DATETIME NULL,
    actual_start DATETIME NULL,
    actual_end DATETIME NULL,
    duration_minutes INT NULL,
    
    -- Assignment
    assigned_to INT NULL COMMENT 'Primary technician',
    team_members JSON NULL COMMENT 'Additional team member IDs',
    
    -- Status
    status ENUM('pending', 'scheduled', 'dispatched', 'en_route', 'arrived', 'in_progress', 'completed', 'cancelled', 'on_hold') DEFAULT 'pending',
    priority ENUM('low', 'normal', 'high', 'urgent') DEFAULT 'normal',
    
    -- Pricing
    estimated_amount DECIMAL(12,2) NULL,
    actual_amount DECIMAL(12,2) NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    
    -- Related records
    estimate_id INT NULL,
    invoice_id INT NULL,
    opportunity_id INT NULL,
    
    -- Completion
    completion_notes TEXT NULL,
    customer_signature_url VARCHAR(500) NULL,
    signed_by VARCHAR(255) NULL,
    signed_at TIMESTAMP NULL,
    
    -- Recurring
    is_recurring TINYINT(1) DEFAULT 0,
    recurring_schedule_id INT NULL,
    
    created_by INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE KEY uk_workspace_number (workspace_id, job_number),
    INDEX idx_jobs_workspace (workspace_id, status, scheduled_start),
    INDEX idx_jobs_contact (contact_id),
    INDEX idx_jobs_company (company_id),
    INDEX idx_jobs_assigned (assigned_to, scheduled_start),
    INDEX idx_jobs_type (job_type_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Job line items (services/products used)
CREATE TABLE IF NOT EXISTS job_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    job_id INT NOT NULL,
    
    -- Item details
    product_id INT NULL,
    service_id INT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT NULL,
    
    -- Pricing
    quantity DECIMAL(10,2) DEFAULT 1,
    unit_price DECIMAL(12,2) NOT NULL,
    discount_amount DECIMAL(12,2) DEFAULT 0,
    tax_amount DECIMAL(12,2) DEFAULT 0,
    total DECIMAL(12,2) NOT NULL,
    
    -- Status
    is_completed TINYINT(1) DEFAULT 0,
    completed_at TIMESTAMP NULL,
    completed_by INT NULL,
    
    sort_order INT DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_job_items (job_id, sort_order),
    
    FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Job checklist items
CREATE TABLE IF NOT EXISTS job_checklist (
    id INT AUTO_INCREMENT PRIMARY KEY,
    job_id INT NOT NULL,
    
    title VARCHAR(255) NOT NULL,
    description TEXT NULL,
    is_required TINYINT(1) DEFAULT 0,
    
    -- Completion
    is_completed TINYINT(1) DEFAULT 0,
    completed_at TIMESTAMP NULL,
    completed_by INT NULL,
    notes TEXT NULL,
    
    sort_order INT DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_job_checklist (job_id, sort_order),
    
    FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Job photos
CREATE TABLE IF NOT EXISTS job_photos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    job_id INT NOT NULL,
    file_id INT NULL COMMENT 'Link to files table',
    
    photo_type ENUM('before', 'during', 'after', 'issue', 'other') DEFAULT 'other',
    caption VARCHAR(255) NULL,
    url VARCHAR(500) NOT NULL,
    thumbnail_url VARCHAR(500) NULL,
    
    taken_at TIMESTAMP NULL,
    taken_by INT NULL,
    latitude DECIMAL(10,8) NULL,
    longitude DECIMAL(11,8) NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_job_photos (job_id, photo_type),
    
    FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Job notes/comments
CREATE TABLE IF NOT EXISTS job_notes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    job_id INT NOT NULL,
    user_id INT NULL,
    
    content TEXT NOT NULL,
    is_internal TINYINT(1) DEFAULT 1 COMMENT 'Internal vs visible to customer',
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_job_notes (job_id, created_at DESC),
    
    FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Job status history
CREATE TABLE IF NOT EXISTS job_status_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    job_id INT NOT NULL,
    
    old_status VARCHAR(50) NULL,
    new_status VARCHAR(50) NOT NULL,
    changed_by INT NULL,
    notes TEXT NULL,
    
    -- Location at time of status change
    latitude DECIMAL(10,8) NULL,
    longitude DECIMAL(11,8) NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_job_status_history (job_id, created_at),
    
    FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Recurring job schedules
CREATE TABLE IF NOT EXISTS recurring_job_schedules (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    contact_id INT NULL,
    company_id INT NULL,
    
    -- Template
    job_type_id INT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NULL,
    
    -- Location
    address_line1 VARCHAR(255) NULL,
    address_line2 VARCHAR(255) NULL,
    city VARCHAR(100) NULL,
    state VARCHAR(50) NULL,
    postal_code VARCHAR(20) NULL,
    
    -- Schedule
    frequency ENUM('daily', 'weekly', 'biweekly', 'monthly', 'quarterly', 'yearly') DEFAULT 'monthly',
    day_of_week INT NULL,
    day_of_month INT NULL,
    preferred_time TIME NULL,
    duration_minutes INT DEFAULT 60,
    
    -- Assignment
    assigned_to INT NULL,
    
    -- Pricing
    estimated_amount DECIMAL(12,2) NULL,
    
    -- Status
    is_active TINYINT(1) DEFAULT 1,
    next_job_date DATE NULL,
    last_job_date DATE NULL,
    jobs_created INT DEFAULT 0,
    end_date DATE NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_recurring_jobs_workspace (workspace_id, is_active),
    INDEX idx_recurring_jobs_next (next_job_date, is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dispatch routes (for route optimization)
CREATE TABLE IF NOT EXISTS dispatch_routes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    
    route_date DATE NOT NULL,
    staff_id INT NOT NULL,
    
    -- Route details
    name VARCHAR(100) NULL,
    start_location VARCHAR(500) NULL,
    end_location VARCHAR(500) NULL,
    
    -- Optimization
    total_distance_miles DECIMAL(10,2) NULL,
    total_duration_minutes INT NULL,
    optimized_at TIMESTAMP NULL,
    
    -- Status
    status ENUM('planned', 'in_progress', 'completed') DEFAULT 'planned',
    started_at TIMESTAMP NULL,
    completed_at TIMESTAMP NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE KEY uk_workspace_date_staff (workspace_id, route_date, staff_id),
    INDEX idx_routes_workspace (workspace_id, route_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Route stops (jobs in a route)
CREATE TABLE IF NOT EXISTS dispatch_route_stops (
    id INT AUTO_INCREMENT PRIMARY KEY,
    route_id INT NOT NULL,
    job_id INT NOT NULL,
    
    stop_order INT NOT NULL,
    
    -- Estimated times
    estimated_arrival DATETIME NULL,
    estimated_departure DATETIME NULL,
    
    -- Actual times
    actual_arrival DATETIME NULL,
    actual_departure DATETIME NULL,
    
    -- Distance from previous stop
    distance_miles DECIMAL(10,2) NULL,
    duration_minutes INT NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_route_stops (route_id, stop_order),
    
    FOREIGN KEY (route_id) REFERENCES dispatch_routes(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
