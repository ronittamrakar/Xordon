-- Fix unique constraint on business_listings to allow multiple custom/unknown listings
-- and scope it to company_id instead of workspace_id

ALTER TABLE business_listings DROP INDEX uk_workspace_directory;

-- Add a more flexible unique index or just a regular index if we want to allow duplicates
-- For now, let's use a regular index to prevent bulk add failures
ALTER TABLE business_listings ADD INDEX idx_company_directory (company_id, directory);
