<?php
require_once __DIR__ . '/../backend/src/Database.php';

$pdo = Database::conn();

echo "Updating payments schema...\n";

// Add appointment_id to payments table if not exists
try {
    $stmt = $pdo->query("SHOW COLUMNS FROM payments LIKE 'appointment_id'");
    if ($stmt->rowCount() === 0) {
        $pdo->exec("ALTER TABLE payments ADD COLUMN appointment_id INT NULL AFTER invoice_id");
        $pdo->exec("ALTER TABLE payments ADD INDEX idx_appointment_id (appointment_id)");
        echo "Added appointment_id to payments table.\n";
    } else {
        echo "appointment_id column already exists.\n";
    }
} catch (PDOException $e) {
    if (strpos($e->getMessage(), "Table 'xordon.payments' doesn't exist") !== false) {
        // Create payments table if it doesn't exist (it should based on Controller, but just in case)
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS payments (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                invoice_id INT NULL,
                appointment_id INT NULL,
                contact_id INT NULL,
                amount DECIMAL(10, 2) NOT NULL,
                currency VARCHAR(3) DEFAULT 'USD',
                payment_method VARCHAR(50) DEFAULT 'other',
                status VARCHAR(20) DEFAULT 'completed',
                transaction_id VARCHAR(255) NULL,
                notes TEXT NULL,
                paid_at DATETIME NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_user_id (user_id),
                INDEX idx_invoice_id (invoice_id),
                INDEX idx_appointment_id (appointment_id),
                INDEX idx_contact_id (contact_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        ");
        echo "Created payments table.\n";
    } else {
        echo "Error checking payments table: " . $e->getMessage() . "\n";
    }
}

// Ensure payment_settings table exists
try {
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS payment_settings (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            stripe_publishable_key VARCHAR(255) NULL,
            stripe_secret_key_encrypted TEXT NULL,
            stripe_webhook_secret_encrypted TEXT NULL,
            paypal_client_id VARCHAR(255) NULL,
            paypal_secret_encrypted TEXT NULL,
            default_currency VARCHAR(3) DEFAULT 'USD',
            default_tax_rate DECIMAL(5, 2) DEFAULT 0.00,
            invoice_prefix VARCHAR(20) DEFAULT 'INV-',
            invoice_footer TEXT NULL,
            payment_terms TEXT NULL,
            auto_send_receipts TINYINT(1) DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            UNIQUE KEY uk_user_id (user_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ");
    echo "Ensured payment_settings table exists.\n";
} catch (PDOException $e) {
    echo "Error with payment_settings: " . $e->getMessage() . "\n";
}

echo "Schema update completed.\n";
