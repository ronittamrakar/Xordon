<?php
/**
 * ConversationsController - Unified Inbox (GHL-style)
 * Handles conversations and messages across all channels
 */

require_once __DIR__ . '/../Database.php';
require_once __DIR__ . '/../Response.php';
require_once __DIR__ . '/../Auth.php';
require_once __DIR__ . '/../TenantContext.php';
require_once __DIR__ . '/../services/SMSService.php';
require_once __DIR__ . '/../services/EmailSender.php';

class ConversationsController {
    
    /**
     * Get workspace and company scope from TenantContext
     */
    private static function getScope(): array {
        $ctx = $GLOBALS['tenantContext'] ?? null;
        if (!$ctx || !isset($ctx->workspaceId)) {
            Response::error('Workspace context required', 403);
            exit;
        }
        return [
            'workspace_id' => (int)$ctx->workspaceId,
            'company_id' => $ctx->activeCompanyId ? (int)$ctx->activeCompanyId : null
        ];
    }
    
    /**
     * List conversations (inbox)
     * GET /conversations
     * Query params: status, assigned, unread, q, limit, offset
     */
    public static function index(): void {
        $userId = Auth::userIdOrFail();
        $scope = self::getScope();
        $pdo = Database::conn();
        
        $status = $_GET['status'] ?? null;
        $assigned = $_GET['assigned'] ?? null;
        $unreadOnly = isset($_GET['unread']) && $_GET['unread'] === 'true';
        $search = $_GET['q'] ?? null;
        $limit = min((int)($_GET['limit'] ?? 50), 100);
        $offset = (int)($_GET['offset'] ?? 0);
        
        $where = ['c.workspace_id = ?'];
        $params = [$scope['workspace_id']];
        
        if ($scope['company_id']) {
            $where[] = 'c.company_id = ?';
            $params[] = $scope['company_id'];
        }
        
        if ($status && in_array($status, ['open', 'pending', 'closed'])) {
            $where[] = 'c.status = ?';
            $params[] = $status;
        }
        
        if ($assigned === 'me') {
            $where[] = 'c.assigned_user_id = ?';
            $params[] = $userId;
        } elseif ($assigned === 'unassigned') {
            $where[] = 'c.assigned_user_id IS NULL';
        } elseif ($assigned && is_numeric($assigned)) {
            $where[] = 'c.assigned_user_id = ?';
            $params[] = (int)$assigned;
        }
        
        if ($unreadOnly) {
            $where[] = 'c.unread_count > 0';
        }
        
        if ($search) {
            $where[] = '(ct.first_name LIKE ? OR ct.last_name LIKE ? OR ct.email LIKE ? OR ct.phone LIKE ?)';
            $searchTerm = "%$search%";
            $params = array_merge($params, [$searchTerm, $searchTerm, $searchTerm, $searchTerm]);
        }
        
        $whereClause = implode(' AND ', $where);
        
        // Get total count
        $countSql = "SELECT COUNT(*) FROM conversations c 
                     LEFT JOIN contacts ct ON c.contact_id = ct.id 
                     WHERE $whereClause";
        $countStmt = $pdo->prepare($countSql);
        $countStmt->execute($params);
        $total = (int)$countStmt->fetchColumn();
        
        // Get conversations with contact info and last message preview
        $sql = "SELECT 
                    c.*,
                    ct.first_name as contact_first_name,
                    ct.last_name as contact_last_name,
                    ct.email as contact_email,
                    ct.phone as contact_phone,
                    NULL as contact_avatar,
                    u.name as assigned_user_name,
                    (SELECT body FROM conversation_messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message_preview,
                    (SELECT channel FROM conversation_messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message_channel
                FROM conversations c
                LEFT JOIN contacts ct ON c.contact_id = ct.id
                LEFT JOIN users u ON c.assigned_user_id = u.id
                WHERE $whereClause
                ORDER BY (c.last_message_at IS NULL) ASC, c.last_message_at DESC, c.created_at DESC
                LIMIT ? OFFSET ?";
        
        $params[] = $limit;
        $params[] = $offset;
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $conversations = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        Response::json([
            'success' => true,
            'data' => $conversations,
            'meta' => [
                'total' => $total,
                'limit' => $limit,
                'offset' => $offset
            ]
        ]);
    }
    
    /**
     * Get single conversation with messages
     * GET /conversations/:id
     */
    public static function show(int $id): void {
        $userId = Auth::userIdOrFail();
        $scope = self::getScope();
        $pdo = Database::conn();
        
        // Get conversation
        $sql = "SELECT 
                    c.*,
                    ct.first_name as contact_first_name,
                    ct.last_name as contact_last_name,
                    ct.email as contact_email,
                    ct.phone as contact_phone,
                    NULL as contact_avatar,
                    u.name as assigned_user_name
                FROM conversations c
                LEFT JOIN contacts ct ON c.contact_id = ct.id
                LEFT JOIN users u ON c.assigned_user_id = u.id
                WHERE c.id = ? AND c.workspace_id = ?";
        $params = [$id, $scope['workspace_id']];
        
        if ($scope['company_id']) {
            $sql .= ' AND c.company_id = ?';
            $params[] = $scope['company_id'];
        }
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $conversation = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$conversation) {
            Response::notFound('Conversation not found');
            return;
        }
        
        // Get messages
        $msgSql = "SELECT 
                        m.*,
                        CASE 
                            WHEN m.sender_type = 'user' THEN u.name
                            WHEN m.sender_type = 'contact' THEN CONCAT(ct.first_name, ' ', ct.last_name)
                            ELSE 'System'
                        END as sender_name
                   FROM conversation_messages m
                   LEFT JOIN users u ON m.sender_type = 'user' AND m.sender_id = u.id
                   LEFT JOIN contacts ct ON m.sender_type = 'contact' AND m.sender_id = ct.id
                   WHERE m.conversation_id = ?
                   ORDER BY m.created_at ASC";
        $msgStmt = $pdo->prepare($msgSql);
        $msgStmt->execute([$id]);
        $messages = $msgStmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Mark as read
        $updateSql = "UPDATE conversations SET unread_count = 0 WHERE id = ?";
        $pdo->prepare($updateSql)->execute([$id]);
        
        // Mark messages as read
        $markReadSql = "UPDATE conversation_messages SET read_at = NOW() WHERE conversation_id = ? AND read_at IS NULL AND direction = 'inbound'";
        $pdo->prepare($markReadSql)->execute([$id]);
        
        $conversation['messages'] = $messages;
        
        Response::json([
            'success' => true,
            'data' => $conversation
        ]);
    }
    
    /**
     * Create a new conversation (usually auto-created, but manual is allowed)
     * POST /conversations
     */
    public static function create(): void {
        $userId = Auth::userIdOrFail();
        $scope = self::getScope();
        $body = get_json_body();
        $pdo = Database::conn();
        
        if (empty($body['contact_id'])) {
            Response::validationError('contact_id is required');
            return;
        }
        
        $contactId = (int)$body['contact_id'];
        
        // Check if conversation already exists for this contact
        $existingSql = "SELECT id FROM conversations WHERE contact_id = ? AND workspace_id = ?";
        $existingParams = [$contactId, $scope['workspace_id']];
        if ($scope['company_id']) {
            $existingSql .= ' AND company_id = ?';
            $existingParams[] = $scope['company_id'];
        }
        $existingStmt = $pdo->prepare($existingSql);
        $existingStmt->execute($existingParams);
        $existing = $existingStmt->fetch();
        
        if ($existing) {
            Response::json([
                'success' => true,
                'data' => ['id' => $existing['id']],
                'message' => 'Conversation already exists'
            ]);
            return;
        }
        
        // Create new conversation
        $stmt = $pdo->prepare("
            INSERT INTO conversations (workspace_id, company_id, contact_id, assigned_user_id, status, created_at)
            VALUES (?, ?, ?, ?, 'open', NOW())
        ");
        $stmt->execute([
            $scope['workspace_id'],
            $scope['company_id'],
            $contactId,
            $body['assigned_user_id'] ?? null
        ]);
        
        $conversationId = (int)$pdo->lastInsertId();
        
        // Emit event
        self::emitEvent($pdo, $scope, 'conversation.created', 'conversation', $conversationId, [
            'contact_id' => $contactId
        ]);
        
        Response::json([
            'success' => true,
            'data' => ['id' => $conversationId],
            'message' => 'Conversation created'
        ], 201);
    }
    
    /**
     * Send a message in a conversation
     * POST /conversations/:id/messages
     */
    public static function sendMessage(int $conversationId): void {
        $userId = Auth::userIdOrFail();
        $scope = self::getScope();
        $body = get_json_body();
        $pdo = Database::conn();
        
        // Verify conversation exists and belongs to workspace
        $convSql = "SELECT * FROM conversations WHERE id = ? AND workspace_id = ?";
        $convParams = [$conversationId, $scope['workspace_id']];
        if ($scope['company_id']) {
            $convSql .= ' AND company_id = ?';
            $convParams[] = $scope['company_id'];
        }
        $convStmt = $pdo->prepare($convSql);
        $convStmt->execute($convParams);
        $conversation = $convStmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$conversation) {
            Response::notFound('Conversation not found');
            return;
        }
        
        $channel = $body['channel'] ?? 'note';
        $messageBody = $body['body'] ?? '';
        $subject = $body['subject'] ?? null;
        
        if (empty($messageBody) && $channel !== 'call') {
            Response::validationError('Message body is required');
            return;
        }
        
        // Insert message
        $stmt = $pdo->prepare("
            INSERT INTO conversation_messages 
            (workspace_id, company_id, conversation_id, channel, direction, sender_type, sender_id, subject, body, body_html, metadata, status, created_at)
            VALUES (?, ?, ?, ?, 'outbound', 'user', ?, ?, ?, ?, ?, 'pending', NOW())
        ");
        $stmt->execute([
            $scope['workspace_id'],
            $scope['company_id'],
            $conversationId,
            $channel,
            $userId,
            $subject,
            $messageBody,
            $body['body_html'] ?? null,
            isset($body['metadata']) ? json_encode($body['metadata']) : null
        ]);
        
        $messageId = (int)$pdo->lastInsertId();
        
        // Update conversation last_message_at
        $pdo->prepare("UPDATE conversations SET last_message_at = NOW(), status = 'open' WHERE id = ?")->execute([$conversationId]);
        
        // Actually send via SMS/Email provider based on channel
        $sentStatus = 'sent';
        $errorMessage = null;

        try {
            if ($channel === 'sms') {
                // Get contact phone
                $contactStmt = $pdo->prepare("SELECT phone FROM contacts WHERE id = ?");
                $contactStmt->execute([$conversation['contact_id']]);
                $contactPhone = $contactStmt->fetchColumn();

                if ($contactPhone) {
                    $smsService = new SMSService(null, (string)$userId);
                    $smsService->sendMessage($contactPhone, $messageBody);
                } else {
                    throw new Exception("Contact has no phone number");
                }
            } elseif ($channel === 'email') {
                // Get contact email
                $contactStmt = $pdo->prepare("SELECT email FROM contacts WHERE id = ?");
                $contactStmt->execute([$conversation['contact_id']]);
                $contactEmail = $contactStmt->fetchColumn();

                if ($contactEmail) {
                    $emailSender = new EmailSender();
                    // Get first active sending account for this user/workspace
                    $accStmt = $pdo->prepare("SELECT * FROM sending_accounts WHERE (user_id = ? OR workspace_id = ?) AND status = 'active' LIMIT 1");
                    $accStmt->execute([$userId, $scope['workspace_id']]);
                    $sendingAccount = $accStmt->fetch(PDO::FETCH_ASSOC);

                    if ($sendingAccount) {
                        $success = $emailSender->sendEmail($sendingAccount, $contactEmail, $subject ?? "Message from " . ($scope['company_name'] ?? 'Support'), $body['body_html'] ?? $messageBody);
                        if (!$success) throw new Exception("Email delivery failed");
                    } else {
                        throw new Exception("No active email sending account found");
                    }
                } else {
                    throw new Exception("Contact has no email address");
                }
            }
        } catch (Exception $e) {
            $sentStatus = 'failed';
            $errorMessage = $e->getMessage();
            error_log("Failed to send message: " . $errorMessage);
        }

        // Update message status
        $updateMsg = $pdo->prepare("UPDATE conversation_messages SET status = ?, error_message = ? WHERE id = ?");
        $updateMsg->execute([$sentStatus, $errorMessage, $messageId]);
        
        // Emit event
        self::emitEvent($pdo, $scope, 'message.sent', 'message', $messageId, [
            'conversation_id' => $conversationId,
            'channel' => $channel,
            'contact_id' => $conversation['contact_id']
        ]);
        
        Response::json([
            'success' => true,
            'data' => ['id' => $messageId],
            'message' => 'Message sent'
        ], 201);
    }
    
    /**
     * Add internal note to conversation
     * POST /conversations/:id/notes
     */
    public static function addNote(int $conversationId): void {
        $userId = Auth::userIdOrFail();
        $scope = self::getScope();
        $body = get_json_body();
        $pdo = Database::conn();
        
        // Verify conversation
        $convSql = "SELECT id FROM conversations WHERE id = ? AND workspace_id = ?";
        $convParams = [$conversationId, $scope['workspace_id']];
        if ($scope['company_id']) {
            $convSql .= ' AND company_id = ?';
            $convParams[] = $scope['company_id'];
        }
        $convStmt = $pdo->prepare($convSql);
        $convStmt->execute($convParams);
        if (!$convStmt->fetch()) {
            Response::notFound('Conversation not found');
            return;
        }
        
        if (empty($body['body'])) {
            Response::validationError('Note body is required');
            return;
        }
        
        $stmt = $pdo->prepare("
            INSERT INTO conversation_messages 
            (workspace_id, company_id, conversation_id, channel, direction, sender_type, sender_id, body, status, created_at)
            VALUES (?, ?, ?, 'note', 'system', 'user', ?, ?, 'sent', NOW())
        ");
        $stmt->execute([
            $scope['workspace_id'],
            $scope['company_id'],
            $conversationId,
            $userId,
            $body['body']
        ]);
        
        $noteId = (int)$pdo->lastInsertId();
        
        Response::json([
            'success' => true,
            'data' => ['id' => $noteId],
            'message' => 'Note added'
        ], 201);
    }
    
    /**
     * Assign conversation to a user
     * POST /conversations/:id/assign
     */
    public static function assign(int $conversationId): void {
        $userId = Auth::userIdOrFail();
        $scope = self::getScope();
        $body = get_json_body();
        $pdo = Database::conn();
        
        $assigneeId = isset($body['user_id']) ? (int)$body['user_id'] : null;
        
        $sql = "UPDATE conversations SET assigned_user_id = ?, updated_at = NOW() WHERE id = ? AND workspace_id = ?";
        $params = [$assigneeId, $conversationId, $scope['workspace_id']];
        if ($scope['company_id']) {
            $sql = "UPDATE conversations SET assigned_user_id = ?, updated_at = NOW() WHERE id = ? AND workspace_id = ? AND company_id = ?";
            $params[] = $scope['company_id'];
        }
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        
        if ($stmt->rowCount() === 0) {
            Response::notFound('Conversation not found');
            return;
        }
        
        // Emit event
        self::emitEvent($pdo, $scope, 'conversation.assigned', 'conversation', $conversationId, [
            'assigned_user_id' => $assigneeId,
            'assigned_by' => $userId
        ]);
        
        Response::json([
            'success' => true,
            'message' => 'Conversation assigned'
        ]);
    }
    
    /**
     * Update conversation status
     * POST /conversations/:id/status
     */
    public static function updateStatus(int $conversationId): void {
        $userId = Auth::userIdOrFail();
        $scope = self::getScope();
        $body = get_json_body();
        $pdo = Database::conn();
        
        $status = $body['status'] ?? null;
        if (!$status || !in_array($status, ['open', 'pending', 'closed'])) {
            Response::validationError('Valid status required (open, pending, closed)');
            return;
        }
        
        $sql = "UPDATE conversations SET status = ?, updated_at = NOW() WHERE id = ? AND workspace_id = ?";
        $params = [$status, $conversationId, $scope['workspace_id']];
        if ($scope['company_id']) {
            $sql = "UPDATE conversations SET status = ?, updated_at = NOW() WHERE id = ? AND workspace_id = ? AND company_id = ?";
            $params[] = $scope['company_id'];
        }
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        
        if ($stmt->rowCount() === 0) {
            Response::notFound('Conversation not found');
            return;
        }
        
        Response::json([
            'success' => true,
            'message' => 'Status updated'
        ]);
    }
    
    /**
     * Get or create conversation for a contact
     * POST /conversations/for-contact
     */
    public static function getOrCreateForContact(): void {
        $userId = Auth::userIdOrFail();
        $scope = self::getScope();
        $body = get_json_body();
        $pdo = Database::conn();
        
        if (empty($body['contact_id'])) {
            Response::validationError('contact_id is required');
            return;
        }
        
        $contactId = (int)$body['contact_id'];
        
        // Try to find existing
        $sql = "SELECT id FROM conversations WHERE contact_id = ? AND workspace_id = ?";
        $params = [$contactId, $scope['workspace_id']];
        if ($scope['company_id']) {
            $sql .= ' AND company_id = ?';
            $params[] = $scope['company_id'];
        }
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $existing = $stmt->fetch();
        
        if ($existing) {
            Response::json([
                'success' => true,
                'data' => ['id' => (int)$existing['id'], 'created' => false]
            ]);
            return;
        }
        
        // Create new
        $insertStmt = $pdo->prepare("
            INSERT INTO conversations (workspace_id, company_id, contact_id, status, created_at)
            VALUES (?, ?, ?, 'open', NOW())
        ");
        $insertStmt->execute([
            $scope['workspace_id'],
            $scope['company_id'],
            $contactId
        ]);
        
        $conversationId = (int)$pdo->lastInsertId();
        
        Response::json([
            'success' => true,
            'data' => ['id' => $conversationId, 'created' => true]
        ], 201);
    }
    
    /**
     * Receive inbound message (webhook/internal use)
     * POST /conversations/inbound
     */
    public static function receiveInbound(): void {
        $body = get_json_body();
        $pdo = Database::conn();
        
        // This would be called by SMS/email webhooks
        // Required: workspace_id, contact_id, channel, body
        $workspaceId = (int)($body['workspace_id'] ?? 0);
        $companyId = isset($body['company_id']) ? (int)$body['company_id'] : null;
        $contactId = (int)($body['contact_id'] ?? 0);
        $channel = $body['channel'] ?? 'sms';
        $messageBody = $body['body'] ?? '';
        
        if (!$workspaceId || !$contactId) {
            Response::validationError('workspace_id and contact_id required');
            return;
        }
        
        // Get or create conversation
        $sql = "SELECT id FROM conversations WHERE contact_id = ? AND workspace_id = ?";
        $params = [$contactId, $workspaceId];
        if ($companyId) {
            $sql .= ' AND company_id = ?';
            $params[] = $companyId;
        }
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $conv = $stmt->fetch();
        
        if ($conv) {
            $conversationId = (int)$conv['id'];
        } else {
            $insertStmt = $pdo->prepare("
                INSERT INTO conversations (workspace_id, company_id, contact_id, status, created_at)
                VALUES (?, ?, ?, 'open', NOW())
            ");
            $insertStmt->execute([$workspaceId, $companyId, $contactId]);
            $conversationId = (int)$pdo->lastInsertId();
        }
        
        // Insert inbound message
        $msgStmt = $pdo->prepare("
            INSERT INTO conversation_messages 
            (workspace_id, company_id, conversation_id, channel, direction, sender_type, sender_id, body, metadata, status, created_at)
            VALUES (?, ?, ?, ?, 'inbound', 'contact', ?, ?, ?, 'delivered', NOW())
        ");
        $msgStmt->execute([
            $workspaceId,
            $companyId,
            $conversationId,
            $channel,
            $contactId,
            $messageBody,
            isset($body['metadata']) ? json_encode($body['metadata']) : null
        ]);
        
        $messageId = (int)$pdo->lastInsertId();
        
        // Update conversation
        $pdo->prepare("
            UPDATE conversations 
            SET last_message_at = NOW(), unread_count = unread_count + 1, status = 'open' 
            WHERE id = ?
        ")->execute([$conversationId]);
        
        // Emit event
        $scope = ['workspace_id' => $workspaceId, 'company_id' => $companyId];
        self::emitEvent($pdo, $scope, 'message.received', 'message', $messageId, [
            'conversation_id' => $conversationId,
            'channel' => $channel,
            'contact_id' => $contactId
        ]);
        
        Response::json([
            'success' => true,
            'data' => [
                'conversation_id' => $conversationId,
                'message_id' => $messageId
            ]
        ], 201);
    }
    
    /**
     * Get inbox stats (counts by status)
     * GET /conversations/stats
     */
    public static function stats(): void {
        $userId = Auth::userIdOrFail();
        $scope = self::getScope();
        $pdo = Database::conn();
        
        $where = 'workspace_id = ?';
        $params = [$scope['workspace_id']];
        if ($scope['company_id']) {
            $where .= ' AND company_id = ?';
            $params[] = $scope['company_id'];
        }
        
        $sql = "SELECT 
                    COUNT(*) as total,
                    SUM(CASE WHEN status = 'open' THEN 1 ELSE 0 END) as open,
                    SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
                    SUM(CASE WHEN status = 'closed' THEN 1 ELSE 0 END) as closed,
                    SUM(CASE WHEN unread_count > 0 THEN 1 ELSE 0 END) as unread,
                    SUM(CASE WHEN assigned_user_id = ? THEN 1 ELSE 0 END) as assigned_to_me
                FROM conversations
                WHERE $where";
        
        $allParams = array_merge([$userId], $params);
        $stmt = $pdo->prepare($sql);
        $stmt->execute($allParams);
        $stats = $stmt->fetch(PDO::FETCH_ASSOC);
        
        Response::json([
            'success' => true,
            'data' => $stats
        ]);
    }
    
    /**
     * Helper: Emit business event
     */
    private static function emitEvent(PDO $pdo, array $scope, string $eventType, string $entityType, int $entityId, array $payload = []): void {
        try {
            $stmt = $pdo->prepare("
                INSERT INTO business_events (workspace_id, company_id, event_type, entity_type, entity_id, actor_type, actor_id, payload, created_at)
                VALUES (?, ?, ?, ?, ?, 'user', ?, ?, NOW())
            ");
            $stmt->execute([
                $scope['workspace_id'],
                $scope['company_id'] ?? null,
                $eventType,
                $entityType,
                $entityId,
                Auth::userId(),
                json_encode($payload)
            ]);
        } catch (Exception $e) {
            // Don't fail the main operation if event logging fails
            error_log("Failed to emit event: " . $e->getMessage());
        }
    }
}
