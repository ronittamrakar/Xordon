<?php
require_once __DIR__ . '/backend/src/Database.php';
use Xordon\Database;

try {
    $db = Database::conn();
    $stmt = $db->query("DESCRIBE seo_pages");
    print_r($stmt->fetchAll());
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
