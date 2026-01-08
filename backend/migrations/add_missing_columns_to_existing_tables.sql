-- =====================================================
-- ADD MISSING COLUMNS TO EXISTING TABLES
-- =====================================================
-- This migration adds missing columns to existing tables
-- to support complete feature functionality

-- =====================================================
-- CONTACTS TABLE ENHANCEMENTS
-- =====================================================
ALTER TABLE `contacts` 
ADD COLUMN IF NOT EXISTS `loyalty_points` INT DEFAULT 0 AFTER `tags`,
ADD COLUMN IF NOT EXISTS `loyalty_tier` VARCHAR(50) AFTER `loyalty_points`,
ADD COLUMN IF NOT EXISTS `customer_lifetime_value` DECIMAL(10,2) AFTER `loyalty_tier`,
ADD COLUMN IF NOT EXISTS `last_purchase_date` DATE AFTER `customer_lifetime_value`,
ADD COLUMN IF NOT EXISTS `preferred_contact_method` ENUM('email', 'sms', 'phone', 'whatsapp') DEFAULT 'email' AFTER `last_purchase_date`,
ADD COLUMN IF NOT EXISTS `lead_source_detail` VARCHAR(255) AFTER `preferred_contact_method`,
ADD COLUMN IF NOT EXISTS `referral_source_id` INT AFTER `lead_source_detail`,
ADD COLUMN IF NOT EXISTS `social_profiles` JSON AFTER `referral_source_id`;

-- =====================================================
-- EMPLOYEES TABLE ENHANCEMENTS
-- =====================================================
ALTER TABLE `employees`
ADD COLUMN IF NOT EXISTS `emergency_contact_name` VARCHAR(255) AFTER `phone`,
ADD COLUMN IF NOT EXISTS `emergency_contact_phone` VARCHAR(50) AFTER `emergency_contact_name`,
ADD COLUMN IF NOT EXISTS `emergency_contact_relationship` VARCHAR(100) AFTER `emergency_contact_phone`,
ADD COLUMN IF NOT EXISTS `date_of_birth` DATE AFTER `emergency_contact_relationship`,
ADD COLUMN IF NOT EXISTS `hire_date` DATE AFTER `date_of_birth`,
ADD COLUMN IF NOT EXISTS `termination_date` DATE AFTER `hire_date`,
ADD COLUMN IF NOT EXISTS `employee_number` VARCHAR(50) UNIQUE AFTER `termination_date`,
ADD COLUMN IF NOT EXISTS `ssn_last_4` VARCHAR(4) AFTER `employee_number`,
ADD COLUMN IF NOT EXISTS `work_location` VARCHAR(255) AFTER `ssn_last_4`,
ADD COLUMN IF NOT EXISTS `employment_type` ENUM('full_time', 'part_time', 'contract', 'intern') DEFAULT 'full_time' AFTER `work_location`,
ADD COLUMN IF NOT EXISTS `manager_id` INT AFTER `employment_type`,
ADD COLUMN IF NOT EXISTS `onboarding_completed` BOOLEAN DEFAULT FALSE AFTER `manager_id`,
ADD COLUMN IF NOT EXISTS `onboarding_completed_at` TIMESTAMP NULL AFTER `onboarding_completed`;

-- =====================================================
-- INVOICES TABLE ENHANCEMENTS
-- =====================================================
ALTER TABLE `invoices`
ADD COLUMN IF NOT EXISTS `recurring_schedule` VARCHAR(50) AFTER `status`,
ADD COLUMN IF NOT EXISTS `next_invoice_date` DATE AFTER `recurring_schedule`,
ADD COLUMN IF NOT EXISTS `auto_send` BOOLEAN DEFAULT FALSE AFTER `next_invoice_date`,
ADD COLUMN IF NOT EXISTS `late_fee_percentage` DECIMAL(5,2) AFTER `auto_send`,
ADD COLUMN IF NOT EXISTS `late_fee_amount` DECIMAL(10,2) AFTER `late_fee_percentage`,
ADD COLUMN IF NOT EXISTS `late_fee_applied_at` TIMESTAMP NULL AFTER `late_fee_amount`,
ADD COLUMN IF NOT EXISTS `payment_terms_days` INT DEFAULT 30 AFTER `late_fee_applied_at`,
ADD COLUMN IF NOT EXISTS `partial_payments_allowed` BOOLEAN DEFAULT TRUE AFTER `payment_terms_days`,
ADD COLUMN IF NOT EXISTS `amount_paid` DECIMAL(10,2) DEFAULT 0.00 AFTER `partial_payments_allowed`,
ADD COLUMN IF NOT EXISTS `balance_due` DECIMAL(10,2) AFTER `amount_paid`;

-- =====================================================
-- APPOINTMENTS TABLE ENHANCEMENTS
-- =====================================================
ALTER TABLE `appointments`
ADD COLUMN IF NOT EXISTS `buffer_before_minutes` INT DEFAULT 0 AFTER `duration_minutes`,
ADD COLUMN IF NOT EXISTS `buffer_after_minutes` INT DEFAULT 0 AFTER `buffer_before_minutes`,
ADD COLUMN IF NOT EXISTS `requires_deposit` BOOLEAN DEFAULT FALSE AFTER `buffer_after_minutes`,
ADD COLUMN IF NOT EXISTS `deposit_percentage` DECIMAL(5,2) AFTER `requires_deposit`,
ADD COLUMN IF NOT EXISTS `deposit_amount_paid` DECIMAL(10,2) AFTER `deposit_percentage`,
ADD COLUMN IF NOT EXISTS `cancellation_policy` TEXT AFTER `deposit_amount_paid`,
ADD COLUMN IF NOT EXISTS `cancellation_fee` DECIMAL(10,2) AFTER `cancellation_policy`,
ADD COLUMN IF NOT EXISTS `allow_reschedule` BOOLEAN DEFAULT TRUE AFTER `cancellation_fee`,
ADD COLUMN IF NOT EXISTS `max_reschedules` INT DEFAULT 2 AFTER `allow_reschedule`,
ADD COLUMN IF NOT EXISTS `reschedule_count` INT DEFAULT 0 AFTER `max_reschedules`;

-- =====================================================
-- FORMS TABLE ENHANCEMENTS
-- =====================================================
ALTER TABLE `forms`
ADD COLUMN IF NOT EXISTS `conversion_rate` DECIMAL(5,2) AFTER `status`,
ADD COLUMN IF NOT EXISTS `total_views` INT DEFAULT 0 AFTER `conversion_rate`,
ADD COLUMN IF NOT EXISTS `unique_views` INT DEFAULT 0 AFTER `total_views`,
ADD COLUMN IF NOT EXISTS `avg_completion_time_seconds` INT AFTER `unique_views`,
ADD COLUMN IF NOT EXISTS `abandonment_rate` DECIMAL(5,2) AFTER `avg_completion_time_seconds`,
ADD COLUMN IF NOT EXISTS `last_submission_at` TIMESTAMP NULL AFTER `abandonment_rate`,
ADD COLUMN IF NOT EXISTS `enable_captcha` BOOLEAN DEFAULT FALSE AFTER `last_submission_at`,
ADD COLUMN IF NOT EXISTS `enable_file_uploads` BOOLEAN DEFAULT FALSE AFTER `enable_captcha`,
ADD COLUMN IF NOT EXISTS `max_file_size_mb` INT DEFAULT 10 AFTER `enable_file_uploads`;

-- =====================================================
-- CAMPAIGNS TABLE ENHANCEMENTS (Email)
-- =====================================================
ALTER TABLE `campaigns`
ADD COLUMN IF NOT EXISTS `ab_test_variant` VARCHAR(10) AFTER `status`,
ADD COLUMN IF NOT EXISTS `parent_campaign_id` INT AFTER `ab_test_variant`,
ADD COLUMN IF NOT EXISTS `winning_variant` VARCHAR(10) AFTER `parent_campaign_id`,
ADD COLUMN IF NOT EXISTS `test_concluded_at` TIMESTAMP NULL AFTER `winning_variant`,
ADD COLUMN IF NOT EXISTS `send_time_optimization` BOOLEAN DEFAULT FALSE AFTER `test_concluded_at`,
ADD COLUMN IF NOT EXISTS `resend_to_unopened` BOOLEAN DEFAULT FALSE AFTER `send_time_optimization`,
ADD COLUMN IF NOT EXISTS `resend_delay_hours` INT DEFAULT 48 AFTER `resend_to_unopened`;

-- =====================================================
-- SMS_CAMPAIGNS TABLE ENHANCEMENTS
-- =====================================================
ALTER TABLE `sms_campaigns`
ADD COLUMN IF NOT EXISTS `character_count` INT AFTER `message`,
ADD COLUMN IF NOT EXISTS `segment_count` INT AFTER `character_count`,
ADD COLUMN IF NOT EXISTS `cost_per_message` DECIMAL(6,4) AFTER `segment_count`,
ADD COLUMN IF NOT EXISTS `total_cost` DECIMAL(10,2) AFTER `cost_per_message`,
ADD COLUMN IF NOT EXISTS `link_tracking_enabled` BOOLEAN DEFAULT FALSE AFTER `total_cost`,
ADD COLUMN IF NOT EXISTS `shortened_links` JSON AFTER `link_tracking_enabled`;

-- =====================================================
-- PROPOSALS TABLE ENHANCEMENTS
-- =====================================================
ALTER TABLE `proposals`
ADD COLUMN IF NOT EXISTS `expiration_date` DATE AFTER `status`,
ADD COLUMN IF NOT EXISTS `is_expired` BOOLEAN DEFAULT FALSE AFTER `expiration_date`,
ADD COLUMN IF NOT EXISTS `acceptance_deadline` DATE AFTER `is_expired`,
ADD COLUMN IF NOT EXISTS `requires_signature` BOOLEAN DEFAULT TRUE AFTER `acceptance_deadline`,
ADD COLUMN IF NOT EXISTS `signature_document_id` INT AFTER `requires_signature`,
ADD COLUMN IF NOT EXISTS `payment_schedule` JSON AFTER `signature_document_id`,
ADD COLUMN IF NOT EXISTS `terms_and_conditions` TEXT AFTER `payment_schedule`;

-- =====================================================
-- DEALS TABLE ENHANCEMENTS (CRM)
-- =====================================================
ALTER TABLE `deals`
ADD COLUMN IF NOT EXISTS `probability` INT DEFAULT 50 AFTER `value`,
ADD COLUMN IF NOT EXISTS `weighted_value` DECIMAL(10,2) AFTER `probability`,
ADD COLUMN IF NOT EXISTS `close_date` DATE AFTER `weighted_value`,
ADD COLUMN IF NOT EXISTS `lost_reason` VARCHAR(255) AFTER `close_date`,
ADD COLUMN IF NOT EXISTS `competitor` VARCHAR(255) AFTER `lost_reason`,
ADD COLUMN IF NOT EXISTS `deal_source` VARCHAR(100) AFTER `competitor`,
ADD COLUMN IF NOT EXISTS `last_activity_date` DATE AFTER `deal_source`,
ADD COLUMN IF NOT EXISTS `days_in_stage` INT DEFAULT 0 AFTER `last_activity_date`;

-- =====================================================
-- PROJECTS TABLE ENHANCEMENTS
-- =====================================================
ALTER TABLE `projects`
ADD COLUMN IF NOT EXISTS `project_code` VARCHAR(50) UNIQUE AFTER `name`,
ADD COLUMN IF NOT EXISTS `budget` DECIMAL(10,2) AFTER `project_code`,
ADD COLUMN IF NOT EXISTS `actual_cost` DECIMAL(10,2) DEFAULT 0.00 AFTER `budget`,
ADD COLUMN IF NOT EXISTS `estimated_hours` INT AFTER `actual_cost`,
ADD COLUMN IF NOT EXISTS `actual_hours` INT DEFAULT 0 AFTER `estimated_hours`,
ADD COLUMN IF NOT EXISTS `health_status` ENUM('on_track', 'at_risk', 'off_track') DEFAULT 'on_track' AFTER `actual_hours`,
ADD COLUMN IF NOT EXISTS `client_id` INT AFTER `health_status`,
ADD COLUMN IF NOT EXISTS `project_manager_id` INT AFTER `client_id`;

-- =====================================================
-- TICKETS TABLE ENHANCEMENTS (Helpdesk)
-- =====================================================
ALTER TABLE `tickets`
ADD COLUMN IF NOT EXISTS `sla_due_at` TIMESTAMP NULL AFTER `priority`,
ADD COLUMN IF NOT EXISTS `sla_breached` BOOLEAN DEFAULT FALSE AFTER `sla_due_at`,
ADD COLUMN IF NOT EXISTS `first_response_at` TIMESTAMP NULL AFTER `sla_breached`,
ADD COLUMN IF NOT EXISTS `first_response_time_minutes` INT AFTER `first_response_at`,
ADD COLUMN IF NOT EXISTS `resolution_time_minutes` INT AFTER `first_response_time_minutes`,
ADD COLUMN IF NOT EXISTS `satisfaction_rating` INT AFTER `resolution_time_minutes`,
ADD COLUMN IF NOT EXISTS `satisfaction_comment` TEXT AFTER `satisfaction_rating`,
ADD COLUMN IF NOT EXISTS `channel` ENUM('email', 'chat', 'phone', 'portal', 'social') DEFAULT 'email' AFTER `satisfaction_comment`;

-- =====================================================
-- REVIEWS TABLE ENHANCEMENTS (Reputation)
-- =====================================================
ALTER TABLE `reviews`
ADD COLUMN IF NOT EXISTS `sentiment` ENUM('positive', 'neutral', 'negative') AFTER `rating`,
ADD COLUMN IF NOT EXISTS `sentiment_score` DECIMAL(3,2) AFTER `sentiment`,
ADD COLUMN IF NOT EXISTS `is_verified` BOOLEAN DEFAULT FALSE AFTER `sentiment_score`,
ADD COLUMN IF NOT EXISTS `verified_at` TIMESTAMP NULL AFTER `is_verified`,
ADD COLUMN IF NOT EXISTS `helpful_count` INT DEFAULT 0 AFTER `verified_at`,
ADD COLUMN IF NOT EXISTS `not_helpful_count` INT DEFAULT 0 AFTER `helpful_count`,
ADD COLUMN IF NOT EXISTS `flagged_as_inappropriate` BOOLEAN DEFAULT FALSE AFTER `not_helpful_count`;

-- =====================================================
-- BUSINESS_LISTINGS TABLE ENHANCEMENTS
-- =====================================================
ALTER TABLE `business_listings`
ADD COLUMN IF NOT EXISTS `verification_status` ENUM('unverified', 'pending', 'verified', 'suspended') DEFAULT 'unverified' AFTER `status`,
ADD COLUMN IF NOT EXISTS `verification_code` VARCHAR(100) AFTER `verification_status`,
ADD COLUMN IF NOT EXISTS `verified_at` TIMESTAMP NULL AFTER `verification_code`,
ADD COLUMN IF NOT EXISTS `last_synced_at` TIMESTAMP NULL AFTER `verified_at`,
ADD COLUMN IF NOT EXISTS `sync_errors` JSON AFTER `last_synced_at`,
ADD COLUMN IF NOT EXISTS `listing_score` INT AFTER `sync_errors`,
ADD COLUMN IF NOT EXISTS `completeness_percentage` DECIMAL(5,2) AFTER `listing_score`;

-- =====================================================
-- WEBSITES TABLE ENHANCEMENTS
-- =====================================================
ALTER TABLE `websites`
ADD COLUMN IF NOT EXISTS `ssl_enabled` BOOLEAN DEFAULT FALSE AFTER `domain`,
ADD COLUMN IF NOT EXISTS `ssl_expires_at` DATE AFTER `ssl_enabled`,
ADD COLUMN IF NOT EXISTS `analytics_enabled` BOOLEAN DEFAULT TRUE AFTER `ssl_expires_at`,
ADD COLUMN IF NOT EXISTS `google_analytics_id` VARCHAR(50) AFTER `analytics_enabled`,
ADD COLUMN IF NOT EXISTS `facebook_pixel_id` VARCHAR(50) AFTER `google_analytics_id`,
ADD COLUMN IF NOT EXISTS `seo_score` INT AFTER `facebook_pixel_id`,
ADD COLUMN IF NOT EXISTS `performance_score` INT AFTER `seo_score`,
ADD COLUMN IF NOT EXISTS `last_crawled_at` TIMESTAMP NULL AFTER `performance_score`;

-- =====================================================
-- MARKETPLACE_LEADS TABLE ENHANCEMENTS
-- =====================================================
ALTER TABLE `marketplace_leads`
ADD COLUMN IF NOT EXISTS `lead_quality_score` INT AFTER `status`,
ADD COLUMN IF NOT EXISTS `verification_status` ENUM('unverified', 'verified', 'disputed') DEFAULT 'unverified' AFTER `lead_quality_score`,
ADD COLUMN IF NOT EXISTS `exclusive` BOOLEAN DEFAULT FALSE AFTER `verification_status`,
ADD COLUMN IF NOT EXISTS `max_buyers` INT DEFAULT 1 AFTER `exclusive`,
ADD COLUMN IF NOT EXISTS `current_buyers` INT DEFAULT 0 AFTER `max_buyers`,
ADD COLUMN IF NOT EXISTS `contact_attempts` INT DEFAULT 0 AFTER `current_buyers`,
ADD COLUMN IF NOT EXISTS `last_contact_attempt_at` TIMESTAMP NULL AFTER `contact_attempts`;

-- =====================================================
-- AUTOMATIONS TABLE ENHANCEMENTS
-- =====================================================
ALTER TABLE `automations`
ADD COLUMN IF NOT EXISTS `execution_count` INT DEFAULT 0 AFTER `status`,
ADD COLUMN IF NOT EXISTS `success_count` INT DEFAULT 0 AFTER `execution_count`,
ADD COLUMN IF NOT EXISTS `failure_count` INT DEFAULT 0 AFTER `success_count`,
ADD COLUMN IF NOT EXISTS `last_executed_at` TIMESTAMP NULL AFTER `failure_count`,
ADD COLUMN IF NOT EXISTS `avg_execution_time_seconds` INT AFTER `last_executed_at`,
ADD COLUMN IF NOT EXISTS `error_rate` DECIMAL(5,2) AFTER `avg_execution_time_seconds`;

-- =====================================================
-- USERS TABLE ENHANCEMENTS
-- =====================================================
ALTER TABLE `users`
ADD COLUMN IF NOT EXISTS `timezone` VARCHAR(100) DEFAULT 'UTC' AFTER `email`,
ADD COLUMN IF NOT EXISTS `language` VARCHAR(10) DEFAULT 'en' AFTER `timezone`,
ADD COLUMN IF NOT EXISTS `avatar_url` VARCHAR(500) AFTER `language`,
ADD COLUMN IF NOT EXISTS `phone_verified` BOOLEAN DEFAULT FALSE AFTER `email_verified`,
ADD COLUMN IF NOT EXISTS `two_factor_enabled` BOOLEAN DEFAULT FALSE AFTER `phone_verified`,
ADD COLUMN IF NOT EXISTS `two_factor_secret` VARCHAR(255) AFTER `two_factor_enabled`,
ADD COLUMN IF NOT EXISTS `last_login_at` TIMESTAMP NULL AFTER `two_factor_secret`,
ADD COLUMN IF NOT EXISTS `last_login_ip` VARCHAR(45) AFTER `last_login_at`;

-- =====================================================
-- WORKSPACES TABLE ENHANCEMENTS
-- =====================================================
ALTER TABLE `workspaces`
ADD COLUMN IF NOT EXISTS `industry` VARCHAR(100) AFTER `name`,
ADD COLUMN IF NOT EXISTS `company_size` ENUM('1-10', '11-50', '51-200', '201-500', '500+') AFTER `industry`,
ADD COLUMN IF NOT EXISTS `timezone` VARCHAR(100) DEFAULT 'UTC' AFTER `company_size`,
ADD COLUMN IF NOT EXISTS `currency` VARCHAR(10) DEFAULT 'USD' AFTER `timezone`,
ADD COLUMN IF NOT EXISTS `date_format` VARCHAR(20) DEFAULT 'MM/DD/YYYY' AFTER `currency`,
ADD COLUMN IF NOT EXISTS `time_format` VARCHAR(20) DEFAULT '12h' AFTER `date_format`,
ADD COLUMN IF NOT EXISTS `logo_url` VARCHAR(500) AFTER `time_format`,
ADD COLUMN IF NOT EXISTS `primary_color` VARCHAR(7) AFTER `logo_url`,
ADD COLUMN IF NOT EXISTS `onboarding_completed` BOOLEAN DEFAULT FALSE AFTER `primary_color`;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS `idx_contacts_loyalty_tier` ON `contacts`(`loyalty_tier`);
CREATE INDEX IF NOT EXISTS `idx_contacts_last_purchase` ON `contacts`(`last_purchase_date`);
CREATE INDEX IF NOT EXISTS `idx_employees_hire_date` ON `employees`(`hire_date`);
CREATE INDEX IF NOT EXISTS `idx_invoices_next_invoice` ON `invoices`(`next_invoice_date`);
CREATE INDEX IF NOT EXISTS `idx_deals_close_date` ON `deals`(`close_date`);
CREATE INDEX IF NOT EXISTS `idx_tickets_sla_due` ON `tickets`(`sla_due_at`);
