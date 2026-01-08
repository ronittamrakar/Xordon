<?php
require_once __DIR__ . '/../src/Database.php';

header('Content-Type: application/json');
try {
    $db = \Xordon\Database::conn();
    $stmt = $db->query("SELECT count(*) as count FROM users");
    $count = $stmt->fetchColumn();
    echo json_encode([
        'status' => 'success',
        'message' => 'Database connected!',
        'user_count' => $count
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => $e->getMessage()
    ]);
}
