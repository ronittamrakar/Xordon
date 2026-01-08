<?php
// Run CRM migration
error_reporting(E_ALL);
ini_set('display_errors', 1);

require_once __DIR__ . '/../src/Config.php';
require_once __DIR__ . '/../src/Database.php';

try {
    $pdo = Database::conn();
    echo "Database connection: SUCCESS\n";
    
    // Read and execute the migration
    $migrationFile = __DIR__ . '/../migrations/add_companies_segments_lists.sql';
    if (!file_exists($migrationFile)) {
        throw new Exception("Migration file not found: $migrationFile");
    }
    
    $sql = file_get_contents($migrationFile);
    
    // Split into individual statements
    $statements = array_filter(array_map('trim', explode(';', $sql)));
    
    foreach ($statements as $statement) {
        if (empty($statement)) continue;
        
        echo "Executing: " . substr($statement, 0, 50) . "...\n";
        try {
            $pdo->exec($statement);
            echo "SUCCESS\n";
        } catch (Exception $e) {
            echo "ERROR: " . $e->getMessage() . "\n";
            // Continue with other statements
        }
    }
    
    echo "\nMigration completed!\n";
    
    // Verify tables
    echo "\nVerifying tables:\n";
    $stmt = $pdo->query("SHOW TABLES LIKE 'companies'");
    echo "Companies table: " . ($stmt->fetch() ? "EXISTS" : "MISSING") . "\n";
    
    $stmt = $pdo->query("SHOW COLUMNS FROM recipients LIKE 'company_id'");
    echo "recipients.company_id: " . ($stmt->fetch() ? "EXISTS" : "MISSING") . "\n";
    
} catch (Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
    echo "Trace: " . $e->getTraceAsString() . "\n";
}
?>
