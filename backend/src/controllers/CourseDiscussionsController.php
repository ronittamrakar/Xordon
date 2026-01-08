<?php
/**
 * Course Discussions Controller
 * Manage course discussion forums and replies
 */

require_once __DIR__ . '/../Database.php';
require_once __DIR__ . '/../Response.php';
require_once __DIR__ . '/../Auth.php';

class CourseDiscussionsController {
    
    private static function getWorkspaceId(): int {
        $ctx = $GLOBALS['tenantContext'] ?? null;
        if ($ctx && isset($ctx->workspaceId)) {
            return (int)$ctx->workspaceId;
        }
        return 1;
    }

    /**
     * GET /courses/{courseId}/discussions
     */
    public static function index(string $courseId): void {
        Auth::userIdOrFail();
        $pdo = Database::conn();

        $lessonId = $_GET['lesson_id'] ?? null;
        $pinned = $_GET['pinned'] ?? null;

        $where = ['cd.course_id = ?', 'cd.parent_id IS NULL'];
        $params = [$courseId];

        if ($lessonId) {
            $where[] = 'cd.lesson_id = ?';
            $params[] = $lessonId;
        }

        if ($pinned !== null) {
            $where[] = 'cd.is_pinned = ?';
            $params[] = (int)$pinned;
        }

        $stmt = $pdo->prepare("
            SELECT cd.*, u.name as user_name, u.email as user_email,
                   (SELECT COUNT(*) FROM course_discussions WHERE parent_id = cd.id) as reply_count
            FROM course_discussions cd
            LEFT JOIN users u ON cd.user_id = u.id
            WHERE " . implode(' AND ', $where) . "
            ORDER BY cd.is_pinned DESC, cd.created_at DESC
        ");
        $stmt->execute($params);
        $discussions = $stmt->fetchAll();

        Response::json(['items' => $discussions]);
    }

    /**
     * GET /discussions/{id}
     */
    public static function show(string $id): void {
        Auth::userIdOrFail();
        $pdo = Database::conn();

        $stmt = $pdo->prepare("
            SELECT cd.*, u.name as user_name, u.email as user_email
            FROM course_discussions cd
            LEFT JOIN users u ON cd.user_id = u.id
            WHERE cd.id = ?
        ");
        $stmt->execute([$id]);
        $discussion = $stmt->fetch();

        if (!$discussion) {
            Response::error('Discussion not found', 404);
            return;
        }

        // Get replies
        $stmt = $pdo->prepare("
            SELECT cd.*, u.name as user_name, u.email as user_email
            FROM course_discussions cd
            LEFT JOIN users u ON cd.user_id = u.id
            WHERE cd.parent_id = ?
            ORDER BY cd.created_at ASC
        ");
        $stmt->execute([$id]);
        $discussion['replies'] = $stmt->fetchAll();

        Response::json($discussion);
    }

    /**
     * POST /courses/{courseId}/discussions
     */
    public static function create(string $courseId): void {
        $userId = Auth::userIdOrFail();
        $pdo = Database::conn();
        $body = get_json_body();

        $content = trim($body['content'] ?? '');
        if (!$content) {
            Response::error('Content is required', 422);
            return;
        }

        $stmt = $pdo->prepare("
            INSERT INTO course_discussions (course_id, lesson_id, user_id, parent_id, title, content, created_at)
            VALUES (?, ?, ?, ?, ?, ?, NOW())
        ");
        $stmt->execute([
            $courseId,
            $body['lesson_id'] ?? null,
            $userId,
            $body['parent_id'] ?? null,
            $body['title'] ?? null,
            $content
        ]);

        $id = $pdo->lastInsertId();

        // If this is a reply, update parent's reply count
        if (!empty($body['parent_id'])) {
            $stmt = $pdo->prepare("
                UPDATE course_discussions 
                SET reply_count = reply_count + 1 
                WHERE id = ?
            ");
            $stmt->execute([$body['parent_id']]);
        }

        $stmt = $pdo->prepare("
            SELECT cd.*, u.name as user_name, u.email as user_email
            FROM course_discussions cd
            LEFT JOIN users u ON cd.user_id = u.id
            WHERE cd.id = ?
        ");
        $stmt->execute([$id]);
        $discussion = $stmt->fetch();

        Response::json($discussion, 201);
    }

    /**
     * PUT /discussions/{id}
     */
    public static function update(string $id): void {
        $userId = Auth::userIdOrFail();
        $pdo = Database::conn();
        $body = get_json_body();

        // Verify ownership
        $stmt = $pdo->prepare("SELECT user_id FROM course_discussions WHERE id = ?");
        $stmt->execute([$id]);
        $discussion = $stmt->fetch();

        if (!$discussion) {
            Response::error('Discussion not found', 404);
            return;
        }

        // Only owner can edit content
        if ($discussion['user_id'] != $userId && !isset($body['is_pinned']) && !isset($body['is_resolved'])) {
            Response::error('Not authorized', 403);
            return;
        }

        $updates = [];
        $params = [];

        if (isset($body['content'])) {
            $updates[] = 'content = ?';
            $params[] = trim($body['content']);
        }
        if (isset($body['title'])) {
            $updates[] = 'title = ?';
            $params[] = trim($body['title']);
        }
        if (isset($body['is_pinned'])) {
            $updates[] = 'is_pinned = ?';
            $params[] = (int)$body['is_pinned'];
        }
        if (isset($body['is_resolved'])) {
            $updates[] = 'is_resolved = ?';
            $params[] = (int)$body['is_resolved'];
        }

        if (empty($updates)) {
            Response::error('No fields to update', 422);
            return;
        }

        $params[] = $id;
        $stmt = $pdo->prepare("UPDATE course_discussions SET " . implode(', ', $updates) . " WHERE id = ?");
        $stmt->execute($params);

        $stmt = $pdo->prepare("
            SELECT cd.*, u.name as user_name, u.email as user_email
            FROM course_discussions cd
            LEFT JOIN users u ON cd.user_id = u.id
            WHERE cd.id = ?
        ");
        $stmt->execute([$id]);
        $discussion = $stmt->fetch();

        Response::json($discussion);
    }

    /**
     * DELETE /discussions/{id}
     */
    public static function delete(string $id): void {
        $userId = Auth::userIdOrFail();
        $pdo = Database::conn();

        // Verify ownership
        $stmt = $pdo->prepare("SELECT user_id, parent_id FROM course_discussions WHERE id = ?");
        $stmt->execute([$id]);
        $discussion = $stmt->fetch();

        if (!$discussion) {
            Response::error('Discussion not found', 404);
            return;
        }

        if ($discussion['user_id'] != $userId) {
            Response::error('Not authorized', 403);
            return;
        }

        // If this is a reply, update parent's reply count
        if ($discussion['parent_id']) {
            $stmt = $pdo->prepare("
                UPDATE course_discussions 
                SET reply_count = reply_count - 1 
                WHERE id = ? AND reply_count > 0
            ");
            $stmt->execute([$discussion['parent_id']]);
        }

        $stmt = $pdo->prepare("DELETE FROM course_discussions WHERE id = ?");
        $stmt->execute([$id]);

        Response::json(['success' => true]);
    }

    /**
     * POST /discussions/{id}/reply
     */
    public static function reply(string $id): void {
        $userId = Auth::userIdOrFail();
        $pdo = Database::conn();
        $body = get_json_body();

        // Get parent discussion
        $stmt = $pdo->prepare("SELECT course_id, lesson_id FROM course_discussions WHERE id = ?");
        $stmt->execute([$id]);
        $parent = $stmt->fetch();

        if (!$parent) {
            Response::error('Discussion not found', 404);
            return;
        }

        $content = trim($body['content'] ?? '');
        if (!$content) {
            Response::error('Content is required', 422);
            return;
        }

        $stmt = $pdo->prepare("
            INSERT INTO course_discussions (course_id, lesson_id, user_id, parent_id, content, created_at)
            VALUES (?, ?, ?, ?, ?, NOW())
        ");
        $stmt->execute([
            $parent['course_id'],
            $parent['lesson_id'],
            $userId,
            $id,
            $content
        ]);

        $replyId = $pdo->lastInsertId();

        // Update parent's reply count
        $stmt = $pdo->prepare("UPDATE course_discussions SET reply_count = reply_count + 1 WHERE id = ?");
        $stmt->execute([$id]);

        $stmt = $pdo->prepare("
            SELECT cd.*, u.name as user_name, u.email as user_email
            FROM course_discussions cd
            LEFT JOIN users u ON cd.user_id = u.id
            WHERE cd.id = ?
        ");
        $stmt->execute([$replyId]);
        $reply = $stmt->fetch();

        Response::json($reply, 201);
    }
}
