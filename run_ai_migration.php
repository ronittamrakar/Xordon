<?php

/**
 * Run AI Knowledge Tables Migration
 * Creates tables for AI knowledge bases, sources, and agent templates
 */

require_once __DIR__ . '/backend/src/Database.php';

echo "Running AI Knowledge Tables Migration...\n\n";

try {
    $pdo = Database::conn();
    
    // Read and execute migration
    $sql = file_get_contents(__DIR__ . '/backend/migrations/add_ai_knowledge_tables.sql');
    
    // Split by semicolons to execute each statement
    $statements = array_filter(array_map('trim', explode(';', $sql)));
    
    foreach ($statements as $statement) {
        if (empty($statement) || strpos(trim($statement), '--') === 0) {
            continue;
        }
        
        try {
            $pdo->exec($statement);
            // Get the first meaningful line for logging
            $firstLine = strtok($statement, "\n");
            if (stripos($firstLine, 'CREATE TABLE') !== false) {
                preg_match('/CREATE TABLE.*?`(\w+)`/i', $statement, $matches);
                $tableName = $matches[1] ?? 'unknown';
                echo "✓ Created table: $tableName\n";
            } elseif (stripos($firstLine, 'INSERT') !== false) {
                echo "✓ Inserted default data\n";
            }
        } catch (PDOException $e) {
            // Ignore duplicate table errors
            if (strpos($e->getMessage(), 'already exists') !== false || 
                strpos($e->getMessage(), 'Duplicate entry') !== false) {
                echo "• Table/data already exists, skipping...\n";
            } else {
                echo "✗ Error: " . $e->getMessage() . "\n";
            }
        }
    }
    
    echo "\n✅ Migration completed successfully!\n";
    
} catch (Exception $e) {
    echo "❌ Migration failed: " . $e->getMessage() . "\n";
    exit(1);
}
