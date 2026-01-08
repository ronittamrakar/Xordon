-- Conversations (Unified Inbox) - GHL-style
-- Scoped by workspace_id + company_id

CREATE TABLE IF NOT EXISTS conversations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    company_id INT DEFAULT NULL,
    contact_id INT NOT NULL,
    assigned_user_id INT DEFAULT NULL,
    status ENUM('open', 'pending', 'closed') DEFAULT 'open',
    unread_count INT DEFAULT 0,
    last_message_at DATETIME DEFAULT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_conversations_workspace (workspace_id),
    INDEX idx_conversations_company (workspace_id, company_id),
    INDEX idx_conversations_contact (contact_id),
    INDEX idx_conversations_assigned (assigned_user_id),
    INDEX idx_conversations_status (workspace_id, company_id, status),
    INDEX idx_conversations_last_message (workspace_id, company_id, last_message_at DESC),
    
    FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
    FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Messages within conversations (multi-channel: sms, email, call, note, system)
CREATE TABLE IF NOT EXISTS conversation_messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    company_id INT DEFAULT NULL,
    conversation_id INT NOT NULL,
    channel ENUM('sms', 'email', 'call', 'note', 'system', 'form', 'whatsapp') NOT NULL,
    direction ENUM('inbound', 'outbound', 'system') NOT NULL,
    sender_type ENUM('contact', 'user', 'system') NOT NULL,
    sender_id INT DEFAULT NULL,
    subject VARCHAR(500) DEFAULT NULL,
    body TEXT,
    body_html TEXT DEFAULT NULL,
    metadata JSON DEFAULT NULL,
    provider_message_id VARCHAR(255) DEFAULT NULL,
    status ENUM('pending', 'sent', 'delivered', 'read', 'failed') DEFAULT 'sent',
    read_at DATETIME DEFAULT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_messages_conversation (conversation_id),
    INDEX idx_messages_workspace (workspace_id),
    INDEX idx_messages_company (workspace_id, company_id),
    INDEX idx_messages_channel (conversation_id, channel),
    INDEX idx_messages_created (conversation_id, created_at DESC),
    INDEX idx_messages_provider (provider_message_id),
    
    FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
    FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Pipelines for opportunities (company-scoped)
CREATE TABLE IF NOT EXISTS pipelines (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    company_id INT DEFAULT NULL,
    name VARCHAR(255) NOT NULL,
    is_default BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_pipelines_workspace (workspace_id),
    INDEX idx_pipelines_company (workspace_id, company_id),
    
    FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Pipeline stages
CREATE TABLE IF NOT EXISTS pipeline_stages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    company_id INT DEFAULT NULL,
    pipeline_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    color VARCHAR(20) DEFAULT '#6366f1',
    sort_order INT DEFAULT 0,
    is_won BOOLEAN DEFAULT FALSE,
    is_lost BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_stages_pipeline (pipeline_id),
    INDEX idx_stages_order (pipeline_id, sort_order),
    
    FOREIGN KEY (pipeline_id) REFERENCES pipelines(id) ON DELETE CASCADE,
    FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Opportunities (deals)
CREATE TABLE IF NOT EXISTS opportunities (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    company_id INT DEFAULT NULL,
    contact_id INT DEFAULT NULL,
    pipeline_id INT NOT NULL,
    stage_id INT NOT NULL,
    owner_user_id INT DEFAULT NULL,
    name VARCHAR(255) NOT NULL,
    value DECIMAL(15, 2) DEFAULT 0.00,
    currency VARCHAR(3) DEFAULT 'USD',
    status ENUM('open', 'won', 'lost') DEFAULT 'open',
    expected_close_date DATE DEFAULT NULL,
    actual_close_date DATE DEFAULT NULL,
    lost_reason VARCHAR(500) DEFAULT NULL,
    notes TEXT DEFAULT NULL,
    metadata JSON DEFAULT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_opportunities_workspace (workspace_id),
    INDEX idx_opportunities_company (workspace_id, company_id),
    INDEX idx_opportunities_pipeline (pipeline_id),
    INDEX idx_opportunities_stage (stage_id),
    INDEX idx_opportunities_contact (contact_id),
    INDEX idx_opportunities_owner (owner_user_id),
    INDEX idx_opportunities_status (workspace_id, company_id, status),
    
    FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
    FOREIGN KEY (pipeline_id) REFERENCES pipelines(id) ON DELETE CASCADE,
    FOREIGN KEY (stage_id) REFERENCES pipeline_stages(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Business events (for automations + audit)
CREATE TABLE IF NOT EXISTS business_events (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    company_id INT DEFAULT NULL,
    event_type VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id INT DEFAULT NULL,
    actor_type ENUM('user', 'system', 'contact', 'automation') DEFAULT 'system',
    actor_id INT DEFAULT NULL,
    payload JSON DEFAULT NULL,
    processed BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_events_workspace (workspace_id),
    INDEX idx_events_company (workspace_id, company_id),
    INDEX idx_events_type (event_type),
    INDEX idx_events_entity (entity_type, entity_id),
    INDEX idx_events_created (workspace_id, created_at DESC),
    INDEX idx_events_unprocessed (processed, created_at),
    
    FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default pipeline for existing workspaces (run once)
-- INSERT INTO pipelines (workspace_id, name, is_default) 
-- SELECT id, 'Sales Pipeline', TRUE FROM workspaces WHERE id NOT IN (SELECT DISTINCT workspace_id FROM pipelines);
