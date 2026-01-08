-- AI Knowledge Bases Migration
-- Tables for storing AI agent training data and knowledge sources

-- AI Knowledge Bases
CREATE TABLE IF NOT EXISTS `ai_knowledge_bases` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `workspace_id` INT UNSIGNED NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `description` TEXT NULL,
  `type` ENUM('Documents', 'URLs', 'Text', 'Mixed') DEFAULT 'Documents',
  `status` ENUM('active', 'inactive', 'processing') DEFAULT 'active',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_workspace` (`workspace_id`),
  INDEX `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- AI Knowledge Sources
CREATE TABLE IF NOT EXISTS `ai_knowledge_sources` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `knowledge_base_id` INT UNSIGNED NOT NULL,
  `source_type` ENUM('document', 'url', 'text') NOT NULL,
  `source_name` VARCHAR(255) NOT NULL,
  `source_url` VARCHAR(2048) NULL,
  `content` LONGTEXT NULL,
  `metadata` JSON NULL,
  `file_size` INT UNSIGNED NULL,
  `file_type` VARCHAR(50) NULL,
  `status` ENUM('processing', 'indexed', 'failed') DEFAULT 'processing',
  `error_message` TEXT NULL,
  `chunks_count` INT UNSIGNED DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_knowledge_base` (`knowledge_base_id`),
  INDEX `idx_source_type` (`source_type`),
  INDEX `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- AI Agent Templates (for the template marketplace)
CREATE TABLE IF NOT EXISTS `ai_agent_templates` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `description` TEXT NULL,
  `category` VARCHAR(100) NOT NULL,
  `author` VARCHAR(255) NULL,
  `type` ENUM('voice', 'chat', 'hybrid') DEFAULT 'chat',
  `config` JSON NULL,
  `prompt_template` TEXT NULL,
  `business_niches` JSON NULL,
  `use_cases` JSON NULL,
  `downloads` INT UNSIGNED DEFAULT 0,
  `rating` DECIMAL(2,1) DEFAULT 0.0,
  `reviews_count` INT UNSIGNED DEFAULT 0,
  `price` ENUM('Free', 'Premium', 'Enterprise') DEFAULT 'Free',
  `image_url` VARCHAR(500) NULL,
  `is_official` BOOLEAN DEFAULT FALSE,
  `is_verified` BOOLEAN DEFAULT FALSE,
  `is_published` BOOLEAN DEFAULT TRUE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_category` (`category`),
  INDEX `idx_type` (`type`),
  INDEX `idx_price` (`price`),
  INDEX `idx_downloads` (`downloads`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- AI Content Generation History
CREATE TABLE IF NOT EXISTS `ai_content_history` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `workspace_id` INT UNSIGNED NOT NULL,
  `user_id` INT UNSIGNED NOT NULL,
  `channel` VARCHAR(50) NOT NULL,
  `action` VARCHAR(50) NOT NULL,
  `prompt` TEXT NULL,
  `output` TEXT NOT NULL,
  `provider` VARCHAR(50) NOT NULL,
  `model` VARCHAR(100) NOT NULL,
  `tokens_used` INT UNSIGNED NULL,
  `metadata` JSON NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_workspace` (`workspace_id`),
  INDEX `idx_user` (`user_id`),
  INDEX `idx_channel` (`channel`),
  INDEX `idx_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default agent templates
INSERT IGNORE INTO `ai_agent_templates` (`id`, `name`, `description`, `category`, `author`, `type`, `business_niches`, `use_cases`, `downloads`, `rating`, `reviews_count`, `price`, `image_url`, `is_official`, `is_verified`) VALUES
(1, 'Abigail - Global Support Unit', 'A high-performance conversational unit engineered for complex multi-lingual support and sentiment-aware interaction.', 'Customer Excellence', 'Neural Systems', 'chat', '["Agency", "SaaS", "E-commerce"]', '["Global Support", "Sentiment Analysis"]', 42100, 4.9, 128, 'Free', 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png', 1, 1),
(2, 'Bio-Medical Appointment Node', 'A precision-tuned scheduling engine designed for medical environments requiring strict compliance and complex booking logic.', 'Health & Sciences', 'MedTech AI', 'chat', '["Medical Clinic", "Surgical Centers"]', '["Critical Scheduling", "Patient Triage"]', 31400, 4.8, 94, 'Premium', 'https://cdn-icons-png.flaticon.com/512/3467/3467831.png', 1, 1),
(3, 'Vector - Logical Operations bot', 'Smart AI Receptionist for technical service firms. Advanced logic for field service dispatching and lead qualification.', 'Technical Services', 'GenX Automations', 'chat', '["Engineering", "HVAC", "Technical Ops"]', '["Dispatching", "Field Support"]', 18200, 5.0, 42, 'Free', 'https://cdn-icons-png.flaticon.com/512/4140/4140037.png', 1, 1),
(4, 'Quantum Sales Protocol', 'The ultimate sales protocol. Trained on high-ticket closing scripts and objection-handling algorithms.', 'Revenue Generation', 'Revenue Labs', 'chat', '["Enterprise SaaS", "Consultancy"]', '["Closing", "Objection Handling"]', 15900, 4.7, 61, 'Enterprise', 'https://cdn-icons-png.flaticon.com/512/4712/4712126.png', 1, 1),
(5, 'Voice Concierge Pro', 'Premium voice agent for handling inbound calls with natural conversation flow and intelligent routing.', 'Voice AI', 'VoiceTech', 'voice', '["Hotels", "Restaurants", "Services"]', '["Call Handling", "Reservations"]', 12500, 4.6, 78, 'Premium', 'https://cdn-icons-png.flaticon.com/512/4712/4712012.png', 1, 1),
(6, 'Lead Qualifier AI', 'Intelligent lead qualification chatbot that scores and routes leads based on custom criteria.', 'Sales', 'LeadGen Pro', 'chat', '["Real Estate", "Insurance", "Finance"]', '["Lead Scoring", "Qualification"]', 28700, 4.8, 156, 'Free', 'https://cdn-icons-png.flaticon.com/512/4712/4712109.png', 1, 1);
