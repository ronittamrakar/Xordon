<?php
require_once __DIR__ . '/backend/src/Database.php';
$pdo = Xordon\Database::conn();
$stmt = $pdo->prepare("SELECT * FROM auth_tokens WHERE user_id = 19 ORDER BY created_at DESC LIMIT 1");
$stmt->execute();
echo json_encode($stmt->fetch(PDO::FETCH_ASSOC), JSON_PRETTY_PRINT);
