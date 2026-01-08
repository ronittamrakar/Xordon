<?php
require_once __DIR__ . '/../Database.php';
require_once __DIR__ . '/../Response.php';
require_once __DIR__ . '/../Auth.php';

class TaskCommentsController {
    
    private static function getWorkspaceScope(): array {
        $ctx = $GLOBALS['tenantContext'] ?? null;
        if ($ctx && isset($ctx->workspaceId)) {
            return ['col' => 'workspace_id', 'val' => (int)$ctx->workspaceId];
        }
        return ['col' => 'user_id', 'val' => Auth::userIdOrFail()];
    }

    public static function index(string $taskId): void {
        $userId = Auth::userIdOrFail();
        $scope = self::getWorkspaceScope();
        $pdo = Database::conn();
        
        // Check task access
        $stmt = $pdo->prepare("SELECT id FROM sales_tasks WHERE id = ? AND {$scope['col']} = ?");
        $stmt->execute([$taskId, $scope['val']]);
        if (!$stmt->fetch()) {
            Response::error('Task not found', 404);
            return;
        }

        $stmt = $pdo->prepare("
            SELECT tc.*, u.name as user_name, u.email as user_email
            FROM task_comments tc
            JOIN users u ON tc.user_id = u.id
            WHERE tc.task_id = ?
            ORDER BY tc.created_at ASC
        ");
        $stmt->execute([$taskId]);
        $comments = $stmt->fetchAll();

        Response::json(['items' => $comments]);
    }

    public static function create(string $taskId): void {
        $userId = Auth::userIdOrFail();
        $scope = self::getWorkspaceScope();
        $body = get_json_body();
        $pdo = Database::conn();

        // Check task access
        $stmt = $pdo->prepare("SELECT id FROM sales_tasks WHERE id = ? AND {$scope['col']} = ?");
        $stmt->execute([$taskId, $scope['val']]);
        if (!$stmt->fetch()) {
            Response::error('Task not found', 404);
            return;
        }

        $content = trim($body['content'] ?? '');
        if (!$content) {
            Response::error('Content is required', 422);
            return;
        }

        $stmt = $pdo->prepare("
            INSERT INTO task_comments (task_id, user_id, content, created_at)
            VALUES (?, ?, ?, NOW())
        ");
        $stmt->execute([$taskId, $userId, $content]);

        $id = $pdo->lastInsertId();
        
        // Return full comment object
        $stmt = $pdo->prepare("
            SELECT tc.*, u.name as user_name, u.email as user_email
            FROM task_comments tc
            JOIN users u ON tc.user_id = u.id
            WHERE tc.id = ?
        ");
        $stmt->execute([$id]);
        $comment = $stmt->fetch();

        Response::json($comment, 201);
    }
    
    public static function delete(string $taskId, string $commentId): void {
        $userId = Auth::userIdOrFail();
        $scope = self::getWorkspaceScope();
        $pdo = Database::conn();

        // Check task access
        $stmt = $pdo->prepare("SELECT id FROM sales_tasks WHERE id = ? AND {$scope['col']} = ?");
        $stmt->execute([$taskId, $scope['val']]);
        if (!$stmt->fetch()) {
            Response::error('Task not found', 404);
            return;
        }

        // Check comment ownership or ownership of task (optional: allow admins/task owners to delete others' comments?)
        // simplified: only comment author can delete
        $stmt = $pdo->prepare("DELETE FROM task_comments WHERE id = ? AND task_id = ? AND user_id = ?");
        $stmt->execute([$commentId, $taskId, $userId]);

        if ($stmt->rowCount() === 0) {
             Response::error('Comment not found or access denied', 403);
             return;
        }

        Response::json(['success' => true]);
    }
}
