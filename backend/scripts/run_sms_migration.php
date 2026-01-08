<?php
// Run SMS tables migration

require_once __DIR__ . '/src/bootstrap.php';
require_once __DIR__ . '/src/Database.php';

try {
    $db = Database::conn();
    
    echo "Running SMS tables migration...\n";
    
    // Determine database type
    $driver = $db->getAttribute(PDO::ATTR_DRIVER_NAME);
    if ($driver !== 'mysql') {
        throw new Exception("Unsupported database driver '$driver'. This project is configured for MySQL only.");
    }
    
    $migrationFile = __DIR__ . '/migrations/add_sms_tables.sql';
    
    if (!file_exists($migrationFile)) {
        throw new Exception("Migration file not found: $migrationFile");
    }
    
    $sql = file_get_contents($migrationFile);
    
    // Split by semicolon and execute each statement
    $statements = array_filter(array_map('trim', explode(';', $sql)));
    
    foreach ($statements as $statement) {
        if (!empty($statement) && !preg_match('/^\s*--/', $statement)) {
            echo "Executing: " . substr($statement, 0, 50) . "...\n";
            try {
                $db->exec($statement);
                echo "✓ Success\n";
            } catch (Exception $e) {
                echo "✗ Error: " . $e->getMessage() . "\n";
                // Continue with other statements
            }
        }
    }
    
    echo "SMS tables migration completed successfully!\n";
    
    // Verify tables were created
    echo "\nVerifying SMS tables...\n";
    
    $tables = [
        'sms_campaigns',
        'sms_sequences', 
        'sms_sequence_steps',
        'sms_templates',
        'sms_recipients',
        'sms_messages',
        'sms_replies',
        'sms_analytics'
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
    
} catch (Exception $e) {
    echo "Migration failed: " . $e->getMessage() . "\n";
    exit(1);
}