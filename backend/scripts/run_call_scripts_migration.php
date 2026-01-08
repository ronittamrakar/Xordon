<?php
require_once __DIR__ . '/src/Database.php';

try {
    $pdo = Database::conn();
    
    echo "Running call_scripts table migration...\n";
    
    // Add tags column if it doesn't exist
    try {
        $pdo->exec("ALTER TABLE call_scripts ADD COLUMN tags TEXT");
        echo "✓ Added tags column\n";
    } catch (PDOException $e) {
        if (strpos($e->getMessage(), 'Duplicate column') !== false) {
            echo "✓ tags column already exists\n";
        } else {
            throw $e;
        }
    }
    
    // Check if we need to rename content to script
    $stmt = $pdo->query("SHOW COLUMNS FROM call_scripts LIKE 'content'");
    $hasContent = $stmt->fetch() !== false;
    
    $stmt = $pdo->query("SHOW COLUMNS FROM call_scripts LIKE 'script'");
    $hasScript = $stmt->fetch() !== false;
    
    if ($hasContent && !$hasScript) {
        $pdo->exec("ALTER TABLE call_scripts CHANGE COLUMN content script TEXT NOT NULL");
        echo "✓ Renamed content column to script\n";
    } elseif ($hasScript) {
        echo "✓ script column already exists\n";
    } else {
        echo "! Warning: Neither content nor script column found\n";
    }
    
    echo "\nMigration completed successfully!\n";
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
    exit(1);
}
