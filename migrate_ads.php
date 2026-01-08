<?php
require_once __DIR__ . '/backend/src/Database.php';

try {
    $pdo = \Xordon\Database::conn();
    
    // Create ad_ab_tests table
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS ad_ab_tests (
            id INT AUTO_INCREMENT PRIMARY KEY,
            workspace_id INT NOT NULL,
            company_id INT NOT NULL,
            name VARCHAR(255) NOT NULL,
            campaign_id INT,
            variant_a_name VARCHAR(100) DEFAULT 'Variant A',
            variant_b_name VARCHAR(100) DEFAULT 'Variant B',
            variant_a_budget DECIMAL(12,2),
            variant_b_budget DECIMAL(12,2),
            test_duration_days INT DEFAULT 14,
            metric ENUM('ctr', 'conversions', 'cpa', 'roas') DEFAULT 'conversions',
            status ENUM('active', 'completed', 'paused') DEFAULT 'active',
            winner VARCHAR(100) NULL,
            started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            ended_at TIMESTAMP NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX (workspace_id, company_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    ");
    
    echo "ad_ab_tests table created or already exists.\n";

    // Ensure ad_campaigns has company_id
    $cols = $pdo->query("SHOW COLUMNS FROM ad_campaigns")->fetchAll(PDO::FETCH_COLUMN);
    if (!in_array('company_id', $cols)) {
        $pdo->exec("ALTER TABLE ad_campaigns ADD COLUMN company_id INT AFTER workspace_id");
        $pdo->exec("CREATE INDEX idx_company ON ad_campaigns(company_id)");
        echo "Added company_id to ad_campaigns.\n";
    }

} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
