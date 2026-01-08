<?php
require_once __DIR__ . '/backend/src/Database.php';
$pdo = Database::conn();
$stmt = $pdo->query("SELECT id, title, status, workspace_id, folder_id FROM webforms_forms");
$forms = $stmt->fetchAll(PDO::FETCH_ASSOC);
echo json_encode($forms, JSON_PRETTY_PRINT);
