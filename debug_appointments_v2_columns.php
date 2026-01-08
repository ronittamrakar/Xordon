<?php
require_once 'backend/src/Database.php';
try {
    $db = Database::conn();
    $stmt = $db->query("DESCRIBE appointments_v2");
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        echo $row['Field'] . "\n";
    }
} catch (Exception $e) {
    echo $e->getMessage();
}
