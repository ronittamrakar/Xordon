-- Phase 3: Social Media Scheduler
-- Social media management, scheduling, and analytics

-- Social media accounts
CREATE TABLE IF NOT EXISTS social_accounts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    
    -- Platform
    platform ENUM('facebook', 'instagram', 'twitter', 'linkedin', 'tiktok', 'youtube', 'pinterest') NOT NULL,
    account_type ENUM('page', 'profile', 'business', 'creator') DEFAULT 'page',
    
    -- Account info
    platform_account_id VARCHAR(255) NOT NULL,
    account_name VARCHAR(255) NULL,
    account_username VARCHAR(255) NULL,
    account_url VARCHAR(500) NULL,
    avatar_url VARCHAR(500) NULL,
    
    -- OAuth tokens (encrypted)
    access_token_encrypted TEXT NULL,
    refresh_token_encrypted TEXT NULL,
    token_expires_at TIMESTAMP NULL,
    
    -- Status
    status ENUM('connected', 'expired', 'error', 'disconnected') DEFAULT 'connected',
    error_message TEXT NULL,
    
    -- Permissions
    can_post TINYINT(1) DEFAULT 1,
    can_read_insights TINYINT(1) DEFAULT 0,
    can_read_messages TINYINT(1) DEFAULT 0,
    
    -- Stats
    followers_count INT NULL,
    following_count INT NULL,
    posts_count INT NULL,
    
    last_sync_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE KEY uk_workspace_platform_account (workspace_id, platform, platform_account_id),
    INDEX idx_social_accounts_workspace (workspace_id, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Social media posts
CREATE TABLE IF NOT EXISTS social_posts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    
    -- Content
    content TEXT NOT NULL,
    media_urls JSON NULL COMMENT 'Array of media URLs',
    media_type ENUM('none', 'image', 'video', 'carousel', 'link') DEFAULT 'none',
    
    -- Link preview
    link_url VARCHAR(500) NULL,
    link_title VARCHAR(255) NULL,
    link_description TEXT NULL,
    link_image VARCHAR(500) NULL,
    
    -- Scheduling
    status ENUM('draft', 'scheduled', 'publishing', 'published', 'failed', 'cancelled') DEFAULT 'draft',
    scheduled_at TIMESTAMP NULL,
    published_at TIMESTAMP NULL,
    
    -- Target accounts (JSON array of social_account_ids)
    target_accounts JSON NOT NULL,
    
    -- Platform-specific settings
    platform_settings JSON NULL COMMENT 'Platform-specific options like first_comment, etc.',
    
    -- Publishing results
    publish_results JSON NULL COMMENT 'Results per account with platform_post_id',
    error_message TEXT NULL,
    
    -- Campaign/category
    campaign_id INT NULL,
    category VARCHAR(100) NULL,
    
    -- Approval workflow
    requires_approval TINYINT(1) DEFAULT 0,
    approved_by INT NULL,
    approved_at TIMESTAMP NULL,
    
    created_by INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_social_posts_workspace (workspace_id, status, scheduled_at),
    INDEX idx_social_posts_scheduled (status, scheduled_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Social post analytics
CREATE TABLE IF NOT EXISTS social_post_analytics (
    id INT AUTO_INCREMENT PRIMARY KEY,
    post_id INT NOT NULL,
    social_account_id INT NOT NULL,
    
    -- Platform post reference
    platform_post_id VARCHAR(255) NULL,
    platform_post_url VARCHAR(500) NULL,
    
    -- Engagement metrics
    impressions INT DEFAULT 0,
    reach INT DEFAULT 0,
    likes INT DEFAULT 0,
    comments INT DEFAULT 0,
    shares INT DEFAULT 0,
    saves INT DEFAULT 0,
    clicks INT DEFAULT 0,
    video_views INT DEFAULT 0,
    
    -- Engagement rate
    engagement_rate DECIMAL(5,2) NULL,
    
    last_updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE KEY uk_post_account (post_id, social_account_id),
    INDEX idx_analytics_post (post_id),
    
    FOREIGN KEY (post_id) REFERENCES social_posts(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Content calendar categories
CREATE TABLE IF NOT EXISTS social_categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    
    name VARCHAR(100) NOT NULL,
    color VARCHAR(7) DEFAULT '#6366f1',
    description TEXT NULL,
    
    -- Default posting times for this category
    default_times JSON NULL COMMENT 'Array of {day_of_week, time}',
    
    is_active TINYINT(1) DEFAULT 1,
    sort_order INT DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE KEY uk_workspace_name (workspace_id, name),
    INDEX idx_categories_workspace (workspace_id, is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Social media templates
CREATE TABLE IF NOT EXISTS social_templates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    
    name VARCHAR(100) NOT NULL,
    content TEXT NOT NULL,
    media_urls JSON NULL,
    
    -- Targeting
    platforms JSON NULL COMMENT 'Array of platforms this template is for',
    category_id INT NULL,
    
    -- Usage
    use_count INT DEFAULT 0,
    
    created_by INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_templates_workspace (workspace_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Hashtag groups
CREATE TABLE IF NOT EXISTS hashtag_groups (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    
    name VARCHAR(100) NOT NULL,
    hashtags JSON NOT NULL COMMENT 'Array of hashtags',
    
    -- Platform targeting
    platforms JSON NULL,
    
    use_count INT DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE KEY uk_workspace_name (workspace_id, name),
    INDEX idx_hashtags_workspace (workspace_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Best posting times (AI-analyzed)
CREATE TABLE IF NOT EXISTS social_best_times (
    id INT AUTO_INCREMENT PRIMARY KEY,
    social_account_id INT NOT NULL,
    
    day_of_week TINYINT NOT NULL COMMENT '0=Sunday, 6=Saturday',
    hour TINYINT NOT NULL COMMENT '0-23',
    
    engagement_score DECIMAL(5,2) NULL,
    sample_size INT DEFAULT 0,
    
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE KEY uk_account_day_hour (social_account_id, day_of_week, hour),
    
    FOREIGN KEY (social_account_id) REFERENCES social_accounts(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
