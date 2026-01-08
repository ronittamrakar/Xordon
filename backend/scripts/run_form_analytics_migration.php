<?php
// Run the form analytics migration
require_once __DIR__ . '/src/Database.php';

try {
    $db = Database::conn();
    $driver = $db->getAttribute(PDO::ATTR_DRIVER_NAME);
    if ($driver !== 'mysql') {
        throw new Exception("Unsupported database driver '$driver'. This project is configured for MySQL only.");
    }
    
    // Read the migration file
    $migrationSQL = file_get_contents(__DIR__ . '/migrations/add_form_analytics.sql');
    
    if (!$migrationSQL) {
        throw new Exception("Could not read migration file");
    }
    
    // Execute the migration
    $db->exec($migrationSQL);
    
    echo "Form analytics migration completed successfully!\n";
    
    // Verify the table was created
    $result = $db->query("SHOW TABLES LIKE 'form_analytics'");
    if ($result && $result->rowCount() > 0) {
        echo "✓ form_analytics table created successfully\n";
    } else {
        echo "✗ form_analytics table was not created\n";
    }
    
} catch (Exception $e) {
    echo "Migration failed: " . $e->getMessage() . "\n";
}