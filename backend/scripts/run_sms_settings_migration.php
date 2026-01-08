<?php
// Run SMS Settings Migration

require_once __DIR__ . '/src/Database.php';

try {
    echo "Running SMS settings migration...\n";
    
    $pdo = Database::conn();
    
    // Check if we're using MySQL or SQLite
    $driver = $pdo->getAttribute(PDO::ATTR_DRIVER_NAME);
    
    if ($driver !== 'mysql') {
        throw new Exception("Unsupported database driver '$driver'. This project is configured for MySQL only.");
    }
    
    $migrationFile = __DIR__ . '/migrations/add_sms_settings.sql';
    
    if (!file_exists($migrationFile)) {
        throw new Exception("Migration file not found: $migrationFile");
    }
    
    $sql = file_get_contents($migrationFile);
    
    if ($sql === false) {
        throw new Exception("Could not read migration file: $migrationFile");
    }
    
    // Execute the migration
    $pdo->exec($sql);
    
    echo "SMS settings migration completed successfully!\n";
    
    // Verify the table was created
    $stmt = $pdo->query("SHOW TABLES LIKE 'sms_settings'");
    
    if ($stmt->rowCount() > 0) {
        echo "✓ sms_settings table created successfully\n";
    } else {
        echo "⚠ sms_settings table may not have been created\n";
    }
    
} catch (Exception $e) {
    echo "Migration failed: " . $e->getMessage() . "\n";
    exit(1);
}