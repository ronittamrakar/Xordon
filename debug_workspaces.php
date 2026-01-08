<?php
require_once __DIR__ . '/backend/src/Config.php';
require_once __DIR__ . '/backend/src/Database.php';

$db = Database::conn();

echo "=== WORKSPACES ===\n";
$ws = $db->query("SELECT * FROM workspaces")->fetchAll(PDO::FETCH_ASSOC);
print_r($ws);

echo "\n=== MEMBERS SCHEMA ===\n";
$cols = $db->query("DESCRIBE workspace_members")->fetchAll(PDO::FETCH_COLUMN);
print_r($cols);
