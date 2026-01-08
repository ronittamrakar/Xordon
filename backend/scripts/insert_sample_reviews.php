<?php
require_once __DIR__ . '/../src/Database.php';
use Xordon\Database;

try {
    $db = Database::conn();
    
    echo "Inserting sample reviews (simplified)...\n\n";
    
    // Disable foreign key checks temporarily
    $db->exec("SET FOREIGN_KEY_CHECKS=0");
    
    // Clear existing sample reviews
    $db->exec("DELETE FROM reviews WHERE author_name LIKE 'Sample%'");
    
    // Insert 5 sample reviews with minimal required fields
    $stmt = $db->prepare("
        INSERT INTO reviews (
            workspace_id, platform_id, rating, author_name, author_email, 
            review_text, sentiment, review_date, replied, is_spam, created_at, platform
        ) VALUES (1, 1, ?, ?, ?, ?, ?, ?, 0, 0, NOW(), ?)
    ");
    
    $reviews = [
        [5, 'Sample User 1', 'user1@example.com', 'Excellent service! Highly recommend.', 'positive', date('Y-m-d H:i:s', strtotime('-2 days')), 'Google'],
        [4, 'Sample User 2', 'user2@example.com', 'Very good experience overall.', 'positive', date('Y-m-d H:i:s', strtotime('-5 days')), 'Google'],
        [3, 'Sample User 3', 'user3@example.com', 'Average service, could be better.', 'neutral', date('Y-m-d H:i:s', strtotime('-7 days')), 'Yelp'],
        [5, 'Sample User 4', 'user4@example.com', 'Amazing! Will definitely come back.', 'positive', date('Y-m-d H:i:s', strtotime('-1 day')), 'Facebook'],
        [4, 'Sample User 5', 'user5@example.com', 'Good service, friendly staff.', 'positive', date('Y-m-d H:i:s', strtotime('-3 days')), 'Google'],
    ];
    
    foreach ($reviews as $review) {
        $stmt->execute($review);
        echo "✓ Added review from {$review[1]}\n";
    }
    
    // Re-enable foreign key checks
    $db->exec("SET FOREIGN_KEY_CHECKS=1");
    
    echo "\n✅ Sample reviews inserted successfully!\n";
    
    // Count total reviews
    $count = $db->query("SELECT COUNT(*) FROM reviews WHERE workspace_id = 1")->fetchColumn();
    echo "\nTotal reviews in database: $count\n";
    
} catch (Exception $e) {
    $db->exec("SET FOREIGN_KEY_CHECKS=1"); // Re-enable on error
    echo "\n❌ Failed: " . $e->getMessage() . "\n";
    exit(1);
}
