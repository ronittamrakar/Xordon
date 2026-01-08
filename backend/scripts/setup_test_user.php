<?php
require_once __DIR__ . '/../src/Database.php';

$pdo = Database::conn();

// Check users table structure
echo "Checking users table structure...\n";
$stmt = $pdo->query("DESCRIBE users");
$columns = $stmt->fetchAll(PDO::FETCH_COLUMN);
echo "Columns: " . implode(", ", $columns) . "\n\n";

// Check if user 1 exists
$stmt = $pdo->query("SELECT * FROM users WHERE id = 1");
$user = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$user) {
    echo "Creating test user 1...\n";
    // Use only columns that exist
    $pdo->exec("INSERT INTO users (id, email, name, created_at) VALUES (1, 'test@example.com', 'Test User', NOW())");
    echo "User created.\n";
} else {
    echo "User 1 exists: {$user['email']}\n";
}

// Now add to workspace
$stmt = $pdo->query("SELECT id FROM workspace_members WHERE workspace_id = 1 AND user_id = 1");
if ($stmt->rowCount() === 0) {
    echo "Adding user 1 to workspace 1...\n";
    $pdo->exec("INSERT INTO workspace_members (workspace_id, user_id, role) VALUES (1, 1, 'owner')");
    echo "Added.\n";
} else {
    echo "User 1 already in workspace 1.\n";
}

// Verify
$stmt = $pdo->query("SELECT w.id as wid, w.name, wm.user_id, wm.role FROM workspaces w LEFT JOIN workspace_members wm ON w.id = wm.workspace_id WHERE w.id = 1");
$row = $stmt->fetch(PDO::FETCH_ASSOC);
if ($row) {
    echo "\nWorkspace {$row['wid']} ({$row['name']}): User {$row['user_id']} as {$row['role']}\n";
}
