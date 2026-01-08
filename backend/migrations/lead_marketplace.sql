-- Lead Marketplace Migration (Phase 1 MVP)
-- Tables for LeadSimplify/Thumbtack/Bark-style lead marketplace

-- Service Catalog (categories/subcategories)
CREATE TABLE IF NOT EXISTS service_catalog (
  id INT AUTO_INCREMENT PRIMARY KEY,
  workspace_id INT NOT NULL,
  parent_id INT NULL,
  name VARCHAR(191) NOT NULL,
  slug VARCHAR(191) NOT NULL,
  description TEXT NULL,
  icon VARCHAR(64) NULL,
  attributes JSON NULL,
  sort_order INT DEFAULT 0,
  is_active TINYINT(1) DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_service_catalog_slug (workspace_id, slug),
  INDEX idx_service_catalog_parent (workspace_id, parent_id),
  INDEX idx_service_catalog_active (workspace_id, is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Service Providers (company-level registration)
CREATE TABLE IF NOT EXISTS service_pros (
  id INT AUTO_INCREMENT PRIMARY KEY,
  workspace_id INT NOT NULL,
  company_id INT NOT NULL,
  user_id INT NULL,
  business_name VARCHAR(191) NULL,
  contact_name VARCHAR(191) NULL,
  contact_email VARCHAR(191) NULL,
  contact_phone VARCHAR(64) NULL,
  bio TEXT NULL,
  logo_url VARCHAR(500) NULL,
  website_url VARCHAR(500) NULL,
  years_in_business INT NULL,
  license_number VARCHAR(100) NULL,
  insurance_verified TINYINT(1) DEFAULT 0,
  background_checked TINYINT(1) DEFAULT 0,
  avg_rating DECIMAL(3,2) DEFAULT 0,
  total_reviews INT DEFAULT 0,
  total_leads_received INT DEFAULT 0,
  total_leads_accepted INT DEFAULT 0,
  total_leads_won INT DEFAULT 0,
  response_time_avg_minutes INT NULL,
  status ENUM('pending','active','paused','suspended') DEFAULT 'pending',
  verified_at DATETIME NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_service_pros_company (workspace_id, company_id),
  INDEX idx_service_pros_status (workspace_id, status),
  INDEX idx_service_pros_rating (workspace_id, avg_rating)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Provider Preferences
CREATE TABLE IF NOT EXISTS pro_preferences (
  id INT AUTO_INCREMENT PRIMARY KEY,
  workspace_id INT NOT NULL,
  company_id INT NOT NULL,
  min_budget DECIMAL(10,2) DEFAULT 0,
  max_budget DECIMAL(10,2) NULL,
  max_radius_km DECIMAL(6,2) DEFAULT 25.0,
  max_leads_per_day INT DEFAULT 10,
  max_leads_per_week INT DEFAULT 50,
  preferred_timing JSON NULL,
  excluded_days JSON NULL,
  notify_email TINYINT(1) DEFAULT 1,
  notify_sms TINYINT(1) DEFAULT 0,
  notify_push TINYINT(1) DEFAULT 1,
  instant_accept TINYINT(1) DEFAULT 0,
  auto_decline_below_budget TINYINT(1) DEFAULT 0,
  auto_recharge_enabled TINYINT(1) DEFAULT 0,
  auto_recharge_threshold DECIMAL(10,2) DEFAULT 0,
  auto_recharge_amount DECIMAL(10,2) DEFAULT 0,
  pause_when_balance_zero TINYINT(1) DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_pro_preferences (workspace_id, company_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Provider Service Areas
CREATE TABLE IF NOT EXISTS service_areas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  workspace_id INT NOT NULL,
  company_id INT NOT NULL,
  area_type ENUM('radius','postal','city','region','polygon') DEFAULT 'radius',
  city VARCHAR(191) NULL,
  region VARCHAR(191) NULL,
  country VARCHAR(64) DEFAULT 'US',
  postal_code VARCHAR(32) NULL,
  latitude DECIMAL(10,7) NULL,
  longitude DECIMAL(10,7) NULL,
  radius_km DECIMAL(6,2) DEFAULT 25.0,
  polygon_geojson JSON NULL,
  is_primary TINYINT(1) DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_service_areas_company (workspace_id, company_id),
  INDEX idx_service_areas_postal (workspace_id, postal_code),
  INDEX idx_service_areas_coords (workspace_id, latitude, longitude)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Provider Service Offerings (which categories they serve)
CREATE TABLE IF NOT EXISTS service_pro_offerings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  workspace_id INT NOT NULL,
  company_id INT NOT NULL,
  service_id INT NOT NULL,
  min_price DECIMAL(10,2) NULL,
  max_price DECIMAL(10,2) NULL,
  price_type ENUM('fixed','hourly','estimate','free') DEFAULT 'estimate',
  experience_years INT NULL,
  certifications JSON NULL,
  is_featured TINYINT(1) DEFAULT 0,
  is_active TINYINT(1) DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_pro_offerings (workspace_id, company_id, service_id),
  INDEX idx_pro_offerings_service (workspace_id, service_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Lead Requests (consumer intake)
CREATE TABLE IF NOT EXISTS lead_requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  workspace_id INT NOT NULL,
  external_id VARCHAR(64) NULL,
  source ENUM('form','api','import','referral') DEFAULT 'form',
  source_url VARCHAR(500) NULL,
  source_form_id INT NULL,
  utm_source VARCHAR(100) NULL,
  utm_medium VARCHAR(100) NULL,
  utm_campaign VARCHAR(100) NULL,
  consumer_name VARCHAR(191) NULL,
  consumer_email VARCHAR(191) NULL,
  consumer_phone VARCHAR(64) NULL,
  consumer_alt_phone VARCHAR(64) NULL,
  address_line1 VARCHAR(255) NULL,
  address_line2 VARCHAR(255) NULL,
  city VARCHAR(191) NULL,
  region VARCHAR(191) NULL,
  country VARCHAR(64) DEFAULT 'US',
  postal_code VARCHAR(32) NULL,
  latitude DECIMAL(10,7) NULL,
  longitude DECIMAL(10,7) NULL,
  budget_min DECIMAL(10,2) NULL,
  budget_max DECIMAL(10,2) NULL,
  timing ENUM('asap','within_24h','within_week','flexible','scheduled') DEFAULT 'flexible',
  scheduled_date DATE NULL,
  scheduled_time_start TIME NULL,
  scheduled_time_end TIME NULL,
  title VARCHAR(255) NULL,
  description TEXT NULL,
  property_type ENUM('residential','commercial','industrial','other') NULL,
  property_size VARCHAR(64) NULL,
  media JSON NULL,
  answers JSON NULL,
  consent_contact TINYINT(1) DEFAULT 1,
  consent_marketing TINYINT(1) DEFAULT 0,
  ip_address VARCHAR(45) NULL,
  user_agent TEXT NULL,
  device_fingerprint VARCHAR(64) NULL,
  status ENUM('new','routing','routed','partial','closed','expired','spam','duplicate') DEFAULT 'new',
  quality_score DECIMAL(5,2) NULL,
  is_exclusive TINYINT(1) DEFAULT 0,
  max_sold_count INT DEFAULT 3,
  current_sold_count INT DEFAULT 0,
  lead_price_base DECIMAL(10,2) NULL,
  lead_price_final DECIMAL(10,2) NULL,
  routed_at DATETIME NULL,
  expires_at DATETIME NULL,
  closed_at DATETIME NULL,
  closed_reason VARCHAR(100) NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_lead_requests_status (workspace_id, status, created_at),
  INDEX idx_lead_requests_consumer (workspace_id, consumer_phone),
  INDEX idx_lead_requests_email (workspace_id, consumer_email),
  INDEX idx_lead_requests_postal (workspace_id, postal_code),
  INDEX idx_lead_requests_coords (workspace_id, latitude, longitude),
  INDEX idx_lead_requests_timing (workspace_id, timing),
  INDEX idx_lead_requests_expires (workspace_id, expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Lead Request Services (categories requested)
CREATE TABLE IF NOT EXISTS lead_request_services (
  id INT AUTO_INCREMENT PRIMARY KEY,
  workspace_id INT NOT NULL,
  lead_request_id INT NOT NULL,
  service_id INT NOT NULL,
  quantity INT DEFAULT 1,
  notes TEXT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_lead_request_services (workspace_id, lead_request_id),
  INDEX idx_lead_request_services_svc (workspace_id, service_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Lead Matches (lead → provider assignments)
CREATE TABLE IF NOT EXISTS lead_matches (
  id INT AUTO_INCREMENT PRIMARY KEY,
  workspace_id INT NOT NULL,
  lead_request_id INT NOT NULL,
  company_id INT NOT NULL,
  pro_id INT NULL,
  match_score DECIMAL(5,2) NULL,
  match_reason JSON NULL,
  distance_km DECIMAL(6,2) NULL,
  lead_price DECIMAL(10,2) NOT NULL,
  status ENUM('offered','viewed','accepted','declined','expired','won','lost','disputed','refunded') DEFAULT 'offered',
  offered_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  viewed_at DATETIME NULL,
  accepted_at DATETIME NULL,
  declined_at DATETIME NULL,
  declined_reason VARCHAR(255) NULL,
  won_at DATETIME NULL,
  won_value DECIMAL(10,2) NULL,
  lost_at DATETIME NULL,
  lost_reason VARCHAR(255) NULL,
  expires_at DATETIME NULL,
  response_time_minutes INT NULL,
  credit_transaction_id INT NULL,
  refund_transaction_id INT NULL,
  notes TEXT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_lead_matches (workspace_id, lead_request_id, company_id),
  INDEX idx_lead_matches_company (workspace_id, company_id, status),
  INDEX idx_lead_matches_lead (workspace_id, lead_request_id),
  INDEX idx_lead_matches_status (workspace_id, status),
  INDEX idx_lead_matches_expires (workspace_id, expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Lead Quotes (messages/quotes from providers)
CREATE TABLE IF NOT EXISTS lead_quotes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  workspace_id INT NOT NULL,
  lead_match_id INT NOT NULL,
  lead_request_id INT NOT NULL,
  company_id INT NOT NULL,
  quote_type ENUM('message','quote','question','update') DEFAULT 'message',
  message TEXT NULL,
  price_min DECIMAL(10,2) NULL,
  price_max DECIMAL(10,2) NULL,
  price_type ENUM('fixed','estimate','hourly','free') DEFAULT 'estimate',
  eta VARCHAR(100) NULL,
  availability_notes VARCHAR(255) NULL,
  attachments JSON NULL,
  is_from_consumer TINYINT(1) DEFAULT 0,
  read_at DATETIME NULL,
  created_by INT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_lead_quotes_match (workspace_id, lead_match_id),
  INDEX idx_lead_quotes_lead (workspace_id, lead_request_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Lead Pricing Rules
CREATE TABLE IF NOT EXISTS lead_pricing_rules (
  id INT AUTO_INCREMENT PRIMARY KEY,
  workspace_id INT NOT NULL,
  name VARCHAR(191) NULL,
  service_id INT NULL,
  region VARCHAR(191) NULL,
  postal_code VARCHAR(32) NULL,
  city VARCHAR(191) NULL,
  country VARCHAR(64) NULL,
  timing ENUM('asap','within_24h','within_week','flexible','scheduled') NULL,
  budget_min DECIMAL(10,2) NULL,
  budget_max DECIMAL(10,2) NULL,
  property_type ENUM('residential','commercial','industrial','other') NULL,
  is_exclusive TINYINT(1) NULL,
  base_price DECIMAL(10,2) NOT NULL,
  surge_multiplier DECIMAL(6,2) DEFAULT 1.0,
  exclusive_multiplier DECIMAL(6,2) DEFAULT 3.0,
  min_price DECIMAL(10,2) NULL,
  max_price DECIMAL(10,2) NULL,
  priority INT DEFAULT 0,
  is_active TINYINT(1) DEFAULT 1,
  valid_from DATETIME NULL,
  valid_until DATETIME NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_pricing_rules_service (workspace_id, service_id),
  INDEX idx_pricing_rules_postal (workspace_id, postal_code),
  INDEX idx_pricing_rules_active (workspace_id, is_active, priority)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Credits Wallets
CREATE TABLE IF NOT EXISTS credits_wallets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  workspace_id INT NOT NULL,
  company_id INT NOT NULL,
  balance DECIMAL(10,2) DEFAULT 0,
  lifetime_purchased DECIMAL(10,2) DEFAULT 0,
  lifetime_spent DECIMAL(10,2) DEFAULT 0,
  lifetime_refunded DECIMAL(10,2) DEFAULT 0,
  last_purchase_at DATETIME NULL,
  last_charge_at DATETIME NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_credits_wallets (workspace_id, company_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Credit Transactions
CREATE TABLE IF NOT EXISTS credit_transactions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  workspace_id INT NOT NULL,
  company_id INT NOT NULL,
  wallet_id INT NOT NULL,
  lead_match_id INT NULL,
  lead_request_id INT NULL,
  type ENUM('purchase','charge','refund','adjustment','bonus','promo') NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  balance_before DECIMAL(10,2) NOT NULL,
  balance_after DECIMAL(10,2) NOT NULL,
  description VARCHAR(255) NULL,
  payment_provider ENUM('stripe','paypal','manual') NULL,
  payment_id VARCHAR(100) NULL,
  payment_status ENUM('pending','completed','failed','refunded') NULL,
  invoice_id VARCHAR(100) NULL,
  promo_code VARCHAR(50) NULL,
  meta JSON NULL,
  created_by INT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_credit_transactions_wallet (workspace_id, wallet_id, created_at),
  INDEX idx_credit_transactions_company (workspace_id, company_id, created_at),
  INDEX idx_credit_transactions_lead (workspace_id, lead_match_id),
  INDEX idx_credit_transactions_payment (payment_provider, payment_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Credit Packages (purchasable bundles)
CREATE TABLE IF NOT EXISTS credit_packages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  workspace_id INT NOT NULL,
  name VARCHAR(191) NOT NULL,
  description TEXT NULL,
  credits_amount DECIMAL(10,2) NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  bonus_credits DECIMAL(10,2) DEFAULT 0,
  discount_percent DECIMAL(5,2) DEFAULT 0,
  is_popular TINYINT(1) DEFAULT 0,
  is_active TINYINT(1) DEFAULT 1,
  sort_order INT DEFAULT 0,
  stripe_price_id VARCHAR(100) NULL,
  paypal_plan_id VARCHAR(100) NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_credit_packages (workspace_id, is_active, sort_order),
  UNIQUE KEY unique_credit_package (workspace_id, name, sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Promo Codes
CREATE TABLE IF NOT EXISTS promo_codes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  workspace_id INT NOT NULL,
  code VARCHAR(50) NOT NULL,
  description VARCHAR(255) NULL,
  discount_type ENUM('percent','fixed','credits') NOT NULL,
  discount_value DECIMAL(10,2) NOT NULL,
  min_purchase DECIMAL(10,2) NULL,
  max_uses INT NULL,
  max_uses_per_user INT DEFAULT 1,
  current_uses INT DEFAULT 0,
  valid_from DATETIME NULL,
  valid_until DATETIME NULL,
  is_active TINYINT(1) DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_promo_codes (workspace_id, code),
  INDEX idx_promo_codes_active (workspace_id, is_active, code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Reviews
CREATE TABLE IF NOT EXISTS marketplace_reviews (
  id INT AUTO_INCREMENT PRIMARY KEY,
  workspace_id INT NOT NULL,
  company_id INT NOT NULL,
  lead_request_id INT NULL,
  lead_match_id INT NULL,
  reviewer_name VARCHAR(191) NULL,
  reviewer_email VARCHAR(191) NULL,
  reviewer_phone VARCHAR(64) NULL,
  rating TINYINT NOT NULL,
  title VARCHAR(255) NULL,
  comment TEXT NULL,
  pros TEXT NULL,
  cons TEXT NULL,
  photos JSON NULL,
  is_verified TINYINT(1) DEFAULT 0,
  verified_at DATETIME NULL,
  is_featured TINYINT(1) DEFAULT 0,
  is_public TINYINT(1) DEFAULT 1,
  response TEXT NULL,
  response_at DATETIME NULL,
  response_by INT NULL,
  status ENUM('pending','approved','rejected','flagged') DEFAULT 'pending',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_reviews_company (workspace_id, company_id, status),
  INDEX idx_reviews_lead (workspace_id, lead_request_id),
  INDEX idx_reviews_rating (workspace_id, company_id, rating)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Lead Activity Log
CREATE TABLE IF NOT EXISTS lead_activity_log (
  id INT AUTO_INCREMENT PRIMARY KEY,
  workspace_id INT NOT NULL,
  lead_request_id INT NOT NULL,
  lead_match_id INT NULL,
  company_id INT NULL,
  activity_type VARCHAR(50) NOT NULL,
  description VARCHAR(255) NULL,
  meta JSON NULL,
  ip_address VARCHAR(45) NULL,
  user_agent TEXT NULL,
  created_by INT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_lead_activity (workspace_id, lead_request_id, created_at),
  INDEX idx_lead_activity_match (workspace_id, lead_match_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Routing Queue (for async processing)
CREATE TABLE IF NOT EXISTS lead_routing_queue (
  id INT AUTO_INCREMENT PRIMARY KEY,
  workspace_id INT NOT NULL,
  lead_request_id INT NOT NULL,
  status ENUM('pending','processing','completed','failed') DEFAULT 'pending',
  attempts INT DEFAULT 0,
  max_attempts INT DEFAULT 3,
  last_error TEXT NULL,
  scheduled_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  started_at DATETIME NULL,
  completed_at DATETIME NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_routing_queue_status (workspace_id, status, scheduled_at),
  INDEX idx_routing_queue_lead (workspace_id, lead_request_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dedupe Log
CREATE TABLE IF NOT EXISTS lead_dedupe_log (
  id INT AUTO_INCREMENT PRIMARY KEY,
  workspace_id INT NOT NULL,
  lead_request_id INT NOT NULL,
  original_lead_id INT NULL,
  dedupe_key VARCHAR(255) NOT NULL,
  dedupe_type ENUM('phone','email','fingerprint','address') NOT NULL,
  action ENUM('blocked','merged','flagged') NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_dedupe_log (workspace_id, dedupe_key, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed default service categories
INSERT INTO service_catalog (workspace_id, parent_id, name, slug, icon, sort_order) VALUES
(1, NULL, 'Home Services', 'home-services', 'home', 1),
(1, NULL, 'Professional Services', 'professional-services', 'briefcase', 2),
(1, NULL, 'Health & Wellness', 'health-wellness', 'heart', 3),
(1, NULL, 'Events & Entertainment', 'events-entertainment', 'calendar', 4),
(1, NULL, 'Automotive', 'automotive', 'car', 5),
(1, NULL, 'Education & Training', 'education-training', 'graduation-cap', 6)
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- Seed subcategories for Home Services
INSERT INTO service_catalog (workspace_id, parent_id, name, slug, icon, sort_order) VALUES
(1, 1, 'Plumbing', 'plumbing', 'droplet', 1),
(1, 1, 'Electrical', 'electrical', 'zap', 2),
(1, 1, 'HVAC', 'hvac', 'thermometer', 3),
(1, 1, 'Roofing', 'roofing', 'home', 4),
(1, 1, 'Landscaping', 'landscaping', 'tree', 5),
(1, 1, 'Cleaning', 'cleaning', 'sparkles', 6),
(1, 1, 'Painting', 'painting', 'paintbrush', 7),
(1, 1, 'Flooring', 'flooring', 'square', 8),
(1, 1, 'Pest Control', 'pest-control', 'bug', 9),
(1, 1, 'Handyman', 'handyman', 'wrench', 10)
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- Seed default pricing rules
INSERT INTO lead_pricing_rules (workspace_id, name, service_id, base_price, surge_multiplier, exclusive_multiplier, priority, is_active) VALUES
(1, 'Default Pricing', NULL, 25.00, 1.0, 3.0, 0, 1),
(1, 'ASAP Surge', NULL, 25.00, 1.5, 3.0, 10, 1),
(1, 'High Budget Premium', NULL, 35.00, 1.0, 3.0, 5, 1)
ON DUPLICATE KEY UPDATE base_price = VALUES(base_price);

-- Seed default credit packages
INSERT INTO credit_packages (workspace_id, name, description, credits_amount, price, bonus_credits, is_popular, sort_order) VALUES
(1, 'Starter', 'Get started with lead buying', 50.00, 50.00, 0, 0, 1),
(1, 'Growth', 'Most popular for growing businesses', 100.00, 95.00, 10.00, 1, 2),
(1, 'Professional', 'Best value for active pros', 250.00, 225.00, 35.00, 0, 3),
(1, 'Enterprise', 'High-volume lead buying', 500.00, 425.00, 100.00, 0, 4)
ON DUPLICATE KEY UPDATE price = VALUES(price);
