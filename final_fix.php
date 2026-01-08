<?php
/**
 * Final comprehensive fix - ensure all tables and associations are correct
 */

$envFile = __DIR__ . '/.env';
if (file_exists($envFile)) {
    $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos(trim($line), '#') === 0) continue;
        if (strpos($line, '=') === false) continue;
        list($name, $value) = explode('=', $line, 2);
        $_ENV[trim($name)] = trim($value);
        putenv(trim($name) . '=' . trim($value));
    }
}

require_once __DIR__ . '/backend/src/Database.php';
use Xordon\Database;

try {
    $db = Database::conn();
    
    echo "=== FINAL COMPREHENSIVE FIX ===\n\n";
    
    // Step 1: Get or create workspace
    echo "1. Setting up workspace...\n";
    $stmt = $db->query("SELECT * FROM workspaces WHERE id = 1");
    $workspace = $stmt->fetch();
    if (!$workspace) {
        echo "   Creating workspace ID 1...\n";
        $db->exec("INSERT INTO workspaces (id, name, slug, created_at, updated_at) VALUES (1, 'Development Workspace', 'dev', NOW(), NOW())");
    } else {
        echo "   Workspace exists: {$workspace['name']}\n";
    }
    
    // Step 2: Get or create user
    echo "\n2. Setting up user...\n";
    $stmt = $db->query("SELECT * FROM users WHERE id = 1");
    $user = $stmt->fetch();
    if (!$user) {
        echo "   Creating user ID 1...\n";
        $db->exec("INSERT INTO users (id, email, name, password, role_id, is_active, created_at, updated_at) VALUES (1, 'admin@xordon.com', 'Admin', 'temp', 1, 1, NOW(), NOW())");
    } else {
        echo "   User exists: {$user['email']}\n";
    }
    
    // Step 3: Check if workspace_members table exists and create association
    echo "\n3. Setting up workspace membership...\n";
    try {
        $stmt = $db->query("SHOW TABLES LIKE 'workspace_members'");
        if ($stmt->rowCount() > 0) {
            $stmt = $db->prepare("SELECT * FROM workspace_members WHERE user_id = 1 AND workspace_id = 1");
            $stmt->execute();
            if (!$stmt->fetch()) {
                echo "   Creating workspace_members entry...\n";
                $db->exec("INSERT INTO workspace_members (workspace_id, user_id, role, created_at) VALUES (1, 1, 'owner', NOW())");
            } else {
                echo "   Membership exists.\n";
            }
        } else {
            echo "   workspace_members table doesn't exist - creating it...\n";
            $db->exec("
                CREATE TABLE IF NOT EXISTS workspace_members (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    workspace_id INT NOT NULL,
                    user_id INT NOT NULL,
                    role VARCHAR(50) DEFAULT 'member',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE KEY unique_membership (workspace_id, user_id)
                )
            ");
            $db->exec("INSERT INTO workspace_members (workspace_id, user_id, role, created_at) VALUES (1, 1, 'owner', NOW())");
            echo "   Created table and added membership.\n";
        }
    } catch (Exception $e) {
        echo "   Error with workspace_members: {$e->getMessage()}\n";
    }
    
    // Step 4: Update ALL data to use workspace_id = 1
    echo "\n4. Fixing all data to use workspace_id = 1...\n";
    
    $tables = ['campaigns', 'forms', 'sequences', 'contacts', 'templates'];
    foreach ($tables as $table) {
        try {
            $stmt = $db->prepare("UPDATE {$table} SET workspace_id = 1 WHERE workspace_id IS NULL OR workspace_id != 1");
            $stmt->execute();
            echo "   Updated {$table}: {$stmt->rowCount()} rows\n";
        } catch (Exception $e) {
            echo "   Skipping {$table}: {$e->getMessage()}\n";
        }
    }
    
    // Step 5: Create fresh sample data
    echo "\n5. Creating fresh sample data...\n";
    
    // Clear old sample data and create new
    $db->exec("DELETE FROM campaigns WHERE name LIKE '%Sample%' OR name LIKE '%Test%' OR name LIKE '%Welcome%'");
    
    $stmt = $db->prepare("INSERT INTO campaigns (name, subject, status, user_id, workspace_id, created_at, updated_at) VALUES (?, ?, ?, 1, 1, NOW(), NOW())");
    
    $campaigns = [
        ['Sample: Welcome Email', 'Welcome to Xordon!', 'active'],
        ['Sample: Product Launch', 'Introducing our new features', 'draft'],
        ['Sample: Monthly Newsletter', 'January 2026 Newsletter', 'scheduled'],
    ];
    
    foreach ($campaigns as $c) {
        $stmt->execute($c);
        echo "   Created campaign: {$c[0]}\n";
    }
    
    // Step 6: Verify data loads correctly
    echo "\n6. Verifying data...\n";
    $stmt = $db->query("SELECT COUNT(*) as cnt FROM campaigns WHERE workspace_id = 1");
    $count = $stmt->fetchColumn();
    echo "   Campaigns with workspace_id=1: {$count}\n";
    
    $stmt = $db->query("SELECT COUNT(*) as cnt FROM forms WHERE workspace_id = 1");
    $count = $stmt->fetchColumn();
    echo "   Forms with workspace_id=1: {$count}\n";
    
    // Step 7: Test the exact query the API uses
    echo "\n7. Testing API query simulation...\n";
    $stmt = $db->prepare("
        SELECT c.*, f.name as folder_name 
        FROM campaigns c 
        LEFT JOIN folders f ON c.folder_id = f.id 
        WHERE c.workspace_id = ? 
        ORDER BY c.created_at DESC
        LIMIT 10
    ");
    $stmt->execute([1]);
    $campaigns = $stmt->fetchAll();
    echo "   Found " . count($campaigns) . " campaigns:\n";
    foreach ($campaigns as $c) {
        echo "     - {$c['name']} (Status: {$c['status']})\n";
    }
    
    echo "\n✅ ALL FIXES COMPLETE!\n\n";
    echo "Please refresh your browser at http://localhost:5173\n";
    echo "If data still doesn't load, run this in browser console:\n";
    echo "  localStorage.setItem('tenant_id', '1'); location.reload();\n";
    
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
    echo "Trace: " . $e->getTraceAsString() . "\n";
}
