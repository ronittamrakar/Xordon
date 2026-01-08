<?php
/**
 * InstagramController - Instagram DM Integration
 * Handles Instagram Direct Messages via Facebook Graph API
 */

require_once __DIR__ . '/../Database.php';
require_once __DIR__ . '/../Response.php';
require_once __DIR__ . '/../Auth.php';
require_once __DIR__ . '/../TenantContext.php';

class InstagramController {
    
    /**
     * Connect Instagram account via OAuth
     * POST /instagram/connect
     */
    public static function connectAccount(): void {
        $ctx = TenantContext::resolveOrFail();
        $data = get_json_body();
        $pdo = Database::conn();
        
        if (empty($data['instagram_id']) || empty($data['access_token'])) {
            Response::validationError('instagram_id and access_token are required');
            return;
        }
        
        // Verify token and get account info from Instagram Graph API
        $accountInfo = self::verifyAndGetAccountInfo($data['access_token']);
        
        if (!$accountInfo) {
            Response::error('Failed to verify Instagram account', 400);
            return;
        }
        
        $stmt = $pdo->prepare("
            INSERT INTO instagram_accounts 
            (workspace_id, company_id, instagram_id, username, access_token, profile_picture_url, followers_count, is_active, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, 1, NOW(), NOW())
            ON DUPLICATE KEY UPDATE 
            username = VALUES(username),
            access_token = VALUES(access_token),
            profile_picture_url = VALUES(profile_picture_url),
            followers_count = VALUES(followers_count),
            is_active = 1,
            updated_at = NOW()
        ");
        
        $stmt->execute([
            $ctx->workspaceId,
            $ctx->activeCompanyId,
            $data['instagram_id'],
            $accountInfo['username'] ?? $data['username'] ?? null,
            $data['access_token'],
            $accountInfo['profile_picture_url'] ?? null,
            $accountInfo['followers_count'] ?? 0
        ]);
        
        Response::json([
            'success' => true,
            'message' => 'Instagram account connected successfully',
            'account' => $accountInfo
        ], 201);
    }
    
    /**
     * List connected Instagram accounts
     * GET /instagram/accounts
     */
    public static function listAccounts(): void {
        $ctx = TenantContext::resolveOrFail();
        $pdo = Database::conn();
        
        $sql = "SELECT * FROM instagram_accounts WHERE workspace_id = ?";
        $params = [$ctx->workspaceId];
        
        if ($ctx->activeCompanyId) {
            $sql .= " AND company_id = ?";
            $params[] = $ctx->activeCompanyId;
        }
        
        $sql .= " ORDER BY username";
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $accounts = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        Response::json([
            'success' => true,
            'data' => $accounts
        ]);
    }
    
    /**
     * Disconnect Instagram account
     * DELETE /instagram/accounts/:id
     */
    public static function disconnectAccount(int $id): void {
        $ctx = TenantContext::resolveOrFail();
        $pdo = Database::conn();
        
        $stmt = $pdo->prepare("UPDATE instagram_accounts SET is_active = 0, updated_at = NOW() WHERE id = ? AND workspace_id = ?");
        $stmt->execute([$id, $ctx->workspaceId]);
        
        if ($stmt->rowCount() === 0) {
            Response::notFound('Instagram account not found');
            return;
        }
        
        Response::json([
            'success' => true,
            'message' => 'Instagram account disconnected'
        ]);
    }
    
    /**
     * Get Instagram conversations
     * GET /instagram/conversations
     */
    public static function getConversations(): void {
        $ctx = TenantContext::resolveOrFail();
        $pdo = Database::conn();
        
        $accountId = $_GET['account_id'] ?? null;
        
        if (!$accountId) {
            Response::validationError('account_id is required');
            return;
        }
        
        // Get account and verify ownership
        $accountStmt = $pdo->prepare("SELECT * FROM instagram_accounts WHERE id = ? AND workspace_id = ? AND is_active = 1");
        $accountStmt->execute([$accountId, $ctx->workspaceId]);
        $account = $accountStmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$account) {
            Response::notFound('Instagram account not found or inactive');
            return;
        }
        
        // Fetch conversations from Instagram Graph API
        $conversations = self::fetchConversationsFromAPI($account['access_token'], $account['instagram_id']);
        
        // Store/update conversations in database
        foreach ($conversations as $conversation) {
            self::storeConversation($pdo, $ctx->workspaceId, $ctx->activeCompanyId, $accountId, $conversation);
        }
        
        Response::json([
            'success' => true,
            'data' => $conversations
        ]);
    }
    
    /**
     * Send Instagram DM
     * POST /instagram/send
     */
    public static function sendMessage(): void {
        $ctx = TenantContext::resolveOrFail();
        $data = get_json_body();
        $pdo = Database::conn();
        
        if (empty($data['account_id']) || empty($data['recipient_id']) || empty($data['message'])) {
            Response::validationError('account_id, recipient_id, and message are required');
            return;
        }
        
        // Get account
        $accountStmt = $pdo->prepare("SELECT * FROM instagram_accounts WHERE id = ? AND workspace_id = ? AND is_active = 1");
        $accountStmt->execute([$data['account_id'], $ctx->workspaceId]);
        $account = $accountStmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$account) {
            Response::notFound('Instagram account not found or inactive');
            return;
        }
        
        // Send message via Instagram Graph API
        $result = self::sendMessageViaAPI(
            $account['access_token'],
            $account['instagram_id'],
            $data['recipient_id'],
            $data['message'],
            $data['media_url'] ?? null
        );
        
        if (!$result['success']) {
            Response::error('Failed to send Instagram message: ' . ($result['error'] ?? 'Unknown error'), 500);
            return;
        }
        
        // Store message in conversation_messages table
        $conversationId = self::getOrCreateConversation($pdo, $ctx->workspaceId, $ctx->activeCompanyId, $data['account_id'], $data['recipient_id']);
        
        $msgStmt = $pdo->prepare("
            INSERT INTO conversation_messages 
            (workspace_id, company_id, conversation_id, channel, direction, sender_type, sender_id, body, metadata, status, external_id, created_at)
            VALUES (?, ?, ?, 'instagram', 'outbound', 'user', ?, ?, ?, 'sent', ?, NOW())
        ");
        
        $msgStmt->execute([
            $ctx->workspaceId,
            $ctx->activeCompanyId,
            $conversationId,
            $ctx->userId,
            $data['message'],
            json_encode(['recipient_id' => $data['recipient_id'], 'account_id' => $data['account_id']]),
            $result['message_id'] ?? null
        ]);
        
        Response::json([
            'success' => true,
            'message' => 'Instagram message sent successfully',
            'message_id' => $result['message_id'] ?? null
        ], 201);
    }
    
    /**
     * Webhook handler for Instagram messages
     * POST /instagram/webhook
     */
    public static function handleWebhook(): void {
        $data = get_json_body();
        $pdo = Database::conn();
        
        // Verify webhook signature
        $signature = $_SERVER['HTTP_X_HUB_SIGNATURE_256'] ?? '';
        if (!self::verifyWebhookSignature($signature, file_get_contents('php://input'))) {
            Response::error('Invalid webhook signature', 403);
            return;
        }
        
        // Process webhook events
        if (isset($data['entry'])) {
            foreach ($data['entry'] as $entry) {
                if (isset($entry['messaging'])) {
                    foreach ($entry['messaging'] as $event) {
                        self::processWebhookEvent($pdo, $event);
                    }
                }
            }
        }
        
        Response::json(['success' => true]);
    }
    
    /**
     * Verify webhook signature
     */
    private static function verifyWebhookSignature(string $signature, string $payload): bool {
        $appSecret = $_ENV['INSTAGRAM_APP_SECRET'] ?? '';
        if (empty($appSecret)) {
            return true; // Skip verification in development
        }
        
        $expectedSignature = 'sha256=' . hash_hmac('sha256', $payload, $appSecret);
        return hash_equals($expectedSignature, $signature);
    }
    
    /**
     * Process incoming webhook event
     */
    private static function processWebhookEvent(PDO $pdo, array $event): void {
        if (!isset($event['message'])) {
            return;
        }
        
        $senderId = $event['sender']['id'] ?? null;
        $recipientId = $event['recipient']['id'] ?? null;
        $messageText = $event['message']['text'] ?? '';
        $messageId = $event['message']['mid'] ?? null;
        
        if (!$senderId || !$recipientId) {
            return;
        }
        
        // Find the Instagram account
        $accountStmt = $pdo->prepare("SELECT * FROM instagram_accounts WHERE instagram_id = ? AND is_active = 1 LIMIT 1");
        $accountStmt->execute([$recipientId]);
        $account = $accountStmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$account) {
            error_log("Instagram webhook: Account not found for instagram_id: $recipientId");
            return;
        }
        
        // Get or create conversation
        $conversationId = self::getOrCreateConversation($pdo, $account['workspace_id'], $account['company_id'], $account['id'], $senderId);
        
        // Store incoming message
        $msgStmt = $pdo->prepare("
            INSERT INTO conversation_messages 
            (workspace_id, company_id, conversation_id, channel, direction, sender_type, sender_id, body, metadata, status, external_id, created_at)
            VALUES (?, ?, ?, 'instagram', 'inbound', 'contact', ?, ?, ?, 'delivered', ?, NOW())
        ");
        
        $msgStmt->execute([
            $account['workspace_id'],
            $account['company_id'],
            $conversationId,
            $senderId,
            $messageText,
            json_encode(['sender_id' => $senderId, 'account_id' => $account['id']]),
            $messageId
        ]);
        
        // Update conversation unread count
        $pdo->prepare("UPDATE conversations SET unread_count = unread_count + 1, last_message_at = NOW() WHERE id = ?")->execute([$conversationId]);
    }
    
    /**
     * Get or create conversation for Instagram DM
     */
    private static function getOrCreateConversation(PDO $pdo, int $workspaceId, ?int $companyId, int $accountId, string $instagramUserId): int {
        // Try to find existing conversation
        $stmt = $pdo->prepare("
            SELECT c.id 
            FROM conversations c
            WHERE c.workspace_id = ? 
            AND JSON_EXTRACT(c.metadata, '$.instagram_user_id') = ?
            AND JSON_EXTRACT(c.metadata, '$.instagram_account_id') = ?
        ");
        $stmt->execute([$workspaceId, $instagramUserId, $accountId]);
        $existing = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($existing) {
            return (int)$existing['id'];
        }
        
        // Create new conversation
        $insertStmt = $pdo->prepare("
            INSERT INTO conversations (workspace_id, company_id, status, metadata, created_at)
            VALUES (?, ?, 'open', ?, NOW())
        ");
        
        $metadata = json_encode([
            'instagram_user_id' => $instagramUserId,
            'instagram_account_id' => $accountId,
            'channel' => 'instagram'
        ]);
        
        $insertStmt->execute([$workspaceId, $companyId, $metadata]);
        return (int)$pdo->lastInsertId();
    }
    
    /**
     * Verify Instagram access token and get account info
     */
    private static function verifyAndGetAccountInfo(string $accessToken): ?array {
        $url = "https://graph.instagram.com/me?fields=id,username,profile_picture_url,followers_count&access_token=" . urlencode($accessToken);
        
        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, 10);
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        
        if ($httpCode !== 200 || !$response) {
            error_log("Instagram API error: HTTP $httpCode - $response");
            return null;
        }
        
        return json_decode($response, true);
    }
    
    /**
     * Fetch conversations from Instagram Graph API
     */
    private static function fetchConversationsFromAPI(string $accessToken, string $instagramId): array {
        $url = "https://graph.instagram.com/v18.0/$instagramId/conversations?fields=id,participants,messages{id,from,to,message,created_time}&access_token=" . urlencode($accessToken);
        
        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, 15);
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        
        if ($httpCode !== 200 || !$response) {
            error_log("Instagram API error fetching conversations: HTTP $httpCode");
            return [];
        }
        
        $data = json_decode($response, true);
        return $data['data'] ?? [];
    }
    
    /**
     * Send message via Instagram Graph API
     */
    private static function sendMessageViaAPI(string $accessToken, string $instagramId, string $recipientId, string $message, ?string $mediaUrl = null): array {
        $url = "https://graph.instagram.com/v18.0/$instagramId/messages";
        
        $payload = [
            'recipient' => ['id' => $recipientId],
            'message' => ['text' => $message]
        ];
        
        if ($mediaUrl) {
            $payload['message'] = [
                'attachment' => [
                    'type' => 'image',
                    'payload' => ['url' => $mediaUrl]
                ]
            ];
        }
        
        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Content-Type: application/json',
            'Authorization: Bearer ' . $accessToken
        ]);
        curl_setopt($ch, CURLOPT_TIMEOUT, 10);
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        
        if ($httpCode !== 200) {
            error_log("Instagram send message error: HTTP $httpCode - $response");
            return [
                'success' => false,
                'error' => $response
            ];
        }
        
        $data = json_decode($response, true);
        return [
            'success' => true,
            'message_id' => $data['message_id'] ?? null
        ];
    }
    
    /**
     * Store conversation from API response
     */
    private static function storeConversation(PDO $pdo, int $workspaceId, ?int $companyId, int $accountId, array $conversation): void {
        // Implementation for storing conversation details
        // This would map Instagram conversation structure to our database schema
    }
}
