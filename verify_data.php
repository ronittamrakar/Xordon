<?php
require_once __DIR__ . '/backend/src/Database.php';

// Load .env
$envFile = __DIR__ . '/.env';
if (file_exists($envFile)) {
    $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos(trim($line), '#') === 0) continue;
        if (strpos($line, '=') === false) continue;
        list($name, $value) = explode('=', $line, 2);
        $_ENV[trim($name)] = trim($value);
        putenv(trim($name) . '=' . trim($value));
    }
}

use Xordon\Database;

$db = Database::conn();
echo "=== CAMPAIGNS ===\n";
$stmt = $db->query('SELECT id, name, subject, status FROM campaigns LIMIT 5');
while($row = $stmt->fetch()) {
    echo "ID: {$row['id']}, Name: {$row['name']}, Status: {$row['status']}\n";
}

echo "\n=== FORMS ===\n";
$stmt = $db->query('SELECT id, name, status FROM forms LIMIT 5');
while($row = $stmt->fetch()) {
    echo "ID: {$row['id']}, Name: {$row['name']}, Status: {$row['status']}\n";
}

echo "\n=== SEQUENCES ===\n";
$stmt = $db->query('SELECT id, name, status FROM sequences LIMIT 5');
while($row = $stmt->fetch()) {
    echo "ID: {$row['id']}, Name: {$row['name']}, Status: {$row['status']}\n";
}
