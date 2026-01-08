<?php
require_once __DIR__ . '/../Database.php';
require_once __DIR__ . '/../Response.php';
require_once __DIR__ . '/../Auth.php';
require_once __DIR__ . '/../traits/WorkspaceScoped.php';

class InboxController {
    use WorkspaceScoped;
    
    /**
     * Get unified inbox stats (unread counts per channel)
     */
    public static function getStats(): void {
        $userId = Auth::userIdOrFail();
        $pdo = Database::conn();
        
        // Use workspace scoping
        $scope = self::workspaceWhere();
        $workspaceId = $scope['params'][0];
        
        // Email unread count
        $stmt = $pdo->prepare('
            SELECT COUNT(*) as count 
            FROM email_replies 
            WHERE workspace_id = ? AND is_read = FALSE AND is_archived = FALSE
        ');
        $stmt->execute([$workspaceId]);
        $emailUnread = (int)($stmt->fetch()['count'] ?? 0);
        
        // SMS unread count
        $stmt = $pdo->prepare('
            SELECT COUNT(*) as count 
            FROM sms_replies 
            WHERE workspace_id = ? AND is_read = FALSE AND is_archived = FALSE
        ');
        $stmt->execute([$workspaceId]);
        $smsUnread = (int)($stmt->fetch()['count'] ?? 0);
        
        // Calls - count new/unhandled items from call_logs
        $stmt = $pdo->prepare('
            SELECT COUNT(*) as count 
            FROM call_logs 
            WHERE workspace_id = ? AND status IN ("missed", "voicemail") AND is_handled = FALSE
        ');
        $stmt->execute([$workspaceId]);
        $callsUnread = (int)($stmt->fetch()['count'] ?? 0);
        
        Response::json([
            'email' => $emailUnread,
            'sms' => $smsUnread,
            'calls' => $callsUnread,
            'total' => $emailUnread + $smsUnread + $callsUnread
        ]);
    }
    
    /**
     * Get recent conversations across all channels (unified view)
     */
    public static function getRecent(): void {
        $userId = Auth::userIdOrFail();
        $limit = (int)($_GET['limit'] ?? 20);
        $pdo = Database::conn();
        
        // Use workspace scoping
        $scope = self::workspaceWhere();
        $workspaceId = $scope['params'][0];
        
        $conversations = [];
        
        // Recent emails
        $stmt = $pdo->prepare('
            SELECT 
                id, from_email as contact, subject as preview, 
                is_read, is_starred, created_at,
                "email" as channel
            FROM email_replies 
            WHERE workspace_id = ? AND is_archived = FALSE
            ORDER BY created_at DESC
            LIMIT ?
        ');
        $stmt->execute([$workspaceId, $limit]);
        $emails = $stmt->fetchAll();
        foreach ($emails as $e) {
            $conversations[] = $e;
        }
        
        // Recent SMS
        $stmt = $pdo->prepare('
            SELECT 
                id, phone_number as contact, message as preview,
                is_read, is_starred, created_at,
                "sms" as channel
            FROM sms_replies 
            WHERE workspace_id = ? AND is_archived = FALSE
            ORDER BY created_at DESC
            LIMIT ?
        ');
        $stmt->execute([$workspaceId, $limit]);
        $sms = $stmt->fetchAll();
        foreach ($sms as $s) {
            $conversations[] = $s;
        }
        
        // Recent calls
        $stmt = $pdo->prepare('
            SELECT 
                id, caller_number as contact, 
                CONCAT(direction, " - ", COALESCE(duration, 0), "s") as preview,
                (status NOT IN ("missed", "voicemail") OR is_handled = TRUE) as is_read,
                FALSE as is_starred, created_at,
                "calls" as channel
            FROM call_logs 
            WHERE workspace_id = ?
            ORDER BY created_at DESC
            LIMIT ?
        ');
        $stmt->execute([$workspaceId, $limit]);
        $calls = $stmt->fetchAll();
        foreach ($calls as $c) {
            $conversations[] = $c;
        }
        
        // Sort by created_at descending
        usort($conversations, function($a, $b) {
            return strtotime($b['created_at']) - strtotime($a['created_at']);
        });
        
        // Limit total
        $conversations = array_slice($conversations, 0, $limit);
        
        Response::json([
            'items' => $conversations,
            'total' => count($conversations)
        ]);
    }
}
