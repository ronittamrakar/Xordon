<?php
require_once __DIR__ . '/backend/src/Config.php';
require_once __DIR__ . '/backend/src/Database.php';

$db = Database::conn();
echo "=== USERS ===\n";
$users = $db->query("SELECT id, email, name FROM users")->fetchAll(PDO::FETCH_ASSOC);
foreach ($users as $u) {
    echo "ID: {$u['id']} | Email: {$u['email']} | Name: {$u['name']}\n";
}

echo "\n=== WORKSPACE MEMBERS ===\n";
$members = $db->query("SELECT m.workspace_id, m.user_id, w.name as workspace_name, m.role FROM workspace_members m JOIN workspaces w ON m.workspace_id = w.id")->fetchAll(PDO::FETCH_ASSOC);
foreach ($members as $m) {
    echo "WS: [{$m['workspace_id']}] {$m['workspace_name']} | User: [{$m['user_id']}] | Role: {$m['role']}\n";
}
