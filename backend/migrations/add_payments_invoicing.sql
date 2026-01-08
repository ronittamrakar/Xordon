-- Payments and Invoicing Module
-- Tables for products, invoices, payments, and Stripe integration

-- Products/Services catalog
CREATE TABLE IF NOT EXISTS products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    type ENUM('one_time', 'recurring') NOT NULL DEFAULT 'one_time',
    recurring_interval ENUM('day', 'week', 'month', 'year') NULL,
    recurring_interval_count INT DEFAULT 1,
    stripe_price_id VARCHAR(255) NULL,
    status ENUM('active', 'archived') NOT NULL DEFAULT 'active',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_products_user (user_id),
    INDEX idx_products_status (status),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Invoices
CREATE TABLE IF NOT EXISTS invoices (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    contact_id INT NULL,
    invoice_number VARCHAR(50) NOT NULL,
    status ENUM('draft', 'sent', 'viewed', 'paid', 'partially_paid', 'overdue', 'cancelled', 'refunded') NOT NULL DEFAULT 'draft',
    issue_date DATE NOT NULL,
    due_date DATE NOT NULL,
    subtotal DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    tax_rate DECIMAL(5, 2) NOT NULL DEFAULT 0.00,
    tax_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    discount_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    total DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    amount_paid DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    notes TEXT,
    terms TEXT,
    stripe_invoice_id VARCHAR(255) NULL,
    payment_link VARCHAR(500) NULL,
    sent_at DATETIME NULL,
    viewed_at DATETIME NULL,
    paid_at DATETIME NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_invoices_user (user_id),
    INDEX idx_invoices_contact (contact_id),
    INDEX idx_invoices_status (status),
    INDEX idx_invoices_number (invoice_number),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Invoice line items
CREATE TABLE IF NOT EXISTS invoice_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    invoice_id INT NOT NULL,
    product_id INT NULL,
    description VARCHAR(500) NOT NULL,
    quantity DECIMAL(10, 2) NOT NULL DEFAULT 1,
    unit_price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    sort_order INT NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_invoice_items_invoice (invoice_id),
    FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Payments received
CREATE TABLE IF NOT EXISTS payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    invoice_id INT NULL,
    contact_id INT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    payment_method ENUM('stripe', 'paypal', 'bank_transfer', 'cash', 'check', 'other') NOT NULL DEFAULT 'stripe',
    status ENUM('pending', 'completed', 'failed', 'refunded', 'partially_refunded') NOT NULL DEFAULT 'pending',
    stripe_payment_intent_id VARCHAR(255) NULL,
    stripe_charge_id VARCHAR(255) NULL,
    transaction_id VARCHAR(255) NULL,
    notes TEXT,
    paid_at DATETIME NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_payments_user (user_id),
    INDEX idx_payments_invoice (invoice_id),
    INDEX idx_payments_contact (contact_id),
    INDEX idx_payments_status (status),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Payment settings (Stripe keys, etc.)
CREATE TABLE IF NOT EXISTS payment_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    stripe_account_id VARCHAR(255) NULL,
    stripe_publishable_key VARCHAR(255) NULL,
    stripe_secret_key_encrypted TEXT NULL,
    stripe_webhook_secret_encrypted TEXT NULL,
    paypal_client_id VARCHAR(255) NULL,
    paypal_secret_encrypted TEXT NULL,
    default_currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    default_tax_rate DECIMAL(5, 2) NOT NULL DEFAULT 0.00,
    invoice_prefix VARCHAR(10) NOT NULL DEFAULT 'INV-',
    invoice_footer TEXT,
    payment_terms TEXT,
    auto_send_receipts BOOLEAN NOT NULL DEFAULT TRUE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Subscriptions (for recurring billing)
CREATE TABLE IF NOT EXISTS subscriptions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    contact_id INT NOT NULL,
    product_id INT NOT NULL,
    status ENUM('active', 'paused', 'cancelled', 'past_due', 'trialing') NOT NULL DEFAULT 'active',
    stripe_subscription_id VARCHAR(255) NULL,
    current_period_start DATE NULL,
    current_period_end DATE NULL,
    cancel_at_period_end BOOLEAN NOT NULL DEFAULT FALSE,
    cancelled_at DATETIME NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_subscriptions_user (user_id),
    INDEX idx_subscriptions_contact (contact_id),
    INDEX idx_subscriptions_status (status),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
