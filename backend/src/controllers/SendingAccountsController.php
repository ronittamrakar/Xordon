<?php
require_once __DIR__ . '/../Database.php';
require_once __DIR__ . '/../Response.php';
require_once __DIR__ . '/../Auth.php';

class SendingAccountsController {
    private static function getWorkspaceScope(): array {
        $ctx = $GLOBALS['tenantContext'] ?? null;
        if ($ctx && isset($ctx->workspaceId)) {
            return ['col' => 'workspace_id', 'val' => (int)$ctx->workspaceId];
        }
        return ['col' => 'user_id', 'val' => Auth::userIdOrFail()];
    }
    public static function index(): void {
        Auth::userIdOrFail();
        $pdo = Database::conn();
        $scope = self::getWorkspaceScope();
        $stmt = $pdo->prepare("SELECT * FROM sending_accounts WHERE {$scope['col']} = ? ORDER BY created_at DESC");
        $stmt->execute([$scope['val']]);
        $rows = $stmt->fetchAll();
        Response::json(['items' => array_map(fn($a) => self::map($a), $rows)]);
    }
    public static function show(string $id): void {
        Auth::userIdOrFail();
        $pdo = Database::conn();
        $scope = self::getWorkspaceScope();
        $stmt = $pdo->prepare("SELECT * FROM sending_accounts WHERE id = ? AND {$scope['col']} = ?");
        $stmt->execute([$id, $scope['val']]);
        $row = $stmt->fetch();
        if (!$row) Response::error('Not found', 404);
        Response::json(self::map($row));
    }
    public static function create(): void {
        $userId = Auth::userIdOrFail();
        $b = get_json_body();
        $name = trim($b['name'] ?? '');
        $email = trim($b['email'] ?? '');
        $provider = trim($b['provider'] ?? '');
        $status = trim($b['status'] ?? 'active');
        $dailyLimit = (int)($b['daily_limit'] ?? 100);
        $sentToday = (int)($b['sent_today'] ?? 0);
        
        // SMTP credentials
        $smtpHost = trim($b['smtp_host'] ?? '');
        $smtpPort = (int)($b['smtp_port'] ?? 587);
        $smtpUsername = trim($b['smtp_username'] ?? '');
        $smtpPassword = trim($b['smtp_password'] ?? '');
        $smtpEncryption = trim($b['smtp_encryption'] ?? 'tls');
        
        // OAuth tokens
        $accessToken = trim($b['access_token'] ?? '');
        $refreshToken = trim($b['refresh_token'] ?? '');
        $tokenExpiresAt = $b['token_expires_at'] ?? null;
        
        if (!$name || !$email) Response::error('Missing fields', 422);
        
        $pdo = Database::conn();
        $ctx = $GLOBALS['tenantContext'] ?? null;
        $workspaceId = ($ctx && isset($ctx->workspaceId)) ? (int)$ctx->workspaceId : null;
        $stmt = $pdo->prepare('INSERT INTO sending_accounts (user_id, workspace_id, name, email, provider, status, daily_limit, sent_today, smtp_host, smtp_port, smtp_username, smtp_password, smtp_encryption, access_token, refresh_token, token_expires_at, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)');
        $stmt->execute([$userId, $workspaceId, $name, $email, $provider ?: 'smtp', $status, $dailyLimit, $sentToday, $smtpHost, $smtpPort, $smtpUsername, $smtpPassword, $smtpEncryption, $accessToken, $refreshToken, $tokenExpiresAt]);
        $id = (int)$pdo->lastInsertId();
        self::show((string)$id);
    }
    public static function update(string $id): void {
        $userId = Auth::userIdOrFail();
        $b = get_json_body();
        
        // Check if account exists and belongs to user/workspace
        $pdo = Database::conn();
        $scope = self::getWorkspaceScope();
        $stmt = $pdo->prepare("SELECT * FROM sending_accounts WHERE id = ? AND {$scope['col']} = ?");
        $stmt->execute([$id, $scope['val']]);
        $existing = $stmt->fetch();
        
        if (!$existing) {
            Response::error('Account not found', 404);
            return;
        }
        
        // Build update query dynamically
        $updates = [];
        $params = [];
        
        if (isset($b['name'])) {
            $updates[] = 'name = ?';
            $params[] = trim($b['name']);
        }
        if (isset($b['email'])) {
            $updates[] = 'email = ?';
            $params[] = trim($b['email']);
        }
        if (isset($b['provider'])) {
            $updates[] = 'provider = ?';
            $params[] = trim($b['provider']);
        }
        if (isset($b['status'])) {
            $updates[] = 'status = ?';
            $params[] = trim($b['status']);
        }
        if (isset($b['daily_limit'])) {
            $updates[] = 'daily_limit = ?';
            $params[] = (int)$b['daily_limit'];
        }
        if (isset($b['sent_today'])) {
            $updates[] = 'sent_today = ?';
            $params[] = (int)$b['sent_today'];
        }
        if (isset($b['smtp_host'])) {
            $updates[] = 'smtp_host = ?';
            $params[] = trim($b['smtp_host']);
        }
        if (isset($b['smtp_port'])) {
            $updates[] = 'smtp_port = ?';
            $params[] = (int)$b['smtp_port'];
        }
        if (isset($b['smtp_username'])) {
            $updates[] = 'smtp_username = ?';
            $params[] = trim($b['smtp_username']);
        }
        if (isset($b['smtp_password'])) {
            $updates[] = 'smtp_password = ?';
            $params[] = trim($b['smtp_password']);
        }
        if (isset($b['smtp_encryption'])) {
            $updates[] = 'smtp_encryption = ?';
            $params[] = trim($b['smtp_encryption']);
        }
        if (isset($b['access_token'])) {
            $updates[] = 'access_token = ?';
            $params[] = trim($b['access_token']);
        }
        if (isset($b['refresh_token'])) {
            $updates[] = 'refresh_token = ?';
            $params[] = trim($b['refresh_token']);
        }
        if (isset($b['token_expires_at'])) {
            $updates[] = 'token_expires_at = ?';
            $params[] = $b['token_expires_at'];
        }
        
        if (empty($updates)) {
            Response::error('No valid fields to update', 422);
            return;
        }
        
        $params[] = $id;
        $params[] = $scope['val'];
        
        $sql = 'UPDATE sending_accounts SET ' . implode(', ', $updates) . " WHERE id = ? AND {$scope['col']} = ?";
        $stmt = $pdo->prepare($sql);
        $result = $stmt->execute($params);
        
        if (!$result) {
            Response::error('Failed to update account', 500);
            return;
        }
        
        // Return updated account
        self::show($id);
    }
    public static function delete(string $id): void {
        Auth::userIdOrFail();
        $pdo = Database::conn();
        $scope = self::getWorkspaceScope();
        
        // Check if account exists and belongs to user/workspace
        $stmt = $pdo->prepare("SELECT id FROM sending_accounts WHERE id = ? AND {$scope['col']} = ?");
        $stmt->execute([$id, $scope['val']]);
        if (!$stmt->fetch()) {
            Response::error('Account not found', 404);
            return;
        }
        
        // Check if any campaigns are using this sending account
        $stmt = $pdo->prepare('SELECT id, name FROM campaigns WHERE sending_account_id = ?');
        $stmt->execute([$id]);
        $campaigns = $stmt->fetchAll();
        
        if (!empty($campaigns)) {
            $campaignNames = array_map(function($campaign) {
                return $campaign['name'];
            }, $campaigns);
            $campaignList = implode(', ', $campaignNames);
            Response::error("Cannot delete sending account. It is being used by the following campaigns: $campaignList. Please delete or reassign these campaigns first.", 400);
            return;
        }
        
        // Delete the account
        $stmt = $pdo->prepare("DELETE FROM sending_accounts WHERE id = ? AND {$scope['col']} = ?");
        $result = $stmt->execute([$id, $scope['val']]);
        
        if (!$result) {
            Response::error('Failed to delete account', 500);
            return;
        }
        
        Response::json(['success' => true, 'message' => 'Account deleted successfully']);
    }
    private static function map(array $a): array {
        return [
            'id' => (string)$a['id'],
            'name' => $a['name'],
            'email' => $a['email'],
            'provider' => $a['provider'] ?? 'smtp',
            'status' => $a['status'] ?? 'active',
            'daily_limit' => (int)($a['daily_limit'] ?? 100),
            'sent_today' => (int)($a['sent_today'] ?? 0),
        ];
    }
}