<?php
/**
 * Migration Runner: Add Settings Tables
 * Creates call_settings and form_settings tables
 */

require_once __DIR__ . '/src/Database.php';

try {
    echo "Starting settings tables migration...\n\n";
    
    $pdo = Database::conn();
    
    // Read and execute the migration SQL
    $sql = file_get_contents(__DIR__ . '/migrations/add_settings_tables.sql');
    
    // Split by semicolons and execute each statement
    $statements = array_filter(
        array_map('trim', explode(';', $sql)),
        fn($stmt) => !empty($stmt) && !preg_match('/^--/', $stmt)
    );
    
    foreach ($statements as $statement) {
        if (empty($statement)) continue;
        
        echo "Executing: " . substr($statement, 0, 100) . "...\n";
        $pdo->exec($statement);
        echo "✓ Success\n\n";
    }
    
    echo "✅ Migration completed successfully!\n\n";
    
    // Verify tables were created
    echo "Verifying tables...\n";
    $tables = ['call_settings', 'form_settings', 'sms_settings'];
    
    foreach ($tables as $table) {
        $stmt = $pdo->query("SHOW TABLES LIKE '$table'");
        if ($stmt->rowCount() > 0) {
            echo "✓ Table '$table' exists\n";
            
            // Show table structure
            $columns = $pdo->query("DESCRIBE $table")->fetchAll(PDO::FETCH_ASSOC);
            echo "  Columns: " . implode(', ', array_column($columns, 'Field')) . "\n";
        } else {
            echo "✗ Table '$table' NOT FOUND\n";
        }
    }
    
    echo "\n✅ All settings tables are ready!\n";
    
} catch (Exception $e) {
    echo "❌ Migration failed: " . $e->getMessage() . "\n";
    echo "Stack trace:\n" . $e->getTraceAsString() . "\n";
    exit(1);
}
