-- =============================================================================
-- COMPREHENSIVE MISSING TABLES MIGRATION
-- Generated: 2026-01-08
-- Purpose: Add all missing database tables identified in the comprehensive audit
-- =============================================================================

-- =============================================================================
-- 1. AI WORKFORCE MODULE TABLES
-- =============================================================================

-- AI Employees table
CREATE TABLE IF NOT EXISTS ai_employees (
    id INT PRIMARY KEY AUTO_INCREMENT,
    workspace_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(100),
    capabilities JSON, -- Array of capability IDs
    status ENUM('active', 'paused', 'training') DEFAULT 'active',
    avatar_url VARCHAR(500),
    personality_config JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_workspace (workspace_id),
    INDEX idx_status (status)
);

-- AI Capabilities table
CREATE TABLE IF NOT EXISTS ai_capabilities (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    description TEXT,
    config_schema JSON,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_category (category),
    INDEX idx_active (is_active)
);

-- AI Workflows table
CREATE TABLE IF NOT EXISTS ai_workflows (
    id INT PRIMARY KEY AUTO_INCREMENT,
    workspace_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    trigger_config JSON,
    steps JSON, -- Array of workflow steps
    status ENUM('active', 'draft', 'archived') DEFAULT 'draft',
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_workspace (workspace_id),
    INDEX idx_status (status)
);

-- AI Workflow Executions table
CREATE TABLE IF NOT EXISTS ai_workflow_executions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    workflow_id INT NOT NULL,
    ai_employee_id INT,
    status ENUM('pending', 'running', 'completed', 'failed') DEFAULT 'pending',
    input_data JSON,
    output_data JSON,
    error_message TEXT,
    started_at TIMESTAMP NULL,
    completed_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_workflow (workflow_id),
    INDEX idx_employee (ai_employee_id),
    INDEX idx_status (status)
);

-- AI Task Queue table
CREATE TABLE IF NOT EXISTS ai_task_queue (
    id INT PRIMARY KEY AUTO_INCREMENT,
    workspace_id INT NOT NULL,
    ai_employee_id INT,
    task_type VARCHAR(100),
    priority INT DEFAULT 0,
    payload JSON,
    status ENUM('queued', 'processing', 'completed', 'failed') DEFAULT 'queued',
    attempts INT DEFAULT 0,
    max_attempts INT DEFAULT 3,
    error_log TEXT,
    scheduled_at TIMESTAMP NULL,
    started_at TIMESTAMP NULL,
    completed_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_workspace (workspace_id),
    INDEX idx_status_priority (status, priority),
    INDEX idx_scheduled (scheduled_at)
);

-- =============================================================================
-- 2. COMPANY CULTURE MODULE TABLES
-- =============================================================================

-- Culture Surveys table
CREATE TABLE IF NOT EXISTS culture_surveys (
    id INT PRIMARY KEY AUTO_INCREMENT,
    workspace_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    questions JSON,
    frequency ENUM('weekly', 'monthly', 'quarterly', 'annual') DEFAULT 'monthly',
    is_anonymous BOOLEAN DEFAULT TRUE,
    status ENUM('draft', 'active', 'closed') DEFAULT 'draft',
    created_by INT,
    starts_at TIMESTAMP NULL,
    ends_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_workspace (workspace_id),
    INDEX idx_status (status)
);

-- Culture Survey Responses table
CREATE TABLE IF NOT EXISTS culture_survey_responses (
    id INT PRIMARY KEY AUTO_INCREMENT,
    survey_id INT NOT NULL,
    employee_id INT,
    responses JSON,
    sentiment_score DECIMAL(3,2),
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_survey (survey_id),
    INDEX idx_employee (employee_id)
);

-- Peer Recognition table
CREATE TABLE IF NOT EXISTS peer_recognition (
    id INT PRIMARY KEY AUTO_INCREMENT,
    workspace_id INT NOT NULL,
    from_employee_id INT NOT NULL,
    to_employee_id INT NOT NULL,
    recognition_type VARCHAR(100),
    message TEXT,
    points_awarded INT DEFAULT 0,
    is_public BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_workspace (workspace_id),
    INDEX idx_from_employee (from_employee_id),
    INDEX idx_to_employee (to_employee_id)
);

-- Team Events table
CREATE TABLE IF NOT EXISTS team_events (
    id INT PRIMARY KEY AUTO_INCREMENT,
    workspace_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    event_type VARCHAR(100),
    event_date DATETIME,
    end_date DATETIME,
    location VARCHAR(255),
    is_virtual BOOLEAN DEFAULT FALSE,
    virtual_link VARCHAR(500),
    max_attendees INT,
    rsvp_deadline DATETIME,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_workspace (workspace_id),
    INDEX idx_event_date (event_date)
);

-- Event Attendees table
CREATE TABLE IF NOT EXISTS event_attendees (
    id INT PRIMARY KEY AUTO_INCREMENT,
    event_id INT NOT NULL,
    employee_id INT NOT NULL,
    rsvp_status ENUM('going', 'maybe', 'not_going') DEFAULT 'maybe',
    rsvp_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_event (event_id),
    UNIQUE KEY unique_attendee (event_id, employee_id)
);

-- Culture Champions table
CREATE TABLE IF NOT EXISTS culture_champions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    workspace_id INT NOT NULL,
    employee_id INT NOT NULL,
    department VARCHAR(100),
    appointed_at DATE,
    status ENUM('active', 'inactive') DEFAULT 'active',
    achievements JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_workspace (workspace_id),
    UNIQUE KEY unique_champion (workspace_id, employee_id)
);

-- =============================================================================
-- 3. COURSES/LMS ENHANCEMENT TABLES
-- =============================================================================

-- Course Enrollments table
CREATE TABLE IF NOT EXISTS course_enrollments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    course_id INT NOT NULL,
    student_id INT NOT NULL,
    enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    progress_percentage DECIMAL(5,2) DEFAULT 0.00,
    status ENUM('enrolled', 'in_progress', 'completed', 'dropped') DEFAULT 'enrolled',
    completed_at TIMESTAMP NULL,
    certificate_issued_at TIMESTAMP NULL,
    INDEX idx_course (course_id),
    INDEX idx_student (student_id),
    UNIQUE KEY unique_enrollment (course_id, student_id)
);

-- Course Progress table
CREATE TABLE IF NOT EXISTS course_progress (
    id INT PRIMARY KEY AUTO_INCREMENT,
    enrollment_id INT NOT NULL,
    lesson_id INT NOT NULL,
    status ENUM('not_started', 'in_progress', 'completed') DEFAULT 'not_started',
    time_spent_seconds INT DEFAULT 0,
    last_accessed_at TIMESTAMP NULL,
    completed_at TIMESTAMP NULL,
    INDEX idx_enrollment (enrollment_id),
    INDEX idx_lesson (lesson_id),
    UNIQUE KEY unique_progress (enrollment_id, lesson_id)
);

-- Course Quizzes table
CREATE TABLE IF NOT EXISTS course_quizzes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    course_id INT NOT NULL,
    lesson_id INT,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    questions JSON,
    passing_score INT DEFAULT 70,
    time_limit_minutes INT,
    max_attempts INT DEFAULT 3,
    is_randomized BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_course (course_id),
    INDEX idx_lesson (lesson_id)
);

-- Quiz Attempts table
CREATE TABLE IF NOT EXISTS quiz_attempts (
    id INT PRIMARY KEY AUTO_INCREMENT,
    quiz_id INT NOT NULL,
    student_id INT NOT NULL,
    enrollment_id INT NOT NULL,
    answers JSON,
    score DECIMAL(5,2),
    passed BOOLEAN DEFAULT FALSE,
    attempt_number INT DEFAULT 1,
    started_at TIMESTAMP NULL,
    submitted_at TIMESTAMP NULL,
    INDEX idx_quiz (quiz_id),
    INDEX idx_enrollment (enrollment_id),
    INDEX idx_student (student_id)
);

-- =============================================================================
-- 4. WEBINAR MODULE TABLES
-- =============================================================================

-- Webinar Registrations table
CREATE TABLE IF NOT EXISTS webinar_registrations (
    id INT PRIMARY KEY AUTO_INCREMENT,
    webinar_id INT NOT NULL,
    contact_id INT,
    email VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone VARCHAR(50),
    custom_fields JSON,
    registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    attended BOOLEAN DEFAULT FALSE,
    attended_at TIMESTAMP NULL,
    watch_duration_seconds INT DEFAULT 0,
    INDEX idx_webinar (webinar_id),
    INDEX idx_email (email),
    INDEX idx_webinar_email (webinar_id, email)
);

-- Webinar Sessions table
CREATE TABLE IF NOT EXISTS webinar_sessions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    webinar_id INT NOT NULL,
    session_date DATETIME NOT NULL,
    duration_minutes INT,
    max_attendees INT,
    room_url VARCHAR(500),
    recording_url VARCHAR(500),
    status ENUM('scheduled', 'live', 'ended', 'cancelled') DEFAULT 'scheduled',
    actual_attendees INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_webinar (webinar_id),
    INDEX idx_session_date (session_date),
    INDEX idx_status (status)
);

-- Webinar Polls table
CREATE TABLE IF NOT EXISTS webinar_polls (
    id INT PRIMARY KEY AUTO_INCREMENT,
    webinar_id INT NOT NULL,
    question TEXT NOT NULL,
    options JSON,
    is_active BOOLEAN DEFAULT FALSE,
    show_results BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_webinar (webinar_id)
);

-- Webinar Poll Responses table
CREATE TABLE IF NOT EXISTS webinar_poll_responses (
    id INT PRIMARY KEY AUTO_INCREMENT,
    poll_id INT NOT NULL,
    registration_id INT NOT NULL,
    selected_option INT,
    response_text TEXT,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_poll (poll_id),
    INDEX idx_registration (registration_id)
);

-- Webinar Chat Messages table
CREATE TABLE IF NOT EXISTS webinar_chat_messages (
    id INT PRIMARY KEY AUTO_INCREMENT,
    webinar_id INT NOT NULL,
    session_id INT,
    registration_id INT,
    sender_name VARCHAR(255),
    message TEXT,
    is_question BOOLEAN DEFAULT FALSE,
    is_answered BOOLEAN DEFAULT FALSE,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_webinar (webinar_id),
    INDEX idx_session (session_id),
    INDEX idx_is_question (is_question)
);

-- =============================================================================
-- 5. LOYALTY PROGRAM TABLES
-- =============================================================================

-- Loyalty Members table
CREATE TABLE IF NOT EXISTS loyalty_members (
    id INT PRIMARY KEY AUTO_INCREMENT,
    program_id INT NOT NULL,
    contact_id INT NOT NULL,
    points_balance INT DEFAULT 0,
    lifetime_points INT DEFAULT 0,
    tier VARCHAR(50) DEFAULT 'bronze',
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_activity_at TIMESTAMP NULL,
    status ENUM('active', 'inactive', 'suspended') DEFAULT 'active',
    INDEX idx_program (program_id),
    INDEX idx_contact (contact_id),
    UNIQUE KEY unique_member (program_id, contact_id)
);

-- Loyalty Transactions table
CREATE TABLE IF NOT EXISTS loyalty_transactions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    member_id INT NOT NULL,
    transaction_type ENUM('earn', 'redeem', 'expire', 'adjust', 'bonus') NOT NULL,
    points INT NOT NULL,
    description VARCHAR(255),
    reference_type VARCHAR(50), -- 'purchase', 'referral', 'reward', etc.
    reference_id INT,
    balance_after INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_member (member_id),
    INDEX idx_member_date (member_id, created_at),
    INDEX idx_type (transaction_type)
);

-- Loyalty Rewards table
CREATE TABLE IF NOT EXISTS loyalty_rewards (
    id INT PRIMARY KEY AUTO_INCREMENT,
    program_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    points_required INT NOT NULL,
    reward_type ENUM('discount', 'product', 'service', 'voucher', 'experience') NOT NULL,
    reward_value DECIMAL(10,2),
    discount_percentage DECIMAL(5,2),
    stock_quantity INT,
    image_url VARCHAR(500),
    terms TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    starts_at TIMESTAMP NULL,
    expires_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_program (program_id),
    INDEX idx_active (is_active)
);

-- Loyalty Redemptions table
CREATE TABLE IF NOT EXISTS loyalty_redemptions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    member_id INT NOT NULL,
    reward_id INT NOT NULL,
    points_spent INT NOT NULL,
    status ENUM('pending', 'processing', 'fulfilled', 'cancelled') DEFAULT 'pending',
    redemption_code VARCHAR(100),
    redeemed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fulfilled_at TIMESTAMP NULL,
    notes TEXT,
    INDEX idx_member (member_id),
    INDEX idx_reward (reward_id),
    INDEX idx_status (status)
);

-- =============================================================================
-- 6. BLOG/CONTENT MANAGEMENT TABLES
-- =============================================================================

-- Blog Posts table
CREATE TABLE IF NOT EXISTS blog_posts (
    id INT PRIMARY KEY AUTO_INCREMENT,
    workspace_id INT NOT NULL,
    website_id INT,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL,
    content LONGTEXT,
    excerpt TEXT,
    featured_image VARCHAR(500),
    author_id INT,
    status ENUM('draft', 'published', 'scheduled', 'archived') DEFAULT 'draft',
    published_at TIMESTAMP NULL,
    scheduled_at TIMESTAMP NULL,
    seo_title VARCHAR(255),
    seo_description TEXT,
    seo_keywords TEXT,
    view_count INT DEFAULT 0,
    allow_comments BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_workspace (workspace_id),
    INDEX idx_website (website_id),
    INDEX idx_status (status),
    INDEX idx_published (published_at),
    UNIQUE KEY unique_slug (workspace_id, slug)
);

-- Blog Categories table
CREATE TABLE IF NOT EXISTS blog_categories (
    id INT PRIMARY KEY AUTO_INCREMENT,
    workspace_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL,
    description TEXT,
    parent_id INT,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_workspace (workspace_id),
    INDEX idx_parent (parent_id),
    UNIQUE KEY unique_category_slug (workspace_id, slug)
);

-- Blog Post Categories (Many-to-Many)
CREATE TABLE IF NOT EXISTS blog_post_categories (
    post_id INT NOT NULL,
    category_id INT NOT NULL,
    PRIMARY KEY (post_id, category_id),
    INDEX idx_category (category_id)
);

-- Blog Tags table
CREATE TABLE IF NOT EXISTS blog_tags (
    id INT PRIMARY KEY AUTO_INCREMENT,
    workspace_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_workspace (workspace_id),
    UNIQUE KEY unique_tag_slug (workspace_id, slug)
);

-- Blog Post Tags (Many-to-Many)
CREATE TABLE IF NOT EXISTS blog_post_tags (
    post_id INT NOT NULL,
    tag_id INT NOT NULL,
    PRIMARY KEY (post_id, tag_id),
    INDEX idx_tag (tag_id)
);

-- Blog Comments table
CREATE TABLE IF NOT EXISTS blog_comments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    post_id INT NOT NULL,
    author_name VARCHAR(255),
    author_email VARCHAR(255),
    author_ip VARCHAR(45),
    author_user_id INT,
    content TEXT NOT NULL,
    status ENUM('pending', 'approved', 'spam', 'trash') DEFAULT 'pending',
    parent_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_post (post_id),
    INDEX idx_status (status),
    INDEX idx_parent (parent_id)
);

-- =============================================================================
-- 7. SOCIAL MEDIA PLANNER TABLES
-- =============================================================================

-- Social Accounts table
CREATE TABLE IF NOT EXISTS social_accounts (
    id INT PRIMARY KEY AUTO_INCREMENT,
    workspace_id INT NOT NULL,
    platform ENUM('facebook', 'instagram', 'twitter', 'linkedin', 'tiktok', 'youtube', 'pinterest') NOT NULL,
    account_name VARCHAR(255),
    account_id VARCHAR(255),
    profile_url VARCHAR(500),
    avatar_url VARCHAR(500),
    access_token TEXT,
    refresh_token TEXT,
    token_expires_at TIMESTAMP NULL,
    is_active BOOLEAN DEFAULT TRUE,
    connected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_synced_at TIMESTAMP NULL,
    INDEX idx_workspace (workspace_id),
    INDEX idx_platform (platform),
    INDEX idx_active (is_active)
);

-- Social Posts table
CREATE TABLE IF NOT EXISTS social_posts (
    id INT PRIMARY KEY AUTO_INCREMENT,
    workspace_id INT NOT NULL,
    content TEXT NOT NULL,
    media_urls JSON,
    scheduled_at TIMESTAMP NULL,
    published_at TIMESTAMP NULL,
    status ENUM('draft', 'scheduled', 'publishing', 'published', 'failed') DEFAULT 'draft',
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_workspace (workspace_id),
    INDEX idx_status (status),
    INDEX idx_scheduled (scheduled_at)
);

-- Social Post Accounts (Many-to-Many for multi-platform posting)
CREATE TABLE IF NOT EXISTS social_post_accounts (
    id INT PRIMARY KEY AUTO_INCREMENT,
    post_id INT NOT NULL,
    account_id INT NOT NULL,
    platform_post_id VARCHAR(255),
    status ENUM('pending', 'published', 'failed') DEFAULT 'pending',
    error_message TEXT,
    published_at TIMESTAMP NULL,
    INDEX idx_post (post_id),
    INDEX idx_account (account_id)
);

-- Social Post Analytics table
CREATE TABLE IF NOT EXISTS social_post_analytics (
    id INT PRIMARY KEY AUTO_INCREMENT,
    post_id INT NOT NULL,
    account_id INT NOT NULL,
    likes INT DEFAULT 0,
    comments INT DEFAULT 0,
    shares INT DEFAULT 0,
    impressions INT DEFAULT 0,
    reach INT DEFAULT 0,
    clicks INT DEFAULT 0,
    engagement_rate DECIMAL(5,2),
    last_synced_at TIMESTAMP NULL,
    INDEX idx_post (post_id),
    UNIQUE KEY unique_post_account (post_id, account_id)
);

-- =============================================================================
-- 8. LEAD MARKETPLACE ENHANCEMENT TABLES
-- =============================================================================

-- Marketplace Lead Bids table
CREATE TABLE IF NOT EXISTS marketplace_lead_bids (
    id INT PRIMARY KEY AUTO_INCREMENT,
    lead_id INT NOT NULL,
    workspace_id INT NOT NULL,
    bid_amount DECIMAL(10,2) NOT NULL,
    message TEXT,
    status ENUM('pending', 'accepted', 'rejected', 'expired', 'withdrawn') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NULL,
    responded_at TIMESTAMP NULL,
    INDEX idx_lead (lead_id),
    INDEX idx_workspace (workspace_id),
    INDEX idx_status (status)
);

-- Marketplace Reviews table
CREATE TABLE IF NOT EXISTS marketplace_reviews (
    id INT PRIMARY KEY AUTO_INCREMENT,
    purchase_id INT NOT NULL,
    reviewer_id INT NOT NULL,
    reviewee_id INT NOT NULL,
    rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    review_text TEXT,
    lead_quality_rating INT,
    response_time_rating INT,
    communication_rating INT,
    would_recommend BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_purchase (purchase_id),
    INDEX idx_reviewee (reviewee_id)
);

-- Marketplace Disputes table
CREATE TABLE IF NOT EXISTS marketplace_disputes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    purchase_id INT NOT NULL,
    opened_by INT NOT NULL,
    reason TEXT NOT NULL,
    evidence JSON,
    status ENUM('open', 'investigating', 'resolved', 'rejected', 'escalated') DEFAULT 'open',
    resolution TEXT,
    refund_amount DECIMAL(10,2),
    assigned_to INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP NULL,
    INDEX idx_purchase (purchase_id),
    INDEX idx_status (status)
);

-- =============================================================================
-- 9. CONSUMER FINANCING TABLES
-- =============================================================================

-- Financing Applications table
CREATE TABLE IF NOT EXISTS financing_applications (
    id INT PRIMARY KEY AUTO_INCREMENT,
    workspace_id INT NOT NULL,
    contact_id INT,
    applicant_name VARCHAR(255) NOT NULL,
    applicant_email VARCHAR(255),
    applicant_phone VARCHAR(50),
    requested_amount DECIMAL(10,2) NOT NULL,
    purpose TEXT,
    credit_score INT,
    employment_status VARCHAR(100),
    annual_income DECIMAL(12,2),
    status ENUM('draft', 'pending', 'approved', 'declined', 'cancelled', 'expired') DEFAULT 'draft',
    provider VARCHAR(100), -- 'affirm', 'klarna', 'paypal_credit', etc.
    provider_application_id VARCHAR(255),
    approved_amount DECIMAL(10,2),
    interest_rate DECIMAL(5,2),
    term_months INT,
    monthly_payment DECIMAL(10,2),
    applied_at TIMESTAMP NULL,
    decision_at TIMESTAMP NULL,
    expires_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_workspace (workspace_id),
    INDEX idx_contact (contact_id),
    INDEX idx_status (status),
    INDEX idx_provider (provider)
);

-- Financing Plans table
CREATE TABLE IF NOT EXISTS financing_plans (
    id INT PRIMARY KEY AUTO_INCREMENT,
    workspace_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    provider VARCHAR(100),
    min_amount DECIMAL(10,2),
    max_amount DECIMAL(10,2),
    interest_rate DECIMAL(5,2),
    term_months INT,
    deferred_interest_months INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_workspace (workspace_id),
    INDEX idx_provider (provider),
    INDEX idx_active (is_active)
);

-- =============================================================================
-- 10. E-SIGNATURE TABLES
-- =============================================================================

-- Signature Documents table
CREATE TABLE IF NOT EXISTS signature_documents (
    id INT PRIMARY KEY AUTO_INCREMENT,
    workspace_id INT NOT NULL,
    document_type VARCHAR(100), -- 'proposal', 'contract', 'estimate', etc.
    reference_type VARCHAR(50),
    reference_id INT,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    document_url VARCHAR(500),
    original_filename VARCHAR(255),
    status ENUM('draft', 'sent', 'viewed', 'partially_signed', 'signed', 'declined', 'expired', 'cancelled') DEFAULT 'draft',
    created_by INT,
    sent_at TIMESTAMP NULL,
    expires_at TIMESTAMP NULL,
    completed_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_workspace (workspace_id),
    INDEX idx_status (status),
    INDEX idx_reference (reference_type, reference_id)
);

-- Signature Recipients table
CREATE TABLE IF NOT EXISTS signature_recipients (
    id INT PRIMARY KEY AUTO_INCREMENT,
    document_id INT NOT NULL,
    contact_id INT,
    email VARCHAR(255) NOT NULL,
    name VARCHAR(255),
    role ENUM('signer', 'cc', 'approver', 'viewer') DEFAULT 'signer',
    signing_order INT DEFAULT 1,
    status ENUM('pending', 'sent', 'viewed', 'signed', 'declined') DEFAULT 'pending',
    access_token VARCHAR(255) UNIQUE,
    signature_data TEXT,
    ip_address VARCHAR(45),
    user_agent TEXT,
    signed_at TIMESTAMP NULL,
    viewed_at TIMESTAMP NULL,
    declined_reason TEXT,
    INDEX idx_document (document_id),
    INDEX idx_contact (contact_id),
    INDEX idx_status (status),
    INDEX idx_access_token (access_token)
);

-- Signature Fields table
CREATE TABLE IF NOT EXISTS signature_fields (
    id INT PRIMARY KEY AUTO_INCREMENT,
    document_id INT NOT NULL,
    recipient_id INT NOT NULL,
    field_type ENUM('signature', 'initial', 'date', 'text', 'checkbox', 'dropdown') NOT NULL,
    field_label VARCHAR(255),
    position_x INT,
    position_y INT,
    width INT,
    height INT,
    page_number INT DEFAULT 1,
    is_required BOOLEAN DEFAULT TRUE,
    placeholder VARCHAR(255),
    options JSON, -- For dropdown fields
    value TEXT,
    filled_at TIMESTAMP NULL,
    INDEX idx_document (document_id),
    INDEX idx_recipient (recipient_id)
);

-- Signature Audit Trail table
CREATE TABLE IF NOT EXISTS signature_audit_trail (
    id INT PRIMARY KEY AUTO_INCREMENT,
    document_id INT NOT NULL,
    recipient_id INT,
    action VARCHAR(100) NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    metadata JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_document (document_id),
    INDEX idx_action (action)
);

-- =============================================================================
-- DONE: All missing tables created
-- =============================================================================
