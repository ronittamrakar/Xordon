<?php
require __DIR__ . '/backend/src/bootstrap.php';
require __DIR__ . '/backend/src/controllers/ListsController.php';

// Mock Auth and TenantContext
class MockTenantContext {
    public $workspaceId = 1;
}
$GLOBALS['tenantContext'] = new MockTenantContext();

class MockAuth {
    public static function userIdOrFail() { return 1; }
}

$userId = 1;
$data = [
    'name' => 'Test Folder ' . time(),
    'isFolder' => true,
    'color' => '#facc15',
    'icon' => 'folder'
];

$pdo = Database::conn();

$ctx = $GLOBALS['tenantContext'];
$workspaceId = $ctx->workspaceId;

echo "Creating folder...\n";
$stmt = $pdo->prepare("
    INSERT INTO contact_lists (user_id, workspace_id, name, description, color, icon, is_default, parent_id, is_folder, campaign_type, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
");

$result = $stmt->execute([
    1, // user_id
    $workspaceId,
    $data['name'],
    null,
    $data['color'],
    $data['icon'],
    0,
    null,
    1,
    'email'
]);

if ($result) {
    echo "Success! ID: " . $pdo->lastInsertId() . "\n";
} else {
    echo "Failure\n";
    print_r($stmt->errorInfo());
}
