<?php
require 'backend/src/bootstrap.php';
use Xordon\Database;

if ($argc < 2) {
    die("Usage: php run_sql.php <path_to_sql_file>\n");
}

$file = $argv[1];
if (!file_exists($file)) {
    die("File not found: $file\n");
}

try {
    $db = Database::conn();
    $sql = file_get_contents($file);
    
    // Split by semicolon but be careful with triggers/procedures if any
    // For simple migrations, this is fine
    $queries = array_filter(array_map('trim', explode(';', $sql)));
    
    foreach ($queries as $query) {
        if (empty($query)) continue;
        echo "Executing: " . substr($query, 0, 50) . "...\n";
        $db->exec($query);
    }
    echo "Migration completed successfully.\n";
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
