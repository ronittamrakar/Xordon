<?php

require_once __DIR__ . '/../src/Database.php';

try {
    $pdo = Database::conn();
    
    // Create blog_settings table
    $pdo->exec("CREATE TABLE IF NOT EXISTS blog_settings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        workspace_id INT NULL,
        blog_name VARCHAR(255) NOT NULL,
        blog_description TEXT NULL,
        domain_id INT NULL,
        path_prefix VARCHAR(100) DEFAULT 'blog',
        social_sharing_image VARCHAR(512) NULL,
        custom_css TEXT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX(user_id),
        INDEX(workspace_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;");

    // Create blog_posts table
    $pdo->exec("CREATE TABLE IF NOT EXISTS blog_posts (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        workspace_id INT NULL,
        title VARCHAR(255) NOT NULL,
        slug VARCHAR(255) NOT NULL,
        content LONGTEXT NULL,
        summary TEXT NULL,
        featured_image VARCHAR(512) NULL,
        author_name VARCHAR(100) NULL,
        category VARCHAR(100) NULL,
        tags TEXT NULL, -- JSON array
        status ENUM('draft', 'published', 'scheduled', 'archived') DEFAULT 'draft',
        published_at TIMESTAMP NULL,
        seo_title VARCHAR(255) NULL,
        seo_description VARCHAR(512) NULL,
        view_count INT DEFAULT 0,
        is_featured BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX(user_id),
        INDEX(workspace_id),
        INDEX(slug),
        INDEX(status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;");

    echo "Blog tables created successfully.\n";
} catch (PDOException $e) {
    echo "Error creating blog tables: " . $e->getMessage() . "\n";
}
