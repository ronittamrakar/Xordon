-- CRM Enhancements Database Schema
-- Migration for lead scoring, sequences, meetings, conversation intelligence,
-- intent data, pipeline, playbooks, notifications, attribution, and automations

-- =====================================================
-- LEAD SCORING TABLES
-- =====================================================

-- Lead scores table - stores calculated scores for contacts
CREATE TABLE IF NOT EXISTS lead_scores (
  id INT AUTO_INCREMENT PRIMARY KEY,
  contact_id INT NOT NULL,
  score INT NOT NULL CHECK (score >= 0 AND score <= 100),
  factors JSON NOT NULL,
  calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE,
  INDEX idx_lead_scores_contact (contact_id),
  INDEX idx_lead_scores_score (score DESC),
  INDEX idx_lead_scores_calculated (calculated_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Score changes table - audit log for score changes > 10 points
CREATE TABLE IF NOT EXISTS score_changes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  contact_id INT NOT NULL,
  previous_score INT NOT NULL,
  new_score INT NOT NULL,
  triggering_signal VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE,
  INDEX idx_score_changes_contact (contact_id),
  INDEX idx_score_changes_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Signal weights configuration table
CREATE TABLE IF NOT EXISTS signal_weights (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  email_opens INT DEFAULT 5 CHECK (email_opens >= 0 AND email_opens <= 100),
  link_clicks INT DEFAULT 10 CHECK (link_clicks >= 0 AND link_clicks <= 100),
  call_duration INT DEFAULT 15 CHECK (call_duration >= 0 AND call_duration <= 100),
  form_submissions INT DEFAULT 20 CHECK (form_submissions >= 0 AND form_submissions <= 100),
  reply_sentiment INT DEFAULT 25 CHECK (reply_sentiment >= 0 AND reply_sentiment <= 100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_weights (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- =====================================================
-- MULTI-CHANNEL SEQUENCE TABLES
-- =====================================================

-- Sequences table - multi-channel outreach sequences
CREATE TABLE IF NOT EXISTS sequences (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  steps JSON NOT NULL,
  conditions JSON,
  status ENUM('active', 'paused', 'archived') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_sequences_user (user_id),
  INDEX idx_sequences_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Sequence executions table - tracks sequence progress per contact
CREATE TABLE IF NOT EXISTS sequence_executions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  sequence_id INT NOT NULL,
  contact_id INT NOT NULL,
  current_step INT DEFAULT 0,
  status ENUM('active', 'paused', 'completed', 'failed') DEFAULT 'active',
  started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP NULL,
  last_step_at TIMESTAMP NULL,
  next_step_at TIMESTAMP NULL,
  FOREIGN KEY (sequence_id) REFERENCES sequences(id) ON DELETE CASCADE,
  FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE,
  UNIQUE KEY unique_sequence_contact (sequence_id, contact_id),
  INDEX idx_sequence_executions_status (status),
  INDEX idx_sequence_executions_next (next_step_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Sequence step logs - tracks individual step executions
CREATE TABLE IF NOT EXISTS sequence_step_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  execution_id INT NOT NULL,
  step_index INT NOT NULL,
  step_type ENUM('email', 'sms', 'linkedin_connect', 'linkedin_message', 'call') NOT NULL,
  status ENUM('pending', 'sent', 'delivered', 'opened', 'clicked', 'replied', 'failed') DEFAULT 'pending',
  metadata JSON,
  executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (execution_id) REFERENCES sequence_executions(id) ON DELETE CASCADE,
  INDEX idx_step_logs_execution (execution_id),
  INDEX idx_step_logs_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- MEETING SCHEDULER TABLES
-- =====================================================

-- Meetings table
CREATE TABLE IF NOT EXISTS meetings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  contact_id INT NOT NULL,
  user_id INT NOT NULL,
  calendar_event_id VARCHAR(255),
  calendar_provider ENUM('google', 'outlook') NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  scheduled_at TIMESTAMP NOT NULL,
  duration_minutes INT DEFAULT 30,
  location VARCHAR(500),
  meeting_link VARCHAR(500),
  status ENUM('scheduled', 'confirmed', 'cancelled', 'rescheduled', 'completed', 'no_show') DEFAULT 'scheduled',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_meetings_contact (contact_id),
  INDEX idx_meetings_user (user_id),
  INDEX idx_meetings_scheduled (scheduled_at),
  INDEX idx_meetings_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Meeting reminders table
CREATE TABLE IF NOT EXISTS meeting_reminders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  meeting_id INT NOT NULL,
  remind_at TIMESTAMP NOT NULL,
  reminder_type ENUM('email', 'sms', 'notification') DEFAULT 'notification',
  sent BOOLEAN DEFAULT FALSE,
  sent_at TIMESTAMP NULL,
  FOREIGN KEY (meeting_id) REFERENCES meetings(id) ON DELETE CASCADE,
  INDEX idx_meeting_reminders_remind (remind_at),
  INDEX idx_meeting_reminders_sent (sent)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Calendar connections table
CREATE TABLE IF NOT EXISTS calendar_connections (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  provider ENUM('google', 'outlook') NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  token_expires_at TIMESTAMP NULL,
  calendar_id VARCHAR(255),
  status ENUM('active', 'expired', 'revoked') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_provider (user_id, provider),
  INDEX idx_calendar_connections_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- =====================================================
-- CONVERSATION INTELLIGENCE TABLES
-- =====================================================

-- Call transcriptions table
CREATE TABLE IF NOT EXISTS call_transcriptions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  call_id INT NOT NULL,
  text LONGTEXT,
  speakers JSON,
  status ENUM('pending', 'processing', 'completed', 'failed') DEFAULT 'pending',
  failure_reason TEXT,
  duration_seconds INT,
  word_count INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP NULL,
  FOREIGN KEY (call_id) REFERENCES call_logs(id) ON DELETE CASCADE,
  INDEX idx_transcriptions_call (call_id),
  INDEX idx_transcriptions_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Call analyses table
CREATE TABLE IF NOT EXISTS call_analyses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  transcription_id INT NOT NULL,
  sentiment_score DECIMAL(4,3) CHECK (sentiment_score >= -1 AND sentiment_score <= 1),
  intent_score INT CHECK (intent_score >= 0 AND intent_score <= 100),
  key_phrases JSON,
  objections JSON,
  buying_signals JSON,
  topics JSON,
  talk_ratio DECIMAL(5,2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (transcription_id) REFERENCES call_transcriptions(id) ON DELETE CASCADE,
  INDEX idx_analyses_transcription (transcription_id),
  INDEX idx_analyses_sentiment (sentiment_score),
  INDEX idx_analyses_intent (intent_score)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- INTENT DATA TABLES
-- =====================================================

-- Intent signals table
CREATE TABLE IF NOT EXISTS intent_signals (
  id INT AUTO_INCREMENT PRIMARY KEY,
  contact_id INT,
  topic VARCHAR(255) NOT NULL,
  strength ENUM('low', 'medium', 'high') NOT NULL,
  source VARCHAR(100) NOT NULL,
  source_url VARCHAR(500),
  detected_at TIMESTAMP NOT NULL,
  is_stale BOOLEAN DEFAULT FALSE,
  match_type ENUM('email_domain', 'company_name', 'manual') NULL,
  match_confidence DECIMAL(3,2),
  metadata JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE SET NULL,
  INDEX idx_intent_signals_contact (contact_id),
  INDEX idx_intent_signals_strength (strength),
  INDEX idx_intent_signals_stale (is_stale),
  INDEX idx_intent_signals_detected (detected_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Intent data providers configuration
CREATE TABLE IF NOT EXISTS intent_providers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  provider_name VARCHAR(100) NOT NULL,
  api_key TEXT,
  api_endpoint VARCHAR(500),
  status ENUM('active', 'inactive', 'error') DEFAULT 'active',
  last_sync_at TIMESTAMP NULL,
  sync_frequency_hours INT DEFAULT 24,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_intent_providers_user (user_id),
  INDEX idx_intent_providers_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- PIPELINE & DEALS TABLES
-- =====================================================

-- Deals table
CREATE TABLE IF NOT EXISTS deals (
  id INT AUTO_INCREMENT PRIMARY KEY,
  contact_id INT NOT NULL,
  user_id INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  value DECIMAL(15,2) DEFAULT 0,
  currency VARCHAR(3) DEFAULT 'USD',
  stage VARCHAR(50) NOT NULL,
  probability INT DEFAULT 0 CHECK (probability >= 0 AND probability <= 100),
  expected_close_date DATE,
  actual_close_date DATE,
  won BOOLEAN NULL,
  loss_reason VARCHAR(255),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_deals_contact (contact_id),
  INDEX idx_deals_user (user_id),
  INDEX idx_deals_stage (stage),
  INDEX idx_deals_expected_close (expected_close_date),
  INDEX idx_deals_value (value)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Deal stage history for velocity tracking
CREATE TABLE IF NOT EXISTS deal_stage_history (
  id INT AUTO_INCREMENT PRIMARY KEY,
  deal_id INT NOT NULL,
  from_stage VARCHAR(50),
  to_stage VARCHAR(50) NOT NULL,
  changed_by INT,
  changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  days_in_previous_stage INT,
  FOREIGN KEY (deal_id) REFERENCES deals(id) ON DELETE CASCADE,
  FOREIGN KEY (changed_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_deal_history_deal (deal_id),
  INDEX idx_deal_history_changed (changed_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Pipeline stage configuration
CREATE TABLE IF NOT EXISTS pipeline_stages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  name VARCHAR(100) NOT NULL,
  display_order INT NOT NULL,
  probability INT DEFAULT 0 CHECK (probability >= 0 AND probability <= 100),
  color VARCHAR(7) DEFAULT '#6366f1',
  is_won_stage BOOLEAN DEFAULT FALSE,
  is_lost_stage BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_pipeline_stages_user (user_id),
  INDEX idx_pipeline_stages_order (display_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- =====================================================
-- PLAYBOOK TABLES
-- =====================================================

-- Playbooks table
CREATE TABLE IF NOT EXISTS playbooks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  persona VARCHAR(100),
  templates JSON NOT NULL,
  permissions JSON,
  status ENUM('active', 'archived') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_playbooks_user (user_id),
  INDEX idx_playbooks_persona (persona),
  INDEX idx_playbooks_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Playbook versions for version history
CREATE TABLE IF NOT EXISTS playbook_versions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  playbook_id INT NOT NULL,
  version INT NOT NULL,
  content JSON NOT NULL,
  change_summary VARCHAR(500),
  edited_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (playbook_id) REFERENCES playbooks(id) ON DELETE CASCADE,
  FOREIGN KEY (edited_by) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_playbook_versions_playbook (playbook_id),
  INDEX idx_playbook_versions_version (version)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- NOTIFICATION TABLES
-- =====================================================

-- Notification configurations
CREATE TABLE IF NOT EXISTS notification_configs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  provider ENUM('slack', 'teams') NOT NULL,
  channel_id VARCHAR(255) NOT NULL,
  channel_name VARCHAR(255),
  webhook_url TEXT,
  access_token TEXT,
  triggers JSON,
  status ENUM('active', 'inactive', 'error') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_notification_configs_user (user_id),
  INDEX idx_notification_configs_provider (provider),
  INDEX idx_notification_configs_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Notification logs
CREATE TABLE IF NOT EXISTS notification_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  config_id INT NOT NULL,
  notification_type VARCHAR(50) NOT NULL,
  title VARCHAR(255),
  message TEXT,
  actions JSON,
  metadata JSON,
  status ENUM('pending', 'sent', 'delivered', 'failed') DEFAULT 'pending',
  retry_count INT DEFAULT 0,
  error_message TEXT,
  sent_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (config_id) REFERENCES notification_configs(id) ON DELETE CASCADE,
  INDEX idx_notification_logs_config (config_id),
  INDEX idx_notification_logs_status (status),
  INDEX idx_notification_logs_type (notification_type),
  INDEX idx_notification_logs_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Notification action responses
CREATE TABLE IF NOT EXISTS notification_actions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  notification_log_id INT NOT NULL,
  action_id VARCHAR(100) NOT NULL,
  action_type ENUM('view', 'complete', 'snooze', 'custom') NOT NULL,
  response_data JSON,
  responded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (notification_log_id) REFERENCES notification_logs(id) ON DELETE CASCADE,
  INDEX idx_notification_actions_log (notification_log_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- ATTRIBUTION TABLES
-- =====================================================

-- Lead sources table
CREATE TABLE IF NOT EXISTS lead_sources (
  id INT AUTO_INCREMENT PRIMARY KEY,
  contact_id INT NOT NULL,
  source_type ENUM('form', 'call', 'campaign', 'referral', 'import', 'api', 'unknown') NOT NULL,
  source_id VARCHAR(255),
  campaign_id INT,
  form_id INT,
  utm_source VARCHAR(255),
  utm_medium VARCHAR(255),
  utm_campaign VARCHAR(255),
  utm_term VARCHAR(255),
  utm_content VARCHAR(255),
  referrer_url VARCHAR(500),
  landing_page VARCHAR(500),
  metadata JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE,
  INDEX idx_lead_sources_contact (contact_id),
  INDEX idx_lead_sources_type (source_type),
  INDEX idx_lead_sources_campaign (campaign_id),
  INDEX idx_lead_sources_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Touchpoints table for journey tracking
CREATE TABLE IF NOT EXISTS touchpoints (
  id INT AUTO_INCREMENT PRIMARY KEY,
  contact_id INT NOT NULL,
  channel ENUM('email', 'sms', 'call', 'form', 'linkedin', 'website', 'ad', 'referral', 'other') NOT NULL,
  action VARCHAR(100) NOT NULL,
  campaign_id INT,
  content_id VARCHAR(255),
  content_type VARCHAR(50),
  metadata JSON,
  revenue_attributed DECIMAL(15,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE,
  INDEX idx_touchpoints_contact (contact_id),
  INDEX idx_touchpoints_channel (channel),
  INDEX idx_touchpoints_campaign (campaign_id),
  INDEX idx_touchpoints_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- =====================================================
-- AUTOMATION ENGINE TABLES
-- =====================================================

-- Automations table
CREATE TABLE IF NOT EXISTS crm_automations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  trigger_type VARCHAR(50) NOT NULL,
  trigger_config JSON NOT NULL,
  conditions JSON,
  actions JSON NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  execution_count INT DEFAULT 0,
  last_executed_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_crm_automations_user (user_id),
  INDEX idx_crm_automations_trigger (trigger_type),
  INDEX idx_crm_automations_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Automation executions log
CREATE TABLE IF NOT EXISTS automation_executions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  automation_id INT NOT NULL,
  contact_id INT,
  trigger_context JSON,
  conditions_evaluated JSON,
  actions_taken JSON,
  status ENUM('success', 'partial', 'failed', 'skipped') NOT NULL,
  error_details TEXT,
  execution_time_ms INT,
  executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (automation_id) REFERENCES crm_automations(id) ON DELETE CASCADE,
  FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE SET NULL,
  INDEX idx_automation_executions_automation (automation_id),
  INDEX idx_automation_executions_contact (contact_id),
  INDEX idx_automation_executions_status (status),
  INDEX idx_automation_executions_executed (executed_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Automation action queue for async processing
CREATE TABLE IF NOT EXISTS automation_action_queue (
  id INT AUTO_INCREMENT PRIMARY KEY,
  execution_id INT NOT NULL,
  action_index INT NOT NULL,
  action_type VARCHAR(50) NOT NULL,
  action_config JSON NOT NULL,
  status ENUM('pending', 'processing', 'completed', 'failed') DEFAULT 'pending',
  attempts INT DEFAULT 0,
  max_attempts INT DEFAULT 3,
  error_message TEXT,
  scheduled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  started_at TIMESTAMP NULL,
  completed_at TIMESTAMP NULL,
  FOREIGN KEY (execution_id) REFERENCES automation_executions(id) ON DELETE CASCADE,
  INDEX idx_action_queue_status (status),
  INDEX idx_action_queue_scheduled (scheduled_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- MODULE MANAGEMENT TABLES
-- =====================================================

-- Modules registry
CREATE TABLE IF NOT EXISTS modules (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  version VARCHAR(20) DEFAULT '1.0.0',
  permissions JSON,
  default_roles JSON,
  dependencies JSON,
  status ENUM('active', 'inactive', 'deprecated') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_modules_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Module rollouts for phased deployment
CREATE TABLE IF NOT EXISTS module_rollouts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  module_id VARCHAR(50) NOT NULL,
  rollout_type ENUM('user', 'role', 'team', 'percentage', 'all') NOT NULL,
  targets JSON,
  percentage INT CHECK (percentage >= 0 AND percentage <= 100),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (module_id) REFERENCES modules(id) ON DELETE CASCADE,
  INDEX idx_module_rollouts_module (module_id),
  INDEX idx_module_rollouts_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Module user access cache for performance
CREATE TABLE IF NOT EXISTS module_user_access (
  id INT AUTO_INCREMENT PRIMARY KEY,
  module_id VARCHAR(50) NOT NULL,
  user_id INT NOT NULL,
  has_access BOOLEAN DEFAULT FALSE,
  computed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (module_id) REFERENCES modules(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_module_user (module_id, user_id),
  INDEX idx_module_user_access_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- LINKEDIN INTEGRATION TABLES
-- =====================================================

-- LinkedIn connections
CREATE TABLE IF NOT EXISTS linkedin_connections (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMP NULL,
  linkedin_user_id VARCHAR(100),
  profile_url VARCHAR(500),
  status ENUM('active', 'expired', 'revoked') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_linkedin_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- LinkedIn profile cache
CREATE TABLE IF NOT EXISTS linkedin_profiles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  contact_id INT NOT NULL,
  linkedin_url VARCHAR(500),
  linkedin_id VARCHAR(100),
  headline VARCHAR(500),
  company VARCHAR(255),
  title VARCHAR(255),
  location VARCHAR(255),
  industry VARCHAR(255),
  connections_count INT,
  profile_data JSON,
  last_synced_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE,
  UNIQUE KEY unique_linkedin_contact (contact_id),
  INDEX idx_linkedin_profiles_url (linkedin_url(255))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- LinkedIn message tracking
CREATE TABLE IF NOT EXISTS linkedin_messages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  contact_id INT NOT NULL,
  user_id INT NOT NULL,
  sequence_step_log_id INT,
  message_type ENUM('connection_request', 'message', 'inmail') NOT NULL,
  content TEXT,
  status ENUM('pending', 'sent', 'delivered', 'viewed', 'replied', 'failed') DEFAULT 'pending',
  external_message_id VARCHAR(255),
  sent_at TIMESTAMP NULL,
  viewed_at TIMESTAMP NULL,
  replied_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_linkedin_messages_contact (contact_id),
  INDEX idx_linkedin_messages_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
