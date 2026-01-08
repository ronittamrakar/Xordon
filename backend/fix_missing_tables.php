<?php
require_once __DIR__ . '/src/Database.php';

use Xordon\Database;

// Increase memory limit
ini_set('memory_limit', '512M');

// List of MISSING tables identified in previous validation
$missingTables = [
    '_webforms_user_map',
    'ad_performance_metrics',
    'ai_content_generations',
    'ai_recommendations',
    'ai_sentiment_analysis',
    'analytics_events',
    'automation_metrics',
    'automation_split_tests',
    'battle_cards',
    'brand_configurations',
    'checkout_forms',
    'cohort_analysis',
    'custom_dashboards',
    'deal_room_analytics',
    'deal_room_content',
    'deal_rooms',
    'facebook_pages',
    'file_activities',
    'file_shares',
    'funnel_analytics',
    'message_queue',
    'mobile_devices',
    'mobile_sessions',
    'mutual_action_plan_items',
    'mutual_action_plans',
    'order_items',
    'orders',
    'page_components',
    'page_sections',
    'playbook_resources',
    'playbook_sections',
    'portal_documents',
    'portal_messages',
    'push_notifications',
    'sales_content',
    'sales_content_analytics',
    'sales_playbooks',
    'sales_snippets',
    'sales_training_programs',
    'scheduled_reports',
    'ticket_csat_survey_sends',
    'ticket_merge_history',
    'ticket_split_history',
    'training_modules',
    'training_progress',
    'usage_metrics'
];

echo "Starting Missing Table Restoration...\n";
echo "Targeting " . count($missingTables) . " missing tables.\n";

// 1. Scan migrations to map Table -> File
$migrationsDir = __DIR__ . '/migrations';
$migrationFiles = glob($migrationsDir . '/*.sql');
$tableToFile = [];

foreach ($migrationFiles as $file) {
    $content = file_get_contents($file);
    if (preg_match_all('/CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?`?([a-zA-Z0-9_]+)`?/i', $content, $matches)) {
        foreach ($matches[1] as $tableName) {
            // Note: Case insensitive check might be safer
            $tableToFile[$tableName] = $file;
        }
    }
}

// 2. Identify Files to Run
$filesToRun = [];
foreach ($missingTables as $table) {
    if (isset($tableToFile[$table])) {
        $filesToRun[] = $tableToFile[$table];
    } else {
        echo "WARNING: Could not find migration file for table: $table\n";
    }
}
$filesToRun = array_unique($filesToRun);

echo "Found " . count($filesToRun) . " migration files to execute.\n";

// 3. Execute Migrations
try {
    $pdo = Database::conn();
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    foreach ($filesToRun as $file) {
        $filename = basename($file);
        echo "Running $filename... ";
        
        $sql = file_get_contents($file);
        
        try {
            // Attempt to run the whole file
            // Note: This assumes the SQL is valid to run (e.g. IF NOT EXISTS or acceptable to fail if partial)
            // Splitting by ; is safer for some drivers, so let's try a basic split if exec fails?
            // Actually, PDO::exec usually handles multiple statements if emulation is off/on depending on config.
            // Let's try raw exec first.
            
            $pdo->exec($sql);
            echo "SUCCESS\n";
            
            // Mark as migrated?
            // $pdo->exec("INSERT IGNORE INTO migrations (migration) VALUES ('$filename')");
            
        } catch (PDOException $e) {
            echo "PARTIAL FAILURE (Code: " . $e->getCode() . ")\n";
            echo "  Msg: " . $e->getMessage() . "\n";
            
            // Fallback: If "Table already exists", we might want to try splitting queries?
            // For now, we assume failure might be due to partial existence.
        }
    }

} catch (Exception $e) {
    echo "FATAL ERROR: " . $e->getMessage() . "\n";
    exit(1);
}

echo "\nRestoration sequence completed.\n";
