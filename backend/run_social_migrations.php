<?php
/**
 * Run Social Media Scheduler Migrations
 * This script ensures all required tables for the social media scheduler exist
 */

require_once __DIR__ . '/src/Database.php';

try {
    $db = Database::conn();
    echo "Connected to database successfully.\n\n";
    
    // Check if tables exist
    $tables = [
        'social_accounts',
        'social_posts',
        'social_post_analytics',
        'social_categories',
        'social_templates',
        'hashtag_groups',
        'social_best_times'
    ];
    
    echo "Checking existing tables...\n";
    foreach ($tables as $table) {
        $stmt = $db->query("SHOW TABLES LIKE '$table'");
        $exists = $stmt->fetch() !== false;
        echo "  - $table: " . ($exists ? "✓ EXISTS" : "✗ MISSING") . "\n";
    }
    
    echo "\n";
    
    // Run main migration
    echo "Running social_scheduler.sql migration...\n";
    $sql = file_get_contents(__DIR__ . '/migrations/social_scheduler.sql');
    $db->exec($sql);
    echo "✓ Main migration completed\n\n";
    
    // Run company scoping migration
    echo "Running growth_company_scoping.sql migration...\n";
    $scopingSql = file_get_contents(__DIR__ . '/migrations/growth_company_scoping.sql');
    $db->exec($scopingSql);
    echo "✓ Company scoping migration completed\n\n";
    
    // Verify tables now exist
    echo "Verifying tables after migration...\n";
    foreach ($tables as $table) {
        $stmt = $db->query("SHOW TABLES LIKE '$table'");
        $exists = $stmt->fetch() !== false;
        echo "  - $table: " . ($exists ? "✓ EXISTS" : "✗ STILL MISSING") . "\n";
    }
    
    echo "\n";
    
    // Check for company_id column in social_accounts
    echo "Checking for company_id column in social_accounts...\n";
    $stmt = $db->query("SHOW COLUMNS FROM social_accounts LIKE 'company_id'");
    $hasCompanyId = $stmt->fetch() !== false;
    echo "  company_id column: " . ($hasCompanyId ? "✓ EXISTS" : "✗ MISSING") . "\n\n";
    
    // Optional: Seed demo data
    echo "Do you want to seed demo data? (y/n): ";
    $handle = fopen("php://stdin", "r");
    $line = fgets($handle);
    if (trim($line) === 'y') {
        echo "\nSeeding demo data...\n";
        $seedSql = file_get_contents(__DIR__ . '/migrations/seed_growth_suite_demo.sql');
        $db->exec($seedSql);
        echo "✓ Demo data seeded\n\n";
        
        // Show counts
        $counts = [];
        foreach ($tables as $table) {
            $stmt = $db->query("SELECT COUNT(*) FROM $table");
            $count = $stmt->fetchColumn();
            $counts[$table] = $count;
        }
        
        echo "Table counts:\n";
        foreach ($counts as $table => $count) {
            echo "  - $table: $count rows\n";
        }
    }
    fclose($handle);
    
    echo "\n✓ All migrations completed successfully!\n";
    
} catch (Exception $e) {
    echo "✗ Error: " . $e->getMessage() . "\n";
    echo "Stack trace:\n" . $e->getTraceAsString() . "\n";
    exit(1);
}
