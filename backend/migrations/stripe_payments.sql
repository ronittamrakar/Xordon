-- Phase 2: Stripe Payments Integration
-- Payment processing, subscriptions, and payment links

-- Stripe account connection per workspace
CREATE TABLE IF NOT EXISTS stripe_accounts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    
    -- Stripe Connect account
    stripe_account_id VARCHAR(255) NULL COMMENT 'acct_xxx for Connect',
    stripe_customer_id VARCHAR(255) NULL COMMENT 'cus_xxx for platform billing',
    
    -- Account status
    status ENUM('pending', 'connected', 'restricted', 'disabled') DEFAULT 'pending',
    charges_enabled TINYINT(1) DEFAULT 0,
    payouts_enabled TINYINT(1) DEFAULT 0,
    
    -- Settings
    default_currency VARCHAR(3) DEFAULT 'USD',
    statement_descriptor VARCHAR(22) NULL,
    
    -- Webhook
    webhook_secret VARCHAR(255) NULL,
    
    connected_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE KEY uk_workspace (workspace_id),
    INDEX idx_stripe_account (stripe_account_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Payment methods stored for contacts
CREATE TABLE IF NOT EXISTS payment_methods (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    contact_id INT NOT NULL,
    
    -- Stripe references
    stripe_payment_method_id VARCHAR(255) NOT NULL,
    stripe_customer_id VARCHAR(255) NOT NULL,
    
    -- Card details (non-sensitive)
    type ENUM('card', 'bank_account', 'us_bank_account', 'sepa_debit') DEFAULT 'card',
    brand VARCHAR(20) NULL COMMENT 'visa, mastercard, etc.',
    last4 VARCHAR(4) NULL,
    exp_month INT NULL,
    exp_year INT NULL,
    
    -- Status
    is_default TINYINT(1) DEFAULT 0,
    is_active TINYINT(1) DEFAULT 1,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_payment_methods_contact (contact_id),
    INDEX idx_payment_methods_stripe (stripe_payment_method_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Payments/transactions
CREATE TABLE IF NOT EXISTS payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    
    -- References
    contact_id INT NULL,
    invoice_id INT NULL,
    
    -- Stripe references
    stripe_payment_intent_id VARCHAR(255) NULL,
    stripe_charge_id VARCHAR(255) NULL,
    stripe_refund_id VARCHAR(255) NULL,
    
    -- Amount
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    fee_amount DECIMAL(10,2) NULL COMMENT 'Stripe fee',
    net_amount DECIMAL(10,2) NULL COMMENT 'Amount after fees',
    
    -- Status
    status ENUM('pending', 'processing', 'succeeded', 'failed', 'cancelled', 'refunded', 'partially_refunded') DEFAULT 'pending',
    failure_reason TEXT NULL,
    
    -- Payment details
    payment_method_type VARCHAR(50) NULL,
    payment_method_last4 VARCHAR(4) NULL,
    payment_method_brand VARCHAR(20) NULL,
    
    -- Metadata
    description TEXT NULL,
    metadata JSON NULL,
    receipt_url VARCHAR(500) NULL,
    
    -- Timestamps
    paid_at TIMESTAMP NULL,
    refunded_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_payments_workspace (workspace_id, created_at DESC),
    INDEX idx_payments_contact (contact_id),
    INDEX idx_payments_invoice (invoice_id),
    INDEX idx_payments_stripe (stripe_payment_intent_id),
    INDEX idx_payments_status (workspace_id, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Payment links (like Stripe Payment Links)
CREATE TABLE IF NOT EXISTS payment_links (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    
    -- Link details
    name VARCHAR(100) NOT NULL,
    description TEXT NULL,
    
    -- Pricing
    amount DECIMAL(10,2) NULL COMMENT 'NULL for custom amount',
    currency VARCHAR(3) DEFAULT 'USD',
    allow_custom_amount TINYINT(1) DEFAULT 0,
    min_amount DECIMAL(10,2) NULL,
    max_amount DECIMAL(10,2) NULL,
    
    -- Product/service reference
    product_id INT NULL,
    service_id INT NULL,
    
    -- Link settings
    url_slug VARCHAR(50) NOT NULL,
    is_active TINYINT(1) DEFAULT 1,
    expires_at TIMESTAMP NULL,
    
    -- Limits
    max_uses INT NULL,
    use_count INT DEFAULT 0,
    
    -- Redirect
    success_url VARCHAR(500) NULL,
    cancel_url VARCHAR(500) NULL,
    
    -- Stripe reference
    stripe_payment_link_id VARCHAR(255) NULL,
    stripe_price_id VARCHAR(255) NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE KEY uk_workspace_slug (workspace_id, url_slug),
    INDEX idx_payment_links_workspace (workspace_id, is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Subscriptions
CREATE TABLE IF NOT EXISTS subscriptions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    contact_id INT NOT NULL,
    
    -- Stripe references
    stripe_subscription_id VARCHAR(255) NOT NULL,
    stripe_customer_id VARCHAR(255) NOT NULL,
    
    -- Plan details
    plan_name VARCHAR(100) NULL,
    plan_amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    billing_interval ENUM('day', 'week', 'month', 'year') DEFAULT 'month',
    billing_interval_count INT DEFAULT 1,
    
    -- Status
    status ENUM('active', 'past_due', 'unpaid', 'cancelled', 'incomplete', 'trialing', 'paused') DEFAULT 'active',
    
    -- Dates
    current_period_start TIMESTAMP NULL,
    current_period_end TIMESTAMP NULL,
    trial_start TIMESTAMP NULL,
    trial_end TIMESTAMP NULL,
    cancelled_at TIMESTAMP NULL,
    cancel_at_period_end TINYINT(1) DEFAULT 0,
    
    -- Metadata
    metadata JSON NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_subscriptions_workspace (workspace_id, status),
    INDEX idx_subscriptions_contact (contact_id),
    INDEX idx_subscriptions_stripe (stripe_subscription_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Refunds
CREATE TABLE IF NOT EXISTS refunds (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    payment_id INT NOT NULL,
    
    -- Stripe reference
    stripe_refund_id VARCHAR(255) NULL,
    
    -- Amount
    amount DECIMAL(10,2) NOT NULL,
    
    -- Status
    status ENUM('pending', 'succeeded', 'failed', 'cancelled') DEFAULT 'pending',
    reason ENUM('duplicate', 'fraudulent', 'requested_by_customer', 'other') NULL,
    notes TEXT NULL,
    
    -- Who processed
    processed_by INT NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_refunds_payment (payment_id),
    INDEX idx_refunds_workspace (workspace_id, created_at DESC),
    
    FOREIGN KEY (payment_id) REFERENCES payments(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
