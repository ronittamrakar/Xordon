-- Migration: Add organization_type to agencies table
-- This allows agencies to customize how "Sub-Accounts" are labeled in their UI

ALTER TABLE agencies 
ADD COLUMN organization_type ENUM('marketing_agency', 'franchise', 'single_business', 'other') 
NOT NULL DEFAULT 'marketing_agency' 
AFTER status;

-- Add a custom_subaccount_label column for "other" type customization
ALTER TABLE agencies 
ADD COLUMN custom_subaccount_label VARCHAR(50) NULL 
AFTER organization_type;
