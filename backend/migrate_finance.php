<?php
require_once __DIR__ . '/src/bootstrap.php';

echo "Migrating Finance and E-Signature tables...\n";

$db = Database::conn();

$sql = "
-- Estimates Table
CREATE TABLE IF NOT EXISTS estimates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    company_id INT DEFAULT NULL,
    contact_id INT DEFAULT NULL,
    estimate_number VARCHAR(50) NOT NULL,
    title VARCHAR(255) DEFAULT NULL,
    issue_date DATE DEFAULT NULL,
    expiry_date DATE DEFAULT NULL,
    status VARCHAR(50) DEFAULT 'draft',
    subtotal DECIMAL(15, 2) DEFAULT 0.00,
    discount_type VARCHAR(20) DEFAULT NULL,
    discount_value DECIMAL(15, 2) DEFAULT 0.00,
    discount_amount DECIMAL(15, 2) DEFAULT 0.00,
    tax_rate DECIMAL(5, 2) DEFAULT 0.00,
    tax_amount DECIMAL(15, 2) DEFAULT 0.00,
    total DECIMAL(15, 2) DEFAULT 0.00,
    currency VARCHAR(10) DEFAULT 'USD',
    notes TEXT DEFAULT NULL,
    terms TEXT DEFAULT NULL,
    footer TEXT DEFAULT NULL,
    assigned_to INT DEFAULT NULL,
    converted_to_invoice_id INT DEFAULT NULL,
    converted_at DATETIME DEFAULT NULL,
    sent_at DATETIME DEFAULT NULL,
    viewed_at DATETIME DEFAULT NULL,
    accepted_at DATETIME DEFAULT NULL,
    declined_at DATETIME DEFAULT NULL,
    accepted_by VARCHAR(255) DEFAULT NULL,
    signature_url TEXT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_workspace (workspace_id),
    INDEX idx_contact (contact_id),
    INDEX idx_status (status)
);

-- Estimate Items Table
CREATE TABLE IF NOT EXISTS estimate_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    estimate_id INT NOT NULL,
    product_id INT DEFAULT NULL,
    service_id INT DEFAULT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT DEFAULT NULL,
    quantity DECIMAL(10, 2) DEFAULT 1.00,
    unit_price DECIMAL(15, 2) DEFAULT 0.00,
    discount_type VARCHAR(20) DEFAULT NULL,
    discount_value DECIMAL(15, 2) DEFAULT 0.00,
    tax_rate DECIMAL(5, 2) DEFAULT 0.00,
    subtotal DECIMAL(15, 2) DEFAULT 0.00,
    discount_amount DECIMAL(15, 2) DEFAULT 0.00,
    tax_amount DECIMAL(15, 2) DEFAULT 0.00,
    total DECIMAL(15, 2) DEFAULT 0.00,
    sort_order INT DEFAULT 0,
    FOREIGN KEY (estimate_id) REFERENCES estimates(id) ON DELETE CASCADE
);

-- Invoices Table
CREATE TABLE IF NOT EXISTS invoices (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    company_id INT DEFAULT NULL,
    contact_id INT DEFAULT NULL,
    estimate_id INT DEFAULT NULL,
    invoice_number VARCHAR(50) NOT NULL,
    title VARCHAR(255) DEFAULT NULL,
    issue_date DATE DEFAULT NULL,
    due_date DATE DEFAULT NULL,
    status VARCHAR(50) DEFAULT 'draft',
    subtotal DECIMAL(15, 2) DEFAULT 0.00,
    discount_type VARCHAR(20) DEFAULT NULL,
    discount_value DECIMAL(15, 2) DEFAULT 0.00,
    discount_amount DECIMAL(15, 2) DEFAULT 0.00,
    tax_rate DECIMAL(5, 2) DEFAULT 0.00,
    tax_amount DECIMAL(15, 2) DEFAULT 0.00,
    total DECIMAL(15, 2) DEFAULT 0.00,
    amount_paid DECIMAL(15, 2) DEFAULT 0.00,
    currency VARCHAR(10) DEFAULT 'USD',
    notes TEXT DEFAULT NULL,
    terms TEXT DEFAULT NULL,
    footer TEXT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_workspace (workspace_id)
);

-- Invoice Items Table
CREATE TABLE IF NOT EXISTS invoice_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    invoice_id INT NOT NULL,
    product_id INT DEFAULT NULL,
    service_id INT DEFAULT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT DEFAULT NULL,
    quantity DECIMAL(10, 2) DEFAULT 1.00,
    unit_price DECIMAL(15, 2) DEFAULT 0.00,
    discount_type VARCHAR(20) DEFAULT NULL,
    discount_value DECIMAL(15, 2) DEFAULT 0.00,
    tax_rate DECIMAL(5, 2) DEFAULT 0.00,
    subtotal DECIMAL(15, 2) DEFAULT 0.00,
    discount_amount DECIMAL(15, 2) DEFAULT 0.00,
    tax_amount DECIMAL(15, 2) DEFAULT 0.00,
    total DECIMAL(15, 2) DEFAULT 0.00,
    sort_order INT DEFAULT 0,
    FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE
);

-- E-Signature Requests Table
CREATE TABLE IF NOT EXISTS signature_requests (
    id VARCHAR(50) PRIMARY KEY,
    workspace_id INT NOT NULL,
    document_type VARCHAR(50) NOT NULL,
    document_id VARCHAR(50) NOT NULL,
    document_title VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    created_by INT NOT NULL,
    message TEXT DEFAULT NULL,
    expires_at DATETIME DEFAULT NULL,
    reminder_frequency VARCHAR(20) DEFAULT 'none',
    settings JSON DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_workspace (workspace_id),
    INDEX idx_status (status)
);

-- Signers Table
CREATE TABLE IF NOT EXISTS signers (
    id VARCHAR(50) PRIMARY KEY,
    signature_request_id VARCHAR(50) NOT NULL,
    email VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'Signer',
    signing_order INT DEFAULT 0,
    status VARCHAR(50) DEFAULT 'pending',
    signature_type VARCHAR(20) DEFAULT 'any',
    access_code VARCHAR(20) DEFAULT NULL,
    viewed_at DATETIME DEFAULT NULL,
    signed_at DATETIME DEFAULT NULL,
    declined_at DATETIME DEFAULT NULL,
    decline_reason TEXT DEFAULT NULL,
    ip_address VARCHAR(45) DEFAULT NULL,
    user_agent TEXT DEFAULT NULL,
    signature_image_url TEXT DEFAULT NULL,
    token VARCHAR(100) DEFAULT NULL,
    FOREIGN KEY (signature_request_id) REFERENCES signature_requests(id) ON DELETE CASCADE
);

-- Signature Fields Table
CREATE TABLE IF NOT EXISTS signature_fields (
    id VARCHAR(50) PRIMARY KEY,
    signature_request_id VARCHAR(50) NOT NULL,
    signer_id VARCHAR(50) NOT NULL,
    type VARCHAR(20) DEFAULT 'signature',
    page INT DEFAULT 1,
    x DECIMAL(10, 2) DEFAULT 0,
    y DECIMAL(10, 2) DEFAULT 0,
    width DECIMAL(10, 2) DEFAULT 0,
    height DECIMAL(10, 2) DEFAULT 0,
    required BOOLEAN DEFAULT TRUE,
    label VARCHAR(100) DEFAULT NULL,
    value TEXT DEFAULT NULL,
    FOREIGN KEY (signature_request_id) REFERENCES signature_requests(id) ON DELETE CASCADE
);

-- Audit Trail Table
CREATE TABLE IF NOT EXISTS signature_audit_trail (
    id INT AUTO_INCREMENT PRIMARY KEY,
    signature_request_id VARCHAR(50) NOT NULL,
    action VARCHAR(100) NOT NULL,
    actor VARCHAR(255) NOT NULL,
    details JSON DEFAULT NULL,
    ip_address VARCHAR(45) DEFAULT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (signature_request_id) REFERENCES signature_requests(id) ON DELETE CASCADE
);

-- Signature Templates
CREATE TABLE IF NOT EXISTS signature_templates (
    id VARCHAR(50) PRIMARY KEY,
    workspace_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT DEFAULT NULL,
    document_type VARCHAR(50) NOT NULL,
    default_signers JSON DEFAULT NULL,
    fields JSON DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_workspace (workspace_id)
);


-- E-Signature Settings
CREATE TABLE IF NOT EXISTS signature_settings (
    workspace_id INT PRIMARY KEY,
    default_expiration_days INT DEFAULT 7,
    default_reminder_frequency VARCHAR(20) DEFAULT 'weekly',
    terms_text TEXT DEFAULT NULL,
    redirect_url TEXT DEFAULT NULL,
    branding JSON DEFAULT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- FSM Estimates Table (Used by Operations API)
CREATE TABLE IF NOT EXISTS fsm_estimates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    user_id INT DEFAULT NULL,
    contact_id INT DEFAULT NULL,
    company_id INT DEFAULT NULL,
    job_id INT DEFAULT NULL,
    estimate_number VARCHAR(50) NOT NULL,
    title VARCHAR(255) DEFAULT NULL,
    description TEXT DEFAULT NULL,
    status VARCHAR(50) DEFAULT 'draft',
    subtotal DECIMAL(15, 2) DEFAULT 0.00,
    tax_rate DECIMAL(5, 2) DEFAULT 0.00,
    tax_amount DECIMAL(15, 2) DEFAULT 0.00,
    discount_amount DECIMAL(15, 2) DEFAULT 0.00,
    total DECIMAL(15, 2) DEFAULT 0.00,
    valid_until DATE DEFAULT NULL,
    terms TEXT DEFAULT NULL,
    notes TEXT DEFAULT NULL,
    converted_to_invoice_id INT DEFAULT NULL,
    sent_at DATETIME DEFAULT NULL,
    viewed_at DATETIME DEFAULT NULL,
    accepted_at DATETIME DEFAULT NULL,
    signature_url TEXT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_workspace (workspace_id),
    INDEX idx_contact (contact_id)
);

-- FSM Estimate Line Items Table
CREATE TABLE IF NOT EXISTS fsm_estimate_line_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    estimate_id INT NOT NULL,
    service_id INT DEFAULT NULL,
    description TEXT DEFAULT NULL,
    quantity DECIMAL(10, 2) DEFAULT 1.00,
    unit_price DECIMAL(15, 2) DEFAULT 0.00,
    total DECIMAL(15, 2) DEFAULT 0.00,
    item_type VARCHAR(50) DEFAULT 'service',
    sort_order INT DEFAULT 0,
    FOREIGN KEY (estimate_id) REFERENCES fsm_estimates(id) ON DELETE CASCADE
);

";

try {
    $db->exec($sql);
    echo "Tables created successfully.\n";
} catch (PDOException $e) {
    echo "Error creating tables: " . $e->getMessage() . "\n";
    exit(1);
}
?>
