<?php
/**
 * Run integrations tables migration
 */

require_once __DIR__ . '/src/Database.php';

echo "Running integrations tables migration...\n";

try {
    $pdo = Database::conn();
    
    // Create integrations table
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS integrations (
            id VARCHAR(64) PRIMARY KEY,
            user_id INT NOT NULL,
            name VARCHAR(255) NOT NULL,
            type VARCHAR(50) NOT NULL,
            config JSON,
            status VARCHAR(20) DEFAULT 'inactive',
            last_tested TIMESTAMP NULL,
            error_message TEXT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_integrations_user (user_id),
            INDEX idx_integrations_type (type),
            INDEX idx_integrations_status (status)
        )
    ");
    echo "✓ Created integrations table\n";
    
    // Create webhook_logs table
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS webhook_logs (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            event VARCHAR(100) NOT NULL,
            payload JSON,
            results JSON,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_webhook_logs_user (user_id),
            INDEX idx_webhook_logs_event (event),
            INDEX idx_webhook_logs_created (created_at)
        )
    ");
    echo "✓ Created webhook_logs table\n";
    
    // Add zapier_api_key column to users table
    try {
        $pdo->exec("ALTER TABLE users ADD COLUMN zapier_api_key VARCHAR(64) NULL");
        echo "✓ Added zapier_api_key column to users table\n";
    } catch (PDOException $e) {
        if (strpos($e->getMessage(), 'Duplicate column') !== false) {
            echo "✓ zapier_api_key column already exists\n";
        } else {
            throw $e;
        }
    }
    
    echo "\n✅ Migration completed successfully!\n";
    
} catch (PDOException $e) {
    echo "❌ Migration failed: " . $e->getMessage() . "\n";
    exit(1);
}
