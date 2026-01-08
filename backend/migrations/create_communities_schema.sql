-- Communities Module Schema

-- Communities Table (Main container for a community)
CREATE TABLE IF NOT EXISTS communities (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    company_id INT DEFAULT NULL, -- Optional if linked to a specific company entity
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) NOT NULL,
    description TEXT DEFAULT NULL,
    logo_url VARCHAR(512) DEFAULT NULL,
    banner_url VARCHAR(512) DEFAULT NULL,
    privacy ENUM('public', 'private', 'hidden') DEFAULT 'private',
    
    -- Settings
    allow_member_posts BOOLEAN DEFAULT TRUE,
    require_post_approval BOOLEAN DEFAULT FALSE,
    allow_member_invites BOOLEAN DEFAULT FALSE,
    
    created_by INT DEFAULT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE KEY uniq_community_slug (workspace_id, slug),
    INDEX idx_communities_workspace (workspace_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Community Groups (Sub-channels/topics within a community)
CREATE TABLE IF NOT EXISTS community_groups (
    id INT AUTO_INCREMENT PRIMARY KEY,
    community_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) NOT NULL,
    description TEXT DEFAULT NULL,
    icon VARCHAR(100) DEFAULT NULL, -- stored as string identifier for frontend icons
    color VARCHAR(20) DEFAULT NULL,
    
    access_level ENUM('public', 'members_only', 'paid', 'private') DEFAULT 'members_only',
    required_plan_id INT DEFAULT NULL, -- For paid access groups
    
    sort_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE KEY uniq_group_slug (community_id, slug),
    FOREIGN KEY (community_id) REFERENCES communities(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Community Members
CREATE TABLE IF NOT EXISTS community_members (
    id INT AUTO_INCREMENT PRIMARY KEY,
    community_id INT NOT NULL,
    user_id INT NOT NULL, -- Links to main users table
    role ENUM('owner', 'admin', 'moderator', 'member') DEFAULT 'member',
    status ENUM('active', 'banned', 'pending') DEFAULT 'active',
    
    joined_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_active_at DATETIME DEFAULT NULL,
    
    UNIQUE KEY uniq_community_member (community_id, user_id),
    FOREIGN KEY (community_id) REFERENCES communities(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Community Posts
CREATE TABLE IF NOT EXISTS community_posts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    community_id INT NOT NULL,
    group_id INT NOT NULL,
    author_id INT NOT NULL,
    
    title VARCHAR(255) DEFAULT NULL,
    content MEDIUMTEXT NOT NULL,
    
    -- Media (JSON array of URLs)
    attachments JSON DEFAULT NULL,
    
    is_pinned BOOLEAN DEFAULT FALSE,
    is_locked BOOLEAN DEFAULT FALSE,
    
    status ENUM('published', 'draft', 'archived') DEFAULT 'published',
    
    like_count INT DEFAULT 0,
    comment_count INT DEFAULT 0,
    view_count INT DEFAULT 0,
    
    published_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_posts_group (group_id),
    INDEX idx_posts_author (author_id),
    FOREIGN KEY (community_id) REFERENCES communities(id) ON DELETE CASCADE,
    FOREIGN KEY (group_id) REFERENCES community_groups(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Community Comments
CREATE TABLE IF NOT EXISTS community_comments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    post_id INT NOT NULL,
    author_id INT NOT NULL,
    parent_id INT DEFAULT NULL, -- For nested replies
    
    content TEXT NOT NULL,
    attachments JSON DEFAULT NULL,
    
    like_count INT DEFAULT 0,
    
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_comments_post (post_id),
    FOREIGN KEY (post_id) REFERENCES community_posts(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
