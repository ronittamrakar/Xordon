-- Call Flows table for Visual IVR Builder
-- Run this migration to create the call_flows table

CREATE TABLE IF NOT EXISTS call_flows (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    workspace_id INT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT NULL,
    phone_number_id INT NULL,
    status ENUM('draft', 'active', 'paused') DEFAULT 'draft',
    nodes JSON NULL COMMENT 'ReactFlow nodes configuration',
    edges JSON NULL COMMENT 'ReactFlow edges configuration',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_user_id (user_id),
    INDEX idx_workspace_id (workspace_id),
    INDEX idx_phone_number_id (phone_number_id),
    INDEX idx_status (status),
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE SET NULL,
    FOREIGN KEY (phone_number_id) REFERENCES phone_numbers(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add call_flow_id to phone_call_logs for attribution
ALTER TABLE phone_call_logs 
ADD COLUMN call_flow_id INT NULL AFTER phone_number_id,
ADD INDEX idx_call_flow_id (call_flow_id),
ADD FOREIGN KEY (call_flow_id) REFERENCES call_flows(id) ON DELETE SET NULL;
