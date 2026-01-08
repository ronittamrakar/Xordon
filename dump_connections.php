<?php
require_once __DIR__ . '/backend/src/Database.php';
$db = Database::conn();
$stmt = $db->query("SELECT id, user_id, workspace_id, name, provider, status FROM connections");
$rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
echo json_encode($rows, JSON_PRETTY_PRINT);
