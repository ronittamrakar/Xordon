-- Add project templates and template tasks tables
CREATE TABLE IF NOT EXISTS project_templates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NULL,
    workspace_id INT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(50),
    color VARCHAR(20) DEFAULT '#3B82F6',
    icon VARCHAR(50),
    estimated_duration VARCHAR(50),
    is_popular BOOLEAN DEFAULT FALSE,
    is_system BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX (workspace_id),
    INDEX (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS project_template_tasks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    template_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    task_type VARCHAR(50) DEFAULT 'other',
    priority ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium',
    delay_days INT DEFAULT 0,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (template_id) REFERENCES project_templates(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed default templates
INSERT INTO project_templates (name, description, category, color, icon, estimated_duration, is_popular, is_system) 
VALUES 
('Software Development', 'Agile development workflow with backlog, sprints, and code review stages.', 'Tech', '#3b82f6', 'Code', 'Short-term', TRUE, TRUE),
('Marketing Campaign', 'Comprehensive marketing launch template including social, email, and content planning.', 'Marketing', '#f59e0b', 'Megaphone', 'Medium-term', TRUE, TRUE),
('Client Onboarding', 'Standardized process for onboarding new clients and gathering requirements.', 'Service', '#10b981', 'Users', '2 weeks', FALSE, TRUE),
('Product Launch', 'Strategic roadmap for bringing a new product or feature to market.', 'Product', '#6366f1', 'Rocket', 'Quarterly', FALSE, TRUE),
('Content Calendar', 'Organize content production across blogs, videos, and newsletters.', 'Content', '#ec4899', 'Layout', 'Ongoing', FALSE, TRUE),
('Event Planning', 'Coordinate logistics, speakers, and attendees for webinars or physical events.', 'Operations', '#8b5cf6', 'ClipboardList', '1-3 months', FALSE, TRUE);

-- Seed tasks for Software Development (Template ID 1)
INSERT INTO project_template_tasks (template_id, title, description, task_type, priority, delay_days, sort_order)
VALUES 
(1, 'Project Kickoff', 'Brief the team on requirements and goals.', 'meeting', 'high', 0, 1),
(1, 'Environment Setup', 'Set up repositories, CI/CD, and hosting.', 'other', 'medium', 1, 2),
(1, 'Database Design', 'Design the schema and initial migrations.', 'other', 'high', 2, 3),
(1, 'API Development - Core', 'Implement core API endpoints.', 'other', 'high', 3, 4),
(1, 'UI/UX Mockups', 'Create wireframes for main views.', 'other', 'medium', 2, 5),
(1, 'Frontend Setup', 'Initialize project and set up components.', 'other', 'medium', 4, 6),
(1, 'First Sprint Review', 'Review progress with stakeholders.', 'meeting', 'medium', 14, 7);
