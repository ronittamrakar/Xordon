<?php
require_once 'src/Database.php';

try {
    $pdo = Database::conn();
    
    // Create form_templates table without foreign key constraints
    $sql = "
    CREATE TABLE IF NOT EXISTS form_templates (
        id VARCHAR(36) PRIMARY KEY,
        user_id VARCHAR(36) NOT NULL,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        fields JSON NOT NULL,
        is_multi_step BOOLEAN DEFAULT FALSE,
        steps JSON,
        category VARCHAR(50) NOT NULL DEFAULT 'other',
        usage_count INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_user_id (user_id),
        INDEX idx_category (category),
        INDEX idx_usage_count (usage_count)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ";
    
    $pdo->exec($sql);
    echo "Form templates table created successfully!\n";
} catch (Exception $e) {
    echo "Error creating form templates table: " . $e->getMessage() . "\n";
}