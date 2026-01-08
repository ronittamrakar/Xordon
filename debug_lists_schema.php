<?php
require __DIR__ . '/backend/src/bootstrap.php';
try {
    $pdo = Database::conn();
    $stmt = $pdo->query('DESCRIBE contact_lists');
    print_r($stmt->fetchAll(PDO::FETCH_ASSOC));
} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
