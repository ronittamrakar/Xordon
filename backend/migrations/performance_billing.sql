-- Performance Billing Migration (LeadSmart-inspired Pay-Per-Call/Lead System)
-- Adds qualified call tracking and performance-based billing

-- Add performance billing columns to call_logs
ALTER TABLE call_logs 
ADD COLUMN IF NOT EXISTS is_qualified TINYINT(1) DEFAULT 0 COMMENT 'True if call duration >= 90 seconds',
ADD COLUMN IF NOT EXISTS is_billed TINYINT(1) DEFAULT 0 COMMENT 'True if credits were deducted for this call',
ADD COLUMN IF NOT EXISTS billed_at DATETIME NULL COMMENT 'When the call was billed',
ADD COLUMN IF NOT EXISTS credit_transaction_id INT NULL COMMENT 'Reference to credit_transactions',
ADD COLUMN IF NOT EXISTS billing_price DECIMAL(10,2) NULL COMMENT 'Amount charged for this call',
ADD COLUMN IF NOT EXISTS billing_status ENUM('pending','billed','disputed','refunded','waived') DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS dispute_reason TEXT NULL,
ADD COLUMN IF NOT EXISTS disputed_at DATETIME NULL,
ADD COLUMN IF NOT EXISTS refunded_at DATETIME NULL,
ADD INDEX IF NOT EXISTS idx_call_logs_qualified (workspace_id, is_qualified, is_billed),
ADD INDEX IF NOT EXISTS idx_call_logs_billing (workspace_id, billing_status);

-- Call Billing Settings (per workspace/company)
CREATE TABLE IF NOT EXISTS call_billing_settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  workspace_id INT NOT NULL,
  company_id INT NULL COMMENT 'NULL = workspace default',
  min_duration_seconds INT DEFAULT 90 COMMENT 'Minimum duration for qualified call',
  base_price_per_call DECIMAL(10,2) DEFAULT 25.00,
  surge_multiplier DECIMAL(4,2) DEFAULT 1.5 COMMENT 'For ASAP/urgent calls',
  exclusive_multiplier DECIMAL(4,2) DEFAULT 3.0 COMMENT 'For exclusive leads',
  auto_bill_enabled TINYINT(1) DEFAULT 1 COMMENT 'Automatically bill qualified calls',
  dispute_window_hours INT DEFAULT 72 COMMENT 'Hours allowed to dispute a charge',
  max_price_per_call DECIMAL(10,2) DEFAULT 120.00,
  min_price_per_call DECIMAL(10,2) DEFAULT 25.00,
  is_active TINYINT(1) DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_call_billing_settings (workspace_id, company_id),
  INDEX idx_call_billing_active (workspace_id, is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Call Pricing Rules (zip code, service, time-based pricing)
CREATE TABLE IF NOT EXISTS call_pricing_rules (
  id INT AUTO_INCREMENT PRIMARY KEY,
  workspace_id INT NOT NULL,
  name VARCHAR(191) NULL,
  service_category VARCHAR(100) NULL COMMENT 'e.g., plumbing, hvac, electrical',
  region VARCHAR(100) NULL,
  postal_code VARCHAR(32) NULL,
  city VARCHAR(191) NULL,
  day_of_week SET('mon','tue','wed','thu','fri','sat','sun') NULL,
  time_start TIME NULL COMMENT 'e.g., 18:00 for after-hours',
  time_end TIME NULL,
  is_emergency TINYINT(1) NULL COMMENT 'Emergency/after-hours calls',
  base_price DECIMAL(10,2) NOT NULL DEFAULT 25.00,
  multiplier DECIMAL(4,2) DEFAULT 1.0,
  priority INT DEFAULT 0 COMMENT 'Higher = checked first',
  is_active TINYINT(1) DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_call_pricing_workspace (workspace_id, is_active, priority DESC),
  INDEX idx_call_pricing_postal (workspace_id, postal_code),
  INDEX idx_call_pricing_service (workspace_id, service_category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Call Disputes (for billing disputes)
CREATE TABLE IF NOT EXISTS call_disputes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  workspace_id INT NOT NULL,
  company_id INT NOT NULL,
  call_log_id INT NOT NULL,
  credit_transaction_id INT NULL,
  dispute_type ENUM('wrong_number','not_interested','spam','poor_quality','duplicate','other') NOT NULL,
  description TEXT NULL,
  status ENUM('pending','under_review','approved','rejected','partial_refund') DEFAULT 'pending',
  refund_amount DECIMAL(10,2) NULL,
  resolution_notes TEXT NULL,
  resolved_by INT NULL,
  resolved_at DATETIME NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_call_disputes_company (workspace_id, company_id),
  INDEX idx_call_disputes_status (workspace_id, status),
  INDEX idx_call_disputes_call (call_log_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Performance Summary (daily aggregation for analytics)
CREATE TABLE IF NOT EXISTS call_performance_summary (
  id INT AUTO_INCREMENT PRIMARY KEY,
  workspace_id INT NOT NULL,
  company_id INT NOT NULL,
  summary_date DATE NOT NULL,
  total_calls INT DEFAULT 0,
  qualified_calls INT DEFAULT 0,
  total_duration_seconds INT DEFAULT 0,
  total_billed DECIMAL(10,2) DEFAULT 0,
  total_refunded DECIMAL(10,2) DEFAULT 0,
  avg_call_duration_seconds DECIMAL(10,2) NULL,
  qualification_rate DECIMAL(5,2) NULL COMMENT 'Percentage of qualified calls',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_performance_summary (workspace_id, company_id, summary_date),
  INDEX idx_performance_date (workspace_id, summary_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed default billing settings
INSERT INTO call_billing_settings (workspace_id, company_id, min_duration_seconds, base_price_per_call, auto_bill_enabled)
VALUES (1, NULL, 90, 25.00, 1)
ON DUPLICATE KEY UPDATE base_price_per_call = VALUES(base_price_per_call);

-- Seed default pricing rules
INSERT INTO call_pricing_rules (workspace_id, name, service_category, base_price, multiplier, priority, is_active) VALUES
(1, 'Default Call Rate', NULL, 25.00, 1.0, 0, 1),
(1, 'HVAC Calls', 'hvac', 45.00, 1.0, 10, 1),
(1, 'Plumbing Calls', 'plumbing', 35.00, 1.0, 10, 1),
(1, 'Emergency After-Hours', NULL, 50.00, 1.5, 100, 1),
(1, 'High-Value Zip (90210)', NULL, 75.00, 1.0, 50, 1)
ON DUPLICATE KEY UPDATE base_price = VALUES(base_price);

-- Update the high-value zip pricing rule with postal code
UPDATE call_pricing_rules SET postal_code = '90210' WHERE name = 'High-Value Zip (90210)' AND workspace_id = 1;

-- Update emergency rule with time constraints
UPDATE call_pricing_rules SET time_start = '18:00:00', time_end = '08:00:00', is_emergency = 1 WHERE name = 'Emergency After-Hours' AND workspace_id = 1;
