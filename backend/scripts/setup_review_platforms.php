<?php
require_once __DIR__ . '/../src/Database.php';
use Xordon\Database;

try {
    $db = Database::conn();
    
    echo "Setting up review platforms and sample data...\n\n";
    
    // Check if review_platforms table exists
    $tables = $db->query("SHOW TABLES LIKE 'review_platforms'")->fetchAll();
    
    if (empty($tables)) {
        echo "Creating review_platforms table...\n";
        $db->exec("CREATE TABLE review_platforms (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )");
    }
    
    // Insert platforms if they don't exist
    $platforms = ['Google', 'Facebook', 'Yelp', 'TripAdvisor'];
    foreach ($platforms as $platform) {
        $exists = $db->prepare("SELECT id FROM review_platforms WHERE name = ?");
        $exists->execute([$platform]);
        if (!$exists->fetch()) {
            $db->prepare("INSERT INTO review_platforms (name) VALUES (?)")->execute([$platform]);
            echo "✓ Created platform: $platform\n";
        }
    }
    
    echo "\n✅ Platforms setup complete!\n";
    echo "\nNow run: php backend/scripts/insert_sample_reviews.php\n";
    
} catch (Exception $e) {
    echo "\n❌ Failed: " . $e->getMessage() . "\n";
    exit(1);
}
