<?php
/**
 * RBAC Migration Runner
 * Executes the RBAC database migration
 */

require_once __DIR__ . '/src/Database.php';

echo "=== RBAC Migration Runner ===\n\n";

try {
    $pdo = Database::conn();
    echo "✓ Database connection established\n";

    // Read the migration SQL file
    $migrationFile = __DIR__ . '/migrations/create_rbac_tables.sql';
    
    if (!file_exists($migrationFile)) {
        throw new Exception("Migration file not found: $migrationFile");
    }
    
    $sql = file_get_contents($migrationFile);
    echo "✓ Migration file loaded\n";

    // Split SQL into individual statements
    $statements = array_filter(
        array_map('trim', explode(';', $sql)),
        fn($s) => !empty($s) && !preg_match('/^--/', $s)
    );

    echo "  Found " . count($statements) . " SQL statements\n\n";

    // Execute each statement
    $successCount = 0;
    $skipCount = 0;
    $errorCount = 0;

    foreach ($statements as $index => $statement) {
        if (empty(trim($statement))) continue;
        
        try {
            // Check if this is a CREATE TABLE statement
            if (preg_match('/CREATE TABLE\s+(?:IF NOT EXISTS\s+)?`?(\w+)`?/i', $statement, $matches)) {
                $tableName = $matches[1];
                
                // Check if table already exists
                $checkStmt = $pdo->query("SHOW TABLES LIKE '$tableName'");
                if ($checkStmt->rowCount() > 0) {
                    echo "  ~ Skipping table '$tableName' (already exists)\n";
                    $skipCount++;
                    continue;
                }
            }
            
            // Check if this is an ALTER TABLE ADD COLUMN statement
            if (preg_match('/ALTER TABLE\s+`?(\w+)`?\s+ADD\s+(?:COLUMN\s+)?`?(\w+)`?/i', $statement, $matches)) {
                $tableName = $matches[1];
                $columnName = $matches[2];
                
                // Check if column already exists
                $checkStmt = $pdo->query("SHOW COLUMNS FROM `$tableName` LIKE '$columnName'");
                if ($checkStmt->rowCount() > 0) {
                    echo "  ~ Skipping column '$tableName.$columnName' (already exists)\n";
                    $skipCount++;
                    continue;
                }
            }
            
            $pdo->exec($statement);
            $successCount++;
            
            // Log what was created
            if (preg_match('/CREATE TABLE/i', $statement)) {
                preg_match('/CREATE TABLE\s+(?:IF NOT EXISTS\s+)?`?(\w+)`?/i', $statement, $matches);
                echo "  + Created table: {$matches[1]}\n";
            } elseif (preg_match('/ALTER TABLE/i', $statement)) {
                echo "  + Executed ALTER TABLE statement\n";
            } elseif (preg_match('/CREATE INDEX/i', $statement)) {
                echo "  + Created index\n";
            }
            
        } catch (PDOException $e) {
            // Handle specific errors gracefully
            if (strpos($e->getMessage(), 'already exists') !== false) {
                echo "  ~ Skipping (already exists)\n";
                $skipCount++;
            } elseif (strpos($e->getMessage(), 'Duplicate column') !== false) {
                echo "  ~ Skipping (column already exists)\n";
                $skipCount++;
            } elseif (strpos($e->getMessage(), 'Duplicate key') !== false) {
                echo "  ~ Skipping (key already exists)\n";
                $skipCount++;
            } else {
                echo "  ✗ Error: " . $e->getMessage() . "\n";
                $errorCount++;
            }
        }
    }

    echo "\n=== Migration Summary ===\n";
    echo "  Successful: $successCount\n";
    echo "  Skipped: $skipCount\n";
    echo "  Errors: $errorCount\n";

    if ($errorCount === 0) {
        echo "\n✓ Migration completed successfully!\n";
    } else {
        echo "\n⚠ Migration completed with $errorCount errors\n";
    }

    // Verify tables exist
    echo "\n=== Verifying Tables ===\n";
    $requiredTables = ['roles', 'permissions', 'role_permissions', 'rbac_audit_log'];
    
    foreach ($requiredTables as $table) {
        $stmt = $pdo->query("SHOW TABLES LIKE '$table'");
        if ($stmt->rowCount() > 0) {
            echo "  ✓ Table '$table' exists\n";
        } else {
            echo "  ✗ Table '$table' NOT FOUND\n";
        }
    }

    // Check if users table has role_id column
    $stmt = $pdo->query("SHOW COLUMNS FROM users LIKE 'role_id'");
    if ($stmt->rowCount() > 0) {
        echo "  ✓ Column 'users.role_id' exists\n";
    } else {
        echo "  ✗ Column 'users.role_id' NOT FOUND\n";
    }

    echo "\n=== Migration Complete ===\n";

} catch (Exception $e) {
    echo "\n✗ Migration failed: " . $e->getMessage() . "\n";
    echo "File: " . $e->getFile() . "\n";
    echo "Line: " . $e->getLine() . "\n";
    exit(1);
}
