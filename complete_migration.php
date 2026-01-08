<?php
/**
 * COMPLETE DATABASE MIGRATION - FIXED VERSION
 * This script handles foreign key constraints properly
 */

require_once __DIR__ . '/backend/src/Database.php';
use Xordon\Database;

function colorOutput($text, $color = 'white') {
    $colors = [
        'green' => "\033[32m",
        'red' => "\033[31m",
        'yellow' => "\033[33m",
        'blue' => "\033[36m",
        'reset' => "\033[0m"
    ];
    echo ($colors[$color] ?? '') . $text . $colors['reset'] . "\n";
}

try {
    $pdo = Database::conn();
    
    colorOutput("========================================", 'blue');
    colorOutput("XORDON COMPLETE DATABASE MIGRATION", 'blue');
    colorOutput("========================================", 'blue');
    echo "\n";
    
    // Disable foreign key checks temporarily
    $pdo->exec("SET FOREIGN_KEY_CHECKS = 0");
    colorOutput("✓ Foreign key checks disabled", 'green');
    
    $totalCreated = 0;
    $totalErrors = 0;
    
    // =====================================================
    // AI WORKFORCE MODULE
    // =====================================================
    colorOutput("\n[1/9] Creating AI Workforce tables...", 'blue');
    
    $aiTables = [
        "CREATE TABLE IF NOT EXISTS `ai_capabilities` (
            `id` INT PRIMARY KEY AUTO_INCREMENT,
            `name` VARCHAR(255) NOT NULL,
            `category` VARCHAR(100),
            `description` TEXT,
            `config_schema` JSON,
            `required_integrations` JSON,
            `is_active` BOOLEAN DEFAULT TRUE,
            `is_premium` BOOLEAN DEFAULT FALSE,
            `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            UNIQUE KEY `unique_capability_name` (`name`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",
        
        "CREATE TABLE IF NOT EXISTS `ai_workflow_executions` (
            `id` INT PRIMARY KEY AUTO_INCREMENT,
            `workflow_id` INT NOT NULL,
            `ai_employee_id` INT,
            `status` ENUM('pending', 'running', 'completed', 'failed', 'cancelled') DEFAULT 'pending',
            `input_data` JSON,
            `output_data` JSON,
            `error_message` TEXT,
            `error_stack` TEXT,
            `execution_time_seconds` INT,
            `started_at` TIMESTAMP NULL,
            `completed_at` TIMESTAMP NULL,
            `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX `idx_workflow_status` (`workflow_id`, `status`),
            INDEX `idx_created_at` (`created_at`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",
        
        "CREATE TABLE IF NOT EXISTS `ai_task_queue` (
            `id` INT PRIMARY KEY AUTO_INCREMENT,
            `workspace_id` INT NOT NULL,
            `ai_employee_id` INT,
            `task_type` VARCHAR(100) NOT NULL,
            `priority` INT DEFAULT 0,
            `payload` JSON,
            `status` ENUM('queued', 'processing', 'completed', 'failed', 'cancelled') DEFAULT 'queued',
            `attempts` INT DEFAULT 0,
            `max_attempts` INT DEFAULT 3,
            `error_log` TEXT,
            `result` JSON,
            `scheduled_at` TIMESTAMP NULL,
            `started_at` TIMESTAMP NULL,
            `completed_at` TIMESTAMP NULL,
            `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX `idx_status_priority` (`status`, `priority` DESC),
            INDEX `idx_scheduled_at` (`scheduled_at`),
            INDEX `idx_workspace_status` (`workspace_id`, `status`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",
        
        "CREATE TABLE IF NOT EXISTS `ai_employee_activity` (
            `id` BIGINT PRIMARY KEY AUTO_INCREMENT,
            `ai_employee_id` INT NOT NULL,
            `activity_type` VARCHAR(100) NOT NULL,
            `description` TEXT,
            `metadata` JSON,
            `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX `idx_employee_created` (`ai_employee_id`, `created_at`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci"
    ];
    
    foreach ($aiTables as $sql) {
        try {
            $pdo->exec($sql);
            $totalCreated++;
        } catch (Exception $e) {
            if (strpos($e->getMessage(), 'already exists') === false) {
                colorOutput("  Error: " . substr($e->getMessage(), 0, 100), 'red');
                $totalErrors++;
            }
        }
    }
    
    // Seed AI capabilities
    $pdo->exec("INSERT IGNORE INTO `ai_capabilities` (`name`, `category`, `description`, `is_active`) VALUES
        ('Email Response', 'communication', 'Automatically respond to customer emails', TRUE),
        ('Lead Qualification', 'analysis', 'Qualify and score incoming leads', TRUE),
        ('Appointment Scheduling', 'automation', 'Schedule appointments based on availability', TRUE),
        ('Data Entry', 'automation', 'Extract and enter data from documents', TRUE),
        ('Sentiment Analysis', 'analysis', 'Analyze customer sentiment from communications', TRUE),
        ('Follow-up Management', 'communication', 'Send automated follow-up messages', TRUE),
        ('Report Generation', 'analysis', 'Generate reports from data', TRUE),
        ('Social Media Monitoring', 'communication', 'Monitor and respond to social media', TRUE),
        ('Customer Support', 'communication', 'Provide tier-1 customer support', TRUE),
        ('Content Creation', 'communication', 'Generate marketing content', TRUE)");
    
    colorOutput("✓ AI Workforce tables created", 'green');
    
    // =====================================================
    // CULTURE MODULE
    // =====================================================
    colorOutput("\n[2/9] Creating Culture Module tables...", 'blue');
    
    $cultureTables = [
        "CREATE TABLE IF NOT EXISTS `culture_surveys` (
            `id` INT PRIMARY KEY AUTO_INCREMENT,
            `workspace_id` INT NOT NULL,
            `title` VARCHAR(255) NOT NULL,
            `description` TEXT,
            `questions` JSON,
            `frequency` ENUM('one_time', 'weekly', 'monthly', 'quarterly', 'annual') DEFAULT 'one_time',
            `is_anonymous` BOOLEAN DEFAULT TRUE,
            `status` ENUM('draft', 'active', 'closed', 'archived') DEFAULT 'draft',
            `target_audience` JSON,
            `response_count` INT DEFAULT 0,
            `avg_sentiment_score` DECIMAL(3,2),
            `created_by` INT,
            `published_at` TIMESTAMP NULL,
            `closed_at` TIMESTAMP NULL,
            `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX `idx_workspace_status` (`workspace_id`, `status`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",
        
        "CREATE TABLE IF NOT EXISTS `culture_survey_responses` (
            `id` INT PRIMARY KEY AUTO_INCREMENT,
            `survey_id` INT NOT NULL,
            `employee_id` INT,
            `responses` JSON,
            `sentiment_score` DECIMAL(3,2),
            `completion_time_seconds` INT,
            `submitted_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX `idx_survey_submitted` (`survey_id`, `submitted_at`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",
        
        "CREATE TABLE IF NOT EXISTS `peer_recognition` (
            `id` INT PRIMARY KEY AUTO_INCREMENT,
            `workspace_id` INT NOT NULL,
            `from_employee_id` INT NOT NULL,
            `to_employee_id` INT NOT NULL,
            `recognition_type` VARCHAR(100),
            `message` TEXT NOT NULL,
            `points_awarded` INT DEFAULT 0,
            `is_public` BOOLEAN DEFAULT TRUE,
            `likes_count` INT DEFAULT 0,
            `comments_count` INT DEFAULT 0,
            `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX `idx_workspace_created` (`workspace_id`, `created_at`),
            INDEX `idx_to_employee` (`to_employee_id`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",
        
        "CREATE TABLE IF NOT EXISTS `recognition_reactions` (
            `id` INT PRIMARY KEY AUTO_INCREMENT,
            `recognition_id` INT NOT NULL,
            `employee_id` INT NOT NULL,
            `reaction_type` ENUM('like', 'love', 'celebrate', 'support') DEFAULT 'like',
            `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE KEY `unique_reaction` (`recognition_id`, `employee_id`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",
        
        "CREATE TABLE IF NOT EXISTS `recognition_comments` (
            `id` INT PRIMARY KEY AUTO_INCREMENT,
            `recognition_id` INT NOT NULL,
            `employee_id` INT NOT NULL,
            `comment` TEXT NOT NULL,
            `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX `idx_recognition_created` (`recognition_id`, `created_at`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",
        
        "CREATE TABLE IF NOT EXISTS `team_events` (
            `id` INT PRIMARY KEY AUTO_INCREMENT,
            `workspace_id` INT NOT NULL,
            `title` VARCHAR(255) NOT NULL,
            `description` TEXT,
            `event_type` VARCHAR(100),
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
            INDEX `idx_workspace_date` (`workspace_id`, `event_date`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",
        
        "CREATE TABLE IF NOT EXISTS `event_attendees` (
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
            UNIQUE KEY `unique_attendee` (`event_id`, `employee_id`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",
        
        "CREATE TABLE IF NOT EXISTS `culture_champions` (
            `id` INT PRIMARY KEY AUTO_INCREMENT,
            `workspace_id` INT NOT NULL,
            `employee_id` INT NOT NULL,
            `department` VARCHAR(100),
            `appointed_at` DATE NOT NULL,
            `status` ENUM('active', 'inactive') DEFAULT 'active',
            `achievements` JSON,
            `initiatives_led` INT DEFAULT 0,
            `recognition_given` INT DEFAULT 0,
            `events_organized` INT DEFAULT 0,
            `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            UNIQUE KEY `unique_champion` (`workspace_id`, `employee_id`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",
        
        "CREATE TABLE IF NOT EXISTS `culture_initiatives` (
            `id` INT PRIMARY KEY AUTO_INCREMENT,
            `workspace_id` INT NOT NULL,
            `champion_id` INT,
            `title` VARCHAR(255) NOT NULL,
            `description` TEXT,
            `category` VARCHAR(100),
            `goals` JSON,
            `status` ENUM('planning', 'active', 'completed', 'on_hold') DEFAULT 'planning',
            `start_date` DATE,
            `end_date` DATE,
            `budget` DECIMAL(10,2),
            `impact_score` DECIMAL(3,2),
            `created_by` INT,
            `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",
        
        "CREATE TABLE IF NOT EXISTS `culture_metrics` (
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
            UNIQUE KEY `unique_workspace_date` (`workspace_id`, `date`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",
        
        "CREATE TABLE IF NOT EXISTS `onboarding_modules` (
            `id` INT PRIMARY KEY AUTO_INCREMENT,
            `workspace_id` INT NOT NULL,
            `title` VARCHAR(255) NOT NULL,
            `description` TEXT,
            `content` LONGTEXT,
            `module_type` VARCHAR(100),
            `order_index` INT DEFAULT 0,
            `is_required` BOOLEAN DEFAULT TRUE,
            `estimated_duration_minutes` INT,
            `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX `idx_workspace_order` (`workspace_id`, `order_index`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",
        
        "CREATE TABLE IF NOT EXISTS `onboarding_progress` (
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
            UNIQUE KEY `unique_employee_module` (`employee_id`, `module_id`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci"
    ];
    
    foreach ($cultureTables as $sql) {
        try {
            $pdo->exec($sql);
            $totalCreated++;
        } catch (Exception $e) {
            if (strpos($e->getMessage(), 'already exists') === false) {
                colorOutput("  Error: " . substr($e->getMessage(), 0, 100), 'red');
                $totalErrors++;
            }
        }
    }
    
    colorOutput("✓ Culture Module tables created", 'green');
    
    // Continue with remaining modules...
    colorOutput("\n[3/9] Creating Blog/CMS tables...", 'blue');
    
    $blogTables = [
        "CREATE TABLE IF NOT EXISTS `blog_categories` (
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
            UNIQUE KEY `unique_workspace_slug` (`workspace_id`, `slug`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",
        
        "CREATE TABLE IF NOT EXISTS `blog_post_categories` (
            `post_id` INT NOT NULL,
            `category_id` INT NOT NULL,
            PRIMARY KEY (`post_id`, `category_id`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",
        
        "CREATE TABLE IF NOT EXISTS `blog_tags` (
            `id` INT PRIMARY KEY AUTO_INCREMENT,
            `workspace_id` INT NOT NULL,
            `name` VARCHAR(100) NOT NULL,
            `slug` VARCHAR(100) NOT NULL,
            `post_count` INT DEFAULT 0,
            `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE KEY `unique_workspace_slug` (`workspace_id`, `slug`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",
        
        "CREATE TABLE IF NOT EXISTS `blog_post_tags` (
            `post_id` INT NOT NULL,
            `tag_id` INT NOT NULL,
            PRIMARY KEY (`post_id`, `tag_id`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",
        
        "CREATE TABLE IF NOT EXISTS `blog_comments` (
            `id` INT PRIMARY KEY AUTO_INCREMENT,
            `post_id` INT NOT NULL,
            `parent_id` INT,
            `author_name` VARCHAR(255) NOT NULL,
            `author_email` VARCHAR(255) NOT NULL,
            `author_website` VARCHAR(500),
            `author_ip` VARCHAR(45),
            `author_user_agent` TEXT,
            `content` TEXT NOT NULL,
            `status` ENUM('pending', 'approved', 'spam', 'trash') DEFAULT 'pending',
            `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX `idx_post_status` (`post_id`, `status`),
            INDEX `idx_created_at` (`created_at`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci"
    ];
    
    foreach ($blogTables as $sql) {
        try {
            $pdo->exec($sql);
            $totalCreated++;
        } catch (Exception $e) {
            if (strpos($e->getMessage(), 'already exists') === false) {
                colorOutput("  Error: " . substr($e->getMessage(), 0, 100), 'red');
                $totalErrors++;
            }
        }
    }
    
    colorOutput("✓ Blog/CMS tables created", 'green');
    
    // Webinars
    colorOutput("\n[4/9] Creating Webinar tables...", 'blue');
    
    $pdo->exec("CREATE TABLE IF NOT EXISTS `webinar_registrations` (
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
        INDEX `idx_webinar_email` (`webinar_id`, `email`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
    $totalCreated++;
    
    colorOutput("✓ Webinar tables created", 'green');
    
    // Loyalty
    colorOutput("\n[5/9] Creating Loyalty Program tables...", 'blue');
    
    $loyaltyTables = [
        "CREATE TABLE IF NOT EXISTS `loyalty_members` (
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
            UNIQUE KEY `unique_program_contact` (`program_id`, `contact_id`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",
        
        "CREATE TABLE IF NOT EXISTS `loyalty_redemptions` (
            `id` INT PRIMARY KEY AUTO_INCREMENT,
            `member_id` INT NOT NULL,
            `reward_id` INT NOT NULL,
            `points_spent` INT NOT NULL,
            `status` ENUM('pending', 'fulfilled', 'cancelled', 'expired') DEFAULT 'pending',
            `redemption_code` VARCHAR(50),
            `redeemed_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            `fulfilled_at` TIMESTAMP NULL,
            `expires_at` TIMESTAMP NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci"
    ];
    
    foreach ($loyaltyTables as $sql) {
        try {
            $pdo->exec($sql);
            $totalCreated++;
        } catch (Exception $e) {
            if (strpos($e->getMessage(), 'already exists') === false) {
                colorOutput("  Error: " . substr($e->getMessage(), 0, 100), 'red');
                $totalErrors++;
            }
        }
    }
    
    colorOutput("✓ Loyalty Program tables created", 'green');
    
    // Financing
    colorOutput("\n[6/9] Creating Financing tables...", 'blue');
    
    $pdo->exec("CREATE TABLE IF NOT EXISTS `financing_applications` (
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
        INDEX `idx_workspace_status` (`workspace_id`, `status`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
    $totalCreated++;
    
    colorOutput("✓ Financing tables created", 'green');
    
    // E-Signatures
    colorOutput("\n[7/9] Creating E-Signature tables...", 'blue');
    
    $signatureTables = [
        "CREATE TABLE IF NOT EXISTS `signature_documents` (
            `id` INT PRIMARY KEY AUTO_INCREMENT,
            `workspace_id` INT NOT NULL,
            `document_type` VARCHAR(100),
            `reference_id` INT,
            `title` VARCHAR(255) NOT NULL,
            `document_url` VARCHAR(500),
            `pdf_url` VARCHAR(500),
            `status` ENUM('draft', 'sent', 'viewed', 'signed', 'declined', 'expired', 'voided') DEFAULT 'draft',
            `provider` VARCHAR(50),
            `provider_envelope_id` VARCHAR(255),
            `created_by` INT,
            `sent_at` TIMESTAMP NULL,
            `completed_at` TIMESTAMP NULL,
            `expires_at` TIMESTAMP NULL,
            `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX `idx_workspace_status` (`workspace_id`, `status`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",
        
        "CREATE TABLE IF NOT EXISTS `signature_recipients` (
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
            `signed_at` TIMESTAMP NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci"
    ];
    
    foreach ($signatureTables as $sql) {
        try {
            $pdo->exec($sql);
            $totalCreated++;
        } catch (Exception $e) {
            if (strpos($e->getMessage(), 'already exists') === false) {
                colorOutput("  Error: " . substr($e->getMessage(), 0, 100), 'red');
                $totalErrors++;
            }
        }
    }
    
    colorOutput("✓ E-Signature tables created", 'green');
    
    // LMS
    colorOutput("\n[8/9] Creating LMS tables...", 'blue');
    
    $pdo->exec("CREATE TABLE IF NOT EXISTS `course_progress` (
        `id` INT PRIMARY KEY AUTO_INCREMENT,
        `enrollment_id` INT NOT NULL,
        `lesson_id` INT NOT NULL,
        `status` ENUM('not_started', 'in_progress', 'completed') DEFAULT 'not_started',
        `time_spent_seconds` INT DEFAULT 0,
        `last_position` INT,
        `last_accessed_at` TIMESTAMP,
        `completed_at` TIMESTAMP NULL,
        UNIQUE KEY `unique_progress` (`enrollment_id`, `lesson_id`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
    $totalCreated++;
    
    colorOutput("✓ LMS tables created", 'green');
    
    // Re-enable foreign key checks
    $pdo->exec("SET FOREIGN_KEY_CHECKS = 1");
    colorOutput("\n✓ Foreign key checks re-enabled", 'green');
    
    // Final verification
    colorOutput("\n========================================", 'blue');
    colorOutput("FINAL VERIFICATION", 'blue');
    colorOutput("========================================", 'blue');
    
    $stmt = $pdo->query("SHOW TABLES");
    $allTables = $stmt->rowCount();
    
    colorOutput("\n📊 Total tables in database: $allTables", 'green');
    colorOutput("📊 Tables created/updated: $totalCreated", 'green');
    if ($totalErrors > 0) {
        colorOutput("⚠ Errors encountered: $totalErrors", 'yellow');
    }
    
    colorOutput("\n========================================", 'blue');
    colorOutput("✅ MIGRATION COMPLETE!", 'green');
    colorOutput("========================================", 'blue');
    
    echo "\nAll critical tables have been created!\n";
    echo "Run 'php check_tables.php' to verify all tables.\n\n";
    
} catch (Exception $e) {
    colorOutput("\n✗ FATAL ERROR: " . $e->getMessage(), 'red');
    exit(1);
}
