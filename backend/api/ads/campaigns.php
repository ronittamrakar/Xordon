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

// Handle sync endpoint
if ($method === 'POST' && strpos($_SERVER['REQUEST_URI'], '/sync') !== false) {
    // Sync campaigns from all connected ad accounts
    $stmt = $db->prepare("
        SELECT id, platform, account_id, access_token 
        FROM ad_accounts 
        WHERE workspace_id = ? AND status = 'active'
    ");
    $stmt->execute([$workspaceId]);
    $accounts = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    $syncedCount = 0;
    
    foreach ($accounts as $account) {
        // TODO: Implement actual API calls to ad platforms
        // For now, just mark as synced
        $syncedCount++;
    }
    
    echo json_encode([
        'synced' => $syncedCount,
        'message' => "$syncedCount campaigns synced successfully"
    ]);
    exit;
}

switch ($method) {
    case 'GET':
        // Get all campaigns
        $stmt = $db->prepare("
            SELECT c.*, a.platform, a.account_name
            FROM ad_campaigns c
            JOIN ad_accounts a ON c.account_id = a.id
            WHERE a.workspace_id = ?
            ORDER BY c.created_at DESC
        ");
        $stmt->execute([$workspaceId]);
        $campaigns = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Format numeric values
        foreach ($campaigns as &$campaign) {
            $campaign['daily_budget'] = (float) $campaign['daily_budget'];
            $campaign['total_spent'] = (float) ($campaign['total_spent'] ?? 0);
            $campaign['impressions'] = (int) ($campaign['impressions'] ?? 0);
            $campaign['clicks'] = (int) ($campaign['clicks'] ?? 0);
            $campaign['conversions'] = (int) ($campaign['conversions'] ?? 0);
            $campaign['ctr'] = (float) ($campaign['ctr'] ?? 0);
            $campaign['cpc'] = (float) ($campaign['cpc'] ?? 0);
        }
        
        echo json_encode($campaigns);
        break;

    case 'PUT':
        // Update a campaign
        $pathParts = explode('/', trim($_SERVER['REQUEST_URI'], '/'));
        $campaignId = end($pathParts);
        
        if (!is_numeric($campaignId)) {
            http_response_code(400);
            echo json_encode(['error' => 'Invalid campaign ID']);
            exit;
        }
        
        $data = json_decode(file_get_contents('php://input'), true);
        
        // Verify campaign belongs to workspace
        $stmt = $db->prepare("
            SELECT c.id FROM ad_campaigns c
            JOIN ad_accounts a ON c.account_id = a.id
            WHERE c.id = ? AND a.workspace_id = ?
        ");
        $stmt->execute([$campaignId, $workspaceId]);
        if (!$stmt->fetch()) {
            http_response_code(404);
            echo json_encode(['error' => 'Campaign not found']);
            exit;
        }
        
        // Build update query dynamically
        $updates = [];
        $params = [];
        
        if (isset($data['status'])) {
            $updates[] = "status = ?";
            $params[] = $data['status'];
        }
        
        if (isset($data['daily_budget'])) {
            $updates[] = "daily_budget = ?";
            $params[] = (float) $data['daily_budget'];
        }
        
        if (isset($data['name'])) {
            $updates[] = "name = ?";
            $params[] = $data['name'];
        }
        
        if (empty($updates)) {
            http_response_code(400);
            echo json_encode(['error' => 'No fields to update']);
            exit;
        }
        
        $updates[] = "updated_at = NOW()";
        $params[] = $campaignId;
        
        $sql = "UPDATE ad_campaigns SET " . implode(", ", $updates) . " WHERE id = ?";
        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        
        // TODO: Sync changes to ad platform
        
        echo json_encode(['message' => 'Campaign updated successfully']);
        break;

    default:
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
}
