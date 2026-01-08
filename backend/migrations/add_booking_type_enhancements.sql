-- Add service and staff associations to booking_types
-- Run this migration to enhance appointment booking with industry features

-- Add service_id to booking_types
ALTER TABLE booking_types 
ADD COLUMN IF NOT EXISTS service_id INT NULL AFTER user_id,
ADD COLUMN IF NOT EXISTS assigned_staff_ids JSON NULL AFTER service_id,
ADD COLUMN IF NOT EXISTS intake_form_id INT NULL AFTER assigned_staff_ids,
ADD COLUMN IF NOT EXISTS confirmation_email_template_id INT NULL,
ADD COLUMN IF NOT EXISTS reminder_sms_template_id INT NULL,
ADD COLUMN IF NOT EXISTS followup_automation_id INT NULL,
ADD COLUMN IF NOT EXISTS allow_staff_selection BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS require_deposit BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS deposit_amount DECIMAL(10,2) NULL,
ADD COLUMN IF NOT EXISTS cancellation_policy TEXT NULL;

-- Add staff_id to appointments
ALTER TABLE appointments
ADD COLUMN IF NOT EXISTS staff_id INT NULL AFTER contact_id,
ADD COLUMN IF NOT EXISTS service_id INT NULL AFTER staff_id,
ADD COLUMN IF NOT EXISTS intake_submission_id INT NULL,
ADD COLUMN IF NOT EXISTS deposit_paid BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS deposit_amount DECIMAL(10,2) NULL,
ADD COLUMN IF NOT EXISTS reminder_sent_at DATETIME NULL,
ADD COLUMN IF NOT EXISTS confirmed_at DATETIME NULL,
ADD COLUMN IF NOT EXISTS checked_in_at DATETIME NULL,
ADD COLUMN IF NOT EXISTS completed_at DATETIME NULL,
ADD COLUMN IF NOT EXISTS cancelled_at DATETIME NULL,
ADD COLUMN IF NOT EXISTS cancellation_reason TEXT NULL;

-- Create booking_type_staff junction table for staff assignments
CREATE TABLE IF NOT EXISTS booking_type_staff (
    id INT AUTO_INCREMENT PRIMARY KEY,
    booking_type_id INT NOT NULL,
    staff_id INT NOT NULL,
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_booking_staff (booking_type_id, staff_id)
);

-- Create appointment_staff for multi-staff appointments
CREATE TABLE IF NOT EXISTS appointment_staff (
    id INT AUTO_INCREMENT PRIMARY KEY,
    appointment_id INT NOT NULL,
    staff_id INT NOT NULL,
    role VARCHAR(50) DEFAULT 'assigned',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_appt_staff (appointment_id, staff_id)
);

-- Create staff availability table
CREATE TABLE IF NOT EXISTS staff_availability (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    staff_id INT NOT NULL,
    day_of_week TINYINT NOT NULL COMMENT '0=Sunday, 6=Saturday',
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_staff_day (staff_id, day_of_week)
);

-- Create staff time off table
CREATE TABLE IF NOT EXISTS staff_time_off (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    staff_id INT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    reason VARCHAR(255) NULL,
    is_approved BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_staff_dates (staff_id, start_date, end_date)
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_booking_service ON booking_types(service_id);
CREATE INDEX IF NOT EXISTS idx_appt_staff ON appointments(staff_id);
CREATE INDEX IF NOT EXISTS idx_appt_service ON appointments(service_id);
