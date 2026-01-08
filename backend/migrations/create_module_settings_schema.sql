CREATE TABLE IF NOT EXISTS module_settings (
    workspace_id INT NOT NULL,
    module VARCHAR(50) NOT NULL,
    settings JSON DEFAULT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (workspace_id, module)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
