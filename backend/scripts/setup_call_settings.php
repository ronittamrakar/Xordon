<?php
/**
 * Quick Setup Script - Creates Default Call Settings
 * Run this to enable calling functionality
 */

require_once __DIR__ . '/../src/core/Database.php';

use App\Core\Database;

try {
    $pdo = Database::conn();
    
    // Get the first user ID (or you can specify your user ID)
    $stmt = $pdo->query('SELECT id FROM users LIMIT 1');
    $user = $stmt->fetch();
    
    if (!$user) {
        die("❌ No users found. Please create a user first.\n");
    }
    
    $userId = $user['id'];
    
    // Check if call settings already exist
    $stmt = $pdo->prepare('SELECT id FROM call_settings WHERE user_id = ?');
    $stmt->execute([$userId]);
    
    if ($stmt->fetch()) {
        echo "✅ Call settings already exist for user {$userId}\n";
        exit(0);
    }
    
    // Create default call settings
    $defaultSettings = json_encode([
        'defaultCallerId' => '', // Will be set when user selects a number
        'recordCalls' => false,
        'autoAnswer' => false,
        'callTimeout' => 30,
        'voicemailEnabled' => false,
        'callForwarding' => false
    ]);
    
    $stmt = $pdo->prepare('
        INSERT INTO call_settings (user_id, data, created_at, updated_at) 
        VALUES (?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    ');
    
    $stmt->execute([$userId, $defaultSettings]);
    
    echo "✅ Default call settings created for user {$userId}\n";
    echo "📞 You can now make calls using the Xoftphone!\n";
    echo "\n";
    echo "Next steps:\n";
    echo "1. Make sure you have a SignalWire connection configured\n";
    echo "2. Select a 'From' number in the softphone\n";
    echo "3. Enter a destination number\n";
    echo "4. Click Call!\n";
    
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
    exit(1);
}
