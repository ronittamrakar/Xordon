-- Migration: Add Performance Reviews and Asset Tracking
-- Description: Tables for employee performance management and company asset tracking

CREATE TABLE IF NOT EXISTS performance_reviews (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    user_id INT NOT NULL,
    reviewer_id INT NOT NULL,
    review_date DATE NOT NULL,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    rating INT CHECK (rating >= 1 AND rating <= 5),
    summary TEXT NULL,
    strengths TEXT NULL,
    areas_for_improvement TEXT NULL,
    goals TEXT NULL,
    status ENUM('draft', 'submitted', 'acknowledged') DEFAULT 'draft',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX (workspace_id, user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS company_assets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    asset_name VARCHAR(255) NOT NULL,
    asset_type ENUM('laptop', 'phone', 'tablet', 'monitor', 'peripheral', 'other') NOT NULL,
    serial_number VARCHAR(100) NULL,
    purchase_date DATE NULL,
    purchase_price DECIMAL(15, 2) NULL,
    assigned_to INT NULL, -- user_id
    assigned_date DATE NULL,
    condition_status ENUM('new', 'good', 'fair', 'poor', 'broken') DEFAULT 'new',
    notes TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX (workspace_id, assigned_to)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
