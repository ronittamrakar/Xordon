-- Create custom_variables table for storing user-defined merge variables
CREATE TABLE IF NOT EXISTS custom_variables (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_name (name)
);

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_custom_variables_name ON custom_variables(name);