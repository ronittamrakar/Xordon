<?php
require_once __DIR__ . '/backend/src/Config.php';
require_once __DIR__ . '/backend/src/Database.php';

$db = Database::conn();

echo "=== WORKSPACE 1 MEMBERS ===\n";
try {
    $members = $db->query("
        SELECT wm.user_id, u.email, u.name, wm.role
        FROM workspace_members wm
        JOIN users u ON wm.user_id = u.id
        WHERE wm.workspace_id = 1
    ")->fetchAll(PDO::FETCH_ASSOC);
    
    foreach ($members as $m) {
        echo "[User {$m['user_id']}] {$m['email']} ({$m['name']}) -> Role: {$m['role']}\n";
    }
} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}

echo "\n=== ALL WORKSPACES ===\n";
$ws = $db->query("SELECT id, name FROM workspaces")->fetchAll(PDO::FETCH_ASSOC);
foreach($ws as $w) {
    echo "Workspace [{$w['id']}] {$w['name']}\n";
}
