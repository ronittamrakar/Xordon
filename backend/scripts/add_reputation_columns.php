<?php
require_once __DIR__ . '/../src/Database.php';
use Xordon\Database;

try {
    echo "Adding reputation columns to reviews table...\n\n";
    
    $db = Database::conn();
    
    // Get existing columns
    $stmt = $db->query("DESCRIBE reviews");
    $existingColumns = $stmt->fetchAll(PDO::FETCH_COLUMN);
    
    // Define columns to add
    $columnsToAdd = [
        'author_name' => "ADD COLUMN author_name VARCHAR(255) AFTER reviewer_name",
        'author_email' => "ADD COLUMN author_email VARCHAR(255) AFTER author_name",
        'review_text' => "ADD COLUMN review_text TEXT AFTER title",
        'sentiment' => "ADD COLUMN sentiment VARCHAR(20) DEFAULT 'neutral' AFTER review_text",
        'replied' => "ADD COLUMN replied BOOLEAN DEFAULT FALSE AFTER sentiment",
        'reply_text' => "ADD COLUMN reply_text TEXT AFTER replied",
        'reply_date' => "ADD COLUMN reply_date DATETIME AFTER reply_text",
        'is_spam' => "ADD COLUMN is_spam BOOLEAN DEFAULT FALSE AFTER reply_date",
        'source_url' => "ADD COLUMN source_url TEXT AFTER is_spam",
        'contact_id' => "ADD COLUMN contact_id INT AFTER user_id",
        'platform' => "ADD COLUMN platform VARCHAR(50) AFTER contact_id",
    ];
    
    // Add each column if it doesn't exist
    foreach ($columnsToAdd as $columnName => $alterStatement) {
        if (!in_array($columnName, $existingColumns)) {
            try {
                $db->exec("ALTER TABLE reviews $alterStatement");
                echo "✓ Added column: $columnName\n";
            } catch (PDOException $e) {
                echo "✗ Failed to add $columnName: " . $e->getMessage() . "\n";
            }
        } else {
            echo "⚠ Column already exists: $columnName\n";
        }
    }
    
    // Add indexes
    echo "\nAdding indexes...\n";
    $indexes = [
        'idx_sentiment' => 'sentiment',
        'idx_replied' => 'replied',
        'idx_is_spam' => 'is_spam',
        'idx_contact_id' => 'contact_id',
        'idx_platform_rep' => 'platform',
    ];
    
    foreach ($indexes as $indexName => $column) {
        try {
            $db->exec("ALTER TABLE reviews ADD INDEX $indexName ($column)");
            echo "✓ Added index: $indexName\n";
        } catch (PDOException $e) {
            if (strpos($e->getMessage(), 'Duplicate key') !== false) {
                echo "⚠ Index already exists: $indexName\n";
            } else {
                echo "✗ Failed to add index $indexName: " . $e->getMessage() . "\n";
            }
        }
    }
    
    // Update existing records
    echo "\nUpdating existing records...\n";
    try {
        $db->exec("UPDATE reviews SET 
            author_name = COALESCE(reviewer_name, 'Unknown'),
            platform = CASE 
                WHEN platform_id = 1 THEN 'Google'
                WHEN platform_id = 2 THEN 'Facebook'
                WHEN platform_id = 3 THEN 'Yelp'
                ELSE 'Other'
            END,
            review_text = COALESCE(content, ''),
            sentiment = CASE 
                WHEN rating >= 4 THEN 'positive'
                WHEN rating <= 2 THEN 'negative'
                ELSE 'neutral'
            END
        WHERE author_name IS NULL OR platform IS NULL");
        echo "✓ Updated existing records\n";
    } catch (PDOException $e) {
        echo "⚠ Update warning: " . $e->getMessage() . "\n";
    }
    
    echo "\n✅ Migration completed successfully!\n";
    
} catch (Exception $e) {
    echo "\n❌ Migration failed: " . $e->getMessage() . "\n";
    exit(1);
}
