<?php
// Find and Fix Current User
require_once __DIR__ . '/backend/src/Database.php';

try {
    $pdo = \Xordon\Database::conn();
    
    echo "=== FINDING USERS ===\n\n";
    
    // List all users
    $stmt = $pdo->query("SELECT id, email, role_id FROM users LIMIT 10");
    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    if (empty($users)) {
        echo "❌ No users found in database!\n";
    } else {
        echo "Found " . count($users) . " users:\n";
        foreach ($users as $user) {
            echo "- ID: {$user['id']}, Email: {$user['email']}, Role ID: " . ($user['role_id'] ?? 'NULL') . "\n";
        }
        
        // Make the first user an admin
        $firstUserId = $users[0]['id'];
        echo "\n=== MAKING USER {$firstUserId} AN ADMIN ===\n";
        
        // Find or create admin role
        $stmt = $pdo->query("SELECT id FROM roles WHERE name = 'Admin'");
        $adminRole = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($adminRole) {
            $adminRoleId = $adminRole['id'];
            echo "Admin role ID: {$adminRoleId}\n";
        } else {
            echo "Creating Admin role...\n";
            $pdo->exec("INSERT INTO roles (name, description) VALUES ('Admin', 'System Administrator')");
            $adminRoleId = $pdo->lastInsertId();
            echo "Created Admin role with ID: {$adminRoleId}\n";
        }
        
        // Assign admin role to first user
        $stmt = $pdo->prepare("UPDATE users SET role_id = ? WHERE id = ?");
        $stmt->execute([$adminRoleId, $firstUserId]);
        
        echo "✅ User {$firstUserId} is now an admin!\n\n";
        
        echo "=== VERIFICATION ===\n";
        $stmt = $pdo->prepare("SELECT u.id, u.email, u.role_id, r.name as role_name 
                               FROM users u 
                               LEFT JOIN roles r ON u.role_id = r.id 
                               WHERE u.id = ?");
        $stmt->execute([$firstUserId]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        
        echo "User ID: {$user['id']}\n";
        echo "Email: {$user['email']}\n";
        echo "Role: {$user['role_name']}\n";
    }
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
