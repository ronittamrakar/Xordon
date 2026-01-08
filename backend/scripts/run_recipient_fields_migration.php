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
    
    // Check if we're using MySQL or SQLite
    $driver = $db->getAttribute(PDO::ATTR_DRIVER_NAME);
    echo "Using database driver: $driver\n";
    if ($driver !== 'mysql') {
        throw new Exception("Unsupported database driver '$driver'. This project is configured for MySQL only.");
    }
    
    // MySQL migration - handle existing columns properly
    $sql = "
    -- Check if columns already exist and add them if they don't
    SET @dbname = DATABASE();
    SET @tablename = 'recipients';
    
    -- Add phone column if it doesn't exist
    SET @column_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS 
      WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = 'phone');
    
    SET @sql = IF(@column_exists = 0, 
      'ALTER TABLE recipients ADD COLUMN phone VARCHAR(20) NULL AFTER email',
      'SELECT \'phone column already exists\'');
    PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
    
    -- Add type column if it doesn't exist
    SET @column_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS 
      WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = 'type');
    
    SET @sql = IF(@column_exists = 0, 
      'ALTER TABLE recipients ADD COLUMN type VARCHAR(20) NOT NULL DEFAULT \'email\' AFTER phone',
      'SELECT \'type column already exists\'');
    PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
    
    -- Add title column if it doesn't exist
    SET @column_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS 
      WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = 'title');
    
    SET @sql = IF(@column_exists = 0, 
      'ALTER TABLE recipients ADD COLUMN title VARCHAR(255) NULL AFTER company',
      'SELECT \'title column already exists\'');
    PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
    
    -- Add updated_at column if it doesn't exist
    SET @column_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS 
      WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = 'updated_at');
    
    SET @sql = IF(@column_exists = 0, 
      'ALTER TABLE recipients ADD COLUMN updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER created_at',
      'SELECT \'updated_at column already exists\'');
    PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
    
    -- Rename name column to first_name if it exists and first_name doesn't exist
    SET @column_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS 
      WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = 'first_name');
    
    SET @sql = IF(@column_exists = 0, 
      'ALTER TABLE recipients CHANGE name first_name VARCHAR(255) NULL',
      'SELECT \'first_name column already exists\'');
    PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
    
    -- Add last_name column if it doesn't exist
    SET @column_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS 
      WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = 'last_name');
    
    SET @sql = IF(@column_exists = 0, 
      'ALTER TABLE recipients ADD COLUMN last_name VARCHAR(255) NULL AFTER first_name',
      'SELECT \'last_name column already exists\'');
    PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
    
    -- Add indexes for performance
    SET @index_exists = (SELECT COUNT(*) FROM information_schema.STATISTICS
      WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND INDEX_NAME = 'idx_recipients_phone');
    SET @sql = IF(@index_exists = 0,
      'CREATE INDEX idx_recipients_phone ON recipients(phone)',
      'SELECT \'idx_recipients_phone already exists\'');
    PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
    
    SET @index_exists = (SELECT COUNT(*) FROM information_schema.STATISTICS
      WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND INDEX_NAME = 'idx_recipients_type');
    SET @sql = IF(@index_exists = 0,
      'CREATE INDEX idx_recipients_type ON recipients(type)',
      'SELECT \'idx_recipients_type already exists\'');
    PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
    
    SET @index_exists = (SELECT COUNT(*) FROM information_schema.STATISTICS
      WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND INDEX_NAME = 'idx_recipients_status');
    SET @sql = IF(@index_exists = 0,
      'CREATE INDEX idx_recipients_status ON recipients(status)',
      'SELECT \'idx_recipients_status already exists\'');
    PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
    
    -- Update existing recipients to have type 'email'
    UPDATE recipients SET type = 'email' WHERE type IS NULL OR type = '';
    ";
    
    // Split into individual statements and execute
    $statements = array_filter(array_map('trim', explode(';', $sql)));
    
    foreach ($statements as $statement) {
        if (empty($statement)) continue;
        
        // Skip comments and empty lines
        if (strpos(trim($statement), '--') === 0) continue;
        if (strpos(trim($statement), '/*') === 0) continue;
        if (trim($statement) === '') continue;
        
        echo "Executing: " . substr($statement, 0, 50) . "...\n";
        try {
            $db->exec($statement);
            echo "Success\n";
        } catch (Exception $e) {
            // Ignore "already exists" errors
            if (strpos($e->getMessage(), 'already exists') === false && 
                strpos($e->getMessage(), 'Duplicate key name') === false &&
                strpos($e->getMessage(), 'Duplicate column name') === false) {
                throw $e;
            }
            echo "Already exists, skipping\n";
        }
    }
    
    echo "Migration completed successfully!\n";
    
} catch (Exception $e) {
    echo "Migration failed: " . $e->getMessage() . "\n";
    echo "Error code: " . $e->getCode() . "\n";
    echo "Stack trace: " . $e->getTraceAsString() . "\n";
}
?>