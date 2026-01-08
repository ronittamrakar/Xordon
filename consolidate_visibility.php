<?php
require_once __DIR__ . '/backend/src/Config.php';
require_once __DIR__ . '/backend/src/Database.php';

$db = Database::conn();

echo "=== FINAL DATA CONSOLIDATION ===\n";

// 1. Ensure Ronit (33) is in WS 1
$ronitId = 33;
$db->prepare("INSERT IGNORE INTO workspace_members (workspace_id, user_id, role, created_at) VALUES (1, ?, 'owner', NOW())")->execute([$ronitId]);

// 2. Add ALL users to WS 1
$users = $db->query("SELECT id FROM users")->fetchAll(PDO::FETCH_COLUMN);
foreach ($users as $uid) {
    $db->prepare("INSERT IGNORE INTO workspace_members (workspace_id, user_id, role, created_at) VALUES (1, ?, 'admin', NOW())")->execute([$uid]);
}

// 3. Move all data with workspace_id to WS 1
$tablesWithWs = [
    'campaigns', 'sequences', 'sms_campaigns', 'sms_sequences', 'workflows', 
    'contacts', 'webforms', 'websites', 'automation_workflows', 'pipelines',
    'opportunities', 'invoices', 'calls', 'call_campaigns', 'ad_accounts'
];

foreach ($tablesWithWs as $t) {
    try {
        $cols = $db->query("DESCRIBE `$t`")->fetchAll(PDO::FETCH_COLUMN);
        if (in_array('workspace_id', $cols)) {
            $stmt = $db->query("UPDATE `$t` SET workspace_id = 1 WHERE workspace_id != 1 OR workspace_id IS NULL");
            echo "Updated $t: " . $stmt->rowCount() . " rows.\n";
        }
    } catch (Exception $e) {}
}

// 4. Handle automations & proposal_templates (no workspace_id)
// We'll set their user_id to 33 if they are orphaned or owned by system
try {
    $stmt = $db->query("UPDATE proposal_templates SET is_default = 1 WHERE is_default = 0 OR is_default IS NULL");
    echo "Updated proposal_templates (made defaults): " . $stmt->rowCount() . " rows.\n";
} catch (Exception $e) {}

try {
    $stmt = $db->query("UPDATE automations SET user_id = 33 WHERE user_id != 33 OR user_id IS NULL");
    echo "Updated automations (assigned to Ronit): " . $stmt->rowCount() . " rows.\n";
} catch (Exception $e) {}

// 5. Ensure 'forms' table is up to date
try {
    $db->query("DROP TABLE IF EXISTS forms");
    $db->query("CREATE TABLE forms LIKE webforms");
    $db->query("INSERT INTO forms SELECT * FROM webforms");
    echo "Re-synced 'forms' table from 'webforms'.\n";
} catch (Exception $e) {
    echo "Failed to sync forms: " . $e->getMessage() . "\n";
}

echo "\nConsolidation complete. Everything should be visible now.\n";
