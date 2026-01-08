<?php
/**
 * Run Tenant Isolation Migration
 * Adds workspace_id to tables missing tenant isolation
 */

require_once __DIR__ . '/backend/src/Database.php';

echo "=== TENANT ISOLATION MIGRATION ===\n";
echo "Adding workspace_id to tables missing tenant isolation...\n\n";

$pdo = Database::conn();

$migrations = [
    ['table' => 'ecommerce_abandoned_carts', 'column' => 'workspace_id'],
    ['table' => 'ecommerce_collections', 'column' => 'workspace_id'],
    ['table' => 'ecommerce_coupons', 'column' => 'workspace_id'],
    ['table' => 'ecommerce_inventory', 'column' => 'workspace_id'],
    ['table' => 'ecommerce_shipping_methods', 'column' => 'workspace_id'],
    ['table' => 'ecommerce_warehouses', 'column' => 'workspace_id'],
    ['table' => 'followup_automations', 'column' => 'workspace_id'],
    ['table' => 'health_alerts', 'column' => 'workspace_id'],
    ['table' => 'loyalty_balances', 'column' => 'workspace_id'],
    ['table' => 'marketplace_disputes', 'column' => 'workspace_id'],
    ['table' => 'social_post_accounts', 'column' => 'workspace_id'],
    ['table' => 'webinar_poll_responses', 'column' => 'workspace_id'],
];

$success = 0;
$skipped = 0;
$failed = 0;

foreach ($migrations as $m) {
    $table = $m['table'];
    $column = $m['column'];
    
    // Check if table exists
    $stmt = $pdo->query("SHOW TABLES LIKE '$table'");
    if ($stmt->rowCount() === 0) {
        echo "⚠️  SKIP: Table '$table' does not exist\n";
        $skipped++;
        continue;
    }
    
    // Check if column already exists
    $stmt = $pdo->query("SHOW COLUMNS FROM `$table` LIKE '$column'");
    if ($stmt->rowCount() > 0) {
        echo "✓  OK: Column '$column' already exists in '$table'\n";
        $skipped++;
        continue;
    }
    
    // Add the column
    try {
        $pdo->exec("ALTER TABLE `$table` ADD COLUMN `$column` INT NOT NULL DEFAULT 1");
        echo "✅ ADDED: Column '$column' to '$table'\n";
        
        // Add index
        $indexName = "idx_{$table}_workspace";
        $pdo->exec("CREATE INDEX `$indexName` ON `$table`(`$column`)");
        echo "   └─ Index '$indexName' created\n";
        
        $success++;
    } catch (PDOException $e) {
        echo "❌ FAILED: '$table' - " . $e->getMessage() . "\n";
        $failed++;
    }
}

echo "\n=== MIGRATION COMPLETE ===\n";
echo "Success: $success | Skipped: $skipped | Failed: $failed\n";

// Verification
echo "\n=== VERIFICATION ===\n";
$stmt = $pdo->query("
    SELECT COUNT(DISTINCT TABLE_NAME) as cnt
    FROM information_schema.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND COLUMN_NAME = 'workspace_id'
");
$result = $stmt->fetch(PDO::FETCH_ASSOC);
echo "Tables with workspace_id: " . $result['cnt'] . " / 883\n";
