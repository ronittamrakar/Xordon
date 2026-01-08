<?php
/**
 * WhatsApp Controller
 * Handles WhatsApp Business API integration via Meta Cloud API
 */

require_once __DIR__ . '/../Auth.php';
require_once __DIR__ . '/../Database.php';
require_once __DIR__ . '/../Response.php';

class WhatsAppController {
    
    private static function getWorkspaceScope(): array {
        $ctx = $GLOBALS['tenantContext'] ?? null;
        if ($ctx && isset($ctx->workspaceId)) {
            return ['col' => 'workspace_id', 'val' => (int)$ctx->workspaceId];
        }
        return ['col' => 'user_id', 'val' => Auth::userIdOrFail()];
    }
    
    /**
     * Get WhatsApp settings
     * GET /api/channels/whatsapp/settings
     */
    public static function getSettings(): void {
        $userId = Auth::userIdOrFail();
        $pdo = Database::conn();
        $scope = self::getWorkspaceScope();
        
        $workspaceId = $scope['col'] === 'workspace_id' ? $scope['val'] : null;
        
        $stmt = $pdo->prepare("
            SELECT settings FROM channel_settings 
            WHERE channel = 'whatsapp' AND (workspace_id = ? OR workspace_id IS NULL)
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
            'stop_keywords' => ['STOP', 'UNSUBSCRIBE', 'CANCEL', 'END', 'QUIT'],
            'default_template_language' => 'en',
        ];
        
        Response::json(['settings' => $settings]);
    }
    
    /**
     * Update WhatsApp settings
     * PUT /api/channels/whatsapp/settings
     */
    public static function updateSettings(): void {
        $userId = Auth::userIdOrFail();
        $body = json_decode(file_get_contents('php://input'), true);
        $pdo = Database::conn();
        $scope = self::getWorkspaceScope();
        
        $workspaceId = $scope['col'] === 'workspace_id' ? $scope['val'] : null;
        
        $stmt = $pdo->prepare("
            INSERT INTO channel_settings (user_id, workspace_id, channel, settings, created_at, updated_at)
            VALUES (?, ?, 'whatsapp', ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            ON DUPLICATE KEY UPDATE settings = ?, updated_at = CURRENT_TIMESTAMP
        ");
        $settingsJson = json_encode($body);
        $stmt->execute([$userId, $workspaceId, $settingsJson, $settingsJson]);
        
        Response::json(['success' => true]);
    }

    /**
     * Get all WhatsApp accounts for the workspace
     * GET /api/channels/whatsapp/accounts
     */
    public static function getAccounts(): void {
        $userId = Auth::userIdOrFail();
        $pdo = Database::conn();
        $scope = self::getWorkspaceScope();
        
        $stmt = $pdo->prepare("
            SELECT id, name, description, status, status_message, provider,
                   external_id, external_name, quality_rating, messaging_tier,
                   daily_limit, hourly_limit, sent_today, sent_this_hour,
                   last_webhook_at, created_at, updated_at
            FROM channel_accounts 
            WHERE {$scope['col']} = ? AND channel = 'whatsapp'
            ORDER BY created_at DESC
        ");
        $stmt->execute([$scope['val']]);
        $accounts = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        Response::json(['accounts' => $accounts]);
    }
    
    /**
     * Get a single WhatsApp account
     * GET /api/channels/whatsapp/accounts/:id
     */
    public static function getAccount(string $id): void {
        $userId = Auth::userIdOrFail();
        $pdo = Database::conn();
        $scope = self::getWorkspaceScope();
        
        $stmt = $pdo->prepare("
            SELECT * FROM channel_accounts 
            WHERE id = ? AND {$scope['col']} = ? AND channel = 'whatsapp'
        ");
        $stmt->execute([$id, $scope['val']]);
        $account = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$account) {
            Response::error('Account not found', 404);
            return;
        }
        
        // Don't expose raw credentials
        unset($account['credentials']);
        $account['has_credentials'] = !empty($account['credentials']);
        
        Response::json(['account' => $account]);
    }
    
    /**
     * Connect a WhatsApp Business account
     * POST /api/channels/whatsapp/connect
     */
    public static function connect(): void {
        $userId = Auth::userIdOrFail();
        $body = json_decode(file_get_contents('php://input'), true);
        $pdo = Database::conn();
        $scope = self::getWorkspaceScope();
        
        // Validate required fields
        $accessToken = trim($body['access_token'] ?? '');
        $phoneNumberId = trim($body['phone_number_id'] ?? '');
        $wabaId = trim($body['waba_id'] ?? '');
        $name = trim($body['name'] ?? 'WhatsApp Business');
        
        if (!$accessToken) {
            Response::error('Access token is required', 422);
            return;
        }
        if (!$phoneNumberId) {
            Response::error('Phone Number ID is required', 422);
            return;
        }
        
        // Verify credentials with Meta API
        $verifyResult = self::verifyCredentials($accessToken, $phoneNumberId);
        if (!$verifyResult['success']) {
            Response::error('Failed to verify credentials: ' . $verifyResult['error'], 400);
            return;
        }
        
        // Generate webhook verify token
        $webhookVerifyToken = bin2hex(random_bytes(16));
        
        // Store credentials as JSON
        $credentials = json_encode([
            'access_token' => $accessToken,
            'phone_number_id' => $phoneNumberId,
            'waba_id' => $wabaId,
        ]);
        
        // Check if account already exists for this phone number
        $stmt = $pdo->prepare("
            SELECT id FROM channel_accounts 
            WHERE channel = 'whatsapp' AND external_id = ?
        ");
        $stmt->execute([$phoneNumberId]);
        $existing = $stmt->fetch();
        
        if ($existing) {
            // Update existing account
            $stmt = $pdo->prepare("
                UPDATE channel_accounts SET
                    name = ?,
                    credentials = ?,
                    external_name = ?,
                    status = 'active',
                    status_message = NULL,
                    webhook_verify_token = ?,
                    quality_rating = ?,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            ");
            $stmt->execute([
                $name,
                $credentials,
                $verifyResult['display_phone_number'] ?? $phoneNumberId,
                $webhookVerifyToken,
                $verifyResult['quality_rating'] ?? null,
                $existing['id']
            ]);
            $accountId = $existing['id'];
        } else {
            // Create new account
            $workspaceId = $scope['col'] === 'workspace_id' ? $scope['val'] : null;
            
            $stmt = $pdo->prepare("
                INSERT INTO channel_accounts 
                (user_id, workspace_id, channel, name, provider, credentials, external_id, external_name, 
                 status, webhook_verify_token, quality_rating, messaging_tier, created_at, updated_at)
                VALUES (?, ?, 'whatsapp', ?, 'meta', ?, ?, ?, 'active', ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            ");
            $stmt->execute([
                $userId,
                $workspaceId,
                $name,
                $credentials,
                $phoneNumberId,
                $verifyResult['display_phone_number'] ?? $phoneNumberId,
                $webhookVerifyToken,
                $verifyResult['quality_rating'] ?? null,
                $verifyResult['messaging_tier'] ?? null,
            ]);
            $accountId = $pdo->lastInsertId();
        }
        
        // Sync templates
        self::syncTemplatesForAccount($accountId, $accessToken, $wabaId);
        
        Response::json([
            'success' => true,
            'account_id' => $accountId,
            'webhook_verify_token' => $webhookVerifyToken,
            'webhook_url' => self::getWebhookUrl(),
            'phone_number' => $verifyResult['display_phone_number'] ?? $phoneNumberId,
        ], 201);
    }
    
    /**
     * Disconnect a WhatsApp account
     * POST /api/channels/whatsapp/accounts/:id/disconnect
     */
    public static function disconnect(string $id): void {
        $userId = Auth::userIdOrFail();
        $pdo = Database::conn();
        $scope = self::getWorkspaceScope();
        
        $stmt = $pdo->prepare("
            UPDATE channel_accounts 
            SET status = 'disconnected', credentials = NULL, updated_at = CURRENT_TIMESTAMP
            WHERE id = ? AND {$scope['col']} = ? AND channel = 'whatsapp'
        ");
        $stmt->execute([$id, $scope['val']]);
        
        if ($stmt->rowCount() === 0) {
            Response::error('Account not found', 404);
            return;
        }
        
        Response::json(['success' => true]);
    }
    
    /**
     * Get WhatsApp templates for an account
     * GET /api/channels/whatsapp/accounts/:id/templates
     */
    public static function getTemplates(string $accountId): void {
        $userId = Auth::userIdOrFail();
        $pdo = Database::conn();
        $scope = self::getWorkspaceScope();
        
        // Verify account ownership
        $stmt = $pdo->prepare("
            SELECT id FROM channel_accounts 
            WHERE id = ? AND {$scope['col']} = ? AND channel = 'whatsapp'
        ");
        $stmt->execute([$accountId, $scope['val']]);
        if (!$stmt->fetch()) {
            Response::error('Account not found', 404);
            return;
        }
        
        $status = $_GET['status'] ?? null;
        $category = $_GET['category'] ?? null;
        
        $sql = "SELECT * FROM whatsapp_templates WHERE channel_account_id = ?";
        $params = [$accountId];
        
        if ($status) {
            $sql .= " AND status = ?";
            $params[] = $status;
        }
        if ($category) {
            $sql .= " AND category = ?";
            $params[] = $category;
        }
        
        $sql .= " ORDER BY name ASC";
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $templates = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Parse JSON fields
        foreach ($templates as &$template) {
            $template['components'] = json_decode($template['components'], true);
            $template['variable_mappings'] = json_decode($template['variable_mappings'], true);
        }
        
        Response::json(['templates' => $templates]);
    }
    
    /**
     * Sync templates from Meta API
     * POST /api/channels/whatsapp/accounts/:id/templates/sync
     */
    public static function syncTemplates(string $accountId): void {
        $userId = Auth::userIdOrFail();
        $pdo = Database::conn();
        $scope = self::getWorkspaceScope();
        
        // Get account with credentials
        $stmt = $pdo->prepare("
            SELECT * FROM channel_accounts 
            WHERE id = ? AND {$scope['col']} = ? AND channel = 'whatsapp'
        ");
        $stmt->execute([$accountId, $scope['val']]);
        $account = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$account) {
            Response::error('Account not found', 404);
            return;
        }
        
        $credentials = json_decode($account['credentials'], true);
        if (!$credentials || !isset($credentials['access_token'])) {
            Response::error('Account credentials not configured', 400);
            return;
        }
        
        $result = self::syncTemplatesForAccount(
            $accountId, 
            $credentials['access_token'], 
            $credentials['waba_id'] ?? null
        );
        
        Response::json($result);
    }
    
    /**
     * Update template variable mappings
     * PUT /api/channels/whatsapp/templates/:id/mappings
     */
    public static function updateTemplateMappings(string $templateId): void {
        $userId = Auth::userIdOrFail();
        $body = json_decode(file_get_contents('php://input'), true);
        $pdo = Database::conn();
        $scope = self::getWorkspaceScope();
        
        // Verify ownership through account
        $stmt = $pdo->prepare("
            SELECT t.id FROM whatsapp_templates t
            JOIN channel_accounts a ON t.channel_account_id = a.id
            WHERE t.id = ? AND a.{$scope['col']} = ?
        ");
        $stmt->execute([$templateId, $scope['val']]);
        if (!$stmt->fetch()) {
            Response::error('Template not found', 404);
            return;
        }
        
        $mappings = $body['variable_mappings'] ?? [];
        
        $stmt = $pdo->prepare("
            UPDATE whatsapp_templates 
            SET variable_mappings = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        ");
        $stmt->execute([json_encode($mappings), $templateId]);
        
        Response::json(['success' => true]);
    }
    
    /**
     * Send a WhatsApp template message
     * POST /api/channels/whatsapp/send
     */
    public static function sendMessage(): void {
        $userId = Auth::userIdOrFail();
        $body = json_decode(file_get_contents('php://input'), true);
        $pdo = Database::conn();
        $scope = self::getWorkspaceScope();
        
        $accountId = $body['account_id'] ?? null;
        $templateId = $body['template_id'] ?? null;
        $recipientPhone = $body['recipient_phone'] ?? null;
        $contactId = $body['contact_id'] ?? null;
        $variables = $body['variables'] ?? [];
        
        if (!$accountId) {
            Response::error('Account ID is required', 422);
            return;
        }
        if (!$templateId) {
            Response::error('Template ID is required', 422);
            return;
        }
        if (!$recipientPhone) {
            Response::error('Recipient phone number is required', 422);
            return;
        }
        
        // Get account
        $stmt = $pdo->prepare("
            SELECT * FROM channel_accounts 
            WHERE id = ? AND {$scope['col']} = ? AND channel = 'whatsapp' AND status = 'active'
        ");
        $stmt->execute([$accountId, $scope['val']]);
        $account = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$account) {
            Response::error('WhatsApp account not found or inactive', 404);
            return;
        }
        
        // Get template
        $stmt = $pdo->prepare("SELECT * FROM whatsapp_templates WHERE id = ? AND channel_account_id = ?");
        $stmt->execute([$templateId, $accountId]);
        $template = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$template) {
            Response::error('Template not found', 404);
            return;
        }
        
        if ($template['status'] !== 'APPROVED') {
            Response::error('Template is not approved', 400);
            return;
        }
        
        // Check rate limits
        if ($account['sent_today'] >= $account['daily_limit']) {
            Response::error('Daily sending limit reached', 429);
            return;
        }
        if ($account['sent_this_hour'] >= $account['hourly_limit']) {
            Response::error('Hourly sending limit reached', 429);
            return;
        }
        
        $credentials = json_decode($account['credentials'], true);
        
        // Build and send message
        $result = self::sendTemplateMessage(
            $credentials['access_token'],
            $credentials['phone_number_id'],
            $recipientPhone,
            $template['name'],
            $template['language'],
            json_decode($template['components'], true),
            $variables
        );
        
        // Log the message
        $workspaceId = $scope['col'] === 'workspace_id' ? $scope['val'] : null;
        
        $stmt = $pdo->prepare("
            INSERT INTO channel_messages 
            (user_id, workspace_id, channel_account_id, channel, direction, contact_id, 
             recipient_address, message_type, template_id, template_name, template_variables,
             status, provider_message_id, sent_at, created_at, updated_at)
            VALUES (?, ?, ?, 'whatsapp', 'outbound', ?, ?, 'template', ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        ");
        $stmt->execute([
            $userId,
            $workspaceId,
            $accountId,
            $contactId,
            $recipientPhone,
            $templateId,
            $template['name'],
            json_encode($variables),
            $result['success'] ? 'sent' : 'failed',
            $result['message_id'] ?? null,
            $result['success'] ? date('Y-m-d H:i:s') : null,
        ]);
        $messageId = $pdo->lastInsertId();
        
        // Update rate limit counters
        if ($result['success']) {
            $stmt = $pdo->prepare("
                UPDATE channel_accounts SET
                    sent_today = sent_today + 1,
                    sent_this_hour = sent_this_hour + 1,
                    last_reset_date = CURDATE(),
                    last_reset_hour = NOW()
                WHERE id = ?
            ");
            $stmt->execute([$accountId]);
        } else {
            // Log error
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
     * Get message history
     * GET /api/channels/whatsapp/messages
     */
    public static function getMessages(): void {
        $userId = Auth::userIdOrFail();
        $pdo = Database::conn();
        $scope = self::getWorkspaceScope();
        
        $accountId = $_GET['account_id'] ?? null;
        $contactId = $_GET['contact_id'] ?? null;
        $direction = $_GET['direction'] ?? null;
        $status = $_GET['status'] ?? null;
        $limit = min((int)($_GET['limit'] ?? 50), 100);
        $offset = (int)($_GET['offset'] ?? 0);
        
        $sql = "SELECT m.*, t.name as template_display_name 
                FROM channel_messages m
                LEFT JOIN whatsapp_templates t ON m.template_id = t.id
                WHERE m.{$scope['col']} = ? AND m.channel = 'whatsapp'";
        $params = [$scope['val']];
        
        if ($accountId) {
            $sql .= " AND m.channel_account_id = ?";
            $params[] = $accountId;
        }
        if ($contactId) {
            $sql .= " AND m.contact_id = ?";
            $params[] = $contactId;
        }
        if ($direction) {
            $sql .= " AND m.direction = ?";
            $params[] = $direction;
        }
        if ($status) {
            $sql .= " AND m.status = ?";
            $params[] = $status;
        }
        
        $sql .= " ORDER BY m.created_at DESC LIMIT ? OFFSET ?";
        $params[] = $limit;
        $params[] = $offset;
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $messages = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Parse JSON fields
        foreach ($messages as &$msg) {
            $msg['template_variables'] = json_decode($msg['template_variables'], true);
        }
        
        Response::json(['messages' => $messages]);
    }
    
    /**
     * Get conversations (inbox view)
     * GET /api/channels/whatsapp/conversations
     */
    public static function getConversations(): void {
        $userId = Auth::userIdOrFail();
        $pdo = Database::conn();
        $scope = self::getWorkspaceScope();
        
        $accountId = $_GET['account_id'] ?? null;
        $status = $_GET['status'] ?? 'open';
        $limit = min((int)($_GET['limit'] ?? 50), 100);
        $offset = (int)($_GET['offset'] ?? 0);
        
        $sql = "SELECT c.*, a.name as account_name, a.external_name as account_phone,
                       ct.first_name, ct.last_name, ct.email as contact_email
                FROM channel_conversations c
                JOIN channel_accounts a ON c.channel_account_id = a.id
                LEFT JOIN contacts ct ON c.contact_id = ct.id
                WHERE c.{$scope['col']} = ? AND c.channel = 'whatsapp'";
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
    
    // ==================== PRIVATE HELPER METHODS ====================
    
    /**
     * Verify credentials with Meta API
     */
    private static function verifyCredentials(string $accessToken, string $phoneNumberId): array {
        $url = "https://graph.facebook.com/v18.0/{$phoneNumberId}?fields=display_phone_number,quality_rating,verified_name,code_verification_status";
        
        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_HTTPHEADER => [
                "Authorization: Bearer {$accessToken}",
            ],
        ]);
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        
        if ($httpCode !== 200) {
            $error = json_decode($response, true);
            return [
                'success' => false,
                'error' => $error['error']['message'] ?? 'Failed to verify credentials',
            ];
        }
        
        $data = json_decode($response, true);
        return [
            'success' => true,
            'display_phone_number' => $data['display_phone_number'] ?? null,
            'quality_rating' => $data['quality_rating'] ?? null,
            'verified_name' => $data['verified_name'] ?? null,
        ];
    }
    
    /**
     * Sync templates from Meta API for an account
     */
    private static function syncTemplatesForAccount(int $accountId, string $accessToken, ?string $wabaId): array {
        if (!$wabaId) {
            return ['success' => false, 'error' => 'WABA ID is required to sync templates'];
        }
        
        $url = "https://graph.facebook.com/v18.0/{$wabaId}/message_templates?limit=100";
        
        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_HTTPHEADER => [
                "Authorization: Bearer {$accessToken}",
            ],
        ]);
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        
        if ($httpCode !== 200) {
            $error = json_decode($response, true);
            return [
                'success' => false,
                'error' => $error['error']['message'] ?? 'Failed to fetch templates',
            ];
        }
        
        $data = json_decode($response, true);
        $templates = $data['data'] ?? [];
        
        $pdo = Database::conn();
        $userId = Auth::userIdOrFail();
        $scope = self::getWorkspaceScope();
        $workspaceId = $scope['col'] === 'workspace_id' ? $scope['val'] : null;
        
        $synced = 0;
        $updated = 0;
        
        foreach ($templates as $template) {
            // Check if template exists
            $stmt = $pdo->prepare("
                SELECT id FROM whatsapp_templates 
                WHERE channel_account_id = ? AND template_id = ? AND language = ?
            ");
            $stmt->execute([$accountId, $template['id'], $template['language']]);
            $existing = $stmt->fetch();
            
            // Build preview text from body component
            $previewText = '';
            foreach ($template['components'] ?? [] as $component) {
                if ($component['type'] === 'BODY') {
                    $previewText = $component['text'] ?? '';
                    break;
                }
            }
            
            if ($existing) {
                // Update
                $stmt = $pdo->prepare("
                    UPDATE whatsapp_templates SET
                        name = ?,
                        category = ?,
                        status = ?,
                        components = ?,
                        preview_text = ?,
                        last_synced_at = CURRENT_TIMESTAMP,
                        updated_at = CURRENT_TIMESTAMP
                    WHERE id = ?
                ");
                $stmt->execute([
                    $template['name'],
                    $template['category'] ?? null,
                    $template['status'] ?? 'PENDING',
                    json_encode($template['components'] ?? []),
                    $previewText,
                    $existing['id'],
                ]);
                $updated++;
            } else {
                // Insert
                $stmt = $pdo->prepare("
                    INSERT INTO whatsapp_templates 
                    (user_id, workspace_id, channel_account_id, template_id, name, language, 
                     category, status, components, preview_text, last_synced_at, created_at, updated_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                ");
                $stmt->execute([
                    $userId,
                    $workspaceId,
                    $accountId,
                    $template['id'],
                    $template['name'],
                    $template['language'],
                    $template['category'] ?? null,
                    $template['status'] ?? 'PENDING',
                    json_encode($template['components'] ?? []),
                    $previewText,
                ]);
                $synced++;
            }
        }
        
        return [
            'success' => true,
            'synced' => $synced,
            'updated' => $updated,
            'total' => count($templates),
        ];
    }
    
    /**
     * Send a template message via Meta API
     */
    private static function sendTemplateMessage(
        string $accessToken,
        string $phoneNumberId,
        string $recipientPhone,
        string $templateName,
        string $language,
        array $components,
        array $variables
    ): array {
        $url = "https://graph.facebook.com/v18.0/{$phoneNumberId}/messages";
        
        // Build template components with variables
        $templateComponents = [];
        
        foreach ($components as $component) {
            $type = strtolower($component['type']);
            
            if ($type === 'body' && !empty($variables)) {
                $parameters = [];
                foreach ($variables as $value) {
                    $parameters[] = [
                        'type' => 'text',
                        'text' => $value,
                    ];
                }
                if (!empty($parameters)) {
                    $templateComponents[] = [
                        'type' => 'body',
                        'parameters' => $parameters,
                    ];
                }
            }
            // Add header/button handling as needed
        }
        
        $payload = [
            'messaging_product' => 'whatsapp',
            'to' => preg_replace('/[^0-9]/', '', $recipientPhone),
            'type' => 'template',
            'template' => [
                'name' => $templateName,
                'language' => [
                    'code' => $language,
                ],
            ],
        ];
        
        if (!empty($templateComponents)) {
            $payload['template']['components'] = $templateComponents;
        }
        
        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => json_encode($payload),
            CURLOPT_HTTPHEADER => [
                "Authorization: Bearer {$accessToken}",
                "Content-Type: application/json",
            ],
        ]);
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        
        $data = json_decode($response, true);
        
        if ($httpCode >= 200 && $httpCode < 300 && isset($data['messages'][0]['id'])) {
            return [
                'success' => true,
                'message_id' => $data['messages'][0]['id'],
            ];
        }
        
        return [
            'success' => false,
            'error' => $data['error']['message'] ?? 'Failed to send message',
            'error_code' => $data['error']['code'] ?? null,
        ];
    }
    
    /**
     * Get webhook URL for this installation
     */
    private static function getWebhookUrl(): string {
        $baseUrl = getenv('APP_URL') ?: 'https://api.xordon.com';
        return rtrim($baseUrl, '/') . '/api/webhooks/whatsapp';
    }
}
