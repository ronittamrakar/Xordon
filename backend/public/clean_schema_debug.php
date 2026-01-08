<?php
require_once __DIR__ . '/../src/bootstrap.php';
require_once __DIR__ . '/../src/Database.php';

function debugTable($db, $table) {
    echo "--- Table: $table ---\n";
    try {
        $stmt = $db->query("DESCRIBE `$table`");
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
        foreach ($rows as $row) {
            printf("%-30s | %-20s | %-5s | %-5s | %-10s | %s\n", 
                $row['Field'], $row['Type'], $row['Null'], $row['Key'], $row['Default'], $row['Extra']);
        }
    } catch (Exception $e) {
        echo "Error describing $table: " . $e->getMessage() . "\n";
    }
}

try {
    $db = \Xordon\Database::conn();
    debugTable($db, 'employee_hr_summary');
    debugTable($db, 'employee_compensation');
    debugTable($db, 'leave_balances');
    debugTable($db, 'payroll_records');
} catch (Exception $e) {
    echo "ERROR: " . $e->getMessage();
}
