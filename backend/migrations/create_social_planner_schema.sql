CREATE TABLE IF NOT EXISTS `social_accounts` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `workspace_id` INT NOT NULL,
  `company_id` INT NULL,
  `platform` VARCHAR(50) NOT NULL COMMENT 'facebook, instagram, linkedin, twitter, tiktok, gmb',
  `account_internal_id` VARCHAR(255) NOT NULL,
  `account_name` VARCHAR(255) NOT NULL,
  `profile_picture_url` TEXT,
  `access_token` TEXT,
  `refresh_token` TEXT,
  `token_expires_at` DATETIME,
  `scopes` TEXT,
  `metadata` TEXT,
  `status` ENUM('active', 'expired', 'disconnected') DEFAULT 'active',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_workspace` (`workspace_id`),
  INDEX `idx_company` (`company_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `social_posts` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `workspace_id` INT NOT NULL,
  `company_id` INT NULL,
  `content` TEXT,
  `media_urls` TEXT COMMENT 'JSON array',
  `status` ENUM('draft', 'scheduled', 'published', 'failed', 'archived') DEFAULT 'draft',
  `scheduled_at` DATETIME,
  `published_at` DATETIME,
  `created_by` INT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_workspace_status` (`workspace_id`, `status`),
  INDEX `idx_scheduled` (`scheduled_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `social_post_targets` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `post_id` INT NOT NULL,
  `account_id` INT NOT NULL,
  `platform_post_id` VARCHAR(255),
  `status` ENUM('pending', 'published', 'failed') DEFAULT 'pending',
  `error_message` TEXT,
  `published_at` DATETIME,
  `analytics_data` TEXT COMMENT 'JSON snapshot of likes, shares, etc.',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`post_id`) REFERENCES `social_posts`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`account_id`) REFERENCES `social_accounts`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `social_analytics` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `account_id` INT NOT NULL,
  `date` DATE NOT NULL,
  `impressions` INT DEFAULT 0,
  `reach` INT DEFAULT 0,
  `engagement` INT DEFAULT 0,
  `likes` INT DEFAULT 0,
  `comments` INT DEFAULT 0,
  `shares` INT DEFAULT 0,
  `clicks` INT DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `uniq_account_date` (`account_id`, `date`),
  FOREIGN KEY (`account_id`) REFERENCES `social_accounts`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
