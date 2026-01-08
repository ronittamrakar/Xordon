<?php

require_once __DIR__ . '/../src/Database.php';

try {
    $pdo = Database::conn();
    
    // Create loyalty_programs table
    $pdo->exec("CREATE TABLE IF NOT EXISTS loyalty_programs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        workspace_id INT NULL,
        name VARCHAR(255) NOT NULL,
        description TEXT NULL,
        points_to_currency_ratio DECIMAL(10, 4) DEFAULT 1.0000, -- e.g., 1 point = $0.01
        signup_bonus INT DEFAULT 0,
        birthday_bonus INT DEFAULT 0,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX(user_id),
        INDEX(workspace_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;");

    // Create loyalty_points table
    $pdo->exec("CREATE TABLE IF NOT EXISTS loyalty_points (
        id INT AUTO_INCREMENT PRIMARY KEY,
        contact_id INT NOT NULL,
        workspace_id INT NULL,
        points_balance INT DEFAULT 0,
        total_points_earned INT DEFAULT 0,
        last_transaction_at TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX(contact_id),
        INDEX(workspace_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;");

    // Create loyalty_transactions table
    $pdo->exec("CREATE TABLE IF NOT EXISTS loyalty_transactions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        contact_id INT NOT NULL,
        workspace_id INT NULL,
        type ENUM('earn', 'redeem', 'bonus', 'adjustment') NOT NULL,
        points INT NOT NULL,
        reference_type VARCHAR(50) NULL, -- 'invoice', 'review', 'signup', etc.
        reference_id VARCHAR(50) NULL,
        description VARCHAR(255) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX(contact_id),
        INDEX(workspace_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;");

    // Create loyalty_rewards table (Redeemable items)
    $pdo->exec("CREATE TABLE IF NOT EXISTS loyalty_rewards (
        id INT AUTO_INCREMENT PRIMARY KEY,
        workspace_id INT NULL,
        name VARCHAR(255) NOT NULL,
        description TEXT NULL,
        points_required INT NOT NULL,
        reward_type ENUM('discount_fixed', 'discount_percent', 'free_product', 'gift_card') NOT NULL,
        reward_value DECIMAL(10, 2) NULL,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX(workspace_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;");

    echo "Loyalty tables created successfully.\n";
} catch (PDOException $e) {
    echo "Error creating loyalty tables: " . $e->getMessage() . "\n";
}
