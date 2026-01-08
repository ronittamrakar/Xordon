<?php
require __DIR__ . '/backend/src/bootstrap.php';
$pdo = Database::conn();
echo "FINAL SCHEMA CHECK:\n";
$stmt = $pdo->query('DESCRIBE contact_lists');
print_r($stmt->fetchAll(PDO::FETCH_ASSOC));
