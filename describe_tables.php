<?php
require 'backend/src/Database.php';

try {
    $db = Xordon\Database::conn();
    $tables = ['tickets', 'ticket_stages', 'ticket_teams', 'ticket_types', 'kb_articles', 'kb_categories'];
    foreach ($tables as $table) {
        echo "Schema for $table:\n";
        try {
            $stmt = $db->query("DESCRIBE $table");
            while($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
                echo "  {$row['Field']} - {$row['Type']}\n";
            }
        } catch(Exception $e) {
            echo "  Error describing $table: " . $e->getMessage() . "\n";
        }
        echo "\n";
    }
} catch(Exception $e) {
    echo 'Error: ' . $e->getMessage() . "\n";
}
