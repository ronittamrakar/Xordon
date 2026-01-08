-- FSM (Field Service Management) Database Schema
-- Database: xordon (merged - previously xordon_fsm)
-- All tables prefixed with fsm_ for clarity

-- ============================================
-- FSM Services (service catalog)
-- ============================================
CREATE TABLE IF NOT EXISTS fsm_services (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    user_id INT NOT NULL,
    category_id INT DEFAULT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) DEFAULT 0.00,
    duration_minutes INT DEFAULT 60,
    is_active TINYINT(1) DEFAULT 1,
    sort_order INT DEFAULT 0,
    metadata JSON,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_fsm_services_workspace (workspace_id),
    INDEX idx_fsm_services_workspace_active (workspace_id, is_active),
    INDEX idx_fsm_services_category (category_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- FSM Service Categories
-- ============================================
CREATE TABLE IF NOT EXISTS fsm_service_categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    user_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    color VARCHAR(20) DEFAULT '#3B82F6',
    sort_order INT DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_fsm_service_categories_workspace (workspace_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- FSM Staff Members
-- ============================================
CREATE TABLE IF NOT EXISTS fsm_staff (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    user_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    role VARCHAR(100) DEFAULT 'technician',
    avatar_url VARCHAR(500),
    color VARCHAR(20) DEFAULT '#3B82F6',
    hourly_rate DECIMAL(10,2) DEFAULT NULL,
    is_active TINYINT(1) DEFAULT 1,
    skills JSON,
    availability JSON,
    metadata JSON,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_fsm_staff_workspace (workspace_id),
    INDEX idx_fsm_staff_workspace_active (workspace_id, is_active),
    INDEX idx_fsm_staff_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- FSM Jobs (core dispatch/work orders)
-- ============================================
CREATE TABLE IF NOT EXISTS fsm_jobs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    user_id INT NOT NULL,
    contact_id INT DEFAULT NULL COMMENT 'References contacts in main DB',
    company_id INT DEFAULT NULL COMMENT 'References companies in main DB',
    service_id INT DEFAULT NULL,
    assigned_to INT DEFAULT NULL COMMENT 'References fsm_staff.id',
    campaign_id INT DEFAULT NULL COMMENT 'References campaigns in main DB for attribution',
    
    job_number VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status ENUM('new', 'scheduled', 'dispatched', 'en_route', 'arrived', 'in_progress', 'completed', 'cancelled', 'on_hold') DEFAULT 'new',
    priority ENUM('low', 'normal', 'high', 'emergency') DEFAULT 'normal',
    job_type VARCHAR(100),
    source VARCHAR(100),
    
    -- Location
    service_address VARCHAR(500),
    service_city VARCHAR(100),
    service_state VARCHAR(50),
    service_zip VARCHAR(20),
    service_lat DECIMAL(10,8),
    service_lng DECIMAL(11,8),
    
    -- Scheduling
    scheduled_date DATE,
    scheduled_time_start TIME,
    scheduled_time_end TIME,
    actual_start_time DATETIME,
    actual_end_time DATETIME,
    estimated_duration INT DEFAULT 60 COMMENT 'minutes',
    
    -- For towing/transport jobs
    pickup_address VARCHAR(500),
    pickup_lat DECIMAL(10,8),
    pickup_lng DECIMAL(11,8),
    dropoff_address VARCHAR(500),
    dropoff_lat DECIMAL(10,8),
    dropoff_lng DECIMAL(11,8),
    vehicle_info JSON,
    
    -- Financials
    estimated_cost DECIMAL(10,2) DEFAULT 0.00,
    actual_cost DECIMAL(10,2) DEFAULT NULL,
    deposit_paid DECIMAL(10,2) DEFAULT 0.00,
    payment_status ENUM('pending', 'partial', 'paid', 'refunded') DEFAULT 'pending',
    
    -- Notes
    internal_notes TEXT,
    customer_notes TEXT,
    
    -- Attachments
    photos JSON,
    documents JSON,
    
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_fsm_jobs_workspace (workspace_id),
    INDEX idx_fsm_jobs_workspace_status (workspace_id, status),
    INDEX idx_fsm_jobs_workspace_date (workspace_id, scheduled_date),
    INDEX idx_fsm_jobs_contact (contact_id),
    INDEX idx_fsm_jobs_assigned (assigned_to),
    INDEX idx_fsm_jobs_number (job_number),
    INDEX idx_fsm_jobs_company (company_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- FSM Job Line Items
-- ============================================
CREATE TABLE IF NOT EXISTS fsm_job_line_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    job_id INT NOT NULL,
    service_id INT DEFAULT NULL,
    description VARCHAR(500) NOT NULL,
    quantity DECIMAL(10,2) DEFAULT 1.00,
    unit_price DECIMAL(10,2) DEFAULT 0.00,
    total DECIMAL(10,2) DEFAULT 0.00,
    item_type ENUM('service', 'part', 'labor', 'fee', 'discount') DEFAULT 'service',
    sort_order INT DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_fsm_job_line_items_job (job_id),
    FOREIGN KEY (job_id) REFERENCES fsm_jobs(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- FSM Job Status History
-- ============================================
CREATE TABLE IF NOT EXISTS fsm_job_status_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    job_id INT NOT NULL,
    status VARCHAR(50) NOT NULL,
    notes TEXT,
    location_lat DECIMAL(10,8),
    location_lng DECIMAL(11,8),
    changed_by INT DEFAULT NULL COMMENT 'user_id or staff_id who made the change',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_fsm_job_status_history_job (job_id),
    FOREIGN KEY (job_id) REFERENCES fsm_jobs(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- FSM Estimates / Quotes
-- ============================================
CREATE TABLE IF NOT EXISTS fsm_estimates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    user_id INT NOT NULL,
    contact_id INT DEFAULT NULL COMMENT 'References contacts in main DB',
    company_id INT DEFAULT NULL COMMENT 'References companies in main DB',
    job_id INT DEFAULT NULL COMMENT 'References fsm_jobs.id if linked',
    
    estimate_number VARCHAR(50) NOT NULL,
    title VARCHAR(255),
    description TEXT,
    status ENUM('draft', 'sent', 'viewed', 'accepted', 'declined', 'expired', 'converted') DEFAULT 'draft',
    
    -- Financials
    subtotal DECIMAL(10,2) DEFAULT 0.00,
    tax_rate DECIMAL(5,2) DEFAULT 0.00,
    tax_amount DECIMAL(10,2) DEFAULT 0.00,
    discount_amount DECIMAL(10,2) DEFAULT 0.00,
    total DECIMAL(10,2) DEFAULT 0.00,
    
    -- Validity
    valid_until DATE,
    
    -- Terms
    terms TEXT,
    notes TEXT,
    
    -- Tracking
    sent_at DATETIME,
    viewed_at DATETIME,
    accepted_at DATETIME,
    signature_url VARCHAR(500),
    
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_fsm_estimates_workspace (workspace_id),
    INDEX idx_fsm_estimates_workspace_status (workspace_id, status),
    INDEX idx_fsm_estimates_contact (contact_id),
    INDEX idx_fsm_estimates_number (estimate_number),
    INDEX idx_fsm_estimates_job (job_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- FSM Estimate Line Items
-- ============================================
CREATE TABLE IF NOT EXISTS fsm_estimate_line_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    estimate_id INT NOT NULL,
    service_id INT DEFAULT NULL,
    description VARCHAR(500) NOT NULL,
    quantity DECIMAL(10,2) DEFAULT 1.00,
    unit_price DECIMAL(10,2) DEFAULT 0.00,
    total DECIMAL(10,2) DEFAULT 0.00,
    item_type ENUM('service', 'part', 'labor', 'fee', 'discount') DEFAULT 'service',
    sort_order INT DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_fsm_estimate_line_items_estimate (estimate_id),
    FOREIGN KEY (estimate_id) REFERENCES fsm_estimates(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- FSM Appointments / Bookings
-- ============================================
CREATE TABLE IF NOT EXISTS fsm_appointments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    user_id INT NOT NULL,
    contact_id INT DEFAULT NULL COMMENT 'References contacts in main DB',
    staff_id INT DEFAULT NULL COMMENT 'References fsm_staff.id',
    service_id INT DEFAULT NULL COMMENT 'References fsm_services.id',
    job_id INT DEFAULT NULL COMMENT 'References fsm_jobs.id if linked',
    booking_type_id INT DEFAULT NULL,
    
    title VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Guest info (for walk-ins or non-contact bookings)
    guest_name VARCHAR(255),
    guest_email VARCHAR(255),
    guest_phone VARCHAR(50),
    
    -- Scheduling
    scheduled_at DATETIME NOT NULL,
    duration_minutes INT DEFAULT 30,
    end_at DATETIME,
    timezone VARCHAR(50) DEFAULT 'America/New_York',
    
    -- Location
    location_type ENUM('in_person', 'video', 'phone') DEFAULT 'in_person',
    location VARCHAR(500),
    meeting_link VARCHAR(500),
    
    -- Status
    status ENUM('scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show', 'rescheduled') DEFAULT 'scheduled',
    
    -- Notes
    notes TEXT,
    internal_notes TEXT,
    
    -- Reminders
    reminder_sent_at DATETIME,
    confirmation_sent_at DATETIME,
    
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_fsm_appointments_workspace (workspace_id),
    INDEX idx_fsm_appointments_workspace_date (workspace_id, scheduled_at),
    INDEX idx_fsm_appointments_contact (contact_id),
    INDEX idx_fsm_appointments_staff (staff_id),
    INDEX idx_fsm_appointments_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- FSM Booking Types (appointment types)
-- ============================================
CREATE TABLE IF NOT EXISTS fsm_booking_types (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    user_id INT NOT NULL,
    service_id INT DEFAULT NULL,
    
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255),
    description TEXT,
    duration_minutes INT DEFAULT 30,
    buffer_before INT DEFAULT 0,
    buffer_after INT DEFAULT 15,
    
    location_type ENUM('in_person', 'video', 'phone') DEFAULT 'video',
    location_details VARCHAR(500),
    
    price DECIMAL(10,2) DEFAULT 0.00,
    currency VARCHAR(10) DEFAULT 'USD',
    requires_payment TINYINT(1) DEFAULT 0,
    require_deposit TINYINT(1) DEFAULT 0,
    deposit_amount DECIMAL(10,2) DEFAULT NULL,
    
    color VARCHAR(20) DEFAULT '#3B82F6',
    is_active TINYINT(1) DEFAULT 1,
    
    max_bookings_per_day INT DEFAULT NULL,
    min_notice_hours INT DEFAULT 24,
    max_future_days INT DEFAULT 60,
    
    allow_staff_selection TINYINT(1) DEFAULT 0,
    assigned_staff_ids JSON,
    intake_form_id INT DEFAULT NULL,
    
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_fsm_booking_types_workspace (workspace_id),
    INDEX idx_fsm_booking_types_active (workspace_id, is_active),
    INDEX idx_fsm_booking_types_slug (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- FSM Referral Programs
-- ============================================
CREATE TABLE IF NOT EXISTS fsm_referral_programs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    user_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    reward_type ENUM('fixed', 'percentage', 'credit') DEFAULT 'fixed',
    reward_value DECIMAL(10,2) DEFAULT 0.00,
    is_active TINYINT(1) DEFAULT 1,
    terms TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_fsm_referral_programs_workspace (workspace_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- FSM Referrals
-- ============================================
CREATE TABLE IF NOT EXISTS fsm_referrals (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    user_id INT NOT NULL,
    program_id INT DEFAULT NULL,
    referrer_contact_id INT DEFAULT NULL COMMENT 'References contacts in main DB',
    referred_contact_id INT DEFAULT NULL COMMENT 'References contacts in main DB',
    job_id INT DEFAULT NULL,
    status ENUM('pending', 'qualified', 'converted', 'paid', 'expired') DEFAULT 'pending',
    reward_amount DECIMAL(10,2) DEFAULT 0.00,
    reward_paid_at DATETIME,
    notes TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_fsm_referrals_workspace (workspace_id),
    INDEX idx_fsm_referrals_referrer (referrer_contact_id),
    INDEX idx_fsm_referrals_referred (referred_contact_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- FSM Recall Schedules (service reminders)
-- ============================================
CREATE TABLE IF NOT EXISTS fsm_recall_schedules (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    user_id INT NOT NULL,
    service_id INT DEFAULT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    interval_days INT DEFAULT 365,
    reminder_days_before INT DEFAULT 30,
    is_active TINYINT(1) DEFAULT 1,
    email_template_id INT DEFAULT NULL,
    sms_template_id INT DEFAULT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_fsm_recall_schedules_workspace (workspace_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- FSM Contact Recalls (individual recall records)
-- ============================================
CREATE TABLE IF NOT EXISTS fsm_contact_recalls (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    schedule_id INT NOT NULL,
    contact_id INT NOT NULL COMMENT 'References contacts in main DB',
    job_id INT DEFAULT NULL,
    last_service_date DATE,
    next_recall_date DATE,
    status ENUM('pending', 'notified', 'scheduled', 'completed', 'skipped') DEFAULT 'pending',
    notified_at DATETIME,
    notes TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_fsm_contact_recalls_workspace (workspace_id),
    INDEX idx_fsm_contact_recalls_contact (contact_id),
    INDEX idx_fsm_contact_recalls_next_date (next_recall_date),
    FOREIGN KEY (schedule_id) REFERENCES fsm_recall_schedules(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- FSM Intake Form Templates
-- ============================================
CREATE TABLE IF NOT EXISTS fsm_intake_templates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    user_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    fields JSON NOT NULL,
    is_active TINYINT(1) DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_fsm_intake_templates_workspace (workspace_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- FSM Intake Submissions
-- ============================================
CREATE TABLE IF NOT EXISTS fsm_intake_submissions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    template_id INT NOT NULL,
    contact_id INT DEFAULT NULL COMMENT 'References contacts in main DB',
    job_id INT DEFAULT NULL,
    appointment_id INT DEFAULT NULL,
    response_data JSON NOT NULL,
    submitted_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(50),
    user_agent TEXT,
    INDEX idx_fsm_intake_submissions_workspace (workspace_id),
    INDEX idx_fsm_intake_submissions_template (template_id),
    INDEX idx_fsm_intake_submissions_contact (contact_id),
    FOREIGN KEY (template_id) REFERENCES fsm_intake_templates(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- FSM Playbooks (sales/service scripts)
-- ============================================
CREATE TABLE IF NOT EXISTS fsm_playbooks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    user_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    content JSON NOT NULL COMMENT 'Steps, scripts, checklists',
    is_active TINYINT(1) DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_fsm_playbooks_workspace (workspace_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- FSM Industry Settings (per-workspace config)
-- ============================================
CREATE TABLE IF NOT EXISTS fsm_industry_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    user_id INT NOT NULL,
    industry_type VARCHAR(100),
    settings JSON,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uniq_fsm_industry_workspace (workspace_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- FSM Availability Schedules
-- ============================================
CREATE TABLE IF NOT EXISTS fsm_availability_schedules (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    user_id INT NOT NULL,
    staff_id INT DEFAULT NULL,
    name VARCHAR(255) NOT NULL,
    timezone VARCHAR(50) DEFAULT 'America/New_York',
    is_default TINYINT(1) DEFAULT 0,
    slots JSON NOT NULL COMMENT 'Array of day/time slots',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_fsm_availability_workspace (workspace_id),
    INDEX idx_fsm_availability_staff (staff_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- FSM Booking Page Settings
-- ============================================
CREATE TABLE IF NOT EXISTS fsm_booking_page_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    user_id INT NOT NULL,
    page_slug VARCHAR(100),
    page_title VARCHAR(255),
    welcome_message TEXT,
    logo_url VARCHAR(500),
    brand_color VARCHAR(20) DEFAULT '#3B82F6',
    show_branding TINYINT(1) DEFAULT 1,
    require_phone TINYINT(1) DEFAULT 0,
    custom_questions JSON,
    confirmation_message TEXT,
    redirect_url VARCHAR(500),
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uniq_fsm_booking_page_workspace (workspace_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
