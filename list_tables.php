<?php
require 'backend/src/Database.php';
try {
    $pdo = Xordon\Database::conn();
    $stmt = $pdo->query('SHOW TABLES');
    $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);
    echo implode("\n", $tables);
} catch (Exception $e) {
    echo "ERROR: " . $e->getMessage();
}
