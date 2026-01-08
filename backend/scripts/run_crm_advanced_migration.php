<?php
require_once __DIR__ . '/../src/Database.php';

use Xordon\Database;

try {
    echo "Running CRM Advanced Features Migration...\n\n";
    
    $db = Database::conn();
    
    // Read the migration file
    $migrationFile = __DIR__ . '/../migrations/create_crm_advanced_features.sql';
    
    if (!file_exists($migrationFile)) {
        throw new Exception("Migration file not found: $migrationFile");
    }
    
    $sql = file_get_contents($migrationFile);
    
    if ($sql === false) {
        throw new Exception("Failed to read migration file");
    }
    
    // Split by semicolons and execute each statement
    $statements = array_filter(
        array_map('trim', explode(';', $sql)),
        function($stmt) {
            // Filter out empty statements and comments
            return !empty($stmt) && !preg_match('/^--/', $stmt);
        }
    );
    
    $successCount = 0;
    $errorCount = 0;
    
    foreach ($statements as $statement) {
        try {
            $db->exec($statement);
            $successCount++;
            
            // Extract table name for logging
            if (preg_match('/CREATE TABLE.*?`?(\w+)`?/i', $statement, $matches)) {
                echo "✓ Created table: {$matches[1]}\n";
            } elseif (preg_match('/INSERT INTO.*?`?(\w+)`?/i', $statement, $matches)) {
                echo "✓ Inserted data into: {$matches[1]}\n";
            }
        } catch (PDOException $e) {
            $errorCount++;
            // Only show error if it's not a "table already exists" error
            if (strpos($e->getMessage(), 'already exists') === false) {
                echo "✗ Error: " . $e->getMessage() . "\n";
            }
        }
    }
    
    echo "\n";
    echo "========================================\n";
    echo "Migration completed!\n";
    echo "Successful statements: $successCount\n";
    echo "Errors: $errorCount\n";
    echo "========================================\n";
    echo "\n";
    
    // Verify tables were created
    echo "Verifying tables...\n";
    $tables = [
        'crm_goals',
        'crm_goal_history',
        'crm_forecasts',
        'crm_forecast_snapshots',
        'crm_playbooks',
        'crm_playbook_usage',
        'crm_settings',
        'crm_products',
        'crm_deal_products',
        'crm_territories',
        'crm_scoring_rules',
        'crm_sequences',
        'crm_sequence_enrollments'
    ];
    
    foreach ($tables as $table) {
        $stmt = $db->query("SHOW TABLES LIKE '$table'");
        if ($stmt->rowCount() > 0) {
            echo "✓ Table exists: $table\n";
        } else {
            echo "✗ Table missing: $table\n";
        }
    }
    
    echo "\nCRM Advanced Features Migration completed successfully!\n";
    
} catch (Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
    exit(1);
}
