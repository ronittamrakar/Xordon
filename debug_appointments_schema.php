<?php
require_once 'backend/src/Database.php';
try {
    $db = Database::conn();
    $stmt = $db->query("SHOW CREATE TABLE appointments");
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    echo $row['Create Table'] ?? $row['Create View'];
} catch (Exception $e) {
    echo $e->getMessage();
}
