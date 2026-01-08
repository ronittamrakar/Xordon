<?php
// Run Call tables migration

require_once __DIR__ . '/src/bootstrap.php';
require_once __DIR__ . '/src/Database.php';

try {
    $db = Database::conn();
    
    echo "Running Call tables migration...\n";
    
    // Determine database type
    $driver = $db->getAttribute(PDO::ATTR_DRIVER_NAME);
    if ($driver !== 'mysql') {
        throw new Exception("Unsupported database driver '$driver'. This project is configured for MySQL only.");
    }
    
    $migrationFile = __DIR__ . '/migrations/add_call_tables.sql';
    
    if (!file_exists($migrationFile)) {
        throw new Exception("Migration file not found: $migrationFile");
    }
    
    $sql = file_get_contents($migrationFile);
    
    // Parse SQL statements properly
    $statements = [];
    $currentStatement = '';
    $lines = explode("\n", $sql);
    
    foreach ($lines as $line) {
        // Skip comment lines
        if (preg_match('/^\s*--/', $line)) {
            continue;
        }
        
        $currentStatement .= $line . "\n";
        
        // Check if this line ends a statement (ends with semicolon)
        if (preg_match('/;\s*$/', $line)) {
            $statement = trim($currentStatement);
            if (!empty($statement)) {
                $statements[] = $statement;
            }
            $currentStatement = '';
        }
    }
    
    // Handle any remaining statement
    $remaining = trim($currentStatement);
    if (!empty($remaining)) {
        $statements[] = $remaining;
    }
    
    echo "Total statements to execute: " . count($statements) . "\n";
    
    // First pass: Create tables
    foreach ($statements as $statement) {
        if (stripos($statement, 'CREATE TABLE') !== false) {
            echo "Creating table...\n";
            try {
                $db->exec($statement);
                echo "✓ Success\n";
            } catch (Exception $e) {
                echo "✗ Error: " . $e->getMessage() . "\n";
                // Continue with other statements
            }
        }
    }
    
    // Second pass: Create indexes
    foreach ($statements as $statement) {
        if (stripos($statement, 'CREATE INDEX') !== false) {
            echo "Creating index...\n";
            try {
                $db->exec($statement);
                echo "✓ Success\n";
            } catch (Exception $e) {
                echo "✗ Error: " . $e->getMessage() . "\n";
                // Continue with other statements
            }
        }
    }
    
    echo "Call tables migration completed successfully!\n";
    
    // Verify tables were created
    echo "\nVerifying Call tables...\n";
    
    $tables = [
        'call_campaigns',
        'call_scripts',
        'call_disposition_types',
        'call_recipients',
        'call_logs',
        'call_analytics',
        'dnc_lists',
        'consent_logs',
        'call_settings'
    ];
    
    foreach ($tables as $table) {
        try {
            $stmt = $db->query("SHOW TABLES LIKE '$table'");
            
            if ($stmt->rowCount() > 0) {
                echo "✓ Table '$table' exists\n";
            } else {
                echo "✗ Table '$table' not found\n";
            }
        } catch (Exception $e) {
            echo "✗ Error checking table '$table': " . $e->getMessage() . "\n";
        }
    }
    
    // Insert default disposition types
    echo "\nInserting default disposition types...\n";
    
    $defaultDispositions = [
        ['Interested', 'positive', '#10B981'],
        ['Not Interested', 'negative', '#EF4444'],
        ['Callback Later', 'follow_up', '#F59E0B'],
        ['Wrong Number', 'negative', '#6B7280'],
        ['No Answer', 'neutral', '#9CA3AF'],
        ['Busy', 'neutral', '#F59E0B'],
        ['Voicemail', 'neutral', '#8B5CF6'],
        ['Follow-up Scheduled', 'follow_up', '#06B6D4']
    ];
    
    try {
        // Check if disposition types already exist
        $stmt = $db->query("SELECT COUNT(*) as count FROM call_disposition_types WHERE is_system = 1");
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($result['count'] == 0) {
            $insertStmt = $db->prepare("INSERT INTO call_disposition_types (user_id, name, category, color, is_system, created_at, updated_at) VALUES (?, ?, ?, ?, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)");
            
            // Get the first user ID for system dispositions
            $userStmt = $db->query("SELECT id FROM users LIMIT 1");
            $user = $userStmt->fetch(PDO::FETCH_ASSOC);
            $systemUserId = $user ? $user['id'] : 1;
            
            foreach ($defaultDispositions as [$name, $category, $color]) {
                $insertStmt->execute([$systemUserId, $name, $category, $color]);
            }
            echo "✓ Default disposition types inserted\n";
        } else {
            echo "✓ Default disposition types already exist\n";
        }
    } catch (Exception $e) {
        echo "✗ Error inserting default dispositions: " . $e->getMessage() . "\n";
    }
    
} catch (Exception $e) {
    echo "Migration failed: " . $e->getMessage() . "\n";
    exit(1);
}