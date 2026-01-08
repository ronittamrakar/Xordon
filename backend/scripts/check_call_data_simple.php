<?php

require_once __DIR__ . '/../src/Database.php';

try {
    $pdo = Database::conn();
    
    // Check call_scripts
    $stmt = $pdo->query('SELECT COUNT(*) as count FROM call_scripts');
    $scriptsCount = $stmt->fetch()['count'];
    file_put_contents(__DIR__ . '/call_data_check.txt', "Call Scripts: $scriptsCount\n");
    
    // Check call_disposition_types
    try {
        $stmt = $pdo->query('SELECT COUNT(*) as count FROM call_disposition_types');
        $dispositionsCount = $stmt->fetch()['count'];
        file_put_contents(__DIR__ . '/call_data_check.txt', "Dispositions (call_disposition_types): $dispositionsCount\n", FILE_APPEND);
    } catch (Exception $e) {
        try {
            $stmt = $pdo->query('SELECT COUNT(*) as count FROM call_dispositions_types');
            $dispositionsCount = $stmt->fetch()['count'];
            file_put_contents(__DIR__ . '/call_data_check.txt', "Dispositions (call_dispositions_types): $dispositionsCount\n", FILE_APPEND);
        } catch (Exception $e2) {
            file_put_contents(__DIR__ . '/call_data_check.txt', "No disposition tables found\n", FILE_APPEND);
        }
    }
    
    echo "Results written to call_data_check.txt\n";
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
