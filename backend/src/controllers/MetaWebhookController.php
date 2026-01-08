<?php
/**
 * Meta Webhook Controller
 * Handles webhooks from Meta (WhatsApp, Messenger, Instagram)
 */

require_once __DIR__ . '/../Database.php';
require_once __DIR__ . '/../Response.php';

class MetaWebhookController {
    
    /**
     * Handle webhook verification (GET request from Meta)
     * GET /api/webhooks/meta
     */
    public static function verify(): void {
        $mode = $_GET['hub_mode'] ?? '';
        $token = $_GET['hub_verify_token'] ?? '';
        $challenge = $_GET['hub_challenge'] ?? '';
        
        if ($mode !== 'subscribe') {
            http_response_code(400);
            echo 'Invalid mode';
            return;
        }
        
        // Look up the verify token in our accounts
        $pdo = Database::conn();
        $stmt = $pdo->prepare("
            SELECT id FROM channel_accounts 
            WHERE webhook_verify_token = ? AND status = 'active'
        ");
        $stmt->execute([$token]);
        
        if ($stmt->fetch()) {
            // Token matches, return the challenge
            http_response_code(200);
            echo $challenge;
            return;
        }
        
        // Also check a global verify token from env
        $globalToken = getenv('META_WEBHOOK_VERIFY_TOKEN');
        if ($globalToken && $token === $globalToken) {
            http_response_code(200);
            echo $challenge;
            return;
        }
        
        http_response_code(403);
        echo 'Invalid verify token';
    }
    
    /**
     * Handle incoming webhook events (POST request from Meta)
     * POST /api/webhooks/meta
     */
    public static function handle(): void {
        $rawBody = file_get_contents('php://input');
        $payload = json_decode($rawBody, true);
        
        if (!$payload) {
            http_response_code(400);
            echo json_encode(['error' => 'Invalid JSON']);
            return;
        }
        
        // Log the webhook event
        $pdo = Database::conn();
        $headers = getallheaders();
        
        // Verify signature if app secret is configured
        $appSecret = getenv('META_APP_SECRET');
        $signatureValid = null;
        if ($appSecret) {
            $signature = $headers['X-Hub-Signature-256'] ?? '';
            $expectedSignature = 'sha256=' . hash_hmac('sha256', $rawBody, $appSecret);
            $signatureValid = hash_equals($expectedSignature, $signature);
            
            if (!$signatureValid) {
                // Log but still process (some setups may not have signature)
                error_log('Meta webhook signature mismatch');
            }
        }
        
        // Determine channel from payload
        $object = $payload['object'] ?? '';
        $channel = self::determineChannel($object);
        
        // Log the raw event
        $stmt = $pdo->prepare("
            INSERT INTO webhook_events 
            (channel, provider, event_type, payload, headers, status, signature_valid, source_ip, created_at)
            VALUES (?, 'meta', ?, ?, ?, 'received', ?, ?, CURRENT_TIMESTAMP)
        ");
        $stmt->execute([
            $channel,
            $object,
            json_encode($payload),
            json_encode($headers),
            $signatureValid,
            $_SERVER['REMOTE_ADDR'] ?? null,
        ]);
        $webhookEventId = $pdo->lastInsertId();
        
        // Process the webhook
        try {
            $entries = $payload['entry'] ?? [];
            
            foreach ($entries as $entry) {
                $changes = $entry['changes'] ?? [];
                $messaging = $entry['messaging'] ?? [];
                
                // WhatsApp uses 'changes', Messenger uses 'messaging'
                if (!empty($changes)) {
                    foreach ($changes as $change) {
                        self::processWhatsAppChange($change, $entry);
                    }
                }
                
                if (!empty($messaging)) {
                    foreach ($messaging as $event) {
                        self::processMessengerEvent($event, $entry);
                    }
                }
            }
            
            // Mark as processed
            $stmt = $pdo->prepare("UPDATE webhook_events SET status = 'processed', processed_at = CURRENT_TIMESTAMP WHERE id = ?");
            $stmt->execute([$webhookEventId]);
            
        } catch (Exception $e) {
            error_log('Meta webhook processing error: ' . $e->getMessage());
            
            $stmt = $pdo->prepare("UPDATE webhook_events SET status = 'failed', error_message = ? WHERE id = ?");
            $stmt->execute([$e->getMessage(), $webhookEventId]);
        }
        
        // Always return 200 to Meta
        http_response_code(200);
        echo json_encode(['status' => 'ok']);
    }
    
    /**
     * WhatsApp-specific webhook handler
     * POST /api/webhooks/whatsapp
     */
    public static function handleWhatsApp(): void {
        // Check if this is a verification request
        if ($_SERVER['REQUEST_METHOD'] === 'GET') {
            self::verify();
            return;
        }
        
        self::handle();
    }
    
    /**
     * Messenger-specific webhook handler
     * POST /api/webhooks/messenger
     */
    public static function handleMessenger(): void {
        if ($_SERVER['REQUEST_METHOD'] === 'GET') {
            self::verify();
            return;
        }
        
        self::handle();
    }
    
    // ==================== PRIVATE PROCESSING METHODS ====================
    
    /**
     * Determine channel from webhook object type
     */
    private static function determineChannel(string $object): string {
        switch ($object) {
            case 'whatsapp_business_account':
                return 'whatsapp';
            case 'page':
                return 'messenger';
            case 'instagram':
                return 'instagram';
            default:
                return 'unknown';
        }
    }
    
    /**
     * Process WhatsApp webhook change
     */
    private static function processWhatsAppChange(array $change, array $entry): void {
        $field = $change['field'] ?? '';
        $value = $change['value'] ?? [];
        
        if ($field !== 'messages') {
            return;
        }
        
        $phoneNumberId = $value['metadata']['phone_number_id'] ?? null;
        if (!$phoneNumberId) {
            return;
        }
        
        $pdo = Database::conn();
        
        // Find the account
        $stmt = $pdo->prepare("
            SELECT * FROM channel_accounts 
            WHERE channel = 'whatsapp' AND external_id = ? AND status = 'active'
        ");
        $stmt->execute([$phoneNumberId]);
        $account = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$account) {
            error_log("WhatsApp webhook: No account found for phone_number_id: {$phoneNumberId}");
            return;
        }
        
        // Update last webhook timestamp
        $stmt = $pdo->prepare("UPDATE channel_accounts SET last_webhook_at = CURRENT_TIMESTAMP WHERE id = ?");
        $stmt->execute([$account['id']]);
        
        // Process messages
        $messages = $value['messages'] ?? [];
        foreach ($messages as $message) {
            self::processWhatsAppMessage($account, $message, $value);
        }
        
        // Process statuses (delivery receipts)
        $statuses = $value['statuses'] ?? [];
        foreach ($statuses as $status) {
            self::processWhatsAppStatus($account, $status);
        }
    }
    
    /**
     * Process incoming WhatsApp message
     */
    private static function processWhatsAppMessage(array $account, array $message, array $value): void {
        $pdo = Database::conn();
        
        $messageId = $message['id'] ?? null;
        $from = $message['from'] ?? null;
        $timestamp = $message['timestamp'] ?? time();
        $type = $message['type'] ?? 'text';
        
        if (!$messageId || !$from) {
            return;
        }
        
        // Check if we already processed this message
        $stmt = $pdo->prepare("SELECT id FROM channel_messages WHERE provider_message_id = ?");
        $stmt->execute([$messageId]);
        if ($stmt->fetch()) {
            return; // Already processed
        }
        
        // Extract message content
        $content = null;
        $mediaUrl = null;
        $mediaType = null;
        $mediaId = null;
        
        switch ($type) {
            case 'text':
                $content = $message['text']['body'] ?? null;
                break;
            case 'image':
            case 'video':
            case 'audio':
            case 'document':
                $mediaId = $message[$type]['id'] ?? null;
                $mediaType = $type;
                $content = $message[$type]['caption'] ?? null;
                break;
            case 'location':
                $lat = $message['location']['latitude'] ?? 0;
                $lon = $message['location']['longitude'] ?? 0;
                $content = "Location: {$lat}, {$lon}";
                break;
            case 'contacts':
                $content = 'Contact shared';
                break;
            case 'button':
                $content = $message['button']['text'] ?? 'Button clicked';
                break;
            case 'interactive':
                $interactiveType = $message['interactive']['type'] ?? '';
                if ($interactiveType === 'button_reply') {
                    $content = $message['interactive']['button_reply']['title'] ?? 'Button clicked';
                } elseif ($interactiveType === 'list_reply') {
                    $content = $message['interactive']['list_reply']['title'] ?? 'List item selected';
                }
                break;
        }
        
        // Get contact name from webhook data
        $contacts = $value['contacts'] ?? [];
        $contactName = null;
        foreach ($contacts as $contact) {
            if (($contact['wa_id'] ?? '') === $from) {
                $contactName = $contact['profile']['name'] ?? null;
                break;
            }
        }
        
        // Try to find existing contact by phone
        $contactId = null;
        $stmt = $pdo->prepare("
            SELECT id FROM contacts 
            WHERE (whatsapp_number = ? OR phone = ? OR phone = ?)
            AND (user_id = ? OR workspace_id = ?)
            LIMIT 1
        ");
        $normalizedPhone = '+' . ltrim($from, '+');
        $stmt->execute([$from, $from, $normalizedPhone, $account['user_id'], $account['workspace_id']]);
        $existingContact = $stmt->fetch();
        if ($existingContact) {
            $contactId = $existingContact['id'];
        }
        
        // Insert the message
        $stmt = $pdo->prepare("
            INSERT INTO channel_messages 
            (user_id, workspace_id, channel_account_id, channel, direction, contact_id,
             recipient_address, recipient_name, message_type, content, media_id, media_type,
             status, provider_message_id, received_at, created_at, updated_at)
            VALUES (?, ?, ?, 'whatsapp', 'inbound', ?, ?, ?, ?, ?, ?, ?, 'received', ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        ");
        $stmt->execute([
            $account['user_id'],
            $account['workspace_id'],
            $account['id'],
            $contactId,
            $from,
            $contactName,
            $type,
            $content,
            $mediaId,
            $mediaType,
            $messageId,
            date('Y-m-d H:i:s', $timestamp),
        ]);
        $dbMessageId = $pdo->lastInsertId();
        
        // Update or create conversation
        self::updateConversation($account, $from, $contactName, $contactId, $content, 'inbound');
        
        // Check for opt-out keywords
        if ($type === 'text' && $content) {
            self::checkOptOutKeywords($account, $from, $contactId, $content);
        }
        
        // Trigger automations for inbound message
        self::triggerAutomations($account, 'message_received', [
            'message_id' => $dbMessageId,
            'from' => $from,
            'content' => $content,
            'type' => $type,
            'contact_id' => $contactId,
        ]);
    }
    
    /**
     * Process WhatsApp message status update
     */
    private static function processWhatsAppStatus(array $account, array $status): void {
        $pdo = Database::conn();
        
        $messageId = $status['id'] ?? null;
        $statusValue = $status['status'] ?? null;
        $timestamp = $status['timestamp'] ?? time();
        $recipientId = $status['recipient_id'] ?? null;
        
        if (!$messageId || !$statusValue) {
            return;
        }
        
        // Map Meta status to our status
        $statusMap = [
            'sent' => 'sent',
            'delivered' => 'delivered',
            'read' => 'read',
            'failed' => 'failed',
        ];
        
        $dbStatus = $statusMap[$statusValue] ?? null;
        if (!$dbStatus) {
            return;
        }
        
        // Update the message
        $timestampField = $dbStatus . '_at';
        $validFields = ['sent_at', 'delivered_at', 'read_at'];
        
        if (in_array($timestampField, $validFields)) {
            $stmt = $pdo->prepare("
                UPDATE channel_messages 
                SET status = ?, {$timestampField} = ?, status_updated_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
                WHERE provider_message_id = ?
            ");
            $stmt->execute([$dbStatus, date('Y-m-d H:i:s', $timestamp), $messageId]);
        } else {
            $stmt = $pdo->prepare("
                UPDATE channel_messages 
                SET status = ?, status_updated_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
                WHERE provider_message_id = ?
            ");
            $stmt->execute([$dbStatus, $messageId]);
        }
        
        // Handle failed status
        if ($statusValue === 'failed') {
            $errors = $status['errors'] ?? [];
            $errorCode = $errors[0]['code'] ?? null;
            $errorMessage = $errors[0]['title'] ?? $errors[0]['message'] ?? 'Unknown error';
            
            $stmt = $pdo->prepare("
                UPDATE channel_messages 
                SET error_code = ?, error_message = ?
                WHERE provider_message_id = ?
            ");
            $stmt->execute([$errorCode, $errorMessage, $messageId]);
        }
        
        // Trigger automations for status changes
        $triggerType = "message_{$statusValue}";
        self::triggerAutomations($account, $triggerType, [
            'message_id' => $messageId,
            'recipient' => $recipientId,
        ]);
    }
    
    /**
     * Process Messenger webhook event
     */
    private static function processMessengerEvent(array $event, array $entry): void {
        $pdo = Database::conn();
        
        $pageId = $entry['id'] ?? null;
        if (!$pageId) {
            return;
        }
        
        // Find the account
        $stmt = $pdo->prepare("
            SELECT * FROM channel_accounts 
            WHERE channel = 'messenger' AND external_id = ? AND status = 'active'
        ");
        $stmt->execute([$pageId]);
        $account = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$account) {
            error_log("Messenger webhook: No account found for page_id: {$pageId}");
            return;
        }
        
        // Update last webhook timestamp
        $stmt = $pdo->prepare("UPDATE channel_accounts SET last_webhook_at = CURRENT_TIMESTAMP WHERE id = ?");
        $stmt->execute([$account['id']]);
        
        // Handle different event types
        if (isset($event['message'])) {
            self::processMessengerMessage($account, $event);
        } elseif (isset($event['delivery'])) {
            self::processMessengerDelivery($account, $event);
        } elseif (isset($event['read'])) {
            self::processMessengerRead($account, $event);
        } elseif (isset($event['postback'])) {
            self::processMessengerPostback($account, $event);
        }
    }
    
    /**
     * Process incoming Messenger message
     */
    private static function processMessengerMessage(array $account, array $event): void {
        $pdo = Database::conn();
        
        $senderId = $event['sender']['id'] ?? null;
        $message = $event['message'] ?? [];
        $messageId = $message['mid'] ?? null;
        $timestamp = $event['timestamp'] ?? time() * 1000;
        
        if (!$senderId || !$messageId) {
            return;
        }
        
        // Check if already processed
        $stmt = $pdo->prepare("SELECT id FROM channel_messages WHERE provider_message_id = ?");
        $stmt->execute([$messageId]);
        if ($stmt->fetch()) {
            return;
        }
        
        // Extract content
        $content = $message['text'] ?? null;
        $type = 'text';
        $mediaUrl = null;
        $mediaType = null;
        
        if (isset($message['attachments'])) {
            $attachment = $message['attachments'][0] ?? [];
            $type = $attachment['type'] ?? 'attachment';
            $mediaUrl = $attachment['payload']['url'] ?? null;
            $mediaType = $type;
        }
        
        // Try to find contact by PSID
        $contactId = null;
        $stmt = $pdo->prepare("
            SELECT id FROM contacts 
            WHERE messenger_psid = ?
            AND (user_id = ? OR workspace_id = ?)
            LIMIT 1
        ");
        $stmt->execute([$senderId, $account['user_id'], $account['workspace_id']]);
        $existingContact = $stmt->fetch();
        if ($existingContact) {
            $contactId = $existingContact['id'];
        }
        
        // Insert message
        $stmt = $pdo->prepare("
            INSERT INTO channel_messages 
            (user_id, workspace_id, channel_account_id, channel, direction, contact_id,
             recipient_address, message_type, content, media_url, media_type,
             status, provider_message_id, received_at, created_at, updated_at)
            VALUES (?, ?, ?, 'messenger', 'inbound', ?, ?, ?, ?, ?, ?, 'received', ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        ");
        $stmt->execute([
            $account['user_id'],
            $account['workspace_id'],
            $account['id'],
            $contactId,
            $senderId,
            $type,
            $content,
            $mediaUrl,
            $mediaType,
            $messageId,
            date('Y-m-d H:i:s', $timestamp / 1000),
        ]);
        
        // Update conversation
        self::updateConversation($account, $senderId, null, $contactId, $content, 'inbound');
        
        // Trigger automations
        self::triggerAutomations($account, 'message_received', [
            'from' => $senderId,
            'content' => $content,
            'type' => $type,
            'contact_id' => $contactId,
        ]);
    }
    
    /**
     * Process Messenger delivery receipt
     */
    private static function processMessengerDelivery(array $account, array $event): void {
        $pdo = Database::conn();
        
        $delivery = $event['delivery'] ?? [];
        $mids = $delivery['mids'] ?? [];
        $watermark = $delivery['watermark'] ?? null;
        
        foreach ($mids as $mid) {
            $stmt = $pdo->prepare("
                UPDATE channel_messages 
                SET status = 'delivered', delivered_at = CURRENT_TIMESTAMP, status_updated_at = CURRENT_TIMESTAMP
                WHERE provider_message_id = ? AND status IN ('queued', 'sent')
            ");
            $stmt->execute([$mid]);
        }
    }
    
    /**
     * Process Messenger read receipt
     */
    private static function processMessengerRead(array $account, array $event): void {
        $pdo = Database::conn();
        
        $read = $event['read'] ?? [];
        $watermark = $read['watermark'] ?? null;
        $senderId = $event['sender']['id'] ?? null;
        
        if ($watermark && $senderId) {
            // Mark all messages before watermark as read
            $stmt = $pdo->prepare("
                UPDATE channel_messages 
                SET status = 'read', read_at = CURRENT_TIMESTAMP, status_updated_at = CURRENT_TIMESTAMP
                WHERE channel_account_id = ? AND recipient_address = ? AND direction = 'outbound'
                AND status IN ('sent', 'delivered')
                AND UNIX_TIMESTAMP(sent_at) * 1000 <= ?
            ");
            $stmt->execute([$account['id'], $senderId, $watermark]);
        }
    }
    
    /**
     * Process Messenger postback (button click)
     */
    private static function processMessengerPostback(array $account, array $event): void {
        $postback = $event['postback'] ?? [];
        $payload = $postback['payload'] ?? null;
        $senderId = $event['sender']['id'] ?? null;
        
        if ($payload && $senderId) {
            self::triggerAutomations($account, 'postback', [
                'from' => $senderId,
                'payload' => $payload,
            ]);
        }
    }
    
    // ==================== HELPER METHODS ====================
    
    /**
     * Update or create conversation record
     */
    private static function updateConversation(
        array $account, 
        string $participantAddress, 
        ?string $participantName, 
        ?int $contactId, 
        ?string $messagePreview,
        string $direction
    ): void {
        $pdo = Database::conn();
        
        // Check if conversation exists
        $stmt = $pdo->prepare("
            SELECT id, unread_count FROM channel_conversations 
            WHERE channel_account_id = ? AND participant_address = ?
        ");
        $stmt->execute([$account['id'], $participantAddress]);
        $existing = $stmt->fetch(PDO::FETCH_ASSOC);
        
        $unreadIncrement = ($direction === 'inbound') ? 1 : 0;
        
        if ($existing) {
            $stmt = $pdo->prepare("
                UPDATE channel_conversations SET
                    participant_name = COALESCE(?, participant_name),
                    contact_id = COALESCE(?, contact_id),
                    last_message_preview = ?,
                    last_message_at = CURRENT_TIMESTAMP,
                    last_message_direction = ?,
                    unread_count = unread_count + ?,
                    status = 'open',
                    window_expires_at = DATE_ADD(CURRENT_TIMESTAMP, INTERVAL 24 HOUR),
                    can_send_template_only = FALSE,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            ");
            $stmt->execute([
                $participantName,
                $contactId,
                substr($messagePreview ?? '', 0, 200),
                $direction,
                $unreadIncrement,
                $existing['id'],
            ]);
        } else {
            $stmt = $pdo->prepare("
                INSERT INTO channel_conversations 
                (user_id, workspace_id, channel_account_id, channel, contact_id,
                 participant_address, participant_name, status, unread_count,
                 last_message_preview, last_message_at, last_message_direction,
                 window_expires_at, can_send_template_only, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, 'open', ?, ?, CURRENT_TIMESTAMP, ?, 
                        DATE_ADD(CURRENT_TIMESTAMP, INTERVAL 24 HOUR), FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            ");
            $stmt->execute([
                $account['user_id'],
                $account['workspace_id'],
                $account['id'],
                $account['channel'] ?? 'whatsapp',
                $contactId,
                $participantAddress,
                $participantName,
                $unreadIncrement,
                substr($messagePreview ?? '', 0, 200),
                $direction,
            ]);
        }
    }
    
    /**
     * Check for opt-out keywords
     */
    private static function checkOptOutKeywords(array $account, string $from, ?int $contactId, string $content): void {
        $pdo = Database::conn();
        
        // Get channel settings for opt-out keywords
        $stmt = $pdo->prepare("
            SELECT settings FROM channel_settings 
            WHERE channel = 'whatsapp' AND (workspace_id = ? OR workspace_id IS NULL)
            ORDER BY workspace_id DESC LIMIT 1
        ");
        $stmt->execute([$account['workspace_id']]);
        $settings = $stmt->fetch(PDO::FETCH_ASSOC);
        
        $stopKeywords = ['STOP', 'UNSUBSCRIBE', 'CANCEL', 'END', 'QUIT'];
        if ($settings) {
            $settingsData = json_decode($settings['settings'], true);
            $stopKeywords = $settingsData['stop_keywords'] ?? $stopKeywords;
        }
        
        $normalizedContent = strtoupper(trim($content));
        
        if (in_array($normalizedContent, $stopKeywords)) {
            // Update opt-in status
            if ($contactId) {
                $stmt = $pdo->prepare("
                    INSERT INTO contact_channel_optins 
                    (user_id, workspace_id, contact_id, channel, channel_address, status, opted_out_at, consent_source, created_at, updated_at)
                    VALUES (?, ?, ?, 'whatsapp', ?, 'opted_out', CURRENT_TIMESTAMP, 'keyword', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                    ON DUPLICATE KEY UPDATE status = 'opted_out', opted_out_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
                ");
                $stmt->execute([$account['user_id'], $account['workspace_id'], $contactId, $from]);
                
                // Update contact record
                $stmt = $pdo->prepare("UPDATE contacts SET whatsapp_opted_in = FALSE WHERE id = ?");
                $stmt->execute([$contactId]);
            }
            
            // Trigger opt-out automation
            self::triggerAutomations($account, 'opted_out', [
                'from' => $from,
                'contact_id' => $contactId,
                'keyword' => $normalizedContent,
            ]);
        }
    }
    
    /**
     * Trigger automations for an event
     */
    private static function triggerAutomations(array $account, string $triggerType, array $data): void {
        // This would integrate with FollowUpAutomationsController::processTrigger
        // For now, we'll queue it for the automation processor
        
        $pdo = Database::conn();
        
        // Find matching automations
        $channel = $account['channel'] ?? 'whatsapp';
        
        $stmt = $pdo->prepare("
            SELECT * FROM followup_automations 
            WHERE user_id = ? AND channel = ? AND trigger_type = ? AND is_active = 1
            ORDER BY priority DESC
        ");
        $stmt->execute([$account['user_id'], $channel, $triggerType]);
        $automations = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        foreach ($automations as $automation) {
            // Queue the automation execution
            $stmt = $pdo->prepare("
                INSERT INTO automation_executions 
                (automation_id, contact_id, trigger_event, trigger_data, status, scheduled_at, created_at)
                VALUES (?, ?, ?, ?, 'pending', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            ");
            $stmt->execute([
                $automation['id'],
                $data['contact_id'] ?? null,
                $triggerType,
                json_encode($data),
            ]);
        }
    }
}
