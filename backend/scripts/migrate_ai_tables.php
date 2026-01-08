<?php
require_once __DIR__ . '/../src/Database.php';
$pdo = Xordon\Database::conn();

$queries = [
    "CREATE TABLE IF NOT EXISTS ai_agents (
        id INT AUTO_INCREMENT PRIMARY KEY, 
        user_id INT, 
        workspace_id INT, 
        name VARCHAR(255), 
        provider VARCHAR(50), 
        model VARCHAR(50) DEFAULT 'gpt-3.5-turbo', 
        voice_id VARCHAR(50), 
        greeting TEXT, 
        prompt TEXT, 
        settings JSON, 
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )",
    "CREATE TABLE IF NOT EXISTS ai_chat_logs (
        id INT AUTO_INCREMENT PRIMARY KEY, 
        call_sid VARCHAR(100), 
        agent_id INT, 
        user_text TEXT, 
        bot_text TEXT, 
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )"
];

foreach ($queries as $query) {
    try {
        $pdo->exec($query);
        echo "Successfully executed query.\n";
    } catch (Exception $e) {
        echo "Error: " . $e->getMessage() . "\n";
    }
}
