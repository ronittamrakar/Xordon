<?php
require_once __DIR__ . '/backend/src/Database.php';
use Xordon\Database;

$sql = "
CREATE TABLE IF NOT EXISTS directories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50) DEFAULT 'general',
    description TEXT NULL,
    website_url VARCHAR(500) NULL,
    logo_url VARCHAR(500) NULL,
    form_schema JSON NULL,
    is_active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE business_listings 
ADD COLUMN IF NOT EXISTS directory_id INT NULL AFTER workspace_id,
ADD COLUMN IF NOT EXISTS submission_data JSON NULL AFTER categories,
ADD INDEX IF NOT EXISTS idx_directory_id (directory_id);
";

try {
    $db = Database::conn();
    $db->exec($sql);
    echo "Migration successful!\n";
} catch (Exception $e) {
    echo "Migration failed: " . $e->getMessage() . "\n";
}
