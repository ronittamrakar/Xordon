-- Appointments and Scheduling Module
-- Tables for booking links, availability, appointments, and reminders

-- Booking link types (meeting types like "30 min call", "1 hour consultation")
CREATE TABLE IF NOT EXISTS booking_types (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) NOT NULL,
    description TEXT,
    duration_minutes INT NOT NULL DEFAULT 30,
    buffer_before INT NOT NULL DEFAULT 0,
    buffer_after INT NOT NULL DEFAULT 15,
    color VARCHAR(7) DEFAULT '#3B82F6',
    location_type ENUM('in_person', 'phone', 'video', 'custom') NOT NULL DEFAULT 'video',
    location_details TEXT,
    meeting_link_template VARCHAR(500) NULL,
    price DECIMAL(10, 2) NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    requires_payment BOOLEAN NOT NULL DEFAULT FALSE,
    max_bookings_per_day INT NULL,
    min_notice_hours INT NOT NULL DEFAULT 24,
    max_future_days INT NOT NULL DEFAULT 60,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_booking_types_user (user_id),
    INDEX idx_booking_types_slug (slug),
    UNIQUE KEY unique_user_slug (user_id, slug),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- User availability schedules
CREATE TABLE IF NOT EXISTS availability_schedules (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    name VARCHAR(255) NOT NULL DEFAULT 'Default Schedule',
    timezone VARCHAR(100) NOT NULL DEFAULT 'UTC',
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_availability_user (user_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Weekly availability slots
CREATE TABLE IF NOT EXISTS availability_slots (
    id INT AUTO_INCREMENT PRIMARY KEY,
    schedule_id INT NOT NULL,
    day_of_week TINYINT NOT NULL, -- 0=Sunday, 6=Saturday
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_available BOOLEAN NOT NULL DEFAULT TRUE,
    INDEX idx_slots_schedule (schedule_id),
    FOREIGN KEY (schedule_id) REFERENCES availability_schedules(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Date-specific overrides (holidays, special hours)
CREATE TABLE IF NOT EXISTS availability_overrides (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    override_date DATE NOT NULL,
    is_available BOOLEAN NOT NULL DEFAULT FALSE,
    start_time TIME NULL,
    end_time TIME NULL,
    reason VARCHAR(255) NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_overrides_user_date (user_id, override_date),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Appointments/Bookings
CREATE TABLE IF NOT EXISTS appointments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    booking_type_id INT NULL,
    contact_id INT NULL,
    guest_name VARCHAR(255) NULL,
    guest_email VARCHAR(255) NULL,
    guest_phone VARCHAR(50) NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    scheduled_at DATETIME NOT NULL,
    duration_minutes INT NOT NULL DEFAULT 30,
    end_at DATETIME NOT NULL,
    timezone VARCHAR(100) NOT NULL DEFAULT 'UTC',
    location_type ENUM('in_person', 'phone', 'video', 'custom') NOT NULL DEFAULT 'video',
    location VARCHAR(500) NULL,
    meeting_link VARCHAR(500) NULL,
    status ENUM('scheduled', 'confirmed', 'completed', 'cancelled', 'no_show', 'rescheduled') NOT NULL DEFAULT 'scheduled',
    cancellation_reason TEXT,
    cancelled_by ENUM('host', 'guest') NULL,
    rescheduled_from INT NULL,
    notes TEXT,
    internal_notes TEXT,
    google_event_id VARCHAR(255) NULL,
    outlook_event_id VARCHAR(255) NULL,
    confirmation_sent_at DATETIME NULL,
    reminder_sent_at DATETIME NULL,
    payment_id INT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_appointments_user (user_id),
    INDEX idx_appointments_contact (contact_id),
    INDEX idx_appointments_scheduled (scheduled_at),
    INDEX idx_appointments_status (status),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (booking_type_id) REFERENCES booking_types(id) ON DELETE SET NULL,
    FOREIGN KEY (rescheduled_from) REFERENCES appointments(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Appointment reminders configuration
CREATE TABLE IF NOT EXISTS appointment_reminders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    booking_type_id INT NULL,
    user_id INT NOT NULL,
    reminder_type ENUM('email', 'sms', 'both') NOT NULL DEFAULT 'email',
    time_before_minutes INT NOT NULL DEFAULT 60,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    email_template_id INT NULL,
    sms_template_id INT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_reminders_booking_type (booking_type_id),
    INDEX idx_reminders_user (user_id),
    FOREIGN KEY (booking_type_id) REFERENCES booking_types(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Appointment reminder queue
CREATE TABLE IF NOT EXISTS appointment_reminder_queue (
    id INT AUTO_INCREMENT PRIMARY KEY,
    appointment_id INT NOT NULL,
    reminder_id INT NOT NULL,
    scheduled_for DATETIME NOT NULL,
    sent_at DATETIME NULL,
    status ENUM('pending', 'sent', 'failed', 'cancelled') NOT NULL DEFAULT 'pending',
    error_message TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_reminder_queue_scheduled (scheduled_for),
    INDEX idx_reminder_queue_status (status),
    FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE CASCADE,
    FOREIGN KEY (reminder_id) REFERENCES appointment_reminders(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Calendar connections (Google, Outlook)
CREATE TABLE IF NOT EXISTS calendar_connections (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    provider ENUM('google', 'outlook', 'apple') NOT NULL,
    account_email VARCHAR(255) NULL,
    access_token TEXT NULL,
    refresh_token TEXT NULL,
    token_expires_at DATETIME NULL,
    calendar_id VARCHAR(255) NULL,
    sync_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    last_synced_at DATETIME NULL,
    status ENUM('active', 'expired', 'error', 'disconnected') NOT NULL DEFAULT 'active',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_calendar_user (user_id),
    UNIQUE KEY unique_user_provider (user_id, provider),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Booking page settings
CREATE TABLE IF NOT EXISTS booking_page_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    page_slug VARCHAR(100) NOT NULL,
    page_title VARCHAR(255) NULL,
    welcome_message TEXT,
    logo_url VARCHAR(500) NULL,
    brand_color VARCHAR(7) DEFAULT '#3B82F6',
    show_branding BOOLEAN NOT NULL DEFAULT TRUE,
    require_phone BOOLEAN NOT NULL DEFAULT FALSE,
    custom_questions JSON NULL,
    confirmation_message TEXT,
    redirect_url VARCHAR(500) NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_booking_page_slug (page_slug),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
