<?php
require_once __DIR__ . '/backend/src/Database.php';

// Mock env for local connection
$_ENV['DB_HOST'] = '127.0.0.1';
$_ENV['DB_NAME'] = 'xordon';
$_ENV['DB_USER'] = 'root';
$_ENV['DB_PASS'] = '';

try {
    $pdo = Xordon\Database::conn();
    
    echo "Users and Roles:\n";
    $stmt = $pdo->query('SELECT u.id, u.email, u.role_id, r.name as role_name FROM users u LEFT JOIN roles r ON u.role_id = r.id');
    print_r($stmt->fetchAll(PDO::FETCH_ASSOC));
    
    echo "\nUser ID 1:\n";
    $stmt = $pdo->query('SELECT * FROM users WHERE id = 1');
    print_r($stmt->fetch());

    echo "\nAll Roles:\n";
    $stmt = $pdo->query('SELECT id, name FROM roles');
    print_r($stmt->fetchAll(PDO::FETCH_ASSOC));
    
    echo "\nRole 1 Permissions:\n";
    $stmt = $pdo->prepare('SELECT p.key FROM permissions p JOIN role_permissions rp ON p.id = rp.permission_id WHERE rp.role_id = ?');
    $stmt->execute([1]);
    print_r($stmt->fetchAll(PDO::FETCH_COLUMN));

    echo "\nAll Permissions:\n";
    $stmt = $pdo->query('SELECT id, name, `key` FROM permissions LIMIT 20');
    print_r($stmt->fetchAll(PDO::FETCH_ASSOC));

} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
