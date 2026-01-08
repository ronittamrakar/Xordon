<?php
/**
 * Run P0 Schema Alignment Migration
 */

require_once __DIR__ . '/src/bootstrap.php';
require_once __DIR__ . '/src/Database.php';

echo "=== P0 Schema Alignment Migration ===\n\n";

try {
    $db = Database::conn();
    echo "Database connected.\n\n";
    
    $sql = file_get_contents(__DIR__ . '/migrations/p0_schema_alignment.sql');
    
    // Split by semicolons but be careful with comments
    $lines = explode("\n", $sql);
    $statements = [];
    $currentStmt = '';
    
    foreach ($lines as $line) {
        $trimmed = trim($line);
        
        // Skip pure comment lines
        if (strpos($trimmed, '--') === 0) {
            continue;
        }
        
        $currentStmt .= $line . "\n";
        
        // Check if line ends with semicolon (end of statement)
        if (substr($trimmed, -1) === ';') {
            $stmt = trim($currentStmt);
            if (!empty($stmt) && $stmt !== ';') {
                $statements[] = $stmt;
            }
            $currentStmt = '';
        }
    }
    
    // Add any remaining statement
    if (trim($currentStmt)) {
        $statements[] = trim($currentStmt);
    }
    
    $success = 0;
    $skipped = 0;
    $failed = 0;
    
    foreach ($statements as $stmt) {
        // Skip empty or comment-only statements
        $cleanStmt = trim(preg_replace('/--.*$/m', '', $stmt));
        if (empty($cleanStmt) || $cleanStmt === ';') {
            continue;
        }
        
        try {
            $db->exec($stmt);
            $success++;
            
            // Show what we did
            if (preg_match('/CREATE TABLE.*?(\w+)/is', $stmt, $m)) {
                echo "✓ Created table: {$m[1]}\n";
            } elseif (preg_match('/ALTER TABLE\s+(\w+)/i', $stmt, $m)) {
                echo "✓ Altered table: {$m[1]}\n";
            } elseif (preg_match('/CREATE INDEX.*?ON\s+(\w+)/i', $stmt, $m)) {
                echo "✓ Created index on: {$m[1]}\n";
            }
        } catch (PDOException $e) {
            $msg = $e->getMessage();
            
            // These are expected and OK to skip
            if (strpos($msg, 'Duplicate column') !== false ||
                strpos($msg, 'already exists') !== false ||
                strpos($msg, 'Duplicate key') !== false ||
                strpos($msg, 'SQLSTATE[42S01]') !== false) {
                $skipped++;
            } else {
                $failed++;
                echo "✗ Error: " . substr($msg, 0, 120) . "\n";
            }
        }
    }
    
    echo "\n=== Migration Complete ===\n";
    echo "Success: $success\n";
    echo "Skipped (already exists): $skipped\n";
    echo "Failed: $failed\n";
    
} catch (Exception $e) {
    echo "Fatal error: " . $e->getMessage() . "\n";
    exit(1);
}
