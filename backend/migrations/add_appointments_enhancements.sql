-- Appointments Enhancements Migration
-- Adds additional features for Calendly/Acuity-like scheduling

-- Add missing columns to booking_types if they don't exist
ALTER TABLE booking_types 
ADD COLUMN IF NOT EXISTS confirmation_email_template_id INT NULL,
ADD COLUMN IF NOT EXISTS reminder_email_template_id INT NULL,
ADD COLUMN IF NOT EXISTS reminder_sms_template_id INT NULL,
ADD COLUMN IF NOT EXISTS followup_automation_id INT NULL,
ADD COLUMN IF NOT EXISTS cancellation_policy TEXT NULL,
ADD COLUMN IF NOT EXISTS custom_questions JSON NULL,
ADD COLUMN IF NOT EXISTS booking_limit_type ENUM('daily', 'weekly', 'monthly') DEFAULT 'daily',
ADD COLUMN IF NOT EXISTS booking_limit_count INT NULL,
ADD COLUMN IF NOT EXISTS auto_confirm BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS collect_payment_on_booking BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS payment_provider VARCHAR(50) NULL,
ADD COLUMN IF NOT EXISTS stripe_price_id VARCHAR(255) NULL;

-- Add missing columns to appointments if they don't exist
ALTER TABLE appointments
ADD COLUMN IF NOT EXISTS source ENUM('manual', 'booking_page', 'api', 'import') DEFAULT 'manual',
ADD COLUMN IF NOT EXISTS utm_source VARCHAR(255) NULL,
ADD COLUMN IF NOT EXISTS utm_medium VARCHAR(255) NULL,
ADD COLUMN IF NOT EXISTS utm_campaign VARCHAR(255) NULL,
ADD COLUMN IF NOT EXISTS referrer_url VARCHAR(500) NULL,
ADD COLUMN IF NOT EXISTS custom_answers JSON NULL,
ADD COLUMN IF NOT EXISTS payment_status ENUM('pending', 'paid', 'refunded', 'failed') NULL,
ADD COLUMN IF NOT EXISTS payment_amount DECIMAL(10,2) NULL,
ADD COLUMN IF NOT EXISTS stripe_payment_id VARCHAR(255) NULL,
ADD COLUMN IF NOT EXISTS follow_up_scheduled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS follow_up_sent_at DATETIME NULL;

-- Add missing columns to booking_page_settings if they don't exist
ALTER TABLE booking_page_settings
ADD COLUMN IF NOT EXISTS timezone VARCHAR(100) DEFAULT 'America/New_York',
ADD COLUMN IF NOT EXISTS date_format VARCHAR(20) DEFAULT 'MM/DD/YYYY',
ADD COLUMN IF NOT EXISTS time_format ENUM('12h', '24h') DEFAULT '12h',
ADD COLUMN IF NOT EXISTS cancellation_policy TEXT NULL,
ADD COLUMN IF NOT EXISTS privacy_policy_url VARCHAR(500) NULL,
ADD COLUMN IF NOT EXISTS terms_url VARCHAR(500) NULL,
ADD COLUMN IF NOT EXISTS google_analytics_id VARCHAR(50) NULL,
ADD COLUMN IF NOT EXISTS facebook_pixel_id VARCHAR(50) NULL,
ADD COLUMN IF NOT EXISTS custom_css TEXT NULL,
ADD COLUMN IF NOT EXISTS custom_js TEXT NULL,
ADD COLUMN IF NOT EXISTS seo_title VARCHAR(255) NULL,
ADD COLUMN IF NOT EXISTS seo_description TEXT NULL;

-- Create appointment_notifications table for tracking sent notifications
CREATE TABLE IF NOT EXISTS appointment_notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    appointment_id INT NOT NULL,
    notification_type ENUM('confirmation', 'reminder', 'cancellation', 'reschedule', 'follow_up') NOT NULL,
    channel ENUM('email', 'sms', 'both') NOT NULL,
    sent_at DATETIME NOT NULL,
    status ENUM('sent', 'delivered', 'failed', 'bounced') DEFAULT 'sent',
    error_message TEXT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_notification_appointment (appointment_id),
    INDEX idx_notification_type (notification_type),
    FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Create appointment_feedback table for post-appointment feedback
CREATE TABLE IF NOT EXISTS appointment_feedback (
    id INT AUTO_INCREMENT PRIMARY KEY,
    appointment_id INT NOT NULL UNIQUE,
    rating INT CHECK (rating >= 1 AND rating <= 5),
    feedback_text TEXT NULL,
    would_recommend BOOLEAN NULL,
    submitted_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_feedback_appointment (appointment_id),
    FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Create recurring_appointments table for recurring booking patterns
CREATE TABLE IF NOT EXISTS recurring_appointments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    booking_type_id INT NOT NULL,
    contact_id INT NULL,
    guest_name VARCHAR(255) NULL,
    guest_email VARCHAR(255) NULL,
    recurrence_pattern ENUM('daily', 'weekly', 'biweekly', 'monthly') NOT NULL,
    recurrence_day_of_week TINYINT NULL,
    recurrence_day_of_month TINYINT NULL,
    preferred_time TIME NOT NULL,
    duration_minutes INT NOT NULL DEFAULT 30,
    timezone VARCHAR(100) NOT NULL DEFAULT 'UTC',
    start_date DATE NOT NULL,
    end_date DATE NULL,
    max_occurrences INT NULL,
    occurrences_created INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_recurring_user (user_id),
    INDEX idx_recurring_active (is_active),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (booking_type_id) REFERENCES booking_types(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Create appointment_waitlist table for managing waitlists
CREATE TABLE IF NOT EXISTS appointment_waitlist (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    booking_type_id INT NOT NULL,
    contact_id INT NULL,
    guest_name VARCHAR(255) NOT NULL,
    guest_email VARCHAR(255) NOT NULL,
    guest_phone VARCHAR(50) NULL,
    preferred_dates JSON NULL,
    preferred_times JSON NULL,
    notes TEXT NULL,
    status ENUM('waiting', 'notified', 'booked', 'expired', 'cancelled') DEFAULT 'waiting',
    notified_at DATETIME NULL,
    expires_at DATETIME NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_waitlist_user (user_id),
    INDEX idx_waitlist_status (status),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (booking_type_id) REFERENCES booking_types(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Create group_bookings table for group/class appointments
CREATE TABLE IF NOT EXISTS group_bookings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    booking_type_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NULL,
    scheduled_at DATETIME NOT NULL,
    duration_minutes INT NOT NULL DEFAULT 60,
    max_participants INT NOT NULL DEFAULT 10,
    current_participants INT DEFAULT 0,
    location_type ENUM('in_person', 'video', 'hybrid') DEFAULT 'video',
    location VARCHAR(500) NULL,
    meeting_link VARCHAR(500) NULL,
    price_per_person DECIMAL(10,2) NULL,
    status ENUM('scheduled', 'in_progress', 'completed', 'cancelled') DEFAULT 'scheduled',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_group_user (user_id),
    INDEX idx_group_scheduled (scheduled_at),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (booking_type_id) REFERENCES booking_types(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Create group_booking_participants table
CREATE TABLE IF NOT EXISTS group_booking_participants (
    id INT AUTO_INCREMENT PRIMARY KEY,
    group_booking_id INT NOT NULL,
    contact_id INT NULL,
    guest_name VARCHAR(255) NOT NULL,
    guest_email VARCHAR(255) NOT NULL,
    guest_phone VARCHAR(50) NULL,
    status ENUM('registered', 'confirmed', 'attended', 'no_show', 'cancelled') DEFAULT 'registered',
    payment_status ENUM('pending', 'paid', 'refunded') NULL,
    registered_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_participant_group (group_booking_id),
    FOREIGN KEY (group_booking_id) REFERENCES group_bookings(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_appointments_user_date ON appointments(user_id, scheduled_at);
CREATE INDEX IF NOT EXISTS idx_appointments_status_date ON appointments(status, scheduled_at);
CREATE INDEX IF NOT EXISTS idx_booking_types_user_active ON booking_types(user_id, is_active);
