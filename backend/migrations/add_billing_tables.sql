-- Multi-Tenant Billing Schema
-- Stripe integration, usage tracking, and reseller pricing

-- =====================================================
-- AGENCY SUBSCRIPTIONS (Stripe-linked)
-- =====================================================
CREATE TABLE IF NOT EXISTS agency_subscriptions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    agency_id INT NOT NULL,
    
    -- Stripe identifiers
    stripe_customer_id VARCHAR(100) DEFAULT NULL,
    stripe_subscription_id VARCHAR(100) DEFAULT NULL,
    stripe_price_id VARCHAR(100) DEFAULT NULL,
    
    -- Subscription details
    plan_id INT DEFAULT NULL,
    plan_name VARCHAR(100) NOT NULL,
    status ENUM('trialing', 'active', 'past_due', 'canceled', 'unpaid', 'incomplete') DEFAULT 'trialing',
    
    -- Billing cycle
    billing_cycle ENUM('monthly', 'yearly') DEFAULT 'monthly',
    current_period_start DATETIME DEFAULT NULL,
    current_period_end DATETIME DEFAULT NULL,
    trial_ends_at DATETIME DEFAULT NULL,
    canceled_at DATETIME DEFAULT NULL,
    
    -- Pricing
    base_price_cents INT DEFAULT 0,
    currency VARCHAR(3) DEFAULT 'USD',
    
    -- Limits
    max_subaccounts INT DEFAULT 5,
    max_team_members INT DEFAULT 10,
    max_contacts INT DEFAULT 10000,
    max_emails_per_month INT DEFAULT 50000,
    max_sms_per_month INT DEFAULT 1000,
    
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_sub_agency (agency_id),
    INDEX idx_sub_stripe_customer (stripe_customer_id),
    INDEX idx_sub_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- USAGE TRACKING (Per sub-account, monthly)
-- =====================================================
CREATE TABLE IF NOT EXISTS usage_records (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    agency_id INT NOT NULL,
    subaccount_id INT DEFAULT NULL,
    
    -- Period
    period_year SMALLINT NOT NULL,
    period_month TINYINT NOT NULL,
    
    -- Usage metrics
    emails_sent INT DEFAULT 0,
    sms_sent INT DEFAULT 0,
    calls_made INT DEFAULT 0,
    contacts_count INT DEFAULT 0,
    storage_bytes BIGINT DEFAULT 0,
    api_calls INT DEFAULT 0,
    
    -- Timestamps
    last_updated DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE KEY uniq_usage_period (agency_id, subaccount_id, period_year, period_month),
    INDEX idx_usage_agency (agency_id),
    INDEX idx_usage_period (period_year, period_month)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- INVOICES
-- =====================================================
CREATE TABLE IF NOT EXISTS invoices (
    id INT AUTO_INCREMENT PRIMARY KEY,
    agency_id INT NOT NULL,
    
    -- Stripe reference
    stripe_invoice_id VARCHAR(100) DEFAULT NULL,
    stripe_payment_intent_id VARCHAR(100) DEFAULT NULL,
    
    -- Invoice details
    invoice_number VARCHAR(50) NOT NULL,
    status ENUM('draft', 'open', 'paid', 'void', 'uncollectible') DEFAULT 'draft',
    
    -- Amounts (in cents)
    subtotal_cents INT DEFAULT 0,
    tax_cents INT DEFAULT 0,
    discount_cents INT DEFAULT 0,
    total_cents INT DEFAULT 0,
    currency VARCHAR(3) DEFAULT 'USD',
    
    -- Period
    period_start DATETIME DEFAULT NULL,
    period_end DATETIME DEFAULT NULL,
    
    -- Payment
    paid_at DATETIME DEFAULT NULL,
    due_date DATETIME DEFAULT NULL,
    
    -- PDF
    pdf_url TEXT DEFAULT NULL,
    
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE KEY uniq_invoice_number (invoice_number),
    INDEX idx_invoice_agency (agency_id),
    INDEX idx_invoice_status (status),
    INDEX idx_invoice_stripe (stripe_invoice_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- INVOICE LINE ITEMS
-- =====================================================
CREATE TABLE IF NOT EXISTS invoice_line_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    invoice_id INT NOT NULL,
    
    description VARCHAR(255) NOT NULL,
    quantity INT DEFAULT 1,
    unit_price_cents INT DEFAULT 0,
    amount_cents INT DEFAULT 0,
    
    -- Usage-based (optional)
    subaccount_id INT DEFAULT NULL,
    usage_type VARCHAR(50) DEFAULT NULL,
    
    FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE,
    INDEX idx_line_invoice (invoice_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- PAYMENT METHODS
-- =====================================================
CREATE TABLE IF NOT EXISTS payment_methods (
    id INT AUTO_INCREMENT PRIMARY KEY,
    agency_id INT NOT NULL,
    
    stripe_payment_method_id VARCHAR(100) NOT NULL,
    type ENUM('card', 'bank_account', 'other') DEFAULT 'card',
    
    -- Card details (masked)
    card_brand VARCHAR(20) DEFAULT NULL,
    card_last4 VARCHAR(4) DEFAULT NULL,
    card_exp_month TINYINT DEFAULT NULL,
    card_exp_year SMALLINT DEFAULT NULL,
    
    is_default BOOLEAN DEFAULT FALSE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_pm_agency (agency_id),
    INDEX idx_pm_stripe (stripe_payment_method_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- RESELLER PRICING RULES
-- =====================================================
CREATE TABLE IF NOT EXISTS reseller_pricing (
    id INT AUTO_INCREMENT PRIMARY KEY,
    agency_id INT NOT NULL,
    
    -- What is being priced
    price_type ENUM('plan_markup', 'per_subaccount', 'per_user', 'addon', 'usage') NOT NULL,
    
    -- For addons
    addon_key VARCHAR(50) DEFAULT NULL,
    addon_name VARCHAR(100) DEFAULT NULL,
    
    -- Pricing
    base_cost_cents INT DEFAULT 0,
    markup_type ENUM('fixed', 'percentage') DEFAULT 'fixed',
    markup_value DECIMAL(10,2) DEFAULT 0,
    sell_price_cents INT DEFAULT 0,
    
    -- Usage-based options
    included_units INT DEFAULT 0,
    overage_price_cents INT DEFAULT 0,
    
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_reseller_agency (agency_id),
    INDEX idx_reseller_type (price_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- STRIPE WEBHOOK EVENTS (for idempotency)
-- =====================================================
CREATE TABLE IF NOT EXISTS stripe_events (
    id INT AUTO_INCREMENT PRIMARY KEY,
    event_id VARCHAR(100) NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    processed BOOLEAN DEFAULT FALSE,
    payload JSON DEFAULT NULL,
    processed_at DATETIME DEFAULT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE KEY uniq_event_id (event_id),
    INDEX idx_event_type (event_type),
    INDEX idx_event_processed (processed)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
