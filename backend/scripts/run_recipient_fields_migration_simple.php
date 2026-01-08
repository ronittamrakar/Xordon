<?php
// Simple migration runner for recipient fields - CLI mode
if (php_sapi_name() === 'cli') {
    ini_set('display_errors', '1');
    error_reporting(E_ALL);
}

require_once __DIR__ . '/src/Database.php';

try {
    echo "Running recipient fields migration...\n";
    
    $db = Database::conn();
    
    // Ensure MySQL (SQLite support removed)
    $driver = $db->getAttribute(PDO::ATTR_DRIVER_NAME);
    echo "Using database driver: $driver\n";
    if ($driver !== 'mysql') {
        throw new Exception("Unsupported database driver '$driver'. This project is configured for MySQL only.");
    }
    
    // Get existing columns
    $stmt = $db->query("DESCRIBE recipients");
    $existingColumns = array_column($stmt->fetchAll(), 'Field');
    echo "Existing columns: " . implode(', ', $existingColumns) . "\n";
    
    // Add columns that don't exist
    $columnsToAdd = [
        'phone' => "ADD COLUMN phone VARCHAR(20) NULL AFTER email",
        'type' => "ADD COLUMN type VARCHAR(20) NOT NULL DEFAULT 'email' AFTER phone",
        'title' => "ADD COLUMN title VARCHAR(255) NULL AFTER company",
        'updated_at' => "ADD COLUMN updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER created_at"
    ];
    
    foreach ($columnsToAdd as $columnName => $alterStatement) {
        if (!in_array($columnName, $existingColumns)) {
            echo "Adding column: $columnName\n";
            $db->exec("ALTER TABLE recipients $alterStatement");
            echo "Success: Added $columnName\n";
        } else {
            echo "Skipping: $columnName already exists\n";
        }
    }
    
    // Rename name to first_name if name exists and first_name doesn't
    if (in_array('name', $existingColumns) && !in_array('first_name', $existingColumns)) {
        echo "Renaming 'name' to 'first_name'\n";
        $db->exec("ALTER TABLE recipients CHANGE COLUMN name first_name VARCHAR(255) NULL");
        echo "Success: Renamed name to first_name\n";
        // Update existing columns array
        $existingColumns[] = 'first_name';
        $existingColumns = array_diff($existingColumns, ['name']);
    }
    
    // Add last_name column after first_name
    if (!in_array('last_name', $existingColumns)) {
        echo "Adding column: last_name\n";
        $db->exec("ALTER TABLE recipients ADD COLUMN last_name VARCHAR(255) NULL AFTER first_name");
        echo "Success: Added last_name\n";
    } else {
        echo "Skipping: last_name already exists\n";
    }
    
    // Add indexes
    $indexesToAdd = [
        'idx_recipients_phone' => 'CREATE INDEX idx_recipients_phone ON recipients(phone)',
        'idx_recipients_type' => 'CREATE INDEX idx_recipients_type ON recipients(type)',
        'idx_recipients_status' => 'CREATE INDEX idx_recipients_status ON recipients(status)'
    ];
    
    foreach ($indexesToAdd as $indexName => $createStatement) {
        try {
            echo "Adding index: $indexName\n";
            $db->exec($createStatement);
            echo "Success: Added $indexName\n";
        } catch (Exception $e) {
            if (strpos($e->getMessage(), 'already exists') !== false || strpos($e->getMessage(), 'Duplicate key name') !== false) {
                echo "Skipping: $indexName already exists\n";
            } else {
                throw $e;
            }
        }
    }
    
    // Update existing recipients to have type 'email'
    echo "Updating existing recipients to have type 'email'\n";
    $db->exec("UPDATE recipients SET type = 'email' WHERE type IS NULL OR type = ''");
    echo "Success: Updated existing recipients\n";
    
    echo "Migration completed successfully!\n";
    
} catch (Exception $e) {
    echo "Migration failed: " . $e->getMessage() . "\n";
    echo "Error code: " . $e->getCode() . "\n";
    echo "Stack trace: " . $e->getTraceAsString() . "\n";
}
?>