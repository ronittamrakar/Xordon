<?php
require_once __DIR__ . '/backend/src/Database.php';
use Xordon\Database;

try {
    $pdo = Database::conn();
    
    echo "Creating loyalty_members table...\n";
    
    $sql = "CREATE TABLE IF NOT EXISTS `loyalty_members` (
        `id` INT PRIMARY KEY AUTO_INCREMENT,
        `program_id` INT NOT NULL,
        `contact_id` INT NOT NULL,
        `member_number` VARCHAR(50) UNIQUE,
        `points_balance` INT DEFAULT 0,
        `lifetime_points_earned` INT DEFAULT 0,
        `lifetime_points_redeemed` INT DEFAULT 0,
        `tier` VARCHAR(50),
        `tier_expires_at` DATE,
        `joined_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        `last_activity_at` TIMESTAMP NULL DEFAULT NULL,
        UNIQUE KEY `unique_program_contact` (`program_id`, `contact_id`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";
    
    $pdo->exec($sql);
    
    echo "✓ loyalty_members table created successfully!\n";
    
    // Verify
    $stmt = $pdo->query("SHOW TABLES LIKE 'loyalty_members'");
    if ($stmt->rowCount() > 0) {
        echo "✓ Verified: loyalty_members table exists\n";
    }
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
