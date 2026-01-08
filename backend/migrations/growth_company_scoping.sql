-- Growth Suite: Add company_id scoping
-- Growth modules (Social, Listings, Ads) are company-scoped
-- This migration adds company_id to all Growth tables

-- ==================== SOCIAL MEDIA TABLES ====================

-- Add company_id to social_accounts
ALTER TABLE social_accounts 
ADD COLUMN company_id INT NULL AFTER workspace_id,
ADD INDEX idx_social_accounts_company (workspace_id, company_id, status);

-- Add company_id to social_posts
ALTER TABLE social_posts 
ADD COLUMN company_id INT NULL AFTER workspace_id,
ADD INDEX idx_social_posts_company (workspace_id, company_id, status, scheduled_at);

-- Add company_id to social_categories
ALTER TABLE social_categories 
ADD COLUMN company_id INT NULL AFTER workspace_id,
ADD INDEX idx_social_categories_company (workspace_id, company_id, is_active);

-- Add company_id to social_templates
ALTER TABLE social_templates 
ADD COLUMN company_id INT NULL AFTER workspace_id,
ADD INDEX idx_social_templates_company (workspace_id, company_id);

-- Add company_id to hashtag_groups
ALTER TABLE hashtag_groups 
ADD COLUMN company_id INT NULL AFTER workspace_id,
ADD INDEX idx_hashtag_groups_company (workspace_id, company_id);

-- ==================== LISTINGS & SEO TABLES ====================

-- Add company_id to business_listings
ALTER TABLE business_listings 
ADD COLUMN company_id INT NULL AFTER workspace_id,
ADD INDEX idx_business_listings_company (workspace_id, company_id, status);

-- Add company_id to seo_keywords
ALTER TABLE seo_keywords 
ADD COLUMN company_id INT NULL AFTER workspace_id,
ADD INDEX idx_seo_keywords_company (workspace_id, company_id, is_tracked);

-- Add company_id to seo_pages
ALTER TABLE seo_pages 
ADD COLUMN company_id INT NULL AFTER workspace_id,
ADD INDEX idx_seo_pages_company (workspace_id, company_id);

-- Add company_id to seo_competitors
ALTER TABLE seo_competitors 
ADD COLUMN company_id INT NULL AFTER workspace_id,
ADD INDEX idx_seo_competitors_company (workspace_id, company_id, is_active);

-- ==================== ADS TABLES ====================

-- Add company_id to ad_accounts
ALTER TABLE ad_accounts 
ADD COLUMN company_id INT NULL AFTER workspace_id,
ADD INDEX idx_ad_accounts_company (workspace_id, company_id, status);

-- Add company_id to ad_campaigns
ALTER TABLE ad_campaigns 
ADD COLUMN company_id INT NULL AFTER workspace_id,
ADD INDEX idx_ad_campaigns_company (workspace_id, company_id, status);

-- Add company_id to ad_conversions
ALTER TABLE ad_conversions 
ADD COLUMN company_id INT NULL AFTER workspace_id,
ADD INDEX idx_ad_conversions_company (workspace_id, company_id);

-- Add company_id to ad_budgets
ALTER TABLE ad_budgets 
ADD COLUMN company_id INT NULL AFTER workspace_id,
ADD INDEX idx_ad_budgets_company (workspace_id, company_id);

-- Add company_id to ad_tracking_numbers (if exists)
ALTER TABLE ad_tracking_numbers 
ADD COLUMN company_id INT NULL AFTER workspace_id,
ADD INDEX idx_ad_tracking_numbers_company (workspace_id, company_id);

-- ==================== BACKFILL STRATEGY ====================
-- After running this migration, run the backfill script to set company_id
-- for existing rows. The script will:
-- 1. For each workspace, find the "primary" company (first company or most used)
-- 2. Set company_id to that primary company for all Growth rows in that workspace
-- 3. Log any rows that couldn't be backfilled

-- Example backfill (run separately after migration):
-- UPDATE social_accounts sa
-- JOIN (
--     SELECT workspace_id, MIN(id) as primary_company_id 
--     FROM companies 
--     GROUP BY workspace_id
-- ) pc ON sa.workspace_id = pc.workspace_id
-- SET sa.company_id = pc.primary_company_id
-- WHERE sa.company_id IS NULL;
