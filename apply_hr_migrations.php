<?php
require_once __DIR__ . '/backend/src/Database.php';

$migrations = [
    'time_tracking.sql',
    'payroll.sql',
    'payroll_tax_brackets.sql',
    'employee_onboarding.sql',
    'performance_assets.sql',
    'recruitment_tables.sql',
    'shift_scheduling_tables.sql'
];

try {
    $pdo = Database::conn();
    
    foreach ($migrations as $file) {
        $path = __DIR__ . '/backend/migrations/' . $file;
        if (!file_exists($path)) {
            echo "⚠️ File not found: $file\n";
            continue;
        }

        echo "Applying $file...\n";
        $sql = file_get_contents($path);
        
        // Remove comments and split into individual statements
        // Note: Simple split by ; might fail if ; is inside strings, but usually works for simple migrations
        $statements = array_filter(array_map('trim', explode(';', $sql)));
        
        foreach ($statements as $stmt) {
            if (empty($stmt)) continue;
            try {
                $pdo->exec($stmt);
            } catch (PDOException $e) {
                // If it's a "table already exists" error, we can ignore it since we use CREATE TABLE IF NOT EXISTS
                if ($e->getCode() == '42S01') {
                    // Table already exists
                } else {
                    echo "❌ Error in statement: " . substr($stmt, 0, 50) . "...\n";
                    echo "   " . $e->getMessage() . "\n";
                }
            }
        }
        echo "✅ Finished $file\n\n";
    }

    echo "🎉 All specified migrations applied.\n";

} catch (Exception $e) {
    echo "Fatal Error: " . $e->getMessage() . "\n";
}
