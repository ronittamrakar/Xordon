<?php
require_once __DIR__ . '/../Database.php';
require_once __DIR__ . '/../Response.php';
require_once __DIR__ . '/../Auth.php';
require_once __DIR__ . '/ActivitiesController.php';

class TasksController {
    
    /**
     * Get workspace scope for multi-tenancy. Falls back to user_id if no workspace context.
     */
    private static function getWorkspaceScope(): array {
        $ctx = $GLOBALS['tenantContext'] ?? null;
        if ($ctx && isset($ctx->workspaceId)) {
            return ['col' => 'workspace_id', 'val' => (int)$ctx->workspaceId];
        }
        return ['col' => 'user_id', 'val' => Auth::userIdOrFail()];
    }
    
    // Get all tasks
    public static function index(): void {
        $userId = Auth::userIdOrFail();
        $scope = self::getWorkspaceScope();
        $status = $_GET['status'] ?? null;
        $type = $_GET['type'] ?? null;
        $priority = $_GET['priority'] ?? null;
        $dueDate = $_GET['due_date'] ?? null;
        $contactId = $_GET['contact_id'] ?? null;
        $pdo = Database::conn();
        
        $sql = "
            SELECT t.*, 
                   c.name as contact_name, c.email as contact_email,
                   u.name as assigned_to_name,
                   p.title as project_title
            FROM sales_tasks t
            LEFT JOIN contacts c ON t.contact_id = c.id
            LEFT JOIN users u ON t.assigned_to = u.id
            LEFT JOIN projects p ON t.project_id = p.id
            WHERE t.{$scope['col']} = ?
        ";
        $params = [$scope['val']];
        
        if ($status) {
            $sql .= ' AND t.status = ?';
            $params[] = $status;
        }
        
        if ($type) {
            $sql .= ' AND t.task_type = ?';
            $params[] = $type;
        }
        
        if ($priority) {
            $sql .= ' AND t.priority = ?';
            $params[] = $priority;
        }
        
        if ($dueDate === 'today') {
            $sql .= ' AND DATE(t.due_date) = CURDATE()';
        } elseif ($dueDate === 'overdue') {
            $sql .= ' AND t.due_date < NOW() AND t.status NOT IN ("completed", "cancelled")';
        } elseif ($dueDate === 'upcoming') {
            $sql .= ' AND t.due_date BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL 7 DAY)';
        }
        
        if ($contactId) {
            $sql .= ' AND t.contact_id = ?';
            $params[] = $contactId;
        }
        
        $sql .= ' ORDER BY 
            CASE WHEN t.status = "in_progress" THEN 0 
                 WHEN t.status = "pending" THEN 1 
                 ELSE 2 END,
            t.due_date ASC, 
            FIELD(t.priority, "urgent", "high", "medium", "low")
        ';
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        
        $tasks = $stmt->fetchAll();
        foreach ($tasks as &$t) {
            $t['tags'] = json_decode($t['tags'] ?? '[]', true);
            $t['subtasks'] = json_decode($t['subtasks'] ?? '[]', true);
        }
        
        Response::json(['items' => $tasks]);
    }
    
    // Get today's tasks (dashboard view)
    public static function getToday(): void {
        $userId = Auth::userIdOrFail();
        $scope = self::getWorkspaceScope();
        $pdo = Database::conn();
        
        // Today's tasks
        $stmt = $pdo->prepare("
            SELECT t.*, c.name as contact_name, c.email as contact_email, c.whatsapp_number as contact_phone
            FROM sales_tasks t
            LEFT JOIN contacts c ON t.contact_id = c.id
            WHERE t.{$scope['col']} = ? 
            AND DATE(t.due_date) = CURDATE()
            AND t.status NOT IN ('completed', 'cancelled')
            ORDER BY t.due_time ASC, FIELD(t.priority, 'urgent', 'high', 'medium', 'low')
        ");
        $stmt->execute([$scope['val']]);
        $todayTasks = $stmt->fetchAll();
        
        // Overdue tasks
        $stmt = $pdo->prepare("
            SELECT t.*, c.name as contact_name, c.whatsapp_number as contact_phone
            FROM sales_tasks t
            LEFT JOIN contacts c ON t.contact_id = c.id
            WHERE t.{$scope['col']} = ? 
            AND t.due_date < CURDATE()
            AND t.status NOT IN ('completed', 'cancelled')
            ORDER BY t.due_date ASC
            LIMIT 10
        ");
        $stmt->execute([$scope['val']]);
        $overdueTasks = $stmt->fetchAll();
        
        // Upcoming (next 7 days)
        $stmt = $pdo->prepare("
            SELECT t.*, c.name as contact_name, c.whatsapp_number as contact_phone
            FROM sales_tasks t
            LEFT JOIN contacts c ON t.contact_id = c.id
            WHERE t.{$scope['col']} = ? 
            AND DATE(t.due_date) > CURDATE()
            AND DATE(t.due_date) <= DATE_ADD(CURDATE(), INTERVAL 7 DAY)
            AND t.status NOT IN ('completed', 'cancelled')
            ORDER BY t.due_date ASC
            LIMIT 10
        ");
        $stmt->execute([$scope['val']]);
        $upcomingTasks = $stmt->fetchAll();
        
        // Today's stats
        $stmt = $pdo->prepare("
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
                SUM(CASE WHEN task_type = 'call' THEN 1 ELSE 0 END) as calls,
                SUM(CASE WHEN task_type = 'email' THEN 1 ELSE 0 END) as emails,
                SUM(CASE WHEN task_type = 'meeting' THEN 1 ELSE 0 END) as meetings
            FROM sales_tasks
            WHERE {$scope['col']} = ? AND DATE(due_date) = CURDATE()
        ");
        $stmt->execute([$scope['val']]);
        $stats = $stmt->fetch();
        
        Response::json([
            'today' => $todayTasks,
            'overdue' => $overdueTasks,
            'upcoming' => $upcomingTasks,
            'stats' => $stats
        ]);
    }
    
    // Get single task
    public static function show(string $id): void {
        $userId = Auth::userIdOrFail();
        $scope = self::getWorkspaceScope();
        $pdo = Database::conn();
        
        $stmt = $pdo->prepare("
            SELECT t.*, c.name as contact_name, c.email as contact_email, c.whatsapp_number as contact_phone
            FROM sales_tasks t
            LEFT JOIN contacts c ON t.contact_id = c.id
            WHERE t.id = ? AND t.{$scope['col']} = ?
        ");
        $stmt->execute([$id, $scope['val']]);
        $task = $stmt->fetch();
        
        if (!$task) {
            Response::error('Task not found', 404);
            return;
        }
        
        $task['tags'] = json_decode($task['tags'] ?? '[]', true);
        $task['subtasks'] = json_decode($task['subtasks'] ?? '[]', true);
        Response::json($task);
    }
    
    // Create task
    public static function create(): void {
        $userId = Auth::userIdOrFail();
        $scope = self::getWorkspaceScope();
        $body = get_json_body();
        $pdo = Database::conn();
        
        $title = trim($body['title'] ?? '');
        if (!$title) {
            Response::error('Task title is required', 422);
            return;
        }
        
        $due_date = $body['due_date'] ?? null;
        if ($due_date === '') $due_date = null;
        
        $stmt = $pdo->prepare('
            INSERT INTO sales_tasks 
            (workspace_id, user_id, client_id, assigned_to, contact_id, company_id, deal_id, project_id, title, description, task_type, priority, status, due_date, due_time, reminder_at, related_entity_type, related_entity_id, tags, subtasks, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
        ');
        $stmt->execute([
            $scope['val'],
            $userId,
            $body['client_id'] ?? null,
            $body['assigned_to'] ?? $userId,
            $body['contact_id'] ?? null,
            $body['company_id'] ?? null,
            $body['deal_id'] ?? null,
            $body['project_id'] ?? null,
            $title,
            $body['description'] ?? null,
            $body['task_type'] ?? 'other',
            $body['priority'] ?? 'medium',
            $body['status'] ?? 'pending',
            $due_date,
            $body['due_time'] ?? null,
            $body['reminder_at'] ?? null,
            $body['related_entity_type'] ?? null,
            $body['related_entity_id'] ?? null,
            json_encode($body['tags'] ?? []),
            json_encode($body['subtasks'] ?? [])
        ]);
        
        
        $id = (int)$pdo->lastInsertId();
        $stmt = $pdo->prepare('SELECT * FROM sales_tasks WHERE id = ?');
        $stmt->execute([$id]);
        $task = $stmt->fetch();
        $task['tags'] = json_decode($task['tags'] ?? '[]', true);
        $task['subtasks'] = json_decode($task['subtasks'] ?? '[]', true);
        
        // Log activity
        if (class_exists('ActivitiesController')) {
            ActivitiesController::log(
                $scope['val'],
                'sales_task',
                $id,
                'created',
                'Task created: ' . $title,
                null,
                null,
                ['priority' => $body['priority'] ?? 'medium']
            );
        }

        Response::json($task, 201);
    }
    
    // Update task
    public static function update(string $id): void {
        $userId = Auth::userIdOrFail();
        $scope = self::getWorkspaceScope();
        $body = get_json_body();
        $pdo = Database::conn();
        
        $due_date = $body['due_date'] ?? null;
        if ($due_date === '') $due_date = null;
        
        $stmt = $pdo->prepare("
            UPDATE sales_tasks SET
                title = COALESCE(?, title),
                description = COALESCE(?, description),
                task_type = COALESCE(?, task_type),
                priority = COALESCE(?, priority),
                status = COALESCE(?, status),
                due_date = COALESCE(?, due_date),
                due_time = COALESCE(?, due_time),
                reminder_at = COALESCE(?, reminder_at),
                assigned_to = COALESCE(?, assigned_to),
                contact_id = COALESCE(?, contact_id),
                tags = COALESCE(?, tags),
                subtasks = COALESCE(?, subtasks),
                updated_at = NOW()
            WHERE id = ? AND {$scope['col']} = ?
        ");
        $stmt->execute([
            $body['title'] ?? null,
            $body['description'] ?? null,
            $body['task_type'] ?? null,
            $body['priority'] ?? null,
            $body['status'] ?? null,
            $due_date,
            $body['due_time'] ?? null,
            $body['reminder_at'] ?? null,
            $body['assigned_to'] ?? null,
            $body['contact_id'] ?? null,
            isset($body['tags']) ? json_encode($body['tags']) : null,
            isset($body['subtasks']) ? json_encode($body['subtasks']) : null,
            $id,
            $scope['val']
        ]);
        
        $stmt = $pdo->prepare('SELECT * FROM sales_tasks WHERE id = ?');
        $stmt->execute([$id]);
        $task = $stmt->fetch();
        $task['tags'] = json_decode($task['tags'] ?? '[]', true);
        $task['subtasks'] = json_decode($task['subtasks'] ?? '[]', true);

        // Log activity
        if (class_exists('ActivitiesController')) {
            $changes = [];
            if (isset($body['status']) && $body['status'] !== $task['status']) {
                $changes['status'] = ['from' => 'unknown', 'to' => $body['status']];
            }
             if (isset($body['priority']) && $body['priority'] !== $task['priority']) {
                $changes['priority'] = ['from' => 'unknown', 'to' => $body['priority']];
            }
            
            if (!empty($changes) || isset($body['description'])) {
                 ActivitiesController::log(
                    $scope['val'],
                    'sales_task',
                    $id,
                    'updated',
                    'Task updated',
                    null,
                    $changes
                );
            }
        }
        
        Response::json($task);
    }
    
    // Complete task
    public static function complete(string $id): void {
        $userId = Auth::userIdOrFail();
        $scope = self::getWorkspaceScope();
        $body = get_json_body();
        $pdo = Database::conn();
        
        $stmt = $pdo->prepare("
            UPDATE sales_tasks SET
                status = 'completed',
                completed_at = NOW(),
                outcome = ?,
                outcome_type = ?,
                updated_at = NOW()
            WHERE id = ? AND {$scope['col']} = ?
        ");
        $stmt->execute([
            $body['outcome'] ?? null,
            $body['outcome_type'] ?? null,
            $id,
            $scope['val']
        ]);
        
        // Update daily goals
        $stmt = $pdo->prepare('SELECT task_type FROM sales_tasks WHERE id = ?');
        $stmt->execute([$id]);
        $task = $stmt->fetch();
        
        if ($task) {
            $type = $task['task_type'];
            $field = match($type) {
                'call' => 'calls_completed',
                'email' => 'emails_completed',
                'meeting' => 'meetings_completed',
                default => 'tasks_completed'
            };
            
            $stmt = $pdo->prepare("
                INSERT INTO daily_goals (user_id, date, {$field})
                VALUES (?, CURDATE(), 1)
                ON DUPLICATE KEY UPDATE {$field} = {$field} + 1
            ");
            $stmt->execute([$userId]);
        }

        // Log activity
        if (class_exists('ActivitiesController')) {
            ActivitiesController::log(
                $scope['val'],
                'sales_task',
                $id,
                'completed',
                'Task completed',
                $body['outcome'] ?? null
            );
        }
        
        Response::json(['success' => true]);
    }
    
    // Delete task
    public static function delete(string $id): void {
        $userId = Auth::userIdOrFail();
        $scope = self::getWorkspaceScope();
        $pdo = Database::conn();
        
        $stmt = $pdo->prepare("DELETE FROM sales_tasks WHERE id = ? AND {$scope['col']} = ?");
        $stmt->execute([$id, $scope['val']]);
        
        Response::json(['success' => true]);
    }
    
    // Bulk update tasks
    public static function bulkUpdate(): void {
        $userId = Auth::userIdOrFail();
        $scope = self::getWorkspaceScope();
        $body = get_json_body();
        $pdo = Database::conn();
        
        $ids = $body['ids'] ?? [];
        $action = $body['action'] ?? '';
        
        if (empty($ids)) {
            Response::error('No tasks selected', 422);
            return;
        }
        
        $placeholders = implode(',', array_fill(0, count($ids), '?'));
        
        switch ($action) {
            case 'complete':
                $stmt = $pdo->prepare("UPDATE sales_tasks SET status = 'completed', completed_at = NOW() WHERE id IN ({$placeholders}) AND {$scope['col']} = ?");
                break;
            case 'delete':
                $stmt = $pdo->prepare("DELETE FROM sales_tasks WHERE id IN ({$placeholders}) AND {$scope['col']} = ?");
                break;
            case 'reschedule':
                $newDate = $body['due_date'] ?? date('Y-m-d', strtotime('+1 day'));
                $stmt = $pdo->prepare("UPDATE sales_tasks SET due_date = ?, updated_at = NOW() WHERE id IN ({$placeholders}) AND {$scope['col']} = ?");
                $stmt->execute(array_merge([$newDate], $ids, [$scope['val']]));
                Response::json(['success' => true]);
                return;
            default:
                Response::error('Invalid action', 422);
                return;
        }
        
        $stmt->execute(array_merge($ids, [$scope['val']]));
        Response::json(['success' => true, 'affected' => $stmt->rowCount()]);
    }
    
    // Get daily goals
    public static function getDailyGoals(): void {
        $userId = Auth::userIdOrFail();
        $date = $_GET['date'] ?? date('Y-m-d');
        $pdo = Database::conn();
        
        $stmt = $pdo->prepare('SELECT * FROM daily_goals WHERE user_id = ? AND date = ?');
        $stmt->execute([$userId, $date]);
        $goals = $stmt->fetch();
        
        if (!$goals) {
            $goals = [
                'user_id' => $userId,
                'date' => $date,
                'calls_goal' => 20,
                'calls_completed' => 0,
                'emails_goal' => 50,
                'emails_completed' => 0,
                'meetings_goal' => 3,
                'meetings_completed' => 0,
                'tasks_goal' => 10,
                'tasks_completed' => 0
            ];
        }
        
        Response::json($goals);
    }
    
    // Update daily goals
    public static function updateDailyGoals(): void {
        $userId = Auth::userIdOrFail();
        $body = get_json_body();
        $date = $body['date'] ?? date('Y-m-d');
        $pdo = Database::conn();
        
        $stmt = $pdo->prepare('
            INSERT INTO daily_goals (user_id, date, calls_goal, emails_goal, meetings_goal, tasks_goal, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
                calls_goal = COALESCE(VALUES(calls_goal), calls_goal),
                emails_goal = COALESCE(VALUES(emails_goal), emails_goal),
                meetings_goal = COALESCE(VALUES(meetings_goal), meetings_goal),
                tasks_goal = COALESCE(VALUES(tasks_goal), tasks_goal),
                notes = COALESCE(VALUES(notes), notes),
                updated_at = NOW()
        ');
        $stmt->execute([
            $userId,
            $date,
            $body['calls_goal'] ?? 20,
            $body['emails_goal'] ?? 50,
            $body['meetings_goal'] ?? 3,
            $body['tasks_goal'] ?? 10,
            $body['notes'] ?? null
        ]);
        
        $stmt = $pdo->prepare('SELECT * FROM daily_goals WHERE user_id = ? AND date = ?');
        $stmt->execute([$userId, $date]);
        
        Response::json($stmt->fetch());
    }
    
    // Get task activity
    public static function getActivity(string $id): void {
        $scope = self::getWorkspaceScope();
        // Verify access
        $pdo = Database::conn();
        $stmt = $pdo->prepare("SELECT id FROM sales_tasks WHERE id = ? AND {$scope['col']} = ?");
        $stmt->execute([$id, $scope['val']]);
        if (!$stmt->fetch()) {
            Response::error('Task not found', 404);
            return;
        }

        if (class_exists('ActivitiesController')) {
            // Mock $_GET for the controller if needed or just call logic
            // ActivitiesController reads $_GET['limit'], etc.
            // We can explicitly set them or rely on pass-through if this is same request
            ActivitiesController::forEntity('sales_task', $id);
        } else {
            Response::json(['data' => []]);
        }
    }

    // Get task types
    public static function getTypes(): void {
        $types = [
            ['value' => 'call', 'label' => 'Call', 'icon' => 'phone'],
            ['value' => 'email', 'label' => 'Email', 'icon' => 'mail'],
            ['value' => 'sms', 'label' => 'SMS', 'icon' => 'message-square'],
            ['value' => 'meeting', 'label' => 'Meeting', 'icon' => 'calendar'],
            ['value' => 'follow_up', 'label' => 'Follow Up', 'icon' => 'refresh-cw'],
            ['value' => 'demo', 'label' => 'Demo', 'icon' => 'presentation'],
            ['value' => 'proposal', 'label' => 'Proposal', 'icon' => 'file-text'],
            ['value' => 'other', 'label' => 'Other', 'icon' => 'more-horizontal']
        ];
        
        Response::json(['items' => $types]);
    }
}
