<?php
/**
 * Run user preferences migration
 */

require_once __DIR__ . '/src/Database.php';

echo "Running user preferences migration...\n";
echo str_repeat('=', 60) . "\n\n";

try {
    $pdo = Database::conn();
    
    // Read and execute migration
    $sql = file_get_contents(__DIR__ . '/migrations/create_user_preferences_table.sql');
    
    // Split by semicolon and execute each statement
    $statements = array_filter(array_map('trim', explode(';', $sql)));
    
    foreach ($statements as $statement) {
        if (empty($statement)) continue;
        
        echo "Executing: " . substr($statement, 0, 50) . "...\n";
        $pdo->exec($statement);
        echo "✓ Success\n\n";
    }
    
    echo str_repeat('=', 60) . "\n";
    echo "✅ Migration completed successfully!\n";
    echo str_repeat('=', 60) . "\n\n";
    
    // Verify table was created
    $stmt = $pdo->query("SHOW TABLES LIKE 'user_preferences'");
    if ($stmt->rowCount() > 0) {
        echo "✓ Table 'user_preferences' exists\n";
        
        // Show table structure
        $stmt = $pdo->query("DESCRIBE user_preferences");
        echo "\nTable structure:\n";
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            echo "  - {$row['Field']} ({$row['Type']})\n";
        }
    } else {
        echo "✗ Table 'user_preferences' was not created\n";
    }
    
} catch (Exception $e) {
    echo "\n❌ Migration failed: " . $e->getMessage() . "\n";
    echo "Stack trace:\n" . $e->getTraceAsString() . "\n";
    exit(1);
}
