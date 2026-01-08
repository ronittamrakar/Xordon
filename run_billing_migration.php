<?php
/**
 * Run Performance Billing Migration - Direct SQL execution
 */

require_once __DIR__ . '/backend/src/Database.php';

// Load .env
$envFile = __DIR__ . '/backend/.env';
if (file_exists($envFile)) {
    $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos(trim($line), '#') === 0) continue;
        if (strpos($line, '=') !== false) {
            list($name, $value) = explode('=', $line, 2);
            putenv(trim($name) . '=' . trim($value));
        }
    }
}

echo "=== Running Performance Billing Migration ===\n\n";

try {
    $pdo = Database::conn();
    
    // 1. Add columns to call_logs
    echo "Adding columns to call_logs...\n";
    
    $columns = [
        "ALTER TABLE call_logs ADD COLUMN is_qualified TINYINT(1) DEFAULT 0",
        "ALTER TABLE call_logs ADD COLUMN is_billed TINYINT(1) DEFAULT 0",
        "ALTER TABLE call_logs ADD COLUMN billed_at DATETIME NULL",
        "ALTER TABLE call_logs ADD COLUMN credit_transaction_id INT NULL",
        "ALTER TABLE call_logs ADD COLUMN billing_price DECIMAL(10,2) NULL",
        "ALTER TABLE call_logs ADD COLUMN billing_status ENUM('pending','billed','disputed','refunded','waived') DEFAULT 'pending'",
        "ALTER TABLE call_logs ADD COLUMN dispute_reason TEXT NULL",
        "ALTER TABLE call_logs ADD COLUMN disputed_at DATETIME NULL",
        "ALTER TABLE call_logs ADD COLUMN refunded_at DATETIME NULL",
    ];
    
    foreach ($columns as $sql) {
        try {
            $pdo->exec($sql);
            echo "  ✓ " . substr($sql, 0, 50) . "...\n";
        } catch (PDOException $e) {
            if (strpos($e->getMessage(), 'Duplicate column') !== false) {
                echo "  - Already exists: " . substr($sql, 25, 30) . "...\n";
            } else {
                echo "  ✗ Error: " . $e->getMessage() . "\n";
            }
        }
    }
    
    // 2. Create call_billing_settings table
    echo "\nCreating call_billing_settings table...\n";
    $sql = "CREATE TABLE IF NOT EXISTS call_billing_settings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        workspace_id INT NOT NULL,
        company_id INT NULL,
        min_duration_seconds INT DEFAULT 90,
        base_price_per_call DECIMAL(10,2) DEFAULT 25.00,
        surge_multiplier DECIMAL(4,2) DEFAULT 1.5,
        exclusive_multiplier DECIMAL(4,2) DEFAULT 3.0,
        auto_bill_enabled TINYINT(1) DEFAULT 1,
        dispute_window_hours INT DEFAULT 72,
        max_price_per_call DECIMAL(10,2) DEFAULT 120.00,
        min_price_per_call DECIMAL(10,2) DEFAULT 25.00,
        is_active TINYINT(1) DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY uq_call_billing_settings (workspace_id, company_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4";
    $pdo->exec($sql);
    echo "  ✓ call_billing_settings created\n";
    
    // 3. Create call_pricing_rules table
    echo "\nCreating call_pricing_rules table...\n";
    $sql = "CREATE TABLE IF NOT EXISTS call_pricing_rules (
        id INT AUTO_INCREMENT PRIMARY KEY,
        workspace_id INT NOT NULL,
        name VARCHAR(191) NULL,
        service_category VARCHAR(100) NULL,
        region VARCHAR(100) NULL,
        postal_code VARCHAR(32) NULL,
        city VARCHAR(191) NULL,
        day_of_week SET('mon','tue','wed','thu','fri','sat','sun') NULL,
        time_start TIME NULL,
        time_end TIME NULL,
        is_emergency TINYINT(1) NULL,
        base_price DECIMAL(10,2) NOT NULL DEFAULT 25.00,
        multiplier DECIMAL(4,2) DEFAULT 1.0,
        priority INT DEFAULT 0,
        is_active TINYINT(1) DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_call_pricing_workspace (workspace_id, is_active, priority)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4";
    $pdo->exec($sql);
    echo "  ✓ call_pricing_rules created\n";
    
    // 4. Create call_disputes table
    echo "\nCreating call_disputes table...\n";
    $sql = "CREATE TABLE IF NOT EXISTS call_disputes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        workspace_id INT NOT NULL,
        company_id INT NOT NULL,
        call_log_id INT NOT NULL,
        credit_transaction_id INT NULL,
        dispute_type ENUM('wrong_number','not_interested','spam','poor_quality','duplicate','other') NOT NULL,
        description TEXT NULL,
        status ENUM('pending','under_review','approved','rejected','partial_refund') DEFAULT 'pending',
        refund_amount DECIMAL(10,2) NULL,
        resolution_notes TEXT NULL,
        resolved_by INT NULL,
        resolved_at DATETIME NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_call_disputes_company (workspace_id, company_id),
        INDEX idx_call_disputes_status (workspace_id, status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4";
    $pdo->exec($sql);
    echo "  ✓ call_disputes created\n";
    
    // 5. Create call_performance_summary table  
    echo "\nCreating call_performance_summary table...\n";
    $sql = "CREATE TABLE IF NOT EXISTS call_performance_summary (
        id INT AUTO_INCREMENT PRIMARY KEY,
        workspace_id INT NOT NULL,
        company_id INT NOT NULL,
        summary_date DATE NOT NULL,
        total_calls INT DEFAULT 0,
        qualified_calls INT DEFAULT 0,
        total_duration_seconds INT DEFAULT 0,
        total_billed DECIMAL(10,2) DEFAULT 0,
        total_refunded DECIMAL(10,2) DEFAULT 0,
        avg_call_duration_seconds DECIMAL(10,2) NULL,
        qualification_rate DECIMAL(5,2) NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY uq_performance_summary (workspace_id, company_id, summary_date)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4";
    $pdo->exec($sql);
    echo "  ✓ call_performance_summary created\n";
    
    // 6. Seed default billing settings
    echo "\nSeeding default data...\n";
    try {
        $pdo->exec("INSERT IGNORE INTO call_billing_settings (workspace_id, company_id, min_duration_seconds, base_price_per_call, auto_bill_enabled) VALUES (1, NULL, 90, 25.00, 1)");
        echo "  ✓ Default billing settings seeded\n";
    } catch (Exception $e) {
        echo "  - Settings already exist\n";
    }
    
    // 7. Seed default pricing rules
    $rules = [
        ['Default Call Rate', NULL, 25.00, 1.0, 0],
        ['HVAC Calls', 'hvac', 45.00, 1.0, 10],
        ['Plumbing Calls', 'plumbing', 35.00, 1.0, 10],
        ['Emergency After-Hours', NULL, 50.00, 1.5, 100],
        ['High-Value Zip', NULL, 75.00, 1.0, 50],
    ];
    
    foreach ($rules as $rule) {
        try {
            $stmt = $pdo->prepare("INSERT IGNORE INTO call_pricing_rules (workspace_id, name, service_category, base_price, multiplier, priority, is_active) VALUES (1, ?, ?, ?, ?, ?, 1)");
            $stmt->execute($rule);
        } catch (Exception $e) {
            // Ignore
        }
    }
    echo "  ✓ Default pricing rules seeded\n";
    
    echo "\n=== Migration Complete! ===\n";
    
} catch (Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
    exit(1);
}
