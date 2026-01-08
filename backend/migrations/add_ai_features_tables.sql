-- AI Features Database Tables (Without Foreign Keys)
-- This migration adds tables for AI-powered features

-- AI Chatbot Conversations
CREATE TABLE IF NOT EXISTS `ai_chatbot_conversations` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `workspace_id` INT UNSIGNED NOT NULL,
  `contact_id` INT UNSIGNED NULL,
  `session_id` VARCHAR(255) NOT NULL,
  `channel` ENUM('website', 'facebook', 'whatsapp', 'sms') DEFAULT 'website',
  `status` ENUM('active', 'resolved', 'transferred', 'abandoned') DEFAULT 'active',
  `sentiment` ENUM('positive', 'neutral', 'negative') NULL,
  `intent` VARCHAR(255) NULL,
  `started_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `ended_at` TIMESTAMP NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_workspace` (`workspace_id`),
  INDEX `idx_contact` (`contact_id`),
  INDEX `idx_session` (`session_id`),
  INDEX `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- AI Chatbot Messages
CREATE TABLE IF NOT EXISTS `ai_chatbot_messages` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `conversation_id` INT UNSIGNED NOT NULL,
  `role` ENUM('user', 'assistant', 'system') NOT NULL,
  `content` TEXT NOT NULL,
  `metadata` JSON NULL,
  `confidence_score` DECIMAL(3,2) NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_conversation` (`conversation_id`),
  INDEX `idx_role` (`role`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- AI Call Answering
CREATE TABLE IF NOT EXISTS `ai_call_answering` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `workspace_id` INT UNSIGNED NOT NULL,
  `call_id` INT UNSIGNED NULL,
  `contact_id` INT UNSIGNED NULL,
  `phone_number` VARCHAR(20) NOT NULL,
  `direction` ENUM('inbound', 'outbound') DEFAULT 'inbound',
  `status` ENUM('answered', 'voicemail', 'transferred', 'failed') NOT NULL,
  `duration` INT UNSIGNED DEFAULT 0,
  `transcript` TEXT NULL,
  `summary` TEXT NULL,
  `intent` VARCHAR(255) NULL,
  `action_taken` VARCHAR(255) NULL,
  `booking_created` BOOLEAN DEFAULT FALSE,
  `recording_url` VARCHAR(500) NULL,
  `started_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `ended_at` TIMESTAMP NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_workspace` (`workspace_id`),
  INDEX `idx_call` (`call_id`),
  INDEX `idx_contact` (`contact_id`),
  INDEX `idx_phone` (`phone_number`),
  INDEX `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- AI Analytics Insights
CREATE TABLE IF NOT EXISTS `ai_analytics_insights` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `workspace_id` INT UNSIGNED NOT NULL,
  `insight_type` ENUM('trend', 'anomaly', 'prediction', 'recommendation', 'alert') NOT NULL,
  `category` VARCHAR(100) NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT NOT NULL,
  `data` JSON NULL,
  `confidence_score` DECIMAL(3,2) NULL,
  `priority` ENUM('low', 'medium', 'high', 'critical') DEFAULT 'medium',
  `status` ENUM('new', 'viewed', 'actioned', 'dismissed') DEFAULT 'new',
  `valid_from` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `valid_until` TIMESTAMP NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_workspace` (`workspace_id`),
  INDEX `idx_type` (`insight_type`),
  INDEX `idx_category` (`category`),
  INDEX `idx_priority` (`priority`),
  INDEX `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- AI Conversation Booking
CREATE TABLE IF NOT EXISTS `ai_conversation_bookings` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `workspace_id` INT UNSIGNED NOT NULL,
  `conversation_id` INT UNSIGNED NULL,
  `contact_id` INT UNSIGNED NULL,
  `appointment_id` INT UNSIGNED NULL,
  `channel` ENUM('sms', 'chat', 'facebook', 'whatsapp') NOT NULL,
  `status` ENUM('initiated', 'confirmed', 'cancelled', 'rescheduled') DEFAULT 'initiated',
  `service_type` VARCHAR(255) NULL,
  `preferred_date` DATE NULL,
  `preferred_time` TIME NULL,
  `confirmed_date` DATE NULL,
  `confirmed_time` TIME NULL,
  `notes` TEXT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_workspace` (`workspace_id`),
  INDEX `idx_conversation` (`conversation_id`),
  INDEX `idx_contact` (`contact_id`),
  INDEX `idx_appointment` (`appointment_id`),
  INDEX `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Facebook Messenger Integration
CREATE TABLE IF NOT EXISTS `facebook_messenger_accounts` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `workspace_id` INT UNSIGNED NOT NULL,
  `page_id` VARCHAR(255) NOT NULL,
  `page_name` VARCHAR(255) NOT NULL,
  `access_token` TEXT NOT NULL,
  `status` ENUM('active', 'inactive', 'error') DEFAULT 'active',
  `webhook_verified` BOOLEAN DEFAULT FALSE,
  `settings` JSON NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_workspace` (`workspace_id`),
  INDEX `idx_page` (`page_id`),
  UNIQUE KEY `unique_page` (`workspace_id`, `page_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Facebook Messenger Conversations
CREATE TABLE IF NOT EXISTS `facebook_messenger_conversations` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `workspace_id` INT UNSIGNED NOT NULL,
  `account_id` INT UNSIGNED NOT NULL,
  `contact_id` INT UNSIGNED NULL,
  `messenger_user_id` VARCHAR(255) NOT NULL,
  `thread_id` VARCHAR(255) NOT NULL,
  `status` ENUM('open', 'closed', 'archived') DEFAULT 'open',
  `last_message_at` TIMESTAMP NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_workspace` (`workspace_id`),
  INDEX `idx_account` (`account_id`),
  INDEX `idx_contact` (`contact_id`),
  INDEX `idx_messenger_user` (`messenger_user_id`),
  INDEX `idx_thread` (`thread_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Facebook Messenger Messages
CREATE TABLE IF NOT EXISTS `facebook_messenger_messages` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `conversation_id` INT UNSIGNED NOT NULL,
  `message_id` VARCHAR(255) NOT NULL,
  `direction` ENUM('inbound', 'outbound') NOT NULL,
  `message_type` ENUM('text', 'image', 'video', 'file', 'template') DEFAULT 'text',
  `content` TEXT NULL,
  `attachments` JSON NULL,
  `metadata` JSON NULL,
  `status` ENUM('sent', 'delivered', 'read', 'failed') DEFAULT 'sent',
  `sent_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `delivered_at` TIMESTAMP NULL,
  `read_at` TIMESTAMP NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_conversation` (`conversation_id`),
  INDEX `idx_message` (`message_id`),
  INDEX `idx_direction` (`direction`),
  INDEX `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Consumer Financing
CREATE TABLE IF NOT EXISTS `consumer_financing_applications` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `workspace_id` INT UNSIGNED NOT NULL,
  `contact_id` INT UNSIGNED NULL,
  `invoice_id` INT UNSIGNED NULL,
  `provider` ENUM('affirm', 'klarna', 'paypal_credit', 'other') NOT NULL,
  `application_id` VARCHAR(255) NULL,
  `amount` DECIMAL(10,2) NOT NULL,
  `status` ENUM('pending', 'approved', 'declined', 'cancelled', 'completed') DEFAULT 'pending',
  `approval_amount` DECIMAL(10,2) NULL,
  `term_months` INT NULL,
  `interest_rate` DECIMAL(5,2) NULL,
  `monthly_payment` DECIMAL(10,2) NULL,
  `application_data` JSON NULL,
  `applied_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `approved_at` TIMESTAMP NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_workspace` (`workspace_id`),
  INDEX `idx_contact` (`contact_id`),
  INDEX `idx_invoice` (`invoice_id`),
  INDEX `idx_provider` (`provider`),
  INDEX `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- AI Settings per Workspace
CREATE TABLE IF NOT EXISTS `ai_settings` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `workspace_id` INT UNSIGNED NOT NULL,
  `chatbot_enabled` BOOLEAN DEFAULT FALSE,
  `chatbot_name` VARCHAR(100) DEFAULT 'AI Assistant',
  `chatbot_greeting` TEXT NULL,
  `chatbot_model` VARCHAR(50) DEFAULT 'gpt-4',
  `call_answering_enabled` BOOLEAN DEFAULT FALSE,
  `call_answering_hours` JSON NULL,
  `conversation_booking_enabled` BOOLEAN DEFAULT FALSE,
  `analytics_insights_enabled` BOOLEAN DEFAULT TRUE,
  `facebook_messenger_enabled` BOOLEAN DEFAULT FALSE,
  `auto_response_delay` INT DEFAULT 2,
  `escalation_keywords` JSON NULL,
  `business_context` TEXT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `unique_workspace` (`workspace_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
