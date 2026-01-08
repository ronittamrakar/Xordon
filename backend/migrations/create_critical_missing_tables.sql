-- =====================================================
-- CRITICAL MISSING TABLES - CONSOLIDATED MIGRATION
-- =====================================================
-- This migration creates all other critical missing tables for:
-- - Webinars
-- - Loyalty Program
-- - Social Media
-- - Consumer Financing
-- - E-Signatures
-- - LMS/Courses Completion

-- =====================================================
-- WEBINARS MODULE
-- =====================================================

CREATE TABLE IF NOT EXISTS `webinar_registrations` (
    `id` INT PRIMARY KEY AUTO_INCREMENT,
    `webinar_id` INT NOT NULL,
    `contact_id` INT,
    `email` VARCHAR(255) NOT NULL,
    `first_name` VARCHAR(100),
    `last_name` VARCHAR(100),
    `phone` VARCHAR(50),
    `company` VARCHAR(255),
    `custom_fields` JSON,
    `registered_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `attended` BOOLEAN DEFAULT FALSE,
    `attended_at` TIMESTAMP NULL,
    `watch_duration_seconds` INT DEFAULT 0,
    `engagement_score` INT DEFAULT 0,
    FOREIGN KEY (`webinar_id`) REFERENCES `webinars`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`contact_id`) REFERENCES `contacts`(`id`) ON DELETE SET NULL,
    INDEX `idx_webinar_email` (`webinar_id`, `email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `webinar_sessions` (
    `id` INT PRIMARY KEY AUTO_INCREMENT,
    `webinar_id` INT NOT NULL,
    `session_date` DATETIME NOT NULL,
    `duration_minutes` INT,
    `max_attendees` INT,
    `room_url` VARCHAR(500),
    `recording_url` VARCHAR(500),
    `status` ENUM('scheduled', 'live', 'ended', 'cancelled') DEFAULT 'scheduled',
    `actual_attendees` INT DEFAULT 0,
    `peak_attendees` INT DEFAULT 0,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`webinar_id`) REFERENCES `webinars`(`id`) ON DELETE CASCADE,
    INDEX `idx_session_date` (`session_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `webinar_polls` (
    `id` INT PRIMARY KEY AUTO_INCREMENT,
    `webinar_id` INT NOT NULL,
    `question` TEXT NOT NULL,
    `options` JSON,
    `poll_type` ENUM('multiple_choice', 'open_ended', 'rating') DEFAULT 'multiple_choice',
    `is_active` BOOLEAN DEFAULT FALSE,
    `total_responses` INT DEFAULT 0,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`webinar_id`) REFERENCES `webinars`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `webinar_poll_responses` (
    `id` INT PRIMARY KEY AUTO_INCREMENT,
    `poll_id` INT NOT NULL,
    `registration_id` INT NOT NULL,
    `selected_option` INT,
    `response_text` TEXT,
    `submitted_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`poll_id`) REFERENCES `webinar_polls`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`registration_id`) REFERENCES `webinar_registrations`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `webinar_chat_messages` (
    `id` INT PRIMARY KEY AUTO_INCREMENT,
    `webinar_id` INT NOT NULL,
    `session_id` INT,
    `registration_id` INT,
    `sender_name` VARCHAR(255),
    `message` TEXT,
    `is_question` BOOLEAN DEFAULT FALSE,
    `is_answered` BOOLEAN DEFAULT FALSE,
    `sent_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`webinar_id`) REFERENCES `webinars`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`session_id`) REFERENCES `webinar_sessions`(`id`) ON DELETE CASCADE,
    INDEX `idx_session_sent` (`session_id`, `sent_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- LOYALTY PROGRAM MODULE
-- =====================================================

CREATE TABLE IF NOT EXISTS `loyalty_members` (
    `id` INT PRIMARY KEY AUTO_INCREMENT,
    `program_id` INT NOT NULL,
    `contact_id` INT NOT NULL,
    `member_number` VARCHAR(50) UNIQUE,
    `points_balance` INT DEFAULT 0,
    `lifetime_points_earned` INT DEFAULT 0,
    `lifetime_points_redeemed` INT DEFAULT 0,
    `tier` VARCHAR(50),
    `tier_expires_at` DATE,
    `joined_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `last_activity_at` TIMESTAMP,
    FOREIGN KEY (`program_id`) REFERENCES `loyalty_programs`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`contact_id`) REFERENCES `contacts`(`id`) ON DELETE CASCADE,
    UNIQUE KEY `unique_program_contact` (`program_id`, `contact_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `loyalty_transactions` (
    `id` INT PRIMARY KEY AUTO_INCREMENT,
    `member_id` INT NOT NULL,
    `transaction_type` ENUM('earn', 'redeem', 'expire', 'adjust', 'bonus') DEFAULT 'earn',
    `points` INT NOT NULL,
    `description` VARCHAR(255),
    `reference_type` VARCHAR(50),
    `reference_id` INT,
    `balance_after` INT,
    `expires_at` DATE,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`member_id`) REFERENCES `loyalty_members`(`id`) ON DELETE CASCADE,
    INDEX `idx_member_created` (`member_id`, `created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `loyalty_rewards` (
    `id` INT PRIMARY KEY AUTO_INCREMENT,
    `program_id` INT NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `description` TEXT,
    `points_required` INT NOT NULL,
    `reward_type` ENUM('discount', 'product', 'service', 'voucher', 'cashback'),
    `reward_value` DECIMAL(10,2),
    `stock_quantity` INT,
    `redeemed_count` INT DEFAULT 0,
    `is_active` BOOLEAN DEFAULT TRUE,
    `valid_from` DATE,
    `valid_until` DATE,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`program_id`) REFERENCES `loyalty_programs`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `loyalty_redemptions` (
    `id` INT PRIMARY KEY AUTO_INCREMENT,
    `member_id` INT NOT NULL,
    `reward_id` INT NOT NULL,
    `points_spent` INT NOT NULL,
    `status` ENUM('pending', 'fulfilled', 'cancelled', 'expired') DEFAULT 'pending',
    `redemption_code` VARCHAR(50),
    `redeemed_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `fulfilled_at` TIMESTAMP NULL,
    `expires_at` TIMESTAMP NULL,
    FOREIGN KEY (`member_id`) REFERENCES `loyalty_members`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`reward_id`) REFERENCES `loyalty_rewards`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- SOCIAL MEDIA PLANNER MODULE
-- =====================================================

CREATE TABLE IF NOT EXISTS `social_accounts` (
    `id` INT PRIMARY KEY AUTO_INCREMENT,
    `workspace_id` INT NOT NULL,
    `platform` ENUM('facebook', 'instagram', 'twitter', 'linkedin', 'tiktok', 'youtube'),
    `account_name` VARCHAR(255),
    `account_id` VARCHAR(255),
    `access_token` TEXT,
    `refresh_token` TEXT,
    `token_expires_at` TIMESTAMP,
    `is_active` BOOLEAN DEFAULT TRUE,
    `connected_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `last_synced_at` TIMESTAMP,
    FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON DELETE CASCADE,
    INDEX `idx_workspace_platform` (`workspace_id`, `platform`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `social_posts` (
    `id` INT PRIMARY KEY AUTO_INCREMENT,
    `workspace_id` INT NOT NULL,
    `account_id` INT NOT NULL,
    `content` TEXT NOT NULL,
    `media_urls` JSON,
    `hashtags` JSON,
    `scheduled_at` TIMESTAMP,
    `published_at` TIMESTAMP NULL,
    `status` ENUM('draft', 'scheduled', 'published', 'failed', 'cancelled') DEFAULT 'draft',
    `platform_post_id` VARCHAR(255),
    `error_message` TEXT,
    `created_by` INT,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`account_id`) REFERENCES `social_accounts`(`id`) ON DELETE CASCADE,
    INDEX `idx_status_scheduled` (`status`, `scheduled_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `social_post_analytics` (
    `id` INT PRIMARY KEY AUTO_INCREMENT,
    `post_id` INT NOT NULL,
    `likes` INT DEFAULT 0,
    `comments` INT DEFAULT 0,
    `shares` INT DEFAULT 0,
    `impressions` INT DEFAULT 0,
    `reach` INT DEFAULT 0,
    `clicks` INT DEFAULT 0,
    `engagement_rate` DECIMAL(5,2),
    `last_synced_at` TIMESTAMP,
    FOREIGN KEY (`post_id`) REFERENCES `social_posts`(`id`) ON DELETE CASCADE,
    UNIQUE KEY `unique_post_analytics` (`post_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- CONSUMER FINANCING MODULE
-- =====================================================

CREATE TABLE IF NOT EXISTS `financing_applications` (
    `id` INT PRIMARY KEY AUTO_INCREMENT,
    `workspace_id` INT NOT NULL,
    `contact_id` INT,
    `invoice_id` INT,
    `estimate_id` INT,
    `applicant_name` VARCHAR(255) NOT NULL,
    `applicant_email` VARCHAR(255),
    `applicant_phone` VARCHAR(50),
    `requested_amount` DECIMAL(10,2) NOT NULL,
    `purpose` TEXT,
    `credit_score` INT,
    `employment_status` VARCHAR(100),
    `annual_income` DECIMAL(12,2),
    `status` ENUM('pending', 'approved', 'declined', 'cancelled') DEFAULT 'pending',
    `provider` VARCHAR(100),
    `provider_application_id` VARCHAR(255),
    `approved_amount` DECIMAL(10,2),
    `interest_rate` DECIMAL(5,2),
    `term_months` INT,
    `monthly_payment` DECIMAL(10,2),
    `applied_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `decision_at` TIMESTAMP NULL,
    FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`contact_id`) REFERENCES `contacts`(`id`) ON DELETE SET NULL,
    INDEX `idx_workspace_status` (`workspace_id`, `status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `financing_plans` (
    `id` INT PRIMARY KEY AUTO_INCREMENT,
    `workspace_id` INT NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `provider` VARCHAR(100),
    `min_amount` DECIMAL(10,2),
    `max_amount` DECIMAL(10,2),
    `interest_rate` DECIMAL(5,2),
    `term_months` INT,
    `is_active` BOOLEAN DEFAULT TRUE,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- E-SIGNATURES MODULE
-- =====================================================

CREATE TABLE IF NOT EXISTS `signature_documents` (
    `id` INT PRIMARY KEY AUTO_INCREMENT,
    `workspace_id` INT NOT NULL,
    `document_type` VARCHAR(100),
    `reference_id` INT,
    `title` VARCHAR(255) NOT NULL,
    `document_url` VARCHAR(500),
    `pdf_url` VARCHAR(500),
    `status` ENUM('draft', 'sent', 'viewed', 'signed', 'declined', 'expired', 'voided') DEFAULT 'draft',
    `provider` VARCHAR(50) COMMENT 'docusign, hellosign, internal',
    `provider_envelope_id` VARCHAR(255),
    `created_by` INT,
    `sent_at` TIMESTAMP NULL,
    `completed_at` TIMESTAMP NULL,
    `expires_at` TIMESTAMP NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON DELETE CASCADE,
    INDEX `idx_workspace_status` (`workspace_id`, `status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `signature_recipients` (
    `id` INT PRIMARY KEY AUTO_INCREMENT,
    `document_id` INT NOT NULL,
    `contact_id` INT,
    `email` VARCHAR(255) NOT NULL,
    `name` VARCHAR(255),
    `role` ENUM('signer', 'cc', 'approver', 'witness') DEFAULT 'signer',
    `signing_order` INT DEFAULT 1,
    `status` ENUM('pending', 'sent', 'viewed', 'signed', 'declined') DEFAULT 'pending',
    `signature_data` TEXT,
    `signature_image_url` VARCHAR(500),
    `ip_address` VARCHAR(45),
    `user_agent` TEXT,
    `access_code` VARCHAR(50),
    `sent_at` TIMESTAMP NULL,
    `viewed_at` TIMESTAMP NULL,
    `signed_at` TIMESTAMP NULL,
    FOREIGN KEY (`document_id`) REFERENCES `signature_documents`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`contact_id`) REFERENCES `contacts`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `signature_fields` (
    `id` INT PRIMARY KEY AUTO_INCREMENT,
    `document_id` INT NOT NULL,
    `recipient_id` INT NOT NULL,
    `field_type` ENUM('signature', 'initial', 'date', 'text', 'checkbox', 'dropdown'),
    `field_label` VARCHAR(255),
    `position_x` INT,
    `position_y` INT,
    `width` INT,
    `height` INT,
    `page_number` INT,
    `is_required` BOOLEAN DEFAULT TRUE,
    `value` TEXT,
    `options` JSON COMMENT 'For dropdown fields',
    FOREIGN KEY (`document_id`) REFERENCES `signature_documents`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`recipient_id`) REFERENCES `signature_recipients`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- LMS/COURSES COMPLETION TRACKING
-- =====================================================

CREATE TABLE IF NOT EXISTS `course_enrollments` (
    `id` INT PRIMARY KEY AUTO_INCREMENT,
    `course_id` INT NOT NULL,
    `student_id` INT NOT NULL,
    `enrolled_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `progress_percentage` DECIMAL(5,2) DEFAULT 0.00,
    `status` ENUM('enrolled', 'in_progress', 'completed', 'dropped', 'expired') DEFAULT 'enrolled',
    `completed_at` TIMESTAMP NULL,
    `certificate_issued_at` TIMESTAMP NULL,
    `certificate_id` INT,
    `last_accessed_at` TIMESTAMP,
    FOREIGN KEY (`course_id`) REFERENCES `courses`(`id`) ON DELETE CASCADE,
    UNIQUE KEY `unique_enrollment` (`course_id`, `student_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `course_progress` (
    `id` INT PRIMARY KEY AUTO_INCREMENT,
    `enrollment_id` INT NOT NULL,
    `lesson_id` INT NOT NULL,
    `status` ENUM('not_started', 'in_progress', 'completed') DEFAULT 'not_started',
    `time_spent_seconds` INT DEFAULT 0,
    `last_position` INT COMMENT 'Video position or page number',
    `last_accessed_at` TIMESTAMP,
    `completed_at` TIMESTAMP NULL,
    FOREIGN KEY (`enrollment_id`) REFERENCES `course_enrollments`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`lesson_id`) REFERENCES `course_lessons`(`id`) ON DELETE CASCADE,
    UNIQUE KEY `unique_progress` (`enrollment_id`, `lesson_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `course_quizzes` (
    `id` INT PRIMARY KEY AUTO_INCREMENT,
    `course_id` INT NOT NULL,
    `lesson_id` INT,
    `title` VARCHAR(255) NOT NULL,
    `description` TEXT,
    `questions` JSON,
    `passing_score` INT DEFAULT 70,
    `time_limit_minutes` INT,
    `max_attempts` INT DEFAULT 3,
    `shuffle_questions` BOOLEAN DEFAULT FALSE,
    `show_correct_answers` BOOLEAN DEFAULT TRUE,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`course_id`) REFERENCES `courses`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`lesson_id`) REFERENCES `course_lessons`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `quiz_attempts` (
    `id` INT PRIMARY KEY AUTO_INCREMENT,
    `quiz_id` INT NOT NULL,
    `student_id` INT NOT NULL,
    `enrollment_id` INT NOT NULL,
    `answers` JSON,
    `score` DECIMAL(5,2),
    `passed` BOOLEAN DEFAULT FALSE,
    `attempt_number` INT DEFAULT 1,
    `time_taken_seconds` INT,
    `started_at` TIMESTAMP,
    `submitted_at` TIMESTAMP,
    FOREIGN KEY (`quiz_id`) REFERENCES `course_quizzes`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`enrollment_id`) REFERENCES `course_enrollments`(`id`) ON DELETE CASCADE,
    INDEX `idx_quiz_student` (`quiz_id`, `student_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add missing columns to certificates table
ALTER TABLE `certificates` 
ADD COLUMN IF NOT EXISTS `course_id` INT AFTER `id`,
ADD COLUMN IF NOT EXISTS `enrollment_id` INT AFTER `course_id`,
ADD COLUMN IF NOT EXISTS `issued_to_email` VARCHAR(255) AFTER `enrollment_id`,
ADD COLUMN IF NOT EXISTS `verification_code` VARCHAR(100) UNIQUE AFTER `issued_to_email`,
ADD COLUMN IF NOT EXISTS `template_data` JSON AFTER `verification_code`;
