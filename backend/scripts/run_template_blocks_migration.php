<?php
/**
 * Migration script to add blocks and global_styles columns to templates table
 */

require_once __DIR__ . '/src/Database.php';

try {
    $pdo = Database::conn();
    
    echo "Running template blocks migration...\n";
    
    // Check if columns already exist
    $stmt = $pdo->query("SHOW COLUMNS FROM templates LIKE 'blocks'");
    $blocksExists = $stmt->fetch();
    
    $stmt = $pdo->query("SHOW COLUMNS FROM templates LIKE 'global_styles'");
    $stylesExists = $stmt->fetch();
    
    if (!$blocksExists) {
        echo "Adding 'blocks' column...\n";
        $pdo->exec("ALTER TABLE templates ADD COLUMN blocks TEXT DEFAULT NULL");
        echo "✓ 'blocks' column added\n";
    } else {
        echo "✓ 'blocks' column already exists\n";
    }
    
    if (!$stylesExists) {
        echo "Adding 'global_styles' column...\n";
        $pdo->exec("ALTER TABLE templates ADD COLUMN global_styles TEXT DEFAULT NULL");
        echo "✓ 'global_styles' column added\n";
    } else {
        echo "✓ 'global_styles' column already exists\n";
    }
    
    echo "\n✅ Migration completed successfully!\n";
    
} catch (Exception $e) {
    echo "❌ Migration failed: " . $e->getMessage() . "\n";
    exit(1);
}
