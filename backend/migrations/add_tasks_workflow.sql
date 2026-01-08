-- Tasks / Today's Actions Workflow

CREATE TABLE IF NOT EXISTS sales_tasks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    client_id INT DEFAULT NULL,
    assigned_to INT,
    contact_id INT,
    company_id INT,
    deal_id INT,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    task_type ENUM('call', 'email', 'sms', 'meeting', 'follow_up', 'demo', 'proposal', 'other') NOT NULL,
    priority ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium',
    status ENUM('pending', 'in_progress', 'completed', 'cancelled', 'deferred') DEFAULT 'pending',
    due_date DATETIME,
    due_time TIME,
    reminder_at DATETIME,
    completed_at DATETIME,
    outcome TEXT,
    outcome_type ENUM('successful', 'no_answer', 'voicemail', 'rescheduled', 'not_interested', 'other'),
    related_entity_type VARCHAR(50),
    related_entity_id INT,
    tags JSON,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_assigned_to (assigned_to),
    INDEX idx_contact_id (contact_id),
    INDEX idx_status (status),
    INDEX idx_due_date (due_date),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS task_templates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    task_type ENUM('call', 'email', 'sms', 'meeting', 'follow_up', 'demo', 'proposal', 'other') NOT NULL,
    default_priority ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium',
    default_duration_minutes INT DEFAULT 30,
    checklist JSON,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS task_sequences (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    trigger_event VARCHAR(100),
    steps JSON NOT NULL,
    status ENUM('active', 'paused', 'archived') DEFAULT 'active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS daily_goals (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    date DATE NOT NULL,
    calls_goal INT DEFAULT 0,
    calls_completed INT DEFAULT 0,
    emails_goal INT DEFAULT 0,
    emails_completed INT DEFAULT 0,
    meetings_goal INT DEFAULT 0,
    meetings_completed INT DEFAULT 0,
    tasks_goal INT DEFAULT 0,
    tasks_completed INT DEFAULT 0,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_user_date (user_id, date),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
