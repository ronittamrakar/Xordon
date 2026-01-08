CREATE TABLE IF NOT EXISTS google_sheets_connections (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    company_id INT NULL,
    access_token TEXT NULL,
    refresh_token TEXT NULL,
    token_expires_at TIMESTAMP NULL,
    google_account_id VARCHAR(255) NULL,
    google_email VARCHAR(255) NULL,
    google_name VARCHAR(255) NULL,
    google_avatar_url VARCHAR(500) NULL,
    status ENUM('connected', 'disconnected', 'error') DEFAULT 'connected',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_workspace_company (workspace_id, company_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
