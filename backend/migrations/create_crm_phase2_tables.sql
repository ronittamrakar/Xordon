-- CRM Enhancements Phase 2 Migration
-- Creates tables for: Meetings, Conversation Intelligence, Intent Data, Pipeline, Playbooks, Attribution

-- =====================================================
-- MEETINGS MODULE (Requirements 3.2, 3.3)
-- =====================================================

CREATE TABLE IF NOT EXISTS meetings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    contact_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    meeting_type ENUM('call', 'video', 'in_person', 'other') DEFAULT 'call',
    status ENUM('scheduled', 'confirmed', 'completed', 'cancelled', 'no_show') DEFAULT 'scheduled',
    scheduled_at DATETIME NOT NULL,
    duration_minutes INT DEFAULT 30,
    location VARCHAR(500),
    meeting_url VARCHAR(500),
    calendar_event_id VARCHAR(255),
    calendar_provider ENUM('google', 'outlook', 'apple', 'other'),
    notes TEXT,
    outcome TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_contact_id (contact_id),
    INDEX idx_status (status),
    INDEX idx_scheduled_at (scheduled_at)
);

CREATE TABLE IF NOT EXISTS meeting_reminders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    meeting_id INT NOT NULL,
    reminder_type ENUM('email', 'sms', 'push', 'slack') DEFAULT 'email',
    minutes_before INT NOT NULL DEFAULT 30,
    sent_at DATETIME,
    status ENUM('pending', 'sent', 'failed') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (meeting_id) REFERENCES meetings(id) ON DELETE CASCADE,
    INDEX idx_meeting_id (meeting_id),
    INDEX idx_status (status)
);

-- =====================================================
-- CONVERSATION INTELLIGENCE (Requirements 4.1, 4.2, 4.3)
-- =====================================================

CREATE TABLE IF NOT EXISTS call_transcriptions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    call_log_id INT NOT NULL,
    user_id INT NOT NULL,
    transcription_text LONGTEXT,
    speaker_labels JSON,
    duration_seconds INT,
    language VARCHAR(10) DEFAULT 'en',
    provider VARCHAR(50),
    external_id VARCHAR(255),
    status ENUM('pending', 'processing', 'completed', 'failed') DEFAULT 'pending',
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_call_log_id (call_log_id),
    INDEX idx_user_id (user_id),
    INDEX idx_status (status)
);

CREATE TABLE IF NOT EXISTS call_analyses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    transcription_id INT NOT NULL,
    user_id INT NOT NULL,
    sentiment_score DECIMAL(3,2) CHECK (sentiment_score >= 0 AND sentiment_score <= 1),
    intent_score DECIMAL(3,2) CHECK (intent_score >= 0 AND intent_score <= 1),
    engagement_score DECIMAL(3,2) CHECK (engagement_score >= 0 AND engagement_score <= 1),
    key_phrases JSON,
    objections JSON,
    buying_signals JSON,
    action_items JSON,
    summary TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (transcription_id) REFERENCES call_transcriptions(id) ON DELETE CASCADE,
    INDEX idx_transcription_id (transcription_id),
    INDEX idx_user_id (user_id)
);

-- =====================================================
-- INTENT DATA (Requirements 5.1, 5.4)
-- =====================================================

CREATE TABLE IF NOT EXISTS intent_signals (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    contact_id INT,
    company_domain VARCHAR(255),
    company_name VARCHAR(255),
    topic VARCHAR(255) NOT NULL,
    signal_strength ENUM('low', 'medium', 'high', 'very_high') DEFAULT 'medium',
    source VARCHAR(100),
    detected_at DATETIME NOT NULL,
    is_stale BOOLEAN DEFAULT FALSE,
    stale_at DATETIME,
    raw_data JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_contact_id (contact_id),
    INDEX idx_company_domain (company_domain),
    INDEX idx_is_stale (is_stale),
    INDEX idx_signal_strength (signal_strength)
);

-- =====================================================
-- PIPELINE & DEALS (Requirements 6.1, 6.2)
-- =====================================================

CREATE TABLE IF NOT EXISTS deal_stages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    stage_order INT NOT NULL DEFAULT 0,
    probability DECIMAL(5,2) DEFAULT 0 CHECK (probability >= 0 AND probability <= 100),
    color VARCHAR(7) DEFAULT '#3B82F6',
    is_won BOOLEAN DEFAULT FALSE,
    is_lost BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_stage_order (stage_order)
);

CREATE TABLE IF NOT EXISTS deals (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    contact_id INT,
    name VARCHAR(255) NOT NULL,
    value DECIMAL(15,2) DEFAULT 0,
    currency VARCHAR(3) DEFAULT 'USD',
    stage_id INT,
    probability DECIMAL(5,2) CHECK (probability >= 0 AND probability <= 100),
    expected_close_date DATE,
    actual_close_date DATE,
    status ENUM('open', 'won', 'lost') DEFAULT 'open',
    source VARCHAR(100),
    notes TEXT,
    assigned_to INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (stage_id) REFERENCES deal_stages(id) ON DELETE SET NULL,
    INDEX idx_user_id (user_id),
    INDEX idx_contact_id (contact_id),
    INDEX idx_stage_id (stage_id),
    INDEX idx_status (status)
);

CREATE TABLE IF NOT EXISTS deal_stage_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    deal_id INT NOT NULL,
    from_stage_id INT,
    to_stage_id INT,
    changed_by INT,
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    time_in_stage_hours INT,
    FOREIGN KEY (deal_id) REFERENCES deals(id) ON DELETE CASCADE,
    INDEX idx_deal_id (deal_id),
    INDEX idx_changed_at (changed_at)
);

-- =====================================================
-- PLAYBOOKS (Requirements 7.1, 7.4)
-- =====================================================

CREATE TABLE IF NOT EXISTS playbooks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    persona VARCHAR(100),
    channel ENUM('email', 'sms', 'call', 'linkedin', 'multi') DEFAULT 'email',
    templates JSON,
    permissions JSON,
    is_active BOOLEAN DEFAULT TRUE,
    version INT DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_persona (persona),
    INDEX idx_channel (channel)
);

CREATE TABLE IF NOT EXISTS playbook_versions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    playbook_id INT NOT NULL,
    version INT NOT NULL,
    templates JSON,
    changed_by INT,
    change_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (playbook_id) REFERENCES playbooks(id) ON DELETE CASCADE,
    INDEX idx_playbook_id (playbook_id),
    INDEX idx_version (version)
);

-- =====================================================
-- ATTRIBUTION (Requirements 9.1, 9.2)
-- =====================================================

CREATE TABLE IF NOT EXISTS lead_sources (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    category ENUM('organic', 'paid', 'referral', 'direct', 'social', 'email', 'other') DEFAULT 'other',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_category (category)
);

CREATE TABLE IF NOT EXISTS touchpoints (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    contact_id INT NOT NULL,
    source_id INT,
    channel VARCHAR(50) NOT NULL,
    campaign_id INT,
    campaign_type ENUM('email', 'sms', 'call', 'form', 'other'),
    touchpoint_type ENUM('first_touch', 'lead_creation', 'opportunity', 'conversion', 'other') DEFAULT 'other',
    value DECIMAL(15,2) DEFAULT 0,
    metadata JSON,
    occurred_at DATETIME NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (source_id) REFERENCES lead_sources(id) ON DELETE SET NULL,
    INDEX idx_user_id (user_id),
    INDEX idx_contact_id (contact_id),
    INDEX idx_source_id (source_id),
    INDEX idx_occurred_at (occurred_at)
);

-- Insert default deal stages
INSERT INTO deal_stages (user_id, name, stage_order, probability, color, is_won, is_lost) VALUES
(1, 'Lead', 1, 10, '#94A3B8', FALSE, FALSE),
(1, 'Qualified', 2, 25, '#3B82F6', FALSE, FALSE),
(1, 'Proposal', 3, 50, '#8B5CF6', FALSE, FALSE),
(1, 'Negotiation', 4, 75, '#F59E0B', FALSE, FALSE),
(1, 'Closed Won', 5, 100, '#10B981', TRUE, FALSE),
(1, 'Closed Lost', 6, 0, '#EF4444', FALSE, TRUE)
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- Insert default lead sources
INSERT INTO lead_sources (user_id, name, category) VALUES
(1, 'Website', 'organic'),
(1, 'Google Ads', 'paid'),
(1, 'LinkedIn', 'social'),
(1, 'Referral', 'referral'),
(1, 'Cold Outreach', 'direct'),
(1, 'Trade Show', 'other')
ON DUPLICATE KEY UPDATE name = VALUES(name);
