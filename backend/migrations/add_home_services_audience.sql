-- Add 'home_services' to target_audience enum in automation_recipes table
-- This migration extends the enum to support home services vertical recipes

ALTER TABLE automation_recipes 
MODIFY COLUMN target_audience ENUM('local_business', 'home_services', 'agency', 'ecommerce', 'saas', 'general') DEFAULT 'general';
