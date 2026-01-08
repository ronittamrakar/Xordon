<?php
require_once __DIR__ . '/backend/src/Database.php';
try {
    $db = Database::conn();
    $stmt = $db->query("DESCRIBE leads");
    $result = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode($result, JSON_PRETTY_PRINT);
} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
