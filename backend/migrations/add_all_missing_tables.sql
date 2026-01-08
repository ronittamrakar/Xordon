-- Comprehensive Migration: Add All Missing Tables
-- Generated: 2025-12-25
-- This migration creates all missing tables identified by the database audit

-- ============================================
-- 1. LISTINGS/SEO TABLES
-- ============================================

-- Directory Catalog (master list of available directories)
CREATE TABLE IF NOT EXISTS directory_catalog (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    domain VARCHAR(255) NOT NULL,
    category VARCHAR(50) DEFAULT 'general',
    description TEXT NULL,
    logo_url VARCHAR(500) NULL,
    submission_url VARCHAR(500) NULL,
    api_supported TINYINT(1) DEFAULT 0,
    manual_submission TINYINT(1) DEFAULT 1,
    priority INT DEFAULT 0,
    domain_authority INT NULL,
    monthly_visitors INT NULL,
    is_free TINYINT(1) DEFAULT 0,
    is_active TINYINT(1) DEFAULT 1,
    countries JSON NULL COMMENT 'Supported countries',
    industries JSON NULL COMMENT 'Relevant industries',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_directory_domain (domain),
    INDEX idx_directory_category (category, is_active),
    INDEX idx_directory_priority (priority DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Listing Sync Jobs
CREATE TABLE IF NOT EXISTS listing_sync_jobs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    company_id INT NULL,
    listing_id INT NULL,
    directory_id INT NULL,
    job_type ENUM('create', 'update', 'verify', 'claim', 'sync') DEFAULT 'sync',
    status ENUM('pending', 'running', 'completed', 'failed', 'cancelled') DEFAULT 'pending',
    priority INT DEFAULT 0,
    payload JSON NULL,
    result JSON NULL,
    error_message TEXT NULL,
    attempts INT DEFAULT 0,
    max_attempts INT DEFAULT 3,
    scheduled_at TIMESTAMP NULL,
    started_at TIMESTAMP NULL,
    completed_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_sync_jobs_status (workspace_id, status, priority DESC),
    INDEX idx_sync_jobs_scheduled (status, scheduled_at),
    FOREIGN KEY (listing_id) REFERENCES business_listings(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Rank Tracking
CREATE TABLE IF NOT EXISTS rank_tracking (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    company_id INT NULL,
    keyword VARCHAR(255) NOT NULL,
    search_engine ENUM('google', 'bing', 'yahoo', 'duckduckgo') DEFAULT 'google',
    location VARCHAR(255) NULL COMMENT 'Location for local SEO',
    current_rank INT NULL,
    previous_rank INT NULL,
    best_rank INT NULL,
    url_ranked VARCHAR(500) NULL,
    search_volume INT NULL,
    difficulty INT NULL,
    checked_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_rank_tracking_workspace (workspace_id, company_id),
    INDEX idx_rank_tracking_keyword (workspace_id, keyword),
    INDEX idx_rank_tracking_checked (checked_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 2. COMPETITOR ANALYSIS TABLES
-- ============================================

-- Competitors
CREATE TABLE IF NOT EXISTS competitors (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    company_id INT NULL,
    name VARCHAR(255) NOT NULL,
    website VARCHAR(500) NULL,
    phone VARCHAR(20) NULL,
    address VARCHAR(500) NULL,
    city VARCHAR(100) NULL,
    state VARCHAR(100) NULL,
    postal_code VARCHAR(20) NULL,
    country VARCHAR(2) DEFAULT 'US',
    category VARCHAR(100) NULL,
    google_place_id VARCHAR(255) NULL,
    google_rating DECIMAL(2,1) NULL,
    google_reviews_count INT DEFAULT 0,
    notes TEXT NULL,
    status ENUM('active', 'archived') DEFAULT 'active',
    last_analyzed_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_competitors_workspace (workspace_id, company_id),
    INDEX idx_competitors_status (workspace_id, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Competitor Citations
CREATE TABLE IF NOT EXISTS competitor_citations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    competitor_id INT NOT NULL,
    workspace_id INT NOT NULL,
    directory_name VARCHAR(100) NOT NULL,
    directory_url VARCHAR(500) NULL,
    listing_url VARCHAR(500) NULL,
    business_name VARCHAR(255) NULL,
    address VARCHAR(500) NULL,
    phone VARCHAR(20) NULL,
    website VARCHAR(500) NULL,
    is_verified TINYINT(1) DEFAULT 0,
    has_our_listing TINYINT(1) DEFAULT 0,
    our_listing_id INT NULL,
    priority INT DEFAULT 0 COMMENT 'Higher = more important directory',
    domain_authority INT NULL,
    discovered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_checked_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_competitor_citations_competitor (competitor_id),
    INDEX idx_competitor_citations_directory (workspace_id, directory_name),
    FOREIGN KEY (competitor_id) REFERENCES competitors(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Citation Sources (list of known directories for citation building)
CREATE TABLE IF NOT EXISTS citation_sources (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    domain VARCHAR(255) NOT NULL,
    category ENUM('aggregator', 'local', 'industry', 'social', 'general') DEFAULT 'general',
    description TEXT NULL,
    domain_authority INT NULL,
    monthly_traffic INT NULL,
    is_free TINYINT(1) DEFAULT 0,
    submission_type ENUM('api', 'manual', 'aggregator') DEFAULT 'manual',
    submission_url VARCHAR(500) NULL,
    avg_approval_days INT NULL,
    countries JSON NULL,
    industries JSON NULL,
    priority INT DEFAULT 0,
    is_active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_citation_source_domain (domain),
    INDEX idx_citation_sources_category (category, is_active),
    INDEX idx_citation_sources_priority (priority DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 3. ADS MANAGER TABLES
-- ============================================

-- Ad Campaign Targeting
CREATE TABLE IF NOT EXISTS ad_campaigns_targeting (
    id INT AUTO_INCREMENT PRIMARY KEY,
    campaign_id INT NOT NULL,
    targeting_type ENUM('location', 'demographic', 'interest', 'keyword', 'audience', 'device', 'placement') NOT NULL,
    operator ENUM('include', 'exclude') DEFAULT 'include',
    value JSON NOT NULL,
    is_active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_targeting_campaign (campaign_id, targeting_type),
    FOREIGN KEY (campaign_id) REFERENCES ad_campaigns(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Ad Campaign Schedule
CREATE TABLE IF NOT EXISTS ad_campaigns_schedule (
    id INT AUTO_INCREMENT PRIMARY KEY,
    campaign_id INT NOT NULL,
    day_of_week TINYINT NOT NULL COMMENT '0=Sunday, 6=Saturday',
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    bid_modifier DECIMAL(4,2) DEFAULT 1.00,
    is_active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_schedule_campaign (campaign_id),
    FOREIGN KEY (campaign_id) REFERENCES ad_campaigns(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Ad Creatives
CREATE TABLE IF NOT EXISTS ad_creatives (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    campaign_id INT NULL,
    ad_group_id INT NULL,
    name VARCHAR(255) NOT NULL,
    creative_type ENUM('image', 'video', 'text', 'carousel', 'responsive', 'html5') DEFAULT 'image',
    status ENUM('draft', 'pending', 'approved', 'rejected', 'active', 'paused') DEFAULT 'draft',
    
    -- Text components
    headline VARCHAR(255) NULL,
    headline_2 VARCHAR(255) NULL,
    headline_3 VARCHAR(255) NULL,
    description VARCHAR(500) NULL,
    description_2 VARCHAR(500) NULL,
    display_url VARCHAR(255) NULL,
    final_url VARCHAR(500) NULL,
    
    -- Media
    image_url VARCHAR(500) NULL,
    video_url VARCHAR(500) NULL,
    thumbnail_url VARCHAR(500) NULL,
    
    -- Call to action
    cta_text VARCHAR(50) NULL,
    cta_url VARCHAR(500) NULL,
    
    -- Tracking
    tracking_template VARCHAR(1000) NULL,
    utm_params JSON NULL,
    
    -- Performance
    impressions INT DEFAULT 0,
    clicks INT DEFAULT 0,
    conversions INT DEFAULT 0,
    spend DECIMAL(10,2) DEFAULT 0,
    
    -- Review
    review_status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    rejection_reason TEXT NULL,
    
    created_by INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_creatives_workspace (workspace_id, status),
    INDEX idx_creatives_campaign (campaign_id),
    FOREIGN KEY (campaign_id) REFERENCES ad_campaigns(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Ad Integrations
CREATE TABLE IF NOT EXISTS ad_integrations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    platform ENUM('google_ads', 'facebook', 'instagram', 'linkedin', 'twitter', 'tiktok', 'microsoft') NOT NULL,
    account_id VARCHAR(255) NULL,
    account_name VARCHAR(255) NULL,
    status ENUM('disconnected', 'pending', 'connected', 'error') DEFAULT 'disconnected',
    
    -- OAuth tokens (encrypted)
    access_token TEXT NULL,
    refresh_token TEXT NULL,
    token_expires_at TIMESTAMP NULL,
    
    -- Platform-specific settings
    settings JSON NULL,
    
    -- Sync status
    last_sync_at TIMESTAMP NULL,
    sync_error TEXT NULL,
    
    connected_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_ad_integration (workspace_id, platform),
    INDEX idx_ad_integrations_status (workspace_id, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 4. HELPDESK TABLES
-- ============================================

-- Tickets
CREATE TABLE IF NOT EXISTS tickets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    company_id INT NULL,
    contact_id INT NULL,
    
    -- Ticket details
    ticket_number VARCHAR(20) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    description TEXT NULL,
    
    -- Classification
    status ENUM('new', 'open', 'pending', 'on_hold', 'resolved', 'closed') DEFAULT 'new',
    priority ENUM('low', 'normal', 'high', 'urgent') DEFAULT 'normal',
    type ENUM('question', 'incident', 'problem', 'feature_request', 'task') DEFAULT 'question',
    
    -- Category
    category_id INT NULL,
    tags JSON NULL,
    
    -- Assignment
    team_id INT NULL,
    assigned_to INT NULL,
    
    -- Source
    source ENUM('email', 'web', 'phone', 'chat', 'api', 'internal') DEFAULT 'web',
    source_email VARCHAR(255) NULL,
    
    -- SLA
    sla_policy_id INT NULL,
    first_response_due_at TIMESTAMP NULL,
    resolution_due_at TIMESTAMP NULL,
    first_responded_at TIMESTAMP NULL,
    resolved_at TIMESTAMP NULL,
    sla_breached TINYINT(1) DEFAULT 0,
    
    -- Customer satisfaction
    csat_rating TINYINT NULL COMMENT '1-5',
    csat_feedback TEXT NULL,
    csat_submitted_at TIMESTAMP NULL,
    
    -- Metrics
    total_messages INT DEFAULT 0,
    
    created_by INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    closed_at TIMESTAMP NULL,
    
    UNIQUE KEY uk_ticket_number (workspace_id, ticket_number),
    INDEX idx_tickets_workspace (workspace_id, status),
    INDEX idx_tickets_assigned (assigned_to, status),
    INDEX idx_tickets_contact (contact_id),
    INDEX idx_tickets_priority (workspace_id, priority, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Ticket Messages
CREATE TABLE IF NOT EXISTS ticket_messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ticket_id INT NOT NULL,
    
    -- Message content
    message_type ENUM('reply', 'note', 'system', 'auto_reply') DEFAULT 'reply',
    content TEXT NOT NULL,
    content_html TEXT NULL,
    
    -- Sender
    sender_type ENUM('agent', 'customer', 'system') DEFAULT 'agent',
    sender_id INT NULL,
    sender_name VARCHAR(255) NULL,
    sender_email VARCHAR(255) NULL,
    
    -- Visibility
    is_private TINYINT(1) DEFAULT 0 COMMENT 'Internal note only',
    
    -- Attachments
    attachments JSON NULL,
    
    -- Email metadata
    email_message_id VARCHAR(255) NULL,
    email_in_reply_to VARCHAR(255) NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_ticket_messages_ticket (ticket_id, created_at),
    FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Ticket Teams
CREATE TABLE IF NOT EXISTS ticket_teams (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT NULL,
    email VARCHAR(255) NULL,
    auto_assign TINYINT(1) DEFAULT 0,
    assignment_method ENUM('round_robin', 'load_balanced', 'manual') DEFAULT 'manual',
    is_active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_ticket_teams_workspace (workspace_id, is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Ticket Categories
CREATE TABLE IF NOT EXISTS ticket_categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    parent_id INT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT NULL,
    color VARCHAR(7) DEFAULT '#6366F1',
    icon VARCHAR(50) NULL,
    default_team_id INT NULL,
    default_priority ENUM('low', 'normal', 'high', 'urgent') DEFAULT 'normal',
    sla_policy_id INT NULL,
    is_active TINYINT(1) DEFAULT 1,
    display_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_ticket_categories_workspace (workspace_id, is_active),
    INDEX idx_ticket_categories_parent (parent_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Canned Responses
CREATE TABLE IF NOT EXISTS canned_responses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    team_id INT NULL,
    user_id INT NULL COMMENT 'Personal canned response',
    
    name VARCHAR(100) NOT NULL,
    shortcut VARCHAR(50) NULL,
    subject VARCHAR(255) NULL,
    content TEXT NOT NULL,
    content_html TEXT NULL,
    
    -- Usage tracking
    usage_count INT DEFAULT 0,
    last_used_at TIMESTAMP NULL,
    
    is_active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_canned_responses_workspace (workspace_id, is_active),
    INDEX idx_canned_responses_shortcut (workspace_id, shortcut)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- SLA Policies
CREATE TABLE IF NOT EXISTS sla_policies (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT NULL,
    
    -- First Response SLA (minutes)
    first_response_low INT DEFAULT 480,
    first_response_normal INT DEFAULT 240,
    first_response_high INT DEFAULT 60,
    first_response_urgent INT DEFAULT 15,
    
    -- Resolution SLA (minutes)
    resolution_low INT DEFAULT 2880,
    resolution_normal INT DEFAULT 1440,
    resolution_high INT DEFAULT 480,
    resolution_urgent INT DEFAULT 120,
    
    -- Business hours
    use_business_hours TINYINT(1) DEFAULT 1,
    business_hours JSON NULL,
    timezone VARCHAR(50) DEFAULT 'America/New_York',
    
    -- Escalation
    escalation_enabled TINYINT(1) DEFAULT 0,
    escalation_rules JSON NULL,
    
    is_default TINYINT(1) DEFAULT 0,
    is_active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_sla_policies_workspace (workspace_id, is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Knowledge Base Articles
CREATE TABLE IF NOT EXISTS knowledge_base_articles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    category_id INT NULL,
    
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    content_html TEXT NULL,
    excerpt TEXT NULL,
    
    status ENUM('draft', 'published', 'archived') DEFAULT 'draft',
    visibility ENUM('public', 'private', 'internal') DEFAULT 'public',
    
    -- SEO
    meta_title VARCHAR(255) NULL,
    meta_description VARCHAR(500) NULL,
    
    -- Organization
    tags JSON NULL,
    related_articles JSON NULL,
    
    -- Metrics
    view_count INT DEFAULT 0,
    helpful_count INT DEFAULT 0,
    not_helpful_count INT DEFAULT 0,
    
    author_id INT NULL,
    published_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE KEY uk_kb_slug (workspace_id, slug),
    INDEX idx_kb_articles_workspace (workspace_id, status),
    INDEX idx_kb_articles_category (category_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 5. SOCIAL MEDIA TABLES
-- ============================================

-- Social Scheduled Posts
CREATE TABLE IF NOT EXISTS social_scheduled_posts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    company_id INT NULL,
    social_account_id INT NULL,
    
    -- Content
    content TEXT NOT NULL,
    media_urls JSON NULL,
    link_url VARCHAR(500) NULL,
    
    -- Platform settings
    platform ENUM('facebook', 'instagram', 'twitter', 'linkedin', 'tiktok', 'pinterest') NOT NULL,
    post_type ENUM('post', 'story', 'reel', 'carousel') DEFAULT 'post',
    
    -- Scheduling
    status ENUM('draft', 'scheduled', 'publishing', 'published', 'failed', 'cancelled') DEFAULT 'draft',
    scheduled_at TIMESTAMP NOT NULL,
    published_at TIMESTAMP NULL,
    
    -- Results
    platform_post_id VARCHAR(255) NULL,
    platform_post_url VARCHAR(500) NULL,
    error_message TEXT NULL,
    
    -- Metrics (cached)
    likes INT DEFAULT 0,
    comments INT DEFAULT 0,
    shares INT DEFAULT 0,
    reach INT DEFAULT 0,
    
    created_by INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_social_scheduled_workspace (workspace_id, status, scheduled_at),
    INDEX idx_social_scheduled_platform (platform, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 6. AFFILIATE TABLES
-- ============================================

-- Affiliate Links
CREATE TABLE IF NOT EXISTS affiliate_links (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    affiliate_id INT NOT NULL,
    
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) NOT NULL,
    destination_url VARCHAR(500) NOT NULL,
    
    -- Settings
    is_active TINYINT(1) DEFAULT 1,
    expires_at TIMESTAMP NULL,
    
    -- Tracking
    clicks INT DEFAULT 0,
    unique_clicks INT DEFAULT 0,
    conversions INT DEFAULT 0,
    revenue_generated DECIMAL(10,2) DEFAULT 0,
    
    -- Last activity
    last_clicked_at TIMESTAMP NULL,
    last_converted_at TIMESTAMP NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE KEY uk_affiliate_link_code (workspace_id, code),
    INDEX idx_affiliate_links_affiliate (affiliate_id, is_active),
    FOREIGN KEY (affiliate_id) REFERENCES affiliates(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 7. GMB TABLES (Google Business Profile)
-- ============================================

-- GMB Connection/Account table
CREATE TABLE IF NOT EXISTS gmb_connections (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    company_id INT NULL,
    access_token TEXT NULL,
    refresh_token TEXT NULL,
    token_expires_at TIMESTAMP NULL,
    google_account_id VARCHAR(255) NULL,
    google_email VARCHAR(255) NULL,
    google_name VARCHAR(255) NULL,
    google_avatar_url VARCHAR(500) NULL,
    status ENUM('pending', 'connected', 'expired', 'revoked', 'error') DEFAULT 'pending',
    connection_error TEXT NULL,
    scopes JSON NULL,
    connected_at TIMESTAMP NULL,
    last_sync_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_workspace_company (workspace_id, company_id),
    INDEX idx_gmb_conn_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- GMB Locations
CREATE TABLE IF NOT EXISTS gmb_locations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    company_id INT NULL,
    connection_id INT NOT NULL,
    google_location_id VARCHAR(255) NOT NULL,
    google_place_id VARCHAR(255) NULL,
    maps_url VARCHAR(500) NULL,
    business_name VARCHAR(255) NOT NULL,
    store_code VARCHAR(100) NULL,
    address_line_1 VARCHAR(255) NULL,
    address_line_2 VARCHAR(255) NULL,
    city VARCHAR(100) NULL,
    state VARCHAR(100) NULL,
    postal_code VARCHAR(20) NULL,
    country VARCHAR(2) DEFAULT 'US',
    latitude DECIMAL(10,7) NULL,
    longitude DECIMAL(10,7) NULL,
    primary_phone VARCHAR(20) NULL,
    additional_phones JSON NULL,
    website_url VARCHAR(500) NULL,
    primary_category_id VARCHAR(100) NULL,
    primary_category_name VARCHAR(255) NULL,
    additional_categories JSON NULL,
    description TEXT NULL,
    opening_date DATE NULL,
    verification_status ENUM('unverified', 'pending', 'verified', 'suspended') DEFAULT 'unverified',
    verification_method VARCHAR(50) NULL,
    is_published TINYINT(1) DEFAULT 1,
    is_suspended TINYINT(1) DEFAULT 0,
    suspension_reason TEXT NULL,
    labels JSON NULL,
    total_reviews INT DEFAULT 0,
    average_rating DECIMAL(2,1) NULL,
    total_photos INT DEFAULT 0,
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

-- GMB Business Hours
CREATE TABLE IF NOT EXISTS gmb_business_hours (
    id INT AUTO_INCREMENT PRIMARY KEY,
    location_id INT NOT NULL,
    hours_type ENUM('regular', 'special', 'holiday') DEFAULT 'regular',
    day_of_week TINYINT NULL,
    open_time TIME NULL,
    close_time TIME NULL,
    is_closed TINYINT(1) DEFAULT 0,
    is_24_hours TINYINT(1) DEFAULT 0,
    special_date DATE NULL,
    special_name VARCHAR(255) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_gmb_hours_location (location_id, hours_type),
    FOREIGN KEY (location_id) REFERENCES gmb_locations(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- GMB Services
CREATE TABLE IF NOT EXISTS gmb_services (
    id INT AUTO_INCREMENT PRIMARY KEY,
    location_id INT NOT NULL,
    service_type_id VARCHAR(100) NULL,
    service_name VARCHAR(255) NOT NULL,
    description TEXT NULL,
    price_type ENUM('free', 'fixed', 'from', 'range', 'no_price') DEFAULT 'no_price',
    price_min DECIMAL(10,2) NULL,
    price_max DECIMAL(10,2) NULL,
    currency_code VARCHAR(3) DEFAULT 'USD',
    is_active TINYINT(1) DEFAULT 1,
    display_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_gmb_services_location (location_id),
    FOREIGN KEY (location_id) REFERENCES gmb_locations(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- GMB Products
CREATE TABLE IF NOT EXISTS gmb_products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    location_id INT NOT NULL,
    google_product_id VARCHAR(255) NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT NULL,
    price DECIMAL(10,2) NULL,
    currency_code VARCHAR(3) DEFAULT 'USD',
    category_id VARCHAR(100) NULL,
    category_name VARCHAR(255) NULL,
    photo_url VARCHAR(500) NULL,
    is_active TINYINT(1) DEFAULT 1,
    display_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_gmb_products_location (location_id),
    FOREIGN KEY (location_id) REFERENCES gmb_locations(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- GMB Photos
CREATE TABLE IF NOT EXISTS gmb_photos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    location_id INT NOT NULL,
    google_photo_id VARCHAR(255) NULL,
    google_photo_url VARCHAR(1000) NULL,
    local_file_path VARCHAR(500) NULL,
    category ENUM('profile', 'cover', 'logo', 'exterior', 'interior', 'product', 'at_work', 'food_drink', 'menu', 'common_area', 'rooms', 'teams', 'additional') DEFAULT 'additional',
    description VARCHAR(500) NULL,
    width INT NULL,
    height INT NULL,
    status ENUM('pending', 'uploaded', 'live', 'rejected', 'deleted') DEFAULT 'pending',
    rejection_reason TEXT NULL,
    view_count INT DEFAULT 0,
    uploaded_by INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_gmb_photos_location (location_id, category),
    FOREIGN KEY (location_id) REFERENCES gmb_locations(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- GMB Posts
CREATE TABLE IF NOT EXISTS gmb_posts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    location_id INT NOT NULL,
    google_post_id VARCHAR(255) NULL,
    post_type ENUM('standard', 'event', 'offer', 'product', 'alert', 'covid') DEFAULT 'standard',
    topic_type ENUM('standard', 'event', 'offer', 'product', 'alert') DEFAULT 'standard',
    summary TEXT NOT NULL,
    media_type ENUM('photo', 'video') NULL,
    media_url VARCHAR(500) NULL,
    media_source_url VARCHAR(500) NULL,
    action_type ENUM('action_type_unspecified', 'book', 'order', 'shop', 'learn_more', 'sign_up', 'call', 'get_offer') NULL,
    action_url VARCHAR(500) NULL,
    event_title VARCHAR(255) NULL,
    event_start_date DATE NULL,
    event_start_time TIME NULL,
    event_end_date DATE NULL,
    event_end_time TIME NULL,
    offer_coupon_code VARCHAR(50) NULL,
    offer_redeem_url VARCHAR(500) NULL,
    offer_terms TEXT NULL,
    status ENUM('draft', 'scheduled', 'publishing', 'published', 'failed', 'expired', 'deleted') DEFAULT 'draft',
    scheduled_at TIMESTAMP NULL,
    published_at TIMESTAMP NULL,
    expires_at TIMESTAMP NULL,
    error_message TEXT NULL,
    views INT DEFAULT 0,
    clicks INT DEFAULT 0,
    created_by INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_gmb_posts_location (location_id, status),
    INDEX idx_gmb_posts_scheduled (status, scheduled_at),
    FOREIGN KEY (location_id) REFERENCES gmb_locations(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- GMB Reviews
CREATE TABLE IF NOT EXISTS gmb_reviews (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    location_id INT NOT NULL,
    google_review_id VARCHAR(255) NOT NULL,
    reviewer_display_name VARCHAR(255) NULL,
    reviewer_profile_photo_url VARCHAR(500) NULL,
    reviewer_is_anonymous TINYINT(1) DEFAULT 0,
    star_rating TINYINT NOT NULL,
    comment TEXT NULL,
    reply_text TEXT NULL,
    replied_at TIMESTAMP NULL,
    replied_by INT NULL,
    status ENUM('new', 'read', 'responded', 'flagged') DEFAULT 'new',
    is_flagged TINYINT(1) DEFAULT 0,
    flag_reason TEXT NULL,
    sentiment ENUM('positive', 'neutral', 'negative') NULL,
    sentiment_score DECIMAL(3,2) NULL,
    key_topics JSON NULL,
    suggested_response TEXT NULL,
    review_date TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_google_review (location_id, google_review_id),
    INDEX idx_gmb_reviews_location (location_id, status),
    INDEX idx_gmb_reviews_rating (location_id, star_rating),
    FOREIGN KEY (location_id) REFERENCES gmb_locations(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- GMB Questions
CREATE TABLE IF NOT EXISTS gmb_questions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    location_id INT NOT NULL,
    google_question_id VARCHAR(255) NOT NULL,
    question_text TEXT NOT NULL,
    author_display_name VARCHAR(255) NULL,
    author_profile_photo_url VARCHAR(500) NULL,
    author_type ENUM('customer', 'merchant', 'local_guide') DEFAULT 'customer',
    status ENUM('unanswered', 'answered', 'flagged') DEFAULT 'unanswered',
    total_answers INT DEFAULT 0,
    upvote_count INT DEFAULT 0,
    question_date TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_google_question (location_id, google_question_id),
    INDEX idx_gmb_questions_location (location_id, status),
    FOREIGN KEY (location_id) REFERENCES gmb_locations(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- GMB Answers
CREATE TABLE IF NOT EXISTS gmb_answers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    question_id INT NOT NULL,
    google_answer_id VARCHAR(255) NOT NULL,
    answer_text TEXT NOT NULL,
    author_display_name VARCHAR(255) NULL,
    author_profile_photo_url VARCHAR(500) NULL,
    author_type ENUM('customer', 'merchant', 'local_guide') DEFAULT 'customer',
    is_owner_answer TINYINT(1) DEFAULT 0,
    upvote_count INT DEFAULT 0,
    answer_date TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_google_answer (question_id, google_answer_id),
    FOREIGN KEY (question_id) REFERENCES gmb_questions(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- GMB Insights
CREATE TABLE IF NOT EXISTS gmb_insights (
    id INT AUTO_INCREMENT PRIMARY KEY,
    location_id INT NOT NULL,
    date DATE NOT NULL,
    period_type ENUM('day', 'week', 'month') DEFAULT 'day',
    queries_direct INT DEFAULT 0,
    queries_indirect INT DEFAULT 0,
    queries_chain INT DEFAULT 0,
    views_maps INT DEFAULT 0,
    views_search INT DEFAULT 0,
    actions_website INT DEFAULT 0,
    actions_phone INT DEFAULT 0,
    actions_driving_directions INT DEFAULT 0,
    actions_menu INT DEFAULT 0,
    actions_booking INT DEFAULT 0,
    actions_orders INT DEFAULT 0,
    photo_views_merchant INT DEFAULT 0,
    photo_views_customer INT DEFAULT 0,
    direction_requests JSON NULL,
    search_keywords JSON NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_location_date (location_id, date, period_type),
    INDEX idx_gmb_insights_location (location_id, date DESC),
    FOREIGN KEY (location_id) REFERENCES gmb_locations(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- GMB Attributes
CREATE TABLE IF NOT EXISTS gmb_attributes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    location_id INT NOT NULL,
    attribute_id VARCHAR(100) NOT NULL,
    attribute_name VARCHAR(255) NOT NULL,
    attribute_group VARCHAR(100) NULL,
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

-- GMB Sync Logs
CREATE TABLE IF NOT EXISTS gmb_sync_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    location_id INT NULL,
    sync_type ENUM('full', 'incremental', 'reviews', 'posts', 'insights', 'photos', 'qa') NOT NULL,
    status ENUM('started', 'completed', 'failed', 'partial') DEFAULT 'started',
    items_synced INT DEFAULT 0,
    items_created INT DEFAULT 0,
    items_updated INT DEFAULT 0,
    items_deleted INT DEFAULT 0,
    errors JSON NULL,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL,
    duration_seconds INT NULL,
    INDEX idx_gmb_sync_workspace (workspace_id, sync_type, started_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- GMB Settings
CREATE TABLE IF NOT EXISTS gmb_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    auto_sync_enabled TINYINT(1) DEFAULT 1,
    sync_interval_minutes INT DEFAULT 60,
    auto_reply_enabled TINYINT(1) DEFAULT 0,
    auto_reply_min_rating TINYINT DEFAULT 4,
    auto_reply_templates JSON NULL,
    notify_new_reviews TINYINT(1) DEFAULT 1,
    notify_new_questions TINYINT(1) DEFAULT 1,
    notify_low_ratings TINYINT(1) DEFAULT 1,
    low_rating_threshold TINYINT DEFAULT 3,
    notification_email VARCHAR(255) NULL,
    default_post_timezone VARCHAR(50) DEFAULT 'America/New_York',
    auto_expire_posts TINYINT(1) DEFAULT 1,
    default_post_expiry_days INT DEFAULT 7,
    ai_suggested_responses TINYINT(1) DEFAULT 1,
    ai_sentiment_analysis TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_workspace (workspace_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- GMB Verifications
CREATE TABLE IF NOT EXISTS gmb_verifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    location_id INT NOT NULL,
    method ENUM('postcard', 'phone', 'email', 'video', 'live_video') NOT NULL,
    phone_number VARCHAR(20) NULL,
    email_address VARCHAR(255) NULL,
    address_data JSON NULL,
    status ENUM('requested', 'pending', 'verified', 'failed', 'expired') DEFAULT 'requested',
    verification_code VARCHAR(10) NULL,
    expires_at TIMESTAMP NULL,
    requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL,
    INDEX idx_gmb_verifications_location (location_id, status),
    FOREIGN KEY (location_id) REFERENCES gmb_locations(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- GMB Categories
CREATE TABLE IF NOT EXISTS gmb_categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    category_id VARCHAR(100) NOT NULL,
    display_name VARCHAR(255) NOT NULL,
    parent_category_id VARCHAR(100) NULL,
    service_types JSON NULL,
    more_hours_types JSON NULL,
    is_gbp_category TINYINT(1) DEFAULT 1,
    is_active TINYINT(1) DEFAULT 1,
    UNIQUE KEY uk_category_id (category_id),
    INDEX idx_gmb_categories_parent (parent_category_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- SEED DATA
-- ============================================

-- Seed Directory Catalog
INSERT INTO directory_catalog (name, domain, category, priority, domain_authority, is_free, is_active) VALUES
('Google Business Profile', 'google.com', 'search', 100, 100, 1, 1),
('Facebook', 'facebook.com', 'social', 95, 96, 1, 1),
('Yelp', 'yelp.com', 'reviews', 90, 93, 1, 1),
('Apple Maps', 'apple.com', 'maps', 88, 100, 1, 1),
('Bing Places', 'bing.com', 'search', 85, 95, 1, 1),
('Yellow Pages', 'yellowpages.com', 'directories', 70, 84, 1, 1),
('Better Business Bureau', 'bbb.org', 'directories', 75, 91, 0, 1),
('Angi', 'angi.com', 'home_services', 72, 89, 0, 1),
('HomeAdvisor', 'homeadvisor.com', 'home_services', 70, 88, 0, 1),
('Thumbtack', 'thumbtack.com', 'services', 68, 86, 0, 1),
('Nextdoor', 'nextdoor.com', 'local', 65, 92, 1, 1),
('Manta', 'manta.com', 'directories', 55, 82, 1, 1),
('Foursquare', 'foursquare.com', 'local', 50, 91, 1, 1)
ON DUPLICATE KEY UPDATE priority = VALUES(priority);

-- Seed Citation Sources
INSERT INTO citation_sources (name, domain, category, priority, domain_authority, is_free, submission_type, is_active) VALUES
('Acxiom', 'acxiom.com', 'aggregator', 100, 75, 0, 'aggregator', 1),
('Infogroup', 'infogroup.com', 'aggregator', 100, 72, 0, 'aggregator', 1),
('Localeze/Neustar', 'neustarlocaleze.biz', 'aggregator', 100, 70, 0, 'aggregator', 1),
('Factual/Foursquare', 'foursquare.com', 'aggregator', 95, 91, 0, 'aggregator', 1),
('Google Business Profile', 'google.com', 'local', 100, 100, 1, 'manual', 1),
('Apple Maps', 'mapsconnect.apple.com', 'local', 95, 100, 1, 'manual', 1),
('Facebook', 'facebook.com', 'social', 90, 96, 1, 'manual', 1),
('Yelp', 'biz.yelp.com', 'local', 90, 93, 1, 'manual', 1),
('Bing Places', 'bingplaces.com', 'local', 85, 95, 1, 'manual', 1),
('Yellow Pages', 'yellowpages.com', 'general', 70, 84, 1, 'manual', 1),
('Superpages', 'superpages.com', 'general', 65, 81, 1, 'manual', 1),
('Citysearch', 'citysearch.com', 'local', 60, 79, 1, 'manual', 1)
ON DUPLICATE KEY UPDATE priority = VALUES(priority);

-- Seed GMB Categories
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
('gcid:accounting_firm', 'Accounting Firm', NULL),
('gcid:auto_repair', 'Auto Repair Shop', NULL),
('gcid:car_wash', 'Car Wash', NULL),
('gcid:landscaper', 'Landscaper', NULL),
('gcid:pest_control', 'Pest Control Service', NULL),
('gcid:cleaning_service', 'Cleaning Service', NULL)
ON DUPLICATE KEY UPDATE display_name = VALUES(display_name);

-- Seed default SLA Policy
INSERT INTO sla_policies (workspace_id, name, description, is_default, is_active) VALUES
(1, 'Standard SLA', 'Default SLA policy for all tickets', 1, 1)
ON DUPLICATE KEY UPDATE name = VALUES(name);
