-- Add call_script field to call_campaigns table
ALTER TABLE call_campaigns ADD COLUMN call_script TEXT AFTER call_provider;