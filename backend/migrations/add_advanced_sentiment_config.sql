-- Advanced Sentiment Configuration System
-- Supports multiple ML providers, auto-retraining, and multi-tenancy

-- Main sentiment configs table
CREATE TABLE IF NOT EXISTS sentiment_configs (
    id CHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    scope ENUM('global', 'workspace', 'company', 'campaign', 'user') NOT NULL DEFAULT 'workspace',
    scope_id CHAR(36), -- workspace_id, company_id, campaign_id, or user_id
    mode ENUM('keyword', 'ml') NOT NULL DEFAULT 'keyword',
    version INT UNSIGNED NOT NULL DEFAULT 1,
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    
    -- Model configuration (stored as JSON)
    model_config JSON NOT NULL,
    
    -- Thresholds and mappings
    threshold_config JSON NOT NULL,
    label_mapping JSON,
    
    -- Derived metrics configuration
    derived_metrics_config JSON,
    
    -- Sampling configuration
    sampling_config JSON,
    
    -- Feedback and retraining
    feedback_config JSON,
    
    -- Drift detection
    drift_detection_config JSON,
    
    -- Parent config for inheritance
    parent_config_id CHAR(36),
    
    -- Metadata
    created_by CHAR(36) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    
    INDEX idx_scope_enabled (scope, enabled),
    INDEX idx_scope_id (scope_id),
    INDEX idx_mode (mode),
    INDEX idx_created_by (created_by),
    INDEX idx_deleted_at (deleted_at),
    FOREIGN KEY (parent_config_id) REFERENCES sentiment_configs(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Sentiment predictions table
CREATE TABLE IF NOT EXISTS sentiment_predictions (
    id CHAR(36) PRIMARY KEY,
    config_id CHAR(36) NOT NULL,
    contact_id CHAR(36),
    channel VARCHAR(50) NOT NULL, -- 'sms', 'email', 'call', 'ticket', 'chat'
    text TEXT NOT NULL,
    
    -- Prediction results
    label ENUM('positive', 'neutral', 'negative', 'mixed') NOT NULL,
    score DECIMAL(5, 4) NOT NULL, -- -1.0000 to 1.0000
    confidence DECIMAL(5, 4) NOT NULL, -- 0.0000 to 1.0000
    raw_response JSON,
    
    -- Derived metrics
    derived_metrics JSON,
    
    -- Model metadata
    model_provider VARCHAR(50) NOT NULL,
    model_version VARCHAR(100),
    processing_time_ms INT UNSIGNED,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_config_id (config_id),
    INDEX idx_contact_id (contact_id),
    INDEX idx_channel (channel),
    INDEX idx_label (label),
    INDEX idx_created_at (created_at),
    INDEX idx_confidence (confidence),
    FOREIGN KEY (config_id) REFERENCES sentiment_configs(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Sentiment feedback table (for human-in-the-loop corrections)
CREATE TABLE IF NOT EXISTS sentiment_feedback (
    id CHAR(36) PRIMARY KEY,
    prediction_id CHAR(36) NOT NULL,
    config_id CHAR(36) NOT NULL,
    
    -- User correction
    user_label ENUM('positive', 'neutral', 'negative', 'mixed') NOT NULL,
    user_confidence DECIMAL(5, 4),
    user_id CHAR(36) NOT NULL,
    
    -- Review status
    review_status ENUM('pending', 'accepted', 'rejected') NOT NULL DEFAULT 'pending',
    reviewed_by CHAR(36),
    reviewed_at TIMESTAMP NULL,
    
    -- Training inclusion
    included_in_training BOOLEAN DEFAULT FALSE,
    training_batch_id VARCHAR(100),
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_prediction_id (prediction_id),
    INDEX idx_config_id (config_id),
    INDEX idx_review_status (review_status),
    INDEX idx_user_id (user_id),
    INDEX idx_included_in_training (included_in_training),
    FOREIGN KEY (prediction_id) REFERENCES sentiment_predictions(id) ON DELETE CASCADE,
    FOREIGN KEY (config_id) REFERENCES sentiment_configs(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Configuration audit log
CREATE TABLE IF NOT EXISTS sentiment_config_audit (
    id CHAR(36) PRIMARY KEY,
    config_id CHAR(36) NOT NULL,
    user_id CHAR(36) NOT NULL,
    action ENUM('create', 'update', 'delete', 'enable', 'disable', 'rollback') NOT NULL,
    previous_version INT UNSIGNED,
    new_version INT UNSIGNED,
    diff JSON,
    reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_config_id (config_id),
    INDEX idx_user_id (user_id),
    INDEX idx_action (action),
    INDEX idx_created_at (created_at),
    FOREIGN KEY (config_id) REFERENCES sentiment_configs(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Metrics table for monitoring
CREATE TABLE IF NOT EXISTS sentiment_metrics (
    id CHAR(36) PRIMARY KEY,
    config_id CHAR(36) NOT NULL,
    date DATE NOT NULL,
    metric_name VARCHAR(100) NOT NULL,
    metric_value DECIMAL(10, 4) NOT NULL,
    metadata JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_config_date (config_id, date),
    INDEX idx_metric_name (metric_name),
    INDEX idx_date (date),
    FOREIGN KEY (config_id) REFERENCES sentiment_configs(id) ON DELETE CASCADE,
    UNIQUE KEY unique_config_date_metric (config_id, date, metric_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Model training batches
CREATE TABLE IF NOT EXISTS sentiment_training_batches (
    id CHAR(36) PRIMARY KEY,
    config_id CHAR(36) NOT NULL,
    batch_name VARCHAR(255),
    status ENUM('pending', 'training', 'evaluating', 'completed', 'failed', 'cancelled') NOT NULL DEFAULT 'pending',
    
    -- Training data
    sample_count INT UNSIGNED NOT NULL,
    training_start_date DATE,
    training_end_date DATE,
    
    -- Results
    accuracy DECIMAL(5, 4),
    precision_score DECIMAL(5, 4),
    recall_score DECIMAL(5, 4),
    f1_score DECIMAL(5, 4),
    
    -- Model info
    model_version VARCHAR(100),
    model_artifact_url TEXT,
    
    -- Deployment
    deployed BOOLEAN DEFAULT FALSE,
    deployed_at TIMESTAMP NULL,
    
    -- Metadata
    created_by CHAR(36) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_config_id (config_id),
    INDEX idx_status (status),
    INDEX idx_deployed (deployed),
    FOREIGN KEY (config_id) REFERENCES sentiment_configs(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Migrate existing sentiment_config data to new structure
INSERT INTO sentiment_configs (
    id,
    name,
    description,
    scope,
    scope_id,
    mode,
    version,
    enabled,
    model_config,
    threshold_config,
    label_mapping,
    created_by,
    created_at
)
SELECT 
    UUID() as id,
    CONCAT('User Config - ', u.email) as name,
    'Migrated from legacy sentiment_config' as description,
    'user' as scope,
    sc.user_id as scope_id,
    'keyword' as mode,
    1 as version,
    TRUE as enabled,
    JSON_OBJECT(
        'provider', 'keyword',
        'modelId', 'keyword-v1'
    ) as model_config,
    JSON_OBJECT(
        'negative', 0.35,
        'neutral', 0.50,
        'positive', 0.65,
        'minConfidence', COALESCE(sc.confidence_threshold / 100.0, 0.70)
    ) as threshold_config,
    JSON_OBJECT(
        'positive', 'positive',
        'neutral', 'neutral',
        'negative', 'negative'
    ) as label_mapping,
    sc.user_id as created_by,
    COALESCE(sc.created_at, NOW()) as created_at
FROM sentiment_config sc
LEFT JOIN users u ON sc.user_id = u.id
WHERE sc.user_id IS NOT NULL
ON DUPLICATE KEY UPDATE id=id;

-- Create a global default config if none exists
INSERT INTO sentiment_configs (
    id,
    name,
    description,
    scope,
    mode,
    version,
    enabled,
    model_config,
    threshold_config,
    label_mapping,
    created_by
)
SELECT 
    UUID() as id,
    'Global Default Sentiment Config' as name,
    'Default sentiment configuration for all workspaces' as description,
    'global' as scope,
    'keyword' as mode,
    1 as version,
    TRUE as enabled,
    JSON_OBJECT(
        'provider', 'keyword',
        'modelId', 'keyword-v1',
        'params', JSON_OBJECT()
    ) as model_config,
    JSON_OBJECT(
        'negative', 0.35,
        'neutral', 0.50,
        'positive', 0.65,
        'minConfidence', 0.70
    ) as threshold_config,
    JSON_OBJECT(
        'positive', 'positive',
        'neutral', 'neutral',
        'negative', 'negative'
    ) as label_mapping,
    (SELECT id FROM users WHERE role = 'admin' LIMIT 1) as created_by
WHERE NOT EXISTS (
    SELECT 1 FROM sentiment_configs WHERE scope = 'global' LIMIT 1
);
