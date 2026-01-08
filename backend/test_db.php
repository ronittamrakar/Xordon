<?php
require_once __DIR__ . '/src/Database.php';

use Xordon\Database;

try {
    echo "Testing database connection...\n";
    $pdo = Database::conn();
    echo "✓ Connected successfully!\n";
    
    // Test query
    $stmt = $pdo->query("SELECT DATABASE() as db");
    $result = $stmt->fetch();
    echo "✓ Current database: " . $result['db'] . "\n";
    
    // Count existing tables
    $stmt = $pdo->query("SHOW TABLES");
    $count = $stmt->rowCount();
    echo "✓ Existing tables: $count\n";
    
} catch (Exception $e) {
    echo "✗ Error: " . $e->getMessage() . "\n";
    exit(1);
}
