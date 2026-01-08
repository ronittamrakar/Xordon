<?php
/**
 * Migration Runner Script
 * Executes all database migrations in order
 */

require_once __DIR__ . '/src/Database.php';

use Xordon\Database;

// Color output for terminal
function colorLog($message, $type = 'info') {
    $colors = [
        'success' => "\033[32m",
        'error' => "\033[31m",
        'warning' => "\033[33m",
        'info' => "\033[36m",
        'reset' => "\033[0m"
    ];
    
    $color = $colors[$type] ?? $colors['info'];
    echo $color . $message . $colors['reset'] . PHP_EOL;
}

try {
    colorLog("=== XORDON DATABASE MIGRATION RUNNER ===", 'info');
    colorLog("Starting migration process...\n", 'info');
    
    // Get database connection
    $pdo = Database::conn();
    
    colorLog("✓ Database connection established", 'success');
    
    // List of migration files in order
    $migrations = [
        'create_ai_workforce_complete.sql',
        'create_culture_module_complete.sql',
        'create_blog_cms_complete.sql',
        'create_critical_missing_tables.sql',
        'add_missing_columns_to_existing_tables.sql'
    ];
    
    $migrationsDir = __DIR__ . '/migrations/';
    $successCount = 0;
    $errorCount = 0;
    
    foreach ($migrations as $migrationFile) {
        $filePath = $migrationsDir . $migrationFile;
        
        if (!file_exists($filePath)) {
            colorLog("⚠ Migration file not found: $migrationFile", 'warning');
            continue;
        }
        
        colorLog("\n→ Running migration: $migrationFile", 'info');
        
        try {
            // Read SQL file
            $sql = file_get_contents($filePath);
            
            // Split by semicolon and execute each statement
            $statements = array_filter(
                array_map('trim', explode(';', $sql)),
                function($stmt) {
                    return !empty($stmt) && 
                           !preg_match('/^--/', $stmt) && 
                           !preg_match('/^\/\*/', $stmt);
                }
            );
            
            $stmtCount = 0;
            foreach ($statements as $statement) {
                if (empty(trim($statement))) continue;
                
                try {
                    $pdo->exec($statement);
                    $stmtCount++;
                } catch (PDOException $e) {
                    // Ignore "table already exists" errors
                    if (strpos($e->getMessage(), 'already exists') === false &&
                        strpos($e->getMessage(), 'Duplicate column') === false) {
                        throw $e;
                    }
                }
            }
            
            colorLog("  ✓ Executed $stmtCount statements successfully", 'success');
            $successCount++;
            
        } catch (Exception $e) {
            colorLog("  ✗ Error: " . $e->getMessage(), 'error');
            $errorCount++;
        }
    }
    
    colorLog("\n=== MIGRATION SUMMARY ===", 'info');
    colorLog("✓ Successful: $successCount", 'success');
    if ($errorCount > 0) {
        colorLog("✗ Failed: $errorCount", 'error');
    }
    
    // Verify tables created
    colorLog("\n=== VERIFYING TABLES ===", 'info');
    
    $tablesToCheck = [
        'ai_employees',
        'ai_capabilities',
        'ai_workflows',
        'culture_surveys',
        'peer_recognition',
        'team_events',
        'blog_posts',
        'blog_categories',
        'webinar_registrations',
        'loyalty_members',
        'social_accounts',
        'financing_applications',
        'signature_documents',
        'course_enrollments'
    ];
    
    $existingTables = [];
    $missingTables = [];
    
    foreach ($tablesToCheck as $table) {
        $stmt = $pdo->query("SHOW TABLES LIKE '$table'");
        if ($stmt->rowCount() > 0) {
            $existingTables[] = $table;
        } else {
            $missingTables[] = $table;
        }
    }
    
    colorLog("\n✓ Tables created: " . count($existingTables), 'success');
    foreach ($existingTables as $table) {
        colorLog("  • $table", 'success');
    }
    
    if (!empty($missingTables)) {
        colorLog("\n⚠ Tables not found: " . count($missingTables), 'warning');
        foreach ($missingTables as $table) {
            colorLog("  • $table", 'warning');
        }
    }
    
    colorLog("\n=== MIGRATION COMPLETE ===", 'success');
    
} catch (Exception $e) {
    colorLog("\n✗ FATAL ERROR: " . $e->getMessage(), 'error');
    colorLog("Stack trace: " . $e->getTraceAsString(), 'error');
    exit(1);
}
