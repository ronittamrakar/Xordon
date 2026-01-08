<?php
/**
 * Apply HR Migrations
 * Runs time tracking and payroll migrations
 */

require_once __DIR__ . '/src/Database.php';

try {
    $db = Database::conn();
    
    echo "=== Applying HR Migrations ===\n\n";
    
    // Apply time tracking migration
    echo "Applying time_tracking.sql...\n";
    $timeTrackingSql = file_get_contents(__DIR__ . '/migrations/time_tracking.sql');
    $db->exec($timeTrackingSql);
    echo "  ✓ Time tracking tables created\n\n";
    
    // Apply payroll migration
    echo "Applying payroll.sql...\n";
    $payrollSql = file_get_contents(__DIR__ . '/migrations/payroll.sql');
    $db->exec($payrollSql);
    echo "  ✓ Payroll tables created\n\n";
    
    echo "=== Migrations Complete ===\n";
    echo "All HR tables have been created successfully.\n";
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
    exit(1);
}
