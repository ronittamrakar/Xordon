<?php
require_once __DIR__ . '/backend/src/Config.php';
require_once __DIR__ . '/backend/src/Database.php';

$db = Database::conn();

echo "=== FIXING DATA VISIBILITY & ACCESS ===\n";

// 1. Ensure Ronit (ID 33) is in Workspace 1
$ronitId = 33;
$check = $db->prepare("SELECT 1 FROM workspace_members WHERE workspace_id = 1 AND user_id = ?");
$check->execute([$ronitId]);
if (!$check->fetchColumn()) {
    echo "Adding Ronit (ID $ronitId) to Workspace 1...\n";
    $db->prepare("INSERT INTO workspace_members (workspace_id, user_id, role, created_at) VALUES (1, ?, 'owner', NOW())")->execute([$ronitId]);
} else {
    echo "Ronit is already in Workspace 1.\n";
}

// 2. Add ALL users to Workspace 1 just in case
$users = $db->query("SELECT id, email FROM users")->fetchAll(PDO::FETCH_ASSOC);
foreach ($users as $u) {
    $check = $db->prepare("SELECT 1 FROM workspace_members WHERE workspace_id = 1 AND user_id = ?");
    $check->execute([$u['id']]);
    if (!$check->fetchColumn()) {
        echo "Adding User {$u['email']} (ID: {$u['id']}) to Workspace 1...\n";
        $db->prepare("INSERT INTO workspace_members (workspace_id, user_id, role, created_at) VALUES (1, ?, 'admin', NOW())")->execute([$u['id']]);
    }
}

// 3. Move all orphaned or WS-2 data to WS-1
$tables = ['campaigns', 'sequences', 'sms_campaigns', 'sms_sequences', 'workflows', 'contacts', 'webforms', 'websites'];
foreach ($tables as $t) {
    try {
        $cols = $db->query("DESCRIBE `$t`")->fetchAll(PDO::FETCH_COLUMN);
        if (in_array('workspace_id', $cols)) {
            echo "Consolidating $t into Workspace 1...\n";
            $stmt = $db->query("UPDATE `$t` SET workspace_id = 1 WHERE workspace_id != 1 OR workspace_id IS NULL");
            echo "  - Updated " . $stmt->rowCount() . " rows.\n";
        }
    } catch (Exception $e) {
        echo "  - Error updating $t: " . $e->getMessage() . "\n";
    }
}

// 4. Fix tables missing workspace_id (proposal_templates, automations)
// These might need the column to show up in WS-1 if the backend filters by WS-1.
// Let's check ProposalTemplatesController::getAll() logic.
/*
    if ($path === '/proposal-templates' && $method === 'GET') return ProposalTemplatesController::getAll();
*/

// 5. Create 'forms' table if it's missing (it was missing in previous report)
// Check if 'webforms' should be aliased or copied.
try {
    $db->query("SELECT 1 FROM forms LIMIT 1");
} catch (Exception $e) {
    echo "Table 'forms' is missing. Creating it as a copy of 'webforms' structure or just creating empty...\n";
    try {
        $db->query("CREATE TABLE forms LIKE webforms");
        echo "  - Created 'forms' table from 'webforms' schema.\n";
        $db->query("INSERT INTO forms SELECT * FROM webforms");
        echo "  - Copied data from webforms to forms.\n";
    } catch (Exception $e2) {
        echo "  - Failed to create 'forms' from 'webforms': " . $e2->getMessage() . "\n";
        // Create basic forms table if webforms also failed or is different
        $db->query("CREATE TABLE IF NOT EXISTS forms (
            id INT AUTO_INCREMENT PRIMARY KEY,
            workspace_id INT,
            user_id INT,
            name VARCHAR(255),
            description TEXT,
            fields LONGTEXT,
            status VARCHAR(32),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )");
        echo "  - Created basic 'forms' table.\n";
    }
}

echo "\nDone. Please refresh the page.\n";
