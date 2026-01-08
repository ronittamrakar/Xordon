<?php
require_once __DIR__ . '/../src/Database.php';
use Xordon\Database;

try {
    $db = Database::conn();
    $sql = file_get_contents(__DIR__ . '/../migrations/reputation_module.sql');
    
    // Split SQL into individual statements if necessary, but exec() might handle multiple statements if supported by PDO
    // However, some PDO drivers don't like multiple statements in one exec().
    // Let's try direct exec first.
    $db->exec($sql);
    echo "Reputation migration completed\n";
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
