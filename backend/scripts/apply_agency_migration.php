<?php
/**
 * Apply Agency Support Migration
 * This script applies the add_account_type_agency_support.sql migration
 */

require_once __DIR__ . '/src/Database.php';

try {
    echo "Connecting to database...\n";
    $pdo = Database::conn();
    
    echo "Reading migration file...\n";
    $migrationFile = __DIR__ . '/migrations/add_account_type_agency_support.sql';
    
    if (!file_exists($migrationFile)) {
        die("ERROR: Migration file not found: $migrationFile\n");
    }
    
    $sql = file_get_contents($migrationFile);
    
    echo "Applying migration...\n";
    
    // Split by semicolons and execute each statement
    $statements = array_filter(
        array_map('trim', explode(';', $sql)),
        function($stmt) {
            return !empty($stmt) && 
                   !preg_match('/^\s*--/', $stmt) && 
                   !preg_match('/^\s*$/', $stmt);
        }
    );
    
    $successCount = 0;
    $errorCount = 0;
    
    foreach ($statements as $statement) {
        try {
            $pdo->exec($statement);
            $successCount++;
            echo ".";
        } catch (PDOException $e) {
            // Ignore "Duplicate column" and "Duplicate key" errors (already applied)
            if (strpos($e->getMessage(), 'Duplicate column') !== false ||
                strpos($e->getMessage(), 'Duplicate key') !== false ||
                strpos($e->getMessage(), 'already exists') !== false) {
                echo "S"; // Skip
                continue;
            }
            echo "\nERROR executing statement: " . $e->getMessage() . "\n";
            echo "Statement: " . substr($statement, 0, 100) . "...\n";
            $errorCount++;
        }
    }
    
    echo "\n\nMigration complete!\n";
    echo "Successful statements: $successCount\n";
    echo "Errors: $errorCount\n";
    
    // Verify key columns exist
    echo "\nVerifying schema...\n";
    $result = $pdo->query("SHOW COLUMNS FROM companies LIKE 'is_client'");
    if ($result->fetch()) {
        echo "✓ companies.is_client column exists\n";
    } else {
        echo "✗ companies.is_client column NOT found\n";
    }
    
    $result = $pdo->query("SHOW COLUMNS FROM workspaces LIKE 'account_type'");
    if ($result->fetch()) {
        echo "✓ workspaces.account_type column exists\n";
    } else {
        echo "✗ workspaces.account_type column NOT found\n";
    }
    
    echo "\nDone! Please restart your backend server.\n";
    
} catch (Exception $e) {
    die("FATAL ERROR: " . $e->getMessage() . "\n");
}
