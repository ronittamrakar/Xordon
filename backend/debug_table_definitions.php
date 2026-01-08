<?php
// backend/debug_table_definitions.php

$tablesToFind = [
    'ad_performance_metrics',
    'ticket_merge_history',
    'ticket_split_history',
    'ticket_csat_survey_sends' // derived from file name likely
];

$files = [
    'backend/migrations/add_ads_manager.sql',
    'backend/migrations/add_helpdesk_phase3_features.sql',
    'backend/migrations/add_helpdesk_module.sql' // checking here too just in case
];

foreach ($files as $f) {
    if (!file_exists($f)) continue;
    $content = file_get_contents($f);
    echo "--- Scanning $f ---\n";
    
    foreach ($tablesToFind as $table) {
        // Regex to match CREATE TABLE block until the closing );
        // This is a rough extractor
        $pattern = '/CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?`?' . $table . '`?.*?;/si';
        if (preg_match($pattern, $content, $matches)) {
            echo "FOUND DEFINITION FOR: $table\n";
            echo $matches[0] . "\n\n";
        }
    }
}
