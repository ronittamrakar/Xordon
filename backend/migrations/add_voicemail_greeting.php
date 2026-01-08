<?php
// Load environment variables from .env file
$envFile = __DIR__ . '/../../.env';
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

require_once __DIR__ . '/../src/bootstrap.php';
require_once __DIR__ . '/../src/Database.php';

$pdo = Database::conn();

echo "Adding voicemail_greeting column to phone_numbers...\n";

try {
    $pdo->exec("ALTER TABLE phone_numbers ADD COLUMN voicemail_greeting TEXT DEFAULT NULL");
    echo "Successfully added voicemail_greeting column.\n";
} catch (Exception $e) {
    // Check if error is due to duplicate column
    if (strpos($e->getMessage(), 'Duplicate column') !== false || strpos($e->getMessage(), 'instructions') !== false) {
        echo "Column voicemail_greeting already exists.\n";
    } else {
        echo "Error adding column: " . $e->getMessage() . "\n";
    }
}
