<?php
require_once __DIR__ . '/src/Database.php';

try {
    $pdo = Database::conn();
    echo "Connected to database successfully!\n\n";
    
    // Check for AI-related tables
    $aiTables = [
        'ai_agents',
        'ai_settings',
        'ai_chatbot_conversations',
        'ai_chatbot_messages',
        'ai_call_answering',
        'ai_analytics_insights',
        'ai_conversation_bookings'
    ];
    
    echo "Checking AI tables...\n";
    echo str_repeat("=", 50) . "\n";
    
    foreach ($aiTables as $table) {
        $stmt = $pdo->query("SHOW TABLES LIKE '$table'");
        $exists = $stmt->fetch();
        
        if ($exists) {
            // Get row count
            $countStmt = $pdo->query("SELECT COUNT(*) as count FROM `$table`");
            $count = $countStmt->fetch(PDO::FETCH_ASSOC)['count'];
            echo "✓ $table exists ($count rows)\n";
        } else {
            echo "✗ $table MISSING\n";
        }
    }
    
    echo "\n" . str_repeat("=", 50) . "\n";
    echo "Verification complete!\n";
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
    exit(1);
}
