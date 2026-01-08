<?php
require __DIR__ . '/backend/src/bootstrap.php';
$pdo = Database::conn();
$stmt = $pdo->query('DESCRIBE contact_lists');
echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC), JSON_PRETTY_PRINT);
