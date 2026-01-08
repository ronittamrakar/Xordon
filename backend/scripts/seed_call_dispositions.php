<?php

require_once __DIR__ . '/../src/Database.php';
require_once __DIR__ . '/../src/Auth.php';

try {
    $pdo = Database::conn();
    
    // Get the first user ID for testing
    $stmt = $pdo->query('SELECT id FROM users LIMIT 1');
    $user = $stmt->fetch();
    
    if (!$user) {
        echo "No users found in database\n";
        exit(1);
    }
    
    $userId = $user['id'];
    echo "Using user ID: $userId\n";
    
    // Check which table exists
    $dispositionTable = 'call_disposition_types';
    try {
        $pdo->query("SELECT 1 FROM call_dispositions_types LIMIT 1");
        $dispositionTable = 'call_dispositions_types';
        echo "Using table: call_dispositions_types\n";
    } catch (Exception $e) {
        echo "Using table: call_disposition_types\n";
    }
    
    // Default dispositions to create
    $defaultDispositions = [
        // Positive outcomes
        ['name' => 'Interested', 'description' => 'Contact showed interest in the offer', 'category' => 'positive', 'color' => '#10B981', 'is_default' => 1],
        ['name' => 'Appointment Set', 'description' => 'Successfully scheduled an appointment', 'category' => 'positive', 'color' => '#3B82F6', 'is_default' => 1],
        ['name' => 'Sale Made', 'description' => 'Contact made a purchase', 'category' => 'positive', 'color' => '#8B5CF6', 'is_default' => 1],
        ['name' => 'Hot Lead', 'description' => 'Highly qualified lead', 'category' => 'positive', 'color' => '#F59E0B', 'is_default' => 1],
        
        // Negative outcomes
        ['name' => 'Not Interested', 'description' => 'Contact declined the offer', 'category' => 'negative', 'color' => '#EF4444', 'is_default' => 1],
        ['name' => 'Wrong Number', 'description' => 'Incorrect phone number', 'category' => 'negative', 'color' => '#6B7280', 'is_default' => 1],
        ['name' => 'Do Not Call', 'description' => 'Contact requested no further calls', 'category' => 'negative', 'color' => '#DC2626', 'is_default' => 1],
        ['name' => 'Already Customer', 'description' => 'Contact is already a customer', 'category' => 'negative', 'color' => '#9CA3AF', 'is_default' => 1],
        
        // Neutral outcomes
        ['name' => 'No Answer', 'description' => 'Call went unanswered', 'category' => 'neutral', 'color' => '#6B7280', 'is_default' => 1],
        ['name' => 'Voicemail', 'description' => 'Left a voicemail message', 'category' => 'neutral', 'color' => '#64748B', 'is_default' => 1],
        ['name' => 'Busy', 'description' => 'Line was busy', 'category' => 'neutral', 'color' => '#78716C', 'is_default' => 1],
        ['name' => 'Gatekeeper', 'description' => 'Spoke with gatekeeper, not decision maker', 'category' => 'neutral', 'color' => '#71717A', 'is_default' => 1],
        
        // Follow-up outcomes
        ['name' => 'Call Back Later', 'description' => 'Contact requested a callback', 'category' => 'follow_up', 'color' => '#F59E0B', 'is_default' => 1],
        ['name' => 'Send Information', 'description' => 'Contact wants more information', 'category' => 'follow_up', 'color' => '#3B82F6', 'is_default' => 1],
        ['name' => 'Follow Up Required', 'description' => 'Needs follow-up action', 'category' => 'follow_up', 'color' => '#8B5CF6', 'is_default' => 1],
    ];
    
    $inserted = 0;
    foreach ($defaultDispositions as $disposition) {
        try {
            // Check if disposition already exists
            $stmt = $pdo->prepare("SELECT id FROM $dispositionTable WHERE name = ? AND user_id = ?");
            $stmt->execute([$disposition['name'], $userId]);
            
            if ($stmt->fetch()) {
                echo "Skipping '{$disposition['name']}' - already exists\n";
                continue;
            }
            
            // Insert disposition
            $stmt = $pdo->prepare("
                INSERT INTO $dispositionTable 
                (user_id, name, description, category, color, is_default, is_active, created_at, updated_at) 
                VALUES (?, ?, ?, ?, ?, ?, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            ");
            
            $stmt->execute([
                $userId,
                $disposition['name'],
                $disposition['description'],
                $disposition['category'],
                $disposition['color'],
                $disposition['is_default']
            ]);
            
            $inserted++;
            echo "✓ Created: {$disposition['name']}\n";
            
        } catch (Exception $e) {
            echo "✗ Failed to create '{$disposition['name']}': " . $e->getMessage() . "\n";
        }
    }
    
    echo "\n=================================\n";
    echo "Summary:\n";
    echo "  Inserted: $inserted dispositions\n";
    echo "=================================\n";
    
    // Verify final count
    $stmt = $pdo->query("SELECT COUNT(*) as count FROM $dispositionTable");
    $count = $stmt->fetch()['count'];
    echo "Total dispositions in database: $count\n";
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
    exit(1);
}
