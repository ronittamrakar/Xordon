<?php
require_once __DIR__ . '/backend/src/bootstrap.php';
require_once __DIR__ . '/backend/src/Database.php';

$db = Database::conn();

$queries = [
    "CREATE TABLE IF NOT EXISTS ad_accounts (
        id INT AUTO_INCREMENT PRIMARY KEY,
        workspace_id INT NOT NULL,
        company_id INT NOT NULL,
        platform VARCHAR(50) NOT NULL,
        platform_account_id VARCHAR(255) NOT NULL,
        account_name VARCHAR(255),
        currency VARCHAR(10) DEFAULT 'USD',
        timezone VARCHAR(100),
        status VARCHAR(50) DEFAULT 'connected',
        sync_campaigns TINYINT(1) DEFAULT 1,
        sync_conversions TINYINT(1) DEFAULT 1,
        last_sync_at DATETIME,
        access_token_encrypted TEXT,
        refresh_token_encrypted TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_company (company_id)
    )",
    "CREATE TABLE IF NOT EXISTS ad_campaigns (
        id INT AUTO_INCREMENT PRIMARY KEY,
        workspace_id INT NOT NULL,
        company_id INT NOT NULL,
        ad_account_id INT,
        platform_campaign_id VARCHAR(255),
        name VARCHAR(255) NOT NULL,
        status VARCHAR(50) DEFAULT 'draft',
        campaign_type VARCHAR(50),
        daily_budget DECIMAL(15,2),
        total_budget DECIMAL(15,2),
        start_date DATE,
        end_date DATE,
        targeting_summary TEXT,
        last_sync_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_company (company_id),
        INDEX idx_account (ad_account_id)
    )",
    "CREATE TABLE IF NOT EXISTS ad_campaign_metrics (
        id INT AUTO_INCREMENT PRIMARY KEY,
        campaign_id INT NOT NULL,
        metric_date DATE NOT NULL,
        spend DECIMAL(15,2) DEFAULT 0,
        impressions INT DEFAULT 0,
        clicks INT DEFAULT 0,
        conversions INT DEFAULT 0,
        conversion_value DECIMAL(15,2) DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_campaign_date (campaign_id, metric_date)
    )",
    "CREATE TABLE IF NOT EXISTS ad_conversions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        workspace_id INT NOT NULL,
        company_id INT NOT NULL,
        ad_account_id INT,
        campaign_id INT,
        conversion_name VARCHAR(255) NOT NULL,
        conversion_type VARCHAR(50),
        contact_id INT,
        click_id VARCHAR(255),
        conversion_value DECIMAL(15,2),
        currency VARCHAR(10) DEFAULT 'USD',
        source VARCHAR(100),
        medium VARCHAR(100),
        campaign VARCHAR(255),
        converted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_company (company_id),
        INDEX idx_contact (contact_id)
    )",
    "CREATE TABLE IF NOT EXISTS ad_budgets (
        id INT AUTO_INCREMENT PRIMARY KEY,
        workspace_id INT NOT NULL,
        company_id INT NOT NULL,
        period_type VARCHAR(20) DEFAULT 'monthly',
        period_start DATE NOT NULL,
        period_end DATE NOT NULL,
        total_budget DECIMAL(15,2) NOT NULL,
        spent DECIMAL(15,2) DEFAULT 0,
        remaining DECIMAL(15,2) DEFAULT 0,
        google_ads_budget DECIMAL(15,2),
        facebook_ads_budget DECIMAL(15,2),
        other_budget DECIMAL(15,2),
        alert_threshold DECIMAL(5,2) DEFAULT 80,
        alert_sent TINYINT(1) DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_company (company_id)
    )",
    "CREATE TABLE IF NOT EXISTS ad_ab_tests (
        id INT AUTO_INCREMENT PRIMARY KEY,
        workspace_id INT NOT NULL,
        company_id INT NOT NULL,
        name VARCHAR(255) NOT NULL,
        campaign_id INT NOT NULL,
        variant_a_name VARCHAR(100) DEFAULT 'Variant A',
        variant_b_name VARCHAR(100) DEFAULT 'Variant B',
        variant_a_budget DECIMAL(15,2),
        variant_b_budget DECIMAL(15,2),
        test_duration_days INT DEFAULT 14,
        metric VARCHAR(50) DEFAULT 'conversions',
        status VARCHAR(50) DEFAULT 'active',
        winner VARCHAR(255),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_company (company_id),
        INDEX idx_campaign (campaign_id)
    )"
];

foreach ($queries as $sql) {
    try {
        $db->exec($sql);
        echo "Executed SQL successfully.\n";
    } catch (PDOException $e) {
        echo "Error: " . $e->getMessage() . "\n";
    }
}

echo "Database setup for Ads complete.\n";
