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

switch ($method) {
    case 'GET':
        // Get all ad accounts for workspace
        $stmt = $db->prepare("
            SELECT id, platform, account_id, account_name, status, 
                   access_token_expires_at, created_at, updated_at
            FROM ad_accounts 
            WHERE workspace_id = ? 
            ORDER BY created_at DESC
        ");
        $stmt->execute([$workspaceId]);
        $accounts = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Format dates and remove sensitive data
        foreach ($accounts as &$account) {
            unset($account['access_token']);
            unset($account['refresh_token']);
        }
        
        echo json_encode($accounts);
        break;

    case 'POST':
        // Connect a new ad account (initiated by OAuth callback)
        $data = json_decode(file_get_contents('php://input'), true);
        
        $platform = $data['platform'] ?? null;
        $accountId = $data['account_id'] ?? null;
        $accountName = $data['account_name'] ?? null;
        $accessToken = $data['access_token'] ?? null;
        $refreshToken = $data['refresh_token'] ?? null;
        $expiresAt = $data['expires_at'] ?? null;
        
        if (!$platform || !$accountId || !$accessToken) {
            http_response_code(400);
            echo json_encode(['error' => 'Missing required fields']);
            exit;
        }
        
        // Check if account already exists
        $stmt = $db->prepare("
            SELECT id FROM ad_accounts 
            WHERE workspace_id = ? AND platform = ? AND account_id = ?
        ");
        $stmt->execute([$workspaceId, $platform, $accountId]);
        $existing = $stmt->fetch();
        
        if ($existing) {
            // Update existing account
            $stmt = $db->prepare("
                UPDATE ad_accounts 
                SET account_name = ?, access_token = ?, refresh_token = ?, 
                    access_token_expires_at = ?, status = 'active', updated_at = NOW()
                WHERE id = ?
            ");
            $stmt->execute([
                $accountName,
                $accessToken,
                $refreshToken,
                $expiresAt,
                $existing['id']
            ]);
            
            echo json_encode([
                'id' => $existing['id'],
                'message' => 'Account reconnected successfully'
            ]);
        } else {
            // Create new account
            $stmt = $db->prepare("
                INSERT INTO ad_accounts 
                (workspace_id, platform, account_id, account_name, access_token, 
                 refresh_token, access_token_expires_at, status, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, 'active', NOW(), NOW())
            ");
            $stmt->execute([
                $workspaceId,
                $platform,
                $accountId,
                $accountName,
                $accessToken,
                $refreshToken,
                $expiresAt
            ]);
            
            echo json_encode([
                'id' => $db->lastInsertId(),
                'message' => 'Account connected successfully'
            ]);
        }
        break;

    case 'DELETE':
        // Disconnect an ad account
        $pathParts = explode('/', trim($_SERVER['REQUEST_URI'], '/'));
        $accountId = end($pathParts);
        
        if (!is_numeric($accountId)) {
            http_response_code(400);
            echo json_encode(['error' => 'Invalid account ID']);
            exit;
        }
        
        $stmt = $db->prepare("
            UPDATE ad_accounts 
            SET status = 'disconnected', updated_at = NOW()
            WHERE id = ? AND workspace_id = ?
        ");
        $stmt->execute([$accountId, $workspaceId]);
        
        echo json_encode(['message' => 'Account disconnected']);
        break;

    default:
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
}
