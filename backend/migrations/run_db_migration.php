<?php
ini_set('display_errors', '1');
error_reporting(E_ALL);

// Load .env logic (copied from index.php)
$envFile = __DIR__ . '/../.env';
if (file_exists($envFile)) {
    $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos(trim($line), '#') === 0) continue;
        if (strpos($line, '=') !== false) {
            list($name, $value) = explode('=', $line, 2);
            $name = trim($name);
            $value = trim($value);
            if (!array_key_exists($name, $_SERVER) && !array_key_exists($name, $_ENV)) {
                putenv(sprintf('%s=%s', $name, $value));
                $_ENV[$name] = $value;
                $_SERVER[$name] = $value;
            }
        }
    }
}

require_once __DIR__ . '/../src/Database.php';

use Xordon\Database;

if ($argc < 2) {
    die("Usage: php run_db_migration.php <path_to_sql_file>\n");
}

$sqlFile = $argv[1];
if (!file_exists($sqlFile)) {
    die("File not found: $sqlFile\n");
}

echo "Running migration: $sqlFile\n";
$sql = file_get_contents($sqlFile);

try {
    Database::conn()->exec($sql);
    echo "Success!\n";
} catch (Exception $e) {
    die("Error: " . $e->getMessage() . "\n");
}
