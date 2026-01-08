<?php
require_once __DIR__ . '/src/bootstrap.php';
require_once __DIR__ . '/src/Database.php';

$db = Database::conn();

// Fix review_requests table
try {
    $db->exec('ALTER TABLE review_requests ADD COLUMN review_rating TINYINT NULL');
    echo "Added review_rating column\n";
} catch (Exception $e) {
    echo "review_rating: " . $e->getMessage() . "\n";
}

// Check memberships table structure
echo "\n=== memberships table ===\n";
try {
    $stmt = $db->query('DESCRIBE memberships');
    foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) as $col) {
        echo $col['Field'] . " - " . $col['Type'] . "\n";
    }
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}

// Check membership_content table
echo "\n=== membership_content table ===\n";
try {
    $stmt = $db->query('DESCRIBE membership_content');
    foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) as $col) {
        echo $col['Field'] . " - " . $col['Type'] . "\n";
    }
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
