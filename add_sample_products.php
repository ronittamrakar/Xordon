<?php
/**
 * Script to add sample products to the database
 * Run with: php add_sample_products.php
 */

require_once __DIR__ . '/backend/vendor/autoload.php';
require_once __DIR__ . '/backend/src/Database.php';

try {
    $pdo = Database::conn();
    
    $products = [
        ['Premium Widget', 'High-quality widget for professional use', 'WID-001', 99.99],
        ['Standard Widget', 'Standard widget for everyday use', 'WID-002', 49.99],
        ['Widget Pro Bundle', 'Complete bundle with 5 widgets and accessories', 'WID-BUNDLE-001', 399.99],
        ['Monthly Subscription', 'Monthly access to premium features', 'SUB-MONTH', 29.99],
        ['Annual Subscription', 'Annual access to premium features (save 20%)', 'SUB-YEAR', 287.88],
        ['Starter Kit', 'Everything you need to get started', 'KIT-START', 149.99],
        ['Replacement Parts', 'Assorted replacement parts', 'PARTS-001', 19.99],
        ['Extended Warranty', '2-year extended warranty coverage', 'WARRANTY-2Y', 79.99],
        ['Basic Widget', 'Entry-level widget for beginners', 'WID-003', 24.99],
        ['Quarterly Subscription', 'Quarterly access to premium features', 'SUB-QUARTER', 79.99],
    ];
    
    $stmt = $pdo->prepare("
        INSERT INTO products 
        (workspace_id, company_id, name, description, sku, price, currency, unit, is_recurring, recurring_interval, recurring_interval_count, tax_rate, is_active, created_at, updated_at)
        VALUES (1, NULL, ?, ?, ?, ?, 'USD', 'unit', 0, NULL, 1, 0, 1, NOW(), NOW())
        ON DUPLICATE KEY UPDATE updated_at = NOW()
    ");
    
    $count = 0;
    foreach ($products as $product) {
        $stmt->execute($product);
        $count++;
    }
    
    echo "Successfully added $count sample products!\n";
    
    // Verify
    $result = $pdo->query("SELECT COUNT(*) FROM products WHERE workspace_id = 1")->fetchColumn();
    echo "Total products in database: $result\n";
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
    exit(1);
}
