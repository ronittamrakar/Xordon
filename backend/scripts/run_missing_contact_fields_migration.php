<?php
/**
 * Migration to add missing contact fields to recipients table
 */

require_once __DIR__ . '/src/Database.php';

try {
    echo "Running missing contact fields migration...\n";
    
    $pdo = Database::conn();
    $driver = $pdo->getAttribute(PDO::ATTR_DRIVER_NAME);
    echo "Database driver: $driver\n";
    
    // Define columns to add
    $columns = [
        'additional_details' => 'TEXT NULL',
        'company_size_selection' => 'VARCHAR(50) NULL',
        'address' => 'VARCHAR(255) NULL',
        'city' => 'VARCHAR(100) NULL',
        'state' => 'VARCHAR(100) NULL',
        'country' => 'VARCHAR(100) NULL',
        'postal_code' => 'VARCHAR(20) NULL',
        'website' => 'VARCHAR(255) NULL',
        'linkedin' => 'VARCHAR(255) NULL',
        'twitter' => 'VARCHAR(255) NULL',
        'industry' => 'VARCHAR(100) NULL',
        'company_size' => 'VARCHAR(50) NULL',
        'annual_revenue' => 'VARCHAR(50) NULL',
        'technology' => 'VARCHAR(255) NULL',
        'notes' => 'TEXT NULL',
        'birthday' => 'DATE NULL',
        'lead_source' => 'VARCHAR(100) NULL',
        'user_id' => 'INT NULL',
        'unsubscribed_at' => 'DATETIME NULL',
    ];
    
    // Get existing columns
    if ($driver === 'mysql') {
        $stmt = $pdo->query("DESCRIBE recipients");
        $existingColumns = array_column($stmt->fetchAll(PDO::FETCH_ASSOC), 'Field');
    } else {
        $stmt = $pdo->query("PRAGMA table_info(recipients)");
        $existingColumns = array_column($stmt->fetchAll(PDO::FETCH_ASSOC), 'name');
    }
    
    echo "Existing columns: " . implode(', ', $existingColumns) . "\n\n";
    
    foreach ($columns as $column => $definition) {
        if (in_array($column, $existingColumns)) {
            echo "✓ Column '$column' already exists\n";
            continue;
        }
        
        try {
            $sql = "ALTER TABLE recipients ADD COLUMN $column $definition";
            $pdo->exec($sql);
            echo "✅ Added column '$column'\n";
        } catch (PDOException $e) {
            if (strpos($e->getMessage(), 'Duplicate column') !== false || 
                strpos($e->getMessage(), 'already exists') !== false) {
                echo "✓ Column '$column' already exists\n";
            } else {
                echo "❌ Failed to add column '$column': " . $e->getMessage() . "\n";
            }
        }
    }
    
    // Set default user_id for existing records without one
    try {
        $pdo->exec("UPDATE recipients SET user_id = 1 WHERE user_id IS NULL");
        echo "\n✅ Updated NULL user_id values to 1\n";
    } catch (PDOException $e) {
        echo "Note: Could not update user_id: " . $e->getMessage() . "\n";
    }
    
    echo "\n✅ Migration completed successfully!\n";
    
} catch (Exception $e) {
    echo "❌ Migration failed: " . $e->getMessage() . "\n";
    exit(1);
}
