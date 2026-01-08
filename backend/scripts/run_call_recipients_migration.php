<?php
require_once __DIR__ . '/src/Database.php';

try {
    $pdo = Database::conn();
    
    echo "Running call_recipients migration...\n\n";
    
    // Check if call_recipients table exists
    $stmt = $pdo->query("SHOW TABLES LIKE 'call_recipients'");
    $exists = $stmt->fetch();
    
    if (!$exists) {
        echo "Creating call_recipients table...\n";
        
        $sql = "CREATE TABLE IF NOT EXISTS call_recipients (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            campaign_id INT NULL,
            first_name VARCHAR(100),
            last_name VARCHAR(100),
            email VARCHAR(255),
            phone VARCHAR(50),
            phone_number VARCHAR(50),
            company VARCHAR(255),
            title VARCHAR(255),
            status VARCHAR(50) DEFAULT 'pending',
            notes TEXT NULL,
            disposition_id VARCHAR(100) NULL,
            call_count INT DEFAULT 0,
            last_call_at TIMESTAMP NULL,
            tags JSON NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_user_id (user_id),
            INDEX idx_campaign_id (campaign_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4";
        
        $pdo->exec($sql);
        echo "✓ call_recipients table created successfully.\n";
    } else {
        echo "call_recipients table exists. Adding missing columns...\n";
        
        // Get existing columns
        $stmt = $pdo->query("DESCRIBE call_recipients");
        $existingColumns = [];
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $existingColumns[] = $row['Field'];
        }
        
        // Add missing columns
        $columnsToAdd = [
            'campaign_id' => 'INT NULL AFTER user_id',
            'phone_number' => 'VARCHAR(50) NULL AFTER phone',
            'notes' => 'TEXT NULL AFTER status',
            'disposition_id' => 'VARCHAR(100) NULL AFTER notes',
            'call_count' => 'INT DEFAULT 0 AFTER disposition_id',
            'last_call_at' => 'TIMESTAMP NULL AFTER call_count',
            'tags' => 'JSON NULL AFTER last_call_at'
        ];
        
        foreach ($columnsToAdd as $column => $definition) {
            if (!in_array($column, $existingColumns)) {
                try {
                    $pdo->exec("ALTER TABLE call_recipients ADD COLUMN $column $definition");
                    echo "✓ Added column: $column\n";
                } catch (Exception $e) {
                    echo "⚠ Could not add column $column: " . $e->getMessage() . "\n";
                }
            } else {
                echo "- Column $column already exists\n";
            }
        }
        
        // Add indexes if they don't exist
        try {
            $pdo->exec("CREATE INDEX idx_call_recipients_campaign_id ON call_recipients(campaign_id)");
            echo "✓ Added index on campaign_id\n";
        } catch (Exception $e) {
            echo "- Index on campaign_id already exists or could not be created\n";
        }
        
        try {
            $pdo->exec("CREATE INDEX idx_call_recipients_user_id ON call_recipients(user_id)");
            echo "✓ Added index on user_id\n";
        } catch (Exception $e) {
            echo "- Index on user_id already exists or could not be created\n";
        }
    }
    
    // Sync phone and phone_number columns (only if both columns exist)
    echo "\nSyncing phone and phone_number columns...\n";
    try {
        // Check if phone column exists
        $stmt = $pdo->query("SHOW COLUMNS FROM call_recipients LIKE 'phone'");
        $phoneExists = $stmt->fetch();
        
        if ($phoneExists) {
            $pdo->exec("UPDATE call_recipients SET phone_number = phone WHERE phone_number IS NULL AND phone IS NOT NULL");
            $pdo->exec("UPDATE call_recipients SET phone = phone_number WHERE phone IS NULL AND phone_number IS NOT NULL");
            echo "✓ Phone columns synced\n";
        } else {
            echo "- Phone column doesn't exist, skipping sync\n";
        }
    } catch (Exception $e) {
        echo "⚠ Could not sync phone columns: " . $e->getMessage() . "\n";
    }
    
    echo "\n✓ Migration completed successfully!\n";
    
    // Show current table structure
    echo "\nCurrent table structure:\n";
    $stmt = $pdo->query("DESCRIBE call_recipients");
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        echo "  - {$row['Field']}: {$row['Type']}\n";
    }
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
    exit(1);
}
