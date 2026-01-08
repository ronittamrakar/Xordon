<?php
require_once __DIR__ . '/../Database.php';
require_once __DIR__ . '/../Response.php';
require_once __DIR__ . '/../Auth.php';

class ProjectTemplatesController {
    
    private static function getWorkspaceScope(): array {
        $ctx = $GLOBALS['tenantContext'] ?? null;
        if ($ctx && isset($ctx->workspaceId)) {
            return ['col' => 'workspace_id', 'val' => (int)$ctx->workspaceId];
        }
        return ['col' => 'user_id', 'val' => Auth::userIdOrFail()];
    }

    /**
     * Get all project templates (including system ones)
     */
    public static function index(): void {
        $userId = Auth::userIdOrFail();
        $ctx = $GLOBALS['tenantContext'] ?? null;
        $workspaceId = $ctx && isset($ctx->workspaceId) ? (int)$ctx->workspaceId : null;
        $pdo = Database::conn();
        
        // Fetch custom templates for this workspace/user OR system templates
        $sql = "SELECT * FROM project_templates WHERE is_system = 1";
        $params = [];
        
        if ($workspaceId) {
            $sql .= " OR workspace_id = ?";
            $params[] = $workspaceId;
        } else {
            $sql .= " OR user_id = ?";
            $params[] = $userId;
        }
        
        $sql .= " ORDER BY is_popular DESC, name ASC";
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $templates = $stmt->fetchAll();
        
        Response::json(['items' => $templates]);
    }

    /**
     * Get single template with its tasks
     */
    public static function show(string $id): void {
        Auth::userIdOrFail();
        $pdo = Database::conn();
        
        $stmt = $pdo->prepare("SELECT * FROM project_templates WHERE id = ?");
        $stmt->execute([$id]);
        $template = $stmt->fetch();
        
        if (!$template) {
            Response::error('Template not found', 404);
            return;
        }
        
        $stmt = $pdo->prepare("SELECT * FROM project_template_tasks WHERE template_id = ? ORDER BY sort_order ASC");
        $stmt->execute([$id]);
        $template['tasks'] = $stmt->fetchAll();
        
        Response::json($template);
    }

    /**
     * Create project from template
     */
    public static function createProject(string $templateId): void {
        $userId = Auth::userIdOrFail();
        $ctx = $GLOBALS['tenantContext'] ?? null;
        $workspaceId = $ctx && isset($ctx->workspaceId) ? (int)$ctx->workspaceId : null;
        $body = get_json_body();
        $pdo = Database::conn();
        
        // 1. Get template
        $stmt = $pdo->prepare("SELECT * FROM project_templates WHERE id = ?");
        $stmt->execute([$templateId]);
        $template = $stmt->fetch();
        
        if (!$template) {
            Response::error('Template not found', 404);
            return;
        }
        
        // 2. Create project
        $title = $body['title'] ?? ($template['name'] . ' - Project');
        $color = $body['color'] ?? $template['color'];
        
        try {
            $pdo->beginTransaction();
            
            $stmt = $pdo->prepare('
                INSERT INTO projects 
                (user_id, workspace_id, title, description, status, priority, color, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
            ');
            $stmt->execute([
                $userId,
                $workspaceId,
                $title,
                $body['description'] ?? $template['description'],
                'active',
                'medium',
                $color
            ]);
            
            $projectId = $pdo->lastInsertId();
            
            // 3. Add members
            $stmt = $pdo->prepare('INSERT INTO project_members (project_id, user_id, role) VALUES (?, ?, ?)');
            $stmt->execute([$projectId, $userId, 'owner']);
            
            // 4. Copy tasks from template
            $stmt = $pdo->prepare("SELECT * FROM project_template_tasks WHERE template_id = ?");
            $stmt->execute([$templateId]);
            $templateTasks = $stmt->fetchAll();
            
            if (!empty($templateTasks)) {
                $taskStmt = $pdo->prepare('
                    INSERT INTO sales_tasks 
                    (workspace_id, user_id, assigned_to, project_id, title, description, task_type, priority, status, due_date, created_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
                ');
                
                foreach ($templateTasks as $t) {
                    $dueDate = null;
                    if ($t['delay_days'] > 0) {
                        $dueDate = date('Y-m-d', strtotime('+' . $t['delay_days'] . ' days'));
                    }
                    
                    $taskStmt->execute([
                        $workspaceId,
                        $userId,
                        $userId,
                        $projectId,
                        $t['title'],
                        $t['description'],
                        $t['task_type'],
                        $t['priority'],
                        'pending',
                        $dueDate
                    ]);
                }
            }
            
            $pdo->commit();
            Response::json(['projectId' => $projectId, 'message' => 'Project created from template successfully'], 201);
            
        } catch (Exception $e) {
            $pdo->rollBack();
            Response::error('Failed to create project from template: ' . $e->getMessage(), 500);
        }
    }
}
