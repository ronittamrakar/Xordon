-- Dedicated Business Phone Lines Module
-- Tables for phone numbers, routing, voicemail, and call management

-- Phone numbers (purchased/assigned)
CREATE TABLE IF NOT EXISTS phone_numbers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    phone_number VARCHAR(20) NOT NULL,
    friendly_name VARCHAR(255) NULL,
    provider ENUM('twilio', 'signalwire', 'vonage', 'other') NOT NULL DEFAULT 'twilio',
    provider_sid VARCHAR(255) NULL,
    country_code VARCHAR(5) NOT NULL DEFAULT 'US',
    capabilities JSON NULL, -- {"voice": true, "sms": true, "mms": true}
    type ENUM('local', 'toll_free', 'mobile') NOT NULL DEFAULT 'local',
    status ENUM('active', 'suspended', 'released', 'pending') NOT NULL DEFAULT 'active',
    monthly_cost DECIMAL(10, 2) NULL,
    assigned_to_user_id INT NULL,
    is_primary BOOLEAN NOT NULL DEFAULT FALSE,
    voice_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    sms_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    purchased_at DATETIME NULL,
    released_at DATETIME NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_phone_numbers_user (user_id),
    INDEX idx_phone_numbers_number (phone_number),
    INDEX idx_phone_numbers_status (status),
    UNIQUE KEY unique_phone_number (phone_number),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Call routing rules
CREATE TABLE IF NOT EXISTS call_routing_rules (
    id INT AUTO_INCREMENT PRIMARY KEY,
    phone_number_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    priority INT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    -- Conditions
    condition_type ENUM('always', 'time_based', 'caller_id', 'ivr_selection') NOT NULL DEFAULT 'always',
    condition_data JSON NULL, -- {"days": [1,2,3,4,5], "start_time": "09:00", "end_time": "17:00"}
    -- Actions
    action_type ENUM('forward', 'voicemail', 'ivr', 'queue', 'hangup', 'play_message') NOT NULL DEFAULT 'forward',
    forward_to VARCHAR(50) NULL,
    voicemail_greeting_url VARCHAR(500) NULL,
    ivr_menu_id INT NULL,
    play_message_url VARCHAR(500) NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_routing_phone (phone_number_id),
    FOREIGN KEY (phone_number_id) REFERENCES phone_numbers(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- IVR Menus (Interactive Voice Response)
CREATE TABLE IF NOT EXISTS ivr_menus (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    greeting_text TEXT,
    greeting_audio_url VARCHAR(500) NULL,
    timeout_seconds INT NOT NULL DEFAULT 10,
    max_retries INT NOT NULL DEFAULT 3,
    invalid_input_message TEXT,
    timeout_action ENUM('repeat', 'voicemail', 'forward', 'hangup') NOT NULL DEFAULT 'repeat',
    timeout_forward_to VARCHAR(50) NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_ivr_user (user_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- IVR Menu Options
CREATE TABLE IF NOT EXISTS ivr_menu_options (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ivr_menu_id INT NOT NULL,
    digit CHAR(1) NOT NULL, -- 0-9, *, #
    description VARCHAR(255) NOT NULL,
    action_type ENUM('forward', 'voicemail', 'submenu', 'queue', 'hangup', 'repeat') NOT NULL,
    forward_to VARCHAR(50) NULL,
    submenu_id INT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_ivr_options_menu (ivr_menu_id),
    FOREIGN KEY (ivr_menu_id) REFERENCES ivr_menus(id) ON DELETE CASCADE,
    FOREIGN KEY (submenu_id) REFERENCES ivr_menus(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Voicemails
CREATE TABLE IF NOT EXISTS voicemails (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    phone_number_id INT NOT NULL,
    caller_number VARCHAR(50) NOT NULL,
    caller_name VARCHAR(255) NULL,
    contact_id INT NULL,
    duration_seconds INT NOT NULL DEFAULT 0,
    recording_url VARCHAR(500) NOT NULL,
    transcription TEXT,
    transcription_status ENUM('pending', 'completed', 'failed', 'disabled') NOT NULL DEFAULT 'pending',
    status ENUM('new', 'read', 'archived', 'deleted') NOT NULL DEFAULT 'new',
    received_at DATETIME NOT NULL,
    read_at DATETIME NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_voicemails_user (user_id),
    INDEX idx_voicemails_phone (phone_number_id),
    INDEX idx_voicemails_status (status),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (phone_number_id) REFERENCES phone_numbers(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Call logs (detailed call history)
CREATE TABLE IF NOT EXISTS phone_call_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    phone_number_id INT NULL,
    call_sid VARCHAR(255) NULL,
    direction ENUM('inbound', 'outbound') NOT NULL,
    from_number VARCHAR(50) NOT NULL,
    to_number VARCHAR(50) NOT NULL,
    contact_id INT NULL,
    status ENUM('queued', 'ringing', 'in_progress', 'completed', 'busy', 'failed', 'no_answer', 'cancelled') NOT NULL,
    duration_seconds INT NOT NULL DEFAULT 0,
    recording_url VARCHAR(500) NULL,
    recording_duration INT NULL,
    answered_by ENUM('human', 'machine', 'unknown') NULL,
    cost DECIMAL(10, 4) NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    started_at DATETIME NOT NULL,
    answered_at DATETIME NULL,
    ended_at DATETIME NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_call_logs_user (user_id),
    INDEX idx_call_logs_phone (phone_number_id),
    INDEX idx_call_logs_contact (contact_id),
    INDEX idx_call_logs_started (started_at),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (phone_number_id) REFERENCES phone_numbers(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Phone settings
CREATE TABLE IF NOT EXISTS phone_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    provider ENUM('twilio', 'signalwire', 'vonage') NOT NULL DEFAULT 'twilio',
    twilio_account_sid VARCHAR(255) NULL,
    twilio_auth_token_encrypted TEXT NULL,
    signalwire_space_url VARCHAR(255) NULL,
    signalwire_project_id VARCHAR(255) NULL,
    signalwire_api_token_encrypted TEXT NULL,
    default_caller_id VARCHAR(50) NULL,
    voicemail_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    voicemail_greeting_url VARCHAR(500) NULL,
    voicemail_transcription BOOLEAN NOT NULL DEFAULT TRUE,
    call_recording_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    call_recording_consent_message TEXT,
    business_hours_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    after_hours_action ENUM('voicemail', 'forward', 'message') NOT NULL DEFAULT 'voicemail',
    after_hours_forward_to VARCHAR(50) NULL,
    after_hours_message TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- SMS conversations (for business line texting)
CREATE TABLE IF NOT EXISTS phone_sms_conversations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    phone_number_id INT NOT NULL,
    contact_number VARCHAR(50) NOT NULL,
    contact_id INT NULL,
    last_message_at DATETIME NOT NULL,
    last_message_preview VARCHAR(255) NULL,
    unread_count INT NOT NULL DEFAULT 0,
    status ENUM('active', 'archived') NOT NULL DEFAULT 'active',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_sms_conv_user (user_id),
    INDEX idx_sms_conv_phone (phone_number_id),
    UNIQUE KEY unique_conversation (phone_number_id, contact_number),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (phone_number_id) REFERENCES phone_numbers(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- SMS messages for business line
CREATE TABLE IF NOT EXISTS phone_sms_messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    conversation_id INT NOT NULL,
    direction ENUM('inbound', 'outbound') NOT NULL,
    message_sid VARCHAR(255) NULL,
    from_number VARCHAR(50) NOT NULL,
    to_number VARCHAR(50) NOT NULL,
    body TEXT NOT NULL,
    media_urls JSON NULL,
    status ENUM('queued', 'sent', 'delivered', 'failed', 'received') NOT NULL DEFAULT 'queued',
    error_code VARCHAR(50) NULL,
    error_message TEXT NULL,
    cost DECIMAL(10, 4) NULL,
    sent_at DATETIME NULL,
    delivered_at DATETIME NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_sms_messages_conv (conversation_id),
    INDEX idx_sms_messages_created (created_at),
    FOREIGN KEY (conversation_id) REFERENCES phone_sms_conversations(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
