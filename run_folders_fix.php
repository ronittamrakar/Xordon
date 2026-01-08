<?php
// Load environment
$envFile = __DIR__ . '/backend/.env';
if (file_exists($envFile)) {
    $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos(trim($line), '#') === 0) continue;
        if (strpos($line, '=') !== false) {
            list($name, $value) = explode('=', $line, 2);
            $name = trim($name);
            $value = trim($value);
            putenv(sprintf('%s=%s', $name, $value));
            $_ENV[$name] = $value;
            $_SERVER[$name] = $value;
        }
    }
}

require_once __DIR__ . '/backend/src/Database.php';
use Xordon\Database;

try {
    $pdo = Database::conn();
    $sql = file_get_contents(__DIR__ . '/backend/migrations/fix_folders_workspace_id.sql');
    
    // PDO doesn't support multiple queries in one exec() for many drivers, 
    // but MariaDB/MySQL often does if emulation is on.
    // However, it's safer to split by ; or use multiple exec calls.
    // But since this SQL has complex SET and PREPARE, splitting is hard.
    
    // We can try exec directly.
    $pdo->exec($sql);
    echo "Migration successful!\n";
} catch (Exception $e) {
    echo "Migration failed: " . $e->getMessage() . "\n";
}
