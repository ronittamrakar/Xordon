<?php
require __DIR__ . '/backend/src/bootstrap.php';
$pdo = Database::conn();
$stmt = $pdo->query('SELECT * FROM contact_lists WHERE is_folder = 1');
print_r($stmt->fetchAll(PDO::FETCH_ASSOC));
