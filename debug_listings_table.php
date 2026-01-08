<?php
require_once __DIR__ . '/backend/src/Database.php';
use Xordon\Database;

$db = Database::conn();
$stmt = $db->query("DESCRIBE business_listings");
print_r($stmt->fetchAll(PDO::FETCH_ASSOC));
