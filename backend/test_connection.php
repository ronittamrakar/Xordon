<?php
require_once 'vendor/autoload.php';
require_once 'src/Database.php';

use Xordon\Database;

try {
    $pdo = Database::conn();
    echo "✓ Database connection successful!\n";
    
    // Test basic queries
    $stmt = $pdo->query('SELECT COUNT(*) as count FROM users');
    $result = $stmt->fetch();
    echo "✓ Users count: " . $result['count'] . "\n";
    
    $stmt = $pdo->query('SELECT COUNT(*) as count FROM campaigns');
    $result = $stmt->fetch();
    echo "✓ Campaigns count: " . $result['count'] . "\n";
    
    $stmt = $pdo->query('SELECT COUNT(*) as count FROM contacts');
    $result = $stmt->fetch();
    echo "✓ Contacts count: " . $result['count'] . "\n";
    
    echo "\n✓ All database tests passed!\n";
} catch (Exception $e) {
    echo "✗ Error: " . $e->getMessage() . "\n";
    exit(1);
}
