<?php
require_once __DIR__ . '/backend/src/Database.php';

try {
    $db = Database::conn();
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    echo "Starting database migration for Subscriptions...\n";

    // 1. Update products table
    echo "Updating products table...\n";
    $db->exec("ALTER TABLE products ADD COLUMN IF NOT EXISTS trial_days INT DEFAULT 0");
    $db->exec("ALTER TABLE products ADD COLUMN IF NOT EXISTS setup_fee DECIMAL(10, 2) DEFAULT 0");
    echo "[OK] products table updated.\n";

    // 2. Create customer_subscriptions table
    echo "Creating customer_subscriptions table...\n";
    $db->exec("CREATE TABLE IF NOT EXISTS customer_subscriptions (
        id INT PRIMARY KEY AUTO_INCREMENT,
        workspace_id INT NOT NULL,
        company_id INT DEFAULT NULL,
        contact_id INT NOT NULL,
        product_id INT NOT NULL,
        subscription_number VARCHAR(50) UNIQUE,
        status ENUM('active', 'trialing', 'paused', 'cancelled', 'expired', 'past_due') DEFAULT 'active',
        billing_amount DECIMAL(10, 2) NOT NULL,
        currency VARCHAR(3) DEFAULT 'USD',
        billing_interval VARCHAR(20) NOT NULL,
        billing_interval_count INT DEFAULT 1,
        trial_days INT DEFAULT 0,
        trial_end_date DATE,
        setup_fee DECIMAL(10, 2) DEFAULT 0,
        setup_fee_paid BOOLEAN DEFAULT FALSE,
        start_date DATE NOT NULL,
        next_billing_date DATE,
        cancel_at_period_end BOOLEAN DEFAULT FALSE,
        cancelled_at DATETIME,
        notes TEXT,
        stripe_subscription_id VARCHAR(255),
        stripe_customer_id VARCHAR(255),
        created_by INT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_workspace (workspace_id),
        INDEX idx_contact (contact_id),
        INDEX idx_status (status)
    )");
    echo "[OK] customer_subscriptions table created.\n";

    // 3. Create subscription_billing_history
    echo "Creating subscription_billing_history table...\n";
    $db->exec("CREATE TABLE IF NOT EXISTS subscription_billing_history (
        id INT PRIMARY KEY AUTO_INCREMENT,
        workspace_id INT NOT NULL,
        subscription_id INT NOT NULL,
        invoice_id INT,
        billing_date DATETIME DEFAULT CURRENT_TIMESTAMP,
        amount DECIMAL(10, 2) NOT NULL,
        currency VARCHAR(3) NOT NULL,
        status ENUM('success', 'failed', 'pending', 'refunded') DEFAULT 'pending',
        payment_method VARCHAR(50),
        transaction_id VARCHAR(255),
        error_message TEXT,
        INDEX idx_subscription (subscription_id)
    )");
    echo "[OK] subscription_billing_history table created.\n";

    // 4. Create subscription_analytics
    echo "Creating subscription_analytics table...\n";
    $db->exec("CREATE TABLE IF NOT EXISTS subscription_analytics (
        id INT PRIMARY KEY AUTO_INCREMENT,
        workspace_id INT NOT NULL,
        date DATE NOT NULL,
        mrr DECIMAL(15, 2) DEFAULT 0,
        arr DECIMAL(15, 2) DEFAULT 0,
        active_subscriptions INT DEFAULT 0,
        trialing_subscriptions INT DEFAULT 0,
        churn_rate DECIMAL(5, 2) DEFAULT 0,
        new_subscriptions INT DEFAULT 0,
        cancelled_subscriptions INT DEFAULT 0,
        UNIQUE KEY idx_workspace_date (workspace_id, date)
    )");
    echo "[OK] subscription_analytics table created.\n";

    // 5. Create payment_gateway_settings
    echo "Creating payment_gateway_settings table...\n";
    $db->exec("CREATE TABLE IF NOT EXISTS payment_gateway_settings (
        id INT PRIMARY KEY AUTO_INCREMENT,
        workspace_id INT NOT NULL,
        gateway_name ENUM('stripe', 'paypal') NOT NULL,
        config_data JSON,
        is_active BOOLEAN DEFAULT TRUE,
        is_test_mode BOOLEAN DEFAULT TRUE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY idx_workspace_gateway (workspace_id, gateway_name)
    )");
    echo "[OK] payment_gateway_settings table created.\n";

    echo "Migration completed successfully!\n";

} catch (Exception $e) {
    echo "FATAL ERROR during migration: " . $e->getMessage() . "\n";
    exit(1);
}
