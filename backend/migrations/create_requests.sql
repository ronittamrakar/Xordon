-- Requests table for customer service requests
CREATE TABLE IF NOT EXISTS requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    company_id INT NULL,
    request_number VARCHAR(50) NOT NULL UNIQUE,
    contact_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status ENUM('new', 'reviewing', 'scheduled', 'in_progress', 'completed', 'cancelled') DEFAULT 'new',
    priority ENUM('low', 'normal', 'high', 'urgent') DEFAULT 'normal',
    request_type VARCHAR(100),
    service_details TEXT,
    service_address TEXT,
    service_city VARCHAR(100),
    service_state VARCHAR(50),
    service_zip VARCHAR(20),
    requested_date DATE,
    scheduled_date DATE,
    scheduled_time_start TIME,
    scheduled_time_end TIME,
    assigned_to INT NULL,
    estimated_cost DECIMAL(10, 2) DEFAULT 0,
    subtotal DECIMAL(10, 2) DEFAULT 0,
    tax_amount DECIMAL(10, 2) DEFAULT 0,
    total DECIMAL(10, 2) DEFAULT 0,
    internal_notes TEXT,
    customer_notes TEXT,
    images JSON,
    on_site_assessment BOOLEAN DEFAULT FALSE,
    assessment_notes TEXT,
    created_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_workspace (workspace_id),
    INDEX idx_company (company_id),
    INDEX idx_contact (contact_id),
    INDEX idx_status (status),
    INDEX idx_assigned (assigned_to),
    INDEX idx_created_at (created_at),
    FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
    FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Request line items (products/services)
CREATE TABLE IF NOT EXISTS request_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    request_id INT NOT NULL,
    description VARCHAR(255) NOT NULL,
    quantity DECIMAL(10, 2) DEFAULT 1,
    unit_price DECIMAL(10, 2) DEFAULT 0,
    total DECIMAL(10, 2) DEFAULT 0,
    item_type ENUM('service', 'product', 'labor', 'material', 'fee') DEFAULT 'service',
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (request_id) REFERENCES requests(id) ON DELETE CASCADE,
    INDEX idx_request (request_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Request status history
CREATE TABLE IF NOT EXISTS request_status_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    request_id INT NOT NULL,
    from_status VARCHAR(50),
    to_status VARCHAR(50) NOT NULL,
    notes TEXT,
    changed_by INT NOT NULL,
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (request_id) REFERENCES requests(id) ON DELETE CASCADE,
    FOREIGN KEY (changed_by) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_request (request_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
