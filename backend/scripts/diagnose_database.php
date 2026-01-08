<?php
/**
 * Database Diagnostic Script
 * Checks database connection and verifies all required tables exist
 */

require_once __DIR__ . '/../src/Config.php';
require_once __DIR__ . '/../src/Database.php';

echo "=== DATABASE DIAGNOSTIC REPORT ===\n\n";

// 1. Check Database Connection
echo "1. DATABASE CONNECTION\n";
echo str_repeat("-", 50) . "\n";

try {
    $db = Database::conn();
    echo "✓ Database connection: SUCCESS\n";
    
    $dbConfig = Config::getDatabaseConfig();
    echo "  Host: " . $dbConfig['host'] . "\n";
    echo "  Database: " . $dbConfig['database'] . "\n";
    echo "  User: " . $dbConfig['username'] . "\n";
    
} catch (Exception $e) {
    echo "✗ Database connection: FAILED\n";
    echo "  Error: " . $e->getMessage() . "\n";
    exit(1);
}

echo "\n";

// 2. List All Tables
echo "2. EXISTING TABLES\n";
echo str_repeat("-", 50) . "\n";

try {
    $stmt = $db->query("SHOW TABLES");
    $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);
    
    echo "Found " . count($tables) . " tables:\n";
    foreach ($tables as $table) {
        echo "  - $table\n";
    }
} catch (Exception $e) {
    echo "✗ Error listing tables: " . $e->getMessage() . "\n";
}

echo "\n";

// 3. Check Required Tables
echo "3. REQUIRED TABLES CHECK\n";
echo str_repeat("-", 50) . "\n";

$requiredTables = [
    'users',
    'workspaces',
    'contacts',
    'leads',
    'deals',
    'tasks',
    'appointments',
    'files',
    'folders',
    'messages',
    'conversations',
    'campaigns',
    'templates',
    'automations',
    'workflows',
    'invoices',
    'payments',
    'proposals',
    'tickets',
    'knowledge_base',
    'forms',
    'surveys',
    'reviews',
    'analytics',
    'integrations',
    'webhooks',
    'api_keys',
    'audit_logs',
    'notifications',
    'settings',
    'roles',
    'permissions',
    'call_logs',
    'sms_logs',
    'email_logs',
    'tags',
    'custom_fields',
    'pipelines',
    'stages'
];

$missingTables = [];
$existingTables = [];

foreach ($requiredTables as $table) {
    if (in_array($table, $tables)) {
        echo "✓ $table\n";
        $existingTables[] = $table;
    } else {
        echo "✗ $table (MISSING)\n";
        $missingTables[] = $table;
    }
}

echo "\n";

// 4. Check Table Structures for Key Tables
echo "4. KEY TABLE STRUCTURES\n";
echo str_repeat("-", 50) . "\n";

$keyTables = ['users', 'contacts', 'files', 'folders', 'workspaces'];

foreach ($keyTables as $table) {
    if (in_array($table, $tables)) {
        echo "\nTable: $table\n";
        try {
            $stmt = $db->query("DESCRIBE $table");
            $columns = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            foreach ($columns as $col) {
                echo "  - {$col['Field']} ({$col['Type']}) {$col['Null']} {$col['Key']}\n";
            }
            
            // Get row count
            $countStmt = $db->query("SELECT COUNT(*) as count FROM $table");
            $count = $countStmt->fetch()['count'];
            echo "  Total rows: $count\n";
            
        } catch (Exception $e) {
            echo "  Error: " . $e->getMessage() . "\n";
        }
    }
}

echo "\n";

// 5. Check Foreign Key Relationships
echo "5. FOREIGN KEY CONSTRAINTS\n";
echo str_repeat("-", 50) . "\n";

try {
    $stmt = $db->query("
        SELECT 
            TABLE_NAME,
            COLUMN_NAME,
            CONSTRAINT_NAME,
            REFERENCED_TABLE_NAME,
            REFERENCED_COLUMN_NAME
        FROM
            INFORMATION_SCHEMA.KEY_COLUMN_USAGE
        WHERE
            REFERENCED_TABLE_SCHEMA = DATABASE()
            AND REFERENCED_TABLE_NAME IS NOT NULL
        ORDER BY TABLE_NAME, COLUMN_NAME
    ");
    
    $constraints = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    if (count($constraints) > 0) {
        foreach ($constraints as $constraint) {
            echo "  {$constraint['TABLE_NAME']}.{$constraint['COLUMN_NAME']} -> ";
            echo "{$constraint['REFERENCED_TABLE_NAME']}.{$constraint['REFERENCED_COLUMN_NAME']}\n";
        }
    } else {
        echo "  No foreign key constraints found\n";
    }
    
} catch (Exception $e) {
    echo "  Error: " . $e->getMessage() . "\n";
}

echo "\n";

// 6. Summary
echo "6. SUMMARY\n";
echo str_repeat("-", 50) . "\n";
echo "Total tables found: " . count($tables) . "\n";
echo "Required tables existing: " . count($existingTables) . "\n";
echo "Missing tables: " . count($missingTables) . "\n";

if (count($missingTables) > 0) {
    echo "\nMissing tables:\n";
    foreach ($missingTables as $table) {
        echo "  - $table\n";
    }
}

echo "\n";

// 7. Test Basic Queries
echo "7. BASIC QUERY TESTS\n";
echo str_repeat("-", 50) . "\n";

// Test users table
if (in_array('users', $tables)) {
    try {
        $stmt = $db->query("SELECT id, email, role FROM users LIMIT 1");
        $user = $stmt->fetch();
        if ($user) {
            echo "✓ Users table query: SUCCESS\n";
            echo "  Sample user: {$user['email']} (Role: {$user['role']})\n";
        } else {
            echo "⚠ Users table is empty\n";
        }
    } catch (Exception $e) {
        echo "✗ Users table query: FAILED - " . $e->getMessage() . "\n";
    }
}

// Test files table
if (in_array('files', $tables)) {
    try {
        $stmt = $db->query("SELECT id, filename, folder_id FROM files LIMIT 1");
        $file = $stmt->fetch();
        if ($file) {
            echo "✓ Files table query: SUCCESS\n";
            echo "  Sample file: {$file['filename']}\n";
        } else {
            echo "⚠ Files table is empty\n";
        }
    } catch (Exception $e) {
        echo "✗ Files table query: FAILED - " . $e->getMessage() . "\n";
    }
}

// Test folders table
if (in_array('folders', $tables)) {
    try {
        $stmt = $db->query("SELECT id, name FROM folders LIMIT 1");
        $folder = $stmt->fetch();
        if ($folder) {
            echo "✓ Folders table query: SUCCESS\n";
            echo "  Sample folder: {$folder['name']}\n";
        } else {
            echo "⚠ Folders table is empty\n";
        }
    } catch (Exception $e) {
        echo "✗ Folders table query: FAILED - " . $e->getMessage() . "\n";
    }
}

echo "\n=== END OF DIAGNOSTIC REPORT ===\n";
