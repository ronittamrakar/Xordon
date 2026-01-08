<?php
/**
 * Inbound Call System Setup Script
 * Run this to create the necessary database tables for inbound call handling
 */

require_once __DIR__ . '/../src/Database.php';

echo "Setting up Inbound Call System tables...\n\n";

$pdo = Database::conn();

$queries = [
    // Call Inbox Management Table
    "CREATE TABLE IF NOT EXISTS call_inbox (
        id INT AUTO_INCREMENT PRIMARY KEY,
        call_log_id INT NOT NULL,
        status ENUM('new', 'in-progress', 'completed', 'follow-up', 'archived') DEFAULT 'new',
        priority ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium',
        assigned_to INT NULL,
        notes TEXT NULL,
        callback_scheduled_at DATETIME NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY unique_call_log (call_log_id),
        KEY idx_status (status),
        KEY idx_priority (priority),
        KEY idx_assigned_to (assigned_to),
        KEY idx_callback (callback_scheduled_at)
    )",
    
    // Call Queues for Team-based Routing
    "CREATE TABLE IF NOT EXISTS call_queues (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        workspace_id INT NULL,
        name VARCHAR(100) NOT NULL,
        description TEXT NULL,
        strategy ENUM('simultaneous', 'round-robin', 'least-recent', 'random', 'skills-based') DEFAULT 'round-robin',
        max_wait_time INT DEFAULT 300,
        wrap_up_time INT DEFAULT 30,
        hold_music_url VARCHAR(500) NULL,
        hold_message TEXT NULL,
        fallback_type ENUM('voicemail', 'forward', 'hangup', 'callback') DEFAULT 'voicemail',
        fallback_destination VARCHAR(100) NULL,
        is_active BOOLEAN DEFAULT TRUE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        KEY idx_user (user_id),
        KEY idx_workspace (workspace_id)
    )",
    
    // Queue Members
    "CREATE TABLE IF NOT EXISTS call_queue_members (
        id INT AUTO_INCREMENT PRIMARY KEY,
        queue_id INT NOT NULL,
        agent_id INT NOT NULL,
        priority INT DEFAULT 1,
        skills JSON NULL,
        is_active BOOLEAN DEFAULT TRUE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_queue_agent (queue_id, agent_id),
        KEY idx_queue (queue_id),
        KEY idx_agent (agent_id)
    )",
    
    // Queued Calls
    "CREATE TABLE IF NOT EXISTS call_queue_entries (
        id INT AUTO_INCREMENT PRIMARY KEY,
        queue_id INT NULL,
        call_sid VARCHAR(100) NOT NULL,
        caller_number VARCHAR(50) NOT NULL,
        caller_name VARCHAR(200) NULL,
        position INT NOT NULL DEFAULT 1,
        status ENUM('waiting', 'ringing', 'answered', 'abandoned', 'timeout', 'callback') DEFAULT 'waiting',
        wait_started_at DATETIME NOT NULL,
        answered_at DATETIME NULL,
        answered_by INT NULL,
        callback_requested BOOLEAN DEFAULT FALSE,
        callback_number VARCHAR(50) NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        KEY idx_queue (queue_id),
        KEY idx_call_sid (call_sid),
        KEY idx_status (status)
    )",
    
    // Business Hours
    "CREATE TABLE IF NOT EXISTS business_hours (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        workspace_id INT NULL,
        name VARCHAR(100) DEFAULT 'Default Hours',
        timezone VARCHAR(50) DEFAULT 'America/New_York',
        monday_open TIME NULL,
        monday_close TIME NULL,
        tuesday_open TIME NULL,
        tuesday_close TIME NULL,
        wednesday_open TIME NULL,
        wednesday_close TIME NULL,
        thursday_open TIME NULL,
        thursday_close TIME NULL,
        friday_open TIME NULL,
        friday_close TIME NULL,
        saturday_open TIME NULL,
        saturday_close TIME NULL,
        sunday_open TIME NULL,
        sunday_close TIME NULL,
        is_default BOOLEAN DEFAULT FALSE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        KEY idx_user (user_id),
        KEY idx_workspace (workspace_id)
    )",
    
    // Holidays
    "CREATE TABLE IF NOT EXISTS holidays (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        workspace_id INT NULL,
        name VARCHAR(100) NOT NULL,
        date DATE NOT NULL,
        is_recurring BOOLEAN DEFAULT FALSE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        KEY idx_user (user_id),
        KEY idx_date (date)
    )"
];

// Column additions for existing tables
$alterQueries = [
    // Add agent status columns
    "ALTER TABLE call_agents ADD COLUMN IF NOT EXISTS status ENUM('available', 'busy', 'away', 'offline', 'on-call', 'wrap-up') DEFAULT 'offline'",
    "ALTER TABLE call_agents ADD COLUMN IF NOT EXISTS last_active_at DATETIME NULL",
    "ALTER TABLE call_agents ADD COLUMN IF NOT EXISTS current_call_id INT NULL",
    "ALTER TABLE call_agents ADD COLUMN IF NOT EXISTS skills JSON NULL",
    "ALTER TABLE call_agents ADD COLUMN IF NOT EXISTS max_concurrent_calls INT DEFAULT 1",
    
    // Add queue and routing columns to phone_call_logs
    "ALTER TABLE phone_call_logs ADD COLUMN IF NOT EXISTS queue_id INT NULL",
    "ALTER TABLE phone_call_logs ADD COLUMN IF NOT EXISTS queue_wait_time INT NULL",
    "ALTER TABLE phone_call_logs ADD COLUMN IF NOT EXISTS queue_position INT NULL",
    
    // VIP Contacts Tracking
    "ALTER TABLE contacts ADD COLUMN IF NOT EXISTS is_vip BOOLEAN DEFAULT FALSE",
    "ALTER TABLE contacts ADD COLUMN IF NOT EXISTS vip_priority INT DEFAULT 0",
    "ALTER TABLE contacts ADD COLUMN IF NOT EXISTS preferred_language VARCHAR(10) DEFAULT 'en-US'"
];

$success = 0;
$failed = 0;

// Run CREATE TABLE queries
foreach ($queries as $query) {
    try {
        $pdo->exec($query);
        preg_match('/CREATE TABLE IF NOT EXISTS (\w+)/', $query, $matches);
        $tableName = $matches[1] ?? 'unknown';
        echo "✓ Created/verified table: $tableName\n";
        $success++;
    } catch (PDOException $e) {
        preg_match('/CREATE TABLE IF NOT EXISTS (\w+)/', $query, $matches);
        $tableName = $matches[1] ?? 'unknown';
        echo "✗ Failed to create table $tableName: " . $e->getMessage() . "\n";
        $failed++;
    }
}

echo "\n";

// Run ALTER TABLE queries
foreach ($alterQueries as $query) {
    try {
        $pdo->exec($query);
        preg_match('/ALTER TABLE (\w+) ADD COLUMN.*?(\w+)\s/', $query, $matches);
        $tableName = $matches[1] ?? 'unknown';
        $columnName = $matches[2] ?? 'unknown';
        echo "✓ Added/verified column: $tableName.$columnName\n";
        $success++;
    } catch (PDOException $e) {
        // Column might already exist, which is OK
        if (strpos($e->getMessage(), 'Duplicate column') !== false) {
            preg_match('/ALTER TABLE (\w+)/', $query, $matches);
            $tableName = $matches[1] ?? 'unknown';
            echo "○ Column already exists in $tableName (skipped)\n";
        } else {
            echo "✗ ALTER failed: " . $e->getMessage() . "\n";
            $failed++;
        }
    }
}

echo "\n=================================\n";
echo "Setup complete!\n";
echo "Success: $success\n";
echo "Failed: $failed\n";
echo "=================================\n";

if ($failed === 0) {
    echo "\nInbound call system is ready to use.\n";
    echo "Features enabled:\n";
    echo "  - Call Inbox (missed calls, voicemails, callbacks)\n";
    echo "  - Live Call Monitor\n";
    echo "  - Call Queues with team routing\n";
    echo "  - Business Hours routing\n";
    echo "  - Holiday calendar\n";
    echo "  - Agent presence tracking\n";
}
