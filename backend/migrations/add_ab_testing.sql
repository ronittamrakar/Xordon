-- A/B Testing Module

CREATE TABLE IF NOT EXISTS ab_tests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    client_id INT DEFAULT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    test_type ENUM('email_subject', 'email_content', 'sms_content', 'landing_page', 'form') NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id INT NOT NULL,
    status ENUM('draft', 'running', 'paused', 'completed', 'winner_selected') DEFAULT 'draft',
    winner_criteria ENUM('open_rate', 'click_rate', 'reply_rate', 'conversion_rate', 'manual') DEFAULT 'open_rate',
    auto_select_winner BOOLEAN DEFAULT TRUE,
    min_sample_size INT DEFAULT 100,
    test_duration_hours INT DEFAULT 24,
    winner_variant_id INT DEFAULT NULL,
    started_at DATETIME,
    ended_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_status (status),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS ab_test_variants (
    id INT AUTO_INCREMENT PRIMARY KEY,
    test_id INT NOT NULL,
    variant_name VARCHAR(50) NOT NULL,
    variant_label VARCHAR(100),
    content JSON NOT NULL,
    traffic_percentage DECIMAL(5,2) DEFAULT 50.00,
    is_control BOOLEAN DEFAULT FALSE,
    is_winner BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (test_id) REFERENCES ab_tests(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS ab_test_results (
    id INT AUTO_INCREMENT PRIMARY KEY,
    test_id INT NOT NULL,
    variant_id INT NOT NULL,
    contact_id INT,
    sent_at DATETIME,
    opened_at DATETIME,
    clicked_at DATETIME,
    replied_at DATETIME,
    converted_at DATETIME,
    conversion_value DECIMAL(10,2),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (test_id) REFERENCES ab_tests(id) ON DELETE CASCADE,
    FOREIGN KEY (variant_id) REFERENCES ab_test_variants(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

ALTER TABLE campaigns
  ADD COLUMN ab_test_id INT NULL,
  ADD INDEX idx_campaigns_ab_test_id (ab_test_id);

ALTER TABLE sms_campaigns
  ADD COLUMN ab_test_id INT NULL,
  ADD INDEX idx_sms_campaigns_ab_test_id (ab_test_id);
