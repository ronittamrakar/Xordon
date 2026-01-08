-- GHL-style Appointments/Calendar System
-- Booking types, availability, public booking pages

-- Booking types (appointment types like "30 min call", "1 hour consultation")
CREATE TABLE IF NOT EXISTS booking_types (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    company_id INT DEFAULT NULL,
    user_id INT DEFAULT NULL,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) NOT NULL,
    description TEXT DEFAULT NULL,
    duration_minutes INT DEFAULT 30,
    buffer_before_minutes INT DEFAULT 0,
    buffer_after_minutes INT DEFAULT 0,
    color VARCHAR(20) DEFAULT '#6366f1',
    location_type ENUM('in_person', 'phone', 'video', 'custom') DEFAULT 'video',
    location_details TEXT DEFAULT NULL,
    price DECIMAL(10, 2) DEFAULT 0.00,
    currency VARCHAR(3) DEFAULT 'USD',
    requires_payment BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    is_public BOOLEAN DEFAULT TRUE,
    max_bookings_per_day INT DEFAULT NULL,
    min_notice_hours INT DEFAULT 1,
    max_future_days INT DEFAULT 60,
    confirmation_message TEXT DEFAULT NULL,
    reminder_enabled BOOLEAN DEFAULT TRUE,
    reminder_hours_before INT DEFAULT 24,
    questions JSON DEFAULT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_booking_types_workspace (workspace_id),
    INDEX idx_booking_types_company (workspace_id, company_id),
    INDEX idx_booking_types_user (user_id),
    INDEX idx_booking_types_slug (workspace_id, slug),
    INDEX idx_booking_types_active (workspace_id, is_active, is_public),
    
    FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- User availability schedules
CREATE TABLE IF NOT EXISTS user_availability (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    user_id INT NOT NULL,
    day_of_week TINYINT NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_available BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_availability_user (user_id),
    INDEX idx_availability_day (user_id, day_of_week),
    
    FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Date-specific overrides (holidays, special hours)
CREATE TABLE IF NOT EXISTS availability_overrides (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    user_id INT NOT NULL,
    override_date DATE NOT NULL,
    is_available BOOLEAN DEFAULT FALSE,
    start_time TIME DEFAULT NULL,
    end_time TIME DEFAULT NULL,
    reason VARCHAR(255) DEFAULT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_overrides_user (user_id),
    INDEX idx_overrides_date (user_id, override_date),
    
    UNIQUE KEY unique_user_date (user_id, override_date),
    FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Appointments (booked meetings)
CREATE TABLE IF NOT EXISTS appointments_v2 (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    company_id INT DEFAULT NULL,
    booking_type_id INT NOT NULL,
    contact_id INT DEFAULT NULL,
    assigned_user_id INT DEFAULT NULL,
    title VARCHAR(255) NOT NULL,
    start_time DATETIME NOT NULL,
    end_time DATETIME NOT NULL,
    timezone VARCHAR(50) DEFAULT 'UTC',
    status ENUM('scheduled', 'confirmed', 'completed', 'cancelled', 'no_show') DEFAULT 'scheduled',
    location_type ENUM('in_person', 'phone', 'video', 'custom') DEFAULT 'video',
    location_details TEXT DEFAULT NULL,
    meeting_url VARCHAR(500) DEFAULT NULL,
    guest_name VARCHAR(255) DEFAULT NULL,
    guest_email VARCHAR(255) DEFAULT NULL,
    guest_phone VARCHAR(50) DEFAULT NULL,
    notes TEXT DEFAULT NULL,
    answers JSON DEFAULT NULL,
    cancellation_reason TEXT DEFAULT NULL,
    cancelled_at DATETIME DEFAULT NULL,
    cancelled_by ENUM('guest', 'host', 'system') DEFAULT NULL,
    reminder_sent_at DATETIME DEFAULT NULL,
    confirmation_sent_at DATETIME DEFAULT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_appointments_workspace (workspace_id),
    INDEX idx_appointments_company (workspace_id, company_id),
    INDEX idx_appointments_user (assigned_user_id),
    INDEX idx_appointments_contact (contact_id),
    INDEX idx_appointments_booking_type (booking_type_id),
    INDEX idx_appointments_start (workspace_id, start_time),
    INDEX idx_appointments_status (workspace_id, status),
    INDEX idx_appointments_upcoming (workspace_id, status, start_time),
    
    FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
    FOREIGN KEY (booking_type_id) REFERENCES booking_types(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Calendar sync tokens (for Google/Outlook calendar integration)
CREATE TABLE IF NOT EXISTS calendar_connections (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    user_id INT NOT NULL,
    provider ENUM('google', 'outlook', 'apple') NOT NULL,
    calendar_id VARCHAR(255) DEFAULT NULL,
    access_token TEXT DEFAULT NULL,
    refresh_token TEXT DEFAULT NULL,
    token_expires_at DATETIME DEFAULT NULL,
    sync_enabled BOOLEAN DEFAULT TRUE,
    last_sync_at DATETIME DEFAULT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_calendar_user (user_id),
    UNIQUE KEY unique_user_provider (user_id, provider),
    
    FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default availability (Mon-Fri 9am-5pm) for testing
-- This would normally be done per-user when they set up their calendar
