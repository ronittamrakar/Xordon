<?php
require_once __DIR__ . '/../src/Database.php';

$pdo = Database::conn();

// Create a test token for user 1
$token = 'test-automation-token-' . bin2hex(random_bytes(16));

// Check if auth_tokens table exists
$stmt = $pdo->query("SHOW TABLES LIKE 'auth_tokens'");
if ($stmt->rowCount() === 0) {
    echo "Creating auth_tokens table...\n";
    $pdo->exec("CREATE TABLE auth_tokens (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        token VARCHAR(255) NOT NULL UNIQUE,
        expires_at DATETIME NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )");
}

// Insert test token (no expiration)
$stmt = $pdo->prepare("INSERT INTO auth_tokens (user_id, token, expires_at) VALUES (?, ?, NULL)");
$stmt->execute([1, $token]);

echo "Test token created: $token\n";
echo "\nUse this in your requests:\n";
echo "Authorization: Bearer $token\n";
