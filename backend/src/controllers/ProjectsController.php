<?php
require_once __DIR__ . '/../Database.php';
require_once __DIR__ . '/../Response.php';
require_once __DIR__ . '/../Auth.php';

class ProjectsController {
    
    /**
     * Get workspace scope for multi-tenancy
     */
    private static function getWorkspaceScope(): array {
        $ctx = $GLOBALS['tenantContext'] ?? null;
        if ($ctx && isset($ctx->workspaceId)) {
            return ['col' => 'workspace_id', 'val' => (int)$ctx->workspaceId];
        }
        return ['col' => 'user_id', 'val' => Auth::userIdOrFail()];
    }
    
    /**
     * Get all projects
     */
    public static function index(): void {
        $userId = Auth::userIdOrFail();
        $scope = self::getWorkspaceScope();
        $status = $_GET['status'] ?? null;
        $pdo = Database::conn();
        
        $sql = "
            SELECT p.*, 
                   COUNT(DISTINCT t.id) as task_count,
                   COUNT(DISTINCT CASE WHEN t.status = 'completed' THEN t.id END) as completed_tasks,
                   COUNT(DISTINCT pm.user_id) as member_count
            FROM projects p
            LEFT JOIN sales_tasks t ON p.id = t.project_id
            LEFT JOIN project_members pm ON p.id = pm.project_id
            WHERE p.{$scope['col']} = ?
        ";
        $params = [$scope['val']];
        
        if ($status) {
            $sql .= ' AND p.status = ?';
            $params[] = $status;
        }
        
        $sql .= ' GROUP BY p.id ORDER BY p.created_at DESC';
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $projects = $stmt->fetchAll();
        
        foreach ($projects as &$project) {
            $project['tags'] = json_decode($project['tags'] ?? '[]', true);
            $project['settings'] = json_decode($project['settings'] ?? '{}', true);
            
            // Calculate progress
            if ($project['task_count'] > 0) {
                $project['progress_percentage'] = round(($project['completed_tasks'] / $project['task_count']) * 100);
            }
        }
        
        Response::json(['items' => $projects]);
    }
    
    /**
     * Get single project with details
     */
    public static function show(string $id): void {
        $userId = Auth::userIdOrFail();
        $scope = self::getWorkspaceScope();
        $pdo = Database::conn();
        
        $stmt = $pdo->prepare("
            SELECT p.*,
                   COUNT(DISTINCT t.id) as task_count,
                   COUNT(DISTINCT CASE WHEN t.status = 'completed' THEN t.id END) as completed_tasks
            FROM projects p
            LEFT JOIN sales_tasks t ON p.id = t.project_id
            WHERE p.id = ? AND p.{$scope['col']} = ?
            GROUP BY p.id
        ");
        $stmt->execute([$id, $scope['val']]);
        $project = $stmt->fetch();
        
        if (!$project) {
            Response::error('Project not found', 404);
            return;
        }
        
        $project['tags'] = json_decode($project['tags'] ?? '[]', true);
        $project['settings'] = json_decode($project['settings'] ?? '{}', true);
        
        // Get project members
        $stmt = $pdo->prepare("
            SELECT pm.*, u.name, u.email
            FROM project_members pm
            JOIN users u ON pm.user_id = u.id
            WHERE pm.project_id = ?
        ");
        $stmt->execute([$id]);
        $project['members'] = $stmt->fetchAll();
        
        Response::json($project);
    }
    
    /**
     * Create new project
     */
    public static function create(): void {
        $userId = Auth::userIdOrFail();
        $body = get_json_body();
        $pdo = Database::conn();
        
        $title = trim($body['title'] ?? '');
        if (!$title) {
            Response::error('Project title is required', 422);
            return;
        }
        
        $ctx = $GLOBALS['tenantContext'] ?? null;
        $workspaceId = $ctx && isset($ctx->workspaceId) ? (int)$ctx->workspaceId : null;
        
        $start_date = $body['start_date'] ?? null;
        if ($start_date === '') $start_date = null;
        
        $due_date = $body['due_date'] ?? null;
        if ($due_date === '') $due_date = null;
        
        $stmt = $pdo->prepare('
            INSERT INTO projects 
            (user_id, workspace_id, title, description, status, priority, start_date, due_date, color, tags, settings, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
        ');
        $stmt->execute([
            $userId,
            $workspaceId,
            $title,
            $body['description'] ?? null,
            $body['status'] ?? 'active',
            $body['priority'] ?? 'medium',
            $start_date,
            $due_date,
            $body['color'] ?? '#3B82F6',
            json_encode($body['tags'] ?? []),
            json_encode($body['settings'] ?? [])
        ]);
        
        $id = (int)$pdo->lastInsertId();
        
        // Add creator as owner
        $stmt = $pdo->prepare('
            INSERT INTO project_members (project_id, user_id, role)
            VALUES (?, ?, ?)
        ');
        $stmt->execute([$id, $userId, 'owner']);
        
        // Log activity
        $stmt = $pdo->prepare('
            INSERT INTO project_activity (project_id, user_id, action, metadata)
            VALUES (?, ?, ?, ?)
        ');
        $stmt->execute([$id, $userId, 'project_created', json_encode(['title' => $title])]);
        
        // Fetch and return the created project
        $stmt = $pdo->prepare('SELECT * FROM projects WHERE id = ?');
        $stmt->execute([$id]);
        $project = $stmt->fetch();
        $project['tags'] = json_decode($project['tags'] ?? '[]', true);
        $project['settings'] = json_decode($project['settings'] ?? '{}', true);
        
        Response::json($project, 201);
    }
    
    /**
     * Update project
     */
    public static function update(string $id): void {
        $userId = Auth::userIdOrFail();
        $scope = self::getWorkspaceScope();
        $body = get_json_body();
        $pdo = Database::conn();
        
        // Verify project exists and user has access
        $stmt = $pdo->prepare("SELECT id FROM projects WHERE id = ? AND {$scope['col']} = ?");
        $stmt->execute([$id, $scope['val']]);
        if (!$stmt->fetch()) {
            Response::error('Project not found', 404);
            return;
        }
        
        $stmt = $pdo->prepare("
            UPDATE projects SET
                title = COALESCE(?, title),
                description = COALESCE(?, description),
                status = COALESCE(?, status),
                priority = COALESCE(?, priority),
                start_date = COALESCE(?, start_date),
                due_date = COALESCE(?, due_date),
                color = COALESCE(?, color),
                tags = COALESCE(?, tags),
                settings = COALESCE(?, settings),
                updated_at = NOW()
            WHERE id = ? AND {$scope['col']} = ?
        ");
        $start_date = $body['start_date'] ?? null;
        if ($start_date === '') $start_date = null;
        
        $due_date = $body['due_date'] ?? null;
        if ($due_date === '') $due_date = null;
        
        $stmt->execute([
            $body['title'] ?? null,
            $body['description'] ?? null,
            $body['status'] ?? null,
            $body['priority'] ?? null,
            $start_date,
            $due_date,
            $body['color'] ?? null,
            isset($body['tags']) ? json_encode($body['tags']) : null,
            isset($body['settings']) ? json_encode($body['settings']) : null,
            $id,
            $scope['val']
        ]);
        
        // Log activity
        $stmt = $pdo->prepare('
            INSERT INTO project_activity (project_id, user_id, action, metadata)
            VALUES (?, ?, ?, ?)
        ');
        $stmt->execute([$id, $userId, 'project_updated', json_encode($body)]);
        
        // Return updated project
        $stmt = $pdo->prepare('SELECT * FROM projects WHERE id = ?');
        $stmt->execute([$id]);
        $project = $stmt->fetch();
        $project['tags'] = json_decode($project['tags'] ?? '[]', true);
        $project['settings'] = json_decode($project['settings'] ?? '{}', true);
        
        Response::json($project);
    }
    
    /**
     * Delete project
     */
    public static function delete(string $id): void {
        $userId = Auth::userIdOrFail();
        $scope = self::getWorkspaceScope();
        $pdo = Database::conn();
        
        $stmt = $pdo->prepare("DELETE FROM projects WHERE id = ? AND {$scope['col']} = ?");
        $stmt->execute([$id, $scope['val']]);
        
        Response::json(['success' => true]);
    }
    
    /**
     * Get tasks for a project
     */
    public static function getTasks(string $id): void {
        $userId = Auth::userIdOrFail();
        $scope = self::getWorkspaceScope();
        $pdo = Database::conn();
        
        // Verify project access
        $stmt = $pdo->prepare("SELECT id FROM projects WHERE id = ? AND {$scope['col']} = ?");
        $stmt->execute([$id, $scope['val']]);
        if (!$stmt->fetch()) {
            Response::error('Project not found', 404);
            return;
        }
        
        $stmt = $pdo->prepare("
            SELECT t.*, 
                   c.name as contact_name, 
                   c.email as contact_email,
                   u.name as assigned_to_name
            FROM sales_tasks t
            LEFT JOIN contacts c ON t.contact_id = c.id
            LEFT JOIN users u ON t.assigned_to = u.id
            WHERE t.project_id = ?
            ORDER BY 
                CASE WHEN t.status = 'in_progress' THEN 0 
                     WHEN t.status = 'pending' THEN 1 
                     ELSE 2 END,
                t.due_date ASC,
                FIELD(t.priority, 'urgent', 'high', 'medium', 'low')
        ");
        $stmt->execute([$id]);
        $tasks = $stmt->fetchAll();
        
        foreach ($tasks as &$task) {
            $task['tags'] = json_decode($task['tags'] ?? '[]', true);
            $task['subtasks'] = json_decode($task['subtasks'] ?? '[]', true);
        }
        
        Response::json(['items' => $tasks]);
    }
    
    /**
     * Get project activity
     */
    public static function getActivity(string $id): void {
        $userId = Auth::userIdOrFail();
        $scope = self::getWorkspaceScope();
        $pdo = Database::conn();
        
        // Verify project access
        $stmt = $pdo->prepare("SELECT id FROM projects WHERE id = ? AND {$scope['col']} = ?");
        $stmt->execute([$id, $scope['val']]);
        if (!$stmt->fetch()) {
            Response::error('Project not found', 404);
            return;
        }
        
        $stmt = $pdo->prepare("
            SELECT pa.*, u.name as user_name, u.email as user_email
            FROM project_activity pa
            JOIN users u ON pa.user_id = u.id
            WHERE pa.project_id = ?
            ORDER BY pa.created_at DESC
            LIMIT 50
        ");
        $stmt->execute([$id]);
        $activities = $stmt->fetchAll();
        
        foreach ($activities as &$activity) {
            $activity['metadata'] = json_decode($activity['metadata'] ?? '{}', true);
        }
        
        Response::json(['items' => $activities]);
    }
    
    /**
     * Add member to project
     */
    public static function addMember(string $id): void {
        $userId = Auth::userIdOrFail();
        $scope = self::getWorkspaceScope();
        $body = get_json_body();
        $pdo = Database::conn();
        
        // Verify project access
        $stmt = $pdo->prepare("SELECT id FROM projects WHERE id = ? AND {$scope['col']} = ?");
        $stmt->execute([$id, $scope['val']]);
        if (!$stmt->fetch()) {
            Response::error('Project not found', 404);
            return;
        }
        
        $memberId = $body['user_id'] ?? null;
        if (!$memberId) {
            Response::error('User ID is required', 422);
            return;
        }
        
        $stmt = $pdo->prepare('
            INSERT INTO project_members (project_id, user_id, role)
            VALUES (?, ?, ?)
            ON DUPLICATE KEY UPDATE role = VALUES(role)
        ');
        $stmt->execute([$id, $memberId, $body['role'] ?? 'member']);
        
        // Log activity
        $stmt = $pdo->prepare('
            INSERT INTO project_activity (project_id, user_id, action, entity_type, entity_id)
            VALUES (?, ?, ?, ?, ?)
        ');
        $stmt->execute([$id, $userId, 'member_added', 'user', $memberId]);
        
        Response::json(['success' => true]);
    }
    
    /**
     * Remove member from project
     */
    public static function removeMember(string $projectId, string $memberId): void {
        $userId = Auth::userIdOrFail();
        $scope = self::getWorkspaceScope();
        $pdo = Database::conn();
        
        // Verify project access
        $stmt = $pdo->prepare("SELECT id FROM projects WHERE id = ? AND {$scope['col']} = ?");
        $stmt->execute([$projectId, $scope['val']]);
        if (!$stmt->fetch()) {
            Response::error('Project not found', 404);
            return;
        }
        
        $stmt = $pdo->prepare('DELETE FROM project_members WHERE project_id = ? AND user_id = ?');
        $stmt->execute([$projectId, $memberId]);
        
        // Log activity
        $stmt = $pdo->prepare('
            INSERT INTO project_activity (project_id, user_id, action, entity_type, entity_id)
            VALUES (?, ?, ?, ?, ?)
        ');
        $stmt->execute([$projectId, $userId, 'member_removed', 'user', $memberId]);
        
        Response::json(['success' => true]);
    }
    /**
     * Get project analytics
     */
    public static function getAnalytics(): void {
        $userId = Auth::userIdOrFail();
        $scope = self::getWorkspaceScope();
        $pdo = Database::conn();
        
        // 1. Project counts by status
        $stmt = $pdo->prepare("
            SELECT status, COUNT(*) as count
            FROM projects
            WHERE {$scope['col']} = ?
            GROUP BY status
        ");
        $stmt->execute([$scope['val']]);
        $statusCounts = $stmt->fetchAll();
        
        // 2. Task completion stats (velocity)
        $stmt = $pdo->prepare("
            SELECT DATE(completed_at) as date, COUNT(*) as count
            FROM sales_tasks
            WHERE {$scope['col']} = ? AND status = 'completed' AND completed_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
            GROUP BY DATE(completed_at)
            ORDER BY date ASC
        ");
        $stmt->execute([$scope['val']]);
        $velocity = $stmt->fetchAll();
        
        // 3. Overall stats
        $stmt = $pdo->prepare("
            SELECT 
                COUNT(*) as total_projects,
                AVG(CASE 
                    WHEN status = 'completed' THEN 100
                    ELSE 0 
                END) as avg_progress,
                (SELECT COUNT(*) FROM sales_tasks WHERE {$scope['col']} = ? AND status != 'completed') as active_tasks
            FROM projects
            WHERE {$scope['col']} = ?
        ");
        $stmt->execute([$scope['val'], $scope['val']]);
        $summary = $stmt->fetch();
        
        Response::json([
            'summary' => $summary,
            'statusDistribution' => $statusCounts,
            'velocity' => $velocity
        ]);
    }
}
