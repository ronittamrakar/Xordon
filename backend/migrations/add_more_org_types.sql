-- Migration: Add more organization_type options
ALTER TABLE agencies 
MODIFY COLUMN organization_type ENUM('marketing_agency', 'franchise', 'retail', 'healthcare', 'single_business', 'other') 
NOT NULL DEFAULT 'marketing_agency';
