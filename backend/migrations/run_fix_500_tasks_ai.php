<?php
// Load environment variables from .env file BEFORE dependencies
$envFile = __DIR__ . '/../../.env';
if (file_exists($envFile)) {
    $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos(trim($line), '#') === 0) {
            continue; // Skip comments
        }
        
        if (strpos($line, '=') !== false) {
            list($name, $value) = explode('=', $line, 2);
            $name = trim($name);
            $value = trim($value);
            
            if (!array_key_exists($name, $_SERVER) && !array_key_exists($name, $_ENV)) {
                putenv(sprintf('%s=%s', $name, $value));
                $_ENV[$name] = $value;
                $_SERVER[$name] = $value;
            }
        }
    }
}

require_once __DIR__ . '/../src/Database.php';

echo "Starting fix for 500 errors (creating missing tables)...\n";

try {
    $pdo = Database::conn();
    
    // 1. Create AI Agents table
    echo "Creating ai_agents table...\n";
    $sqlAi = "
        CREATE TABLE IF NOT EXISTS ai_agents (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id INT NOT NULL,
          name VARCHAR(255) NOT NULL,
          type VARCHAR(50) NOT NULL DEFAULT 'chat',
          config JSON NULL,
          status VARCHAR(20) NOT NULL DEFAULT 'active',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX (user_id),
          INDEX (status)
        );
    ";
    $pdo->exec($sqlAi);
    echo "✅ ai_agents table created.\n";

    // 2. Create Sales Tasks tables
    echo "Creating sales_tasks and related tables...\n";
    
    // Check if contacts table exists first
    $checkContacts = $pdo->query("SHOW TABLES LIKE 'contacts'");
    if ($checkContacts->rowCount() === 0) {
        echo "⚠️ 'contacts' table missing! Creating a simplified version to allow FK constraints...\n";
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS contacts (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                name VARCHAR(255),
                email VARCHAR(255),
                phone VARCHAR(50),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        ");
        echo "✅ Created placeholder 'contacts' table.\n";
    }

    $sqlTasksFull = "
        CREATE TABLE IF NOT EXISTS sales_tasks (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            client_id INT DEFAULT NULL,
            assigned_to INT,
            contact_id INT,
            company_id INT,
            deal_id INT,
            title VARCHAR(255) NOT NULL,
            description TEXT,
            task_type ENUM('call', 'email', 'sms', 'meeting', 'follow_up', 'demo', 'proposal', 'other') NOT NULL,
            priority ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium',
            status ENUM('pending', 'in_progress', 'completed', 'cancelled', 'deferred') DEFAULT 'pending',
            due_date DATETIME,
            due_time TIME,
            reminder_at DATETIME,
            completed_at DATETIME,
            outcome TEXT,
            outcome_type ENUM('successful', 'no_answer', 'voicemail', 'rescheduled', 'not_interested', 'other'),
            related_entity_type VARCHAR(50),
            related_entity_id INT,
            tags JSON,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_user_id (user_id),
            INDEX idx_assigned_to (assigned_to),
            INDEX idx_contact_id (contact_id),
            INDEX idx_status (status),
            INDEX idx_due_date (due_date)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    ";
    $pdo->exec($sqlTasksFull);
    echo "✅ sales_tasks table created.\n";
    
    // Daily Goals
    $sqlGoals = "
        CREATE TABLE IF NOT EXISTS daily_goals (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            date DATE NOT NULL,
            calls_goal INT DEFAULT 0,
            calls_completed INT DEFAULT 0,
            emails_goal INT DEFAULT 0,
            emails_completed INT DEFAULT 0,
            meetings_goal INT DEFAULT 0,
            meetings_completed INT DEFAULT 0,
            tasks_goal INT DEFAULT 0,
            tasks_completed INT DEFAULT 0,
            notes TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            UNIQUE KEY unique_user_date (user_id, date)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    ";
    $pdo->exec($sqlGoals);
    echo "✅ daily_goals table created.\n";

    // Task Templates
    $sqlTemplates = "
        CREATE TABLE IF NOT EXISTS task_templates (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            name VARCHAR(255) NOT NULL,
            description TEXT,
            task_type ENUM('call', 'email', 'sms', 'meeting', 'follow_up', 'demo', 'proposal', 'other') NOT NULL,
            default_priority ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium',
            default_duration_minutes INT DEFAULT 30,
            checklist JSON,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    ";
    $pdo->exec($sqlTemplates);
    echo "✅ task_templates table created.\n";
    
    echo "🎉 All tables created successfully!\n";

} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
    exit(1);
}
