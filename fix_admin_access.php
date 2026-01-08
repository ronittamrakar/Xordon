<?php
// Check and Fix Admin Access
require_once __DIR__ . '/backend/src/Database.php';
require_once __DIR__ . '/backend/src/services/RBACService.php';

try {
    $pdo = \Xordon\Database::conn();
    
    echo "=== CHECKING ADMIN ACCESS ===\n\n";
    
    // Check user 1
    $stmt = $pdo->query("SELECT u.id, u.email, u.role_id, r.name as role_name 
                         FROM users u 
                         LEFT JOIN roles r ON u.role_id = r.id 
                         WHERE u.id = 1");
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($user) {
        echo "User ID: " . $user['id'] . "\n";
        echo "Email: " . $user['email'] . "\n";
        echo "Role ID: " . ($user['role_id'] ?? 'NULL') . "\n";
        echo "Role Name: " . ($user['role_name'] ?? 'NULL') . "\n\n";
        
        // Check via RBACService
        $rbac = RBACService::getInstance();
        $isAdmin = $rbac->isAdmin(1);
        echo "Is Admin (via RBAC): " . ($isAdmin ? 'YES ✅' : 'NO ❌') . "\n\n";
        
        if (!$isAdmin) {
            echo "⚠️ USER IS NOT ADMIN! Checking roles...\n\n";
            
            // Find admin role
            $stmt = $pdo->query("SELECT id, name FROM roles WHERE name LIKE '%admin%' OR name LIKE '%Admin%'");
            $adminRoles = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            if (!empty($adminRoles)) {
                $adminRoleId = $adminRoles[0]['id'];
                echo "Found admin role: ID={$adminRoleId}, Name={$adminRoles[0]['name']}\n";
                echo "Assigning to user 1...\n";
                
                $stmt = $pdo->prepare("UPDATE users SET role_id = ? WHERE id = 1");
                $stmt->execute([$adminRoleId]);
                
                echo "✅ User 1 now has admin role!\n\n";
            } else {
                echo "❌ No admin role found! Creating one...\n";
                $pdo->exec("INSERT INTO roles (name, description) VALUES ('Admin', 'System Administrator')");
                $adminRoleId = $pdo->lastInsertId();
                
                $stmt = $pdo->prepare("UPDATE users SET role_id = ? WHERE id = 1");
                $stmt->execute([$adminRoleId]);
                
                echo "✅ Created admin role and assigned to user 1!\n\n";
            }
        } else {
            echo "✅ User already has admin access\n\n";
        }
    } else {
        echo "❌ User ID 1 not found!\n\n";
    }
    
    // List all roles
    echo "=== ALL ROLES ===\n";
    $stmt = $pdo->query("SELECT id, name, description FROM roles");
    $roles = $stmt->fetchAll(PDO::FETCH_ASSOC);
    foreach ($roles as $role) {
        echo "- ID: {$role['id']}, Name: {$role['name']}, Desc: " . ($role['description'] ?? 'N/A') . "\n";
    }
    
    echo "\n=== VERIFICATION ===\n";
    $rbac = RBACService::getInstance();
    $isAdmin = $rbac->isAdmin(1);
    echo "User 1 is admin: " . ($isAdmin ? 'YES ✅' : 'NO ❌') . "\n";
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
    echo "Trace: " . $e->getTraceAsString() . "\n";
}
