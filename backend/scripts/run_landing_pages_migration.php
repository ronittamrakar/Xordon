<?php
require_once 'src/Database.php';

try {
    $db = Database::conn();
    
    // Read and execute the migration
    $migrationSQL = file_get_contents('migrations/create_landing_pages_tables.sql');
    
    // Split into individual statements
    $statements = array_filter(array_map('trim', explode(';', $migrationSQL)));
    
    foreach ($statements as $statement) {
        if (!empty($statement) && !preg_match('/^--/', $statement)) {
            try {
                $db->exec($statement);
                echo "Executed: " . substr($statement, 0, 50) . "...\n";
            } catch (PDOException $e) {
                echo "Error: " . $e->getMessage() . "\n";
                echo "Statement: " . substr($statement, 0, 100) . "...\n";
            }
        }
    }
    
    echo "Landing pages migration completed successfully!\n";
    
} catch (Exception $e) {
    echo "Migration failed: " . $e->getMessage() . "\n";
}
?>
