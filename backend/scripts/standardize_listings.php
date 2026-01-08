<?php
require_once __DIR__ . '/../src/Database.php';
use Xordon\Database;

try {
    $db = Database::conn();
    
    // Drop old simplified business_listings
    $db->exec("DROP TABLE IF EXISTS business_listings");
    echo "Dropped old business_listings\n";
    
    // Run fix_listings_tables_v2.sql
    $sql = file_get_contents(__DIR__ . '/../migrations/fix_listings_tables_v2.sql');
    $db->exec($sql);
    echo "Executed fix_listings_tables_v2.sql\n";

    // Also make sure review_platforms exists as ListingsController might reference it in the future
    // and reputation_module.sql referenced it.
    
    echo "Table standardization completed\n";
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
