-- Comprehensive Google Business Profile / Google My Business Tables
-- Full integration support for GBP management

-- Main GBP Connection/Account table (enhanced)
CREATE TABLE IF NOT EXISTS gmb_connections (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    company_id INT NULL,
    
    -- OAuth credentials
    access_token TEXT NULL COMMENT 'Encrypted access token',
    refresh_token TEXT NULL COMMENT 'Encrypted refresh token',
    token_expires_at TIMESTAMP NULL,
    
    -- Google account info
    google_account_id VARCHAR(255) NULL,
    google_email VARCHAR(255) NULL,
    google_name VARCHAR(255) NULL,
    google_avatar_url VARCHAR(500) NULL,
    
    -- Connection status
    status ENUM('pending', 'connected', 'expired', 'revoked', 'error') DEFAULT 'pending',
    connection_error TEXT NULL,
    
    -- Permissions
    scopes JSON NULL COMMENT 'Authorized OAuth scopes',
    
    -- Timestamps
    connected_at TIMESTAMP NULL,
    last_sync_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE KEY uk_workspace_company (workspace_id, company_id),
    INDEX idx_gmb_conn_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- GBP Locations (Businesses)
CREATE TABLE IF NOT EXISTS gmb_locations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    company_id INT NULL,
    connection_id INT NOT NULL,
    
    -- Google identifiers
    google_location_id VARCHAR(255) NOT NULL COMMENT 'accounts/xxx/locations/xxx',
    google_place_id VARCHAR(255) NULL COMMENT 'Google Maps Place ID',
    maps_url VARCHAR(500) NULL,
    
    -- Basic business info
    business_name VARCHAR(255) NOT NULL,
    store_code VARCHAR(100) NULL,
    
    -- Address
    address_line_1 VARCHAR(255) NULL,
    address_line_2 VARCHAR(255) NULL,
    city VARCHAR(100) NULL,
    state VARCHAR(100) NULL,
    postal_code VARCHAR(20) NULL,
    country VARCHAR(2) DEFAULT 'US',
    latitude DECIMAL(10,7) NULL,
    longitude DECIMAL(10,7) NULL,
    
    -- Contact
    primary_phone VARCHAR(20) NULL,
    additional_phones JSON NULL,
    website_url VARCHAR(500) NULL,
    
    -- Categories
    primary_category_id VARCHAR(100) NULL,
    primary_category_name VARCHAR(255) NULL,
    additional_categories JSON NULL,
    
    -- Business description
    description TEXT NULL,
    
    -- Opening date
    opening_date DATE NULL,
    
    -- Status
    verification_status ENUM('unverified', 'pending', 'verified', 'suspended') DEFAULT 'unverified',
    verification_method VARCHAR(50) NULL,
    is_published TINYINT(1) DEFAULT 1,
    is_suspended TINYINT(1) DEFAULT 0,
    suspension_reason TEXT NULL,
    
    -- Labels/Tags
    labels JSON NULL,
    
    -- Metrics (cached)
    total_reviews INT DEFAULT 0,
    average_rating DECIMAL(2,1) NULL,
    total_photos INT DEFAULT 0,
    
    -- Sync status
    last_sync_at TIMESTAMP NULL,
    sync_status ENUM('synced', 'syncing', 'error', 'pending') DEFAULT 'pending',
    sync_error TEXT NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE KEY uk_google_location (workspace_id, google_location_id),
    INDEX idx_gmb_loc_workspace (workspace_id, company_id),
    INDEX idx_gmb_loc_status (verification_status),
    FOREIGN KEY (connection_id) REFERENCES gmb_connections(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- GBP Business Hours
CREATE TABLE IF NOT EXISTS gmb_business_hours (
    id INT AUTO_INCREMENT PRIMARY KEY,
    location_id INT NOT NULL,
    
    -- Regular hours
    hours_type ENUM('regular', 'special', 'holiday') DEFAULT 'regular',
    day_of_week TINYINT NULL COMMENT '0=Sunday, 6=Saturday',
    
    -- Time periods (can have multiple per day)
    open_time TIME NULL,
    close_time TIME NULL,
    is_closed TINYINT(1) DEFAULT 0,
    is_24_hours TINYINT(1) DEFAULT 0,
    
    -- Special hours specific
    special_date DATE NULL COMMENT 'For special/holiday hours',
    special_name VARCHAR(255) NULL COMMENT 'Holiday name or reason',
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_gmb_hours_location (location_id, hours_type),
    FOREIGN KEY (location_id) REFERENCES gmb_locations(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- GBP Services
CREATE TABLE IF NOT EXISTS gmb_services (
    id INT AUTO_INCREMENT PRIMARY KEY,
    location_id INT NOT NULL,
    
    -- Service details
    service_type_id VARCHAR(100) NULL COMMENT 'Google service type ID',
    service_name VARCHAR(255) NOT NULL,
    description TEXT NULL,
    
    -- Pricing
    price_type ENUM('free', 'fixed', 'from', 'range', 'no_price') DEFAULT 'no_price',
    price_min DECIMAL(10,2) NULL,
    price_max DECIMAL(10,2) NULL,
    currency_code VARCHAR(3) DEFAULT 'USD',
    
    -- Status
    is_active TINYINT(1) DEFAULT 1,
    display_order INT DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_gmb_services_location (location_id),
    FOREIGN KEY (location_id) REFERENCES gmb_locations(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- GBP Products
CREATE TABLE IF NOT EXISTS gmb_products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    location_id INT NOT NULL,
    
    -- Product details
    google_product_id VARCHAR(255) NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT NULL,
    
    -- Pricing
    price DECIMAL(10,2) NULL,
    currency_code VARCHAR(3) DEFAULT 'USD',
    
    -- Category
    category_id VARCHAR(100) NULL,
    category_name VARCHAR(255) NULL,
    
    -- Media
    photo_url VARCHAR(500) NULL,
    
    -- Status
    is_active TINYINT(1) DEFAULT 1,
    display_order INT DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_gmb_products_location (location_id),
    FOREIGN KEY (location_id) REFERENCES gmb_locations(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- GBP Photos
CREATE TABLE IF NOT EXISTS gmb_photos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    location_id INT NOT NULL,
    
    -- Google reference
    google_photo_id VARCHAR(255) NULL,
    google_photo_url VARCHAR(1000) NULL,
    
    -- Local/uploaded reference
    local_file_path VARCHAR(500) NULL,
    
    -- Photo details
    category ENUM('profile', 'cover', 'logo', 'exterior', 'interior', 'product', 'at_work', 'food_drink', 'menu', 'common_area', 'rooms', 'teams', 'additional') DEFAULT 'additional',
    description VARCHAR(500) NULL,
    
    -- Dimensions
    width INT NULL,
    height INT NULL,
    
    -- Status
    status ENUM('pending', 'uploaded', 'live', 'rejected', 'deleted') DEFAULT 'pending',
    rejection_reason TEXT NULL,
    
    -- Stats
    view_count INT DEFAULT 0,
    
    uploaded_by INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_gmb_photos_location (location_id, category),
    FOREIGN KEY (location_id) REFERENCES gmb_locations(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- GBP Posts (enhanced from existing)
CREATE TABLE IF NOT EXISTS gmb_posts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    location_id INT NOT NULL,
    
    -- Google reference
    google_post_id VARCHAR(255) NULL,
    
    -- Post content
    post_type ENUM('standard', 'event', 'offer', 'product', 'alert', 'covid') DEFAULT 'standard',
    topic_type ENUM('standard', 'event', 'offer', 'product', 'alert') DEFAULT 'standard',
    summary TEXT NOT NULL,
    
    -- Media
    media_type ENUM('photo', 'video') NULL,
    media_url VARCHAR(500) NULL,
    media_source_url VARCHAR(500) NULL COMMENT 'Original source before upload',
    
    -- Call to action
    action_type ENUM('action_type_unspecified', 'book', 'order', 'shop', 'learn_more', 'sign_up', 'call', 'get_offer') NULL,
    action_url VARCHAR(500) NULL,
    
    -- Event details
    event_title VARCHAR(255) NULL,
    event_start_date DATE NULL,
    event_start_time TIME NULL,
    event_end_date DATE NULL,
    event_end_time TIME NULL,
    
    -- Offer details
    offer_coupon_code VARCHAR(50) NULL,
    offer_redeem_url VARCHAR(500) NULL,
    offer_terms TEXT NULL,
    
    -- Scheduling
    status ENUM('draft', 'scheduled', 'publishing', 'published', 'failed', 'expired', 'deleted') DEFAULT 'draft',
    scheduled_at TIMESTAMP NULL,
    published_at TIMESTAMP NULL,
    expires_at TIMESTAMP NULL,
    error_message TEXT NULL,
    
    -- Metrics
    views INT DEFAULT 0,
    clicks INT DEFAULT 0,
    
    -- Audit
    created_by INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_gmb_posts_location (location_id, status),
    INDEX idx_gmb_posts_scheduled (status, scheduled_at),
    FOREIGN KEY (location_id) REFERENCES gmb_locations(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- GBP Reviews (synced from Google)
CREATE TABLE IF NOT EXISTS gmb_reviews (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    location_id INT NOT NULL,
    
    -- Google reference
    google_review_id VARCHAR(255) NOT NULL,
    
    -- Reviewer info
    reviewer_display_name VARCHAR(255) NULL,
    reviewer_profile_photo_url VARCHAR(500) NULL,
    reviewer_is_anonymous TINYINT(1) DEFAULT 0,
    
    -- Review content
    star_rating TINYINT NOT NULL COMMENT '1-5',
    comment TEXT NULL,
    
    -- Response
    reply_text TEXT NULL,
    replied_at TIMESTAMP NULL,
    replied_by INT NULL,
    
    -- Status
    status ENUM('new', 'read', 'responded', 'flagged') DEFAULT 'new',
    is_flagged TINYINT(1) DEFAULT 0,
    flag_reason TEXT NULL,
    
    -- AI Analysis
    sentiment ENUM('positive', 'neutral', 'negative') NULL,
    sentiment_score DECIMAL(3,2) NULL,
    key_topics JSON NULL,
    suggested_response TEXT NULL,
    
    -- Timestamps
    review_date TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE KEY uk_google_review (location_id, google_review_id),
    INDEX idx_gmb_reviews_location (location_id, status),
    INDEX idx_gmb_reviews_rating (location_id, star_rating),
    FOREIGN KEY (location_id) REFERENCES gmb_locations(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- GBP Q&A
CREATE TABLE IF NOT EXISTS gmb_questions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    location_id INT NOT NULL,
    
    -- Google reference
    google_question_id VARCHAR(255) NOT NULL,
    
    -- Question content
    question_text TEXT NOT NULL,
    author_display_name VARCHAR(255) NULL,
    author_profile_photo_url VARCHAR(500) NULL,
    author_type ENUM('customer', 'merchant', 'local_guide') DEFAULT 'customer',
    
    -- Status
    status ENUM('unanswered', 'answered', 'flagged') DEFAULT 'unanswered',
    total_answers INT DEFAULT 0,
    upvote_count INT DEFAULT 0,
    
    -- Timestamps
    question_date TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE KEY uk_google_question (location_id, google_question_id),
    INDEX idx_gmb_questions_location (location_id, status),
    FOREIGN KEY (location_id) REFERENCES gmb_locations(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- GBP Q&A Answers
CREATE TABLE IF NOT EXISTS gmb_answers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    question_id INT NOT NULL,
    
    -- Google reference
    google_answer_id VARCHAR(255) NOT NULL,
    
    -- Answer content
    answer_text TEXT NOT NULL,
    author_display_name VARCHAR(255) NULL,
    author_profile_photo_url VARCHAR(500) NULL,
    author_type ENUM('customer', 'merchant', 'local_guide') DEFAULT 'customer',
    is_owner_answer TINYINT(1) DEFAULT 0,
    
    -- Stats
    upvote_count INT DEFAULT 0,
    
    -- Timestamps
    answer_date TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE KEY uk_google_answer (question_id, google_answer_id),
    FOREIGN KEY (question_id) REFERENCES gmb_questions(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- GBP Insights/Analytics
CREATE TABLE IF NOT EXISTS gmb_insights (
    id INT AUTO_INCREMENT PRIMARY KEY,
    location_id INT NOT NULL,
    
    -- Time period
    date DATE NOT NULL,
    period_type ENUM('day', 'week', 'month') DEFAULT 'day',
    
    -- Search metrics
    queries_direct INT DEFAULT 0 COMMENT 'Direct searches',
    queries_indirect INT DEFAULT 0 COMMENT 'Discovery searches',
    queries_chain INT DEFAULT 0 COMMENT 'Branded searches',
    
    -- View metrics
    views_maps INT DEFAULT 0,
    views_search INT DEFAULT 0,
    
    -- Action metrics
    actions_website INT DEFAULT 0,
    actions_phone INT DEFAULT 0,
    actions_driving_directions INT DEFAULT 0,
    actions_menu INT DEFAULT 0,
    actions_booking INT DEFAULT 0,
    actions_orders INT DEFAULT 0,
    
    -- Photo metrics
    photo_views_merchant INT DEFAULT 0,
    photo_views_customer INT DEFAULT 0,
    
    -- Direction requests by region
    direction_requests JSON NULL,
    
    -- Search keywords
    search_keywords JSON NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE KEY uk_location_date (location_id, date, period_type),
    INDEX idx_gmb_insights_location (location_id, date DESC),
    FOREIGN KEY (location_id) REFERENCES gmb_locations(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- GBP Attributes (business features/amenities)
CREATE TABLE IF NOT EXISTS gmb_attributes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    location_id INT NOT NULL,
    
    -- Attribute details
    attribute_id VARCHAR(100) NOT NULL COMMENT 'Google attribute ID',
    attribute_name VARCHAR(255) NOT NULL,
    attribute_group VARCHAR(100) NULL,
    
    -- Value
    value_type ENUM('boolean', 'enum', 'repeated_enum', 'url') DEFAULT 'boolean',
    value_boolean TINYINT(1) NULL,
    value_enum VARCHAR(255) NULL,
    value_repeated_enum JSON NULL,
    value_url VARCHAR(500) NULL,
    
    is_editable TINYINT(1) DEFAULT 1,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE KEY uk_location_attribute (location_id, attribute_id),
    FOREIGN KEY (location_id) REFERENCES gmb_locations(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- GBP Sync Log
CREATE TABLE IF NOT EXISTS gmb_sync_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    location_id INT NULL,
    
    -- Sync details
    sync_type ENUM('full', 'incremental', 'reviews', 'posts', 'insights', 'photos', 'qa') NOT NULL,
    status ENUM('started', 'completed', 'failed', 'partial') DEFAULT 'started',
    
    -- Results
    items_synced INT DEFAULT 0,
    items_created INT DEFAULT 0,
    items_updated INT DEFAULT 0,
    items_deleted INT DEFAULT 0,
    errors JSON NULL,
    
    -- Timing
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL,
    duration_seconds INT NULL,
    
    INDEX idx_gmb_sync_workspace (workspace_id, sync_type, started_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- GBP Settings per workspace
CREATE TABLE IF NOT EXISTS gmb_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    
    -- Auto-sync settings
    auto_sync_enabled TINYINT(1) DEFAULT 1,
    sync_interval_minutes INT DEFAULT 60,
    
    -- Review management
    auto_reply_enabled TINYINT(1) DEFAULT 0,
    auto_reply_min_rating TINYINT DEFAULT 4 COMMENT 'Auto-reply to reviews with rating >= this',
    auto_reply_templates JSON NULL,
    
    -- Notification settings
    notify_new_reviews TINYINT(1) DEFAULT 1,
    notify_new_questions TINYINT(1) DEFAULT 1,
    notify_low_ratings TINYINT(1) DEFAULT 1,
    low_rating_threshold TINYINT DEFAULT 3,
    notification_email VARCHAR(255) NULL,
    
    -- Post scheduling
    default_post_timezone VARCHAR(50) DEFAULT 'America/New_York',
    auto_expire_posts TINYINT(1) DEFAULT 1,
    default_post_expiry_days INT DEFAULT 7,
    
    -- AI settings
    ai_suggested_responses TINYINT(1) DEFAULT 1,
    ai_sentiment_analysis TINYINT(1) DEFAULT 1,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE KEY uk_workspace (workspace_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- GBP Verification Requests
CREATE TABLE IF NOT EXISTS gmb_verifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    location_id INT NOT NULL,
    
    -- Verification method
    method ENUM('postcard', 'phone', 'email', 'video', 'live_video') NOT NULL,
    
    -- Request details
    phone_number VARCHAR(20) NULL,
    email_address VARCHAR(255) NULL,
    address_data JSON NULL,
    
    -- Status
    status ENUM('requested', 'pending', 'verified', 'failed', 'expired') DEFAULT 'requested',
    verification_code VARCHAR(10) NULL,
    expires_at TIMESTAMP NULL,
    
    -- Timestamps
    requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL,
    
    INDEX idx_gmb_verifications_location (location_id, status),
    FOREIGN KEY (location_id) REFERENCES gmb_locations(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default GMB categories for reference
CREATE TABLE IF NOT EXISTS gmb_categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    category_id VARCHAR(100) NOT NULL COMMENT 'Google category ID like gcid:restaurant',
    display_name VARCHAR(255) NOT NULL,
    parent_category_id VARCHAR(100) NULL,
    
    -- Metadata
    service_types JSON NULL COMMENT 'Available service types for this category',
    more_hours_types JSON NULL,
    
    -- Status
    is_gbp_category TINYINT(1) DEFAULT 1,
    is_active TINYINT(1) DEFAULT 1,
    
    UNIQUE KEY uk_category_id (category_id),
    INDEX idx_gmb_categories_parent (parent_category_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Sample categories
INSERT INTO gmb_categories (category_id, display_name, parent_category_id) VALUES
('gcid:restaurant', 'Restaurant', NULL),
('gcid:plumber', 'Plumber', NULL),
('gcid:electrician', 'Electrician', NULL),
('gcid:hvac_contractor', 'HVAC Contractor', NULL),
('gcid:roofing_contractor', 'Roofing Contractor', NULL),
('gcid:lawyer', 'Lawyer', NULL),
('gcid:dentist', 'Dentist', NULL),
('gcid:doctor', 'Doctor', NULL),
('gcid:real_estate_agency', 'Real Estate Agency', NULL),
('gcid:car_dealer', 'Car Dealer', NULL),
('gcid:gym', 'Gym', NULL),
('gcid:spa', 'Spa', NULL),
('gcid:hair_salon', 'Hair Salon', NULL),
('gcid:insurance_agency', 'Insurance Agency', NULL),
('gcid:accounting_firm', 'Accounting Firm', NULL)
ON DUPLICATE KEY UPDATE display_name = VALUES(display_name);
