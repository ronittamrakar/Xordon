-- Hybrid campaigns tables

CREATE TABLE IF NOT EXISTS hybrid_campaigns (
    id VARCHAR(36) PRIMARY KEY,
    user_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT NULL,
    status ENUM('draft','active','paused','completed','archived') DEFAULT 'draft',
    entry_channel ENUM('email','sms','call') DEFAULT 'email',
    follow_up_mode ENUM('single','hybrid') DEFAULT 'hybrid',
    audience_source ENUM('contacts','csv','manual') DEFAULT 'contacts',
    audience_payload JSON NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_hybrid_campaigns_user_id (user_id),
    CONSTRAINT fk_hybrid_campaigns_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS hybrid_campaign_steps (
    id VARCHAR(36) PRIMARY KEY,
    campaign_id VARCHAR(36) NOT NULL,
    step_order INT NOT NULL,
    channel ENUM('email','sms','call') NOT NULL,
    subject VARCHAR(255) NULL,
    content MEDIUMTEXT NULL,
    delay_days INT DEFAULT 0,
    delay_hours INT DEFAULT 0,
    metadata JSON NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_hybrid_steps_campaign FOREIGN KEY (campaign_id) REFERENCES hybrid_campaigns(id) ON DELETE CASCADE,
    INDEX idx_hybrid_steps_campaign (campaign_id),
    INDEX idx_hybrid_steps_order (campaign_id, step_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS hybrid_campaign_contacts (
    id VARCHAR(36) PRIMARY KEY,
    user_id INT NOT NULL,
    campaign_id VARCHAR(36) NOT NULL,
    first_name VARCHAR(255) NULL,
    last_name VARCHAR(255) NULL,
    email VARCHAR(255) NULL,
    phone VARCHAR(64) NULL,
    company VARCHAR(255) NULL,
    status ENUM('pending','in_progress','completed','paused','opted_out','failed') DEFAULT 'pending',
    metadata JSON NULL,
    last_step_order INT DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_hybrid_contacts_campaign FOREIGN KEY (campaign_id) REFERENCES hybrid_campaigns(id) ON DELETE CASCADE,
    CONSTRAINT fk_hybrid_contacts_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_hybrid_contacts_campaign (campaign_id),
    INDEX idx_hybrid_contacts_user (user_id),
    INDEX idx_hybrid_contacts_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS hybrid_campaign_step_runs (
    id VARCHAR(36) PRIMARY KEY,
    user_id INT NOT NULL,
    campaign_id VARCHAR(36) NOT NULL,
    contact_id VARCHAR(36) NOT NULL,
    step_id VARCHAR(36) NOT NULL,
    step_order INT NOT NULL,
    status ENUM('pending','queued','processing','sent','skipped','failed','cancelled') DEFAULT 'pending',
    scheduled_at DATETIME NOT NULL,
    processed_at DATETIME NULL,
    channel_payload JSON NULL,
    error_message TEXT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_hybrid_step_runs_campaign FOREIGN KEY (campaign_id) REFERENCES hybrid_campaigns(id) ON DELETE CASCADE,
    CONSTRAINT fk_hybrid_step_runs_contact FOREIGN KEY (contact_id) REFERENCES hybrid_campaign_contacts(id) ON DELETE CASCADE,
    CONSTRAINT fk_hybrid_step_runs_step FOREIGN KEY (step_id) REFERENCES hybrid_campaign_steps(id) ON DELETE CASCADE,
    CONSTRAINT fk_hybrid_step_runs_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_hybrid_step_runs_campaign (campaign_id),
    INDEX idx_hybrid_step_runs_contact (contact_id),
    INDEX idx_hybrid_step_runs_schedule (status, scheduled_at),
    UNIQUE KEY uq_hybrid_step_run (campaign_id, contact_id, step_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
