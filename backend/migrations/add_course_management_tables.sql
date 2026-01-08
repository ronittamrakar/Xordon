-- Course Management System Database Tables (Without Foreign Keys)
-- This migration adds tables for creating and selling courses

-- Courses
CREATE TABLE IF NOT EXISTS `courses` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `workspace_id` INT UNSIGNED NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `slug` VARCHAR(255) NOT NULL,
  `description` TEXT NULL,
  `short_description` VARCHAR(500) NULL,
  `thumbnail_url` VARCHAR(500) NULL,
  `category` VARCHAR(100) NULL,
  `level` ENUM('beginner', 'intermediate', 'advanced', 'all_levels') DEFAULT 'all_levels',
  `language` VARCHAR(10) DEFAULT 'en',
  `status` ENUM('draft', 'published', 'archived') DEFAULT 'draft',
  `price` DECIMAL(10,2) DEFAULT 0.00,
  `currency` VARCHAR(3) DEFAULT 'USD',
  `is_free` BOOLEAN DEFAULT FALSE,
  `duration_hours` DECIMAL(5,2) NULL,
  `total_lessons` INT DEFAULT 0,
  `total_students` INT DEFAULT 0,
  `rating_average` DECIMAL(3,2) DEFAULT 0.00,
  `rating_count` INT DEFAULT 0,
  `certificate_enabled` BOOLEAN DEFAULT FALSE,
  `drip_enabled` BOOLEAN DEFAULT FALSE,
  `drip_days` INT NULL,
  `prerequisites` TEXT NULL,
  `learning_outcomes` JSON NULL,
  `instructor_id` INT UNSIGNED NULL,
  `published_at` TIMESTAMP NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_workspace` (`workspace_id`),
  INDEX `idx_slug` (`slug`),
  INDEX `idx_status` (`status`),
  INDEX `idx_category` (`category`),
  INDEX `idx_instructor` (`instructor_id`),
  UNIQUE KEY `unique_slug` (`workspace_id`, `slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Course Modules/Sections
CREATE TABLE IF NOT EXISTS `course_modules` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `course_id` INT UNSIGNED NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT NULL,
  `order_index` INT DEFAULT 0,
  `is_published` BOOLEAN DEFAULT TRUE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_course` (`course_id`),
  INDEX `idx_order` (`order_index`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Course Lessons
CREATE TABLE IF NOT EXISTS `course_lessons` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `module_id` INT UNSIGNED NOT NULL,
  `course_id` INT UNSIGNED NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `slug` VARCHAR(255) NOT NULL,
  `content_type` ENUM('video', 'text', 'quiz', 'assignment', 'download', 'live_session') NOT NULL,
  `content` LONGTEXT NULL,
  `video_url` VARCHAR(500) NULL,
  `video_duration` INT NULL,
  `video_provider` ENUM('youtube', 'vimeo', 'wistia', 'self_hosted') NULL,
  `attachments` JSON NULL,
  `is_preview` BOOLEAN DEFAULT FALSE,
  `is_published` BOOLEAN DEFAULT TRUE,
  `order_index` INT DEFAULT 0,
  `estimated_duration` INT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_module` (`module_id`),
  INDEX `idx_course` (`course_id`),
  INDEX `idx_order` (`order_index`),
  INDEX `idx_type` (`content_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Course Enrollments
CREATE TABLE IF NOT EXISTS `course_enrollments` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `course_id` INT UNSIGNED NOT NULL,
  `user_id` INT UNSIGNED NOT NULL,
  `contact_id` INT UNSIGNED NULL,
  `workspace_id` INT UNSIGNED NOT NULL,
  `status` ENUM('active', 'completed', 'cancelled', 'expired') DEFAULT 'active',
  `progress_percentage` DECIMAL(5,2) DEFAULT 0.00,
  `completed_lessons` INT DEFAULT 0,
  `total_lessons` INT DEFAULT 0,
  `last_accessed_at` TIMESTAMP NULL,
  `started_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `completed_at` TIMESTAMP NULL,
  `expires_at` TIMESTAMP NULL,
  `payment_id` INT UNSIGNED NULL,
  `amount_paid` DECIMAL(10,2) DEFAULT 0.00,
  `certificate_issued` BOOLEAN DEFAULT FALSE,
  `certificate_issued_at` TIMESTAMP NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_course` (`course_id`),
  INDEX `idx_user` (`user_id`),
  INDEX `idx_contact` (`contact_id`),
  INDEX `idx_workspace` (`workspace_id`),
  INDEX `idx_status` (`status`),
  UNIQUE KEY `unique_enrollment` (`course_id`, `user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Lesson Progress
CREATE TABLE IF NOT EXISTS `lesson_progress` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `enrollment_id` INT UNSIGNED NOT NULL,
  `lesson_id` INT UNSIGNED NOT NULL,
  `user_id` INT UNSIGNED NOT NULL,
  `status` ENUM('not_started', 'in_progress', 'completed') DEFAULT 'not_started',
  `progress_percentage` DECIMAL(5,2) DEFAULT 0.00,
  `time_spent` INT DEFAULT 0,
  `last_position` INT NULL,
  `completed_at` TIMESTAMP NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_enrollment` (`enrollment_id`),
  INDEX `idx_lesson` (`lesson_id`),
  INDEX `idx_user` (`user_id`),
  INDEX `idx_status` (`status`),
  UNIQUE KEY `unique_progress` (`enrollment_id`, `lesson_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Course Quizzes
CREATE TABLE IF NOT EXISTS `course_quizzes` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `lesson_id` INT UNSIGNED NOT NULL,
  `course_id` INT UNSIGNED NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT NULL,
  `passing_score` INT DEFAULT 70,
  `time_limit` INT NULL,
  `attempts_allowed` INT DEFAULT 0,
  `randomize_questions` BOOLEAN DEFAULT FALSE,
  `show_correct_answers` BOOLEAN DEFAULT TRUE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_lesson` (`lesson_id`),
  INDEX `idx_course` (`course_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Quiz Questions
CREATE TABLE IF NOT EXISTS `quiz_questions` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `quiz_id` INT UNSIGNED NOT NULL,
  `question_type` ENUM('multiple_choice', 'true_false', 'short_answer', 'essay') NOT NULL,
  `question_text` TEXT NOT NULL,
  `options` JSON NULL,
  `correct_answer` TEXT NULL,
  `points` INT DEFAULT 1,
  `order_index` INT DEFAULT 0,
  `explanation` TEXT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_quiz` (`quiz_id`),
  INDEX `idx_order` (`order_index`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Quiz Attempts
CREATE TABLE IF NOT EXISTS `quiz_attempts` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `quiz_id` INT UNSIGNED NOT NULL,
  `enrollment_id` INT UNSIGNED NOT NULL,
  `user_id` INT UNSIGNED NOT NULL,
  `score` DECIMAL(5,2) NULL,
  `total_points` INT NULL,
  `earned_points` INT NULL,
  `passed` BOOLEAN DEFAULT FALSE,
  `answers` JSON NULL,
  `started_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `submitted_at` TIMESTAMP NULL,
  `time_taken` INT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_quiz` (`quiz_id`),
  INDEX `idx_enrollment` (`enrollment_id`),
  INDEX `idx_user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Course Reviews
CREATE TABLE IF NOT EXISTS `course_reviews` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `course_id` INT UNSIGNED NOT NULL,
  `user_id` INT UNSIGNED NOT NULL,
  `enrollment_id` INT UNSIGNED NOT NULL,
  `rating` INT NOT NULL,
  `review_text` TEXT NULL,
  `is_published` BOOLEAN DEFAULT TRUE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_course` (`course_id`),
  INDEX `idx_user` (`user_id`),
  INDEX `idx_rating` (`rating`),
  UNIQUE KEY `unique_review` (`course_id`, `user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Course Certificates
CREATE TABLE IF NOT EXISTS `course_certificates` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `course_id` INT UNSIGNED NOT NULL,
  `enrollment_id` INT UNSIGNED NOT NULL,
  `user_id` INT UNSIGNED NOT NULL,
  `certificate_number` VARCHAR(100) NOT NULL,
  `issued_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `pdf_url` VARCHAR(500) NULL,
  `verification_code` VARCHAR(50) NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_course` (`course_id`),
  INDEX `idx_enrollment` (`enrollment_id`),
  INDEX `idx_user` (`user_id`),
  INDEX `idx_verification` (`verification_code`),
  UNIQUE KEY `unique_certificate` (`enrollment_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Video Hosting
CREATE TABLE IF NOT EXISTS `hosted_videos` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `workspace_id` INT UNSIGNED NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT NULL,
  `file_name` VARCHAR(255) NOT NULL,
  `file_size` BIGINT UNSIGNED NOT NULL,
  `duration` INT NULL,
  `thumbnail_url` VARCHAR(500) NULL,
  `video_url` VARCHAR(500) NOT NULL,
  `streaming_url` VARCHAR(500) NULL,
  `status` ENUM('uploading', 'processing', 'ready', 'failed') DEFAULT 'uploading',
  `views` INT DEFAULT 0,
  `used_in_courses` INT DEFAULT 0,
  `tags` JSON NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_workspace` (`workspace_id`),
  INDEX `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Membership Areas
CREATE TABLE IF NOT EXISTS `membership_areas` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `workspace_id` INT UNSIGNED NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `slug` VARCHAR(255) NOT NULL,
  `description` TEXT NULL,
  `access_type` ENUM('free', 'paid', 'course_based', 'subscription') DEFAULT 'free',
  `price` DECIMAL(10,2) DEFAULT 0.00,
  `billing_period` ENUM('monthly', 'yearly', 'lifetime', 'one_time') NULL,
  `status` ENUM('active', 'inactive') DEFAULT 'active',
  `total_members` INT DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_workspace` (`workspace_id`),
  INDEX `idx_slug` (`slug`),
  INDEX `idx_status` (`status`),
  UNIQUE KEY `unique_slug` (`workspace_id`, `slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Membership Access
CREATE TABLE IF NOT EXISTS `membership_access` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `membership_id` INT UNSIGNED NOT NULL,
  `user_id` INT UNSIGNED NOT NULL,
  `contact_id` INT UNSIGNED NULL,
  `status` ENUM('active', 'cancelled', 'expired', 'suspended') DEFAULT 'active',
  `started_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `expires_at` TIMESTAMP NULL,
  `cancelled_at` TIMESTAMP NULL,
  `payment_id` INT UNSIGNED NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_membership` (`membership_id`),
  INDEX `idx_user` (`user_id`),
  INDEX `idx_contact` (`contact_id`),
  INDEX `idx_status` (`status`),
  UNIQUE KEY `unique_access` (`membership_id`, `user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
