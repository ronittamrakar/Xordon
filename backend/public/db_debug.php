<?php
require_once __DIR__ . '/../src/bootstrap.php';
require_once __DIR__ . '/../src/Database.php';

try {
    $db = \Xordon\Database::conn();
    $stmt = $db->query("DESCRIBE payment_transactions");
    $cols = $stmt->fetchAll(PDO::FETCH_COLUMN);
    echo implode(',', $cols);
} catch (Exception $e) {
    echo "ERROR: " . $e->getMessage();
}
