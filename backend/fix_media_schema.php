<?php
require_once __DIR__ . '/src/Config.php';
require_once __DIR__ . '/src/Database.php';

try {
    $db = Database::conn();
    
    // Add deleted_at to folders
    $stmt = $db->query("SHOW COLUMNS FROM folders LIKE 'deleted_at'");
    if ($stmt->rowCount() == 0) {
        echo "Adding deleted_at to folders...\n";
        $db->exec("ALTER TABLE folders ADD COLUMN deleted_at TIMESTAMP NULL DEFAULT NULL");
    }

    // Add starred to files
    $stmt = $db->query("SHOW COLUMNS FROM files LIKE 'starred'");
    if ($stmt->rowCount() == 0) {
        echo "Adding starred to files...\n";
        $db->exec("ALTER TABLE files ADD COLUMN starred TINYINT(1) DEFAULT 0");
    }

    echo "Schema fixes applied successfully.\n";
} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
