<?php
require_once __DIR__ . '/backend/src/Database.php';
require_once __DIR__ . '/backend/src/Config.php';

// Load .env manually for DB credentials
$envFile = __DIR__ . '/backend/.env';
if (file_exists($envFile)) {
    $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos(trim($line), '#') === 0) continue;
        if (strpos($line, '=') !== false) {
            list($name, $value) = explode('=', $line, 2);
            putenv(trim($name) . '=' . trim($value));
        }
    }
}

try {
    $pdo = \Xordon\Database::conn();
    $stmt = $pdo->query('SHOW TABLES');
    $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);
    $patterns = ['listing', 'directory', 'business'];
    foreach($tables as $t) {
        foreach($patterns as $p) {
            if(strpos($t, $p) !== false) {
                echo $t . PHP_EOL;
                break;
            }
        }
    }
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
