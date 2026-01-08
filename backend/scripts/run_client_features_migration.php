<?php
/**
 * Migration Runner: Client Properties and Features
 * 
 * This script runs the client properties, requests, quotes, and related features migration.
 * Run this script from the backend directory:
 * php run_client_features_migration.php
 */

require_once __DIR__ . '/src/Database.php';

echo "===========================================\n";
echo "Client Features Migration Runner\n";
echo "===========================================\n\n";

try {
    $pdo = Database::conn();
    
    // Read and execute the migration
    $migrationFile = __DIR__ . '/migrations/create_client_properties_requests.sql';
    
    if (!file_exists($migrationFile)) {
        throw new Exception("Migration file not found: $migrationFile");
    }
    
    echo "Reading migration file...\n";
    $sql = file_get_contents($migrationFile);
    
    if ($sql === false) {
        throw new Exception("Failed to read migration file");
    }
    
    echo "Executing migration...\n\n";
    
    // Split by semicolon and execute each statement
    $statements = array_filter(
        array_map('trim', explode(';', $sql)),
        function($stmt) {
            return !empty($stmt) && 
                   !preg_match('/^--/', $stmt) && 
                   $stmt !== '';
        }
    );
    
    $successCount = 0;
    $errorCount = 0;
    
    foreach ($statements as $statement) {
        try {
            $pdo->exec($statement);
            $successCount++;
            
            // Extract table name for better logging
            if (preg_match('/CREATE TABLE.*?`?(\w+)`?/i', $statement, $matches)) {
                echo "✓ Created table: {$matches[1]}\n";
            } elseif (preg_match('/ALTER TABLE.*?`?(\w+)`?/i', $statement, $matches)) {
                echo "✓ Altered table: {$matches[1]}\n";
            } elseif (preg_match('/CREATE INDEX.*?ON `?(\w+)`?/i', $statement, $matches)) {
                echo "✓ Created index on: {$matches[1]}\n";
            } else {
                echo "✓ Executed statement\n";
            }
        } catch (PDOException $e) {
            // Ignore "already exists" errors
            if (strpos($e->getMessage(), 'already exists') !== false || 
                strpos($e->getMessage(), 'Duplicate') !== false) {
                echo "⊙ Skipped (already exists)\n";
            } else {
                $errorCount++;
                echo "✗ Error: " . $e->getMessage() . "\n";
            }
        }
    }
    
    echo "\n===========================================\n";
    echo "Migration Summary\n";
    echo "===========================================\n";
    echo "Successful: $successCount\n";
    echo "Errors: $errorCount\n";
    echo "\n";
    
    if ($errorCount === 0) {
        echo "✓ Migration completed successfully!\n\n";
        
        echo "Tables created:\n";
        echo "  - client_properties\n";
        echo "  - property_contacts\n";
        echo "  - work_requests\n";
        echo "  - quotes\n";
        echo "  - quote_items\n";
        echo "  - jobs\n";
        echo "  - job_tasks\n";
        echo "  - client_files\n";
        echo "  - client_communications\n";
        echo "  - client_portal_sessions\n\n";
        
        echo "Columns added to companies table:\n";
        echo "  - lead_source\n";
        echo "  - is_client\n";
        echo "  - client_since\n";
        echo "  - monthly_retainer\n";
        echo "  - billing_email\n";
        echo "  - notes\n";
        echo "  - archived_at\n\n";
        
        echo "You can now use the client detail page at:\n";
        echo "  http://localhost:5173/clients/:id\n\n";
    } else {
        echo "⚠ Migration completed with errors. Please review the errors above.\n\n";
    }
    
} catch (Exception $e) {
    echo "\n✗ Migration failed: " . $e->getMessage() . "\n\n";
    exit(1);
}
