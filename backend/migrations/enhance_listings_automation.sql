-- Migration: Enhance listing_settings and directories for automation
-- Adds more fields for comprehensive citations and automation config

-- 1. Enhance listing_settings
ALTER TABLE listing_settings
ADD COLUMN short_description VARCHAR(255) NULL AFTER description,
ADD COLUMN keywords JSON NULL AFTER categories,
ADD COLUMN year_established INT NULL AFTER keywords,
ADD COLUMN payment_methods JSON NULL AFTER year_established,
ADD COLUMN languages JSON NULL AFTER payment_methods,
ADD COLUMN services JSON NULL AFTER languages,
ADD COLUMN brands JSON NULL AFTER services,
ADD COLUMN logo_url VARCHAR(500) NULL AFTER brands,
ADD COLUMN cover_photo_url VARCHAR(500) NULL AFTER logo_url,
ADD COLUMN gallery_images JSON NULL AFTER cover_photo_url,
ADD COLUMN youtube_url VARCHAR(500) NULL AFTER linkedin_url,
ADD COLUMN tiktok_url VARCHAR(500) NULL AFTER youtube_url,
ADD COLUMN pinterest_url VARCHAR(500) NULL AFTER tiktok_url,
ADD COLUMN yelp_url VARCHAR(500) NULL AFTER pinterest_url,
ADD COLUMN google_maps_url VARCHAR(500) NULL AFTER yelp_url;

-- 2. Enhance directories
ALTER TABLE directories
ADD COLUMN submission_method ENUM('manual', 'api', 'worker') DEFAULT 'manual' AFTER is_active,
ADD COLUMN automation_config JSON NULL AFTER submission_method,
ADD COLUMN submission_url VARCHAR(500) NULL AFTER automation_config;

-- 3. Enhance business_listings for automation tracking
ALTER TABLE business_listings
ADD COLUMN submission_status ENUM('not_started', 'in_progress', 'submitted', 'failed', 'verified') DEFAULT 'not_started' AFTER status,
ADD COLUMN submission_log JSON NULL AFTER submission_status,
ADD COLUMN last_submission_attempt TIMESTAMP NULL AFTER submission_log,
ADD COLUMN external_id VARCHAR(255) NULL AFTER last_submission_attempt,
ADD COLUMN external_listing_id VARCHAR(255) NULL AFTER external_id;
