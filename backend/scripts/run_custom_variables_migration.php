<?php
require_once 'src/Database.php';

echo "Running custom variables migration...\n";

try {
    $pdo = Database::conn();
    $sql = file_get_contents('migrations/add_custom_variables.sql');
    
    if ($sql === false) {
        throw new Exception("Could not read migration file");
    }
    
    // Execute the SQL statements
    foreach (array_filter(array_map('trim', explode(';', $sql))) as $chunk) {
        if ($chunk !== '') {
            $pdo->exec($chunk);
            echo 'Executed: ' . substr($chunk, 0, 50) . "...\n";
        }
    }
    
    echo "✓ Migration completed successfully!\n";
    
    // Verify the table was created
    $stmt = $pdo->query("SHOW TABLES LIKE 'custom_variables'");
    $table = $stmt->fetch();
    
    if ($table) {
        echo "✓ custom_variables table created successfully!\n";
        
        // Show table structure
        $stmt = $pdo->query("DESCRIBE custom_variables");
        $columns = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo "\nTable structure:\n";
        foreach ($columns as $column) {
            echo "- {$column['Field']}: {$column['Type']}\n";
        }
    } else {
        echo "✗ custom_variables table not found!\n";
    }
    
} catch (Exception $e) {
    echo "✗ Migration failed: " . $e->getMessage() . "\n";
    exit(1);
}
?>