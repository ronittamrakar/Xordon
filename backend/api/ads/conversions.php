<?php
require_once __DIR__ . '/../../src/auth_check.php';
require_once __DIR__ . '/../../src/db.php';

header('Content-Type: application/json');

$method = $_SERVER['REQUEST_METHOD'];
$db = getDbConnection();
$userId = $_SESSION['user_id'];
$workspaceId = $_SESSION['workspace_id'] ?? null;

if (!$workspaceId) {
    http_response_code(400);
    echo json_encode(['error' => 'No workspace selected']);
    exit;
}

if ($method !== 'GET') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

// Get conversions
$stmt = $db->prepare("
    SELECT c.*, camp.name as campaign_name, camp.platform, a.account_name
    FROM ad_conversions c
    JOIN ad_campaigns camp ON c.campaign_id = camp.id
    JOIN ad_accounts a ON camp.account_id = a.id
    WHERE a.workspace_id = ?
    ORDER BY c.converted_at DESC
    LIMIT 100
");
$stmt->execute([$workspaceId]);
$conversions = $stmt->fetchAll(PDO::FETCH_ASSOC);

// Format numeric values
foreach ($conversions as &$conversion) {
    $conversion['value'] = (float) ($conversion['value'] ?? 0);
}

echo json_encode($conversions);
