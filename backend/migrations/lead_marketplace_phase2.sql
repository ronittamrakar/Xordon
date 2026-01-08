-- Lead Marketplace Phase 2 Enhancements
-- Provider Documents, Booking Integration, Messaging, Geolocation

-- Provider Documents (license, insurance, portfolio, certifications)
CREATE TABLE IF NOT EXISTS provider_documents (
  id INT AUTO_INCREMENT PRIMARY KEY,
  workspace_id INT NOT NULL,
  company_id INT NOT NULL,
  document_type ENUM('license', 'insurance', 'certification', 'portfolio', 'background_check', 'identity', 'other') NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT NULL,
  file_url VARCHAR(500) NOT NULL,
  file_name VARCHAR(255) NULL,
  file_size INT NULL,
  mime_type VARCHAR(100) NULL,
  status ENUM('pending', 'approved', 'rejected', 'expired') DEFAULT 'pending',
  expires_at DATE NULL,
  review_notes TEXT NULL,
  reviewed_by INT NULL,
  reviewed_at DATETIME NULL,
  uploaded_by INT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_provider_docs_company (workspace_id, company_id),
  INDEX idx_provider_docs_status (workspace_id, status),
  INDEX idx_provider_docs_type (workspace_id, document_type),
  INDEX idx_provider_docs_expires (workspace_id, expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Provider Portfolio Items (photos/videos of work)
CREATE TABLE IF NOT EXISTS provider_portfolio (
  id INT AUTO_INCREMENT PRIMARY KEY,
  workspace_id INT NOT NULL,
  company_id INT NOT NULL,
  title VARCHAR(255) NULL,
  description TEXT NULL,
  media_url VARCHAR(500) NOT NULL,
  media_type ENUM('image', 'video') DEFAULT 'image',
  thumbnail_url VARCHAR(500) NULL,
  service_id INT NULL,
  is_featured TINYINT(1) DEFAULT 0,
  sort_order INT DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_portfolio_company (workspace_id, company_id),
  INDEX idx_portfolio_service (workspace_id, service_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Link appointments to lead matches
ALTER TABLE appointments 
  ADD COLUMN lead_match_id INT NULL AFTER booking_type_id,
  ADD COLUMN lead_request_id INT NULL AFTER lead_match_id,
  ADD INDEX idx_appointments_lead (lead_match_id);

-- Marketplace Messages (in-app messaging between consumer/provider)
CREATE TABLE IF NOT EXISTS marketplace_messages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  workspace_id INT NOT NULL,
  lead_match_id INT NOT NULL,
  lead_request_id INT NOT NULL,
  sender_type ENUM('consumer', 'provider', 'system') NOT NULL,
  sender_id INT NULL,
  message TEXT NOT NULL,
  attachments JSON NULL,
  is_read TINYINT(1) DEFAULT 0,
  read_at DATETIME NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_messages_match (workspace_id, lead_match_id),
  INDEX idx_messages_unread (workspace_id, lead_match_id, is_read)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Message notifications preferences
CREATE TABLE IF NOT EXISTS marketplace_message_preferences (
  id INT AUTO_INCREMENT PRIMARY KEY,
  workspace_id INT NOT NULL,
  company_id INT NOT NULL,
  notify_email TINYINT(1) DEFAULT 1,
  notify_sms TINYINT(1) DEFAULT 0,
  notify_push TINYINT(1) DEFAULT 1,
  quiet_hours_start TIME NULL,
  quiet_hours_end TIME NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_msg_prefs (workspace_id, company_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Provider Badges/Achievements
CREATE TABLE IF NOT EXISTS provider_badges (
  id INT AUTO_INCREMENT PRIMARY KEY,
  workspace_id INT NOT NULL,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) NOT NULL,
  description VARCHAR(255) NULL,
  icon VARCHAR(100) NULL,
  criteria JSON NULL,
  is_active TINYINT(1) DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_badge_slug (workspace_id, slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS provider_badge_awards (
  id INT AUTO_INCREMENT PRIMARY KEY,
  workspace_id INT NOT NULL,
  company_id INT NOT NULL,
  badge_id INT NOT NULL,
  awarded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME NULL,
  awarded_by INT NULL,
  reason VARCHAR(255) NULL,
  UNIQUE KEY uq_badge_award (workspace_id, company_id, badge_id),
  INDEX idx_badge_awards_company (workspace_id, company_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Lead Quality Feedback (from providers)
CREATE TABLE IF NOT EXISTS lead_quality_feedback (
  id INT AUTO_INCREMENT PRIMARY KEY,
  workspace_id INT NOT NULL,
  lead_match_id INT NOT NULL,
  lead_request_id INT NOT NULL,
  company_id INT NOT NULL,
  quality_score TINYINT NOT NULL, -- 1-5
  contact_accuracy TINYINT NULL, -- 1-5
  intent_accuracy TINYINT NULL, -- 1-5
  timing_accuracy TINYINT NULL, -- 1-5
  feedback_text TEXT NULL,
  issues JSON NULL, -- ['wrong_phone', 'fake_email', 'spam', 'duplicate', etc.]
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_lead_feedback (workspace_id, lead_match_id, company_id),
  INDEX idx_feedback_lead (workspace_id, lead_request_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed default badges
INSERT INTO provider_badges (workspace_id, name, slug, description, icon, criteria) VALUES
(1, 'Top Rated', 'top-rated', 'Maintained 4.5+ star rating with 10+ reviews', 'star', '{"min_rating": 4.5, "min_reviews": 10}'),
(1, 'Quick Responder', 'quick-responder', 'Responds to leads within 5 minutes on average', 'zap', '{"max_response_minutes": 5}'),
(1, 'Verified Pro', 'verified-pro', 'Completed all verification requirements', 'badge-check', '{"documents": ["license", "insurance"]}'),
(1, 'Background Checked', 'background-checked', 'Passed background check verification', 'shield-check', '{"background_checked": true}'),
(1, 'Lead Champion', 'lead-champion', 'Won 50+ leads', 'trophy', '{"min_leads_won": 50}'),
(1, 'Rising Star', 'rising-star', 'New provider with excellent early performance', 'trending-up', '{"max_days_active": 90, "min_rating": 4.0}')
ON DUPLICATE KEY UPDATE description = VALUES(description);

-- Add geolocation columns to lead_requests if not present
-- (These may already exist from original migration)
ALTER TABLE lead_requests 
  ADD COLUMN IF NOT EXISTS geocoded_at DATETIME NULL,
  ADD COLUMN IF NOT EXISTS geocode_source VARCHAR(50) NULL;

-- Service area enhanced geolocation
ALTER TABLE service_areas
  ADD COLUMN IF NOT EXISTS center_latitude DECIMAL(10,7) NULL,
  ADD COLUMN IF NOT EXISTS center_longitude DECIMAL(10,7) NULL,
  ADD COLUMN IF NOT EXISTS geocoded_at DATETIME NULL;
