<?php
require_once __DIR__ . '/backend/src/Database.php';

use Xordon\Database;

try {
    $db = Database::conn();
    
    echo "Running backfill using 'workspace_members' instead of 'user_workspaces'...\n";
    
    $queries = [
        "UPDATE leads l
         LEFT JOIN workspace_members wm ON wm.user_id = l.user_id
         SET l.workspace_id = wm.workspace_id
         WHERE l.workspace_id IS NULL AND wm.workspace_id IS NOT NULL",
         
        "UPDATE lead_activities la
         LEFT JOIN workspace_members wm ON wm.user_id = la.user_id
         SET la.workspace_id = wm.workspace_id
         WHERE la.workspace_id IS NULL AND wm.workspace_id IS NOT NULL",
         
        "UPDATE lead_tags lt
         LEFT JOIN workspace_members wm ON wm.user_id = lt.user_id
         SET lt.workspace_id = wm.workspace_id
         WHERE lt.workspace_id IS NULL AND wm.workspace_id IS NOT NULL",
         
        "UPDATE crm_tasks ct
         LEFT JOIN workspace_members wm ON wm.user_id = ct.created_by
         SET ct.workspace_id = wm.workspace_id
         WHERE ct.workspace_id IS NULL AND wm.workspace_id IS NOT NULL"
    ];
    
    foreach ($queries as $query) {
        try {
            $count = $db->exec($query);
            echo "Updated $count rows in " . substr($query, 7, 20) . "...\n";
        } catch (Exception $e) {
            echo "Error: " . $e->getMessage() . "\n";
        }
    }

    echo "\nVerifying columns in 'leads' table:\n";
    $stmt = $db->query("DESCRIBE leads");
    print_r($stmt->fetchAll(PDO::FETCH_COLUMN));

} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
