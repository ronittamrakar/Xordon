<?php
/**
 * Debug API call simulation
 */

// Load .env
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

$db = Database::conn();

echo "=== DATABASE STATUS ===\n\n";

// Check what's in workspaces
echo "1. WORKSPACES:\n";
$stmt = $db->query("SELECT id, name, slug FROM workspaces LIMIT 5");
while ($row = $stmt->fetch()) {
    echo "   ID: {$row['id']}, Name: {$row['name']}, Slug: {$row['slug']}\n";
}

// Check what's in campaigns with their workspace_id
echo "\n2. CAMPAIGNS (with workspace_id):\n";
$stmt = $db->query("SELECT id, name, status, workspace_id, user_id FROM campaigns ORDER BY id DESC LIMIT 10");
while ($row = $stmt->fetch()) {
    echo "   ID: {$row['id']}, Name: {$row['name']}, Status: {$row['status']}, WS: {$row['workspace_id']}, User: {$row['user_id']}\n";
}

// Check what's in forms
echo "\n3. FORMS (with workspace_id):\n";
$stmt = $db->query("SELECT id, name, status, workspace_id, user_id FROM forms ORDER BY id DESC LIMIT 10");
while ($row = $stmt->fetch()) {
    echo "   ID: {$row['id']}, Name: {$row['name']}, Status: {$row['status']}, WS: {$row['workspace_id']}, User: {$row['user_id']}\n";
}

// Check what's in sequences
echo "\n4. SEQUENCES (with workspace_id):\n";
$stmt = $db->query("SELECT id, name, status, workspace_id, user_id FROM sequences ORDER BY id DESC LIMIT 10");
while ($row = $stmt->fetch()) {
    echo "   ID: {$row['id']}, Name: {$row['name']}, Status: {$row['status']}, WS: {$row['workspace_id']}, User: {$row['user_id']}\n";
}

// Now test the actual query that CampaignsController uses
echo "\n5. SIMULATING CampaignsController::index() with workspace_id=1:\n";
$stmt = $db->prepare("
    SELECT c.*, f.name as folder_name 
    FROM campaigns c 
    LEFT JOIN folders f ON c.folder_id = f.id 
    WHERE c.workspace_id = ? 
    ORDER BY c.created_at DESC
");
$stmt->execute([1]);
$rows = $stmt->fetchAll();
echo "   Found " . count($rows) . " campaigns\n";
foreach ($rows as $row) {
    echo "   - {$row['name']} (Status: {$row['status']})\n";
}

// Also test without workspace filter
echo "\n6. ALL CAMPAIGNS (no filter):\n";
$stmt = $db->query("SELECT id, name, workspace_id FROM campaigns ORDER BY id DESC LIMIT 10");
while ($row = $stmt->fetch()) {
    echo "   ID: {$row['id']}, Name: {$row['name']}, WS: " . ($row['workspace_id'] ?? 'NULL') . "\n";
}
