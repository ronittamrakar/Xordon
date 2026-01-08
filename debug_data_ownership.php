<?php
require_once __DIR__ . '/backend/src/Config.php';
require_once __DIR__ . '/backend/src/Database.php';

$db = Database::conn();

echo "=== USER DEBUG ===\n";
$users = $db->query("SELECT id, email, first_name, last_name, role FROM users")->fetchAll(PDO::FETCH_ASSOC);
foreach ($users as $u) {
    echo "User [{$u['id']}] {$u['email']} ({$u['role']})\n";
    
    // Get workspaces
    $ws = $db->query("
        SELECT w.id, w.name, wm.role 
        FROM workspaces w 
        JOIN workspace_members wm ON w.id = wm.workspace_id 
        WHERE wm.user_id = {$u['id']}
    ")->fetchAll(PDO::FETCH_ASSOC);
    
    if (empty($ws)) {
        echo "  - No workspaces\n";
    } else {
        foreach ($ws as $w) {
            echo "  - Workspace [{$w['id']}] {$w['name']} (Role: {$w['role']})\n";
        }
    }
}

echo "\n=== CAMPAIGN DATA OWNERSHIP ===\n";
try {
    // Check columns to know if it uses workspace_id or user_id
    $cols = $db->query("DESCRIBE campaigns")->fetchAll(PDO::FETCH_COLUMN);
    $hasWs = in_array('workspace_id', $cols);
    $hasUser = in_array('user_id', $cols);
    
    echo "Campaign Columns found: " . ($hasWs ? "workspace_id " : "") . ($hasUser ? "user_id" : "") . "\n";
    
    $sql = "SELECT id, name";
    if ($hasWs) $sql .= ", workspace_id";
    if ($hasUser) $sql .= ", user_id";
    $sql .= " FROM campaigns LIMIT 20";
    
    $campaigns = $db->query($sql)->fetchAll(PDO::FETCH_ASSOC);
    foreach ($campaigns as $c) {
        $wsStr = isset($c['workspace_id']) ? "WS: {$c['workspace_id']}" : "WS: N/A";
        $uStr = isset($c['user_id']) ? "User: {$c['user_id']}" : "User: N/A";
        echo "Campaign [{$c['id']}] '{$c['name']}' -> $wsStr, $uStr\n";
    }
} catch (Exception $e) {
    echo "Error checking campaigns: " . $e->getMessage() . "\n";
}

echo "\n=== SEQUENCE DATA OWNERSHIP ===\n";
try {
    $sequences = $db->query("SELECT id, name, workspace_id FROM sequences LIMIT 10")->fetchAll(PDO::FETCH_ASSOC);
    foreach ($sequences as $s) {
        echo "Sequence [{$s['id']}] '{$s['name']}' -> WS: {$s['workspace_id']}\n";
    }
} catch (Exception $e) {
    echo "Error checking sequences: " . $e->getMessage() . "\n";
}

echo "\n=== TEMPLATE DATA OWNERSHIP (proposal_templates) ===\n";
try {
    $templates = $db->query("SELECT id, name, workspace_id FROM proposal_templates LIMIT 10")->fetchAll(PDO::FETCH_ASSOC);
    foreach ($templates as $t) {
        echo "Template [{$t['id']}] '{$t['name']}' -> WS: {$t['workspace_id']}\n";
    }
} catch (Exception $e) {
    echo "Error checking templates: " . $e->getMessage() . "\n";
}
