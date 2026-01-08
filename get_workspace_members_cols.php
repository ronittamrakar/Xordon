<?php
require_once __DIR__ . '/backend/src/Config.php';
require_once __DIR__ . '/backend/src/Database.php';
$db = Database::conn();
$cols = $db->query("DESCRIBE workspace_members")->fetchAll(PDO::FETCH_ASSOC);
echo json_encode($cols, JSON_PRETTY_PRINT);
