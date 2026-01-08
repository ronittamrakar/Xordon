<?php
require_once __DIR__ . '/../src/bootstrap.php';
require_once __DIR__ . '/../src/Database.php';

try {
    $db = \Xordon\Database::conn();
    $tables = [
        'employee_profiles', 
        'employee_hr_summary', 
        'employee_documents', 
        'leave_balances', 
        'leave_requests', 
        'payroll_records', 
        'pay_periods', 
        'shifts', 
        'time_entries',
        'employee_onboarding_status',
        'onboarding_checklists',
        'onboarding_tasks',
        'performance_reviews',
        'company_assets',
        'employee_compensation'
    ];
    
    foreach ($tables as $table) {
        $stmt = $db->query("SHOW TABLES LIKE '$table'");
        if ($stmt->fetch()) {
            echo "Table $table exists\n";
        } else {
            echo "Table $table MISSING\n";
        }
    }
} catch (Exception $e) {
    echo "ERROR: " . $e->getMessage();
}
