-- Add form analytics table for tracking form interactions

-- Create form_analytics table
CREATE TABLE IF NOT EXISTS form_analytics (
  id INT AUTO_INCREMENT PRIMARY KEY,
  form_id INT NOT NULL,
  event_type VARCHAR(50) NOT NULL, -- 'view', 'submit', 'abandon'
  source VARCHAR(100), -- 'direct', 'embed', 'share'
  ip_address VARCHAR(45),
  user_agent TEXT,
  session_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (form_id) REFERENCES forms(id) ON DELETE CASCADE
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_form_analytics_form_id ON form_analytics(form_id);
CREATE INDEX IF NOT EXISTS idx_form_analytics_event_type ON form_analytics(event_type);
CREATE INDEX IF NOT EXISTS idx_form_analytics_created_at ON form_analytics(created_at);

-- Add response_time column to form_responses if it doesn't exist
-- Check if column exists first
SET @column_exists := (
  SELECT COUNT(*) 
  FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME = 'form_responses' 
  AND COLUMN_NAME = 'response_time'
);

SET @sql := IF(@column_exists = 0, 
  'ALTER TABLE form_responses ADD COLUMN response_time INT DEFAULT NULL',
  'SELECT "Column already exists"'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;