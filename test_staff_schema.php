<?php
require_once __DIR__ . '/backend/src/Database.php';
try {
    $db = Database::conn();
    echo "--- STAFF SERVICES ---\n";
    try {
        $stmt = $db->query("DESCRIBE staff_services");
        $details = $stmt->fetchAll(PDO::FETCH_ASSOC);
        foreach ($details as $col) {
            echo $col['Field'] . " (" . $col['Type'] . ")\n";
        }
    } catch (Exception $e) { echo "Table staff_services error: " . $e->getMessage() . "\n"; }

    echo "\n--- STAFF AVAILABILITY ---\n";
    try {
        $stmt = $db->query("DESCRIBE staff_availability");
        $details = $stmt->fetchAll(PDO::FETCH_ASSOC);
        foreach ($details as $col) {
            echo $col['Field'] . " (" . $col['Type'] . ")\n";
        }
    } catch (Exception $e) { echo "Table staff_availability error: " . $e->getMessage() . "\n"; }

} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
