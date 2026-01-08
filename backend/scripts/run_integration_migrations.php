<?php
/**
 * Run Integration Migrations
 * Applies calendar sync logs and other integration-related schema changes
 */

require_once __DIR__ . '/src/Database.php';

echo "=== Running Integration Migrations ===\n\n";

try {
    $db = Database::conn();
    
    // Read and execute migration
    $migrationFile = __DIR__ . '/migrations/add_calendar_sync_logs.sql';
    
    if (!file_exists($migrationFile)) {
        echo "❌ Migration file not found: $migrationFile\n";
        exit(1);
    }
    
    $sql = file_get_contents($migrationFile);
    
    // Split into individual statements
    $statements = array_filter(
        array_map('trim', explode(';', $sql)),
        fn($s) => !empty($s) && !preg_match('/^--/', $s)
    );
    
    $executed = 0;
    $errors = 0;
    
    foreach ($statements as $statement) {
        try {
            $db->exec($statement);
            $executed++;
            echo "✅ Executed statement\n";
        } catch (PDOException $e) {
            // Ignore "already exists" errors for idempotency
            if (strpos($e->getMessage(), 'already exists') !== false || 
                strpos($e->getMessage(), 'Duplicate') !== false) {
                echo "⚠️  Skipped (already exists)\n";
            } else {
                echo "❌ Error: " . $e->getMessage() . "\n";
                $errors++;
            }
        }
    }
    
    echo "\n=== Migration Complete ===\n";
    echo "Executed: $executed\n";
    echo "Errors: $errors\n";
    
    exit($errors > 0 ? 1 : 0);
    
} catch (Exception $e) {
    echo "❌ Fatal error: " . $e->getMessage() . "\n";
    exit(1);
}
