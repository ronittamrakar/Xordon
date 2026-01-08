-- GHL-style Payments & Invoices System
-- Invoices, payment links, products/services

-- Products/Services catalog
CREATE TABLE IF NOT EXISTS products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    company_id INT DEFAULT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT DEFAULT NULL,
    sku VARCHAR(100) DEFAULT NULL,
    price DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    currency VARCHAR(3) DEFAULT 'USD',
    unit VARCHAR(50) DEFAULT 'unit',
    is_recurring BOOLEAN DEFAULT FALSE,
    recurring_interval ENUM('weekly', 'monthly', 'quarterly', 'yearly') DEFAULT NULL,
    tax_rate DECIMAL(5, 2) DEFAULT 0.00,
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_products_workspace (workspace_id),
    INDEX idx_products_company (workspace_id, company_id),
    INDEX idx_products_active (workspace_id, is_active),
    
    FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Invoices
CREATE TABLE IF NOT EXISTS invoices (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    company_id INT DEFAULT NULL,
    contact_id INT DEFAULT NULL,
    opportunity_id INT DEFAULT NULL,
    invoice_number VARCHAR(50) NOT NULL,
    status ENUM('draft', 'sent', 'viewed', 'paid', 'partial', 'overdue', 'cancelled', 'refunded') DEFAULT 'draft',
    issue_date DATE NOT NULL,
    due_date DATE NOT NULL,
    subtotal DECIMAL(15, 2) DEFAULT 0.00,
    tax_amount DECIMAL(15, 2) DEFAULT 0.00,
    discount_amount DECIMAL(15, 2) DEFAULT 0.00,
    total DECIMAL(15, 2) DEFAULT 0.00,
    amount_paid DECIMAL(15, 2) DEFAULT 0.00,
    amount_due DECIMAL(15, 2) DEFAULT 0.00,
    currency VARCHAR(3) DEFAULT 'USD',
    notes TEXT DEFAULT NULL,
    terms TEXT DEFAULT NULL,
    payment_link VARCHAR(255) DEFAULT NULL,
    payment_link_expires_at DATETIME DEFAULT NULL,
    sent_at DATETIME DEFAULT NULL,
    viewed_at DATETIME DEFAULT NULL,
    paid_at DATETIME DEFAULT NULL,
    created_by INT DEFAULT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_invoices_workspace (workspace_id),
    INDEX idx_invoices_company (workspace_id, company_id),
    INDEX idx_invoices_contact (contact_id),
    INDEX idx_invoices_opportunity (opportunity_id),
    INDEX idx_invoices_status (workspace_id, status),
    INDEX idx_invoices_number (workspace_id, invoice_number),
    INDEX idx_invoices_due (workspace_id, status, due_date),
    
    UNIQUE KEY unique_invoice_number (workspace_id, invoice_number),
    FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Invoice line items
CREATE TABLE IF NOT EXISTS invoice_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    invoice_id INT NOT NULL,
    product_id INT DEFAULT NULL,
    description VARCHAR(500) NOT NULL,
    quantity DECIMAL(10, 2) DEFAULT 1.00,
    unit_price DECIMAL(15, 2) NOT NULL,
    tax_rate DECIMAL(5, 2) DEFAULT 0.00,
    tax_amount DECIMAL(15, 2) DEFAULT 0.00,
    discount_percent DECIMAL(5, 2) DEFAULT 0.00,
    discount_amount DECIMAL(15, 2) DEFAULT 0.00,
    total DECIMAL(15, 2) NOT NULL,
    sort_order INT DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_items_invoice (invoice_id),
    INDEX idx_items_product (product_id),
    
    FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Payments received
CREATE TABLE IF NOT EXISTS payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    company_id INT DEFAULT NULL,
    invoice_id INT DEFAULT NULL,
    contact_id INT DEFAULT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    payment_method ENUM('card', 'bank_transfer', 'cash', 'check', 'other') DEFAULT 'card',
    status ENUM('pending', 'completed', 'failed', 'refunded') DEFAULT 'pending',
    transaction_id VARCHAR(255) DEFAULT NULL,
    provider VARCHAR(50) DEFAULT NULL,
    provider_payment_id VARCHAR(255) DEFAULT NULL,
    notes TEXT DEFAULT NULL,
    paid_at DATETIME DEFAULT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_payments_workspace (workspace_id),
    INDEX idx_payments_invoice (invoice_id),
    INDEX idx_payments_contact (contact_id),
    INDEX idx_payments_status (workspace_id, status),
    INDEX idx_payments_transaction (transaction_id),
    
    FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
    FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Payment links (one-time or reusable)
CREATE TABLE IF NOT EXISTS payment_links (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    company_id INT DEFAULT NULL,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) NOT NULL,
    description TEXT DEFAULT NULL,
    amount DECIMAL(15, 2) DEFAULT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    is_amount_fixed BOOLEAN DEFAULT TRUE,
    min_amount DECIMAL(15, 2) DEFAULT NULL,
    max_amount DECIMAL(15, 2) DEFAULT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    expires_at DATETIME DEFAULT NULL,
    success_url VARCHAR(500) DEFAULT NULL,
    cancel_url VARCHAR(500) DEFAULT NULL,
    collect_address BOOLEAN DEFAULT FALSE,
    collect_phone BOOLEAN DEFAULT FALSE,
    usage_count INT DEFAULT 0,
    total_collected DECIMAL(15, 2) DEFAULT 0.00,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_payment_links_workspace (workspace_id),
    INDEX idx_payment_links_slug (workspace_id, slug),
    INDEX idx_payment_links_active (workspace_id, is_active),
    
    UNIQUE KEY unique_payment_link_slug (workspace_id, slug),
    FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Invoice settings per workspace
CREATE TABLE IF NOT EXISTS invoice_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    company_id INT DEFAULT NULL,
    invoice_prefix VARCHAR(20) DEFAULT 'INV-',
    next_invoice_number INT DEFAULT 1001,
    default_due_days INT DEFAULT 30,
    default_notes TEXT DEFAULT NULL,
    default_terms TEXT DEFAULT NULL,
    company_name VARCHAR(255) DEFAULT NULL,
    company_address TEXT DEFAULT NULL,
    company_phone VARCHAR(50) DEFAULT NULL,
    company_email VARCHAR(255) DEFAULT NULL,
    company_logo_url VARCHAR(500) DEFAULT NULL,
    tax_id VARCHAR(100) DEFAULT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE KEY unique_workspace_settings (workspace_id, company_id),
    FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
