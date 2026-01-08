<?php
require_once 'backend/src/Database.php';
use Xordon\Database;

try {
    $pdo = new PDO('mysql:host=127.0.0.1;dbname=xordon', 'root', '');
    echo "Companies:\n";
    $stmt = $pdo->query('SELECT id, name, workspace_id FROM companies');
    print_r($stmt->fetchAll(PDO::FETCH_ASSOC));
    
    echo "\nWorkspaces:\n";
    $stmt = $pdo->query('SELECT id, name FROM workspaces');
    print_r($stmt->fetchAll(PDO::FETCH_ASSOC));
} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
