-- Phase 2: Advanced Features
-- Elementor Builder, Checkout Forms, Client Portal v2, Omni-Channel, Agency SaaS

-- ============================================================================
-- ELEMENTOR-GRADE PAGE BUILDER
-- ============================================================================

-- Enhanced landing pages with sections/rows/columns
ALTER TABLE landing_pages
ADD COLUMN IF NOT EXISTS builder_version VARCHAR(10) DEFAULT 'v1',
ADD COLUMN IF NOT EXISTS global_styles JSON NULL,
ADD COLUMN IF NOT EXISTS custom_css TEXT NULL,
ADD COLUMN IF NOT EXISTS custom_js TEXT NULL,
ADD COLUMN IF NOT EXISTS favicon_url VARCHAR(500) NULL,
ADD COLUMN IF NOT EXISTS version_history JSON NULL,
ADD COLUMN IF NOT EXISTS published_version INT DEFAULT 1,
ADD COLUMN IF NOT EXISTS ab_test_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS ab_test_config JSON NULL;

-- Page sections (hero, features, testimonials, etc.)
CREATE TABLE IF NOT EXISTS page_sections (
    id INT AUTO_INCREMENT PRIMARY KEY,
    page_id INT NOT NULL,
    section_type VARCHAR(50) NOT NULL,
    section_data JSON NOT NULL,
    sort_order INT DEFAULT 0,
    is_visible BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_page (page_id),
    INDEX idx_sort (page_id, sort_order),
    FOREIGN KEY (page_id) REFERENCES landing_pages(id) ON DELETE CASCADE
);

-- Reusable components library
CREATE TABLE IF NOT EXISTS page_components (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL,
    component_data JSON NOT NULL,
    thumbnail_url VARCHAR(500) NULL,
    is_global BOOLEAN DEFAULT FALSE,
    usage_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_workspace (workspace_id),
    INDEX idx_category (category)
);

-- ============================================================================
-- CHECKOUT & ECOMMERCE
-- ============================================================================

-- Products/Services catalog
ALTER TABLE products
ADD COLUMN IF NOT EXISTS product_type ENUM('physical', 'digital', 'service', 'subscription') DEFAULT 'physical',
ADD COLUMN IF NOT EXISTS digital_file_url VARCHAR(500) NULL,
ADD COLUMN IF NOT EXISTS subscription_interval ENUM('daily', 'weekly', 'monthly', 'yearly') NULL,
ADD COLUMN IF NOT EXISTS subscription_interval_count INT DEFAULT 1,
ADD COLUMN IF NOT EXISTS trial_period_days INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS stock_quantity INT NULL,
ADD COLUMN IF NOT EXISTS low_stock_threshold INT NULL,
ADD COLUMN IF NOT EXISTS weight DECIMAL(10,2) NULL,
ADD COLUMN IF NOT EXISTS dimensions JSON NULL,
ADD COLUMN IF NOT EXISTS images JSON NULL,
ADD COLUMN IF NOT EXISTS variants JSON NULL;

-- Checkout forms
CREATE TABLE IF NOT EXISTS checkout_forms (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    company_id INT NULL,
    name VARCHAR(255) NOT NULL,
    form_type ENUM('one-step', 'two-step', 'multi-step') DEFAULT 'one-step',
    products JSON NOT NULL,
    upsells JSON NULL,
    downsells JSON NULL,
    thank_you_page_url VARCHAR(500) NULL,
    redirect_url VARCHAR(500) NULL,
    custom_fields JSON NULL,
    payment_methods JSON NULL,
    shipping_enabled BOOLEAN DEFAULT FALSE,
    tax_enabled BOOLEAN DEFAULT FALSE,
    tax_rate DECIMAL(5,2) DEFAULT 0,
    currency VARCHAR(3) DEFAULT 'USD',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_workspace (workspace_id),
    INDEX idx_company (company_id)
);

-- Orders
CREATE TABLE IF NOT EXISTS orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    company_id INT NULL,
    checkout_form_id INT NULL,
    contact_id INT NULL,
    order_number VARCHAR(50) UNIQUE NOT NULL,
    
    -- Customer info
    customer_email VARCHAR(255) NOT NULL,
    customer_name VARCHAR(255) NULL,
    customer_phone VARCHAR(50) NULL,
    
    -- Amounts
    subtotal DECIMAL(10,2) NOT NULL,
    tax_amount DECIMAL(10,2) DEFAULT 0,
    shipping_amount DECIMAL(10,2) DEFAULT 0,
    discount_amount DECIMAL(10,2) DEFAULT 0,
    total DECIMAL(10,2) NOT NULL,
    
    -- Payment
    payment_status ENUM('pending', 'paid', 'failed', 'refunded') DEFAULT 'pending',
    payment_method VARCHAR(50) NULL,
    payment_intent_id VARCHAR(255) NULL,
    
    -- Shipping
    shipping_address JSON NULL,
    billing_address JSON NULL,
    shipping_status ENUM('pending', 'processing', 'shipped', 'delivered') DEFAULT 'pending',
    tracking_number VARCHAR(255) NULL,
    
    -- Metadata
    metadata JSON NULL,
    notes TEXT NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_workspace (workspace_id),
    INDEX idx_company (company_id),
    INDEX idx_contact (contact_id),
    INDEX idx_order_number (order_number),
    INDEX idx_payment_status (payment_status),
    INDEX idx_created_at (created_at)
);

-- Order items
CREATE TABLE IF NOT EXISTS order_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    product_id INT NULL,
    product_name VARCHAR(255) NOT NULL,
    product_type VARCHAR(50) NULL,
    quantity INT NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    metadata JSON NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_order (order_id),
    INDEX idx_product (product_id),
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

-- ============================================================================
-- CLIENT PORTAL V2
-- ============================================================================

-- Documents
CREATE TABLE IF NOT EXISTS portal_documents (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    company_id INT NULL,
    contact_id INT NOT NULL,
    
    document_type ENUM('contract', 'invoice', 'proposal', 'report', 'other') DEFAULT 'other',
    title VARCHAR(255) NOT NULL,
    description TEXT NULL,
    file_url VARCHAR(500) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_size INT NULL,
    file_type VARCHAR(50) NULL,
    
    -- E-signature
    requires_signature BOOLEAN DEFAULT FALSE,
    signature_status ENUM('pending', 'signed', 'declined') NULL,
    signed_at TIMESTAMP NULL,
    signature_data JSON NULL,
    
    -- Access control
    is_visible_to_client BOOLEAN DEFAULT TRUE,
    expires_at TIMESTAMP NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_workspace (workspace_id),
    INDEX idx_company (company_id),
    INDEX idx_contact (contact_id),
    INDEX idx_type (document_type),
    INDEX idx_signature_status (signature_status)
);

-- Portal messages
CREATE TABLE IF NOT EXISTS portal_messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    company_id INT NULL,
    contact_id INT NOT NULL,
    
    thread_id VARCHAR(64) NULL,
    direction ENUM('inbound', 'outbound') NOT NULL,
    sender_type ENUM('client', 'staff') NOT NULL,
    sender_id INT NULL,
    
    subject VARCHAR(255) NULL,
    message TEXT NOT NULL,
    attachments JSON NULL,
    
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_workspace (workspace_id),
    INDEX idx_company (company_id),
    INDEX idx_contact (contact_id),
    INDEX idx_thread (thread_id),
    INDEX idx_created_at (created_at)
);

-- ============================================================================
-- OMNI-CHANNEL MESSAGING
-- ============================================================================

-- Facebook Messenger integration
CREATE TABLE IF NOT EXISTS facebook_pages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    company_id INT NULL,
    
    page_id VARCHAR(255) NOT NULL,
    page_name VARCHAR(255) NOT NULL,
    page_access_token TEXT NOT NULL,
    
    is_active BOOLEAN DEFAULT TRUE,
    last_sync_at TIMESTAMP NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE KEY unique_page (workspace_id, page_id),
    INDEX idx_workspace (workspace_id)
);

-- Instagram accounts
CREATE TABLE IF NOT EXISTS instagram_accounts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    company_id INT NULL,
    
    instagram_id VARCHAR(255) NOT NULL,
    username VARCHAR(255) NOT NULL,
    access_token TEXT NOT NULL,
    
    is_active BOOLEAN DEFAULT TRUE,
    last_sync_at TIMESTAMP NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE KEY unique_account (workspace_id, instagram_id),
    INDEX idx_workspace (workspace_id)
);

-- Google My Business locations
CREATE TABLE IF NOT EXISTS gmb_locations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    company_id INT NULL,
    
    location_id VARCHAR(255) NOT NULL,
    location_name VARCHAR(255) NOT NULL,
    access_token TEXT NOT NULL,
    refresh_token TEXT NOT NULL,
    
    is_active BOOLEAN DEFAULT TRUE,
    last_sync_at TIMESTAMP NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE KEY unique_location (workspace_id, location_id),
    INDEX idx_workspace (workspace_id)
);

-- Unified message queue for all channels
CREATE TABLE IF NOT EXISTS message_queue (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    conversation_id INT NULL,
    
    channel ENUM('email', 'sms', 'whatsapp', 'facebook', 'instagram', 'gmb', 'webchat') NOT NULL,
    direction ENUM('inbound', 'outbound') NOT NULL,
    
    from_identifier VARCHAR(255) NOT NULL,
    to_identifier VARCHAR(255) NOT NULL,
    
    content TEXT NOT NULL,
    media_urls JSON NULL,
    
    status ENUM('queued', 'sending', 'sent', 'delivered', 'failed') DEFAULT 'queued',
    external_id VARCHAR(255) NULL,
    error_message TEXT NULL,
    
    scheduled_at TIMESTAMP NULL,
    sent_at TIMESTAMP NULL,
    delivered_at TIMESTAMP NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_workspace (workspace_id),
    INDEX idx_conversation (conversation_id),
    INDEX idx_status (status),
    INDEX idx_scheduled (scheduled_at)
);

-- ============================================================================
-- AGENCY SAAS MODE
-- ============================================================================

-- Snapshots (templates for cloning)
CREATE TABLE IF NOT EXISTS snapshots (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    
    name VARCHAR(255) NOT NULL,
    description TEXT NULL,
    category VARCHAR(100) NULL,
    thumbnail_url VARCHAR(500) NULL,
    
    -- What's included
    includes_funnels BOOLEAN DEFAULT FALSE,
    includes_automations BOOLEAN DEFAULT FALSE,
    includes_templates BOOLEAN DEFAULT FALSE,
    includes_forms BOOLEAN DEFAULT FALSE,
    includes_pages BOOLEAN DEFAULT FALSE,
    includes_workflows BOOLEAN DEFAULT FALSE,
    
    -- Snapshot data
    snapshot_data JSON NOT NULL,
    
    -- Marketplace
    is_public BOOLEAN DEFAULT FALSE,
    is_premium BOOLEAN DEFAULT FALSE,
    price DECIMAL(10,2) DEFAULT 0,
    
    usage_count INT DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_workspace (workspace_id),
    INDEX idx_public (is_public),
    INDEX idx_category (category)
);

-- Usage tracking for billing
CREATE TABLE IF NOT EXISTS usage_metrics (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    metric_date DATE NOT NULL,
    
    -- Contact limits
    contacts_count INT DEFAULT 0,
    contacts_limit INT NULL,
    
    -- Message limits
    emails_sent INT DEFAULT 0,
    sms_sent INT DEFAULT 0,
    emails_limit INT NULL,
    sms_limit INT NULL,
    
    -- Storage
    storage_used_mb INT DEFAULT 0,
    storage_limit_mb INT NULL,
    
    -- API calls
    api_calls INT DEFAULT 0,
    api_calls_limit INT NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE KEY unique_metric (workspace_id, metric_date),
    INDEX idx_workspace (workspace_id),
    INDEX idx_date (metric_date)
);

-- Billing plans
CREATE TABLE IF NOT EXISTS billing_plans (
    id INT AUTO_INCREMENT PRIMARY KEY,
    
    name VARCHAR(255) NOT NULL,
    description TEXT NULL,
    
    -- Pricing
    price_monthly DECIMAL(10,2) NOT NULL,
    price_yearly DECIMAL(10,2) NULL,
    
    -- Limits
    contacts_limit INT NULL,
    emails_limit INT NULL,
    sms_limit INT NULL,
    storage_limit_mb INT NULL,
    users_limit INT NULL,
    
    -- Features
    features JSON NULL,
    
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INT DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_active (is_active)
);

-- Workspace subscriptions
CREATE TABLE IF NOT EXISTS workspace_subscriptions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL UNIQUE,
    billing_plan_id INT NOT NULL,
    
    status ENUM('active', 'past_due', 'canceled', 'trialing') DEFAULT 'active',
    
    -- Stripe
    stripe_subscription_id VARCHAR(255) NULL,
    stripe_customer_id VARCHAR(255) NULL,
    
    current_period_start DATE NOT NULL,
    current_period_end DATE NOT NULL,
    
    trial_ends_at DATE NULL,
    canceled_at TIMESTAMP NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_workspace (workspace_id),
    INDEX idx_plan (billing_plan_id),
    INDEX idx_status (status),
    FOREIGN KEY (billing_plan_id) REFERENCES billing_plans(id)
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_orders_workspace_status ON orders(workspace_id, payment_status, created_at);
CREATE INDEX IF NOT EXISTS idx_portal_docs_contact ON portal_documents(contact_id, is_visible_to_client);
CREATE INDEX IF NOT EXISTS idx_portal_messages_thread ON portal_messages(thread_id, created_at);
CREATE INDEX IF NOT EXISTS idx_message_queue_status ON message_queue(workspace_id, status, scheduled_at);
