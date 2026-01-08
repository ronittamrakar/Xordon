<?php
require_once __DIR__ . '/backend/src/Config.php';
require_once __DIR__ . '/backend/src/Database.php';

$db = Database::conn();

echo "=== FIXING DATA VISIBILITY ===\n";

// 1. Ensure all users are in Workspace 1 (Main Workspace)
$users = $db->query("SELECT id, email, name FROM users")->fetchAll(PDO::FETCH_ASSOC);

foreach ($users as $u) {
    // Check if user is in workspace 1
    $check = $db->prepare("SELECT 1 FROM workspace_members WHERE workspace_id = 1 AND user_id = ?");
    $check->execute([$u['id']]);
    
    if (!$check->fetchColumn()) {
        echo "Adding User {$u['email']} (ID: {$u['id']}) to Workspace 1...\n";
        $stmt = $db->prepare("INSERT INTO workspace_members (workspace_id, user_id, role, joined_at) VALUES (1, ?, 'admin', NOW())");
        $stmt->execute([$u['id']]);
    } else {
        echo "User {$u['email']} (ID: {$u['id']}) is already in Workspace 1.\n";
    }
}

// 2. Ensure all campaigns/sequences/templates are in Workspace 1
// This prevents 'orphaned' data from being hidden
$tables = ['campaigns', 'sequences', 'proposal_templates', 'sms_campaigns', 'sms_sequences'];

foreach ($tables as $t) {
    try {
        echo "Updating $t to belong to Workspace 1...\n";
        // Check if table has workspace_id
        $cols = $db->query("DESCRIBE $t")->fetchAll(PDO::FETCH_COLUMN);
        if (in_array('workspace_id', $cols)) {
            $stmt = $db->query("UPDATE $t SET workspace_id = 1 WHERE workspace_id IS NULL OR workspace_id = 0");
            echo "  - Updated rows: " . $stmt->rowCount() . "\n";
        }
    } catch (Exception $e) {
        echo "  - Error updating $t: " . $e->getMessage() . "\n";
    }
}

// 3. Fix 'Forms' issue (Table missing - create it if needed or migrate from webforms)
// The user noted 'forms' table was missing in previous check. 
// If 'webforms' is the new table and it's empty, we might need to seed it.
// But first, let's see if we can just fix the visibility of existing data.

echo "\nRefreshed visibility for users and assets.\n";
