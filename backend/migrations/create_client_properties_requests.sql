-- Migration: Client Properties, Requests, Quotes, and Related Features
-- This migration adds support for Jobber-style client management with properties,
-- work requests, quotes, jobs, and invoices

-- Client Properties (addresses/locations for service)
CREATE TABLE IF NOT EXISTS client_properties (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    company_id INT NOT NULL,
    property_type ENUM('residential', 'commercial', 'industrial', 'other') DEFAULT 'residential',
    street1 VARCHAR(255),
    street2 VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(100) DEFAULT 'United States',
    is_primary BOOLEAN DEFAULT FALSE,
    notes TEXT,
    custom_fields JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_workspace_company (workspace_id, company_id),
    INDEX idx_company (company_id),
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Property Contacts (people at specific properties)
CREATE TABLE IF NOT EXISTS property_contacts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    property_id INT NOT NULL,
    contact_id INT NOT NULL,
    role VARCHAR(100),
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_property (property_id),
    INDEX idx_contact (contact_id),
    FOREIGN KEY (property_id) REFERENCES client_properties(id) ON DELETE CASCADE,
    FOREIGN KEY (contact_id) REFERENCES recipients(id) ON DELETE CASCADE,
    UNIQUE KEY unique_property_contact (property_id, contact_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Work Requests (client requests for service)
CREATE TABLE IF NOT EXISTS work_requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    company_id INT NOT NULL,
    property_id INT,
    contact_id INT,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status ENUM('pending', 'reviewing', 'approved', 'declined', 'converted') DEFAULT 'pending',
    priority ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium',
    requested_date DATE,
    requested_time TIME,
    source VARCHAR(100),
    assigned_to INT,
    converted_to_quote_id INT,
    converted_to_job_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_workspace_company (workspace_id, company_id),
    INDEX idx_status (status),
    INDEX idx_property (property_id),
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    FOREIGN KEY (property_id) REFERENCES client_properties(id) ON DELETE SET NULL,
    FOREIGN KEY (contact_id) REFERENCES recipients(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Quotes/Estimates (already exists but ensure compatibility)
-- Check if estimates table exists, if not create basic structure
CREATE TABLE IF NOT EXISTS quotes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    company_id INT NOT NULL,
    property_id INT,
    contact_id INT,
    quote_number VARCHAR(50) UNIQUE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status ENUM('draft', 'sent', 'viewed', 'approved', 'declined', 'expired') DEFAULT 'draft',
    subtotal DECIMAL(10, 2) DEFAULT 0.00,
    tax_amount DECIMAL(10, 2) DEFAULT 0.00,
    discount_amount DECIMAL(10, 2) DEFAULT 0.00,
    total_amount DECIMAL(10, 2) DEFAULT 0.00,
    valid_until DATE,
    notes TEXT,
    terms TEXT,
    converted_to_job_id INT,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_workspace_company (workspace_id, company_id),
    INDEX idx_status (status),
    INDEX idx_quote_number (quote_number),
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    FOREIGN KEY (property_id) REFERENCES client_properties(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Quote Line Items
CREATE TABLE IF NOT EXISTS quote_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    quote_id INT NOT NULL,
    item_type ENUM('service', 'product', 'labor', 'material', 'other') DEFAULT 'service',
    name VARCHAR(255) NOT NULL,
    description TEXT,
    quantity DECIMAL(10, 2) DEFAULT 1.00,
    unit_price DECIMAL(10, 2) NOT NULL,
    tax_rate DECIMAL(5, 2) DEFAULT 0.00,
    discount_percent DECIMAL(5, 2) DEFAULT 0.00,
    total DECIMAL(10, 2) NOT NULL,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_quote (quote_id),
    FOREIGN KEY (quote_id) REFERENCES quotes(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Jobs (work orders) - extend if exists or create
CREATE TABLE IF NOT EXISTS jobs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    company_id INT NOT NULL,
    property_id INT,
    contact_id INT,
    job_number VARCHAR(50) UNIQUE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status ENUM('scheduled', 'in_progress', 'completed', 'cancelled', 'on_hold') DEFAULT 'scheduled',
    priority ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium',
    scheduled_start DATETIME,
    scheduled_end DATETIME,
    actual_start DATETIME,
    actual_end DATETIME,
    assigned_to INT,
    created_from_quote_id INT,
    created_from_request_id INT,
    total_amount DECIMAL(10, 2) DEFAULT 0.00,
    notes TEXT,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_workspace_company (workspace_id, company_id),
    INDEX idx_status (status),
    INDEX idx_scheduled (scheduled_start, scheduled_end),
    INDEX idx_job_number (job_number),
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    FOREIGN KEY (property_id) REFERENCES client_properties(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Job Tasks/Checklist
CREATE TABLE IF NOT EXISTS job_tasks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    job_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    completed BOOLEAN DEFAULT FALSE,
    completed_at DATETIME,
    completed_by INT,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_job (job_id),
    FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Client Files/Attachments
CREATE TABLE IF NOT EXISTS client_files (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    company_id INT NOT NULL,
    property_id INT,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size INT,
    file_type VARCHAR(100),
    mime_type VARCHAR(100),
    uploaded_by INT NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_workspace_company (workspace_id, company_id),
    INDEX idx_property (property_id),
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    FOREIGN KEY (property_id) REFERENCES client_properties(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Client Communication Log
CREATE TABLE IF NOT EXISTS client_communications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    company_id INT NOT NULL,
    contact_id INT,
    communication_type ENUM('email', 'sms', 'call', 'meeting', 'note', 'system') NOT NULL,
    direction ENUM('inbound', 'outbound', 'internal') DEFAULT 'outbound',
    subject VARCHAR(255),
    content TEXT,
    metadata JSON,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_workspace_company (workspace_id, company_id),
    INDEX idx_contact (contact_id),
    INDEX idx_type (communication_type),
    INDEX idx_created_at (created_at),
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    FOREIGN KEY (contact_id) REFERENCES recipients(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Client Portal Access (for "Log in as Client" feature)
CREATE TABLE IF NOT EXISTS client_portal_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    company_id INT NOT NULL,
    contact_id INT,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    admin_user_id INT NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    expires_at DATETIME NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_token (session_token),
    INDEX idx_company (company_id),
    INDEX idx_expires (expires_at),
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add lead_source column to companies if not exists
ALTER TABLE companies 
ADD COLUMN IF NOT EXISTS lead_source VARCHAR(100) AFTER email;

-- Add tax_rate column to client_properties if not exists
ALTER TABLE client_properties 
ADD COLUMN IF NOT EXISTS tax_rate DECIMAL(5, 2) DEFAULT 0.00 AFTER country;

-- Ensure companies table has all necessary client fields
ALTER TABLE companies 
ADD COLUMN IF NOT EXISTS is_client BOOLEAN DEFAULT FALSE AFTER status,
ADD COLUMN IF NOT EXISTS client_since DATE AFTER is_client,
ADD COLUMN IF NOT EXISTS monthly_retainer DECIMAL(10, 2) AFTER client_since,
ADD COLUMN IF NOT EXISTS billing_email VARCHAR(255) AFTER monthly_retainer,
ADD COLUMN IF NOT EXISTS notes TEXT AFTER billing_email,
ADD COLUMN IF NOT EXISTS archived_at DATETIME AFTER notes;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_companies_is_client ON companies(is_client);
CREATE INDEX IF NOT EXISTS idx_companies_archived ON companies(archived_at);
CREATE INDEX IF NOT EXISTS idx_companies_workspace_client ON companies(workspace_id, is_client);
