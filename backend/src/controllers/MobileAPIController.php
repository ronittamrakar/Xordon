<?php

namespace Xordon\Controllers;

use Xordon\Core\Database;
use Xordon\Core\Auth;
use Xordon\Core\Response;

class MobileAPIController {
    
    // ============================================================================
    // DEVICE REGISTRATION
    // ============================================================================
    
    public static function registerDevice() {
        $data = json_decode(file_get_contents('php://input'), true);
        $ctx = $GLOBALS['tenantContext'] ?? null;
        
        if (!$ctx || !isset($ctx->workspaceId)) {
            return Response::error('Unauthorized', 401);
        }
        
        $db = Database::conn();
        
        // Check if device already exists
        $stmt = $db->prepare("SELECT id FROM mobile_devices WHERE device_token = ?");
        $stmt->execute([$data['device_token']]);
        $existing = $stmt->fetch(\PDO::FETCH_ASSOC);
        
        if ($existing) {
            // Update existing device
            $stmt = $db->prepare("
                UPDATE mobile_devices 
                SET device_name = ?, os_version = ?, app_version = ?, 
                    is_active = 1, last_active_at = NOW()
                WHERE device_token = ?
            ");
            $stmt->execute([
                $data['device_name'] ?? null,
                $data['os_version'] ?? null,
                $data['app_version'] ?? null,
                $data['device_token']
            ]);
            $deviceId = $existing['id'];
        } else {
            // Register new device
            $stmt = $db->prepare("
                INSERT INTO mobile_devices 
                (workspace_id, user_id, contact_id, device_type, device_token, 
                 device_name, os_version, app_version, last_active_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
            ");
            $stmt->execute([
                $ctx->workspaceId,
                Auth::userId(),
                $data['contact_id'] ?? null,
                $data['device_type'],
                $data['device_token'],
                $data['device_name'] ?? null,
                $data['os_version'] ?? null,
                $data['app_version'] ?? null
            ]);
            $deviceId = $db->lastInsertId();
        }
        
        return Response::success(['device_id' => $deviceId]);
    }
    
    public static function unregisterDevice() {
        $data = json_decode(file_get_contents('php://input'), true);
        $ctx = $GLOBALS['tenantContext'] ?? null;
        
        if (!$ctx || !isset($ctx->workspaceId)) {
            return Response::error('Unauthorized', 401);
        }
        
        $db = Database::conn();
        
        $stmt = $db->prepare("
            UPDATE mobile_devices 
            SET is_active = 0 
            WHERE device_token = ? AND workspace_id = ?
        ");
        $stmt->execute([$data['device_token'], $ctx->workspaceId]);
        
        return Response::success(['message' => 'Device unregistered']);
    }
    
    // ============================================================================
    // PUSH NOTIFICATIONS
    // ============================================================================
    
    public static function sendPushNotification() {
        $data = json_decode(file_get_contents('php://input'), true);
        $ctx = $GLOBALS['tenantContext'] ?? null;
        
        if (!$ctx || !isset($ctx->workspaceId)) {
            return Response::error('Unauthorized', 401);
        }
        
        $db = Database::conn();
        
        $deviceIds = $data['device_ids'] ?? [];
        $title = $data['title'];
        $body = $data['body'];
        $notificationData = $data['data'] ?? [];
        
        foreach ($deviceIds as $deviceId) {
            $stmt = $db->prepare("
                INSERT INTO push_notifications 
                (workspace_id, device_id, title, body, data, status)
                VALUES (?, ?, ?, ?, ?, 'queued')
            ");
            $stmt->execute([
                $ctx->workspaceId,
                $deviceId,
                $title,
                $body,
                json_encode($notificationData)
            ]);
        }
        
        // In production, trigger background worker to send notifications
        
        return Response::success(['message' => 'Notifications queued']);
    }
    
    public static function getNotifications() {
        $ctx = $GLOBALS['tenantContext'] ?? null;
        if (!$ctx || !isset($ctx->workspaceId)) {
            return Response::error('Unauthorized', 401);
        }
        
        $deviceId = $_GET['device_id'] ?? null;
        $status = $_GET['status'] ?? null;
        $limit = (int)($_GET['limit'] ?? 50);
        
        $db = Database::conn();
        
        $sql = "SELECT * FROM push_notifications WHERE workspace_id = ?";
        $params = [$ctx->workspaceId];
        
        if ($deviceId) {
            $sql .= " AND device_id = ?";
            $params[] = $deviceId;
        }
        
        if ($status) {
            $sql .= " AND status = ?";
            $params[] = $status;
        }
        
        $sql .= " ORDER BY created_at DESC LIMIT ?";
        $params[] = $limit;
        
        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        $notifications = $stmt->fetchAll(\PDO::FETCH_ASSOC);
        
        foreach ($notifications as &$notification) {
            $notification['data'] = json_decode($notification['data'], true);
        }
        
        return Response::success($notifications);
    }
    
    // ============================================================================
    // SESSION TRACKING
    // ============================================================================
    
    public static function startSession() {
        $data = json_decode(file_get_contents('php://input'), true);
        $ctx = $GLOBALS['tenantContext'] ?? null;
        
        if (!$ctx || !isset($ctx->workspaceId)) {
            return Response::error('Unauthorized', 401);
        }
        
        $db = Database::conn();
        
        $sessionId = $data['session_id'] ?? bin2hex(random_bytes(16));
        
        $stmt = $db->prepare("
            INSERT INTO mobile_sessions 
            (workspace_id, device_id, session_id, started_at)
            VALUES (?, ?, ?, NOW())
        ");
        $stmt->execute([
            $ctx->workspaceId,
            $data['device_id'],
            $sessionId
        ]);
        
        return Response::success([
            'session_id' => $sessionId,
            'mobile_session_id' => $db->lastInsertId()
        ]);
    }
    
    public static function endSession() {
        $data = json_decode(file_get_contents('php://input'), true);
        $ctx = $GLOBALS['tenantContext'] ?? null;
        
        if (!$ctx || !isset($ctx->workspaceId)) {
            return Response::error('Unauthorized', 401);
        }
        
        $db = Database::conn();
        
        $stmt = $db->prepare("
            UPDATE mobile_sessions 
            SET ended_at = NOW(), 
                duration_seconds = TIMESTAMPDIFF(SECOND, started_at, NOW()),
                screens_viewed = ?,
                actions_performed = ?
            WHERE session_id = ? AND workspace_id = ?
        ");
        $stmt->execute([
            $data['screens_viewed'] ?? 0,
            $data['actions_performed'] ?? 0,
            $data['session_id'],
            $ctx->workspaceId
        ]);
        
        return Response::success(['message' => 'Session ended']);
    }
    
    // ============================================================================
    // MOBILE-OPTIMIZED DATA ENDPOINTS
    // ============================================================================
    
    public static function getDashboardData() {
        $ctx = $GLOBALS['tenantContext'] ?? null;
        if (!$ctx || !isset($ctx->workspaceId)) {
            return Response::error('Unauthorized', 401);
        }
        
        $db = Database::conn();
        
        // Get summary stats
        $stats = [
            'contacts' => 0,
            'campaigns' => 0,
            'appointments' => 0,
            'revenue' => 0
        ];
        
        $stmt = $db->prepare("SELECT COUNT(*) as count FROM contacts WHERE workspace_id = ?");
        $stmt->execute([$ctx->workspaceId]);
        $stats['contacts'] = $stmt->fetch(\PDO::FETCH_ASSOC)['count'];
        
        $stmt = $db->prepare("SELECT COUNT(*) as count FROM campaigns WHERE workspace_id = ?");
        $stmt->execute([$ctx->workspaceId]);
        $stats['campaigns'] = $stmt->fetch(\PDO::FETCH_ASSOC)['count'];
        
        $stmt = $db->prepare("SELECT COUNT(*) as count FROM appointments WHERE workspace_id = ? AND start_time >= NOW()");
        $stmt->execute([$ctx->workspaceId]);
        $stats['appointments'] = $stmt->fetch(\PDO::FETCH_ASSOC)['count'];
        
        $stmt = $db->prepare("SELECT SUM(total) as revenue FROM invoices WHERE workspace_id = ? AND status = 'paid'");
        $stmt->execute([$ctx->workspaceId]);
        $stats['revenue'] = $stmt->fetch(\PDO::FETCH_ASSOC)['revenue'] ?? 0;
        
        return Response::success($stats);
    }
}
