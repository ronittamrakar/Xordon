-- Add group_id to sms_recipients table
ALTER TABLE sms_recipients ADD COLUMN group_id INT NULL;
ALTER TABLE sms_recipients ADD CONSTRAINT fk_sms_recipients_group_id 
    FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE SET NULL;

-- Add index for better performance
CREATE INDEX idx_sms_recipients_group_id ON sms_recipients(group_id);