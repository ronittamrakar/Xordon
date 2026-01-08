-- Recruitment / ATS Tables

-- Job Openings
CREATE TABLE IF NOT EXISTS job_openings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    department VARCHAR(100) NOT NULL,
    location VARCHAR(255),
    employment_type ENUM('full-time', 'part-time', 'contract', 'intern', 'temporary') DEFAULT 'full-time',
    experience_level ENUM('entry-level', 'mid-level', 'senior', 'lead', 'executive') DEFAULT 'mid-level',
    salary_min DECIMAL(12, 2),
    salary_max DECIMAL(12, 2),
    description TEXT,
    requirements TEXT,
    responsibilities TEXT,
    benefits TEXT,
    positions_available INT DEFAULT 1,
    status ENUM('draft', 'published', 'closed', 'on-hold') DEFAULT 'draft',
    created_by INT,
    application_deadline DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_workspace (workspace_id),
    INDEX idx_status (status),
    INDEX idx_department (department),
    FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Candidates
CREATE TABLE IF NOT EXISTS candidates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    linkedin_url VARCHAR(500),
    portfolio_url VARCHAR(500),
    current_company VARCHAR(255),
    current_title VARCHAR(255),
    years_of_experience INT,
    skills TEXT,
    education TEXT,
    source ENUM('direct', 'referral', 'linkedin', 'indeed', 'glassdoor', 'agency', 'other') DEFAULT 'direct',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_workspace (workspace_id),
    INDEX idx_email (email),
    UNIQUE KEY unique_candidate_email (workspace_id, email),
    FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Job Applications
CREATE TABLE IF NOT EXISTS job_applications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    job_id INT NOT NULL,
    candidate_id INT NOT NULL,
    cover_letter TEXT,
    resume_file_id INT,
    current_stage ENUM('applied', 'screening', 'phone_screen', 'interview', 'technical', 'final_round', 'offer', 'hired', 'rejected') DEFAULT 'applied',
    status ENUM('new', 'in_progress', 'on_hold', 'hired', 'rejected') DEFAULT 'new',
    source ENUM('direct', 'referral', 'linkedin', 'indeed', 'glassdoor', 'agency', 'other') DEFAULT 'direct',
    rating INT,
    notes TEXT,
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_workspace (workspace_id),
    INDEX idx_job (job_id),
    INDEX idx_candidate (candidate_id),
    INDEX idx_status (status),
    INDEX idx_stage (current_stage),
    UNIQUE KEY unique_application (workspace_id, job_id, candidate_id),
    FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
    FOREIGN KEY (job_id) REFERENCES job_openings(id) ON DELETE CASCADE,
    FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE,
    FOREIGN KEY (resume_file_id) REFERENCES files(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Application Stage History
CREATE TABLE IF NOT EXISTS application_stage_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    application_id INT NOT NULL,
    stage VARCHAR(50) NOT NULL,
    changed_by INT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_application (application_id),
    FOREIGN KEY (application_id) REFERENCES job_applications(id) ON DELETE CASCADE,
    FOREIGN KEY (changed_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Interviews
CREATE TABLE IF NOT EXISTS interviews (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    application_id INT NOT NULL,
    interview_type ENUM('phone_screen', 'video', 'in_person', 'technical', 'panel', 'final') DEFAULT 'phone_screen',
    scheduled_at DATETIME NOT NULL,
    duration_minutes INT DEFAULT 60,
    location VARCHAR(255),
    meeting_link VARCHAR(500),
    interviewer_id INT,
    notes TEXT,
    feedback TEXT,
    rating INT,
    recommendation ENUM('strong_yes', 'yes', 'maybe', 'no', 'strong_no'),
    status ENUM('scheduled', 'completed', 'cancelled', 'no_show') DEFAULT 'scheduled',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_workspace (workspace_id),
    INDEX idx_application (application_id),
    INDEX idx_interviewer (interviewer_id),
    INDEX idx_scheduled (scheduled_at),
    INDEX idx_status (status),
    FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
    FOREIGN KEY (application_id) REFERENCES job_applications(id) ON DELETE CASCADE,
    FOREIGN KEY (interviewer_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
