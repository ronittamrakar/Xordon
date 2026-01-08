<?php
require_once __DIR__ . '/../src/Database.php';

$pdo = Database::conn();

// Check if workspaces table exists
$stmt = $pdo->query("SHOW TABLES LIKE 'workspaces'");
if ($stmt->rowCount() === 0) {
    echo "Creating workspaces table...\n";
    $pdo->exec("CREATE TABLE workspaces (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        subdomain VARCHAR(100),
        owner_id INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )");
}

// Check if workspace_members table exists
$stmt = $pdo->query("SHOW TABLES LIKE 'workspace_members'");
if ($stmt->rowCount() === 0) {
    echo "Creating workspace_members table...\n";
    $pdo->exec("CREATE TABLE workspace_members (
        id INT AUTO_INCREMENT PRIMARY KEY,
        workspace_id INT NOT NULL,
        user_id INT NOT NULL,
        role VARCHAR(50) DEFAULT 'member',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_member (workspace_id, user_id)
    )");
}

// Create default workspace if not exists
$stmt = $pdo->query("SELECT id FROM workspaces WHERE id = 1");
if ($stmt->rowCount() === 0) {
    echo "Creating default workspace...\n";
    $pdo->exec("INSERT INTO workspaces (id, name, subdomain, owner_id) VALUES (1, 'Default Workspace', 'default', 1)");
}

// Add user 1 as owner of workspace 1
$stmt = $pdo->prepare("SELECT id FROM workspace_members WHERE workspace_id = 1 AND user_id = 1");
$stmt->execute();
if ($stmt->rowCount() === 0) {
    echo "Adding user 1 to workspace 1...\n";
    $pdo->exec("INSERT INTO workspace_members (workspace_id, user_id, role) VALUES (1, 1, 'owner')");
}

echo "Workspace access configured.\n";

// Verify
$stmt = $pdo->query("SELECT w.id, w.name, wm.user_id, wm.role FROM workspaces w LEFT JOIN workspace_members wm ON w.id = wm.workspace_id");
$rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
echo "\nWorkspace configuration:\n";
foreach ($rows as $row) {
    echo "  - Workspace {$row['id']} ({$row['name']}): User {$row['user_id']} as {$row['role']}\n";
}
