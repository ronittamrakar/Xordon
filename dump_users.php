<?php
require_once __DIR__ . '/backend/src/Auth.php';
session_start();
// This script won't have the Bearer token if run from CLI, but maybe I can check the database users
require_once __DIR__ . '/backend/src/Database.php';
$db = Database::conn();
$stmt = $db->query("SELECT id, email, name FROM users");
$rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
echo json_encode($rows, JSON_PRETTY_PRINT);
