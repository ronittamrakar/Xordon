<?php
require_once __DIR__ . '/src/Database.php';

$sql = file_get_contents(__DIR__ . '/migrations/create_webinars_tables.sql');
$db = Database::conn();

// Split by semicolons and execute each statement
$statements = array_filter(array_map('trim', explode(';', $sql)));

foreach ($statements as $statement) {
    if (empty($statement) || strpos($statement, '--') === 0) continue;
    
    try {
        $db->exec($statement);
        echo "Executed: " . substr($statement, 0, 50) . "...\n";
    } catch (PDOException $e) {
        echo "Error: " . $e->getMessage() . "\n";
        echo "Statement: " . substr($statement, 0, 100) . "...\n";
    }
}

echo "\nWebinars tables migration completed!\n";
