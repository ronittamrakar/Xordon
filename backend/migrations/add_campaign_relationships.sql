-- Add campaign_id foreign key relationships to sequences table for campaign-centric ownership

-- Add campaign_id to sequences table
ALTER TABLE sequences ADD COLUMN campaign_id INT NULL;
ALTER TABLE sequences ADD FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE SET NULL;

-- Add index for better performance
CREATE INDEX idx_sequences_campaign_id ON sequences(campaign_id);

-- Add analytics table for campaign-specific analytics tracking
CREATE TABLE IF NOT EXISTS analytics (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  campaign_id INT NOT NULL,
  sequence_id INT NULL,
  metric_type VARCHAR(50) NOT NULL, -- 'sent', 'opened', 'clicked', 'bounced', 'unsubscribed'
  metric_value INT NOT NULL DEFAULT 0,
  date_recorded DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE,
  FOREIGN KEY (sequence_id) REFERENCES sequences(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Add indexes for analytics performance
CREATE INDEX idx_analytics_campaign_id ON analytics(campaign_id);
CREATE INDEX idx_analytics_sequence_id ON analytics(sequence_id);
CREATE INDEX idx_analytics_date ON analytics(date_recorded);
CREATE INDEX idx_analytics_metric_type ON analytics(metric_type);