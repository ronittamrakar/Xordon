-- ARCHIVED: SQLite migration replaced by `add_campaign_relationships.sql` (MySQL).
-- Original SQLite migration moved to `migrations/archived_sqlite_migrations/add_campaign_relationships_sqlite.sql`.
-- This file is intentionally left as a stub to avoid accidental use.

-- No SQL in this archived stub.


-- Drop the existing sequences table
DROP TABLE sequences;

-- Recreate sequences table with campaign_id
CREATE TABLE sequences (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  campaign_id INTEGER NULL,
  name TEXT NOT NULL,
  status TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE SET NULL
);

-- Restore data from backup
INSERT INTO sequences (id, user_id, name, status, created_at, updated_at)
SELECT id, user_id, name, status, created_at, updated_at FROM sequences_backup;

-- Drop backup table
DROP TABLE sequences_backup;

-- Create analytics table for campaign-specific analytics tracking
CREATE TABLE IF NOT EXISTS analytics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  campaign_id INTEGER NOT NULL,
  sequence_id INTEGER NULL,
  metric_type TEXT NOT NULL, -- 'sent', 'opened', 'clicked', 'bounced', 'unsubscribed'
  metric_value INTEGER NOT NULL DEFAULT 0,
  date_recorded TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE,
  FOREIGN KEY (sequence_id) REFERENCES sequences(id) ON DELETE SET NULL
);

-- Create indexes for better performance
CREATE INDEX idx_sequences_campaign_id ON sequences(campaign_id);
CREATE INDEX idx_analytics_campaign_id ON analytics(campaign_id);
CREATE INDEX idx_analytics_sequence_id ON analytics(sequence_id);
CREATE INDEX idx_analytics_date ON analytics(date_recorded);
CREATE INDEX idx_analytics_metric_type ON analytics(metric_type);