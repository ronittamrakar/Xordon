-- =====================================================
-- COMPANY CULTURE MODULE - COMPLETE DATABASE SCHEMA
-- =====================================================
-- This migration creates all necessary tables for the Company Culture feature
-- including surveys, peer recognition, team events, and culture champions

-- Culture Surveys Table
CREATE TABLE IF NOT EXISTS `culture_surveys` (
    `id` INT PRIMARY KEY AUTO_INCREMENT,
    `workspace_id` INT NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `description` TEXT,
    `questions` JSON COMMENT 'Array of survey questions with types and options',
    `frequency` ENUM('one_time', 'weekly', 'monthly', 'quarterly', 'annual') DEFAULT 'one_time',
    `is_anonymous` BOOLEAN DEFAULT TRUE,
    `status` ENUM('draft', 'active', 'closed', 'archived') DEFAULT 'draft',
    `target_audience` JSON COMMENT 'Employee filters (departments, roles, etc.)',
    `response_count` INT DEFAULT 0,
    `avg_sentiment_score` DECIMAL(3,2),
    `created_by` INT,
    `published_at` TIMESTAMP NULL,
    `closed_at` TIMESTAMP NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON DELETE CASCADE,
    INDEX `idx_workspace_status` (`workspace_id`, `status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Culture Survey Responses Table
CREATE TABLE IF NOT EXISTS `culture_survey_responses` (
    `id` INT PRIMARY KEY AUTO_INCREMENT,
    `survey_id` INT NOT NULL,
    `employee_id` INT COMMENT 'NULL if anonymous',
    `responses` JSON COMMENT 'Question ID to answer mapping',
    `sentiment_score` DECIMAL(3,2) COMMENT 'Overall sentiment from -1 to 1',
    `completion_time_seconds` INT,
    `submitted_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`survey_id`) REFERENCES `culture_surveys`(`id`) ON DELETE CASCADE,
    INDEX `idx_survey_submitted` (`survey_id`, `submitted_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Peer Recognition Table
CREATE TABLE IF NOT EXISTS `peer_recognition` (
    `id` INT PRIMARY KEY AUTO_INCREMENT,
    `workspace_id` INT NOT NULL,
    `from_employee_id` INT NOT NULL,
    `to_employee_id` INT NOT NULL,
    `recognition_type` VARCHAR(100) COMMENT 'e.g., teamwork, innovation, leadership',
    `message` TEXT NOT NULL,
    `points_awarded` INT DEFAULT 0,
    `is_public` BOOLEAN DEFAULT TRUE,
    `likes_count` INT DEFAULT 0,
    `comments_count` INT DEFAULT 0,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON DELETE CASCADE,
    INDEX `idx_workspace_created` (`workspace_id`, `created_at`),
    INDEX `idx_to_employee` (`to_employee_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Recognition Reactions Table
CREATE TABLE IF NOT EXISTS `recognition_reactions` (
    `id` INT PRIMARY KEY AUTO_INCREMENT,
    `recognition_id` INT NOT NULL,
    `employee_id` INT NOT NULL,
    `reaction_type` ENUM('like', 'love', 'celebrate', 'support') DEFAULT 'like',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`recognition_id`) REFERENCES `peer_recognition`(`id`) ON DELETE CASCADE,
    UNIQUE KEY `unique_reaction` (`recognition_id`, `employee_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Recognition Comments Table
CREATE TABLE IF NOT EXISTS `recognition_comments` (
    `id` INT PRIMARY KEY AUTO_INCREMENT,
    `recognition_id` INT NOT NULL,
    `employee_id` INT NOT NULL,
    `comment` TEXT NOT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`recognition_id`) REFERENCES `peer_recognition`(`id`) ON DELETE CASCADE,
    INDEX `idx_recognition_created` (`recognition_id`, `created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Team Events Table
CREATE TABLE IF NOT EXISTS `team_events` (
    `id` INT PRIMARY KEY AUTO_INCREMENT,
    `workspace_id` INT NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `description` TEXT,
    `event_type` VARCHAR(100) COMMENT 'e.g., team_building, social, training, celebration',
    `event_date` DATETIME NOT NULL,
    `end_date` DATETIME,
    `location` VARCHAR(255),
    `location_type` ENUM('in_person', 'virtual', 'hybrid') DEFAULT 'in_person',
    `virtual_link` VARCHAR(500),
    `max_attendees` INT,
    `current_attendees` INT DEFAULT 0,
    `rsvp_deadline` DATETIME,
    `budget` DECIMAL(10,2),
    `status` ENUM('draft', 'published', 'cancelled', 'completed') DEFAULT 'draft',
    `created_by` INT,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON DELETE CASCADE,
    INDEX `idx_workspace_date` (`workspace_id`, `event_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Event Attendees Table
CREATE TABLE IF NOT EXISTS `event_attendees` (
    `id` INT PRIMARY KEY AUTO_INCREMENT,
    `event_id` INT NOT NULL,
    `employee_id` INT NOT NULL,
    `rsvp_status` ENUM('going', 'maybe', 'not_going', 'pending') DEFAULT 'pending',
    `plus_ones` INT DEFAULT 0,
    `dietary_restrictions` TEXT,
    `notes` TEXT,
    `checked_in` BOOLEAN DEFAULT FALSE,
    `checked_in_at` TIMESTAMP NULL,
    `rsvp_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`event_id`) REFERENCES `team_events`(`id`) ON DELETE CASCADE,
    UNIQUE KEY `unique_attendee` (`event_id`, `employee_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Culture Champions Table
CREATE TABLE IF NOT EXISTS `culture_champions` (
    `id` INT PRIMARY KEY AUTO_INCREMENT,
    `workspace_id` INT NOT NULL,
    `employee_id` INT NOT NULL,
    `department` VARCHAR(100),
    `appointed_at` DATE NOT NULL,
    `status` ENUM('active', 'inactive') DEFAULT 'active',
    `achievements` JSON COMMENT 'Array of achievements and milestones',
    `initiatives_led` INT DEFAULT 0,
    `recognition_given` INT DEFAULT 0,
    `events_organized` INT DEFAULT 0,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON DELETE CASCADE,
    UNIQUE KEY `unique_champion` (`workspace_id`, `employee_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Culture Initiatives Table
CREATE TABLE IF NOT EXISTS `culture_initiatives` (
    `id` INT PRIMARY KEY AUTO_INCREMENT,
    `workspace_id` INT NOT NULL,
    `champion_id` INT,
    `title` VARCHAR(255) NOT NULL,
    `description` TEXT,
    `category` VARCHAR(100) COMMENT 'e.g., wellness, diversity, sustainability',
    `goals` JSON COMMENT 'Initiative goals and KPIs',
    `status` ENUM('planning', 'active', 'completed', 'on_hold') DEFAULT 'planning',
    `start_date` DATE,
    `end_date` DATE,
    `budget` DECIMAL(10,2),
    `impact_score` DECIMAL(3,2),
    `created_by` INT,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`champion_id`) REFERENCES `culture_champions`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Culture Metrics Table
CREATE TABLE IF NOT EXISTS `culture_metrics` (
    `id` INT PRIMARY KEY AUTO_INCREMENT,
    `workspace_id` INT NOT NULL,
    `date` DATE NOT NULL,
    `engagement_score` DECIMAL(5,2),
    `satisfaction_score` DECIMAL(5,2),
    `recognition_count` INT DEFAULT 0,
    `survey_response_rate` DECIMAL(5,2),
    `event_participation_rate` DECIMAL(5,2),
    `turnover_rate` DECIMAL(5,2),
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON DELETE CASCADE,
    UNIQUE KEY `unique_workspace_date` (`workspace_id`, `date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Onboarding Modules Table
CREATE TABLE IF NOT EXISTS `onboarding_modules` (
    `id` INT PRIMARY KEY AUTO_INCREMENT,
    `workspace_id` INT NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `description` TEXT,
    `content` LONGTEXT,
    `module_type` VARCHAR(100) COMMENT 'e.g., video, document, checklist, quiz',
    `order_index` INT DEFAULT 0,
    `is_required` BOOLEAN DEFAULT TRUE,
    `estimated_duration_minutes` INT,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON DELETE CASCADE,
    INDEX `idx_workspace_order` (`workspace_id`, `order_index`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Onboarding Progress Table
CREATE TABLE IF NOT EXISTS `onboarding_progress` (
    `id` INT PRIMARY KEY AUTO_INCREMENT,
    `employee_id` INT NOT NULL,
    `module_id` INT NOT NULL,
    `status` ENUM('not_started', 'in_progress', 'completed', 'skipped') DEFAULT 'not_started',
    `completion_percentage` DECIMAL(5,2) DEFAULT 0.00,
    `time_spent_minutes` INT DEFAULT 0,
    `started_at` TIMESTAMP NULL,
    `completed_at` TIMESTAMP NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`module_id`) REFERENCES `onboarding_modules`(`id`) ON DELETE CASCADE,
    UNIQUE KEY `unique_employee_module` (`employee_id`, `module_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
