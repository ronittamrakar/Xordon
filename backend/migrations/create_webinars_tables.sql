-- Webinars Tables
CREATE TABLE IF NOT EXISTS webinars (
    id VARCHAR(36) PRIMARY KEY,
    tenant_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    thumbnail VARCHAR(500),
    scheduled_at DATETIME,
    duration_minutes INT DEFAULT 60,
    status ENUM('draft', 'scheduled', 'live', 'ended') DEFAULT 'draft',
    stream_key VARCHAR(255),
    stream_url VARCHAR(500),
    recording_url VARCHAR(500),
    is_evergreen BOOLEAN DEFAULT FALSE,
    max_registrants INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_tenant (tenant_id),
    INDEX idx_status (status),
    INDEX idx_scheduled (scheduled_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS webinar_registrants (
    id INT AUTO_INCREMENT PRIMARY KEY,
    webinar_id VARCHAR(36) NOT NULL,
    contact_id VARCHAR(36) NOT NULL,
    email VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    attendance_status ENUM('registered', 'attended', 'no_show') DEFAULT 'registered',
    joined_at DATETIME,
    left_at DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (webinar_id) REFERENCES webinars(id) ON DELETE CASCADE,
    INDEX idx_webinar (webinar_id),
    INDEX idx_contact (contact_id),
    INDEX idx_status (attendance_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
