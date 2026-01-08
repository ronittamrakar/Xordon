<?php
require_once __DIR__ . '/src/Database.php';

$db = Database::conn();

echo "=== WEBINARS TABLE STRUCTURE ===\n";
$stmt = $db->query("DESCRIBE webinars");
$columns = $stmt->fetchAll(PDO::FETCH_ASSOC);
foreach ($columns as $col) {
    echo "{$col['Field']}: {$col['Type']} {$col['Null']} {$col['Key']} {$col['Default']}\n";
}

echo "\n=== LOYALTY_PROGRAMS TABLE STRUCTURE ===\n";
$stmt = $db->query("DESCRIBE loyalty_programs");
$columns = $stmt->fetchAll(PDO::FETCH_ASSOC);
foreach ($columns as $col) {
    echo "{$col['Field']}: {$col['Type']} {$col['Null']} {$col['Key']} {$col['Default']}\n";
}

echo "\n=== LOYALTY_REWARDS TABLE STRUCTURE ===\n";
$stmt = $db->query("DESCRIBE loyalty_rewards");
$columns = $stmt->fetchAll(PDO::FETCH_ASSOC);
foreach ($columns as $col) {
    echo "{$col['Field']}: {$col['Type']} {$col['Null']} {$col['Key']} {$col['Default']}\n";
}
