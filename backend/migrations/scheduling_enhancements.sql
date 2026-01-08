-- Phase 1: Scheduling Enhancements
-- Advanced booking features like Thryv

-- Service categories for organizing services
CREATE TABLE IF NOT EXISTS service_categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    
    name VARCHAR(100) NOT NULL,
    description TEXT NULL,
    color VARCHAR(7) DEFAULT '#6366f1',
    icon VARCHAR(50) NULL,
    sort_order INT DEFAULT 0,
    is_active TINYINT(1) DEFAULT 1,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE KEY uk_workspace_name (workspace_id, name),
    INDEX idx_categories_workspace (workspace_id, is_active, sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Enhanced services table (if not exists, add columns)
-- This extends the existing services concept
CREATE TABLE IF NOT EXISTS services (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    category_id INT NULL,
    
    name VARCHAR(100) NOT NULL,
    description TEXT NULL,
    
    -- Pricing
    price DECIMAL(10,2) NULL,
    price_type ENUM('fixed', 'hourly', 'starting_at', 'free', 'custom') DEFAULT 'fixed',
    currency VARCHAR(3) DEFAULT 'USD',
    
    -- Duration
    duration_minutes INT DEFAULT 60,
    buffer_before_minutes INT DEFAULT 0,
    buffer_after_minutes INT DEFAULT 0,
    
    -- Booking settings
    max_bookings_per_slot INT DEFAULT 1,
    requires_confirmation TINYINT(1) DEFAULT 0,
    allow_online_booking TINYINT(1) DEFAULT 1,
    
    -- Display
    color VARCHAR(7) DEFAULT '#6366f1',
    image_url VARCHAR(500) NULL,
    sort_order INT DEFAULT 0,
    is_active TINYINT(1) DEFAULT 1,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_services_workspace (workspace_id, is_active),
    INDEX idx_services_category (category_id),
    
    FOREIGN KEY (category_id) REFERENCES service_categories(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Staff/team members for scheduling
CREATE TABLE IF NOT EXISTS staff_members (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    user_id INT NULL COMMENT 'Link to users table if they have login',
    
    -- Basic info
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(255) NULL,
    phone VARCHAR(20) NULL,
    
    -- Display
    title VARCHAR(100) NULL COMMENT 'Job title',
    bio TEXT NULL,
    avatar_url VARCHAR(500) NULL,
    color VARCHAR(7) DEFAULT '#6366f1',
    
    -- Scheduling
    accepts_bookings TINYINT(1) DEFAULT 1,
    booking_page_url VARCHAR(100) NULL COMMENT 'Custom URL slug',
    
    -- Status
    is_active TINYINT(1) DEFAULT 1,
    sort_order INT DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_staff_workspace (workspace_id, is_active),
    INDEX idx_staff_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Staff availability (weekly schedule)
CREATE TABLE IF NOT EXISTS staff_availability (
    id INT AUTO_INCREMENT PRIMARY KEY,
    staff_id INT NOT NULL,
    
    day_of_week TINYINT NOT NULL COMMENT '0=Sunday, 6=Saturday',
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_available TINYINT(1) DEFAULT 1,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_availability_staff (staff_id, day_of_week),
    
    FOREIGN KEY (staff_id) REFERENCES staff_members(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Staff time off / blocked time
CREATE TABLE IF NOT EXISTS staff_time_off (
    id INT AUTO_INCREMENT PRIMARY KEY,
    staff_id INT NOT NULL,
    
    title VARCHAR(100) NULL,
    start_datetime DATETIME NOT NULL,
    end_datetime DATETIME NOT NULL,
    is_all_day TINYINT(1) DEFAULT 0,
    reason VARCHAR(255) NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_timeoff_staff (staff_id, start_datetime, end_datetime),
    
    FOREIGN KEY (staff_id) REFERENCES staff_members(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Staff-service assignments (which staff can perform which services)
CREATE TABLE IF NOT EXISTS staff_services (
    id INT AUTO_INCREMENT PRIMARY KEY,
    staff_id INT NOT NULL,
    service_id INT NOT NULL,
    
    -- Override service defaults for this staff
    custom_duration_minutes INT NULL,
    custom_price DECIMAL(10,2) NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE KEY uk_staff_service (staff_id, service_id),
    
    FOREIGN KEY (staff_id) REFERENCES staff_members(id) ON DELETE CASCADE,
    FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Enhanced appointments table (columns may already exist - ignore errors)
-- Note: Run these individually if needed, they may fail if columns exist

-- Appointment reminders configuration
CREATE TABLE IF NOT EXISTS appointment_reminders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    
    name VARCHAR(100) NOT NULL,
    trigger_type ENUM('before', 'after') DEFAULT 'before',
    trigger_minutes INT NOT NULL COMMENT 'Minutes before/after appointment',
    
    -- Channels
    send_email TINYINT(1) DEFAULT 1,
    send_sms TINYINT(1) DEFAULT 0,
    
    -- Templates
    email_subject VARCHAR(255) NULL,
    email_body TEXT NULL,
    sms_body VARCHAR(500) NULL,
    
    is_active TINYINT(1) DEFAULT 1,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_reminders_workspace (workspace_id, is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default reminders (skip if workspace 1 doesn't exist)
INSERT IGNORE INTO appointment_reminders (workspace_id, name, trigger_type, trigger_minutes, send_email, send_sms, email_subject, email_body, sms_body) 
SELECT 1, '24 Hour Reminder', 'before', 1440, 1, 1, 'Reminder: Your appointment tomorrow', 'Hi {{contact_name}},\n\nThis is a reminder about your appointment tomorrow:\n\n{{service_name}}\n{{appointment_date}} at {{appointment_time}}\n\nSee you then!', 'Reminder: Your appointment for {{service_name}} is tomorrow at {{appointment_time}}.'
FROM DUAL WHERE EXISTS (SELECT 1 FROM workspaces WHERE id = 1);

-- Booking page settings
CREATE TABLE IF NOT EXISTS booking_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    
    -- Page customization
    page_title VARCHAR(100) NULL,
    page_description TEXT NULL,
    logo_url VARCHAR(500) NULL,
    cover_image_url VARCHAR(500) NULL,
    primary_color VARCHAR(7) DEFAULT '#6366f1',
    
    -- Booking rules
    min_notice_hours INT DEFAULT 1 COMMENT 'Minimum hours before booking',
    max_advance_days INT DEFAULT 60 COMMENT 'How far in advance can book',
    slot_interval_minutes INT DEFAULT 30 COMMENT 'Time slot intervals',
    
    -- Cancellation policy
    allow_cancellation TINYINT(1) DEFAULT 1,
    cancellation_notice_hours INT DEFAULT 24,
    cancellation_policy TEXT NULL,
    
    -- Payment
    require_payment TINYINT(1) DEFAULT 0,
    require_deposit TINYINT(1) DEFAULT 0,
    deposit_percentage INT DEFAULT 50,
    
    -- Confirmation
    auto_confirm TINYINT(1) DEFAULT 1,
    confirmation_message TEXT NULL,
    
    -- SEO
    meta_title VARCHAR(100) NULL,
    meta_description VARCHAR(255) NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE KEY uk_workspace (workspace_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
