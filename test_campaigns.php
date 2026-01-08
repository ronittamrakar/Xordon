<?php
// Simple test script to check campaigns functionality
require_once __DIR__ . '/backend/src/Database.php';
require_once __DIR__ . '/backend/src/Response.php';
require_once __DIR__ . '/backend/src/Auth.php';

try {
    // Test database connection
    $db = Database::conn();
    echo "✓ Database connection successful\n";
    
    // Test campaigns table exists
    $stmt = $db->query("SHOW TABLES LIKE 'campaigns'");
    if ($stmt->fetch()) {
        echo "✓ Campaigns table exists\n";
    } else {
        echo "✗ Campaigns table missing\n";
        exit(1);
    }
    
    // Test campaigns table structure
    $stmt = $db->query("DESCRIBE campaigns");
    $columns = $stmt->fetchAll(PDO::FETCH_ASSOC);
    $columnNames = array_column($columns, 'Field');
    
    echo "✓ Campaigns table columns: " . implode(', ', $columnNames) . "\n";
    
    // Test if there are any campaigns
    $stmt = $db->query("SELECT COUNT(*) as count FROM campaigns");
    $count = $stmt->fetch()['count'];
    echo "✓ Total campaigns in database: $count\n";
    
    if ($count > 0) {
        // Test fetching campaigns
        $stmt = $db->query("SELECT id, name, status, created_at FROM campaigns ORDER BY created_at DESC LIMIT 5");
        $campaigns = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo "✓ Sample campaigns:\n";
        foreach ($campaigns as $campaign) {
            echo "  - ID: {$campaign['id']}, Name: {$campaign['name']}, Status: {$campaign['status']}, Created: {$campaign['created_at']}\n";
        }
    }
    
    echo "\n✓ All tests passed - campaigns functionality appears to be working\n";
    
} catch (Exception $e) {
    echo "✗ Error: " . $e->getMessage() . "\n";
    exit(1);
}