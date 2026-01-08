-- Proposals feature tables (SQLite)

-- Proposal templates table
CREATE TABLE IF NOT EXISTS proposal_templates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'general',
  content TEXT NOT NULL,
  cover_image TEXT,
  sections TEXT,
  variables TEXT,
  styling TEXT,
  is_default INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_proposal_templates_user ON proposal_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_proposal_templates_category ON proposal_templates(category);
CREATE INDEX IF NOT EXISTS idx_proposal_templates_status ON proposal_templates(status);

-- Proposals table
CREATE TABLE IF NOT EXISTS proposals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  template_id INTEGER,
  name TEXT NOT NULL,
  client_name TEXT,
  client_email TEXT,
  client_company TEXT,
  client_phone TEXT,
  client_address TEXT,
  content TEXT NOT NULL,
  sections TEXT,
  cover_image TEXT,
  logo TEXT,
  pricing TEXT,
  total_amount DECIMAL(15,2) DEFAULT 0.00,
  currency TEXT DEFAULT 'USD',
  valid_until DATE,
  status TEXT DEFAULT 'draft',
  sent_at DATETIME,
  viewed_at DATETIME,
  accepted_at DATETIME,
  declined_at DATETIME,
  signature TEXT,
  signed_by TEXT,
  signed_at DATETIME,
  notes TEXT,
  internal_notes TEXT,
  custom_fields TEXT,
  styling TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (template_id) REFERENCES proposal_templates(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_proposals_user ON proposals(user_id);
CREATE INDEX IF NOT EXISTS idx_proposals_template ON proposals(template_id);
CREATE INDEX IF NOT EXISTS idx_proposals_status ON proposals(status);
CREATE INDEX IF NOT EXISTS idx_proposals_client_email ON proposals(client_email);
CREATE INDEX IF NOT EXISTS idx_proposals_created ON proposals(created_at);

-- Proposal items/line items table
CREATE TABLE IF NOT EXISTS proposal_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  proposal_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  quantity DECIMAL(10,2) DEFAULT 1,
  unit_price DECIMAL(15,2) DEFAULT 0.00,
  discount_percent DECIMAL(5,2) DEFAULT 0.00,
  tax_percent DECIMAL(5,2) DEFAULT 0.00,
  total DECIMAL(15,2) DEFAULT 0.00,
  sort_order INTEGER DEFAULT 0,
  category TEXT,
  is_optional INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (proposal_id) REFERENCES proposals(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_proposal_items_proposal ON proposal_items(proposal_id);

-- Proposal activity/tracking table
CREATE TABLE IF NOT EXISTS proposal_activities (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  proposal_id INTEGER NOT NULL,
  activity_type TEXT NOT NULL,
  description TEXT,
  ip_address TEXT,
  user_agent TEXT,
  metadata TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (proposal_id) REFERENCES proposals(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_proposal_activities_proposal ON proposal_activities(proposal_id);
CREATE INDEX IF NOT EXISTS idx_proposal_activities_type ON proposal_activities(activity_type);

-- Proposal comments table
CREATE TABLE IF NOT EXISTS proposal_comments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  proposal_id INTEGER NOT NULL,
  user_id INTEGER,
  author_name TEXT,
  author_email TEXT,
  content TEXT NOT NULL,
  is_internal INTEGER DEFAULT 0,
  parent_id INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (proposal_id) REFERENCES proposals(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (parent_id) REFERENCES proposal_comments(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_proposal_comments_proposal ON proposal_comments(proposal_id);

-- Proposal settings table
CREATE TABLE IF NOT EXISTS proposal_settings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL UNIQUE,
  company_name TEXT,
  company_logo TEXT,
  company_address TEXT,
  company_phone TEXT,
  company_email TEXT,
  company_website TEXT,
  default_currency TEXT DEFAULT 'USD',
  default_validity_days INTEGER DEFAULT 30,
  default_payment_terms TEXT,
  default_terms_conditions TEXT,
  email_notifications INTEGER DEFAULT 1,
  require_signature INTEGER DEFAULT 1,
  allow_comments INTEGER DEFAULT 1,
  show_pricing INTEGER DEFAULT 1,
  branding TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Insert default proposal templates
INSERT OR IGNORE INTO proposal_templates (user_id, name, description, category, content, sections, is_default, status) VALUES
(1, 'Professional Services Proposal', 'A clean, professional template for service-based proposals', 'services', 
'<h1>Professional Services Proposal</h1><p>Prepared for: {{client_name}}</p><p>Date: {{date}}</p>', 
'[{"id":"intro","title":"Introduction","content":""},{"id":"scope","title":"Scope of Work","content":""},{"id":"timeline","title":"Timeline","content":""},{"id":"pricing","title":"Pricing","content":""},{"id":"terms","title":"Terms & Conditions","content":""}]',
1, 'active'),
(1, 'Software Development Proposal', 'Template for software development projects', 'technology',
'<h1>Software Development Proposal</h1><p>Project: {{project_name}}</p><p>Client: {{client_name}}</p>',
'[{"id":"overview","title":"Project Overview","content":""},{"id":"requirements","title":"Requirements","content":""},{"id":"approach","title":"Technical Approach","content":""},{"id":"timeline","title":"Development Timeline","content":""},{"id":"team","title":"Team","content":""},{"id":"pricing","title":"Investment","content":""}]',
1, 'active'),
(1, 'Marketing Campaign Proposal', 'Template for marketing and advertising proposals', 'marketing',
'<h1>Marketing Campaign Proposal</h1><p>Prepared for: {{client_company}}</p>',
'[{"id":"executive","title":"Executive Summary","content":""},{"id":"objectives","title":"Campaign Objectives","content":""},{"id":"strategy","title":"Strategy","content":""},{"id":"deliverables","title":"Deliverables","content":""},{"id":"budget","title":"Budget","content":""},{"id":"timeline","title":"Timeline","content":""}]',
1, 'active');