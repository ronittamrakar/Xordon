-- Loyalty Program Tables
CREATE TABLE IF NOT EXISTS loyalty_programs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tenant_id INT NOT NULL,
    name VARCHAR(255) NOT NULL DEFAULT 'Loyalty Program',
    description TEXT,
    points_to_currency_ratio DECIMAL(10,4) DEFAULT 0.0100,
    signup_bonus INT DEFAULT 100,
    birthday_bonus INT DEFAULT 50,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_tenant (tenant_id),
    INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS loyalty_rewards (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tenant_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    points_cost INT NOT NULL,
    reward_type ENUM('discount_fixed', 'discount_percent', 'free_product', 'gift_card') DEFAULT 'discount_fixed',
    reward_value DECIMAL(10,2) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_tenant (tenant_id),
    INDEX idx_active (is_active),
    INDEX idx_points (points_cost)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS loyalty_transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tenant_id INT NOT NULL,
    contact_id VARCHAR(36) NOT NULL,
    type ENUM('earn', 'redeem', 'bonus', 'adjustment') NOT NULL,
    points INT NOT NULL,
    description VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_tenant (tenant_id),
    INDEX idx_contact (contact_id),
    INDEX idx_type (type),
    INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS loyalty_balances (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tenant_id INT NOT NULL,
    contact_id VARCHAR(36) NOT NULL,
    points_balance INT DEFAULT 0,
    lifetime_earned INT DEFAULT 0,
    lifetime_redeemed INT DEFAULT 0,
    enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_contact (tenant_id, contact_id),
    INDEX idx_tenant (tenant_id),
    INDEX idx_contact (contact_id),
    INDEX idx_balance (points_balance)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
