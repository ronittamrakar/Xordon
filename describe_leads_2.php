<?php
require_once __DIR__ . '/backend/src/Database.php';
try {
    $db = Database::conn();
    $stmt = $db->query("DESCRIBE leads");
    $result = $stmt->fetchAll(PDO::FETCH_ASSOC);
    file_put_contents('leads_schema.txt', print_r($result, true));
    echo "Done";
} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
