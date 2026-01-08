<?php
require_once __DIR__ . '/backend/src/Database.php';
try {
    $db = Database::conn();
    echo "--- APPOINTMENTS ---\n";
    $stmt = $db->query("DESCRIBE appointments");
    $details = $stmt->fetchAll(PDO::FETCH_ASSOC);
    foreach ($details as $col) {
        echo $col['Field'] . " (" . $col['Type'] . ")\n";
    }

    echo "\n--- STAFF MEMBERS ---\n";
    $stmt = $db->query("DESCRIBE staff_members");
    $details = $stmt->fetchAll(PDO::FETCH_ASSOC);
    foreach ($details as $col) {
        echo $col['Field'] . " (" . $col['Type'] . ")\n";
    }

} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
