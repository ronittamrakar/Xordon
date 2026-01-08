<?php
require_once __DIR__ . '/src/Database.php';

try {
    $pdo = Database::conn();
    
    echo "Running projects table fix migration...\n";
    echo str_repeat("=", 80) . "\n";
    
    $sql = file_get_contents(__DIR__ . '/migrations/fix_projects_progress_column.sql');
    $pdo->exec($sql);
    
    echo "✅ Migration completed successfully\n\n";
    
    // Verify the column exists
    $stmt = $pdo->query("SHOW COLUMNS FROM projects LIKE 'progress_percentage'");
    $result = $stmt->fetch();
    
    if ($result) {
        echo "✅ progress_percentage column verified:\n";
        print_r($result);
    } else {
        echo "❌ progress_percentage column still missing!\n";
    }
    
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
}
