-- Campaign Flows Tables Migration
-- Creates tables for visual campaign flow builder

-- Main flows table
CREATE TABLE IF NOT EXISTS campaign_flows (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status ENUM('draft', 'active', 'paused') DEFAULT 'draft',
    nodes JSON COMMENT 'JSON array of flow nodes with positions and configurations',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    user_id INT DEFAULT 1,
    INDEX idx_status (status),
    INDEX idx_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Flow statistics table
CREATE TABLE IF NOT EXISTS flow_stats (
    id INT AUTO_INCREMENT PRIMARY KEY,
    flow_id INT NOT NULL,
    total_contacts INT DEFAULT 0,
    emails_sent INT DEFAULT 0,
    sms_sent INT DEFAULT 0,
    conversions INT DEFAULT 0,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (flow_id) REFERENCES campaign_flows(id) ON DELETE CASCADE,
    UNIQUE KEY unique_flow (flow_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Contacts currently in flows
CREATE TABLE IF NOT EXISTS flow_contacts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    flow_id INT NOT NULL,
    contact_id INT NOT NULL,
    current_node_id VARCHAR(100) COMMENT 'ID of the current node the contact is at',
    status ENUM('active', 'completed', 'paused', 'exited') DEFAULT 'active',
    entered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL,
    FOREIGN KEY (flow_id) REFERENCES campaign_flows(id) ON DELETE CASCADE,
    INDEX idx_flow_contact (flow_id, contact_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Flow execution logs
CREATE TABLE IF NOT EXISTS flow_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    flow_id INT NOT NULL,
    contact_id INT,
    node_id VARCHAR(100),
    action_type VARCHAR(50) COMMENT 'Type of action: email_sent, sms_sent, condition_evaluated, etc.',
    status ENUM('success', 'failed', 'skipped') DEFAULT 'success',
    details JSON COMMENT 'Additional details about the action',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (flow_id) REFERENCES campaign_flows(id) ON DELETE CASCADE,
    INDEX idx_flow (flow_id),
    INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Flow scheduled actions (for delays and timed actions)
CREATE TABLE IF NOT EXISTS flow_scheduled_actions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    flow_id INT NOT NULL,
    flow_contact_id INT NOT NULL,
    node_id VARCHAR(100) NOT NULL,
    scheduled_for TIMESTAMP NOT NULL,
    status ENUM('pending', 'executed', 'cancelled') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    executed_at TIMESTAMP NULL,
    FOREIGN KEY (flow_id) REFERENCES campaign_flows(id) ON DELETE CASCADE,
    INDEX idx_scheduled (scheduled_for, status),
    INDEX idx_flow (flow_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
