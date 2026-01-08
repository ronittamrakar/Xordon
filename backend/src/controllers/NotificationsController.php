<?php
/**
 * Notifications Controller
 * Handles in-app notifications, preferences, and delivery
 */

require_once __DIR__ . '/../Database.php';
require_once __DIR__ . '/../Response.php';
require_once __DIR__ . '/../Auth.php';

class NotificationsController {
    private static function getWorkspaceId(): int {
        $ctx = $GLOBALS['tenantContext'] ?? null;
        if ($ctx && isset($ctx->workspaceId)) {
            return (int)$ctx->workspaceId;
        }
        throw new Exception('Workspace context required');
    }

    private static function getUserId(): int {
        return Auth::userIdOrFail();
    }

    /**
     * List notifications for current user
     */
    public static function index() {
        try {
            $userId = self::getUserId();
            $db = Database::conn();

            $where = ['user_id = ?'];
            $params = [$userId];

            // Filter by read status
            if (isset($_GET['is_read'])) {
                $where[] = 'is_read = ?';
                $params[] = $_GET['is_read'] === 'true' ? 1 : 0;
            }

            // Filter by type
            if (!empty($_GET['type'])) {
                $where[] = 'type = ?';
                $params[] = $_GET['type'];
            }

            // Exclude archived
            if (!isset($_GET['include_archived']) || $_GET['include_archived'] !== 'true') {
                $where[] = 'is_archived = 0';
            }

            $whereClause = implode(' AND ', $where);

            // Pagination
            $limit = min((int)($_GET['limit'] ?? 50), 100);
            $offset = (int)($_GET['offset'] ?? 0);

            $stmt = $db->prepare("
                SELECT * FROM notifications 
                WHERE $whereClause 
                ORDER BY created_at DESC 
                LIMIT ? OFFSET ?
            ");
            $params[] = $limit;
            $params[] = $offset;
            $stmt->execute($params);
            $notifications = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // Get counts
            $countParams = [$userId];
            $countStmt = $db->prepare("
                SELECT 
                    COUNT(*) as total,
                    SUM(CASE WHEN is_read = 0 THEN 1 ELSE 0 END) as unread
                FROM notifications 
                WHERE user_id = ? AND is_archived = 0
            ");
            $countStmt->execute($countParams);
            $counts = $countStmt->fetch(PDO::FETCH_ASSOC);

            // Parse metadata
            foreach ($notifications as &$n) {
                $n['metadata'] = $n['metadata'] ? json_decode($n['metadata'], true) : null;
            }

            return Response::json([
                'data' => $notifications,
                'meta' => [
                    'total' => (int)$counts['total'],
                    'unread' => (int)$counts['unread'],
                    'limit' => $limit,
                    'offset' => $offset
                ]
            ]);
        } catch (Exception $e) {
            return Response::error('Failed to fetch notifications: ' . $e->getMessage());
        }
    }

    /**
     * Get unread count
     */
    public static function unreadCount() {
        try {
            $userId = self::getUserId();
            $db = Database::conn();

            $stmt = $db->prepare("
                SELECT COUNT(*) FROM notifications 
                WHERE user_id = ? AND is_read = 0 AND is_archived = 0
            ");
            $stmt->execute([$userId]);
            $count = (int)$stmt->fetchColumn();

            return Response::json(['data' => ['unread' => $count]]);
        } catch (Exception $e) {
            return Response::error('Failed to get count: ' . $e->getMessage());
        }
    }

    /**
     * Mark notification as read
     */
    public static function markRead($id) {
        try {
            $userId = self::getUserId();
            $db = Database::conn();

            $stmt = $db->prepare("
                UPDATE notifications SET is_read = 1, read_at = NOW() 
                WHERE id = ? AND user_id = ?
            ");
            $stmt->execute([$id, $userId]);

            return Response::json(['success' => true]);
        } catch (Exception $e) {
            return Response::error('Failed to mark as read: ' . $e->getMessage());
        }
    }

    /**
     * Mark all notifications as read
     */
    public static function markAllRead() {
        try {
            $userId = self::getUserId();
            $db = Database::conn();

            $stmt = $db->prepare("
                UPDATE notifications SET is_read = 1, read_at = NOW() 
                WHERE user_id = ? AND is_read = 0
            ");
            $stmt->execute([$userId]);

            return Response::json(['success' => true, 'updated' => $stmt->rowCount()]);
        } catch (Exception $e) {
            return Response::error('Failed to mark all as read: ' . $e->getMessage());
        }
    }

    /**
     * Archive notification
     */
    public static function archive($id) {
        try {
            $userId = self::getUserId();
            $db = Database::conn();

            $stmt = $db->prepare("
                UPDATE notifications SET is_archived = 1 
                WHERE id = ? AND user_id = ?
            ");
            $stmt->execute([$id, $userId]);

            return Response::json(['success' => true]);
        } catch (Exception $e) {
            return Response::error('Failed to archive: ' . $e->getMessage());
        }
    }

    /**
     * Delete notification
     */
    public static function delete($id) {
        try {
            $userId = self::getUserId();
            $db = Database::conn();

            $stmt = $db->prepare("DELETE FROM notifications WHERE id = ? AND user_id = ?");
            $stmt->execute([$id, $userId]);

            return Response::json(['success' => true]);
        } catch (Exception $e) {
            return Response::error('Failed to delete: ' . $e->getMessage());
        }
    }

    /**
     * Get notification preferences
     */
    public static function getPreferences() {
        try {
            $userId = self::getUserId();
            $workspaceId = null;
            try {
                $workspaceId = self::getWorkspaceId();
            } catch (Exception $e) {}

            $db = Database::conn();

            $stmt = $db->prepare("
                SELECT * FROM notification_preferences 
                WHERE user_id = ? AND (workspace_id IS NULL OR workspace_id = ?)
                ORDER BY workspace_id IS NULL DESC
            ");
            $stmt->execute([$userId, $workspaceId]);
            $prefs = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // Get available notification types from templates
            $typesStmt = $db->prepare("
                SELECT DISTINCT type, name, default_in_app, default_email, default_sms 
                FROM notification_templates 
                WHERE workspace_id IS NULL OR workspace_id = ?
            ");
            $typesStmt->execute([$workspaceId]);
            $types = $typesStmt->fetchAll(PDO::FETCH_ASSOC);

            return Response::json([
                'data' => [
                    'preferences' => $prefs,
                    'available_types' => $types
                ]
            ]);
        } catch (Exception $e) {
            return Response::error('Failed to get preferences: ' . $e->getMessage());
        }
    }

    /**
     * Update notification preferences
     */
    public static function updatePreferences() {
        try {
            $userId = self::getUserId();
            $workspaceId = null;
            try {
                $workspaceId = self::getWorkspaceId();
            } catch (Exception $e) {}

            $db = Database::conn();
            $data = json_decode(file_get_contents('php://input'), true) ?? [];

            if (empty($data['notification_type'])) {
                return Response::error('notification_type required', 400);
            }

            $type = $data['notification_type'];

            // Upsert preference
            $stmt = $db->prepare("
                INSERT INTO notification_preferences 
                (user_id, workspace_id, notification_type, in_app, email, sms, push, digest_mode, quiet_hours_start, quiet_hours_end)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE
                    in_app = VALUES(in_app),
                    email = VALUES(email),
                    sms = VALUES(sms),
                    push = VALUES(push),
                    digest_mode = VALUES(digest_mode),
                    quiet_hours_start = VALUES(quiet_hours_start),
                    quiet_hours_end = VALUES(quiet_hours_end)
            ");

            $stmt->execute([
                $userId,
                $workspaceId,
                $type,
                $data['in_app'] ?? 1,
                $data['email'] ?? 1,
                $data['sms'] ?? 0,
                $data['push'] ?? 1,
                $data['digest_mode'] ?? 'instant',
                $data['quiet_hours_start'] ?? null,
                $data['quiet_hours_end'] ?? null
            ]);

            return Response::json(['success' => true]);
        } catch (Exception $e) {
            return Response::error('Failed to update preferences: ' . $e->getMessage());
        }
    }

    /**
     * Create notification (internal use / API)
     */
    public static function create() {
        try {
            $workspaceId = self::getWorkspaceId();
            $db = Database::conn();
            $data = json_decode(file_get_contents('php://input'), true) ?? [];

            if (empty($data['user_id']) || empty($data['type']) || empty($data['title'])) {
                return Response::error('user_id, type, and title required', 400);
            }

            $stmt = $db->prepare("
                INSERT INTO notifications 
                (workspace_id, user_id, type, title, body, icon, entity_type, entity_id, action_url, metadata)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ");

            $stmt->execute([
                $workspaceId,
                $data['user_id'],
                $data['type'],
                $data['title'],
                $data['body'] ?? null,
                $data['icon'] ?? null,
                $data['entity_type'] ?? null,
                $data['entity_id'] ?? null,
                $data['action_url'] ?? null,
                isset($data['metadata']) ? json_encode($data['metadata']) : null
            ]);

            $id = $db->lastInsertId();

            return Response::json(['data' => ['id' => (int)$id]]);
        } catch (Exception $e) {
            return Response::error('Failed to create notification: ' . $e->getMessage());
        }
    }

    /**
     * Send notification using template
     * Internal helper - call from other controllers
     */
    public static function sendFromTemplate(
        int $workspaceId,
        int $userId,
        string $type,
        array $variables = [],
        ?string $entityType = null,
        ?int $entityId = null,
        ?string $actionUrl = null
    ): ?int {
        try {
            $db = Database::conn();

            // Get template
            $stmt = $db->prepare("
                SELECT * FROM notification_templates 
                WHERE type = ? AND (workspace_id IS NULL OR workspace_id = ?)
                ORDER BY workspace_id DESC
                LIMIT 1
            ");
            $stmt->execute([$type, $workspaceId]);
            $template = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$template) {
                return null;
            }

            // Check user preferences
            $prefStmt = $db->prepare("
                SELECT * FROM notification_preferences 
                WHERE user_id = ? AND notification_type IN (?, '*')
                AND (workspace_id IS NULL OR workspace_id = ?)
                ORDER BY notification_type = ? DESC, workspace_id DESC
                LIMIT 1
            ");
            $prefStmt->execute([$userId, $type, $workspaceId, $type]);
            $pref = $prefStmt->fetch(PDO::FETCH_ASSOC);

            // Determine channels
            $inApp = $pref ? (bool)$pref['in_app'] : (bool)$template['default_in_app'];
            $email = $pref ? (bool)$pref['email'] : (bool)$template['default_email'];
            $sms = $pref ? (bool)$pref['sms'] : (bool)$template['default_sms'];

            if (!$inApp && !$email && !$sms) {
                return null; // User has disabled all channels
            }

            // Replace variables in template
            $title = self::replaceVariables($template['title_template'], $variables);
            $body = self::replaceVariables($template['body_template'] ?? '', $variables);

            // Create in-app notification
            $notificationId = null;
            if ($inApp) {
                $stmt = $db->prepare("
                    INSERT INTO notifications 
                    (workspace_id, user_id, type, title, body, entity_type, entity_id, action_url)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                ");
                $stmt->execute([
                    $workspaceId,
                    $userId,
                    $type,
                    $title,
                    $body,
                    $entityType,
                    $entityId,
                    $actionUrl
                ]);
                $notificationId = (int)$db->lastInsertId();
            }


            // Get user contact info
            $userStmt = $db->prepare("SELECT email, phone FROM users WHERE id = ?");
            $userStmt->execute([$userId]);
            $user = $userStmt->fetch(PDO::FETCH_ASSOC);

            if ($user) {
                // Send Email
                if ($email && !empty($user['email'])) {
                    require_once __DIR__ . '/../services/EmailService.php';
                    EmailService::sendEmail(
                        $user['email'],
                        $title,
                        "<h1>$title</h1><p>$body</p>" . ($actionUrl ? "<br><a href='$actionUrl'>View Details</a>" : ""),
                        "$title\n\n$body" . ($actionUrl ? "\n\n$actionUrl" : "")
                    );
                }

                // Send SMS
                if ($sms && !empty($user['phone'])) {
                    require_once __DIR__ . '/../services/SMSService.php';
                    try {
                        $smsService = new SMSService(null, (string)$userId);
                        $smsService->sendMessage($user['phone'], "$title: $body");
                    } catch (Exception $smsEx) {
                        error_log("Failed to send SMS notification: " . $smsEx->getMessage());
                    }
                }
            }

            return $notificationId;
        } catch (Exception $e) {
            error_log("Notification error: " . $e->getMessage());
            return null;
        }
    }

    private static function replaceVariables(string $template, array $variables): string {
        foreach ($variables as $key => $value) {
            $template = str_replace('{{' . $key . '}}', (string)$value, $template);
        }
        return $template;
    }
}
