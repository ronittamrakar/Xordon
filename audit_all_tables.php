<?php
require_once __DIR__ . '/backend/src/Config.php';
require_once __DIR__ . '/backend/src/Database.php';

$db = Database::conn();

$tables = $db->query("SHOW TABLES")->fetchAll(PDO::FETCH_COLUMN);

echo "=== TABLE COUNTS (TOTAL) ===\n";
foreach ($tables as $table) {
    try {
        $count = $db->query("SELECT COUNT(*) FROM `$table`")->fetchColumn();
        if ($count > 0) {
            echo "$table: $count\n";
        }
    } catch (Exception $e) {}
}

echo "\n=== DATA IN WORKSPACE 1 ===\n";
foreach ($tables as $table) {
    try {
        $cols = $db->query("DESCRIBE `$table`")->fetchAll(PDO::FETCH_COLUMN);
        if (in_array('workspace_id', $cols)) {
            $count = $db->query("SELECT COUNT(*) FROM `$table` WHERE workspace_id = 1")->fetchColumn();
            if ($count > 0) {
                echo "$table: $count\n";
            }
        }
    } catch (Exception $e) {}
}
