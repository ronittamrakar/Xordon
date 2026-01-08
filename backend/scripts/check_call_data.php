<?php

require_once __DIR__ . '/../src/Database.php';

try {
    $pdo = Database::conn();
    
    // Check call_scripts
    $stmt = $pdo->query('SELECT COUNT(*) as count FROM call_scripts');
    $scriptsCount = $stmt->fetch()['count'];
    echo "Call Scripts Count: $scriptsCount\n";
    
    // Check call_disposition_types
    try {
        $stmt = $pdo->query('SELECT COUNT(*) as count FROM call_disposition_types');
        $dispositionsCount = $stmt->fetch()['count'];
        echo "Call Dispositions Count (call_disposition_types): $dispositionsCount\n";
    } catch (Exception $e) {
        echo "call_disposition_types table not found, trying call_dispositions_types...\n";
        try {
            $stmt = $pdo->query('SELECT COUNT(*) as count FROM call_dispositions_types');
            $dispositionsCount = $stmt->fetch()['count'];
            echo "Call Dispositions Count (call_dispositions_types): $dispositionsCount\n";
        } catch (Exception $e2) {
            echo "Neither table exists: " . $e2->getMessage() . "\n";
        }
    }
    
    // List all tables
    echo "\nAll tables in database:\n";
    $stmt = $pdo->query("SHOW TABLES");
    while ($row = $stmt->fetch(PDO::FETCH_NUM)) {
        echo "  - " . $row[0] . "\n";
    }
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
