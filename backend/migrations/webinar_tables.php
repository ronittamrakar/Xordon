<?php

require_once __DIR__ . '/../src/Database.php';

try {
    $pdo = Database::conn();
    
    // Create webinars table
    $pdo->exec("CREATE TABLE IF NOT EXISTS webinars (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        workspace_id INT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT NULL,
        thumbnail VARCHAR(255) NULL,
        scheduled_at TIMESTAMP NULL,
        duration_minutes INT DEFAULT 60,
        status ENUM('draft', 'scheduled', 'live', 'ended') DEFAULT 'draft',
        stream_key VARCHAR(100) NULL,
        stream_url VARCHAR(255) NULL,
        recording_url VARCHAR(255) NULL,
        is_evergreen BOOLEAN DEFAULT FALSE,
        max_registrants INT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX(user_id),
        INDEX(workspace_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;");

    // Create webinar_registrants table
    $pdo->exec("CREATE TABLE IF NOT EXISTS webinar_registrants (
        id INT AUTO_INCREMENT PRIMARY KEY,
        webinar_id INT NOT NULL,
        contact_id INT NOT NULL,
        workspace_id INT NULL,
        attendance_status ENUM('registered', 'attended', 'no_show') DEFAULT 'registered',
        joined_at TIMESTAMP NULL,
        left_at TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX(webinar_id),
        INDEX(contact_id),
        INDEX(workspace_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;");

    echo "Webinar tables created successfully.\n";
} catch (PDOException $e) {
    echo "Error creating webinar tables: " . $e->getMessage() . "\n";
}
