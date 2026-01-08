<?php
require_once __DIR__ . '/../vendor/autoload.php';
require_once __DIR__ . '/../src/Config.php';
require_once __DIR__ . '/../src/bootstrap.php';
require_once __DIR__ . '/../src/Database.php';

$file = __DIR__ . '/../migrations/add_helpdesk_phase3_features.sql';
if (!file_exists($file)) {
    echo "Migration file not found\n";
    exit(1);
}
$sql = file_get_contents($file);
// Naive split by semicolon - sufficient for our migration
$parts = preg_split('/;\s*\n/', $sql);
$pdo = Xordon\Database::conn();
foreach ($parts as $p) {
    $stmt = trim($p);
    if ($stmt === '') continue;
    try {
        $pdo->exec($stmt);
        echo "Executed: " . substr(trim($stmt), 0, 80) . "...\n";
    } catch (Exception $e) {
        echo "Failed: " . $e->getMessage() . "\n";
    }
}

echo "Migration applied.\n";
