<?php
require __DIR__ . '/backend/src/bootstrap.php';
$pdo = Database::conn();
echo "DATA WITH PARENT_ID:\n";
$stmt = $pdo->query('SELECT id, name, parent_id, is_folder FROM contact_lists WHERE workspace_id = 1');
print_r($stmt->fetchAll(PDO::FETCH_ASSOC));
