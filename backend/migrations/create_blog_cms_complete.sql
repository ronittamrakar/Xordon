-- =====================================================
-- BLOG & CONTENT MANAGEMENT SYSTEM - COMPLETE SCHEMA
-- =====================================================
-- This migration creates all necessary tables for the Blog/CMS feature

-- Blog Posts Table
CREATE TABLE IF NOT EXISTS `blog_posts` (
    `id` INT PRIMARY KEY AUTO_INCREMENT,
    `workspace_id` INT NOT NULL,
    `website_id` INT,
    `title` VARCHAR(255) NOT NULL,
    `slug` VARCHAR(255) NOT NULL,
    `content` LONGTEXT,
    `excerpt` TEXT,
    `featured_image` VARCHAR(500),
    `author_id` INT,
    `status` ENUM('draft', 'published', 'scheduled', 'archived') DEFAULT 'draft',
    `visibility` ENUM('public', 'private', 'password_protected') DEFAULT 'public',
    `password` VARCHAR(255),
    `published_at` TIMESTAMP NULL,
    `scheduled_at` TIMESTAMP NULL,
    `seo_title` VARCHAR(255),
    `seo_description` TEXT,
    `seo_keywords` TEXT,
    `canonical_url` VARCHAR(500),
    `view_count` INT DEFAULT 0,
    `unique_views` INT DEFAULT 0,
    `avg_read_time_seconds` INT,
    `allow_comments` BOOLEAN DEFAULT TRUE,
    `is_featured` BOOLEAN DEFAULT FALSE,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`website_id`) REFERENCES `websites`(`id`) ON DELETE SET NULL,
    UNIQUE KEY `unique_workspace_slug` (`workspace_id`, `slug`),
    INDEX `idx_status_published` (`status`, `published_at`),
    INDEX `idx_author` (`author_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Blog Categories Table
CREATE TABLE IF NOT EXISTS `blog_categories` (
    `id` INT PRIMARY KEY AUTO_INCREMENT,
    `workspace_id` INT NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `slug` VARCHAR(100) NOT NULL,
    `description` TEXT,
    `parent_id` INT,
    `order_index` INT DEFAULT 0,
    `post_count` INT DEFAULT 0,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`parent_id`) REFERENCES `blog_categories`(`id`) ON DELETE SET NULL,
    UNIQUE KEY `unique_workspace_slug` (`workspace_id`, `slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Blog Post Categories (Many-to-Many)
CREATE TABLE IF NOT EXISTS `blog_post_categories` (
    `post_id` INT NOT NULL,
    `category_id` INT NOT NULL,
    PRIMARY KEY (`post_id`, `category_id`),
    FOREIGN KEY (`post_id`) REFERENCES `blog_posts`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`category_id`) REFERENCES `blog_categories`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Blog Tags Table
CREATE TABLE IF NOT EXISTS `blog_tags` (
    `id` INT PRIMARY KEY AUTO_INCREMENT,
    `workspace_id` INT NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `slug` VARCHAR(100) NOT NULL,
    `post_count` INT DEFAULT 0,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON DELETE CASCADE,
    UNIQUE KEY `unique_workspace_slug` (`workspace_id`, `slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Blog Post Tags (Many-to-Many)
CREATE TABLE IF NOT EXISTS `blog_post_tags` (
    `post_id` INT NOT NULL,
    `tag_id` INT NOT NULL,
    PRIMARY KEY (`post_id`, `tag_id`),
    FOREIGN KEY (`post_id`) REFERENCES `blog_posts`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`tag_id`) REFERENCES `blog_tags`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Blog Comments Table
CREATE TABLE IF NOT EXISTS `blog_comments` (
    `id` INT PRIMARY KEY AUTO_INCREMENT,
    `post_id` INT NOT NULL,
    `parent_id` INT COMMENT 'For threaded comments',
    `author_name` VARCHAR(255) NOT NULL,
    `author_email` VARCHAR(255) NOT NULL,
    `author_website` VARCHAR(500),
    `author_ip` VARCHAR(45),
    `author_user_agent` TEXT,
    `content` TEXT NOT NULL,
    `status` ENUM('pending', 'approved', 'spam', 'trash') DEFAULT 'pending',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`post_id`) REFERENCES `blog_posts`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`parent_id`) REFERENCES `blog_comments`(`id`) ON DELETE CASCADE,
    INDEX `idx_post_status` (`post_id`, `status`),
    INDEX `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Blog Post Views (Analytics)
CREATE TABLE IF NOT EXISTS `blog_post_views` (
    `id` BIGINT PRIMARY KEY AUTO_INCREMENT,
    `post_id` INT NOT NULL,
    `visitor_ip` VARCHAR(45),
    `visitor_id` VARCHAR(255) COMMENT 'Cookie or session ID',
    `referrer` VARCHAR(500),
    `user_agent` TEXT,
    `read_time_seconds` INT,
    `viewed_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`post_id`) REFERENCES `blog_posts`(`id`) ON DELETE CASCADE,
    INDEX `idx_post_viewed` (`post_id`, `viewed_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Blog Series Table
CREATE TABLE IF NOT EXISTS `blog_series` (
    `id` INT PRIMARY KEY AUTO_INCREMENT,
    `workspace_id` INT NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `slug` VARCHAR(255) NOT NULL,
    `description` TEXT,
    `post_count` INT DEFAULT 0,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON DELETE CASCADE,
    UNIQUE KEY `unique_workspace_slug` (`workspace_id`, `slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Blog Post Series (Many-to-Many)
CREATE TABLE IF NOT EXISTS `blog_post_series` (
    `post_id` INT NOT NULL,
    `series_id` INT NOT NULL,
    `order_index` INT DEFAULT 0,
    PRIMARY KEY (`post_id`, `series_id`),
    FOREIGN KEY (`post_id`) REFERENCES `blog_posts`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`series_id`) REFERENCES `blog_series`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Content Revisions Table
CREATE TABLE IF NOT EXISTS `blog_post_revisions` (
    `id` INT PRIMARY KEY AUTO_INCREMENT,
    `post_id` INT NOT NULL,
    `title` VARCHAR(255),
    `content` LONGTEXT,
    `excerpt` TEXT,
    `revision_note` VARCHAR(255),
    `created_by` INT,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`post_id`) REFERENCES `blog_posts`(`id`) ON DELETE CASCADE,
    INDEX `idx_post_created` (`post_id`, `created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Blog Analytics Summary Table
CREATE TABLE IF NOT EXISTS `blog_analytics` (
    `id` INT PRIMARY KEY AUTO_INCREMENT,
    `workspace_id` INT NOT NULL,
    `post_id` INT,
    `date` DATE NOT NULL,
    `views` INT DEFAULT 0,
    `unique_views` INT DEFAULT 0,
    `avg_read_time_seconds` INT,
    `comments_count` INT DEFAULT 0,
    `shares_count` INT DEFAULT 0,
    `bounce_rate` DECIMAL(5,2),
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`post_id`) REFERENCES `blog_posts`(`id`) ON DELETE CASCADE,
    UNIQUE KEY `unique_post_date` (`post_id`, `date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
