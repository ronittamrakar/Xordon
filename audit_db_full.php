<?php
require_once 'backend/server/db_connect.php';

try {
    $stmt = $pdo->query("SHOW TABLES");
    $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);

    echo "Found " . count($tables) . " tables in the database:\n";
    echo str_pad("Table Name", 40) . " | " . "Rows\n";
    echo str_repeat("-", 60) . "\n";

    foreach ($tables as $table) {
        $countStmt = $pdo->query("SELECT COUNT(*) FROM `$table`");
        $count = $countStmt->fetchColumn();
        echo str_pad($table, 40) . " | " . $count . "\n";
    }

} catch (PDOException $e) {
    echo "Error: " . $e->getMessage();
}
?>
