-- Migration: create ai_templates table

CREATE TABLE IF NOT EXISTS ai_templates (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100),
  author VARCHAR(100),
  type VARCHAR(50) DEFAULT 'chat',
  business_niches JSON,
  use_cases JSON,
  downloads INT DEFAULT 0,
  rating DECIMAL(3, 2) DEFAULT 0.00,
  reviews_count INT DEFAULT 0,
  price VARCHAR(50) DEFAULT 'Free',
  image_url VARCHAR(255),
  is_official BOOLEAN DEFAULT FALSE,
  is_verified BOOLEAN DEFAULT FALSE,
  config JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX (category),
  INDEX (type),
  INDEX (is_official)
);
