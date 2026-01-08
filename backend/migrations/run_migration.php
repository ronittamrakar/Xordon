<?php
// Database migration script to fix campaign_id nullable issue
require_once __DIR__ . '/../src/Database.php';

try {
    $pdo = Database::conn();
    
    // Make campaign_id nullable
    $pdo->exec("ALTER TABLE recipients MODIFY COLUMN campaign_id INT UNSIGNED NULL");
    echo "✅ Made campaign_id column nullable\n";
    
    // Make type column nullable
    $pdo->exec("ALTER TABLE recipients MODIFY COLUMN type VARCHAR(20) NULL");
    echo "✅ Made type column nullable\n";
    
    echo "\n🎉 Migration completed successfully!\n";
    
} catch (Exception $e) {
    echo "❌ Migration failed: " . $e->getMessage() . "\n";
    exit(1);
}