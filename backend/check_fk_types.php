<?php
require_once __DIR__ . '/src/Database.php';
use Xordon\Database;

$pdo = Database::conn();

echo "Checking ad_campaigns structure...\n";
$stmt = $pdo->query("DESCRIBE ad_campaigns");
$cols = $stmt->fetchAll(PDO::FETCH_ASSOC);
foreach ($cols as $c) {
    if ($c['Field'] === 'id') {
        echo "ad_campaigns.id TYPE: " . $c['Type'] . "\n";
    }
}

echo "\nChecking tickets structure...\n";
$stmt = $pdo->query("DESCRIBE tickets");
$cols = $stmt->fetchAll(PDO::FETCH_ASSOC);
foreach ($cols as $c) {
    if ($c['Field'] === 'id') {
        echo "tickets.id TYPE: " . $c['Type'] . "\n";
    }
}
