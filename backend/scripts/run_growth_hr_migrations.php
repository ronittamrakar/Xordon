<?php
/**
 * Run Growth & HR Module Migrations
 * 
 * This script applies:
 * 1. Growth company_id scoping (adds company_id to social, listings, ads tables)
 * 2. Module settings table (for Growth & HR configuration)
 * 
 * Usage: php run_growth_hr_migrations.php
 */

require_once __DIR__ . '/src/Database.php';

echo "=== Growth & HR Module Migrations ===\n\n";

try {
    $pdo = Database::conn();
    echo "[OK] Database connection established\n\n";

    // 1. Growth module company_id scoping
    echo "--- Growth Module: Adding company_id columns ---\n";
    $growthTables = [
        'social_accounts', 'social_posts', 'social_categories', 'social_templates', 'hashtag_groups',
        'business_listings', 'seo_keywords', 'seo_pages', 'seo_competitors',
        'ad_accounts', 'ad_campaigns', 'ad_conversions', 'ad_budgets', 'ad_tracking_numbers'
    ];

    foreach ($growthTables as $table) {
        $stmt = $pdo->query("SHOW TABLES LIKE '$table'");
        if (!$stmt->fetchColumn()) {
            echo "  [SKIP] Table '$table' does not exist\n";
            continue;
        }

        $stmt = $pdo->query("SHOW COLUMNS FROM `$table` LIKE 'company_id'");
        if ($stmt->fetch()) {
            echo "  [OK] '$table' already has company_id\n";
            continue;
        }

        try {
            $pdo->exec("ALTER TABLE `$table` ADD COLUMN company_id INT NULL");
            $pdo->exec("CREATE INDEX idx_{$table}_company_id ON `$table`(company_id)");
            echo "  [ADDED] company_id to '$table'\n";
        } catch (Exception $e) {
            echo "  [ERROR] Failed to add company_id to '$table': " . $e->getMessage() . "\n";
        }
    }

    // 2. Module settings table
    echo "\n--- Module Settings Table ---\n";
    $stmt = $pdo->query("SHOW TABLES LIKE 'module_settings'");
    if ($stmt->fetchColumn()) {
        echo "  [OK] module_settings table already exists\n";
    } else {
        try {
            $pdo->exec("
                CREATE TABLE IF NOT EXISTS module_settings (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    workspace_id INT NOT NULL,
                    company_id INT NULL,
                    module VARCHAR(50) NOT NULL,
                    setting_key VARCHAR(100) NOT NULL,
                    setting_value JSON,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    UNIQUE KEY uk_module_setting (workspace_id, company_id, module, setting_key),
                    INDEX idx_module_settings_workspace (workspace_id, module),
                    INDEX idx_module_settings_company (company_id, module)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
            ");
            echo "  [CREATED] module_settings table\n";
        } catch (Exception $e) {
            echo "  [ERROR] Failed to create module_settings: " . $e->getMessage() . "\n";
        }
    }

    echo "\n=== Migration Complete ===\n";

} catch (Exception $e) {
    echo "[FATAL] " . $e->getMessage() . "\n";
    exit(1);
}
