<?php
/**
 * Migration: Add user_id column to recipients table
 */

require_once __DIR__ . '/../src/Database.php';

echo "=== ADDING user_id COLUMN TO recipients TABLE ===\n\n";

try {
    $pdo = Database::conn();
    echo "✅ Database connected\n\n";
    
    // Check if column already exists
    $stmt = $pdo->query("SHOW COLUMNS FROM recipients LIKE 'user_id'");
    $exists = $stmt->fetch();
    
    if ($exists) {
        echo "✅ user_id column already exists\n";
    } else {
        echo "Adding user_id column...\n";
        
        // Add user_id column
        $pdo->exec("ALTER TABLE recipients ADD COLUMN user_id INT NOT NULL DEFAULT 1");
        echo "✅ user_id column added\n";
        
        // Add index
        $pdo->exec("ALTER TABLE recipients ADD INDEX idx_user_id (user_id)");
        echo "✅ Index added on user_id\n";
    }
    
    echo "\n=== MIGRATION COMPLETE ===\n";
    echo "✅ recipients table now has user_id column\n";
    
} catch (Exception $e) {
    echo "❌ Migration failed: " . $e->getMessage() . "\n";
    exit(1);
}
