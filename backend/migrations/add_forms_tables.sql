-- Add forms and form responses tables

CREATE TABLE IF NOT EXISTS forms (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  title VARCHAR(500) NOT NULL,
  description TEXT,
  fields JSON NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS form_responses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  form_id INT NOT NULL,
  response_data JSON NOT NULL,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (form_id) REFERENCES forms(id) ON DELETE CASCADE
);

-- Add email replies table for email client functionality
CREATE TABLE IF NOT EXISTS email_replies (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  campaign_id INT,
  recipient_id INT,
  from_email VARCHAR(255) NOT NULL,
  to_email VARCHAR(255) NOT NULL,
  subject VARCHAR(500) NOT NULL,
  body TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE SET NULL,
  FOREIGN KEY (recipient_id) REFERENCES recipients(id) ON DELETE SET NULL
);