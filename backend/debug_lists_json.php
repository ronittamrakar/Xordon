<?php
require_once __DIR__ . '/src/Database.php';
require_once __DIR__ . '/src/Auth.php';

use Xordon\Database;

header('Content-Type: application/json');

try {
    $pdo = Database::conn();
    
    $stmt = $pdo->query("SELECT * FROM contact_lists");
    $lists = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode($lists, JSON_PRETTY_PRINT);

} catch (Exception $e) {
    echo json_encode(['error' => $e->getMessage()]);
}
