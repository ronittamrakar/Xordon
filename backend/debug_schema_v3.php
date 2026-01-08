<?php
require_once __DIR__ . '/src/Database.php';
$pdo = Xordon\Database::conn();
try {
    $res = $pdo->query('DESCRIBE contact_lists')->fetchAll(PDO::FETCH_ASSOC);
    foreach($res as $row) {
        echo $row['Field'] . " (" . $row['Type'] . ") - Null: " . $row['Null'] . ", Default: " . ($row['Default'] ?? 'NULL') . "\n";
    }
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
