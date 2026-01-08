<?php
require __DIR__ . '/backend/src/bootstrap.php';
require __DIR__ . '/backend/src/controllers/SegmentsController.php';

// Mock Auth and TenantContext
class MockTenantContext {
    public $workspaceId = 1;
}
$GLOBALS['tenantContext'] = new MockTenantContext();

// Mock Auth::userIdOrFail
class MockAuth {
    public static function userIdOrFail() { return 1; }
    public static function userId() { return 1; }
    public static function user() { return ['id' => 1]; }
}
// We can't easily mock static class Auth unless we use runkit or similar, which is unlikely available.
// But Auth is already required in bootstrap. 
// We might need to login or mock the session if Auth uses session.
// However, SegmentsController uses `Auth::userIdOrFail()`.

// Let's try to just instantiate the controller logic manually or use the actual Auth if possible.
// If Auth relies on session/headers, we might fail authentication.

// Plan B: Copy the create method logic and run it in a script.

$userId = 1;
$data = [
    'name' => 'Test Segment ' . time(),
    'filterCriteria' => [['id' => '1', 'field' => 'email', 'operator' => 'contains', 'value' => '@example.com']],
    'matchType' => 'all',
    'isActive' => true
];

$pdo = Database::conn();

// Logic from SegmentsController::create
// $scope = SegmentsController::getWorkspaceScope(); // Private method, copy logic
$scope = ['col' => 'workspace_id', 'val' => 1];

echo "Checking duplicate...\n";
$checkStmt = $pdo->prepare("SELECT id FROM segments WHERE {$scope['col']} = ? AND name = ?");
$checkStmt->execute([$scope['val'], $data['name']]);
if ($checkStmt->fetch()) {
    die("Duplicate");
}

echo "Preparing insert...\n";
$insertColumns = ['user_id', 'name', 'description', 'color', 'icon', 'filter_criteria', 'match_type', 'is_active', 'created_at', 'updated_at'];
$insertValues = [
    $userId,
    $data['name'],
    $data['description'] ?? null,
    $data['color'] ?? '#8b5cf6',
    $data['icon'] ?? 'filter',
    json_encode($data['filterCriteria']),
    $data['matchType'] ?? 'all',
    $data['isActive'] ?? true
];

if ($scope['col'] === 'workspace_id') {
    $insertColumns[] = 'workspace_id';
    $insertValues[] = $scope['val'];
}

$colString = implode(', ', $insertColumns);
$valString = implode(', ', array_fill(0, count($insertValues), '?'));

$sql = "INSERT INTO segments ($colString) VALUES ($valString)";
echo "SQL: $sql\n";

try {
    $stmt = $pdo->prepare($sql);
    $result = $stmt->execute($insertValues);
    echo "Result: " . ($result ? "Success" : "Failure") . "\n";
    if ($result) {
        echo "ID: " . $pdo->lastInsertId() . "\n";
    } else {
        print_r($stmt->errorInfo());
    }
} catch (Exception $e) {
    echo "Exception: " . $e->getMessage() . "\n";
}
