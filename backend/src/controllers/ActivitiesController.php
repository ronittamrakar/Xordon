<?php
/**
 * Activities Controller
 * Universal activity timeline for all entities
 */

require_once __DIR__ . '/../Database.php';
require_once __DIR__ . '/../Response.php';
require_once __DIR__ . '/../Auth.php';

class ActivitiesController {
    private static function getWorkspaceId(): int {
        $ctx = $GLOBALS['tenantContext'] ?? null;
        if ($ctx && isset($ctx->workspaceId)) {
            return (int)$ctx->workspaceId;
        }
        throw new Exception('Workspace context required');
    }

    private static function getUserId(): ?int {
        try {
            return Auth::userIdOrFail();
        } catch (Exception $e) {
            return null;
        }
    }

    private static function getUserName(): ?string {
        try {
            $userId = Auth::userIdOrFail();
            $db = Database::conn();
            $stmt = $db->prepare("SELECT CONCAT(first_name, ' ', last_name) as name FROM users WHERE id = ?");
            $stmt->execute([$userId]);
            return $stmt->fetchColumn() ?: null;
        } catch (Exception $e) {
            return null;
        }
    }

    /**
     * List activities for an entity
     */
    public static function forEntity($entityType, $entityId) {
        try {
            $workspaceId = self::getWorkspaceId();
            $db = Database::conn();

            $limit = min((int)($_GET['limit'] ?? 50), 100);
            $offset = (int)($_GET['offset'] ?? 0);

            // Filter by activity type
            $typeFilter = '';
            $params = [$workspaceId, $entityType, $entityId];
            if (!empty($_GET['activity_type'])) {
                $typeFilter = 'AND activity_type = ?';
                $params[] = $_GET['activity_type'];
            }

            $stmt = $db->prepare("
                SELECT a.*, 
                    (SELECT COUNT(*) FROM activity_comments ac WHERE ac.activity_id = a.id) as comment_count
                FROM activities a
                WHERE a.workspace_id = ? AND a.entity_type = ? AND a.entity_id = ?
                $typeFilter
                ORDER BY a.created_at DESC
                LIMIT ? OFFSET ?
            ");
            $params[] = $limit;
            $params[] = $offset;
            $stmt->execute($params);
            $activities = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // Parse JSON fields
            foreach ($activities as &$a) {
                $a['changes'] = $a['changes'] ? json_decode($a['changes'], true) : null;
                $a['metadata'] = $a['metadata'] ? json_decode($a['metadata'], true) : null;
            }

            // Get total count
            $countParams = [$workspaceId, $entityType, $entityId];
            $countSql = "SELECT COUNT(*) FROM activities WHERE workspace_id = ? AND entity_type = ? AND entity_id = ?";
            if (!empty($_GET['activity_type'])) {
                $countSql .= ' AND activity_type = ?';
                $countParams[] = $_GET['activity_type'];
            }
            $countStmt = $db->prepare($countSql);
            $countStmt->execute($countParams);
            $total = (int)$countStmt->fetchColumn();

            Response::json([
                'data' => $activities,
                'meta' => [
                    'total' => $total,
                    'limit' => $limit,
                    'offset' => $offset
                ]
            ]);
            return;
        } catch (Exception $e) {
            return Response::error('Failed to fetch activities: ' . $e->getMessage());
        }
    }

    /**
     * List all recent activities in workspace
     */
    public static function index() {
        try {
            $workspaceId = self::getWorkspaceId();
            $db = Database::conn();

            $limit = min((int)($_GET['limit'] ?? 50), 100);
            $offset = (int)($_GET['offset'] ?? 0);

            $where = ['workspace_id = ?'];
            $params = [$workspaceId];

            // Filter by entity type
            if (!empty($_GET['entity_type'])) {
                $where[] = 'entity_type = ?';
                $params[] = $_GET['entity_type'];
            }

            // Filter by user
            if (!empty($_GET['user_id'])) {
                $where[] = 'user_id = ?';
                $params[] = (int)$_GET['user_id'];
            }

            // Filter by activity type
            if (!empty($_GET['activity_type'])) {
                $where[] = 'activity_type = ?';
                $params[] = $_GET['activity_type'];
            }

            // Date range
            if (!empty($_GET['from'])) {
                $where[] = 'created_at >= ?';
                $params[] = $_GET['from'];
            }
            if (!empty($_GET['to'])) {
                $where[] = 'created_at <= ?';
                $params[] = $_GET['to'];
            }

            $whereClause = implode(' AND ', $where);

            $stmt = $db->prepare("
                SELECT * FROM activities 
                WHERE $whereClause 
                ORDER BY created_at DESC 
                LIMIT ? OFFSET ?
            ");
            $params[] = $limit;
            $params[] = $offset;
            $stmt->execute($params);
            $activities = $stmt->fetchAll(PDO::FETCH_ASSOC);

            foreach ($activities as &$a) {
                $a['changes'] = $a['changes'] ? json_decode($a['changes'], true) : null;
                $a['metadata'] = $a['metadata'] ? json_decode($a['metadata'], true) : null;
            }

            Response::json([
                'data' => $activities,
                'meta' => ['limit' => $limit, 'offset' => $offset]
            ]);
            return;
        } catch (Exception $e) {
            return Response::error('Failed to fetch activities: ' . $e->getMessage());
        }
    }

    /**
     * Create activity (manual note/comment)
     */
    public static function create() {
        try {
            $workspaceId = self::getWorkspaceId();
            $userId = self::getUserId();
            $userName = self::getUserName();
            $db = Database::conn();
            $data = json_decode(file_get_contents('php://input'), true) ?? [];

            if (empty($data['entity_type']) || empty($data['entity_id']) || empty($data['title'])) {
                Response::error('entity_type, entity_id, and title required', 400);
                return;
            }

            $stmt = $db->prepare("
                INSERT INTO activities 
                (workspace_id, company_id, user_id, user_name, entity_type, entity_id, 
                 related_entity_type, related_entity_id, activity_type, title, description, 
                 metadata, is_system, is_pinned, is_internal)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ");

            $stmt->execute([
                $workspaceId,
                $data['company_id'] ?? null,
                $userId,
                $userName,
                $data['entity_type'],
                $data['entity_id'],
                $data['related_entity_type'] ?? null,
                $data['related_entity_id'] ?? null,
                $data['activity_type'] ?? 'note_added',
                $data['title'],
                $data['description'] ?? null,
                isset($data['metadata']) ? json_encode($data['metadata']) : null,
                $data['is_system'] ?? 0,
                $data['is_pinned'] ?? 0,
                $data['is_internal'] ?? 0
            ]);

            $id = $db->lastInsertId();

            return Response::json(['data' => ['id' => (int)$id]]);
        } catch (Exception $e) {
            Response::error('Failed to create activity: ' . $e->getMessage());
            return;
        }
    }

    /**
     * Pin/unpin activity
     */
    public static function togglePin($id) {
        try {
            $workspaceId = self::getWorkspaceId();
            $db = Database::conn();

            $stmt = $db->prepare("
                UPDATE activities SET is_pinned = NOT is_pinned 
                WHERE id = ? AND workspace_id = ?
            ");
            $stmt->execute([$id, $workspaceId]);

            if ($stmt->rowCount() === 0) {
                return Response::error('Activity not found', 404);
            }

            Response::json(['success' => true]);
            return;
        } catch (Exception $e) {
            Response::error('Failed to toggle pin: ' . $e->getMessage());
            return;
        }
    }

    /**
     * Add comment to activity
     */
    public static function addComment($activityId) {
        try {
            $workspaceId = self::getWorkspaceId();
            $userId = self::getUserId();
            $userName = self::getUserName();
            $db = Database::conn();
            $data = json_decode(file_get_contents('php://input'), true) ?? [];

            if (empty($data['body'])) {
                Response::error('body required', 400);
                return;
            }

            // Verify activity exists and belongs to workspace
            $checkStmt = $db->prepare("SELECT id FROM activities WHERE id = ? AND workspace_id = ?");
            $checkStmt->execute([$activityId, $workspaceId]);
            if (!$checkStmt->fetch()) {
                return Response::error('Activity not found', 404);
            }

            $stmt = $db->prepare("
                INSERT INTO activity_comments (activity_id, user_id, user_name, body)
                VALUES (?, ?, ?, ?)
            ");
            $stmt->execute([$activityId, $userId, $userName, $data['body']]);

            $id = $db->lastInsertId();

            return Response::json(['data' => ['id' => (int)$id]]);
        } catch (Exception $e) {
            Response::error('Failed to add comment: ' . $e->getMessage());
            return;
        }
    }

    /**
     * Get comments for activity
     */
    public static function getComments($activityId) {
        try {
            $workspaceId = self::getWorkspaceId();
            $db = Database::conn();

            // Verify activity exists
            $checkStmt = $db->prepare("SELECT id FROM activities WHERE id = ? AND workspace_id = ?");
            $checkStmt->execute([$activityId, $workspaceId]);
            if (!$checkStmt->fetch()) {
                return Response::error('Activity not found', 404);
            }

            $stmt = $db->prepare("
                SELECT * FROM activity_comments 
                WHERE activity_id = ? 
                ORDER BY created_at ASC
            ");
            $stmt->execute([$activityId]);
            $comments = $stmt->fetchAll(PDO::FETCH_ASSOC);

            Response::json(['data' => $comments]);
            return;
        } catch (Exception $e) {
            Response::error('Failed to fetch comments: ' . $e->getMessage());
            return;
        }
    }

    /**
     * Log activity (internal helper - call from other controllers)
     */
    public static function log(
        int $workspaceId,
        string $entityType,
        int $entityId,
        string $activityType,
        string $title,
        ?string $description = null,
        ?array $changes = null,
        ?array $metadata = null,
        ?int $companyId = null,
        ?string $relatedEntityType = null,
        ?int $relatedEntityId = null,
        bool $isSystem = false,
        bool $isInternal = false
    ): ?int {
        try {
            $userId = null;
            $userName = null;
            
            if (!$isSystem) {
                try {
                    $userId = Auth::userIdOrFail();
                    $db = Database::conn();
                    $stmt = $db->prepare("SELECT CONCAT(first_name, ' ', last_name) as name FROM users WHERE id = ?");
                    $stmt->execute([$userId]);
                    $userName = $stmt->fetchColumn() ?: null;
                } catch (Exception $e) {}
            }

            $db = Database::conn();
            $stmt = $db->prepare("
                INSERT INTO activities 
                (workspace_id, company_id, user_id, user_name, entity_type, entity_id,
                 related_entity_type, related_entity_id, activity_type, title, description,
                 changes, metadata, is_system, is_internal)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ");

            $stmt->execute([
                $workspaceId,
                $companyId,
                $userId,
                $userName,
                $entityType,
                $entityId,
                $relatedEntityType,
                $relatedEntityId,
                $activityType,
                $title,
                $description,
                $changes ? json_encode($changes) : null,
                $metadata ? json_encode($metadata) : null,
                $isSystem ? 1 : 0,
                $isInternal ? 1 : 0
            ]);

            return (int)$db->lastInsertId();
        } catch (Exception $e) {
            error_log("Activity log error: " . $e->getMessage());
            return null;
        }
    }
}
