<?php

namespace Xordon\Controllers;

use Xordon\Core\Database;
use Xordon\Core\Auth;
use Xordon\Core\Response;

class OmniChannelController {
    
    // ============================================================================
    // FACEBOOK MESSENGER
    // ============================================================================
    
    public static function connectFacebookPage() {
        $data = json_decode(file_get_contents('php://input'), true);
        $ctx = $GLOBALS['tenantContext'] ?? null;
        
        if (!$ctx || !isset($ctx->workspaceId)) {
            return Response::error('Unauthorized', 401);
        }
        
        $db = Database::conn();
        
        $stmt = $db->prepare("
            INSERT INTO facebook_pages 
            (workspace_id, company_id, page_id, page_name, page_access_token)
            VALUES (?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE 
            page_name = VALUES(page_name),
            page_access_token = VALUES(page_access_token),
            is_active = 1
        ");
        
        $stmt->execute([
            $ctx->workspaceId,
            $ctx->activeCompanyId ?? null,
            $data['page_id'],
            $data['page_name'],
            $data['page_access_token']
        ]);
        
        return Response::success(['message' => 'Facebook page connected']);
    }
    
    public static function listFacebookPages() {
        $ctx = $GLOBALS['tenantContext'] ?? null;
        if (!$ctx || !isset($ctx->workspaceId)) {
            return Response::error('Unauthorized', 401);
        }
        
        $db = Database::conn();
        
        $stmt = $db->prepare("SELECT * FROM facebook_pages WHERE workspace_id = ? ORDER BY page_name");
        $stmt->execute([$ctx->workspaceId]);
        $pages = $stmt->fetchAll(\PDO::FETCH_ASSOC);
        
        return Response::success($pages);
    }
    
    public static function disconnectFacebookPage($id) {
        $ctx = $GLOBALS['tenantContext'] ?? null;
        
        if (!$ctx || !isset($ctx->workspaceId)) {
            return Response::error('Unauthorized', 401);
        }
        
        $db = Database::conn();
        
        $stmt = $db->prepare("UPDATE facebook_pages SET is_active = 0 WHERE id = ? AND workspace_id = ?");
        $stmt->execute([$id, $ctx->workspaceId]);
        
        return Response::success(['message' => 'Facebook page disconnected']);
    }
    
    // ============================================================================
    // INSTAGRAM
    // ============================================================================
    
    public static function connectInstagram() {
        $data = json_decode(file_get_contents('php://input'), true);
        $ctx = $GLOBALS['tenantContext'] ?? null;
        
        if (!$ctx || !isset($ctx->workspaceId)) {
            return Response::error('Unauthorized', 401);
        }
        
        $db = Database::conn();
        
        $stmt = $db->prepare("
            INSERT INTO instagram_accounts 
            (workspace_id, company_id, instagram_id, username, access_token)
            VALUES (?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE 
            username = VALUES(username),
            access_token = VALUES(access_token),
            is_active = 1
        ");
        
        $stmt->execute([
            $ctx->workspaceId,
            $ctx->activeCompanyId ?? null,
            $data['instagram_id'],
            $data['username'],
            $data['access_token']
        ]);
        
        return Response::success(['message' => 'Instagram account connected']);
    }
    
    public static function listInstagramAccounts() {
        $ctx = $GLOBALS['tenantContext'] ?? null;
        if (!$ctx || !isset($ctx->workspaceId)) {
            return Response::error('Unauthorized', 401);
        }
        
        $db = Database::conn();
        
        $stmt = $db->prepare("SELECT * FROM instagram_accounts WHERE workspace_id = ? ORDER BY username");
        $stmt->execute([$ctx->workspaceId]);
        $accounts = $stmt->fetchAll(\PDO::FETCH_ASSOC);
        
        return Response::success($accounts);
    }
    
    // ============================================================================
    // GOOGLE MY BUSINESS
    // ============================================================================
    
    public static function connectGMB() {
        $data = json_decode(file_get_contents('php://input'), true);
        $ctx = $GLOBALS['tenantContext'] ?? null;
        
        if (!$ctx || !isset($ctx->workspaceId)) {
            return Response::error('Unauthorized', 401);
        }
        
        $db = Database::conn();
        
        $stmt = $db->prepare("
            INSERT INTO gmb_locations 
            (workspace_id, company_id, location_id, location_name, access_token, refresh_token)
            VALUES (?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE 
            location_name = VALUES(location_name),
            access_token = VALUES(access_token),
            refresh_token = VALUES(refresh_token),
            is_active = 1
        ");
        
        $stmt->execute([
            $ctx->workspaceId,
            $ctx->activeCompanyId ?? null,
            $data['location_id'],
            $data['location_name'],
            $data['access_token'],
            $data['refresh_token']
        ]);
        
        return Response::success(['message' => 'GMB location connected']);
    }
    
    public static function listGMBLocations() {
        $ctx = $GLOBALS['tenantContext'] ?? null;
        if (!$ctx || !isset($ctx->workspaceId)) {
            return Response::error('Unauthorized', 401);
        }
        
        $db = Database::conn();
        
        $stmt = $db->prepare("SELECT * FROM gmb_locations WHERE workspace_id = ? ORDER BY location_name");
        $stmt->execute([$ctx->workspaceId]);
        $locations = $stmt->fetchAll(\PDO::FETCH_ASSOC);
        
        return Response::success($locations);
    }
    
    // ============================================================================
    // MESSAGE QUEUE
    // ============================================================================
    
    public static function queueMessage() {
        $data = json_decode(file_get_contents('php://input'), true);
        $ctx = $GLOBALS['tenantContext'] ?? null;
        
        if (!$ctx || !isset($ctx->workspaceId)) {
            return Response::error('Unauthorized', 401);
        }
        
        $db = Database::conn();
        
        $stmt = $db->prepare("
            INSERT INTO message_queue 
            (workspace_id, conversation_id, channel, direction, from_identifier, 
             to_identifier, content, media_urls, scheduled_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");
        
        $stmt->execute([
            $ctx->workspaceId,
            $data['conversation_id'] ?? null,
            $data['channel'],
            $data['direction'] ?? 'outbound',
            $data['from'],
            $data['to'],
            $data['content'],
            json_encode($data['media_urls'] ?? []),
            $data['scheduled_at'] ?? null
        ]);
        
        $messageId = $db->lastInsertId();
        
        // If not scheduled, process immediately
        if (!isset($data['scheduled_at'])) {
            self::processMessage($messageId);
        }
        
        return Response::success(['message_id' => $messageId]);
    }
    
    public static function listMessages() {
        $ctx = $GLOBALS['tenantContext'] ?? null;
        if (!$ctx || !isset($ctx->workspaceId)) {
            return Response::error('Unauthorized', 401);
        }
        
        $channel = $_GET['channel'] ?? null;
        $status = $_GET['status'] ?? null;
        $limit = (int)($_GET['limit'] ?? 50);
        
        $db = Database::conn();
        
        $sql = "SELECT * FROM message_queue WHERE workspace_id = ?";
        $params = [$ctx->workspaceId];
        
        if ($channel) {
            $sql .= " AND channel = ?";
            $params[] = $channel;
        }
        
        if ($status) {
            $sql .= " AND status = ?";
            $params[] = $status;
        }
        
        $sql .= " ORDER BY created_at DESC LIMIT ?";
        $params[] = $limit;
        
        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        $messages = $stmt->fetchAll(\PDO::FETCH_ASSOC);
        
        return Response::success($messages);
    }
    
    private static function processMessage($messageId) {
        $db = Database::conn();
        
        $stmt = $db->prepare("SELECT * FROM message_queue WHERE id = ?");
        $stmt->execute([$messageId]);
        $message = $stmt->fetch(\PDO::FETCH_ASSOC);
        
        if (!$message) return;
        
        // Update status to sending
        $stmt = $db->prepare("UPDATE message_queue SET status = 'sending' WHERE id = ?");
        $stmt->execute([$messageId]);
        
        // Process based on channel
        $success = false;
        $externalId = null;
        $errorMessage = null;
        
        try {
            switch ($message['channel']) {
                case 'facebook':
                    // Call Facebook API
                    $success = true;
                    break;
                case 'instagram':
                    // Call Instagram API
                    $success = true;
                    break;
                case 'gmb':
                    // Call GMB API
                    $success = true;
                    break;
                default:
                    $errorMessage = 'Unsupported channel';
            }
        } catch (\Exception $e) {
            $errorMessage = $e->getMessage();
        }
        
        // Update status
        $stmt = $db->prepare("
            UPDATE message_queue 
            SET status = ?, external_id = ?, error_message = ?, sent_at = NOW()
            WHERE id = ?
        ");
        $stmt->execute([
            $success ? 'sent' : 'failed',
            $externalId,
            $errorMessage,
            $messageId
        ]);
    }
}
