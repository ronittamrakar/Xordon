-- Migration: Add Payroll Tax Brackets
-- Description: Creates a table for progressive tax brackets

CREATE TABLE IF NOT EXISTS payroll_tax_brackets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    tax_type ENUM('federal', 'state') NOT NULL,
    min_income DECIMAL(15, 2) NOT NULL,
    max_income DECIMAL(15, 2) NULL, -- NULL means no upper limit
    rate DECIMAL(5, 4) NOT NULL, -- e.g., 0.1000 for 10%
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX (workspace_id, tax_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert some default federal brackets (simplified 2024 single filer)
-- Note: In a real app, these would be per workspace or global defaults
INSERT INTO payroll_tax_brackets (workspace_id, tax_type, min_income, max_income, rate) VALUES
(1, 'federal', 0, 11600, 0.10),
(1, 'federal', 11601, 47150, 0.12),
(1, 'federal', 47151, 100525, 0.22),
(1, 'federal', 100526, 191950, 0.24),
(1, 'federal', 191951, 243725, 0.32),
(1, 'federal', 243726, 609350, 0.35),
(1, 'federal', 609351, NULL, 0.37);
