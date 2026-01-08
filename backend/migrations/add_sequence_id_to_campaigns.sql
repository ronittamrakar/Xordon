-- Add sequence_id column to campaigns table to support campaign-sequence relationships

-- Add sequence_id column to campaigns table
ALTER TABLE campaigns ADD COLUMN sequence_id INT NULL;

-- Add foreign key constraint
ALTER TABLE campaigns ADD FOREIGN KEY (sequence_id) REFERENCES sequences(id) ON DELETE SET NULL;

-- Add index for better performance
CREATE INDEX idx_campaigns_sequence_id ON campaigns(sequence_id);

-- Add sequence_mode column to track whether campaign uses existing or custom sequence
ALTER TABLE campaigns ADD COLUMN sequence_mode VARCHAR(32) DEFAULT 'existing';