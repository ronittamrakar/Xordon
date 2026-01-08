-- Agency Multi-Tenant System

CREATE TABLE IF NOT EXISTS client_accounts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    agency_user_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) NOT NULL,
    logo_url VARCHAR(500),
    primary_color VARCHAR(7) DEFAULT '#FF6B00',
    domain VARCHAR(255),
    industry VARCHAR(100),
    website VARCHAR(500),
    contact_email VARCHAR(255),
    contact_phone VARCHAR(50),
    notes TEXT,
    status ENUM('active', 'paused', 'archived') DEFAULT 'active',
    settings JSON,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_agency_slug (agency_user_id, slug),
    INDEX idx_agency_user (agency_user_id),
    FOREIGN KEY (agency_user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS client_user_access (
    id INT AUTO_INCREMENT PRIMARY KEY,
    client_id INT NOT NULL,
    user_id INT NOT NULL,
    role ENUM('owner', 'admin', 'member', 'viewer') DEFAULT 'member',
    permissions JSON,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_client_user (client_id, user_id),
    FOREIGN KEY (client_id) REFERENCES client_accounts(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS agency_reports (
    id INT AUTO_INCREMENT PRIMARY KEY,
    agency_user_id INT NOT NULL,
    report_type ENUM('overview', 'campaigns', 'contacts', 'revenue', 'custom') DEFAULT 'overview',
    name VARCHAR(255) NOT NULL,
    filters JSON,
    columns JSON,
    schedule ENUM('none', 'daily', 'weekly', 'monthly') DEFAULT 'none',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (agency_user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
