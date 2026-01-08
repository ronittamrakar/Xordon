-- GHL-style Reviews & Reputation Management
-- Review requests, review inbox, reputation dashboard

-- Review platforms configuration
CREATE TABLE IF NOT EXISTS review_platforms (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    company_id INT DEFAULT NULL,
    platform VARCHAR(50) NOT NULL,
    platform_url VARCHAR(500) DEFAULT NULL,
    place_id VARCHAR(255) DEFAULT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    is_primary BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_platforms_workspace (workspace_id),
    INDEX idx_platforms_company (workspace_id, company_id),
    
    FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Review requests sent to contacts
CREATE TABLE IF NOT EXISTS review_requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    company_id INT DEFAULT NULL,
    contact_id INT DEFAULT NULL,
    platform_id INT DEFAULT NULL,
    channel ENUM('sms', 'email') DEFAULT 'sms',
    status ENUM('pending', 'sent', 'clicked', 'reviewed', 'declined', 'failed') DEFAULT 'pending',
    recipient_name VARCHAR(255) DEFAULT NULL,
    recipient_email VARCHAR(255) DEFAULT NULL,
    recipient_phone VARCHAR(50) DEFAULT NULL,
    message TEXT DEFAULT NULL,
    review_url VARCHAR(500) DEFAULT NULL,
    sent_at DATETIME DEFAULT NULL,
    clicked_at DATETIME DEFAULT NULL,
    reviewed_at DATETIME DEFAULT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_requests_workspace (workspace_id),
    INDEX idx_requests_company (workspace_id, company_id),
    INDEX idx_requests_contact (contact_id),
    INDEX idx_requests_status (workspace_id, status),
    INDEX idx_requests_sent (workspace_id, sent_at),
    
    FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
    FOREIGN KEY (platform_id) REFERENCES review_platforms(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Reviews received (aggregated from platforms or manually added)
CREATE TABLE IF NOT EXISTS reviews (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    company_id INT DEFAULT NULL,
    platform_id INT DEFAULT NULL,
    request_id INT DEFAULT NULL,
    contact_id INT DEFAULT NULL,
    platform VARCHAR(50) NOT NULL,
    external_id VARCHAR(255) DEFAULT NULL,
    reviewer_name VARCHAR(255) DEFAULT NULL,
    reviewer_avatar VARCHAR(500) DEFAULT NULL,
    rating TINYINT NOT NULL,
    title VARCHAR(500) DEFAULT NULL,
    content TEXT DEFAULT NULL,
    reply TEXT DEFAULT NULL,
    replied_at DATETIME DEFAULT NULL,
    is_verified BOOLEAN DEFAULT FALSE,
    is_featured BOOLEAN DEFAULT FALSE,
    status ENUM('pending', 'approved', 'hidden', 'flagged') DEFAULT 'approved',
    review_date DATE DEFAULT NULL,
    fetched_at DATETIME DEFAULT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_reviews_workspace (workspace_id),
    INDEX idx_reviews_company (workspace_id, company_id),
    INDEX idx_reviews_platform (platform_id),
    INDEX idx_reviews_rating (workspace_id, rating),
    INDEX idx_reviews_status (workspace_id, status),
    INDEX idx_reviews_date (workspace_id, review_date DESC),
    INDEX idx_reviews_external (platform, external_id),
    
    FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
    FOREIGN KEY (platform_id) REFERENCES review_platforms(id) ON DELETE SET NULL,
    FOREIGN KEY (request_id) REFERENCES review_requests(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Review request templates
CREATE TABLE IF NOT EXISTS review_templates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    company_id INT DEFAULT NULL,
    name VARCHAR(255) NOT NULL,
    channel ENUM('sms', 'email') DEFAULT 'sms',
    subject VARCHAR(255) DEFAULT NULL,
    message TEXT NOT NULL,
    is_default BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_templates_workspace (workspace_id),
    
    FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Review widgets for embedding
CREATE TABLE IF NOT EXISTS review_widgets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    company_id INT DEFAULT NULL,
    name VARCHAR(255) NOT NULL,
    widget_type ENUM('carousel', 'grid', 'list', 'badge', 'floating') DEFAULT 'carousel',
    settings JSON DEFAULT NULL,
    embed_code TEXT DEFAULT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    views INT DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_widgets_workspace (workspace_id),
    
    FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default platforms
INSERT INTO review_platforms (workspace_id, platform, is_active) 
SELECT id, 'google', TRUE FROM workspaces WHERE id NOT IN (SELECT DISTINCT workspace_id FROM review_platforms WHERE platform = 'google')
ON DUPLICATE KEY UPDATE platform = platform;
