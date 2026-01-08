-- Add tags functionality

-- Create tags table
CREATE TABLE IF NOT EXISTS tags (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  color VARCHAR(7) NOT NULL DEFAULT '#3b82f6',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_tag (user_id, name)
);

-- Create recipient_tags junction table for many-to-many relationship
CREATE TABLE IF NOT EXISTS recipient_tags (
  id INT AUTO_INCREMENT PRIMARY KEY,
  recipient_id INT NOT NULL,
  tag_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (recipient_id) REFERENCES recipients(id) ON DELETE CASCADE,
  FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE,
  UNIQUE KEY unique_recipient_tag (recipient_id, tag_id)
);

-- Create indexes for better performance
CREATE INDEX idx_tags_user_id ON tags(user_id);
CREATE INDEX idx_recipient_tags_recipient_id ON recipient_tags(recipient_id);
CREATE INDEX idx_recipient_tags_tag_id ON recipient_tags(tag_id);