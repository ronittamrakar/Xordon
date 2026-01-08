<?php
require_once 'src/Database.php';
require_once 'src/Logger.php';

try {
    $db = Database::conn();
    
    // Add group_id to sms_recipients table
    $sql = "ALTER TABLE sms_recipients ADD COLUMN group_id INT NULL";
    $db->exec($sql);
    echo "Added group_id column to sms_recipients table\n";
    
    // Add foreign key constraint
    $sql = "ALTER TABLE sms_recipients ADD CONSTRAINT fk_sms_recipients_group_id 
            FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE SET NULL";
    $db->exec($sql);
    echo "Added foreign key constraint\n";
    
    // Add index for better performance
    $sql = "CREATE INDEX idx_sms_recipients_group_id ON sms_recipients(group_id)";
    $db->exec($sql);
    echo "Added index on group_id\n";
    
    echo "Migration completed successfully!\n";
    
} catch (Exception $e) {
    echo "Migration failed: " . $e->getMessage() . "\n";
    if (strpos($e->getMessage(), 'Duplicate column name') !== false) {
        echo "Column already exists, migration may have been run before.\n";
    }
}