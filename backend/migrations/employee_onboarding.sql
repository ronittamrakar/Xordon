-- Migration: Add Employee Documents and Onboarding
-- Description: Tables for HR document management and onboarding workflows

CREATE TABLE IF NOT EXISTS employee_documents (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    user_id INT NOT NULL,
    file_id INT NOT NULL, -- Reference to files table
    document_type ENUM('contract', 'id_proof', 'tax_form', 'certification', 'other') NOT NULL,
    title VARCHAR(255) NOT NULL,
    expiry_date DATE NULL,
    status ENUM('pending', 'verified', 'expired', 'rejected') DEFAULT 'pending',
    notes TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX (workspace_id, user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS onboarding_checklists (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT NULL,
    is_active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX (workspace_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS onboarding_tasks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    checklist_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NULL,
    due_days_after_start INT DEFAULT 0,
    is_required TINYINT(1) DEFAULT 1,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX (checklist_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS employee_onboarding_status (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    user_id INT NOT NULL,
    checklist_id INT NOT NULL,
    task_id INT NOT NULL,
    status ENUM('pending', 'completed', 'skipped') DEFAULT 'pending',
    completed_at TIMESTAMP NULL,
    completed_by INT NULL,
    notes TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY (user_id, task_id),
    INDEX (workspace_id, user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
