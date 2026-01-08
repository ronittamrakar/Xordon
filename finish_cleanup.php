<?php
require_once __DIR__ . '/backend/src/Database.php';

try {
    $db = Database::conn();
    echo "Connected to database.\n";

    $tablesToDrop = [
        'fsm_job_line_items',
        'fsm_job_status_history',
        'fsm_jobs'
    ];

    foreach ($tablesToDrop as $table) {
        $check = $db->query("SHOW TABLES LIKE '$table'")->fetch();
        if ($check) {
            $db->exec("DROP TABLE $table");
            echo "Dropped table '$table'.\n";
        } else {
            echo "Table '$table' not found (already dropped).\n";
        }
    }

    echo "FSM cleanup complete.\n";

} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
