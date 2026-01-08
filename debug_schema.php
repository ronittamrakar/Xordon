<?php
require_once 'backend/src/Database.php';
$tables = ['phone_numbers', 'call_flows'];
$schema = [];
foreach ($tables as $table) {
    try {
        $stmt = Database::conn()->query("DESCRIBE $table");
        $schema[$table] = $stmt->fetchAll(PDO::FETCH_COLUMN, 0);
    } catch (Exception $e) {
        $schema[$table] = "Error: " . $e->getMessage();
    }
}
echo json_encode($schema, JSON_PRETTY_PRINT);
