-- Create sms_scheduled_messages table to track pending follow-up messages
CREATE TABLE IF NOT EXISTS sms_scheduled_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    campaign_id INTEGER NOT NULL,
    sequence_id INTEGER NOT NULL,
    step_id INTEGER NOT NULL,
    recipient_id INTEGER NOT NULL,
    phone_number VARCHAR(20) NOT NULL,
    message TEXT NOT NULL,
    scheduled_at DATETIME NOT NULL,
    sent_at DATETIME NULL,
    status VARCHAR(20) DEFAULT 'pending', -- pending, sent, failed, cancelled
    external_id VARCHAR(100) NULL, -- SignalWire message ID
    error_message TEXT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (campaign_id) REFERENCES sms_campaigns(id) ON DELETE CASCADE,
    FOREIGN KEY (sequence_id) REFERENCES sms_sequences(id) ON DELETE CASCADE,
    FOREIGN KEY (step_id) REFERENCES sms_sequence_steps(id) ON DELETE CASCADE,
    FOREIGN KEY (recipient_id) REFERENCES sms_recipients(id) ON DELETE CASCADE
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_sms_scheduled_messages_user_id ON sms_scheduled_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_sms_scheduled_messages_campaign_id ON sms_scheduled_messages(campaign_id);
CREATE INDEX IF NOT EXISTS idx_sms_scheduled_messages_status ON sms_scheduled_messages(status);
CREATE INDEX IF NOT EXISTS idx_sms_scheduled_messages_scheduled_at ON sms_scheduled_messages(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_sms_scheduled_messages_sent_at ON sms_scheduled_messages(sent_at);

-- Create unique index to prevent duplicate scheduled messages
CREATE UNIQUE INDEX IF NOT EXISTS idx_sms_scheduled_messages_unique 
ON sms_scheduled_messages(campaign_id, step_id, recipient_id);