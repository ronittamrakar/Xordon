-- Reviews / Reputation Management

CREATE TABLE IF NOT EXISTS review_platforms (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    client_id INT DEFAULT NULL,
    platform ENUM('google', 'facebook', 'yelp', 'trustpilot', 'g2', 'capterra', 'custom') NOT NULL,
    platform_name VARCHAR(100),
    place_id VARCHAR(255),
    page_id VARCHAR(255),
    api_key VARCHAR(500),
    access_token TEXT,
    review_url VARCHAR(500),
    status ENUM('active', 'paused', 'disconnected') DEFAULT 'active',
    last_sync_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS reviews (
    id INT AUTO_INCREMENT PRIMARY KEY,
    platform_id INT NOT NULL,
    user_id INT NOT NULL,
    external_id VARCHAR(255),
    reviewer_name VARCHAR(255),
    reviewer_avatar VARCHAR(500),
    rating TINYINT NOT NULL,
    title VARCHAR(500),
    content TEXT,
    response TEXT,
    response_date DATETIME,
    sentiment ENUM('positive', 'neutral', 'negative') DEFAULT 'neutral',
    status ENUM('new', 'read', 'responded', 'flagged', 'archived') DEFAULT 'new',
    review_date DATETIME,
    synced_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_platform_review (platform_id, external_id),
    FOREIGN KEY (platform_id) REFERENCES review_platforms(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS review_requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    client_id INT DEFAULT NULL,
    contact_id INT,
    platform_id INT,
    channel ENUM('email', 'sms') NOT NULL,
    status ENUM('pending', 'sent', 'opened', 'clicked', 'completed', 'failed') DEFAULT 'pending',
    sent_at DATETIME,
    opened_at DATETIME,
    clicked_at DATETIME,
    completed_at DATETIME,
    review_id INT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE SET NULL,
    FOREIGN KEY (platform_id) REFERENCES review_platforms(id) ON DELETE SET NULL,
    FOREIGN KEY (review_id) REFERENCES reviews(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS review_templates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    client_id INT DEFAULT NULL,
    name VARCHAR(255) NOT NULL,
    channel ENUM('email', 'sms') NOT NULL,
    subject VARCHAR(255),
    content TEXT NOT NULL,
    is_default BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS reputation_scores (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    client_id INT DEFAULT NULL,
    date DATE NOT NULL,
    overall_score DECIMAL(3,2),
    google_score DECIMAL(3,2),
    facebook_score DECIMAL(3,2),
    yelp_score DECIMAL(3,2),
    total_reviews INT DEFAULT 0,
    new_reviews INT DEFAULT 0,
    response_rate DECIMAL(5,2),
    avg_response_time_hours INT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_user_date (user_id, client_id, date),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
