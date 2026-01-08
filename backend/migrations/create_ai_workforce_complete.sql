-- =====================================================
-- AI WORKFORCE MODULE - COMPLETE DATABASE SCHEMA
-- =====================================================
-- This migration creates all necessary tables for the AI Workforce feature
-- including AI employees, capabilities, workflows, and task queue

-- AI Employees Table
CREATE TABLE IF NOT EXISTS `ai_employees` (
    `id` INT PRIMARY KEY AUTO_INCREMENT,
    `workspace_id` INT NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `role` VARCHAR(100),
    `description` TEXT,
    `capabilities` JSON COMMENT 'Array of capability IDs this AI employee has',
    `status` ENUM('active', 'paused', 'training', 'archived') DEFAULT 'active',
    `avatar_url` VARCHAR(500),
    `personality_config` JSON COMMENT 'Personality traits and behavior settings',
    `performance_metrics` JSON COMMENT 'Success rates, tasks completed, etc.',
    `created_by` INT,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON DELETE CASCADE,
    INDEX `idx_workspace_status` (`workspace_id`, `status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- AI Capabilities Table
CREATE TABLE IF NOT EXISTS `ai_capabilities` (
    `id` INT PRIMARY KEY AUTO_INCREMENT,
    `name` VARCHAR(255) NOT NULL,
    `category` VARCHAR(100) COMMENT 'e.g., communication, analysis, automation',
    `description` TEXT,
    `config_schema` JSON COMMENT 'JSON schema for capability configuration',
    `required_integrations` JSON COMMENT 'External services this capability needs',
    `is_active` BOOLEAN DEFAULT TRUE,
    `is_premium` BOOLEAN DEFAULT FALSE,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY `unique_capability_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- AI Workflows Table
CREATE TABLE IF NOT EXISTS `ai_workflows` (
    `id` INT PRIMARY KEY AUTO_INCREMENT,
    `workspace_id` INT NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `description` TEXT,
    `trigger_config` JSON COMMENT 'Trigger conditions and settings',
    `steps` JSON COMMENT 'Array of workflow steps with actions and conditions',
    `status` ENUM('active', 'draft', 'archived', 'paused') DEFAULT 'draft',
    `assigned_employee_id` INT COMMENT 'Primary AI employee for this workflow',
    `execution_count` INT DEFAULT 0,
    `success_count` INT DEFAULT 0,
    `failure_count` INT DEFAULT 0,
    `avg_execution_time_seconds` INT,
    `created_by` INT,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`assigned_employee_id`) REFERENCES `ai_employees`(`id`) ON DELETE SET NULL,
    INDEX `idx_workspace_status` (`workspace_id`, `status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- AI Workflow Executions Table
CREATE TABLE IF NOT EXISTS `ai_workflow_executions` (
    `id` INT PRIMARY KEY AUTO_INCREMENT,
    `workflow_id` INT NOT NULL,
    `ai_employee_id` INT,
    `status` ENUM('pending', 'running', 'completed', 'failed', 'cancelled') DEFAULT 'pending',
    `input_data` JSON COMMENT 'Input parameters for this execution',
    `output_data` JSON COMMENT 'Results and output from execution',
    `error_message` TEXT,
    `error_stack` TEXT,
    `execution_time_seconds` INT,
    `started_at` TIMESTAMP NULL,
    `completed_at` TIMESTAMP NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`workflow_id`) REFERENCES `ai_workflows`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`ai_employee_id`) REFERENCES `ai_employees`(`id`) ON DELETE SET NULL,
    INDEX `idx_workflow_status` (`workflow_id`, `status`),
    INDEX `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- AI Task Queue Table
CREATE TABLE IF NOT EXISTS `ai_task_queue` (
    `id` INT PRIMARY KEY AUTO_INCREMENT,
    `workspace_id` INT NOT NULL,
    `ai_employee_id` INT,
    `task_type` VARCHAR(100) NOT NULL COMMENT 'Type of task to execute',
    `priority` INT DEFAULT 0 COMMENT 'Higher number = higher priority',
    `payload` JSON COMMENT 'Task data and parameters',
    `status` ENUM('queued', 'processing', 'completed', 'failed', 'cancelled') DEFAULT 'queued',
    `attempts` INT DEFAULT 0,
    `max_attempts` INT DEFAULT 3,
    `error_log` TEXT,
    `result` JSON COMMENT 'Task execution result',
    `scheduled_at` TIMESTAMP NULL COMMENT 'When to execute (null = immediate)',
    `started_at` TIMESTAMP NULL,
    `completed_at` TIMESTAMP NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`ai_employee_id`) REFERENCES `ai_employees`(`id`) ON DELETE SET NULL,
    INDEX `idx_status_priority` (`status`, `priority` DESC),
    INDEX `idx_scheduled_at` (`scheduled_at`),
    INDEX `idx_workspace_status` (`workspace_id`, `status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- AI Employee Activity Log
CREATE TABLE IF NOT EXISTS `ai_employee_activity` (
    `id` BIGINT PRIMARY KEY AUTO_INCREMENT,
    `ai_employee_id` INT NOT NULL,
    `activity_type` VARCHAR(100) NOT NULL,
    `description` TEXT,
    `metadata` JSON,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`ai_employee_id`) REFERENCES `ai_employees`(`id`) ON DELETE CASCADE,
    INDEX `idx_employee_created` (`ai_employee_id`, `created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed default AI capabilities
INSERT INTO `ai_capabilities` (`name`, `category`, `description`, `is_active`) VALUES
('Email Response', 'communication', 'Automatically respond to customer emails', TRUE),
('Lead Qualification', 'analysis', 'Qualify and score incoming leads', TRUE),
('Appointment Scheduling', 'automation', 'Schedule appointments based on availability', TRUE),
('Data Entry', 'automation', 'Extract and enter data from documents', TRUE),
('Sentiment Analysis', 'analysis', 'Analyze customer sentiment from communications', TRUE),
('Follow-up Management', 'communication', 'Send automated follow-up messages', TRUE),
('Report Generation', 'analysis', 'Generate reports from data', TRUE),
('Social Media Monitoring', 'communication', 'Monitor and respond to social media', TRUE),
('Customer Support', 'communication', 'Provide tier-1 customer support', TRUE),
('Content Creation', 'communication', 'Generate marketing content', TRUE)
ON DUPLICATE KEY UPDATE `updated_at` = CURRENT_TIMESTAMP;
