<?php
/**
 * Messenger Controller
 * Handles Facebook Messenger integration via Meta Graph API
 */

require_once __DIR__ . '/../Auth.php';
require_once __DIR__ . '/../Database.php';
require_once __DIR__ . '/../Response.php';

class MessengerController {
    
    private static function getWorkspaceScope(): array {
        $ctx = $GLOBALS['tenantContext'] ?? null;
        if ($ctx && isset($ctx->workspaceId)) {
            return ['col' => 'workspace_id', 'val' => (int)$ctx->workspaceId];
        }
        return ['col' => 'user_id', 'val' => Auth::userIdOrFail()];
    }
    
    /**
     * Get all Messenger accounts (connected pages)
     * GET /api/channels/messenger/accounts
     */
    public static function getAccounts(): void {
        $userId = Auth::userIdOrFail();
        $pdo = Database::conn();
        $scope = self::getWorkspaceScope();
        
        $stmt = $pdo->prepare("
            SELECT id, name, description, status, status_message, provider,
                   external_id, external_name, daily_limit, hourly_limit,
                   sent_today, sent_this_hour, last_webhook_at, created_at, updated_at
            FROM channel_accounts 
            WHERE {$scope['col']} = ? AND channel = 'messenger'
            ORDER BY created_at DESC
        ");
        $stmt->execute([$scope['val']]);
        $accounts = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        Response::json(['accounts' => $accounts]);
    }
    
    /**
     * Get a single Messenger account
     * GET /api/channels/messenger/accounts/:id
     */
    public static function getAccount(string $id): void {
        $userId = Auth::userIdOrFail();
        $pdo = Database::conn();
        $scope = self::getWorkspaceScope();
        
        $stmt = $pdo->prepare("
            SELECT * FROM channel_accounts 
            WHERE id = ? AND {$scope['col']} = ? AND channel = 'messenger'
        ");
        $stmt->execute([$id, $scope['val']]);
        $account = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$account) {
            Response::error('Account not found', 404);
            return;
        }
        
        unset($account['credentials']);
        $account['has_credentials'] = !empty($account['credentials']);
        
        Response::json(['account' => $account]);
    }
    
    /**
     * Connect a Facebook Page for Messenger
     * POST /api/channels/messenger/connect
     */
    public static function connect(): void {
        $userId = Auth::userIdOrFail();
        $body = json_decode(file_get_contents('php://input'), true);
        $pdo = Database::conn();
        $scope = self::getWorkspaceScope();
        
        $pageAccessToken = trim($body['page_access_token'] ?? '');
        $pageId = trim($body['page_id'] ?? '');
        $name = trim($body['name'] ?? 'Facebook Page');
        
        if (!$pageAccessToken) {
            Response::error('Page access token is required', 422);
            return;
        }
        if (!$pageId) {
            Response::error('Page ID is required', 422);
            return;
        }
        
        // Verify the page access token
        $verifyResult = self::verifyPageToken($pageAccessToken, $pageId);
        if (!$verifyResult['success']) {
            Response::error('Failed to verify page token: ' . $verifyResult['error'], 400);
            return;
        }
        
        $webhookVerifyToken = bin2hex(random_bytes(16));
        
        $credentials = json_encode([
            'page_access_token' => $pageAccessToken,
            'page_id' => $pageId,
        ]);
        
        // Check if account exists
        $stmt = $pdo->prepare("
            SELECT id FROM channel_accounts 
            WHERE channel = 'messenger' AND external_id = ?
        ");
        $stmt->execute([$pageId]);
        $existing = $stmt->fetch();
        
        if ($existing) {
            $stmt = $pdo->prepare("
                UPDATE channel_accounts SET
                    name = ?,
                    credentials = ?,
                    external_name = ?,
                    status = 'active',
                    status_message = NULL,
                    webhook_verify_token = ?,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            ");
            $stmt->execute([
                $name,
                $credentials,
                $verifyResult['page_name'] ?? $pageId,
                $webhookVerifyToken,
                $existing['id']
            ]);
            $accountId = $existing['id'];
        } else {
            $workspaceId = $scope['col'] === 'workspace_id' ? $scope['val'] : null;
            
            $stmt = $pdo->prepare("
                INSERT INTO channel_accounts 
                (user_id, workspace_id, channel, name, provider, credentials, external_id, external_name, 
                 status, webhook_verify_token, created_at, updated_at)
                VALUES (?, ?, 'messenger', ?, 'meta', ?, ?, ?, 'active', ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            ");
            $stmt->execute([
                $userId,
                $workspaceId,
                $name,
                $credentials,
                $pageId,
                $verifyResult['page_name'] ?? $pageId,
                $webhookVerifyToken,
            ]);
            $accountId = $pdo->lastInsertId();
        }
        
        // Subscribe to webhooks
        self::subscribeToWebhooks($pageAccessToken, $pageId);
        
        Response::json([
            'success' => true,
            'account_id' => $accountId,
            'webhook_verify_token' => $webhookVerifyToken,
            'page_name' => $verifyResult['page_name'] ?? $pageId,
        ], 201);
    }
    
    /**
     * Disconnect a Messenger account
     * POST /api/channels/messenger/accounts/:id/disconnect
     */
    public static function disconnect(string $id): void {
        $userId = Auth::userIdOrFail();
        $pdo = Database::conn();
        $scope = self::getWorkspaceScope();
        
        $stmt = $pdo->prepare("
            UPDATE channel_accounts 
            SET status = 'disconnected', credentials = NULL, updated_at = CURRENT_TIMESTAMP
            WHERE id = ? AND {$scope['col']} = ? AND channel = 'messenger'
        ");
        $stmt->execute([$id, $scope['val']]);
        
        if ($stmt->rowCount() === 0) {
            Response::error('Account not found', 404);
            return;
        }
        
        Response::json(['success' => true]);
    }
    
    /**
     * Send a Messenger message
     * POST /api/channels/messenger/send
     */
    public static function sendMessage(): void {
        $userId = Auth::userIdOrFail();
        $body = json_decode(file_get_contents('php://input'), true);
        $pdo = Database::conn();
        $scope = self::getWorkspaceScope();
        
        $accountId = $body['account_id'] ?? null;
        $recipientPsid = $body['recipient_psid'] ?? null;
        $messageText = $body['message'] ?? null;
        $contactId = $body['contact_id'] ?? null;
        $messageType = $body['message_type'] ?? 'RESPONSE';
        
        if (!$accountId) {
            Response::error('Account ID is required', 422);
            return;
        }
        if (!$recipientPsid) {
            Response::error('Recipient PSID is required', 422);
            return;
        }
        if (!$messageText) {
            Response::error('Message text is required', 422);
            return;
        }
        
        // Get account
        $stmt = $pdo->prepare("
            SELECT * FROM channel_accounts 
            WHERE id = ? AND {$scope['col']} = ? AND channel = 'messenger' AND status = 'active'
        ");
        $stmt->execute([$accountId, $scope['val']]);
        $account = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$account) {
            Response::error('Messenger account not found or inactive', 404);
            return;
        }
        
        // Check rate limits
        if ($account['sent_today'] >= $account['daily_limit']) {
            Response::error('Daily sending limit reached', 429);
            return;
        }
        
        $credentials = json_decode($account['credentials'], true);
        
        // Send message
        $result = self::sendMessageToUser(
            $credentials['page_access_token'],
            $recipientPsid,
            $messageText,
            $messageType
        );
        
        // Log the message
        $workspaceId = $scope['col'] === 'workspace_id' ? $scope['val'] : null;
        
        $stmt = $pdo->prepare("
            INSERT INTO channel_messages 
            (user_id, workspace_id, channel_account_id, channel, direction, contact_id, 
             recipient_address, message_type, content, status, provider_message_id, 
             sent_at, created_at, updated_at)
            VALUES (?, ?, ?, 'messenger', 'outbound', ?, ?, 'text', ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        ");
        $stmt->execute([
            $userId,
            $workspaceId,
            $accountId,
            $contactId,
            $recipientPsid,
            $messageText,
            $result['success'] ? 'sent' : 'failed',
            $result['message_id'] ?? null,
            $result['success'] ? date('Y-m-d H:i:s') : null,
        ]);
        $messageId = $pdo->lastInsertId();
        
        // Update rate limits
        if ($result['success']) {
            $stmt = $pdo->prepare("
                UPDATE channel_accounts SET
                    sent_today = sent_today + 1,
                    sent_this_hour = sent_this_hour + 1
                WHERE id = ?
            ");
            $stmt->execute([$accountId]);
            
            // Update conversation
            self::updateConversation($account, $recipientPsid, $contactId, $messageText, 'outbound');
        } else {
            $stmt = $pdo->prepare("
                UPDATE channel_messages SET error_code = ?, error_message = ? WHERE id = ?
            ");
            $stmt->execute([$result['error_code'] ?? 'UNKNOWN', $result['error'] ?? 'Unknown error', $messageId]);
        }
        
        if ($result['success']) {
            Response::json([
                'success' => true,
                'message_id' => $messageId,
                'provider_message_id' => $result['message_id'],
            ]);
        } else {
            Response::error($result['error'] ?? 'Failed to send message', 500);
        }
    }
    
    /**
     * Send a quick reply message
     * POST /api/channels/messenger/send-quick-replies
     */
    public static function sendQuickReplies(): void {
        $userId = Auth::userIdOrFail();
        $body = json_decode(file_get_contents('php://input'), true);
        $pdo = Database::conn();
        $scope = self::getWorkspaceScope();
        
        $accountId = $body['account_id'] ?? null;
        $recipientPsid = $body['recipient_psid'] ?? null;
        $messageText = $body['message'] ?? null;
        $quickReplies = $body['quick_replies'] ?? [];
        
        if (!$accountId || !$recipientPsid || !$messageText || empty($quickReplies)) {
            Response::error('Missing required fields', 422);
            return;
        }
        
        // Get account
        $stmt = $pdo->prepare("
            SELECT * FROM channel_accounts 
            WHERE id = ? AND {$scope['col']} = ? AND channel = 'messenger' AND status = 'active'
        ");
        $stmt->execute([$accountId, $scope['val']]);
        $account = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$account) {
            Response::error('Account not found', 404);
            return;
        }
        
        $credentials = json_decode($account['credentials'], true);
        
        // Build quick replies payload
        $quickReplyPayload = array_map(function($qr) {
            return [
                'content_type' => 'text',
                'title' => $qr['title'] ?? $qr,
                'payload' => $qr['payload'] ?? $qr['title'] ?? $qr,
            ];
        }, array_slice($quickReplies, 0, 13)); // Max 13 quick replies
        
        $result = self::sendMessageWithQuickReplies(
            $credentials['page_access_token'],
            $recipientPsid,
            $messageText,
            $quickReplyPayload
        );
        
        if ($result['success']) {
            Response::json([
                'success' => true,
                'message_id' => $result['message_id'],
            ]);
        } else {
            Response::error($result['error'] ?? 'Failed to send message', 500);
        }
    }
    
    /**
     * Get message history
     * GET /api/channels/messenger/messages
     */
    public static function getMessages(): void {
        $userId = Auth::userIdOrFail();
        $pdo = Database::conn();
        $scope = self::getWorkspaceScope();
        
        $accountId = $_GET['account_id'] ?? null;
        $contactId = $_GET['contact_id'] ?? null;
        $psid = $_GET['psid'] ?? null;
        $limit = min((int)($_GET['limit'] ?? 50), 100);
        $offset = (int)($_GET['offset'] ?? 0);
        
        $sql = "SELECT * FROM channel_messages 
                WHERE {$scope['col']} = ? AND channel = 'messenger'";
        $params = [$scope['val']];
        
        if ($accountId) {
            $sql .= " AND channel_account_id = ?";
            $params[] = $accountId;
        }
        if ($contactId) {
            $sql .= " AND contact_id = ?";
            $params[] = $contactId;
        }
        if ($psid) {
            $sql .= " AND recipient_address = ?";
            $params[] = $psid;
        }
        
        $sql .= " ORDER BY created_at DESC LIMIT ? OFFSET ?";
        $params[] = $limit;
        $params[] = $offset;
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $messages = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        Response::json(['messages' => $messages]);
    }
    
    /**
     * Get conversations
     * GET /api/channels/messenger/conversations
     */
    public static function getConversations(): void {
        $userId = Auth::userIdOrFail();
        $pdo = Database::conn();
        $scope = self::getWorkspaceScope();
        
        $accountId = $_GET['account_id'] ?? null;
        $status = $_GET['status'] ?? 'open';
        $limit = min((int)($_GET['limit'] ?? 50), 100);
        $offset = (int)($_GET['offset'] ?? 0);
        
        $sql = "SELECT c.*, a.name as account_name, a.external_name as page_name,
                       ct.first_name, ct.last_name, ct.email as contact_email
                FROM channel_conversations c
                JOIN channel_accounts a ON c.channel_account_id = a.id
                LEFT JOIN contacts ct ON c.contact_id = ct.id
                WHERE c.{$scope['col']} = ? AND c.channel = 'messenger'";
        $params = [$scope['val']];
        
        if ($accountId) {
            $sql .= " AND c.channel_account_id = ?";
            $params[] = $accountId;
        }
        if ($status && $status !== 'all') {
            $sql .= " AND c.status = ?";
            $params[] = $status;
        }
        
        $sql .= " ORDER BY c.last_message_at DESC LIMIT ? OFFSET ?";
        $params[] = $limit;
        $params[] = $offset;
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $conversations = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        Response::json(['conversations' => $conversations]);
    }
    
    /**
     * Get Messenger settings
     * GET /api/channels/messenger/settings
     */
    public static function getSettings(): void {
        $userId = Auth::userIdOrFail();
        $pdo = Database::conn();
        $scope = self::getWorkspaceScope();
        
        $workspaceId = $scope['col'] === 'workspace_id' ? $scope['val'] : null;
        
        $stmt = $pdo->prepare("
            SELECT settings FROM channel_settings 
            WHERE channel = 'messenger' AND (workspace_id = ? OR workspace_id IS NULL)
            ORDER BY workspace_id DESC LIMIT 1
        ");
        $stmt->execute([$workspaceId]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        
        $settings = $row ? json_decode($row['settings'], true) : [
            'quiet_hours_enabled' => true,
            'quiet_hours_start' => '21:00',
            'quiet_hours_end' => '08:00',
            'timezone' => 'America/New_York',
            'auto_reply_enabled' => false,
            'auto_reply_message' => '',
            'greeting_text' => '',
        ];
        
        Response::json(['settings' => $settings]);
    }
    
    /**
     * Update Messenger settings
     * PUT /api/channels/messenger/settings
     */
    public static function updateSettings(): void {
        $userId = Auth::userIdOrFail();
        $body = json_decode(file_get_contents('php://input'), true);
        $pdo = Database::conn();
        $scope = self::getWorkspaceScope();
        
        $workspaceId = $scope['col'] === 'workspace_id' ? $scope['val'] : null;
        
        $stmt = $pdo->prepare("
            INSERT INTO channel_settings (user_id, workspace_id, channel, settings, created_at, updated_at)
            VALUES (?, ?, 'messenger', ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            ON DUPLICATE KEY UPDATE settings = ?, updated_at = CURRENT_TIMESTAMP
        ");
        $settingsJson = json_encode($body);
        $stmt->execute([$userId, $workspaceId, $settingsJson, $settingsJson]);
        
        Response::json(['success' => true]);
    }
    
    // ==================== PRIVATE HELPER METHODS ====================
    
    /**
     * Verify page access token
     */
    private static function verifyPageToken(string $pageAccessToken, string $pageId): array {
        $url = "https://graph.facebook.com/v18.0/{$pageId}?fields=name,access_token&access_token={$pageAccessToken}";
        
        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
        ]);
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        
        if ($httpCode !== 200) {
            $error = json_decode($response, true);
            return [
                'success' => false,
                'error' => $error['error']['message'] ?? 'Failed to verify page token',
            ];
        }
        
        $data = json_decode($response, true);
        return [
            'success' => true,
            'page_name' => $data['name'] ?? null,
        ];
    }
    
    /**
     * Subscribe page to webhook events
     */
    private static function subscribeToWebhooks(string $pageAccessToken, string $pageId): bool {
        $url = "https://graph.facebook.com/v18.0/{$pageId}/subscribed_apps";
        
        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => http_build_query([
                'subscribed_fields' => 'messages,messaging_postbacks,messaging_optins,message_deliveries,message_reads',
                'access_token' => $pageAccessToken,
            ]),
        ]);
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        
        return $httpCode >= 200 && $httpCode < 300;
    }
    
    /**
     * Send message to user via Messenger
     */
    private static function sendMessageToUser(
        string $pageAccessToken,
        string $recipientPsid,
        string $messageText,
        string $messageType = 'RESPONSE'
    ): array {
        $url = "https://graph.facebook.com/v18.0/me/messages?access_token={$pageAccessToken}";
        
        $payload = [
            'recipient' => ['id' => $recipientPsid],
            'messaging_type' => $messageType,
            'message' => ['text' => $messageText],
        ];
        
        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => json_encode($payload),
            CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
        ]);
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        
        $data = json_decode($response, true);
        
        if ($httpCode >= 200 && $httpCode < 300 && isset($data['message_id'])) {
            return [
                'success' => true,
                'message_id' => $data['message_id'],
            ];
        }
        
        return [
            'success' => false,
            'error' => $data['error']['message'] ?? 'Failed to send message',
            'error_code' => $data['error']['code'] ?? null,
        ];
    }
    
    /**
     * Send message with quick replies
     */
    private static function sendMessageWithQuickReplies(
        string $pageAccessToken,
        string $recipientPsid,
        string $messageText,
        array $quickReplies
    ): array {
        $url = "https://graph.facebook.com/v18.0/me/messages?access_token={$pageAccessToken}";
        
        $payload = [
            'recipient' => ['id' => $recipientPsid],
            'messaging_type' => 'RESPONSE',
            'message' => [
                'text' => $messageText,
                'quick_replies' => $quickReplies,
            ],
        ];
        
        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => json_encode($payload),
            CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
        ]);
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        
        $data = json_decode($response, true);
        
        if ($httpCode >= 200 && $httpCode < 300 && isset($data['message_id'])) {
            return [
                'success' => true,
                'message_id' => $data['message_id'],
            ];
        }
        
        return [
            'success' => false,
            'error' => $data['error']['message'] ?? 'Failed to send message',
            'error_code' => $data['error']['code'] ?? null,
        ];
    }
    
    /**
     * Update or create conversation
     */
    private static function updateConversation(
        array $account,
        string $psid,
        ?int $contactId,
        ?string $messagePreview,
        string $direction
    ): void {
        $pdo = Database::conn();
        
        $stmt = $pdo->prepare("
            SELECT id FROM channel_conversations 
            WHERE channel_account_id = ? AND participant_address = ?
        ");
        $stmt->execute([$account['id'], $psid]);
        $existing = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($existing) {
            $stmt = $pdo->prepare("
                UPDATE channel_conversations SET
                    contact_id = COALESCE(?, contact_id),
                    last_message_preview = ?,
                    last_message_at = CURRENT_TIMESTAMP,
                    last_message_direction = ?,
                    status = 'open',
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            ");
            $stmt->execute([
                $contactId,
                substr($messagePreview ?? '', 0, 200),
                $direction,
                $existing['id'],
            ]);
        } else {
            $stmt = $pdo->prepare("
                INSERT INTO channel_conversations 
                (user_id, workspace_id, channel_account_id, channel, contact_id,
                 participant_address, status, last_message_preview, last_message_at, 
                 last_message_direction, created_at, updated_at)
                VALUES (?, ?, ?, 'messenger', ?, ?, 'open', ?, CURRENT_TIMESTAMP, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            ");
            $stmt->execute([
                $account['user_id'],
                $account['workspace_id'],
                $account['id'],
                $contactId,
                $psid,
                substr($messagePreview ?? '', 0, 200),
                $direction,
            ]);
        }
    }
}
