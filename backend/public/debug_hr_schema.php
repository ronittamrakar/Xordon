<?php
require_once __DIR__ . '/../src/bootstrap.php';
require_once __DIR__ . '/../src/Database.php';

try {
    $db = \Xordon\Database::conn();
    $tables = ['users', 'employee_hr_summary', 'leave_balances', 'leave_requests', 'employee_compensation', 'payroll_records', 'shifts', 'time_entries'];
    
    foreach ($tables as $table) {
        echo "Table: $table\n";
        $stmt = $db->query("DESCRIBE $table");
        print_r($stmt->fetchAll(PDO::FETCH_ASSOC));
        echo "\n";
    }
} catch (Exception $e) {
    echo "ERROR: " . $e->getMessage();
}
