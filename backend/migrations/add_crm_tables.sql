-- CRM Enhancement Migration
-- Adds dedicated CRM tables and enhances existing structure for advanced lead management

-- 1. Create dedicated leads table for better lead management
CREATE TABLE IF NOT EXISTS leads (
  id INT AUTO_INCREMENT PRIMARY KEY,
  contact_id INT NOT NULL,
  user_id INT NOT NULL,
  lead_score INT NOT NULL DEFAULT 0,
  lead_stage ENUM('new', 'contacted', 'qualified', 'proposal', 'negotiation', 'closed_won', 'closed_lost') NOT NULL DEFAULT 'new',
  lead_value DECIMAL(12,2) NULL,
  probability INT DEFAULT 0,
  expected_close_date DATE NULL,
  assigned_agent_id INT NULL,
  source VARCHAR(100) NULL,
  campaign_id INT NULL,
  last_activity_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_contact_id (contact_id),
  INDEX idx_user_id (user_id),
  INDEX idx_lead_stage (lead_stage),
  INDEX idx_lead_score (lead_score),
  INDEX idx_assigned_agent (assigned_agent_id),
  INDEX idx_campaign_id (campaign_id),
  
  FOREIGN KEY (contact_id) REFERENCES recipients(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (assigned_agent_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. Create lead activities table for tracking all interactions
CREATE TABLE IF NOT EXISTS lead_activities (
  id INT AUTO_INCREMENT PRIMARY KEY,
  lead_id INT NOT NULL,
  contact_id INT NOT NULL,
  user_id INT NOT NULL,
  activity_type ENUM('call', 'email', 'sms', 'meeting', 'note', 'task', 'deal_change') NOT NULL,
  activity_title VARCHAR(255) NOT NULL,
  activity_description TEXT NULL,
  activity_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  duration_minutes INT NULL,
  outcome VARCHAR(100) NULL,
  next_action TEXT NULL,
  next_action_date DATETIME NULL,
  campaign_id INT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_lead_id (lead_id),
  INDEX idx_contact_id (contact_id),
  INDEX idx_user_id (user_id),
  INDEX idx_activity_type (activity_type),
  INDEX idx_activity_date (activity_date),
  INDEX idx_campaign_id (campaign_id),
  
  FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE,
  FOREIGN KEY (contact_id) REFERENCES recipients(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. Create lead tags for better categorization
CREATE TABLE IF NOT EXISTS lead_tags (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  name VARCHAR(100) NOT NULL,
  color VARCHAR(7) NOT NULL DEFAULT '#007bff',
  description TEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE KEY unique_user_tag (user_id, name),
  INDEX idx_user_id (user_id),
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. Create lead-tag relationships
CREATE TABLE IF NOT EXISTS lead_tag_relations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  lead_id INT NOT NULL,
  tag_id INT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE KEY unique_lead_tag (lead_id, tag_id),
  INDEX idx_lead_id (lead_id),
  INDEX idx_tag_id (tag_id),
  
  FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE,
  FOREIGN KEY (tag_id) REFERENCES lead_tags(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 5. Create pipeline stages for sales process management
CREATE TABLE IF NOT EXISTS pipeline_stages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT NULL,
  stage_order INT NOT NULL DEFAULT 0,
  probability INT DEFAULT 0,
  is_default BOOLEAN DEFAULT FALSE,
  color VARCHAR(7) DEFAULT '#007bff',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_user_id (user_id),
  INDEX idx_stage_order (stage_order),
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 6. Create tasks for follow-up management
CREATE TABLE IF NOT EXISTS crm_tasks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  lead_id INT NOT NULL,
  contact_id INT NOT NULL,
  assigned_to INT NOT NULL,
  created_by INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT NULL,
  task_type ENUM('call', 'email', 'meeting', 'follow_up', 'custom') NOT NULL DEFAULT 'follow_up',
  status ENUM('pending', 'in_progress', 'completed', 'cancelled') NOT NULL DEFAULT 'pending',
  priority ENUM('low', 'medium', 'high', 'urgent') NOT NULL DEFAULT 'medium',
  due_date DATETIME NULL,
  completed_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_lead_id (lead_id),
  INDEX idx_contact_id (contact_id),
  INDEX idx_assigned_to (assigned_to),
  INDEX idx_created_by (created_by),
  INDEX idx_status (status),
  INDEX idx_priority (priority),
  INDEX idx_due_date (due_date),
  
  FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE,
  FOREIGN KEY (contact_id) REFERENCES recipients(id) ON DELETE CASCADE,
  FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 7. Enhance recipients table with CRM-specific fields
ALTER TABLE recipients 
ADD COLUMN IF NOT EXISTS lead_status ENUM('prospect', 'lead', 'opportunity', 'customer', 'inactive') DEFAULT 'prospect',
ADD COLUMN IF NOT EXISTS lead_rating ENUM('hot', 'warm', 'cold') DEFAULT 'cold',
ADD COLUMN IF NOT EXISTS last_contacted_at DATETIME NULL,
ADD COLUMN IF NOT EXISTS contact_frequency INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS preferred_contact_method ENUM('email', 'phone', 'sms', 'any') DEFAULT 'email';

-- 8. Add indexes for new recipient fields
CREATE INDEX IF NOT EXISTS idx_recipients_lead_status ON recipients(lead_status);
CREATE INDEX IF NOT EXISTS idx_recipients_lead_rating ON recipients(lead_rating);
CREATE INDEX IF NOT EXISTS idx_recipients_last_contacted ON recipients(last_contacted_at);

-- 9. Insert default pipeline stages
INSERT IGNORE INTO pipeline_stages (user_id, name, description, stage_order, probability, is_default, color) VALUES
(0, 'New Lead', 'Initial contact stage', 1, 10, TRUE, '#6c757d'),
(0, 'Contacted', 'First contact made', 2, 20, FALSE, '#17a2b8'),
(0, 'Qualified', 'Lead qualified as potential customer', 3, 40, FALSE, '#28a745'),
(0, 'Proposal', 'Proposal sent', 4, 60, FALSE, '#ffc107'),
(0, 'Negotiation', 'In negotiation phase', 5, 80, FALSE, '#fd7e14'),
(0, 'Closed Won', 'Deal successfully closed', 6, 100, FALSE, '#28a745'),
(0, 'Closed Lost', 'Deal lost', 7, 0, FALSE, '#dc3545');

-- 10. Create CRM analytics view
CREATE OR REPLACE VIEW crm_dashboard AS
SELECT 
  u.id as user_id,
  u.name as user_name,
  COUNT(DISTINCT l.id) as total_leads,
  COUNT(DISTINCT CASE WHEN l.lead_stage = 'new' THEN l.id END) as new_leads,
  COUNT(DISTINCT CASE WHEN l.lead_stage = 'qualified' THEN l.id END) as qualified_leads,
  COUNT(DISTINCT CASE WHEN l.lead_stage = 'closed_won' THEN l.id END) as won_deals,
  COUNT(DISTINCT CASE WHEN l.lead_stage = 'closed_lost' THEN l.id END) as lost_deals,
  COALESCE(SUM(CASE WHEN l.lead_stage = 'closed_won' THEN l.lead_value ELSE 0 END), 0) as total_value,
  COALESCE(AVG(l.lead_score), 0) as avg_lead_score,
  COUNT(DISTINCT la.id) as total_activities,
  COUNT(DISTINCT CASE WHEN la.activity_date >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN la.id END) as activities_this_week
FROM users u
LEFT JOIN leads l ON u.id = l.user_id
LEFT JOIN lead_activities la ON l.id = la.lead_id
GROUP BY u.id, u.name;
