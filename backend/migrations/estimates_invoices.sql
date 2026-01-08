-- Phase 2: Enhanced Estimates & Invoices
-- Full invoicing system like Thryv

-- Estimates/Quotes
CREATE TABLE IF NOT EXISTS estimates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    company_id INT NULL,
    contact_id INT NULL,
    
    -- Estimate details
    estimate_number VARCHAR(50) NOT NULL,
    title VARCHAR(255) NULL,
    
    -- Dates
    issue_date DATE NOT NULL,
    expiry_date DATE NULL,
    
    -- Status
    status ENUM('draft', 'sent', 'viewed', 'accepted', 'declined', 'expired', 'converted') DEFAULT 'draft',
    
    -- Amounts
    subtotal DECIMAL(12,2) DEFAULT 0,
    discount_type ENUM('percentage', 'fixed') NULL,
    discount_value DECIMAL(10,2) NULL,
    discount_amount DECIMAL(12,2) DEFAULT 0,
    tax_rate DECIMAL(5,2) NULL,
    tax_amount DECIMAL(12,2) DEFAULT 0,
    total DECIMAL(12,2) DEFAULT 0,
    currency VARCHAR(3) DEFAULT 'USD',
    
    -- Content
    notes TEXT NULL,
    terms TEXT NULL,
    footer TEXT NULL,
    
    -- Conversion
    converted_to_invoice_id INT NULL,
    converted_at TIMESTAMP NULL,
    
    -- Tracking
    sent_at TIMESTAMP NULL,
    viewed_at TIMESTAMP NULL,
    accepted_at TIMESTAMP NULL,
    declined_at TIMESTAMP NULL,
    accepted_by VARCHAR(255) NULL,
    signature_url VARCHAR(500) NULL,
    
    -- Assignment
    assigned_to INT NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE KEY uk_workspace_number (workspace_id, estimate_number),
    INDEX idx_estimates_workspace (workspace_id, status, issue_date DESC),
    INDEX idx_estimates_contact (contact_id),
    INDEX idx_estimates_company (company_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Estimate line items
CREATE TABLE IF NOT EXISTS estimate_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    estimate_id INT NOT NULL,
    
    -- Item details
    product_id INT NULL,
    service_id INT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT NULL,
    
    -- Pricing
    quantity DECIMAL(10,2) DEFAULT 1,
    unit_price DECIMAL(12,2) NOT NULL,
    discount_type ENUM('percentage', 'fixed') NULL,
    discount_value DECIMAL(10,2) NULL,
    tax_rate DECIMAL(5,2) NULL,
    
    -- Calculated
    subtotal DECIMAL(12,2) NOT NULL,
    discount_amount DECIMAL(12,2) DEFAULT 0,
    tax_amount DECIMAL(12,2) DEFAULT 0,
    total DECIMAL(12,2) NOT NULL,
    
    sort_order INT DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_estimate_items (estimate_id, sort_order),
    
    FOREIGN KEY (estimate_id) REFERENCES estimates(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Enhance existing invoices table
ALTER TABLE invoices
ADD COLUMN IF NOT EXISTS company_id INT NULL AFTER workspace_id,
ADD COLUMN IF NOT EXISTS estimate_id INT NULL AFTER contact_id,
ADD COLUMN IF NOT EXISTS title VARCHAR(255) NULL AFTER invoice_number,
ADD COLUMN IF NOT EXISTS discount_type ENUM('percentage', 'fixed') NULL AFTER subtotal,
ADD COLUMN IF NOT EXISTS discount_value DECIMAL(10,2) NULL AFTER discount_type,
ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(12,2) DEFAULT 0 AFTER discount_value,
ADD COLUMN IF NOT EXISTS footer TEXT NULL AFTER terms,
ADD COLUMN IF NOT EXISTS viewed_at TIMESTAMP NULL AFTER sent_at,
ADD COLUMN IF NOT EXISTS reminder_sent_at TIMESTAMP NULL AFTER viewed_at,
ADD COLUMN IF NOT EXISTS reminder_count INT DEFAULT 0 AFTER reminder_sent_at,
ADD COLUMN IF NOT EXISTS assigned_to INT NULL AFTER reminder_count,
ADD COLUMN IF NOT EXISTS stripe_invoice_id VARCHAR(255) NULL AFTER assigned_to,
ADD COLUMN IF NOT EXISTS payment_link_url VARCHAR(500) NULL AFTER stripe_invoice_id,
ADD INDEX IF NOT EXISTS idx_invoices_company (company_id),
ADD INDEX IF NOT EXISTS idx_invoices_estimate (estimate_id);

-- Invoice payments (partial payments support)
CREATE TABLE IF NOT EXISTS invoice_payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    invoice_id INT NOT NULL,
    payment_id INT NULL COMMENT 'Link to payments table',
    
    amount DECIMAL(12,2) NOT NULL,
    payment_method VARCHAR(50) NULL,
    reference VARCHAR(255) NULL,
    notes TEXT NULL,
    
    paid_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    recorded_by INT NULL,
    
    INDEX idx_invoice_payments (invoice_id),
    
    FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Recurring invoices
CREATE TABLE IF NOT EXISTS recurring_invoices (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    contact_id INT NOT NULL,
    company_id INT NULL,
    
    -- Schedule
    frequency ENUM('weekly', 'biweekly', 'monthly', 'quarterly', 'yearly') DEFAULT 'monthly',
    day_of_month INT NULL COMMENT 'For monthly/quarterly/yearly',
    day_of_week INT NULL COMMENT 'For weekly/biweekly',
    
    -- Template
    title VARCHAR(255) NULL,
    notes TEXT NULL,
    terms TEXT NULL,
    
    -- Items (JSON for simplicity)
    items JSON NOT NULL,
    
    -- Amounts
    subtotal DECIMAL(12,2) DEFAULT 0,
    discount_type ENUM('percentage', 'fixed') NULL,
    discount_value DECIMAL(10,2) NULL,
    tax_rate DECIMAL(5,2) NULL,
    total DECIMAL(12,2) DEFAULT 0,
    currency VARCHAR(3) DEFAULT 'USD',
    
    -- Status
    is_active TINYINT(1) DEFAULT 1,
    auto_send TINYINT(1) DEFAULT 1,
    auto_charge TINYINT(1) DEFAULT 0,
    
    -- Tracking
    next_invoice_date DATE NULL,
    last_invoice_date DATE NULL,
    invoices_generated INT DEFAULT 0,
    end_date DATE NULL,
    max_invoices INT NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_recurring_workspace (workspace_id, is_active),
    INDEX idx_recurring_next (next_invoice_date, is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Invoice templates
CREATE TABLE IF NOT EXISTS invoice_templates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    
    name VARCHAR(100) NOT NULL,
    is_default TINYINT(1) DEFAULT 0,
    
    -- Branding
    logo_url VARCHAR(500) NULL,
    primary_color VARCHAR(7) DEFAULT '#6366f1',
    accent_color VARCHAR(7) DEFAULT '#f97316',
    
    -- Layout
    show_logo TINYINT(1) DEFAULT 1,
    show_company_address TINYINT(1) DEFAULT 1,
    show_payment_instructions TINYINT(1) DEFAULT 1,
    
    -- Default content
    default_notes TEXT NULL,
    default_terms TEXT NULL,
    default_footer TEXT NULL,
    payment_instructions TEXT NULL,
    
    -- Custom CSS
    custom_css TEXT NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_templates_workspace (workspace_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tax rates
CREATE TABLE IF NOT EXISTS tax_rates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    
    name VARCHAR(50) NOT NULL,
    rate DECIMAL(5,2) NOT NULL,
    description VARCHAR(255) NULL,
    is_default TINYINT(1) DEFAULT 0,
    is_active TINYINT(1) DEFAULT 1,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_tax_rates_workspace (workspace_id, is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default tax rates
INSERT INTO tax_rates (workspace_id, name, rate, is_default) VALUES
(1, 'No Tax', 0, 1),
(1, 'Sales Tax (7%)', 7.00, 0),
(1, 'Sales Tax (8.25%)', 8.25, 0),
(1, 'VAT (20%)', 20.00, 0)
ON DUPLICATE KEY UPDATE name = VALUES(name);
