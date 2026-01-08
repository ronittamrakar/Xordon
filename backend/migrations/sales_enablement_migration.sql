-- Sales Enablement Module Migration
-- Created: 2024-12-21
-- Description: Creates tables for sales enablement features including
--              content library, playbooks, deal rooms, battle cards, training, and snippets

-- ============================================
-- SALES CONTENT LIBRARY
-- ============================================

CREATE TABLE IF NOT EXISTS sales_content (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    company_id INT,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    content_type ENUM('document', 'presentation', 'video', 'case_study', 'one_pager', 'battle_card', 'template', 'other') NOT NULL DEFAULT 'document',
    file_path VARCHAR(500),
    file_size INT,
    mime_type VARCHAR(100),
    external_url VARCHAR(500),
    thumbnail_path VARCHAR(500),
    buyer_personas JSON,
    sales_stages JSON,
    industries JSON,
    products JSON,
    tags JSON,
    version INT DEFAULT 1,
    is_active BOOLEAN DEFAULT TRUE,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_workspace (workspace_id),
    INDEX idx_type (content_type),
    INDEX idx_active (is_active),
    INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS sales_content_analytics (
    id INT AUTO_INCREMENT PRIMARY KEY,
    content_id INT NOT NULL,
    user_id INT,
    lead_id INT,
    action ENUM('view', 'download', 'share', 'embed') NOT NULL,
    action_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    context JSON,
    FOREIGN KEY (content_id) REFERENCES sales_content(id) ON DELETE CASCADE,
    INDEX idx_content (content_id),
    INDEX idx_date (action_date),
    INDEX idx_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- SALES PLAYBOOKS
-- ============================================

CREATE TABLE IF NOT EXISTS sales_playbooks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    company_id INT,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    target_persona JSON,
    applicable_stages JSON,
    is_published BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_workspace (workspace_id),
    INDEX idx_published (is_published),
    INDEX idx_category (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS playbook_sections (
    id INT AUTO_INCREMENT PRIMARY KEY,
    playbook_id INT NOT NULL,
    section_type ENUM('overview', 'process', 'discovery', 'objections', 'scripts', 'resources', 'metrics', 'custom') NOT NULL DEFAULT 'custom',
    title VARCHAR(255) NOT NULL,
    content TEXT,
    order_index INT DEFAULT 0,
    FOREIGN KEY (playbook_id) REFERENCES sales_playbooks(id) ON DELETE CASCADE,
    INDEX idx_playbook (playbook_id),
    INDEX idx_order (order_index)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS playbook_resources (
    id INT AUTO_INCREMENT PRIMARY KEY,
    playbook_id INT NOT NULL,
    section_id INT,
    resource_type ENUM('content', 'template', 'automation', 'link') NOT NULL,
    resource_id INT,
    resource_url VARCHAR(500),
    title VARCHAR(255),
    FOREIGN KEY (playbook_id) REFERENCES sales_playbooks(id) ON DELETE CASCADE,
    INDEX idx_playbook (playbook_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- DIGITAL SALES ROOMS (DEAL ROOMS)
-- ============================================

CREATE TABLE IF NOT EXISTS deal_rooms (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    company_id INT,
    lead_id INT,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE,
    description TEXT,
    buyer_name VARCHAR(255),
    buyer_email VARCHAR(255),
    buyer_company VARCHAR(255),
    welcome_message TEXT,
    branding JSON,
    is_active BOOLEAN DEFAULT TRUE,
    expires_at TIMESTAMP NULL,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_workspace (workspace_id),
    INDEX idx_slug (slug),
    INDEX idx_lead (lead_id),
    INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS deal_room_content (
    id INT AUTO_INCREMENT PRIMARY KEY,
    deal_room_id INT NOT NULL,
    content_id INT,
    custom_title VARCHAR(255),
    custom_description TEXT,
    order_index INT DEFAULT 0,
    is_visible BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (deal_room_id) REFERENCES deal_rooms(id) ON DELETE CASCADE,
    INDEX idx_room (deal_room_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS deal_room_analytics (
    id INT AUTO_INCREMENT PRIMARY KEY,
    deal_room_id INT NOT NULL,
    visitor_email VARCHAR(255),
    visitor_name VARCHAR(255),
    content_id INT,
    action ENUM('page_view', 'content_view', 'content_download', 'link_click') NOT NULL,
    time_spent_seconds INT,
    action_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(50),
    user_agent TEXT,
    FOREIGN KEY (deal_room_id) REFERENCES deal_rooms(id) ON DELETE CASCADE,
    INDEX idx_room (deal_room_id),
    INDEX idx_date (action_date),
    INDEX idx_visitor (visitor_email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- BATTLE CARDS (COMPETITIVE INTELLIGENCE)
-- ============================================

CREATE TABLE IF NOT EXISTS battle_cards (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    company_id INT,
    competitor_name VARCHAR(255) NOT NULL,
    competitor_logo VARCHAR(500),
    competitor_website VARCHAR(500),
    overview TEXT,
    strengths JSON,
    weaknesses JSON,
    pricing_info TEXT,
    feature_comparison JSON,
    objection_handlers JSON,
    win_strategies TEXT,
    tags JSON,
    is_active BOOLEAN DEFAULT TRUE,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_workspace (workspace_id),
    INDEX idx_competitor (competitor_name),
    INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- SALES TRAINING
-- ============================================

CREATE TABLE IF NOT EXISTS sales_training_programs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    company_id INT,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    program_type ENUM('onboarding', 'product', 'skills', 'certification', 'custom') NOT NULL DEFAULT 'custom',
    duration_days INT,
    is_required BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_workspace (workspace_id),
    INDEX idx_type (program_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS training_modules (
    id INT AUTO_INCREMENT PRIMARY KEY,
    program_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    content_type ENUM('video', 'document', 'quiz', 'exercise', 'assessment') NOT NULL DEFAULT 'document',
    content_url VARCHAR(500),
    content_data JSON,
    order_index INT DEFAULT 0,
    duration_minutes INT,
    passing_score INT,
    FOREIGN KEY (program_id) REFERENCES sales_training_programs(id) ON DELETE CASCADE,
    INDEX idx_program (program_id),
    INDEX idx_order (order_index)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS training_progress (
    id INT AUTO_INCREMENT PRIMARY KEY,
    program_id INT NOT NULL,
    module_id INT,
    user_id INT NOT NULL,
    status ENUM('not_started', 'in_progress', 'completed', 'failed') DEFAULT 'not_started',
    score INT,
    started_at TIMESTAMP NULL,
    completed_at TIMESTAMP NULL,
    attempts INT DEFAULT 0,
    FOREIGN KEY (program_id) REFERENCES sales_training_programs(id) ON DELETE CASCADE,
    INDEX idx_user (user_id),
    INDEX idx_program (program_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- SALES SNIPPETS
-- ============================================

CREATE TABLE IF NOT EXISTS sales_snippets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    company_id INT,
    snippet_type ENUM('email', 'sms', 'call_script', 'meeting_agenda', 'follow_up') NOT NULL DEFAULT 'email',
    name VARCHAR(255) NOT NULL,
    shortcut VARCHAR(50),
    content TEXT NOT NULL,
    variables JSON,
    category VARCHAR(100),
    use_count INT DEFAULT 0,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_workspace (workspace_id),
    INDEX idx_type (snippet_type),
    INDEX idx_shortcut (shortcut),
    INDEX idx_category (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- MUTUAL ACTION PLANS
-- ============================================

CREATE TABLE IF NOT EXISTS mutual_action_plans (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    company_id INT,
    lead_id INT,
    deal_room_id INT,
    name VARCHAR(255) NOT NULL,
    target_close_date DATE,
    status ENUM('draft', 'active', 'completed', 'cancelled') DEFAULT 'draft',
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_workspace (workspace_id),
    INDEX idx_lead (lead_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS mutual_action_plan_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    plan_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    owner_type ENUM('seller', 'buyer') NOT NULL DEFAULT 'seller',
    owner_name VARCHAR(255),
    due_date DATE,
    is_completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMP NULL,
    order_index INT DEFAULT 0,
    FOREIGN KEY (plan_id) REFERENCES mutual_action_plans(id) ON DELETE CASCADE,
    INDEX idx_plan (plan_id),
    INDEX idx_completed (is_completed)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
