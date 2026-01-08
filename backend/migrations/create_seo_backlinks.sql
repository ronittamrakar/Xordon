-- Create seo_backlinks table for backlink tracking and analysis
-- Ahrefs/SEMRush-like backlink monitoring

CREATE TABLE IF NOT EXISTS seo_backlinks (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  workspace_id INT UNSIGNED NOT NULL,
  company_id INT UNSIGNED NOT NULL,
  source_url TEXT NOT NULL COMMENT 'URL containing the backlink',
  source_domain VARCHAR(255) NOT NULL,
  target_url TEXT NOT NULL COMMENT 'URL being linked to',
  anchor_text TEXT DEFAULT NULL,
  link_type VARCHAR(50) DEFAULT 'dofollow' COMMENT 'dofollow, nofollow, ugc, sponsored',
  domain_authority INT DEFAULT NULL COMMENT '0-100 DA score',
  page_authority INT DEFAULT NULL COMMENT '0-100 PA score',
  first_seen_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_seen_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  status VARCHAR(50) DEFAULT 'active' COMMENT 'active, lost, new',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_workspace (workspace_id),
  INDEX idx_company (company_id),
  INDEX idx_source_domain (source_domain),
  INDEX idx_status (status),
  INDEX idx_link_type (link_type),
  INDEX idx_domain_authority (domain_authority)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
