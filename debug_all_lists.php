<?php
require __DIR__ . '/backend/src/bootstrap.php';
$pdo = Database::conn();
echo "ALL DATA IN contact_lists:\n";
$stmt = $pdo->query('SELECT id, name, workspace_id, is_folder FROM contact_lists');
print_r($stmt->fetchAll(PDO::FETCH_ASSOC));
