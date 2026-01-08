<?php
/**
 * Run All Missing Tables Migration
 * Executes the comprehensive migration to add all missing tables
 */

require_once __DIR__ . '/backend/vendor/autoload.php';

try {
    $pdo = new PDO('mysql:host=127.0.0.1;dbname=xordon', 'root', '');
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    echo "=== Running Missing Tables Migration ===\n\n";

    // Get table count before
    $tablesBefore = count($pdo->query('SHOW TABLES')->fetchAll(PDO::FETCH_COLUMN));
    echo "Tables before migration: $tablesBefore\n\n";

    // Read the migration file
    $migrationFile = __DIR__ . '/backend/migrations/add_all_missing_tables.sql';
    if (!file_exists($migrationFile)) {
        throw new Exception("Migration file not found: $migrationFile");
    }

    $sql = file_get_contents($migrationFile);
    
    // Split by statement (handling comments and multi-line statements properly)
    $statements = [];
    $currentStatement = '';
    $inComment = false;
    
    foreach (explode("\n", $sql) as $line) {
        $trimmedLine = trim($line);
        
        // Skip empty lines and comments
        if (empty($trimmedLine) || strpos($trimmedLine, '--') === 0) {
            continue;
        }
        
        $currentStatement .= $line . "\n";
        
        // Check if statement ends with semicolon
        if (preg_match('/;\s*$/', $trimmedLine)) {
            $statements[] = trim($currentStatement);
            $currentStatement = '';
        }
    }

    // Add any remaining statement
    if (trim($currentStatement)) {
        $statements[] = trim($currentStatement);
    }

    echo "Found " . count($statements) . " SQL statements to execute\n\n";

    $successCount = 0;
    $errorCount = 0;
    $errors = [];

    foreach ($statements as $i => $statement) {
        // Skip empty statements
        if (empty(trim($statement))) {
            continue;
        }
        
        // Extract table name for logging
        $tableName = '';
        if (preg_match('/CREATE TABLE IF NOT EXISTS\s+(\w+)/i', $statement, $matches)) {
            $tableName = $matches[1];
            echo "Creating table: $tableName... ";
        } elseif (preg_match('/INSERT INTO\s+(\w+)/i', $statement, $matches)) {
            $tableName = $matches[1];
            echo "Seeding table: $tableName... ";
        } elseif (preg_match('/ALTER TABLE\s+(\w+)/i', $statement, $matches)) {
            $tableName = $matches[1];
            echo "Altering table: $tableName... ";
        } else {
            echo "Executing statement " . ($i + 1) . "... ";
        }
        
        try {
            $pdo->exec($statement);
            echo "✓\n";
            $successCount++;
        } catch (PDOException $e) {
            $errorMessage = $e->getMessage();
            
            // Check if it's a "duplicate key" or "already exists" error (which we can ignore)
            if (strpos($errorMessage, 'Duplicate') !== false || 
                strpos($errorMessage, 'already exists') !== false) {
                echo "⚠ (already exists)\n";
                $successCount++;
            } else {
                echo "✗\n";
                $errors[] = [
                    'table' => $tableName ?: 'unknown',
                    'error' => $errorMessage,
                    'statement' => substr($statement, 0, 100) . '...'
                ];
                $errorCount++;
            }
        }
    }

    // Get table count after
    $tablesAfter = count($pdo->query('SHOW TABLES')->fetchAll(PDO::FETCH_COLUMN));
    $newTables = $tablesAfter - $tablesBefore;

    echo "\n=== Migration Complete ===\n";
    echo "Statements executed: $successCount\n";
    echo "Errors: $errorCount\n";
    echo "Tables before: $tablesBefore\n";
    echo "Tables after: $tablesAfter\n";
    echo "New tables created: $newTables\n";

    if (!empty($errors)) {
        echo "\n=== Errors ===\n";
        foreach ($errors as $error) {
            echo "Table: {$error['table']}\n";
            echo "Error: {$error['error']}\n";
            echo "Statement: {$error['statement']}\n\n";
        }
    }

} catch (Exception $e) {
    echo "FATAL ERROR: " . $e->getMessage() . "\n";
    exit(1);
}
