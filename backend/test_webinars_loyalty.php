<?php
// Test script for Webinars and Loyalty APIs
require_once __DIR__ . '/src/Database.php';
require_once __DIR__ . '/src/Auth.php';

echo "=== TESTING WEBINARS & LOYALTY APIs ===\n\n";

$db = Database::conn();

// Test 1: Check if tables exist
echo "1. Checking if tables exist...\n";
$tables = ['webinars', 'webinar_registrants', 'loyalty_programs', 'loyalty_rewards', 'loyalty_transactions', 'loyalty_balances'];
foreach ($tables as $table) {
    try {
        $stmt = $db->query("SELECT COUNT(*) FROM $table");
        $count = $stmt->fetchColumn();
        echo "   ✓ $table exists (rows: $count)\n";
    } catch (PDOException $e) {
        echo "   ✗ $table does NOT exist or has errors\n";
    }
}

// Test 2: Check webinars table structure
echo "\n2. Webinars table structure:\n";
try {
    $stmt = $db->query("DESCRIBE webinars");
    $columns = $stmt->fetchAll(PDO::FETCH_COLUMN);
    echo "   Columns: " . implode(', ', $columns) . "\n";
} catch (PDOException $e) {
    echo "   Error: " . $e->getMessage() . "\n";
}

// Test 3: Check loyalty_programs table structure
echo "\n3. Loyalty Programs table structure:\n";
try {
    $stmt = $db->query("DESCRIBE loyalty_programs");
    $columns = $stmt->fetchAll(PDO::FETCH_COLUMN);
    echo "   Columns: " . implode(', ', $columns) . "\n";
} catch (PDOException $e) {
    echo "   Error: " . $e->getMessage() . "\n";
}

// Test 4: Create a sample webinar (if user_id = 1 exists)
echo "\n4. Testing webinar creation...\n";
try {
    // Check if we have a user
    $stmt = $db->query("SELECT id FROM users LIMIT 1");
    $user = $stmt->fetch();
    
    if ($user) {
        $stmt = $db->prepare("
            INSERT INTO webinars (user_id, workspace_id, title, description, scheduled_at, duration_minutes, status)
            VALUES (?, NULL, ?, ?, NOW() + INTERVAL 1 DAY, 60, 'scheduled')
        ");
        $stmt->execute([
            $user['id'],
            'Test Webinar - API Test',
            'This is a test webinar created by the API test script'
        ]);
        echo "   ✓ Sample webinar created successfully\n";
        
        // Get the created webinar
        $webinarId = $db->lastInsertId();
        $stmt = $db->prepare("SELECT * FROM webinars WHERE id = ?");
        $stmt->execute([$webinarId]);
        $webinar = $stmt->fetch(PDO::FETCH_ASSOC);
        echo "   Webinar ID: {$webinar['id']}, Title: {$webinar['title']}\n";
    } else {
        echo "   ⚠ No users found in database, skipping webinar creation\n";
    }
} catch (PDOException $e) {
    echo "   Error: " . $e->getMessage() . "\n";
}

// Test 5: Create a sample loyalty program
echo "\n5. Testing loyalty program creation...\n";
try {
    $stmt = $db->query("SELECT id FROM users LIMIT 1");
    $user = $stmt->fetch();
    
    if ($user) {
        // Check if program already exists
        $stmt = $db->prepare("SELECT id FROM loyalty_programs WHERE user_id = ?");
        $stmt->execute([$user['id']]);
        $existing = $stmt->fetch();
        
        if (!$existing) {
            $stmt = $db->prepare("
                INSERT INTO loyalty_programs (user_id, workspace_id, name, description, points_to_currency_ratio, signup_bonus, birthday_bonus, is_active)
                VALUES (?, NULL, ?, ?, 0.01, 100, 50, 1)
            ");
            $stmt->execute([
                $user['id'],
                'Test Loyalty Program',
                'Earn points with every purchase'
            ]);
            echo "   ✓ Sample loyalty program created successfully\n";
        } else {
            echo "   ℹ Loyalty program already exists for this user\n";
        }
    } else {
        echo "   ⚠ No users found in database, skipping loyalty program creation\n";
    }
} catch (PDOException $e) {
    echo "   Error: " . $e->getMessage() . "\n";
}

// Test 6: Create a sample reward
echo "\n6. Testing reward creation...\n";
try {
    $stmt = $db->query("SELECT id FROM users LIMIT 1");
    $user = $stmt->fetch();
    
    if ($user) {
        $stmt = $db->prepare("
            INSERT INTO loyalty_rewards (user_id, workspace_id, name, description, points_cost, reward_type, reward_value, is_active)
            VALUES (?, NULL, ?, ?, 500, 'discount_fixed', 10.00, 1)
        ");
        $stmt->execute([
            $user['id'],
            '$10 Discount',
            'Get $10 off your next purchase'
        ]);
        echo "   ✓ Sample reward created successfully\n";
    } else {
        echo "   ⚠ No users found in database, skipping reward creation\n";
    }
} catch (PDOException $e) {
    echo "   Error: " . $e->getMessage() . "\n";
}

echo "\n=== TEST COMPLETE ===\n";
echo "\nNext steps:\n";
echo "1. Open browser and navigate to http://localhost:5173/marketing/webinars\n";
echo "2. Open browser and navigate to http://localhost:5173/marketing/loyalty\n";
echo "3. Test all interactive features\n";
echo "4. Check browser console for any errors\n";
