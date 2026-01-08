<?php
require_once __DIR__ . '/src/Database.php';

try {
    $db = \Xordon\Database::conn();
    $sql = file_get_contents(__DIR__ . '/migrations/fix_listings_tables_v2.sql');
    
    // Split by semicolon to run statements individually if needed, but PDO might handle it.
    // Better to run raw script if possible, or split.
    // Simple split by ";\n" or similar.
    $statements = explode(';', $sql);
    
    foreach ($statements as $stmt) {
        if (trim($stmt)) {
            $db->exec($stmt);
        }
    }
    
    echo "Migration fix_listings_tables_v2.sql executed successfully.\n";
    
} catch (Exception $e) {
    echo "Error executing migration: " . $e->getMessage() . "\n";
    exit(1);
}
