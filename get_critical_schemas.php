<?php
require_once __DIR__ . '/backend/src/Config.php';
require_once __DIR__ . '/backend/src/Database.php';
$db = Database::conn();

$tables = [
    'proposal_templates',
    'automations',
    'webforms',
    'forms'
];

foreach ($tables as $t) {
    try {
        $cols = $db->query("DESCRIBE `$t`")->fetchAll(PDO::FETCH_ASSOC);
        echo "Table: $t\n";
        foreach ($cols as $c) {
            echo "  - {$c['Field']} ({$c['Type']})\n";
        }
    } catch (Exception $e) {
        echo "Table: $t - ERROR: " . $e->getMessage() . "\n";
    }
    echo "\n";
}
