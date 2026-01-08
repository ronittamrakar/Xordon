-- =====================================================
-- Messaging Channels: WhatsApp, LinkedIn, Messenger
-- Adds support for multi-channel outreach automation
-- =====================================================

-- =====================================================
-- 1. CHANNEL ACCOUNTS (unified table for all channels)
-- =====================================================
CREATE TABLE IF NOT EXISTS channel_accounts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    workspace_id INT NULL,
    company_id INT NULL,
    
    -- Channel type: whatsapp, linkedin, messenger, instagram
    channel VARCHAR(50) NOT NULL,
    
    -- Display info
    name VARCHAR(255) NOT NULL,
    description TEXT NULL,
    
    -- Status
    status ENUM('active', 'inactive', 'pending', 'error', 'disconnected') DEFAULT 'pending',
    status_message TEXT NULL,
    
    -- Provider (meta, twilio, etc.)
    provider VARCHAR(50) DEFAULT 'meta',
    
    -- Credentials (JSON - encrypted at app level)
    credentials JSON NULL,
    
    -- Channel-specific identifiers
    external_id VARCHAR(255) NULL,  -- e.g., phone_number_id for WhatsApp, page_id for Messenger
    external_name VARCHAR(255) NULL, -- e.g., phone number display, page name
    
    -- Webhook config
    webhook_verify_token VARCHAR(255) NULL,
    webhook_secret VARCHAR(255) NULL,
    webhook_url VARCHAR(500) NULL,
    last_webhook_at DATETIME NULL,
    
    -- Rate limits
    daily_limit INT DEFAULT 1000,
    hourly_limit INT DEFAULT 100,
    sent_today INT DEFAULT 0,
    sent_this_hour INT DEFAULT 0,
    last_reset_date DATE NULL,
    last_reset_hour DATETIME NULL,
    
    -- Quality/health
    quality_rating VARCHAR(50) NULL,  -- WhatsApp quality rating
    messaging_tier VARCHAR(50) NULL,  -- WhatsApp messaging tier
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_channel_accounts_user (user_id),
    INDEX idx_channel_accounts_workspace (workspace_id),
    INDEX idx_channel_accounts_channel (channel),
    INDEX idx_channel_accounts_status (status),
    UNIQUE INDEX idx_channel_accounts_external (channel, external_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 2. WHATSAPP TEMPLATES (approved templates from Meta)
-- =====================================================
CREATE TABLE IF NOT EXISTS whatsapp_templates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    workspace_id INT NULL,
    channel_account_id INT NOT NULL,
    
    -- Template identifiers from Meta
    template_id VARCHAR(255) NOT NULL,  -- Meta's template ID
    name VARCHAR(255) NOT NULL,
    language VARCHAR(10) NOT NULL DEFAULT 'en',
    
    -- Template details
    category VARCHAR(50) NULL,  -- MARKETING, UTILITY, AUTHENTICATION
    status VARCHAR(50) DEFAULT 'PENDING',  -- APPROVED, PENDING, REJECTED
    
    -- Components (header, body, footer, buttons) as JSON
    components JSON NULL,
    
    -- Variable mappings (which contact fields map to {{1}}, {{2}}, etc.)
    variable_mappings JSON NULL,
    
    -- Preview
    preview_text TEXT NULL,
    
    -- Sync info
    last_synced_at DATETIME NULL,
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_wa_templates_user (user_id),
    INDEX idx_wa_templates_workspace (workspace_id),
    INDEX idx_wa_templates_account (channel_account_id),
    INDEX idx_wa_templates_status (status),
    UNIQUE INDEX idx_wa_templates_unique (channel_account_id, template_id, language),
    
    FOREIGN KEY (channel_account_id) REFERENCES channel_accounts(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 3. CHANNEL MESSAGES (unified message log)
-- =====================================================
CREATE TABLE IF NOT EXISTS channel_messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    workspace_id INT NULL,
    company_id INT NULL,
    channel_account_id INT NOT NULL,
    
    -- Channel type
    channel VARCHAR(50) NOT NULL,
    
    -- Direction
    direction ENUM('outbound', 'inbound') NOT NULL,
    
    -- Contact info
    contact_id INT NULL,
    recipient_address VARCHAR(255) NOT NULL,  -- phone number, PSID, etc.
    recipient_name VARCHAR(255) NULL,
    
    -- Message content
    message_type VARCHAR(50) DEFAULT 'text',  -- text, template, image, document, etc.
    content TEXT NULL,
    template_id INT NULL,  -- Reference to whatsapp_templates if template message
    template_name VARCHAR(255) NULL,
    template_variables JSON NULL,
    
    -- Media
    media_url VARCHAR(500) NULL,
    media_type VARCHAR(50) NULL,
    media_id VARCHAR(255) NULL,
    
    -- Status tracking
    status ENUM('queued', 'sent', 'delivered', 'read', 'failed', 'received') DEFAULT 'queued',
    status_updated_at DATETIME NULL,
    
    -- Provider message IDs
    provider_message_id VARCHAR(255) NULL,  -- Meta's message ID
    provider_conversation_id VARCHAR(255) NULL,
    
    -- Error handling
    error_code VARCHAR(50) NULL,
    error_message TEXT NULL,
    retry_count INT DEFAULT 0,
    max_retries INT DEFAULT 3,
    next_retry_at DATETIME NULL,
    
    -- Automation/campaign context
    automation_id INT NULL,
    automation_execution_id INT NULL,
    campaign_id INT NULL,
    
    -- Timestamps
    scheduled_at DATETIME NULL,
    sent_at DATETIME NULL,
    delivered_at DATETIME NULL,
    read_at DATETIME NULL,
    received_at DATETIME NULL,
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_channel_messages_user (user_id),
    INDEX idx_channel_messages_workspace (workspace_id),
    INDEX idx_channel_messages_account (channel_account_id),
    INDEX idx_channel_messages_contact (contact_id),
    INDEX idx_channel_messages_channel (channel),
    INDEX idx_channel_messages_status (status),
    INDEX idx_channel_messages_direction (direction),
    INDEX idx_channel_messages_provider_id (provider_message_id),
    INDEX idx_channel_messages_created (created_at),
    
    FOREIGN KEY (channel_account_id) REFERENCES channel_accounts(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 4. CHANNEL CONVERSATIONS (for inbox/thread view)
-- =====================================================
CREATE TABLE IF NOT EXISTS channel_conversations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    workspace_id INT NULL,
    company_id INT NULL,
    channel_account_id INT NOT NULL,
    
    -- Channel type
    channel VARCHAR(50) NOT NULL,
    
    -- Contact info
    contact_id INT NULL,
    participant_address VARCHAR(255) NOT NULL,
    participant_name VARCHAR(255) NULL,
    
    -- Conversation state
    status ENUM('open', 'closed', 'pending', 'snoozed') DEFAULT 'open',
    unread_count INT DEFAULT 0,
    
    -- Last message preview
    last_message_preview TEXT NULL,
    last_message_at DATETIME NULL,
    last_message_direction ENUM('outbound', 'inbound') NULL,
    
    -- WhatsApp-specific: 24h window tracking
    window_expires_at DATETIME NULL,  -- When the 24h customer care window expires
    can_send_template_only BOOLEAN DEFAULT TRUE,
    
    -- Assignment
    assigned_user_id INT NULL,
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_channel_convos_user (user_id),
    INDEX idx_channel_convos_workspace (workspace_id),
    INDEX idx_channel_convos_account (channel_account_id),
    INDEX idx_channel_convos_contact (contact_id),
    INDEX idx_channel_convos_status (status),
    INDEX idx_channel_convos_last_msg (last_message_at),
    UNIQUE INDEX idx_channel_convos_unique (channel_account_id, participant_address),
    
    FOREIGN KEY (channel_account_id) REFERENCES channel_accounts(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 5. LINKEDIN TASKS (compliant approach - tasks for reps)
-- =====================================================
CREATE TABLE IF NOT EXISTS linkedin_tasks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    workspace_id INT NULL,
    company_id INT NULL,
    
    -- Contact info
    contact_id INT NULL,
    linkedin_url VARCHAR(500) NULL,
    contact_name VARCHAR(255) NULL,
    contact_title VARCHAR(255) NULL,
    contact_company VARCHAR(255) NULL,
    
    -- Task details
    task_type ENUM('send_connection', 'send_message', 'engage_post', 'follow_up', 'other') DEFAULT 'send_message',
    title VARCHAR(255) NOT NULL,
    description TEXT NULL,
    
    -- Suggested message template
    template_id INT NULL,
    suggested_message TEXT NULL,
    
    -- Status
    status ENUM('pending', 'in_progress', 'completed', 'skipped', 'failed') DEFAULT 'pending',
    completed_at DATETIME NULL,
    completed_by INT NULL,
    completion_notes TEXT NULL,
    
    -- Priority and scheduling
    priority ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium',
    due_date DATE NULL,
    reminder_at DATETIME NULL,
    
    -- Automation context
    automation_id INT NULL,
    automation_execution_id INT NULL,
    
    -- Assignment
    assigned_user_id INT NULL,
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_linkedin_tasks_user (user_id),
    INDEX idx_linkedin_tasks_workspace (workspace_id),
    INDEX idx_linkedin_tasks_contact (contact_id),
    INDEX idx_linkedin_tasks_status (status),
    INDEX idx_linkedin_tasks_due (due_date),
    INDEX idx_linkedin_tasks_assigned (assigned_user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 6. LINKEDIN TEMPLATES (message templates for reps)
-- =====================================================
CREATE TABLE IF NOT EXISTS linkedin_templates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    workspace_id INT NULL,
    
    -- Template info
    name VARCHAR(255) NOT NULL,
    description TEXT NULL,
    category VARCHAR(50) DEFAULT 'general',
    
    -- Content
    message_type ENUM('connection_request', 'direct_message', 'inmail', 'follow_up') DEFAULT 'direct_message',
    subject VARCHAR(255) NULL,  -- For InMail
    message TEXT NOT NULL,
    
    -- Variables (e.g., {{first_name}}, {{company}})
    variables JSON NULL,
    
    -- Usage stats
    usage_count INT DEFAULT 0,
    last_used_at DATETIME NULL,
    
    -- Favorites
    is_favorite BOOLEAN DEFAULT FALSE,
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_linkedin_templates_user (user_id),
    INDEX idx_linkedin_templates_workspace (workspace_id),
    INDEX idx_linkedin_templates_category (category),
    INDEX idx_linkedin_templates_type (message_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 7. LINKEDIN LEAD GEN FORMS (synced from LinkedIn Ads)
-- =====================================================
CREATE TABLE IF NOT EXISTS linkedin_lead_forms (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    workspace_id INT NULL,
    
    -- LinkedIn identifiers
    form_id VARCHAR(255) NOT NULL,
    form_name VARCHAR(255) NOT NULL,
    account_id VARCHAR(255) NULL,
    campaign_id VARCHAR(255) NULL,
    
    -- Form config
    fields JSON NULL,  -- Field definitions
    
    -- Sync status
    last_synced_at DATETIME NULL,
    sync_status VARCHAR(50) DEFAULT 'active',
    
    -- Stats
    total_leads INT DEFAULT 0,
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_linkedin_forms_user (user_id),
    INDEX idx_linkedin_forms_workspace (workspace_id),
    UNIQUE INDEX idx_linkedin_forms_form_id (form_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 8. LINKEDIN LEADS (captured from Lead Gen Forms)
-- =====================================================
CREATE TABLE IF NOT EXISTS linkedin_leads (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    workspace_id INT NULL,
    company_id INT NULL,
    form_id INT NOT NULL,
    
    -- LinkedIn lead ID
    lead_id VARCHAR(255) NOT NULL,
    
    -- Contact data (from form submission)
    email VARCHAR(255) NULL,
    first_name VARCHAR(255) NULL,
    last_name VARCHAR(255) NULL,
    phone VARCHAR(50) NULL,
    company VARCHAR(255) NULL,
    job_title VARCHAR(255) NULL,
    linkedin_url VARCHAR(500) NULL,
    
    -- All form fields as JSON
    form_data JSON NULL,
    
    -- Processing status
    status ENUM('new', 'processed', 'synced_to_crm', 'error') DEFAULT 'new',
    contact_id INT NULL,  -- Link to contacts table after sync
    
    -- Timestamps
    submitted_at DATETIME NULL,
    processed_at DATETIME NULL,
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_linkedin_leads_user (user_id),
    INDEX idx_linkedin_leads_workspace (workspace_id),
    INDEX idx_linkedin_leads_form (form_id),
    INDEX idx_linkedin_leads_status (status),
    INDEX idx_linkedin_leads_email (email),
    UNIQUE INDEX idx_linkedin_leads_lead_id (lead_id),
    
    FOREIGN KEY (form_id) REFERENCES linkedin_lead_forms(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 9. CONTACT OPT-INS (consent tracking per channel)
-- =====================================================
CREATE TABLE IF NOT EXISTS contact_channel_optins (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    workspace_id INT NULL,
    contact_id INT NOT NULL,
    
    -- Channel
    channel VARCHAR(50) NOT NULL,  -- whatsapp, sms, messenger, email
    
    -- Address for this channel
    channel_address VARCHAR(255) NOT NULL,  -- phone, email, PSID
    
    -- Opt-in status
    status ENUM('opted_in', 'opted_out', 'pending', 'unknown') DEFAULT 'unknown',
    
    -- Consent details
    consent_source VARCHAR(100) NULL,  -- form, import, manual, api
    consent_text TEXT NULL,
    consent_ip VARCHAR(50) NULL,
    
    -- Timestamps
    opted_in_at DATETIME NULL,
    opted_out_at DATETIME NULL,
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_optins_user (user_id),
    INDEX idx_optins_workspace (workspace_id),
    INDEX idx_optins_contact (contact_id),
    INDEX idx_optins_channel (channel),
    INDEX idx_optins_status (status),
    UNIQUE INDEX idx_optins_unique (contact_id, channel, channel_address)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 10. ADD CHANNEL FIELDS TO CONTACTS TABLE
-- =====================================================
ALTER TABLE contacts 
    ADD COLUMN IF NOT EXISTS whatsapp_number VARCHAR(50) NULL AFTER phone,
    ADD COLUMN IF NOT EXISTS whatsapp_opted_in BOOLEAN DEFAULT FALSE AFTER whatsapp_number,
    ADD COLUMN IF NOT EXISTS messenger_psid VARCHAR(255) NULL AFTER whatsapp_opted_in,
    ADD COLUMN IF NOT EXISTS messenger_opted_in BOOLEAN DEFAULT FALSE AFTER messenger_psid,
    ADD COLUMN IF NOT EXISTS instagram_id VARCHAR(255) NULL AFTER messenger_opted_in,
    ADD COLUMN IF NOT EXISTS instagram_opted_in BOOLEAN DEFAULT FALSE AFTER instagram_id,
    ADD COLUMN IF NOT EXISTS linkedin_url VARCHAR(500) NULL AFTER instagram_opted_in,
    ADD COLUMN IF NOT EXISTS linkedin_member_id VARCHAR(255) NULL AFTER linkedin_url;

-- Add indexes for new contact fields
CREATE INDEX IF NOT EXISTS idx_contacts_whatsapp ON contacts(whatsapp_number);
CREATE INDEX IF NOT EXISTS idx_contacts_messenger ON contacts(messenger_psid);
CREATE INDEX IF NOT EXISTS idx_contacts_linkedin ON contacts(linkedin_url);

-- =====================================================
-- 11. EXTEND FOLLOWUP_AUTOMATIONS FOR NEW CHANNELS
-- =====================================================
-- The existing followup_automations table uses a 'channel' column
-- We just need to ensure the new channel values are accepted
-- (MySQL ENUM would need ALTER, but if it's VARCHAR it's fine)

-- Add new trigger types and action types to the automation system
-- This is handled in PHP code, but we can add a reference table

CREATE TABLE IF NOT EXISTS automation_channel_config (
    id INT AUTO_INCREMENT PRIMARY KEY,
    channel VARCHAR(50) NOT NULL,
    
    -- Trigger types available for this channel (JSON array)
    trigger_types JSON NOT NULL,
    
    -- Action types available for this channel (JSON array)
    action_types JSON NOT NULL,
    
    -- Channel-specific settings schema
    settings_schema JSON NULL,
    
    -- Display info
    display_name VARCHAR(100) NOT NULL,
    icon VARCHAR(50) NULL,
    color VARCHAR(20) NULL,
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE INDEX idx_channel_config_channel (channel)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default channel configurations
INSERT INTO automation_channel_config (channel, trigger_types, action_types, display_name, icon, color) VALUES
('whatsapp', 
 '["message_received", "message_delivered", "message_read", "message_failed", "opted_out", "keyword_match", "no_reply_timeout"]',
 '["send_whatsapp_template", "send_whatsapp_message", "add_tag", "remove_tag", "update_status", "notify_user", "webhook", "create_task"]',
 'WhatsApp', 'message-circle', '#25D366'),
 
('messenger',
 '["message_received", "message_delivered", "message_read", "postback", "opted_out", "keyword_match"]',
 '["send_messenger_message", "send_messenger_template", "add_tag", "remove_tag", "update_status", "notify_user", "webhook", "create_task"]',
 'Messenger', 'facebook', '#0084FF'),
 
('linkedin',
 '["lead_form_submitted", "task_completed", "task_overdue"]',
 '["create_linkedin_task", "send_email", "send_sms", "add_tag", "remove_tag", "update_status", "notify_user", "webhook"]',
 'LinkedIn', 'linkedin', '#0A66C2'),
 
('instagram',
 '["message_received", "story_mention", "story_reply", "comment"]',
 '["send_instagram_message", "add_tag", "remove_tag", "update_status", "notify_user", "webhook", "create_task"]',
 'Instagram', 'instagram', '#E4405F')

ON DUPLICATE KEY UPDATE 
    trigger_types = VALUES(trigger_types),
    action_types = VALUES(action_types),
    display_name = VALUES(display_name),
    icon = VALUES(icon),
    color = VALUES(color);

-- =====================================================
-- 12. WEBHOOK EVENTS LOG (for debugging/audit)
-- =====================================================
CREATE TABLE IF NOT EXISTS webhook_events (
    id INT AUTO_INCREMENT PRIMARY KEY,
    
    -- Source
    channel VARCHAR(50) NOT NULL,
    provider VARCHAR(50) NOT NULL,
    
    -- Event details
    event_type VARCHAR(100) NULL,
    event_id VARCHAR(255) NULL,
    
    -- Raw payload
    payload JSON NOT NULL,
    headers JSON NULL,
    
    -- Processing status
    status ENUM('received', 'processed', 'failed', 'ignored') DEFAULT 'received',
    error_message TEXT NULL,
    
    -- Linked records
    channel_account_id INT NULL,
    message_id INT NULL,
    
    -- IP and signature
    source_ip VARCHAR(50) NULL,
    signature_valid BOOLEAN NULL,
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    processed_at DATETIME NULL,
    
    INDEX idx_webhook_events_channel (channel),
    INDEX idx_webhook_events_status (status),
    INDEX idx_webhook_events_created (created_at),
    INDEX idx_webhook_events_event_id (event_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 13. CHANNEL SETTINGS (per-workspace channel config)
-- =====================================================
CREATE TABLE IF NOT EXISTS channel_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    workspace_id INT NULL,
    
    channel VARCHAR(50) NOT NULL,
    
    -- Settings JSON
    settings JSON NOT NULL,
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE INDEX idx_channel_settings_unique (workspace_id, channel)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default settings
INSERT INTO channel_settings (user_id, workspace_id, channel, settings) VALUES
(0, NULL, 'whatsapp', '{
    "quiet_hours_enabled": true,
    "quiet_hours_start": "21:00",
    "quiet_hours_end": "08:00",
    "timezone": "America/New_York",
    "auto_reply_enabled": false,
    "auto_reply_message": "",
    "stop_keywords": ["STOP", "UNSUBSCRIBE", "CANCEL", "END", "QUIT"],
    "default_template_language": "en"
}'),
(0, NULL, 'messenger', '{
    "quiet_hours_enabled": true,
    "quiet_hours_start": "21:00",
    "quiet_hours_end": "08:00",
    "timezone": "America/New_York",
    "auto_reply_enabled": false,
    "auto_reply_message": "",
    "greeting_text": ""
}'),
(0, NULL, 'linkedin', '{
    "task_default_priority": "medium",
    "task_reminder_hours": 24,
    "auto_create_contact": true,
    "lead_sync_enabled": false
}')
ON DUPLICATE KEY UPDATE settings = VALUES(settings);
