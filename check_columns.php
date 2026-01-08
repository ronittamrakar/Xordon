<?php
require __DIR__ . '/backend/src/bootstrap.php';
$pdo = Database::conn();
$stmt = $pdo->query('DESCRIBE contact_lists');
$columns = $stmt->fetchAll(PDO::FETCH_ASSOC);
foreach ($columns as $col) {
    echo $col['Field'] . " - " . $col['Type'] . " - Default: " . ($col['Default'] ?? 'NULL') . "\n";
}
