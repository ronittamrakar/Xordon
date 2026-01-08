<?php
require_once __DIR__ . '/backend/src/Database.php';
$pdo = Database::conn();
$stmt = $pdo->query("SELECT id, title, status, workspace_id, folder_id FROM webforms_forms");
$forms = $stmt->fetchAll(PDO::FETCH_ASSOC);
foreach ($forms as $f) {
    echo "ID: {$f['id']} | Title: {$f['title']} | Status: {$f['status']} | Workspace: {$f['workspace_id']}\n";
}
