-- Proposals feature tables

-- Proposal templates table
CREATE TABLE IF NOT EXISTS proposal_templates (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100) DEFAULT 'general',
  content LONGTEXT NOT NULL,
  cover_image VARCHAR(500),
  sections JSON,
  variables JSON,
  styling JSON,
  is_default BOOLEAN DEFAULT FALSE,
  status VARCHAR(32) DEFAULT 'active',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_proposal_templates_user (user_id),
  INDEX idx_proposal_templates_category (category),
  INDEX idx_proposal_templates_status (status),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Proposals table
CREATE TABLE IF NOT EXISTS proposals (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  template_id INT,
  name VARCHAR(255) NOT NULL,
  client_name VARCHAR(255),
  client_email VARCHAR(255),
  client_company VARCHAR(255),
  client_phone VARCHAR(50),
  client_address TEXT,
  content LONGTEXT NOT NULL,
  sections JSON,
  cover_image VARCHAR(500),
  logo VARCHAR(500),
  pricing JSON,
  total_amount DECIMAL(15,2) DEFAULT 0.00,
  currency VARCHAR(10) DEFAULT 'USD',
  valid_until DATE,
  status VARCHAR(32) DEFAULT 'draft',
  sent_at DATETIME,
  viewed_at DATETIME,
  accepted_at DATETIME,
  declined_at DATETIME,
  signature TEXT,
  signed_by VARCHAR(255),
  signed_at DATETIME,
  notes TEXT,
  internal_notes TEXT,
  custom_fields JSON,
  styling JSON,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_proposals_user (user_id),
  INDEX idx_proposals_template (template_id),
  INDEX idx_proposals_status (status),
  INDEX idx_proposals_client_email (client_email),
  INDEX idx_proposals_created (created_at),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (template_id) REFERENCES proposal_templates(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Proposal items/line items table
CREATE TABLE IF NOT EXISTS proposal_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  proposal_id INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  quantity DECIMAL(10,2) DEFAULT 1,
  unit_price DECIMAL(15,2) DEFAULT 0.00,
  discount_percent DECIMAL(5,2) DEFAULT 0.00,
  tax_percent DECIMAL(5,2) DEFAULT 0.00,
  total DECIMAL(15,2) DEFAULT 0.00,
  sort_order INT DEFAULT 0,
  category VARCHAR(100),
  is_optional BOOLEAN DEFAULT FALSE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_proposal_items_proposal (proposal_id),
  FOREIGN KEY (proposal_id) REFERENCES proposals(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Proposal activity/tracking table
CREATE TABLE IF NOT EXISTS proposal_activities (
  id INT AUTO_INCREMENT PRIMARY KEY,
  proposal_id INT NOT NULL,
  activity_type VARCHAR(50) NOT NULL,
  description TEXT,
  ip_address VARCHAR(45),
  user_agent TEXT,
  metadata JSON,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_proposal_activities_proposal (proposal_id),
  INDEX idx_proposal_activities_type (activity_type),
  FOREIGN KEY (proposal_id) REFERENCES proposals(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Proposal comments table
CREATE TABLE IF NOT EXISTS proposal_comments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  proposal_id INT NOT NULL,
  user_id INT,
  author_name VARCHAR(255),
  author_email VARCHAR(255),
  content TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT FALSE,
  parent_id INT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_proposal_comments_proposal (proposal_id),
  FOREIGN KEY (proposal_id) REFERENCES proposals(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (parent_id) REFERENCES proposal_comments(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Proposal settings table
CREATE TABLE IF NOT EXISTS proposal_settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL UNIQUE,
  company_name VARCHAR(255),
  company_logo VARCHAR(500),
  company_address TEXT,
  company_phone VARCHAR(50),
  company_email VARCHAR(255),
  company_website VARCHAR(255),
  default_currency VARCHAR(10) DEFAULT 'USD',
  default_validity_days INT DEFAULT 30,
  default_payment_terms TEXT,
  default_terms_conditions TEXT,
  email_notifications BOOLEAN DEFAULT TRUE,
  require_signature BOOLEAN DEFAULT TRUE,
  allow_comments BOOLEAN DEFAULT TRUE,
  show_pricing BOOLEAN DEFAULT TRUE,
  branding JSON,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Insert default proposal templates
INSERT INTO proposal_templates (user_id, name, description, category, content, sections, is_default, status) VALUES
(1, 'Professional Services Proposal', 'A clean, professional template for service-based proposals', 'services', 
'<h1>Professional Services Proposal</h1><p>Prepared for: {{client_name}}</p><p>Date: {{date}}</p>', 
'[{"id":"intro","title":"Introduction","content":""},{"id":"scope","title":"Scope of Work","content":""},{"id":"timeline","title":"Timeline","content":""},{"id":"pricing","title":"Pricing","content":""},{"id":"terms","title":"Terms & Conditions","content":""}]',
TRUE, 'active'),
(1, 'Software Development Proposal', 'Template for software development projects', 'technology',
'<h1>Software Development Proposal</h1><p>Project: {{project_name}}</p><p>Client: {{client_name}}</p>',
'[{"id":"overview","title":"Project Overview","content":""},{"id":"requirements","title":"Requirements","content":""},{"id":"approach","title":"Technical Approach","content":""},{"id":"timeline","title":"Development Timeline","content":""},{"id":"team","title":"Team","content":""},{"id":"pricing","title":"Investment","content":""}]',
TRUE, 'active'),
(1, 'Marketing Campaign Proposal', 'Template for marketing and advertising proposals', 'marketing',
'<h1>Marketing Campaign Proposal</h1><p>Prepared for: {{client_company}}</p>',
'[{"id":"executive","title":"Executive Summary","content":""},{"id":"objectives","title":"Campaign Objectives","content":""},{"id":"strategy","title":"Strategy","content":""},{"id":"deliverables","title":"Deliverables","content":""},{"id":"budget","title":"Budget","content":""},{"id":"timeline","title":"Timeline","content":""}]',
TRUE, 'active');
