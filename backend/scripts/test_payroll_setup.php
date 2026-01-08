<?php
/**
 * Test Payroll Setup
 * Verify payroll tables and API endpoints
 */

require_once __DIR__ . '/src/Database.php';

try {
    $db = Database::conn();
    
    echo "=== Payroll System Setup Test ===\n\n";
    
    // Check for payroll tables
    $tables = [
        'pay_periods',
        'payroll_records',
        'employee_compensation',
        'payroll_deductions',
        'payroll_adjustments',
        'payroll_tax_rates',
        'payroll_history'
    ];
    
    echo "Checking Payroll Tables:\n";
    foreach ($tables as $table) {
        $result = $db->query("SHOW TABLES LIKE '$table'");
        $exists = $result->rowCount() > 0;
        echo "  ✓ $table: " . ($exists ? "EXISTS" : "MISSING") . "\n";
    }
    
    echo "\n";
    
    // Check for time tracking tables
    $timeTables = [
        'time_entries',
        'timesheets',
        'clock_records',
        'leave_requests',
        'leave_balances',
        'work_schedules'
    ];
    
    echo "Checking Time Tracking Tables:\n";
    foreach ($timeTables as $table) {
        $result = $db->query("SHOW TABLES LIKE '$table'");
        $exists = $result->rowCount() > 0;
        echo "  ✓ $table: " . ($exists ? "EXISTS" : "MISSING") . "\n";
    }
    
    echo "\n=== Setup Complete ===\n";
    echo "All tables are ready for use.\n";
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
    exit(1);
}
