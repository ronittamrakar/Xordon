<?php
/**
 * Task Dependencies Controller
 * Manage task dependencies (blocking relationships)
 */

require_once __DIR__ . '/../Database.php';
require_once __DIR__ . '/../Response.php';
require_once __DIR__ . '/../Auth.php';

class TaskDependenciesController {
    
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
     * GET /tasks/{taskId}/dependencies
     */
    public static function index(string $taskId): void {
        Auth::userIdOrFail();
        $pdo = Database::conn();

        if (!self::verifyTaskAccess($pdo, (int)$taskId)) {
            Response::error('Task not found', 404);
            return;
        }

        // Get tasks this task depends on (blocking this task)
        $stmt = $pdo->prepare("
            SELECT td.*, 
                   t.title as depends_on_title, 
                   t.status as depends_on_status,
                   t.priority as depends_on_priority
            FROM task_dependencies td
            JOIN sales_tasks t ON td.depends_on_task_id = t.id
            WHERE td.task_id = ?
            ORDER BY td.created_at DESC
        ");
        $stmt->execute([$taskId]);
        $dependsOn = $stmt->fetchAll();

        // Get tasks that depend on this task (blocked by this task)
        $stmt = $pdo->prepare("
            SELECT td.*, 
                   t.title as blocking_title, 
                   t.status as blocking_status,
                   t.priority as blocking_priority
            FROM task_dependencies td
            JOIN sales_tasks t ON td.task_id = t.id
            WHERE td.depends_on_task_id = ?
            ORDER BY td.created_at DESC
        ");
        $stmt->execute([$taskId]);
        $blockedBy = $stmt->fetchAll();

        Response::json([
            'depends_on' => $dependsOn,
            'blocking' => $blockedBy
        ]);
    }

    /**
     * POST /tasks/{taskId}/dependencies
     */
    public static function create(string $taskId): void {
        Auth::userIdOrFail();
        $pdo = Database::conn();
        $body = get_json_body();

        if (!self::verifyTaskAccess($pdo, (int)$taskId)) {
            Response::error('Task not found', 404);
            return;
        }

        $dependsOnTaskId = $body['depends_on_task_id'] ?? null;
        $dependencyType = $body['dependency_type'] ?? 'blocks';

        if (!$dependsOnTaskId) {
            Response::error('depends_on_task_id is required', 422);
            return;
        }

        // Verify the target task exists and is accessible
        if (!self::verifyTaskAccess($pdo, (int)$dependsOnTaskId)) {
            Response::error('Target task not found', 404);
            return;
        }

        // Prevent self-dependency
        if ((int)$taskId === (int)$dependsOnTaskId) {
            Response::error('A task cannot depend on itself', 422);
            return;
        }

        // Check for circular dependency
        if (self::wouldCreateCircularDependency($pdo, (int)$taskId, (int)$dependsOnTaskId)) {
            Response::error('This would create a circular dependency', 422);
            return;
        }

        // Check if dependency already exists
        $stmt = $pdo->prepare("SELECT id FROM task_dependencies WHERE task_id = ? AND depends_on_task_id = ?");
        $stmt->execute([$taskId, $dependsOnTaskId]);
        if ($stmt->fetch()) {
            Response::error('This dependency already exists', 422);
            return;
        }

        $stmt = $pdo->prepare("
            INSERT INTO task_dependencies (task_id, depends_on_task_id, dependency_type, created_at)
            VALUES (?, ?, ?, NOW())
        ");
        $stmt->execute([$taskId, $dependsOnTaskId, $dependencyType]);

        $id = $pdo->lastInsertId();

        $stmt = $pdo->prepare("
            SELECT td.*, t.title as depends_on_title
            FROM task_dependencies td
            JOIN sales_tasks t ON td.depends_on_task_id = t.id
            WHERE td.id = ?
        ");
        $stmt->execute([$id]);
        $dependency = $stmt->fetch();

        Response::json($dependency, 201);
    }

    /**
     * DELETE /tasks/{taskId}/dependencies/{id}
     */
    public static function delete(string $taskId, string $id): void {
        Auth::userIdOrFail();
        $pdo = Database::conn();

        if (!self::verifyTaskAccess($pdo, (int)$taskId)) {
            Response::error('Task not found', 404);
            return;
        }

        $stmt = $pdo->prepare("DELETE FROM task_dependencies WHERE id = ? AND task_id = ?");
        $stmt->execute([$id, $taskId]);

        if ($stmt->rowCount() === 0) {
            Response::error('Dependency not found', 404);
            return;
        }

        Response::json(['success' => true]);
    }

    /**
     * Check if adding a dependency would create a circular reference
     */
    private static function wouldCreateCircularDependency(PDO $pdo, int $taskId, int $dependsOnTaskId): bool {
        $visited = [];
        $queue = [$dependsOnTaskId];

        while (!empty($queue)) {
            $current = array_shift($queue);
            
            if ($current === $taskId) {
                return true; // Circular dependency detected
            }
            
            if (in_array($current, $visited)) {
                continue;
            }
            $visited[] = $current;

            // Get all tasks that $current depends on
            $stmt = $pdo->prepare("SELECT depends_on_task_id FROM task_dependencies WHERE task_id = ?");
            $stmt->execute([$current]);
            while ($row = $stmt->fetch()) {
                $queue[] = (int)$row['depends_on_task_id'];
            }
        }

        return false;
    }

    /**
     * GET /tasks/{taskId}/dependencies/check
     * Check if a task can start based on its dependencies
     */
    public static function checkBlocked(string $taskId): void {
        Auth::userIdOrFail();
        $pdo = Database::conn();

        if (!self::verifyTaskAccess($pdo, (int)$taskId)) {
            Response::error('Task not found', 404);
            return;
        }

        $stmt = $pdo->prepare("
            SELECT t.id, t.title, t.status
            FROM task_dependencies td
            JOIN sales_tasks t ON td.depends_on_task_id = t.id
            WHERE td.task_id = ? AND t.status != 'completed'
        ");
        $stmt->execute([$taskId]);
        $blockers = $stmt->fetchAll();

        Response::json([
            'is_blocked' => count($blockers) > 0,
            'blocking_tasks' => $blockers
        ]);
    }
}
