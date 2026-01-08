<?php
/**
 * Task Subtasks Controller
 * Manage subtasks within tasks
 */

require_once __DIR__ . '/../Database.php';
require_once __DIR__ . '/../Response.php';
require_once __DIR__ . '/../Auth.php';

class TaskSubtasksController {
    
    private static function getWorkspaceScope(): array {
        $ctx = $GLOBALS['tenantContext'] ?? null;
        if ($ctx && isset($ctx->workspaceId)) {
            return ['col' => 'workspace_id', 'val' => (int)$ctx->workspaceId];
        }
        return ['col' => 'user_id', 'val' => Auth::userIdOrFail()];
    }

    private static function verifyTaskAccess(PDO $pdo, int $taskId): bool {
        $scope = self::getWorkspaceScope();
        $stmt = $pdo->prepare("SELECT id FROM sales_tasks WHERE id = ? AND {$scope['col']} = ?");
        $stmt->execute([$taskId, $scope['val']]);
        return (bool)$stmt->fetch();
    }

    /**
     * GET /tasks/{taskId}/subtasks
     */
    public static function index(string $taskId): void {
        Auth::userIdOrFail();
        $pdo = Database::conn();

        if (!self::verifyTaskAccess($pdo, (int)$taskId)) {
            Response::error('Task not found', 404);
            return;
        }

        $stmt = $pdo->prepare("
            SELECT ts.*, u.name as assigned_to_name
            FROM task_subtasks ts
            LEFT JOIN users u ON ts.assigned_to = u.id
            WHERE ts.task_id = ?
            ORDER BY ts.position ASC, ts.created_at ASC
        ");
        $stmt->execute([$taskId]);
        $subtasks = $stmt->fetchAll();

        Response::json(['items' => $subtasks]);
    }

    /**
     * POST /tasks/{taskId}/subtasks
     */
    public static function create(string $taskId): void {
        Auth::userIdOrFail();
        $pdo = Database::conn();
        $body = get_json_body();

        if (!self::verifyTaskAccess($pdo, (int)$taskId)) {
            Response::error('Task not found', 404);
            return;
        }

        $title = trim($body['title'] ?? '');
        if (!$title) {
            Response::error('Title is required', 422);
            return;
        }

        // Get next position
        $stmt = $pdo->prepare("SELECT COALESCE(MAX(position), -1) + 1 as next_pos FROM task_subtasks WHERE task_id = ?");
        $stmt->execute([$taskId]);
        $position = $stmt->fetchColumn();

        $stmt = $pdo->prepare("
            INSERT INTO task_subtasks (task_id, title, completed, assigned_to, position, created_at)
            VALUES (?, ?, ?, ?, ?, NOW())
        ");
        $stmt->execute([
            $taskId,
            $title,
            (int)($body['completed'] ?? false),
            $body['assigned_to'] ?? null,
            $position
        ]);

        $id = $pdo->lastInsertId();

        // Update task subtask counts
        self::updateSubtaskCounts($pdo, (int)$taskId);

        // Fetch and return
        $stmt = $pdo->prepare("SELECT * FROM task_subtasks WHERE id = ?");
        $stmt->execute([$id]);
        $subtask = $stmt->fetch();

        Response::json($subtask, 201);
    }

    /**
     * PUT /tasks/{taskId}/subtasks/{id}
     */
    public static function update(string $taskId, string $id): void {
        Auth::userIdOrFail();
        $pdo = Database::conn();
        $body = get_json_body();

        if (!self::verifyTaskAccess($pdo, (int)$taskId)) {
            Response::error('Task not found', 404);
            return;
        }

        $updates = [];
        $params = [];

        if (isset($body['title'])) {
            $updates[] = 'title = ?';
            $params[] = trim($body['title']);
        }
        if (isset($body['completed'])) {
            $updates[] = 'completed = ?';
            $params[] = (int)$body['completed'];
        }
        if (array_key_exists('assigned_to', $body)) {
            $updates[] = 'assigned_to = ?';
            $params[] = $body['assigned_to'];
        }
        if (isset($body['position'])) {
            $updates[] = 'position = ?';
            $params[] = (int)$body['position'];
        }

        if (empty($updates)) {
            Response::error('No fields to update', 422);
            return;
        }

        $params[] = $id;
        $params[] = $taskId;

        $stmt = $pdo->prepare("UPDATE task_subtasks SET " . implode(', ', $updates) . " WHERE id = ? AND task_id = ?");
        $stmt->execute($params);

        if ($stmt->rowCount() === 0) {
            Response::error('Subtask not found', 404);
            return;
        }

        // Update task subtask counts
        self::updateSubtaskCounts($pdo, (int)$taskId);

        $stmt = $pdo->prepare("SELECT * FROM task_subtasks WHERE id = ?");
        $stmt->execute([$id]);
        $subtask = $stmt->fetch();

        Response::json($subtask);
    }

    /**
     * DELETE /tasks/{taskId}/subtasks/{id}
     */
    public static function delete(string $taskId, string $id): void {
        Auth::userIdOrFail();
        $pdo = Database::conn();

        if (!self::verifyTaskAccess($pdo, (int)$taskId)) {
            Response::error('Task not found', 404);
            return;
        }

        $stmt = $pdo->prepare("DELETE FROM task_subtasks WHERE id = ? AND task_id = ?");
        $stmt->execute([$id, $taskId]);

        if ($stmt->rowCount() === 0) {
            Response::error('Subtask not found', 404);
            return;
        }

        // Update task subtask counts
        self::updateSubtaskCounts($pdo, (int)$taskId);

        Response::json(['success' => true]);
    }

    /**
     * POST /tasks/{taskId}/subtasks/reorder
     */
    public static function reorder(string $taskId): void {
        Auth::userIdOrFail();
        $pdo = Database::conn();
        $body = get_json_body();

        if (!self::verifyTaskAccess($pdo, (int)$taskId)) {
            Response::error('Task not found', 404);
            return;
        }

        $order = $body['order'] ?? [];
        if (!is_array($order)) {
            Response::error('Order must be an array of subtask IDs', 422);
            return;
        }

        $stmt = $pdo->prepare("UPDATE task_subtasks SET position = ? WHERE id = ? AND task_id = ?");
        foreach ($order as $position => $subtaskId) {
            $stmt->execute([$position, $subtaskId, $taskId]);
        }

        Response::json(['success' => true]);
    }

    /**
     * POST /tasks/{taskId}/subtasks/{id}/toggle
     */
    public static function toggle(string $taskId, string $id): void {
        Auth::userIdOrFail();
        $pdo = Database::conn();

        if (!self::verifyTaskAccess($pdo, (int)$taskId)) {
            Response::error('Task not found', 404);
            return;
        }

        $stmt = $pdo->prepare("UPDATE task_subtasks SET completed = NOT completed WHERE id = ? AND task_id = ?");
        $stmt->execute([$id, $taskId]);

        if ($stmt->rowCount() === 0) {
            Response::error('Subtask not found', 404);
            return;
        }

        // Update task subtask counts
        self::updateSubtaskCounts($pdo, (int)$taskId);

        $stmt = $pdo->prepare("SELECT * FROM task_subtasks WHERE id = ?");
        $stmt->execute([$id]);
        $subtask = $stmt->fetch();

        Response::json($subtask);
    }

    private static function updateSubtaskCounts(PDO $pdo, int $taskId): void {
        $stmt = $pdo->prepare("
            UPDATE sales_tasks SET 
                subtasks_count = (SELECT COUNT(*) FROM task_subtasks WHERE task_id = ?),
                completed_subtasks_count = (SELECT COUNT(*) FROM task_subtasks WHERE task_id = ? AND completed = 1)
            WHERE id = ?
        ");
        $stmt->execute([$taskId, $taskId, $taskId]);
    }
}
