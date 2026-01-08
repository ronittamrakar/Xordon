<?php
require_once __DIR__ . '/src/Database.php';

try {
    $pdo = Database::conn();
    $tables = $pdo->query("SHOW TABLES")->fetchAll(PDO::FETCH_COLUMN);
    echo "Tables:\n" . implode("\n", $tables) . "\n\n";

    echo "Columns in projects:\n";
    $cols = $pdo->query("DESCRIBE projects")->fetchAll(PDO::FETCH_ASSOC);
    foreach ($cols as $c) echo $c['Field'] . "\n";

    echo "\nColumns in sales_tasks:\n";
    $cols = $pdo->query("DESCRIBE sales_tasks")->fetchAll(PDO::FETCH_ASSOC);
    foreach ($cols as $c) echo $c['Field'] . "\n";

} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
