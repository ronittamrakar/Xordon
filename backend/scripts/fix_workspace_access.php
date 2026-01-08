<?php
require_once __DIR__ . '/../src/Database.php';

$pdo = Database::conn();

// Find existing users
echo "Existing users:\n";
$stmt = $pdo->query("SELECT id, email, name FROM users LIMIT 5");
$users = $stmt->fetchAll(PDO::FETCH_ASSOC);
foreach ($users as $u) {
    echo "  - ID {$u['id']}: {$u['email']} ({$u['name']})\n";
}

// Get first user ID
$firstUserId = $users[0]['id'] ?? null;
if (!$firstUserId) {
    echo "No users found!\n";
    exit(1);
}

echo "\nUsing user ID: $firstUserId\n";

// Check workspace membership
$stmt = $pdo->prepare("SELECT * FROM workspace_members WHERE user_id = ?");
$stmt->execute([$firstUserId]);
$membership = $stmt->fetch(PDO::FETCH_ASSOC);

if ($membership) {
    echo "User $firstUserId is already in workspace {$membership['workspace_id']} as {$membership['role']}\n";
} else {
    // Add to workspace 1
    echo "Adding user $firstUserId to workspace 1...\n";
    $stmt = $pdo->prepare("INSERT INTO workspace_members (workspace_id, user_id, role) VALUES (1, ?, 'owner')");
    $stmt->execute([$firstUserId]);
    echo "Done.\n";
}

// Update auth token to point to correct user
echo "\nUpdating auth token to user $firstUserId...\n";
$pdo->exec("UPDATE auth_tokens SET user_id = $firstUserId WHERE token LIKE 'test-automation-token%'");

// Verify
$stmt = $pdo->query("SELECT t.token, t.user_id, u.email FROM auth_tokens t JOIN users u ON t.user_id = u.id WHERE t.token LIKE 'test-automation-token%'");
$token = $stmt->fetch(PDO::FETCH_ASSOC);
if ($token) {
    echo "Token now points to user {$token['user_id']} ({$token['email']})\n";
}

echo "\nDone!\n";
