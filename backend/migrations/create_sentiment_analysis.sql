-- Sentiment Analysis Tables for Intelligent Follow-up Automations
-- Stores sentiment analysis results, intent detection, and configuration

-- Sentiment analysis results storage
CREATE TABLE IF NOT EXISTS sentiment_analysis (
    id INT AUTO_INCREMENT PRIMARY KEY,
    contact_id INT NOT NULL,
    user_id INT NOT NULL,
    channel VARCHAR(50) NOT NULL,
    source_type VARCHAR(50) NOT NULL,
    source_id INT,
    original_text TEXT NOT NULL,
    sentiment VARCHAR(20) NOT NULL,
    confidence_score INT NOT NULL,
    detected_keywords JSON,
    is_mixed_sentiment BOOLEAN DEFAULT FALSE,
    dominant_emotion VARCHAR(50),
    analyzed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_sentiment_contact (contact_id),
    INDEX idx_sentiment_user (user_id),
    INDEX idx_sentiment_channel (channel),
    INDEX idx_sentiment_result (sentiment),
    INDEX idx_sentiment_confidence (confidence_score),
    INDEX idx_sentiment_source (source_type, source_id)
);

-- Intent detection results
CREATE TABLE IF NOT EXISTS intent_analysis (
    id INT AUTO_INCREMENT PRIMARY KEY,
    contact_id INT NOT NULL,
    user_id INT NOT NULL,
    channel VARCHAR(50) NOT NULL,
    source_type VARCHAR(50) NOT NULL,
    source_id INT,
    primary_intent VARCHAR(100) NOT NULL,
    primary_confidence INT NOT NULL,
    secondary_intents JSON,
    has_conflict BOOLEAN DEFAULT FALSE,
    conflict_reason TEXT,
    analyzed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_intent_contact (contact_id),
    INDEX idx_intent_user (user_id),
    INDEX idx_intent_primary (primary_intent),
    INDEX idx_intent_confidence (primary_confidence),
    INDEX idx_intent_source (source_type, source_id)
);

-- Sentiment configuration per user
CREATE TABLE IF NOT EXISTS sentiment_config (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    positive_keywords JSON,
    negative_keywords JSON,
    intent_keywords JSON,
    default_confidence_threshold INT DEFAULT 70,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE INDEX idx_sentiment_config_user (user_id)
);

-- Contact sentiment tracking (aggregate across channels)
CREATE TABLE IF NOT EXISTS contact_sentiment_tracking (
    id INT AUTO_INCREMENT PRIMARY KEY,
    contact_id INT NOT NULL,
    user_id INT NOT NULL,
    overall_sentiment_score INT,
    sentiment_trend VARCHAR(20),
    last_sentiment VARCHAR(20),
    sentiment_change_flag BOOLEAN DEFAULT FALSE,
    interaction_count INT DEFAULT 0,
    last_analyzed_at TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE INDEX idx_contact_sentiment (contact_id),
    INDEX idx_sentiment_user (user_id),
    INDEX idx_sentiment_trend (sentiment_trend),
    INDEX idx_sentiment_flag (sentiment_change_flag)
);

-- Alter contact_outcomes to add sentiment/intent fields
ALTER TABLE contact_outcomes
ADD COLUMN IF NOT EXISTS sentiment_score INT,
ADD COLUMN IF NOT EXISTS sentiment_confidence INT,
ADD COLUMN IF NOT EXISTS detected_intent VARCHAR(100),
ADD COLUMN IF NOT EXISTS intent_confidence INT,
ADD COLUMN IF NOT EXISTS analysis_timestamp TIMESTAMP;

-- Alter automation_executions to add trigger reason logging
ALTER TABLE automation_executions
ADD COLUMN IF NOT EXISTS trigger_reason JSON,
ADD COLUMN IF NOT EXISTS skip_reason TEXT,
ADD COLUMN IF NOT EXISTS matched_confidence INT;

-- Alter call_dispositions_types to add semantic categorization
ALTER TABLE call_dispositions_types
ADD COLUMN IF NOT EXISTS semantic_category VARCHAR(50),
ADD COLUMN IF NOT EXISTS semantic_confidence INT;

-- Insert default sentiment configuration for system
INSERT INTO sentiment_config (user_id, positive_keywords, negative_keywords, intent_keywords, default_confidence_threshold)
VALUES (0, 
    '["interested", "excited", "great", "love", "perfect", "amazing", "wonderful", "excellent", "happy", "pleased", "satisfied", "yes", "definitely", "absolutely", "sure", "want", "need", "buy", "purchase", "sign up", "agree", "thanks", "thank you", "appreciate"]',
    '["not interested", "no", "never", "hate", "terrible", "awful", "bad", "worst", "angry", "frustrated", "disappointed", "annoyed", "upset", "complaint", "problem", "issue", "cancel", "refund", "stop", "remove", "unsubscribe", "dont call", "do not call", "leave me alone"]',
    '{"purchase_intent": ["buy", "purchase", "order", "sign up", "subscribe", "interested in buying", "want to buy", "pricing", "cost", "how much"], "callback_request": ["call back", "callback", "call me", "call later", "busy now", "not a good time", "try again"], "complaint": ["complaint", "problem", "issue", "not working", "broken", "disappointed", "frustrated", "angry", "terrible service"], "question": ["question", "how", "what", "when", "where", "why", "can you", "could you", "is it possible", "tell me more"], "referral": ["refer", "friend", "colleague", "recommend", "someone else"], "objection": ["too expensive", "not sure", "need to think", "maybe later", "not now", "budget"], "opt_out": ["stop", "unsubscribe", "remove", "opt out", "optout", "cancel", "do not contact", "dont contact"]}',
    70
) ON DUPLICATE KEY UPDATE user_id = user_id;
