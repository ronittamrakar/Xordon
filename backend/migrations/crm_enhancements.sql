-- Phase 1: CRM Enhancements
-- Enhanced contact management like Thryv

-- Contact lifecycle stages
CREATE TABLE IF NOT EXISTS contact_stages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    
    name VARCHAR(50) NOT NULL,
    description VARCHAR(255) NULL,
    color VARCHAR(7) DEFAULT '#6366f1',
    sort_order INT DEFAULT 0,
    is_default TINYINT(1) DEFAULT 0,
    is_system TINYINT(1) DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE KEY uk_workspace_name (workspace_id, name),
    INDEX idx_stages_workspace (workspace_id, sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default contact stages
INSERT INTO contact_stages (workspace_id, name, color, sort_order, is_default, is_system) VALUES
(1, 'New', '#3b82f6', 0, 1, 1),
(1, 'Contacted', '#8b5cf6', 1, 0, 1),
(1, 'Qualified', '#f97316', 2, 0, 1),
(1, 'Proposal Sent', '#eab308', 3, 0, 1),
(1, 'Customer', '#22c55e', 4, 0, 1),
(1, 'Lost', '#ef4444', 5, 0, 1)
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- Enhance contacts table with additional fields
ALTER TABLE contacts
ADD COLUMN IF NOT EXISTS stage_id INT NULL AFTER status,
ADD COLUMN IF NOT EXISTS lead_source_id INT NULL AFTER stage_id,
ADD COLUMN IF NOT EXISTS assigned_to INT NULL AFTER lead_source_id,
ADD COLUMN IF NOT EXISTS lifetime_value DECIMAL(12,2) DEFAULT 0 AFTER assigned_to,
ADD COLUMN IF NOT EXISTS last_contacted_at TIMESTAMP NULL AFTER lifetime_value,
ADD COLUMN IF NOT EXISTS next_followup_at TIMESTAMP NULL AFTER last_contacted_at,
ADD COLUMN IF NOT EXISTS birthday DATE NULL AFTER next_followup_at,
ADD COLUMN IF NOT EXISTS anniversary DATE NULL AFTER birthday,
ADD COLUMN IF NOT EXISTS preferred_contact_method ENUM('email', 'phone', 'sms', 'any') DEFAULT 'any' AFTER anniversary,
ADD COLUMN IF NOT EXISTS do_not_contact TINYINT(1) DEFAULT 0 AFTER preferred_contact_method,
ADD COLUMN IF NOT EXISTS rating TINYINT NULL COMMENT '1-5 star rating' AFTER do_not_contact,
ADD COLUMN IF NOT EXISTS score INT DEFAULT 0 COMMENT 'Lead score' AFTER rating,
ADD INDEX IF NOT EXISTS idx_contacts_stage (stage_id),
ADD INDEX IF NOT EXISTS idx_contacts_source (lead_source_id),
ADD INDEX IF NOT EXISTS idx_contacts_assigned (assigned_to),
ADD INDEX IF NOT EXISTS idx_contacts_followup (workspace_id, next_followup_at);

-- Contact relationships (for referrals, family, etc.)
CREATE TABLE IF NOT EXISTS contact_relationships (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    
    contact_id INT NOT NULL,
    related_contact_id INT NOT NULL,
    relationship_type VARCHAR(50) NOT NULL COMMENT 'spouse, child, parent, referral, colleague, etc.',
    
    -- Bidirectional relationship
    is_bidirectional TINYINT(1) DEFAULT 1,
    reverse_relationship_type VARCHAR(50) NULL,
    
    notes TEXT NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE KEY uk_relationship (contact_id, related_contact_id, relationship_type),
    INDEX idx_relationships_contact (contact_id),
    INDEX idx_relationships_related (related_contact_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Lead scoring rules
CREATE TABLE IF NOT EXISTS lead_scoring_rules (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    
    name VARCHAR(100) NOT NULL,
    description TEXT NULL,
    
    -- Trigger conditions (JSON)
    conditions JSON NOT NULL COMMENT '{"field": "email_opened", "operator": "equals", "value": true}',
    
    -- Score adjustment
    score_change INT NOT NULL COMMENT 'Positive or negative',
    
    -- Limits
    max_applications INT NULL COMMENT 'Max times this rule can apply per contact',
    
    is_active TINYINT(1) DEFAULT 1,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_scoring_workspace (workspace_id, is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default scoring rules
INSERT INTO lead_scoring_rules (workspace_id, name, conditions, score_change) VALUES
(1, 'Email Opened', '{"field": "email_opened", "operator": "equals", "value": true}', 5),
(1, 'Link Clicked', '{"field": "link_clicked", "operator": "equals", "value": true}', 10),
(1, 'Form Submitted', '{"field": "form_submitted", "operator": "equals", "value": true}', 20),
(1, 'Appointment Booked', '{"field": "appointment_booked", "operator": "equals", "value": true}', 30),
(1, 'Phone Call Made', '{"field": "call_made", "operator": "equals", "value": true}', 15),
(1, 'Invoice Paid', '{"field": "invoice_paid", "operator": "equals", "value": true}', 50),
(1, 'Inactive 30 Days', '{"field": "days_inactive", "operator": "greater_than", "value": 30}', -10),
(1, 'Email Bounced', '{"field": "email_bounced", "operator": "equals", "value": true}', -20)
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- Contact notes (separate from activities for quick notes)
CREATE TABLE IF NOT EXISTS contact_notes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    contact_id INT NOT NULL,
    user_id INT NULL,
    
    content TEXT NOT NULL,
    is_pinned TINYINT(1) DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_notes_contact (contact_id, created_at DESC),
    INDEX idx_notes_pinned (contact_id, is_pinned)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Saved contact filters/segments
CREATE TABLE IF NOT EXISTS contact_segments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    
    name VARCHAR(100) NOT NULL,
    description TEXT NULL,
    
    -- Filter criteria (JSON)
    filters JSON NOT NULL,
    
    -- Cached count
    contact_count INT DEFAULT 0,
    last_calculated_at TIMESTAMP NULL,
    
    -- Display
    color VARCHAR(7) DEFAULT '#6366f1',
    icon VARCHAR(50) NULL,
    is_dynamic TINYINT(1) DEFAULT 1 COMMENT 'Auto-update membership',
    
    created_by INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_segments_workspace (workspace_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Static segment membership (for non-dynamic segments)
CREATE TABLE IF NOT EXISTS contact_segment_members (
    id INT AUTO_INCREMENT PRIMARY KEY,
    segment_id INT NOT NULL,
    contact_id INT NOT NULL,
    
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    added_by INT NULL,
    
    UNIQUE KEY uk_segment_contact (segment_id, contact_id),
    INDEX idx_members_contact (contact_id),
    
    FOREIGN KEY (segment_id) REFERENCES contact_segments(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
