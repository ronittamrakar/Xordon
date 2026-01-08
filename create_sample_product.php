<?php
require_once __DIR__ . '/backend/src/Database.php';

try {
    $db = Database::conn();
    
    // Check if we have any workspace
    $workspace = $db->query("SELECT id FROM workspaces LIMIT 1")->fetch();
    $workspaceId = $workspace ? $workspace['id'] : 1;

    $db->exec("INSERT INTO products (
        workspace_id, name, description, price, currency, is_recurring, 
        recurring_interval, recurring_interval_count, trial_days, setup_fee, is_active
    ) VALUES (
        $workspaceId, 'Premium Monthly Plan', 'Basic subscription plan', 29.99, 'USD', 1,
        'monthly', 1, 7, 0, 1
    )");
    
    echo "Sample recurring product created.\n";
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
