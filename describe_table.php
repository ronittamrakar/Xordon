<?php
require 'backend/src/Database.php';
$table = $argv[1] ?? 'jobs';
try {
    $pdo = Xordon\Database::conn();
    $stmt = $pdo->query("DESCRIBE `$table` ");
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode($rows, JSON_PRETTY_PRINT);
} catch (Exception $e) {
    echo "ERROR: " . $e->getMessage();
}
