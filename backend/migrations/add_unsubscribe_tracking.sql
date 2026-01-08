-- Add unsubscribe tracking to recipients table

ALTER TABLE recipients ADD COLUMN unsubscribed_at DATETIME NULL;
ALTER TABLE recipients ADD COLUMN unsubscribes INT NOT NULL DEFAULT 0;
ALTER TABLE recipients ADD COLUMN track_token VARCHAR(64) NULL;

-- Add index for track_token for faster lookups
CREATE INDEX idx_recipients_track_token ON recipients(track_token);

-- Add index for unsubscribed_at for filtering
CREATE INDEX idx_recipients_unsubscribed_at ON recipients(unsubscribed_at);