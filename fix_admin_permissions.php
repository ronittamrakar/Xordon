<?php
/**
 * Fix Admin Permissions
 * This script ensures user ID 1 has the Admin role with all permissions
 */

require_once __DIR__ . '/backend/src/Database.php';
require_once __DIR__ . '/backend/src/bootstrap.php';

try {
    $pdo = Database::conn();
    
    echo "=== Fixing Admin Permissions ===\n\n";
    
    // Step 1: Check if Admin role exists
    echo "1. Checking for Admin role...\n";
    $stmt = $pdo->query("SELECT id, name FROM roles WHERE LOWER(name) = 'admin' LIMIT 1");
    $adminRole = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$adminRole) {
        echo "   ❌ Admin role not found. Creating...\n";
        $stmt = $pdo->prepare("INSERT INTO roles (name, description, is_system, created_at, updated_at) VALUES ('Admin', 'Full system access', 1, NOW(), NOW())");
        $stmt->execute();
        $adminRoleId = $pdo->lastInsertId();
        echo "   ✅ Admin role created with ID: $adminRoleId\n";
    } else {
        $adminRoleId = $adminRole['id'];
        echo "   ✅ Admin role found with ID: $adminRoleId\n";
    }
    
    // Step 2: Assign ALL permissions to Admin role
    echo "\n2. Assigning all permissions to Admin role...\n";
    
    // First, remove existing permissions for admin role
    $stmt = $pdo->prepare("DELETE FROM role_permissions WHERE role_id = ?");
    $stmt->execute([$adminRoleId]);
    
    // Get all permissions
    $stmt = $pdo->query("SELECT id, `key`, name FROM permissions");
    $permissions = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    if (empty($permissions)) {
        echo "   ⚠️  No permissions found in database. You may need to run migrations.\n";
    } else {
        // Assign all permissions to admin role
        $stmt = $pdo->prepare("INSERT INTO role_permissions (role_id, permission_id, created_at) VALUES (?, ?, NOW())");
        foreach ($permissions as $permission) {
            $stmt->execute([$adminRoleId, $permission['id']]);
        }
        echo "   ✅ Assigned " . count($permissions) . " permissions to Admin role\n";
    }
    
    // Step 3: Ensure all users have the Admin role (for development)
    echo "\n3. Assigning Admin role to all users...\n";
    
    // Get all users
    $stmt = $pdo->query("SELECT id, email, name, role_id FROM users ORDER BY id");
    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    if (empty($users)) {
        echo "   ❌ No users found in database\n";
    } else {
        $updated = 0;
        foreach ($users as $user) {
            if ($user['role_id'] != $adminRoleId) {
                $stmt = $pdo->prepare("UPDATE users SET role_id = ? WHERE id = ?");
                $stmt->execute([$adminRoleId, $user['id']]);
                echo "   ✅ Assigned Admin role to: {$user['email']}\n";
                $updated++;
            } else {
                echo "   ✓ {$user['email']} already has Admin role\n";
            }
        }
        if ($updated > 0) {
            echo "   ✅ Updated $updated user(s)\n";
        }
    }
    
    // Step 4: Verify the fix
    echo "\n4. Verifying permissions...\n";
    
    // Get first admin user
    $stmt = $pdo->prepare("
        SELECT u.id, u.email, COUNT(rp.permission_id) as perm_count
        FROM users u
        INNER JOIN roles r ON u.role_id = r.id
        LEFT JOIN role_permissions rp ON r.id = rp.role_id
        WHERE LOWER(r.name) = 'admin'
        GROUP BY u.id, u.email
        LIMIT 1
    ");
    $stmt->execute();
    $adminUser = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($adminUser) {
        echo "   Admin user: {$adminUser['email']} (ID: {$adminUser['id']})\n";
        echo "   Has {$adminUser['perm_count']} permissions\n";
        
        // Show some example permissions
        $stmt = $pdo->prepare("
            SELECT p.`key`, p.name
            FROM permissions p
            INNER JOIN role_permissions rp ON p.id = rp.permission_id
            INNER JOIN users u ON u.role_id = rp.role_id
            WHERE u.id = ?
            LIMIT 10
        ");
        $stmt->execute([$adminUser['id']]);
        $samplePerms = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        if (!empty($samplePerms)) {
            echo "\n   Sample permissions:\n";
            foreach ($samplePerms as $perm) {
                echo "   - {$perm['key']}: {$perm['name']}\n";
            }
        }
    } else {
        echo "   ⚠️  No admin users found\n";
    }
    
    echo "\n=== ✅ Fix Complete ===\n";
    echo "\nYou should now be able to access all pages without 403 errors.\n";
    echo "Please refresh your browser and try again.\n\n";
    
} catch (Exception $e) {
    echo "\n❌ Error: " . $e->getMessage() . "\n";
    echo "Stack trace:\n" . $e->getTraceAsString() . "\n";
    exit(1);
}
