-- Local SEO Rank Tracking
CREATE TABLE IF NOT EXISTS listing_rank_tracking (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    company_id INT NOT NULL,
    keyword VARCHAR(255) NOT NULL,
    location VARCHAR(255) DEFAULT NULL, -- e.g., "New York, NY" or "near me"
    engine ENUM('google_search', 'google_maps', 'bing_search') DEFAULT 'google_maps',
    rank INT DEFAULT NULL, -- NULL if not in top 100
    previous_rank INT DEFAULT NULL,
    best_rank INT DEFAULT NULL,
    search_volume INT DEFAULT 0,
    last_checked_at DATETIME DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX (company_id),
    INDEX (workspace_id)
);

CREATE TABLE IF NOT EXISTS listing_rank_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    rank_tracking_id INT NOT NULL,
    rank INT DEFAULT NULL,
    checked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (rank_tracking_id) REFERENCES listing_rank_tracking(id) ON DELETE CASCADE
);
