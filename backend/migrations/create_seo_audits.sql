-- Create seo_audits table for site audit reports
-- Stores comprehensive SEO audit results for pages

CREATE TABLE IF NOT EXISTS seo_audits (
  id INT AUTO_INCREMENT PRIMARY KEY,
  workspace_id INT NOT NULL,
  company_id INT NOT NULL,
  page_id INT DEFAULT NULL COMMENT 'FK to seo_pages if specific page',
  url TEXT NOT NULL,
  audit_type VARCHAR(50) DEFAULT 'full' COMMENT 'full, technical, content, performance',
  status VARCHAR(50) NOT NULL DEFAULT 'pending' COMMENT 'pending, running, completed, failed',
  seo_score INT DEFAULT NULL COMMENT '0-100 overall SEO score',
  performance_score INT DEFAULT NULL COMMENT '0-100 performance score',
  accessibility_score INT DEFAULT NULL COMMENT '0-100 accessibility score',
  report_data JSON DEFAULT NULL COMMENT 'Full audit report with issues, recommendations',
  issues_count INT DEFAULT 0,
  warnings_count INT DEFAULT 0,
  started_at TIMESTAMP NULL DEFAULT NULL,
  finished_at TIMESTAMP NULL DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_workspace (workspace_id),
  INDEX idx_company (company_id),
  INDEX idx_page (page_id),
  INDEX idx_status (status),
  INDEX idx_audit_type (audit_type),
  FOREIGN KEY (page_id) REFERENCES seo_pages(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
