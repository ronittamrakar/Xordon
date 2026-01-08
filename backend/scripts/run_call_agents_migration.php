<?php
require_once __DIR__ . '/src/Database.php';

try {
    $pdo = Database::conn();
    
    echo "Running call agents migration...\n\n";
    
    // Create call_agents table
    echo "Creating call_agents table...\n";
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS call_agents (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id INT NOT NULL,
          name VARCHAR(255) NOT NULL,
          email VARCHAR(255),
          phone VARCHAR(50),
          extension VARCHAR(20),
          status ENUM('active', 'inactive', 'busy', 'away') DEFAULT 'active',
          max_concurrent_calls INT DEFAULT 1,
          skills TEXT,
          notes TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          INDEX idx_user_status (user_id, status)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    ");
    echo "✓ call_agents table created\n";
    
    // Add agent_id to call_campaigns
    echo "\nAdding agent_id to call_campaigns...\n";
    try {
        $stmt = $pdo->query("SHOW COLUMNS FROM call_campaigns LIKE 'agent_id'");
        if (!$stmt->fetch()) {
            $pdo->exec("ALTER TABLE call_campaigns ADD COLUMN agent_id INT NULL AFTER user_id");
            echo "✓ Added agent_id column to call_campaigns\n";
        } else {
            echo "✓ agent_id column already exists in call_campaigns\n";
        }
    } catch (Exception $e) {
        echo "Note: " . $e->getMessage() . "\n";
    }
    
    // Add agent_id to call_logs
    echo "\nAdding agent_id to call_logs...\n";
    try {
        $stmt = $pdo->query("SHOW COLUMNS FROM call_logs LIKE 'agent_id'");
        if (!$stmt->fetch()) {
            $pdo->exec("ALTER TABLE call_logs ADD COLUMN agent_id INT NULL");
            echo "✓ Added agent_id column to call_logs\n";
        } else {
            echo "✓ agent_id column already exists in call_logs\n";
        }
    } catch (Exception $e) {
        echo "Note: " . $e->getMessage() . "\n";
    }
    
    echo "\n✅ Migration completed successfully!\n";
    
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
    exit(1);
}
