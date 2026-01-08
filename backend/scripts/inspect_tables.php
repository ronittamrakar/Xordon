<?php
// Load environment variables manually as in index.php
$envFile = __DIR__ . '/../.env';
if (file_exists($envFile)) {
    $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos(trim($line), '#') === 0) continue;
        if (strpos($line, '=') !== false) {
            list($name, $value) = explode('=', $line, 2);
            putenv(trim($name) . '=' . trim($value));
        }
    }
}

require_once __DIR__ . '/../src/Database.php';

use Xordon\Database;

$db = Database::conn();

$tables = ['business_listings', 'listing_settings', 'company_settings', 'settings'];
foreach ($tables as $table) {
    echo "Checking table: $table\n";
    try {
        $stmt = $db->query("DESCRIBE $table");
        $columns = $stmt->fetchAll(PDO::FETCH_Column);
        print_r($columns);
    } catch (Exception $e) {
        echo "Table $table not found or error: " . $e->getMessage() . "\n";
    }
    echo "-------------------\n";
}

// Check row count in listing_settings
try {
    $stmt = $db->query("SELECT * FROM listing_settings LIMIT 1");
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    echo "First row of listing_settings:\n";
    print_r($row);
} catch (Exception $e) {
    echo "Error reading listing_settings: " . $e->getMessage() . "\n";
}
