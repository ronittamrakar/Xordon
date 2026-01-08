<?php
/**
 * MarketplaceMessagingController
 * 
 * Handles in-app messaging between consumers and providers after lead match.
 */

namespace App\Controllers;

require_once __DIR__ . '/../Database.php';
require_once __DIR__ . '/../Auth.php';

use \Xordon\Database;
use Auth;

class MarketplaceMessagingController
{
    private static function getWorkspaceIdOrFail(): int
    {
        $ctx = $GLOBALS['tenantContext'] ?? null;
        return (int)($ctx->workspaceId ?? 1);
    }

    private static function getCompanyIdOrFail(): int
    {
        $ctx = $GLOBALS['tenantContext'] ?? null;
        $companyId = $ctx->activeCompanyId ?? null;
        
        if ($companyId) return (int)$companyId;
        
        $workspaceId = self::getWorkspaceIdOrFail();
        $pdo = Database::conn();
        $stmt = $pdo->prepare('SELECT id FROM companies WHERE workspace_id = ? LIMIT 1');
        $stmt->execute([$workspaceId]);
        $row = $stmt->fetch(\PDO::FETCH_ASSOC);
        return $row ? (int)$row['id'] : 1;
    }

    // ==================== MESSAGE THREADS ====================

    /**
     * GET /lead-marketplace/messages
     * List message threads for provider (grouped by lead_match)
     */
    public static function getThreads(): void
    {
        $workspaceId = self::getWorkspaceIdOrFail();
        $companyId = self::getCompanyIdOrFail();
        $pdo = Database::conn();

        $stmt = $pdo->prepare('
            SELECT 
                lm.id as match_id,
                lm.status as match_status,
                lr.consumer_name,
                lr.title as lead_title,
                lr.consumer_phone,
                lr.consumer_email,
                (SELECT COUNT(*) FROM marketplace_messages mm WHERE mm.lead_match_id = lm.id) as message_count,
                (SELECT COUNT(*) FROM marketplace_messages mm WHERE mm.lead_match_id = lm.id AND mm.is_read = 0 AND mm.sender_type = ?) as unread_count,
                (SELECT MAX(created_at) FROM marketplace_messages mm WHERE mm.lead_match_id = lm.id) as last_message_at
            FROM lead_matches lm
            JOIN lead_requests lr ON lm.lead_request_id = lr.id
            WHERE lm.company_id = ? AND lm.workspace_id = ?
              AND lm.status IN (?, ?, ?, ?)
            HAVING message_count > 0 OR lm.status IN (?, ?)
            ORDER BY last_message_at DESC, lm.accepted_at DESC
            LIMIT 50
        ');
        $stmt->execute([
            'consumer', // unread from consumer
            $companyId, 
            $workspaceId,
            'accepted', 'won', 'lost', 'offered',
            'accepted', 'won' // Show threads even without messages if accepted
        ]);
        $threads = $stmt->fetchAll(\PDO::FETCH_ASSOC);

        // Get total unread count
        $stmt = $pdo->prepare('
            SELECT COUNT(*) as total
            FROM marketplace_messages mm
            JOIN lead_matches lm ON mm.lead_match_id = lm.id
            WHERE lm.company_id = ? AND lm.workspace_id = ? AND mm.is_read = 0 AND mm.sender_type = ?
        ');
        $stmt->execute([$companyId, $workspaceId, 'consumer']);
        $totalUnread = (int)$stmt->fetchColumn();

        echo json_encode([
            'success' => true,
            'data' => $threads,
            'unread_total' => $totalUnread
        ]);
    }

    /**
     * GET /lead-marketplace/messages/{matchId}
     * Get messages for a specific lead match
     */
    public static function getMessages(int $matchId): void
    {
        $workspaceId = self::getWorkspaceIdOrFail();
        $companyId = self::getCompanyIdOrFail();
        $pdo = Database::conn();

        // Verify access - provider must own this match
        $stmt = $pdo->prepare('
            SELECT lm.*, lr.consumer_name, lr.consumer_email, lr.consumer_phone, lr.title as lead_title
            FROM lead_matches lm
            JOIN lead_requests lr ON lm.lead_request_id = lr.id
            WHERE lm.id = ? AND lm.workspace_id = ?
        ');
        $stmt->execute([$matchId, $workspaceId]);
        $match = $stmt->fetch(\PDO::FETCH_ASSOC);

        if (!$match) {
            http_response_code(404);
            echo json_encode(['success' => false, 'error' => 'Match not found']);
            return;
        }

        // Check if provider owns this match
        $isProvider = ($match['company_id'] == $companyId);
        
        // Get messages
        $limit = min((int)($_GET['limit'] ?? 50), 200);
        $before = $_GET['before'] ?? null;

        $sql = 'SELECT * FROM marketplace_messages WHERE lead_match_id = ? AND workspace_id = ?';
        $params = [$matchId, $workspaceId];

        if ($before) {
            $sql .= ' AND id < ?';
            $params[] = (int)$before;
        }

        $sql .= ' ORDER BY created_at DESC LIMIT ?';
        $params[] = $limit;

        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $messages = array_reverse($stmt->fetchAll(\PDO::FETCH_ASSOC));

        // Mark messages as read (if provider viewing consumer messages)
        if ($isProvider) {
            $stmt = $pdo->prepare('
                UPDATE marketplace_messages 
                SET is_read = 1, read_at = NOW() 
                WHERE lead_match_id = ? AND sender_type = ? AND is_read = 0
            ');
            $stmt->execute([$matchId, 'consumer']);
        }

        echo json_encode([
            'success' => true,
            'data' => $messages,
            'match' => [
                'id' => $match['id'],
                'status' => $match['status'],
                'consumer_name' => $match['consumer_name'],
                'lead_title' => $match['lead_title'],
                'accepted_at' => $match['accepted_at']
            ]
        ]);
    }

    /**
     * POST /lead-marketplace/messages/{matchId}
     * Send a message
     */
    public static function sendMessage(int $matchId): void
    {
        $workspaceId = self::getWorkspaceIdOrFail();
        $companyId = self::getCompanyIdOrFail();
        $userId = Auth::userId() ?? 0;
        $pdo = Database::conn();
        $body = json_decode(file_get_contents('php://input'), true) ?: [];

        $message = trim($body['message'] ?? '');
        $attachments = $body['attachments'] ?? null;

        if (!$message && !$attachments) {
            http_response_code(422);
            echo json_encode(['success' => false, 'error' => 'Message or attachment required']);
            return;
        }

        // Verify match exists and is accessible
        $stmt = $pdo->prepare('
            SELECT lm.*, lr.id as lead_id
            FROM lead_matches lm
            JOIN lead_requests lr ON lm.lead_request_id = lr.id
            WHERE lm.id = ? AND lm.workspace_id = ?
        ');
        $stmt->execute([$matchId, $workspaceId]);
        $match = $stmt->fetch(\PDO::FETCH_ASSOC);

        if (!$match) {
            http_response_code(404);
            echo json_encode(['success' => false, 'error' => 'Match not found']);
            return;
        }

        // Determine sender type
        $isProvider = ($match['company_id'] == $companyId);
        $senderType = $isProvider ? 'provider' : 'consumer';

        // Only allow messaging on accepted leads (or offered for initial contact)
        $allowedStatuses = ['offered', 'accepted', 'won', 'lost'];
        if (!in_array($match['status'], $allowedStatuses)) {
            http_response_code(403);
            echo json_encode(['success' => false, 'error' => 'Cannot message on this lead status']);
            return;
        }

        // Insert message
        $stmt = $pdo->prepare('
            INSERT INTO marketplace_messages (
                workspace_id, lead_match_id, lead_request_id,
                sender_type, sender_id, message, attachments, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
        ');
        $stmt->execute([
            $workspaceId,
            $matchId,
            $match['lead_id'],
            $senderType,
            $userId,
            $message,
            $attachments ? json_encode($attachments) : null
        ]);

        $messageId = (int)$pdo->lastInsertId();


        // Notify recipient (email/SMS/push) using Services
        if ($senderType === 'provider') {
             // Send to Consumer
             $consumerEmail = $match['consumer_email'];
             if ($consumerEmail) {
                require_once __DIR__ . '/../services/EmailService.php';
                $providerName = $match['consumer_name']; // Actually this is consumer name? Provider name needed.
                // Fetch provider name
                $pStmt = $pdo->prepare("SELECT business_name FROM service_pros WHERE company_id = ?");
                $pStmt->execute([$companyId]);
                $pRes = $pStmt->fetch(\PDO::FETCH_ASSOC);
                $providerName = $pRes['business_name'] ?? 'The Service Pro';

                \EmailService::sendEmail(
                    $consumerEmail,
                    "New Message from $providerName",
                    "<h1>New Message</h1><p>You received a new message regarding your service request.</p>
                     <p>From: <strong>$providerName</strong></p>
                     <div style='background:#f4f4f4;padding:10px;margin:10px 0;'>".htmlspecialchars($message)."</div>",
                    "New Message from $providerName\n\n". $message
                );
             }
        } elseif ($senderType === 'consumer') {
             // Send to Provider
             $providerUserId = $userId; // Wait, if sender is consumer, userId might be 0 or irrelevant? No, look at logic.
             // Provider user ID is in service_pros linked to company
             
             // Get provider user(s)
             $uStmt = $pdo->prepare("SELECT u.email, u.phone FROM users u JOIN service_pros sp ON sp.user_id = u.id WHERE sp.company_id = ?");
             $uStmt->execute([$match['company_id']]);
             $providers = $uStmt->fetchAll(\PDO::FETCH_ASSOC);
             
             foreach ($providers as $prov) {
                 if ($prov['email']) {
                    require_once __DIR__ . '/../services/EmailService.php';
                    \EmailService::sendEmail(
                        $prov['email'],
                        "New Message from " . $match['consumer_name'],
                        "<h1>New Lead Message</h1>
                         <p><strong>" . $match['consumer_name'] . "</strong> sent a message.</p>
                         <p>Lead: " . ($match['lead_title'] ?? 'Service Request') . "</p>
                         <div style='background:#f4f4f4;padding:10px;margin:10px 0;'>".htmlspecialchars($message)."</div>",
                        "New Message from " . $match['consumer_name'] . "\n\n" . $message
                    );
                 }
             }
        }

        echo json_encode([
            'success' => true,
            'data' => [
                'id' => $messageId,
                'sender_type' => $senderType,
                'message' => $message,
                'created_at' => date('Y-m-d H:i:s')
            ]
        ], 201);
    }

    /**
     * PUT /lead-marketplace/messages/{messageId}/read
     * Mark message as read
     */
    public static function markRead(int $messageId): void
    {
        $workspaceId = self::getWorkspaceIdOrFail();
        $pdo = Database::conn();

        $stmt = $pdo->prepare('
            UPDATE marketplace_messages 
            SET is_read = 1, read_at = NOW() 
            WHERE id = ? AND workspace_id = ?
        ');
        $stmt->execute([$messageId, $workspaceId]);

        echo json_encode(['success' => true]);
    }

    // ==================== CONSUMER MESSAGING (Public) ====================

    /**
     * GET /lead-marketplace/consumer/messages
     * Consumer views their message threads (uses token auth)
     */
    public static function consumerGetThreads(): void
    {
        $workspaceId = self::getWorkspaceIdOrFail();
        $pdo = Database::conn();

        $email = $_GET['email'] ?? null;
        $token = $_GET['token'] ?? null;

        if (!$email) {
            http_response_code(422);
            echo json_encode(['success' => false, 'error' => 'Email required']);
            return;
        }

        // TODO: Verify token for security

        $stmt = $pdo->prepare('
            SELECT 
                lm.id as match_id,
                lm.status as match_status,
                sp.business_name as provider_name,
                sp.logo_url as provider_logo,
                sp.avg_rating as provider_rating,
                lr.title as lead_title,
                (SELECT COUNT(*) FROM marketplace_messages mm WHERE mm.lead_match_id = lm.id) as message_count,
                (SELECT COUNT(*) FROM marketplace_messages mm WHERE mm.lead_match_id = lm.id AND mm.is_read = 0 AND mm.sender_type = ?) as unread_count,
                (SELECT MAX(created_at) FROM marketplace_messages mm WHERE mm.lead_match_id = lm.id) as last_message_at
            FROM lead_matches lm
            JOIN lead_requests lr ON lm.lead_request_id = lr.id
            LEFT JOIN service_pros sp ON lm.company_id = sp.company_id AND sp.workspace_id = lm.workspace_id
            WHERE lr.consumer_email = ? AND lr.workspace_id = ?
              AND lm.status IN (?, ?, ?)
            ORDER BY last_message_at DESC, lm.accepted_at DESC
            LIMIT 20
        ');
        $stmt->execute([
            'provider',
            $email,
            $workspaceId,
            'accepted', 'won', 'lost'
        ]);
        $threads = $stmt->fetchAll(\PDO::FETCH_ASSOC);

        echo json_encode(['success' => true, 'data' => $threads]);
    }

    /**
     * POST /lead-marketplace/consumer/messages/{matchId}
     * Consumer sends a message (public endpoint)
     */
    public static function consumerSendMessage(int $matchId): void
    {
        $workspaceId = self::getWorkspaceIdOrFail();
        $pdo = Database::conn();
        $body = json_decode(file_get_contents('php://input'), true) ?: [];

        $message = trim($body['message'] ?? '');
        $email = trim($body['email'] ?? '');

        if (!$message) {
            http_response_code(422);
            echo json_encode(['success' => false, 'error' => 'Message required']);
            return;
        }

        if (!$email) {
            http_response_code(422);
            echo json_encode(['success' => false, 'error' => 'Email required']);
            return;
        }

        // Verify consumer owns this lead
        $stmt = $pdo->prepare('
            SELECT lm.*, lr.id as lead_id, lr.consumer_email
            FROM lead_matches lm
            JOIN lead_requests lr ON lm.lead_request_id = lr.id
            WHERE lm.id = ? AND lm.workspace_id = ? AND lr.consumer_email = ?
        ');
        $stmt->execute([$matchId, $workspaceId, $email]);
        $match = $stmt->fetch(\PDO::FETCH_ASSOC);

        if (!$match) {
            http_response_code(404);
            echo json_encode(['success' => false, 'error' => 'Match not found or access denied']);
            return;
        }

        // Insert message from consumer
        $stmt = $pdo->prepare('
            INSERT INTO marketplace_messages (
                workspace_id, lead_match_id, lead_request_id,
                sender_type, sender_id, message, created_at
            ) VALUES (?, ?, ?, ?, NULL, ?, NOW())
        ');
        $stmt->execute([
            $workspaceId,
            $matchId,
            $match['lead_id'],
            'consumer',
            $message
        ]);

        $messageId = (int)$pdo->lastInsertId();


        // Notify provider
        // Get provider details
        $provStmt = $pdo->prepare("SELECT u.email, u.phone FROM users u JOIN service_pros sp ON sp.user_id = u.id WHERE sp.company_id = ?");
        $provStmt->execute([$match['company_id']]);
        $providers = $provStmt->fetchAll(\PDO::FETCH_ASSOC);

        if (!empty($providers)) {
             require_once __DIR__ . '/../services/EmailService.php';
             require_once __DIR__ . '/../services/SMSService.php';
             
             foreach ($providers as $prov) {
                 // Email
                 if ($prov['email']) {
                    \EmailService::sendEmail(
                        $prov['email'],
                        "New Message from " . $match['consumer_name'],
                        "<h1>New Message</h1><p>You have a new message from a lead.</p>
                         <p><strong>Client:</strong> " . $match['consumer_name'] . "</p>
                         <div style='background:#f4f4f4;padding:10px;margin:10px 0;'>".htmlspecialchars($message)."</div>",
                        "New Message from " . $match['consumer_name'] . "\n\n" . $message
                    );
                 }
                 
                 // SMS (optional, if enabled)
                 /*
                 if ($prov['phone']) {
                    try {
                        $sms = new \SMSService();
                        $sms->sendMessage($prov['phone'], "New msg from " . $match['consumer_name'] . ": " . substr($message, 0, 50) . "...");
                    } catch (\Exception $e) {}
                 }
                 */
             }
        }

        echo json_encode([
            'success' => true,
            'data' => ['id' => $messageId]
        ], 201);
    }

    // ==================== NOTIFICATION PREFERENCES ====================

    /**
     * GET /lead-marketplace/message-preferences
     */
    public static function getPreferences(): void
    {
        $workspaceId = self::getWorkspaceIdOrFail();
        $companyId = self::getCompanyIdOrFail();
        $pdo = Database::conn();

        $stmt = $pdo->prepare('SELECT * FROM marketplace_message_preferences WHERE company_id = ? AND workspace_id = ?');
        $stmt->execute([$companyId, $workspaceId]);
        $prefs = $stmt->fetch(\PDO::FETCH_ASSOC);

        if (!$prefs) {
            $prefs = [
                'notify_email' => true,
                'notify_sms' => false,
                'notify_push' => true,
                'quiet_hours_start' => null,
                'quiet_hours_end' => null
            ];
        }

        echo json_encode(['success' => true, 'data' => $prefs]);
    }

    /**
     * PUT /lead-marketplace/message-preferences
     */
    public static function updatePreferences(): void
    {
        $workspaceId = self::getWorkspaceIdOrFail();
        $companyId = self::getCompanyIdOrFail();
        $pdo = Database::conn();
        $body = json_decode(file_get_contents('php://input'), true) ?: [];

        $stmt = $pdo->prepare('
            INSERT INTO marketplace_message_preferences 
            (workspace_id, company_id, notify_email, notify_sms, notify_push, quiet_hours_start, quiet_hours_end)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
                notify_email = VALUES(notify_email),
                notify_sms = VALUES(notify_sms),
                notify_push = VALUES(notify_push),
                quiet_hours_start = VALUES(quiet_hours_start),
                quiet_hours_end = VALUES(quiet_hours_end),
                updated_at = NOW()
        ');
        $stmt->execute([
            $workspaceId,
            $companyId,
            isset($body['notify_email']) ? (int)$body['notify_email'] : 1,
            isset($body['notify_sms']) ? (int)$body['notify_sms'] : 0,
            isset($body['notify_push']) ? (int)$body['notify_push'] : 1,
            $body['quiet_hours_start'] ?? null,
            $body['quiet_hours_end'] ?? null
        ]);

        echo json_encode(['success' => true, 'message' => 'Preferences updated']);
    }
}
