<?php
require_once __DIR__ . '/backend/src/Database.php';
require_once __DIR__ . '/backend/src/Config.php';

use Xordon\Database;

try {
    $pdo = Database::conn();
    $sql = file_get_contents(__DIR__ . '/backend/migrations/enhance_directories_v3.sql');
    $pdo->exec($sql);
    echo "Directory enhancement v3 migration applied successfully.\n";
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
