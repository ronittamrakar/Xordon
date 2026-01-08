<?php
/**
 * Migration Runner for Intelligent Follow-up Automations
 * Creates sentiment analysis, intent detection, and configuration tables
 */

require_once __DIR__ . '/src/Database.php';

echo "=== Intelligent Follow-up Automations Migration ===\n\n";

try {
    $pdo = Database::conn();
    echo "✓ Database connection established\n\n";
    
    // Read and execute the migration SQL
    $migrationFile = __DIR__ . '/migrations/create_sentiment_analysis.sql';
    
    if (!file_exists($migrationFile)) {
        throw new Exception("Migration file not found: $migrationFile");
    }
    
    $sql = file_get_contents($migrationFile);
    
    // Remove comments and split by semicolon
    $lines = explode("\n", $sql);
    $cleanedLines = [];
    foreach ($lines as $line) {
        $trimmed = trim($line);
        // Skip comment-only lines
        if (empty($trimmed) || strpos($trimmed, '--') === 0) {
            continue;
        }
        // Remove inline comments
        if (($pos = strpos($trimmed, '--')) !== false) {
            $trimmed = trim(substr($trimmed, 0, $pos));
        }
        if (!empty($trimmed)) {
            $cleanedLines[] = $trimmed;
        }
    }
    
    $cleanedSql = implode(' ', $cleanedLines);
    $statements = array_filter(
        array_map('trim', explode(';', $cleanedSql)),
        function($stmt) {
            return !empty(trim($stmt));
        }
    );
    
    $successCount = 0;
    $errorCount = 0;
    
    foreach ($statements as $statement) {
        if (empty(trim($statement))) continue;
        
        try {
            // Extract table/operation name for logging
            $operation = 'Unknown operation';
            if (preg_match('/CREATE TABLE.*?(\w+)/i', $statement, $matches)) {
                $operation = "Creating table: {$matches[1]}";
            } elseif (preg_match('/ALTER TABLE\s+(\w+)/i', $statement, $matches)) {
                $operation = "Altering table: {$matches[1]}";
            } elseif (preg_match('/INSERT INTO\s+(\w+)/i', $statement, $matches)) {
                $operation = "Inserting into: {$matches[1]}";
            }
            
            echo "  → $operation... ";
            $pdo->exec($statement);
            echo "✓\n";
            $successCount++;
        } catch (PDOException $e) {
            // Check if it's a "column already exists" or "table already exists" error
            $errorMsg = $e->getMessage();
            if (strpos($errorMsg, 'Duplicate column') !== false || 
                strpos($errorMsg, 'already exists') !== false ||
                strpos($errorMsg, 'Duplicate key') !== false) {
                echo "⚠ (already exists, skipping)\n";
            } else {
                echo "✗ Error: $errorMsg\n";
                $errorCount++;
            }
        }
    }
    
    echo "\n=== Migration Summary ===\n";
    echo "Successful operations: $successCount\n";
    echo "Errors: $errorCount\n";
    
    // Verify tables were created
    echo "\n=== Verifying Tables ===\n";
    
    $tables = [
        'sentiment_analysis',
        'intent_analysis', 
        'sentiment_config',
        'contact_sentiment_tracking'
    ];
    
    foreach ($tables as $table) {
        $stmt = $pdo->query("SHOW TABLES LIKE '$table'");
        if ($stmt->rowCount() > 0) {
            echo "  ✓ Table '$table' exists\n";
        } else {
            echo "  ✗ Table '$table' NOT found\n";
        }
    }
    
    // Verify columns were added to existing tables
    echo "\n=== Verifying Column Additions ===\n";
    
    $columnChecks = [
        'contact_outcomes' => ['sentiment_score', 'sentiment_confidence', 'detected_intent', 'intent_confidence'],
        'automation_executions' => ['trigger_reason', 'skip_reason', 'matched_confidence'],
        'call_dispositions_types' => ['semantic_category', 'semantic_confidence']
    ];
    
    foreach ($columnChecks as $table => $columns) {
        echo "  Checking $table:\n";
        foreach ($columns as $column) {
            $stmt = $pdo->query("SHOW COLUMNS FROM $table LIKE '$column'");
            if ($stmt->rowCount() > 0) {
                echo "    ✓ Column '$column' exists\n";
            } else {
                echo "    ⚠ Column '$column' not found (may need manual addition)\n";
            }
        }
    }
    
    echo "\n=== Migration Complete ===\n";
    
} catch (Exception $e) {
    echo "✗ Migration failed: " . $e->getMessage() . "\n";
    exit(1);
}
