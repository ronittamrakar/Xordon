-- =====================================================
-- Growth Suite Demo Data Seed Script
-- =====================================================
-- This script populates demo data for:
-- - Social Scheduler (social_accounts, social_posts, social_templates, hashtag_groups)
-- - Listings & SEO (business_listings, seo_keywords, seo_pages, seo_competitors)
-- - Ads Manager (ad_accounts, ad_campaigns, ad_budgets, ad_conversions)
--
-- Prerequisites:
-- - All Growth Suite tables must exist (run growth suite migrations first)
-- - At least one workspace and company must exist
-- - Replace @workspace_id and @company_id with actual values
-- =====================================================

-- Set variables (REPLACE THESE WITH ACTUAL IDs)
SET @workspace_id = 1;
SET @company_id = 1;
SET @user_id = 1;

-- =====================================================
-- SOCIAL SCHEDULER DATA
-- =====================================================

-- Social Accounts
INSERT INTO social_accounts (workspace_id, company_id, platform, account_type, platform_account_id, account_name, account_username, status, can_post, can_read_insights, followers_count, created_at) VALUES
(@workspace_id, @company_id, 'facebook', 'page', 'fb_123456789', 'Demo Business Page', 'demobusiness', 'connected', 1, 1, 1250, NOW()),
(@workspace_id, @company_id, 'instagram', 'business', 'ig_987654321', 'Demo Business', '@demobusiness', 'connected', 1, 1, 3420, NOW()),
(@workspace_id, @company_id, 'linkedin', 'page', 'li_456789123', 'Demo Business LLC', 'demo-business-llc', 'connected', 1, 1, 890, NOW()),
(@workspace_id, @company_id, 'twitter', 'profile', 'tw_321654987', 'Demo Business', '@DemoBiz', 'connected', 1, 1, 2100, NOW());

-- Social Posts
INSERT INTO social_posts (workspace_id, company_id, content, media_urls, media_type, status, scheduled_at, target_accounts, created_by, created_at) VALUES
(@workspace_id, @company_id, 'Excited to announce our new product launch! 🚀 Check it out at our website. #ProductLaunch #Innovation', '[]', 'none', 'published', DATE_SUB(NOW(), INTERVAL 2 DAY), '[1,2,3]', @user_id, DATE_SUB(NOW(), INTERVAL 2 DAY)),
(@workspace_id, @company_id, 'Join us for our upcoming webinar on digital marketing strategies. Register now! Link in bio. #Webinar #Marketing', '[]', 'none', 'published', DATE_SUB(NOW(), INTERVAL 5 DAY), '[1,3]', @user_id, DATE_SUB(NOW(), INTERVAL 5 DAY)),
(@workspace_id, @company_id, 'Customer success story: How we helped @ClientName increase their ROI by 150%. Read the full case study. #CaseStudy #Success', '[]', 'none', 'scheduled', DATE_ADD(NOW(), INTERVAL 1 DAY), '[1,2,4]', @user_id, NOW()),
(@workspace_id, @company_id, 'Happy Friday! What are your weekend plans? Share in the comments below! 👇 #FridayVibes #Community', '[]', 'none', 'scheduled', DATE_ADD(NOW(), INTERVAL 3 DAY), '[2,4]', @user_id, NOW()),
(@workspace_id, @company_id, 'Behind the scenes: A day in the life at Demo Business. Stay tuned for more! #BTS #CompanyCulture', '[]', 'none', 'draft', NULL, '[1,2,3,4]', @user_id, NOW());

-- Social Templates
INSERT INTO social_templates (workspace_id, company_id, name, content, media_urls, platforms, use_count, created_by, created_at) VALUES
(@workspace_id, @company_id, 'Product Announcement', 'Introducing [Product Name]! 🎉\n\n[Brief description]\n\nLearn more: [Link]\n\n#NewProduct #Innovation', '[]', '["facebook","instagram","linkedin","twitter"]', 3, @user_id, NOW()),
(@workspace_id, @company_id, 'Blog Post Promotion', 'New blog post alert! 📝\n\n[Blog Title]\n\n[Brief excerpt]\n\nRead more: [Link]\n\n#Blog #Content', '[]', '["facebook","linkedin","twitter"]', 5, @user_id, NOW()),
(@workspace_id, @company_id, 'Event Invitation', 'Join us for [Event Name]! 🎊\n\n📅 [Date]\n⏰ [Time]\n📍 [Location]\n\nRegister: [Link]\n\n#Event #Community', '[]', '["facebook","linkedin"]', 2, @user_id, NOW());

-- Hashtag Groups
INSERT INTO hashtag_groups (workspace_id, company_id, name, hashtags, platforms, use_count) VALUES
(@workspace_id, @company_id, 'Marketing', '["#DigitalMarketing","#MarketingStrategy","#ContentMarketing","#SocialMediaMarketing","#GrowthHacking"]', '["facebook","instagram","linkedin","twitter"]', 8),
(@workspace_id, @company_id, 'Business', '["#SmallBusiness","#Entrepreneur","#BusinessGrowth","#StartupLife","#BusinessTips"]', '["facebook","linkedin","twitter"]', 5),
(@workspace_id, @company_id, 'Engagement', '["#MotivationMonday","#ThrowbackThursday","#FridayFeeling","#WeekendVibes","#Community"]', '["facebook","instagram","twitter"]', 12);

-- =====================================================
-- LISTINGS & SEO DATA
-- =====================================================

-- Business Listings
INSERT INTO business_listings (workspace_id, company_id, directory, directory_name, listing_url, status, business_name, address, phone, website, accuracy_score, last_checked_at, created_at) VALUES
(@workspace_id, @company_id, 'google', 'Google Business Profile', 'https://www.google.com/maps/place/demo-business', 'verified', 'Demo Business LLC', '123 Main Street, Suite 100, New York, NY 10001', '+1 (555) 123-4567', 'https://www.demobusiness.com', 95, NOW(), NOW()),
(@workspace_id, @company_id, 'yelp', 'Yelp', 'https://www.yelp.com/biz/demo-business-new-york', 'claimed', 'Demo Business LLC', '123 Main Street, Suite 100, New York, NY 10001', '+1 (555) 123-4567', 'https://www.demobusiness.com', 88, NOW(), NOW()),
(@workspace_id, @company_id, 'facebook', 'Facebook', 'https://www.facebook.com/demobusiness', 'verified', 'Demo Business', '123 Main Street, New York, NY', '+1 (555) 123-4567', 'https://www.demobusiness.com', 92, NOW(), NOW()),
(@workspace_id, @company_id, 'bing', 'Bing Places', NULL, 'needs_update', 'Demo Business LLC', '123 Main St, New York, NY 10001', '555-123-4567', 'demobusiness.com', 65, NOW(), NOW()),
(@workspace_id, @company_id, 'apple', 'Apple Maps', NULL, 'pending', 'Demo Business', NULL, NULL, NULL, NULL, NOW(), NOW()),
(@workspace_id, @company_id, 'yellowpages', 'Yellow Pages', NULL, 'not_listed', NULL, NULL, NULL, NULL, NULL, NOW(), NOW());

-- SEO Keywords
INSERT INTO seo_keywords (workspace_id, company_id, keyword, current_position, previous_position, best_position, target_url, is_tracked, location, last_checked_at, created_at) VALUES
(@workspace_id, @company_id, 'digital marketing agency nyc', 8, 12, 5, 'https://www.demobusiness.com', 1, 'New York, NY', NOW(), NOW()),
(@workspace_id, @company_id, 'social media management services', 15, 18, 12, 'https://www.demobusiness.com/services/social-media', 1, 'New York, NY', NOW(), NOW()),
(@workspace_id, @company_id, 'seo optimization company', 22, 25, 18, 'https://www.demobusiness.com/services/seo', 1, 'New York, NY', NOW(), NOW()),
(@workspace_id, @company_id, 'content marketing strategy', 6, 6, 4, 'https://www.demobusiness.com/blog/content-marketing', 1, 'United States', NOW(), NOW()),
(@workspace_id, @company_id, 'best marketing agency new york', 35, 42, 28, 'https://www.demobusiness.com', 1, 'New York, NY', NOW(), NOW());

-- SEO Pages
INSERT INTO seo_pages (workspace_id, company_id, url, title, meta_description, seo_score, page_speed_score, mobile_score, issues, word_count, h1_count, image_count, images_without_alt, internal_links, external_links, last_crawled_at, created_at) VALUES
(@workspace_id, @company_id, 'https://www.demobusiness.com', 'Demo Business - Digital Marketing Agency in NYC', 'Leading digital marketing agency in New York. We help businesses grow through SEO, social media, and content marketing.', 85, 92, 88, '[]', 1250, 1, 8, 1, 25, 5, NOW(), NOW()),
(@workspace_id, @company_id, 'https://www.demobusiness.com/services', 'Our Services - Demo Business', 'Explore our comprehensive digital marketing services including SEO, social media management, and content creation.', 78, 88, 85, '[{"type":"warning","message":"Meta description could be longer"}]', 980, 1, 6, 0, 18, 3, NOW(), NOW()),
(@workspace_id, @company_id, 'https://www.demobusiness.com/blog', 'Marketing Blog - Demo Business', 'Expert insights on digital marketing, SEO, and social media strategies.', 72, 85, 82, '[{"type":"warning","message":"Low word count"},{"type":"info","message":"Consider adding more internal links"}]', 450, 1, 3, 0, 8, 2, NOW(), NOW());

-- SEO Competitors
INSERT INTO seo_competitors (workspace_id, company_id, name, domain, domain_authority, organic_traffic, keywords_count, backlinks_count, is_active, last_checked_at, created_at) VALUES
(@workspace_id, @company_id, 'Competitor Marketing Co', 'competitormarketing.com', 65, 125000, 3500, 8200, 1, NOW(), NOW()),
(@workspace_id, @company_id, 'Digital Solutions Inc', 'digitalsolutionsinc.com', 58, 98000, 2800, 6500, 1, NOW(), NOW()),
(@workspace_id, @company_id, 'Growth Agency NYC', 'growthagencynyc.com', 52, 75000, 2200, 4800, 1, NOW(), NOW());

-- =====================================================
-- ADS MANAGER DATA
-- =====================================================

-- Ad Accounts
INSERT INTO ad_accounts (workspace_id, company_id, platform, platform_account_id, account_name, currency, timezone, status, sync_campaigns, sync_conversions, last_sync_at, created_at) VALUES
(@workspace_id, @company_id, 'google_ads', 'gads_123456789', 'Demo Business - Google Ads', 'USD', 'America/New_York', 'connected', 1, 1, NOW(), NOW()),
(@workspace_id, @company_id, 'facebook_ads', 'fb_ads_987654321', 'Demo Business - Facebook Ads', 'USD', 'America/New_York', 'connected', 1, 1, NOW(), NOW());

-- Ad Campaigns
INSERT INTO ad_campaigns (workspace_id, company_id, ad_account_id, platform_campaign_id, name, status, campaign_type, daily_budget, start_date, last_sync_at, created_at) VALUES
(@workspace_id, @company_id, 1, 'gads_camp_001', 'Brand Awareness - Search', 'enabled', 'Search', 150.00, DATE_SUB(NOW(), INTERVAL 30 DAY), NOW(), DATE_SUB(NOW(), INTERVAL 30 DAY)),
(@workspace_id, @company_id, 1, 'gads_camp_002', 'Lead Generation - Display', 'enabled', 'Display', 100.00, DATE_SUB(NOW(), INTERVAL 20 DAY), NOW(), DATE_SUB(NOW(), INTERVAL 20 DAY)),
(@workspace_id, @company_id, 2, 'fb_camp_001', 'Product Launch - Conversions', 'enabled', 'Conversions', 200.00, DATE_SUB(NOW(), INTERVAL 15 DAY), NOW(), DATE_SUB(NOW(), INTERVAL 15 DAY)),
(@workspace_id, @company_id, 2, 'fb_camp_002', 'Retargeting Campaign', 'paused', 'Retargeting', 75.00, DATE_SUB(NOW(), INTERVAL 10 DAY), NOW(), DATE_SUB(NOW(), INTERVAL 10 DAY));

-- Ad Campaign Metrics (last 7 days)
INSERT INTO ad_campaign_metrics (campaign_id, metric_date, spend, impressions, clicks, conversions, conversion_value, reach) VALUES
(1, DATE_SUB(CURDATE(), INTERVAL 6 DAY), 145.50, 12500, 320, 8, 1200.00, 9800),
(1, DATE_SUB(CURDATE(), INTERVAL 5 DAY), 148.20, 13200, 335, 10, 1500.00, 10200),
(1, DATE_SUB(CURDATE(), INTERVAL 4 DAY), 142.80, 11800, 298, 7, 1050.00, 9200),
(1, DATE_SUB(CURDATE(), INTERVAL 3 DAY), 150.00, 13500, 342, 11, 1650.00, 10500),
(2, DATE_SUB(CURDATE(), INTERVAL 6 DAY), 98.50, 45000, 450, 15, 2250.00, 38000),
(2, DATE_SUB(CURDATE(), INTERVAL 5 DAY), 102.30, 48000, 480, 18, 2700.00, 40000),
(3, DATE_SUB(CURDATE(), INTERVAL 6 DAY), 195.00, 28000, 560, 22, 3300.00, 24000),
(3, DATE_SUB(CURDATE(), INTERVAL 5 DAY), 198.50, 29500, 590, 25, 3750.00, 25500);

-- Ad Budgets
INSERT INTO ad_budgets (workspace_id, company_id, period_type, period_start, period_end, total_budget, google_ads_budget, facebook_ads_budget, spent, alert_threshold, created_at) VALUES
(@workspace_id, @company_id, 'monthly', DATE_FORMAT(NOW(), '%Y-%m-01'), LAST_DAY(NOW()), 15000.00, 8000.00, 7000.00, 8450.75, 80, NOW()),
(@workspace_id, @company_id, 'quarterly', DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 1 MONTH), '%Y-%m-01'), LAST_DAY(DATE_ADD(NOW(), INTERVAL 1 MONTH)), 40000.00, 22000.00, 18000.00, 12350.25, 75, DATE_SUB(NOW(), INTERVAL 1 MONTH));

-- Ad Conversions
INSERT INTO ad_conversions (workspace_id, company_id, ad_account_id, campaign_id, conversion_name, conversion_type, conversion_value, currency, source, medium, campaign, converted_at) VALUES
(@workspace_id, @company_id, 1, 1, 'Form Submission', 'lead', 150.00, 'USD', 'google', 'cpc', 'brand-awareness-search', DATE_SUB(NOW(), INTERVAL 2 HOUR)),
(@workspace_id, @company_id, 1, 2, 'Demo Request', 'lead', 200.00, 'USD', 'google', 'display', 'lead-gen-display', DATE_SUB(NOW(), INTERVAL 5 HOUR)),
(@workspace_id, @company_id, 2, 3, 'Purchase', 'purchase', 450.00, 'USD', 'facebook', 'cpc', 'product-launch', DATE_SUB(NOW(), INTERVAL 1 DAY)),
(@workspace_id, @company_id, 2, 3, 'Add to Cart', 'add_to_cart', 0.00, 'USD', 'facebook', 'cpc', 'product-launch', DATE_SUB(NOW(), INTERVAL 1 DAY)),
(@workspace_id, @company_id, 1, 1, 'Newsletter Signup', 'lead', 50.00, 'USD', 'google', 'cpc', 'brand-awareness-search', DATE_SUB(NOW(), INTERVAL 3 DAY));

-- =====================================================
-- COMPLETION MESSAGE
-- =====================================================
SELECT 'Growth Suite demo data seeded successfully!' AS message;
SELECT CONCAT('Workspace ID: ', @workspace_id, ', Company ID: ', @company_id) AS context;
SELECT 
    'Social Accounts: 4, Social Posts: 5, Templates: 3, Hashtag Groups: 3' AS social_data,
    'Listings: 6, Keywords: 5, Pages: 3, Competitors: 3' AS seo_data,
    'Ad Accounts: 2, Campaigns: 4, Budgets: 2, Conversions: 5' AS ads_data;
