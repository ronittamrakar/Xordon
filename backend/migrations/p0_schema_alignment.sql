-- P0.1: Schema Alignment Migration
-- Standardizes workspace_id across all parity-related tables
-- Makes migrations idempotent with IF NOT EXISTS / IF EXISTS checks

-- ============================================================================
-- 1. Add workspace_id to service_categories (currently uses user_id only)
-- ============================================================================
ALTER TABLE service_categories 
ADD COLUMN IF NOT EXISTS workspace_id INT NULL AFTER id;

CREATE INDEX IF NOT EXISTS idx_service_categories_workspace 
ON service_categories(workspace_id);

-- ============================================================================
-- 2. Ensure staff_members has all required columns for booking parity
-- ============================================================================
ALTER TABLE staff_members
ADD COLUMN IF NOT EXISTS accepts_bookings TINYINT(1) DEFAULT 1 AFTER is_active;

ALTER TABLE staff_members
ADD COLUMN IF NOT EXISTS booking_page_url VARCHAR(500) NULL AFTER accepts_bookings;

-- ============================================================================
-- 3. Ensure services has buffer columns with correct names
-- ============================================================================
ALTER TABLE services
ADD COLUMN IF NOT EXISTS buffer_before_minutes INT DEFAULT 0 AFTER duration_minutes;

ALTER TABLE services
ADD COLUMN IF NOT EXISTS buffer_after_minutes INT DEFAULT 0 AFTER buffer_before_minutes;

ALTER TABLE services
ADD COLUMN IF NOT EXISTS max_bookings_per_slot INT DEFAULT 1 AFTER buffer_after_minutes;

ALTER TABLE services
ADD COLUMN IF NOT EXISTS allow_online_booking TINYINT(1) DEFAULT 1 AFTER requires_confirmation;

-- ============================================================================
-- 4. Ensure appointments table has all booking-related columns
-- ============================================================================
ALTER TABLE appointments
ADD COLUMN IF NOT EXISTS calendar_id INT NULL AFTER workspace_id;

ALTER TABLE appointments
ADD COLUMN IF NOT EXISTS booking_source ENUM('manual', 'online', 'phone', 'walk_in', 'api') DEFAULT 'manual' AFTER payment_id;

ALTER TABLE appointments
ADD COLUMN IF NOT EXISTS external_calendar_event_id VARCHAR(255) NULL AFTER outlook_event_id;

ALTER TABLE appointments
ADD COLUMN IF NOT EXISTS sync_status ENUM('pending', 'synced', 'failed', 'conflict') DEFAULT 'pending' AFTER external_calendar_event_id;

CREATE INDEX IF NOT EXISTS idx_appointments_calendar ON appointments(calendar_id);
CREATE INDEX IF NOT EXISTS idx_appointments_sync_status ON appointments(sync_status);

-- ============================================================================
-- 5. Create calendars table for multi-calendar support (P1.1 foundation)
-- ============================================================================
CREATE TABLE IF NOT EXISTS calendars (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    
    name VARCHAR(100) NOT NULL,
    description TEXT NULL,
    slug VARCHAR(100) NULL,
    
    -- Ownership
    owner_type ENUM('user', 'staff', 'team', 'location') DEFAULT 'user',
    owner_id INT NULL,
    
    -- Settings
    timezone VARCHAR(50) DEFAULT 'UTC',
    location_id INT NULL,
    
    -- Booking rules
    min_notice_hours INT DEFAULT 1,
    max_advance_days INT DEFAULT 60,
    slot_interval_minutes INT DEFAULT 30,
    buffer_before_minutes INT DEFAULT 0,
    buffer_after_minutes INT DEFAULT 0,
    
    -- Availability mode
    availability_mode ENUM('custom', 'staff_based', 'always') DEFAULT 'custom',
    
    -- Display
    color VARCHAR(7) DEFAULT '#6366f1',
    is_public TINYINT(1) DEFAULT 1,
    is_active TINYINT(1) DEFAULT 1,
    
    -- External sync
    google_calendar_id VARCHAR(255) NULL,
    google_sync_token TEXT NULL,
    google_channel_id VARCHAR(255) NULL,
    google_channel_expiry DATETIME NULL,
    
    outlook_calendar_id VARCHAR(255) NULL,
    outlook_sync_token TEXT NULL,
    
    last_synced_at DATETIME NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE KEY uk_calendar_slug (workspace_id, slug),
    INDEX idx_calendars_workspace (workspace_id, is_active),
    INDEX idx_calendars_owner (owner_type, owner_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 6. Create calendar_availability for custom availability windows
-- ============================================================================
CREATE TABLE IF NOT EXISTS calendar_availability (
    id INT AUTO_INCREMENT PRIMARY KEY,
    calendar_id INT NOT NULL,
    
    day_of_week TINYINT NOT NULL COMMENT '0=Sunday, 6=Saturday',
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_available TINYINT(1) DEFAULT 1,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_calendar_availability (calendar_id, day_of_week),
    
    FOREIGN KEY (calendar_id) REFERENCES calendars(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 7. Create calendar_blocks for one-off busy/blocked times
-- ============================================================================
CREATE TABLE IF NOT EXISTS calendar_blocks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    calendar_id INT NOT NULL,
    
    title VARCHAR(100) NULL,
    start_datetime DATETIME NOT NULL,
    end_datetime DATETIME NOT NULL,
    is_all_day TINYINT(1) DEFAULT 0,
    
    block_type ENUM('busy', 'tentative', 'out_of_office', 'external') DEFAULT 'busy',
    source ENUM('manual', 'google', 'outlook', 'ical') DEFAULT 'manual',
    external_event_id VARCHAR(255) NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_calendar_blocks (calendar_id, start_datetime, end_datetime),
    INDEX idx_calendar_blocks_external (external_event_id),
    
    FOREIGN KEY (calendar_id) REFERENCES calendars(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 8. Create calendar_staff_assignments (many-to-many)
-- ============================================================================
CREATE TABLE IF NOT EXISTS calendar_staff (
    id INT AUTO_INCREMENT PRIMARY KEY,
    calendar_id INT NOT NULL,
    staff_id INT NOT NULL,
    
    is_primary TINYINT(1) DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE KEY uk_calendar_staff (calendar_id, staff_id),
    
    FOREIGN KEY (calendar_id) REFERENCES calendars(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 9. Create calendar_services (which services can be booked on which calendar)
-- ============================================================================
CREATE TABLE IF NOT EXISTS calendar_services (
    id INT AUTO_INCREMENT PRIMARY KEY,
    calendar_id INT NOT NULL,
    service_id INT NOT NULL,
    
    custom_duration_minutes INT NULL,
    custom_price DECIMAL(10,2) NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE KEY uk_calendar_service (calendar_id, service_id),
    
    FOREIGN KEY (calendar_id) REFERENCES calendars(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 10. Create google_calendar_tokens for OAuth tokens storage
-- ============================================================================
CREATE TABLE IF NOT EXISTS google_calendar_tokens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    user_id INT NOT NULL,
    
    email VARCHAR(255) NOT NULL,
    access_token TEXT NOT NULL,
    refresh_token TEXT NULL,
    token_type VARCHAR(50) DEFAULT 'Bearer',
    expires_at DATETIME NOT NULL,
    scope TEXT NULL,
    
    is_active TINYINT(1) DEFAULT 1,
    last_used_at DATETIME NULL,
    error_message TEXT NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE KEY uk_google_token_user (workspace_id, user_id),
    INDEX idx_google_tokens_workspace (workspace_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 11. Create outlook_calendar_tokens for Microsoft Graph OAuth
-- ============================================================================
CREATE TABLE IF NOT EXISTS outlook_calendar_tokens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    user_id INT NOT NULL,
    
    email VARCHAR(255) NOT NULL,
    access_token TEXT NOT NULL,
    refresh_token TEXT NULL,
    token_type VARCHAR(50) DEFAULT 'Bearer',
    expires_at DATETIME NOT NULL,
    scope TEXT NULL,
    
    is_active TINYINT(1) DEFAULT 1,
    last_used_at DATETIME NULL,
    error_message TEXT NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE KEY uk_outlook_token_user (workspace_id, user_id),
    INDEX idx_outlook_tokens_workspace (workspace_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 12. Phone system tables (P2 foundation)
-- ============================================================================
CREATE TABLE IF NOT EXISTS phone_numbers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    
    phone_number VARCHAR(20) NOT NULL,
    friendly_name VARCHAR(100) NULL,
    
    -- Provider info
    provider ENUM('twilio', 'signalwire', 'other') DEFAULT 'twilio',
    provider_sid VARCHAR(100) NULL,
    
    -- Capabilities
    can_sms TINYINT(1) DEFAULT 1,
    can_voice TINYINT(1) DEFAULT 1,
    can_mms TINYINT(1) DEFAULT 0,
    
    -- Assignment
    assigned_to_type ENUM('user', 'team', 'inbox', 'ivr') NULL,
    assigned_to_id INT NULL,
    
    -- Settings
    forward_to VARCHAR(20) NULL,
    voicemail_enabled TINYINT(1) DEFAULT 1,
    voicemail_greeting_url VARCHAR(500) NULL,
    recording_enabled TINYINT(1) DEFAULT 0,
    transcription_enabled TINYINT(1) DEFAULT 0,
    
    -- Business hours
    business_hours_enabled TINYINT(1) DEFAULT 0,
    business_hours_config JSON NULL,
    after_hours_action ENUM('voicemail', 'forward', 'message', 'hangup') DEFAULT 'voicemail',
    after_hours_forward_to VARCHAR(20) NULL,
    
    status ENUM('active', 'suspended', 'released') DEFAULT 'active',
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE KEY uk_phone_number (phone_number),
    INDEX idx_phone_numbers_workspace (workspace_id, status),
    INDEX idx_phone_numbers_assignment (assigned_to_type, assigned_to_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 13. Call recordings table
-- ============================================================================
CREATE TABLE IF NOT EXISTS call_recordings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    call_log_id INT NULL,
    
    recording_sid VARCHAR(100) NULL,
    recording_url VARCHAR(500) NOT NULL,
    duration_seconds INT DEFAULT 0,
    file_size_bytes BIGINT NULL,
    
    transcription_status ENUM('pending', 'processing', 'completed', 'failed', 'disabled') DEFAULT 'disabled',
    transcription_text LONGTEXT NULL,
    transcription_confidence DECIMAL(3,2) NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_call_recordings_workspace (workspace_id),
    INDEX idx_call_recordings_call (call_log_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 14. IVR menus table
-- ============================================================================
CREATE TABLE IF NOT EXISTS ivr_menus (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    phone_number_id INT NULL,
    
    name VARCHAR(100) NOT NULL,
    greeting_text TEXT NULL,
    greeting_audio_url VARCHAR(500) NULL,
    
    timeout_seconds INT DEFAULT 10,
    max_retries INT DEFAULT 3,
    
    options JSON NULL COMMENT 'Array of {digit, action, target_type, target_id, label}',
    
    fallback_action ENUM('voicemail', 'forward', 'hangup', 'repeat') DEFAULT 'repeat',
    fallback_target VARCHAR(100) NULL,
    
    is_active TINYINT(1) DEFAULT 1,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_ivr_menus_workspace (workspace_id),
    INDEX idx_ivr_menus_phone (phone_number_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 15. Review requests table (P3 foundation)
-- ============================================================================
CREATE TABLE IF NOT EXISTS review_requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    
    contact_id INT NULL,
    appointment_id INT NULL,
    job_id INT NULL,
    invoice_id INT NULL,
    
    -- Request details
    channel ENUM('email', 'sms', 'both') DEFAULT 'email',
    email VARCHAR(255) NULL,
    phone VARCHAR(50) NULL,
    
    -- Tracking
    request_token VARCHAR(64) NOT NULL,
    short_url VARCHAR(100) NULL,
    
    -- Status
    status ENUM('pending', 'sent', 'clicked', 'reviewed', 'declined', 'expired') DEFAULT 'pending',
    sent_at DATETIME NULL,
    clicked_at DATETIME NULL,
    reviewed_at DATETIME NULL,
    
    -- Result
    review_id INT NULL,
    review_platform VARCHAR(50) NULL,
    review_rating TINYINT NULL,
    
    -- Automation
    automation_id INT NULL,
    
    expires_at DATETIME NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE KEY uk_review_request_token (request_token),
    INDEX idx_review_requests_workspace (workspace_id, status),
    INDEX idx_review_requests_contact (contact_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 16. Review platforms configuration
-- ============================================================================
CREATE TABLE IF NOT EXISTS review_platform_configs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    
    platform ENUM('google', 'facebook', 'yelp', 'trustpilot', 'custom') NOT NULL,
    platform_name VARCHAR(100) NULL,
    
    -- Connection
    is_connected TINYINT(1) DEFAULT 0,
    account_id VARCHAR(255) NULL,
    location_id VARCHAR(255) NULL,
    access_token TEXT NULL,
    refresh_token TEXT NULL,
    token_expires_at DATETIME NULL,
    
    -- Review link
    review_url VARCHAR(500) NULL,
    
    -- Sync settings
    auto_sync TINYINT(1) DEFAULT 1,
    last_synced_at DATETIME NULL,
    sync_error TEXT NULL,
    
    is_active TINYINT(1) DEFAULT 1,
    priority INT DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE KEY uk_review_platform (workspace_id, platform, location_id),
    INDEX idx_review_platforms_workspace (workspace_id, is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 17. Jobs table enhancements (P5 foundation)
-- ============================================================================
ALTER TABLE jobs
ADD COLUMN IF NOT EXISTS dispatch_status ENUM('unassigned', 'assigned', 'dispatched', 'en_route', 'on_site', 'completed') DEFAULT 'unassigned' AFTER status;

ALTER TABLE jobs
ADD COLUMN IF NOT EXISTS dispatched_at DATETIME NULL AFTER dispatch_status;

ALTER TABLE jobs
ADD COLUMN IF NOT EXISTS arrival_time DATETIME NULL AFTER dispatched_at;

ALTER TABLE jobs
ADD COLUMN IF NOT EXISTS completion_time DATETIME NULL AFTER arrival_time;

ALTER TABLE jobs
ADD COLUMN IF NOT EXISTS labor_hours DECIMAL(5,2) NULL AFTER completion_time;

ALTER TABLE jobs
ADD COLUMN IF NOT EXISTS labor_cost DECIMAL(10,2) NULL AFTER labor_hours;

ALTER TABLE jobs
ADD COLUMN IF NOT EXISTS parts_cost DECIMAL(10,2) NULL AFTER labor_cost;

ALTER TABLE jobs
ADD COLUMN IF NOT EXISTS total_cost DECIMAL(10,2) NULL AFTER parts_cost;

ALTER TABLE jobs
ADD COLUMN IF NOT EXISTS profit DECIMAL(10,2) NULL AFTER total_cost;

CREATE INDEX IF NOT EXISTS idx_jobs_dispatch ON jobs(dispatch_status, dispatched_at);

-- ============================================================================
-- 18. Job parts/materials used
-- ============================================================================
CREATE TABLE IF NOT EXISTS job_parts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    job_id INT NOT NULL,
    
    product_id INT NULL,
    name VARCHAR(255) NOT NULL,
    sku VARCHAR(100) NULL,
    
    quantity DECIMAL(10,2) DEFAULT 1,
    unit_cost DECIMAL(10,2) DEFAULT 0,
    unit_price DECIMAL(10,2) DEFAULT 0,
    
    notes TEXT NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_job_parts_job (job_id),
    INDEX idx_job_parts_product (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 19. Funnels table (P6 foundation)
-- ============================================================================
CREATE TABLE IF NOT EXISTS funnels (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NULL,
    description TEXT NULL,
    
    -- Settings
    domain VARCHAR(255) NULL,
    favicon_url VARCHAR(500) NULL,
    
    -- Analytics
    total_views INT DEFAULT 0,
    total_conversions INT DEFAULT 0,
    conversion_rate DECIMAL(5,2) DEFAULT 0,
    
    status ENUM('draft', 'published', 'archived') DEFAULT 'draft',
    published_at DATETIME NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE KEY uk_funnel_slug (workspace_id, slug),
    INDEX idx_funnels_workspace (workspace_id, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 20. Funnel steps
-- ============================================================================
CREATE TABLE IF NOT EXISTS funnel_steps (
    id INT AUTO_INCREMENT PRIMARY KEY,
    funnel_id INT NOT NULL,
    
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NULL,
    step_type ENUM('landing', 'optin', 'sales', 'checkout', 'upsell', 'downsell', 'thankyou', 'webinar', 'custom') DEFAULT 'landing',
    
    sort_order INT DEFAULT 0,
    
    -- Page content
    landing_page_id INT NULL,
    page_content LONGTEXT NULL,
    
    -- Conversion tracking
    conversion_goal ENUM('pageview', 'form_submit', 'button_click', 'purchase', 'custom') DEFAULT 'pageview',
    conversion_value DECIMAL(10,2) NULL,
    
    -- Analytics
    views INT DEFAULT 0,
    conversions INT DEFAULT 0,
    
    is_active TINYINT(1) DEFAULT 1,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_funnel_steps (funnel_id, sort_order),
    
    FOREIGN KEY (funnel_id) REFERENCES funnels(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 21. Memberships table (P6 foundation)
-- ============================================================================
CREATE TABLE IF NOT EXISTS memberships (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NULL,
    description TEXT NULL,
    
    -- Access
    access_type ENUM('free', 'paid', 'subscription') DEFAULT 'paid',
    price DECIMAL(10,2) NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    
    -- Subscription
    billing_interval ENUM('one_time', 'monthly', 'yearly') DEFAULT 'one_time',
    trial_days INT DEFAULT 0,
    
    -- Content
    welcome_message TEXT NULL,
    
    status ENUM('draft', 'active', 'archived') DEFAULT 'draft',
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE KEY uk_membership_slug (workspace_id, slug),
    INDEX idx_memberships_workspace (workspace_id, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 22. Membership content (courses/lessons)
-- ============================================================================
CREATE TABLE IF NOT EXISTS membership_content (
    id INT AUTO_INCREMENT PRIMARY KEY,
    membership_id INT NOT NULL,
    
    title VARCHAR(255) NOT NULL,
    content_type ENUM('module', 'lesson', 'video', 'file', 'quiz') DEFAULT 'lesson',
    parent_id INT NULL,
    
    sort_order INT DEFAULT 0,
    
    -- Content
    content LONGTEXT NULL,
    video_url VARCHAR(500) NULL,
    file_url VARCHAR(500) NULL,
    duration_minutes INT NULL,
    
    -- Drip
    drip_enabled TINYINT(1) DEFAULT 0,
    drip_days INT DEFAULT 0,
    
    is_published TINYINT(1) DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_membership_content (membership_id, parent_id, sort_order),
    
    FOREIGN KEY (membership_id) REFERENCES memberships(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 23. Member access records
-- ============================================================================
CREATE TABLE IF NOT EXISTS member_access (
    id INT AUTO_INCREMENT PRIMARY KEY,
    membership_id INT NOT NULL,
    contact_id INT NOT NULL,
    
    -- Access
    status ENUM('active', 'expired', 'cancelled', 'paused') DEFAULT 'active',
    access_granted_at DATETIME NOT NULL,
    access_expires_at DATETIME NULL,
    
    -- Payment
    payment_id INT NULL,
    subscription_id INT NULL,
    
    -- Progress
    last_accessed_at DATETIME NULL,
    completed_content_ids JSON NULL,
    progress_percent INT DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE KEY uk_member_access (membership_id, contact_id),
    INDEX idx_member_access_contact (contact_id),
    
    FOREIGN KEY (membership_id) REFERENCES memberships(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 24. Workflow builder tables (P6 foundation)
-- ============================================================================
CREATE TABLE IF NOT EXISTS workflows (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    
    name VARCHAR(100) NOT NULL,
    description TEXT NULL,
    
    -- Trigger
    trigger_type VARCHAR(50) NOT NULL,
    trigger_config JSON NULL,
    
    -- Settings
    is_active TINYINT(1) DEFAULT 0,
    run_once_per_contact TINYINT(1) DEFAULT 0,
    
    -- Stats
    total_enrolled INT DEFAULT 0,
    total_completed INT DEFAULT 0,
    total_failed INT DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_workflows_workspace (workspace_id, is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 25. Workflow steps (nodes)
-- ============================================================================
CREATE TABLE IF NOT EXISTS workflow_steps (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workflow_id INT NOT NULL,
    
    step_type ENUM('action', 'condition', 'wait', 'split', 'goal') NOT NULL,
    action_type VARCHAR(50) NULL,
    
    -- Config
    config JSON NULL,
    
    -- Position in visual builder
    position_x INT DEFAULT 0,
    position_y INT DEFAULT 0,
    
    -- Connections
    next_step_id INT NULL,
    true_step_id INT NULL COMMENT 'For conditions: if true',
    false_step_id INT NULL COMMENT 'For conditions: if false',
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_workflow_steps (workflow_id),
    
    FOREIGN KEY (workflow_id) REFERENCES workflows(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 26. Workflow enrollments (contacts in workflow)
-- ============================================================================
CREATE TABLE IF NOT EXISTS workflow_enrollments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workflow_id INT NOT NULL,
    contact_id INT NOT NULL,
    
    current_step_id INT NULL,
    
    status ENUM('active', 'completed', 'failed', 'paused', 'exited') DEFAULT 'active',
    
    enrolled_at DATETIME NOT NULL,
    completed_at DATETIME NULL,
    exited_at DATETIME NULL,
    exit_reason VARCHAR(255) NULL,
    
    -- Wait state
    waiting_until DATETIME NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_workflow_enrollments (workflow_id, status),
    INDEX idx_workflow_enrollments_contact (contact_id),
    INDEX idx_workflow_enrollments_waiting (waiting_until),
    
    FOREIGN KEY (workflow_id) REFERENCES workflows(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 27. Workflow execution logs
-- ============================================================================
CREATE TABLE IF NOT EXISTS workflow_execution_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    enrollment_id INT NOT NULL,
    step_id INT NOT NULL,
    
    status ENUM('pending', 'running', 'completed', 'failed', 'skipped') DEFAULT 'pending',
    
    started_at DATETIME NULL,
    completed_at DATETIME NULL,
    
    result JSON NULL,
    error_message TEXT NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_workflow_logs_enrollment (enrollment_id),
    INDEX idx_workflow_logs_step (step_id),
    
    FOREIGN KEY (enrollment_id) REFERENCES workflow_enrollments(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
