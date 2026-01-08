<?php
/**
 * Commerce Enhancements Migration Runner
 * Runs add_commerce_enhancements.sql migration
 */

require_once __DIR__ . '/../src/Database.php';

try {
    $pdo = Database::conn();
    $sqlFile = __DIR__ . '/../migrations/add_commerce_enhancements.sql';
    
    if (!file_exists($sqlFile)) {
        die("Migration file not found: $sqlFile\n");
    }
    
    $sql = file_get_contents($sqlFile);
    
    echo "Running commerce enhancements migration...\n";
    
    $pdo->exec($sql);
    
    echo "✅ Migration completed successfully!\n";
    echo "Created tables: payment_links, payment_link_orders, fulfillments, inventory_logs\n";
    echo "Updated products table with inventory tracking fields\n";
    
} catch (Exception $e) {
    echo "❌ Migration failed: " . $e->getMessage() . "\n";
    exit(1);
}
