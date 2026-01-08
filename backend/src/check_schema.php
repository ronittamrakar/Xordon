<?php
require_once 'Database.php';
$stmt = Database::conn()->query("DESCRIBE phone_numbers");
$columns = $stmt->fetchAll(PDO::FETCH_ASSOC);
echo json_encode($columns, JSON_PRETTY_PRINT);
