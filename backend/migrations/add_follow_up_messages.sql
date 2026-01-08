-- Add follow_up_messages column to sms_campaigns table
ALTER TABLE sms_campaigns 
ADD COLUMN IF NOT EXISTS follow_up_messages JSON DEFAULT NULL;
