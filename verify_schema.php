<?php
require_once 'backend/src/Database.php';

$db = Database::conn();

function checkTable($db, $table) {
    echo "Checking table: $table\n";
    try {
        $stmt = $db->query("DESCRIBE $table");
        $columns = $stmt->fetchAll(PDO::FETCH_ASSOC);
        foreach ($columns as $col) {
            echo " - {$col['Field']} ({$col['Type']})\n";
        }
    } catch (Exception $e) {
        echo " Error: " . $e->getMessage() . "\n";
    }
    echo "\n";
}

checkTable($db, 'booking_pages');
checkTable($db, 'appointments');
checkTable($db, 'booking_leads');
