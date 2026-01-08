<?php
// Database check script for helpdesk tables

$host = 'localhost';
$dbname = 'xordon';
$username = 'root';
$password = '';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    echo "=== HELPDESK DATABASE CHECK ===\n\n";
    
    // Check for core tables
    $tables = [
        'tickets',
        'ticket_messages',
        'ticket_activities',
        'ticket_teams',
        'ticket_stages',
        'ticket_types',
        'sla_policies',
        'kb_articles',
        'kb_categories',
        'ticket_canned_responses',
        'ticket_saved_filters',
        'ticket_bulk_actions_log',
        'ticket_csat_surveys',
        'ticket_merge_history'
    ];
    
    echo "Checking tables:\n";
    foreach ($tables as $table) {
        $stmt = $pdo->query("SHOW TABLES LIKE '$table'");
        $exists = $stmt->fetch();
        echo "  " . ($exists ? "✓" : "✗") . " $table\n";
    }
    
    echo "\n";
    
    // Check row counts
    echo "Checking data:\n";
    $dataTables = [
        'ticket_stages' => 'Default stages',
        'ticket_types' => 'Default types',
        'ticket_teams' => 'Default teams',
        'sla_policies' => 'Default SLA',
        'kb_categories' => 'Default categories'
    ];
    
    foreach ($dataTables as $table => $description) {
        try {
            $stmt = $pdo->query("SELECT COUNT(*) as count FROM $table");
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            echo "  $table: {$result['count']} rows ($description)\n";
        } catch (Exception $e) {
            echo "  $table: ERROR - " . $e->getMessage() . "\n";
        }
    }
    
    echo "\n=== CHECK COMPLETE ===\n";
    
} catch (PDOException $e) {
    echo "Database connection failed: " . $e->getMessage() . "\n";
    echo "\nPlease ensure:\n";
    echo "1. MySQL is running\n";
    echo "2. Database 'xordon' exists\n";
    echo "3. Credentials are correct\n";
}
