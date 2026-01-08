<?php
require_once __DIR__ . '/backend/vendor/autoload.php';
require_once __DIR__ . '/backend/src/Database.php';

function printSchema($table) {
    try {
        $pdo = Xordon\Database::conn();
        echo "--- $table TABLE ---\n";
        $stmt = $pdo->query("DESCRIBE $table");
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
        foreach ($rows as $row) {
            echo "{$row['Field']} | {$row['Type']} | Null: {$row['Null']} | Key: {$row['Key']} | Default: {$row['Default']}\n";
        }
    } catch (Exception $e) {
        echo "Error describing $table: " . $e->getMessage() . "\n";
    }
}

printSchema('products');
echo "\n";
printSchema('services');
