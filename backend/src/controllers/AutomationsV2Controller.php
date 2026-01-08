<?php
/**
 * AutomationsV2Controller - GHL-style Automations
 * Handles workflows, actions, recipes, and execution
 */

require_once __DIR__ . '/../Database.php';
require_once __DIR__ . '/../Response.php';
require_once __DIR__ . '/../Auth.php';
require_once __DIR__ . '/../TenantContext.php';

class AutomationsV2Controller {
    
    private static function getScope(): array {
        $ctx = $GLOBALS['tenantContext'] ?? null;
        if (!$ctx || !isset($ctx->workspaceId)) {
            Response::error('Workspace context required', 403);
            exit;
        }
        return [
            'workspace_id' => (int)$ctx->workspaceId
        ];
    }
    
    // ==================== WORKFLOWS ====================
    
    /**
     * List automation workflows
     * GET /automations/v2/workflows
     */
    public static function listWorkflows(): void {
        try {
            $userId = Auth::userIdOrFail();
            $scope = self::getScope();
            $pdo = Database::conn();
            
            $status = $_GET['status'] ?? null;
            $triggerType = $_GET['trigger_type'] ?? null;
            
            $where = ['workspace_id = ?'];
            $params = [$scope['workspace_id']];
            

            
            if ($status && in_array($status, ['active', 'paused', 'draft'])) {
                $where[] = 'status = ?';
                $params[] = $status;
            }
            
            if ($triggerType) {
                $where[] = 'trigger_type = ?';
                $params[] = $triggerType;
            }
            
            $whereClause = implode(' AND ', $where);
            
            // Combine both New Workflows and Legacy Automations (Follow-ups)
            $sql = "
                SELECT 
                    w.id,
                    w.name COLLATE utf8mb4_unicode_ci as name,
                    w.description COLLATE utf8mb4_unicode_ci as description,
                    CAST(w.status AS CHAR) COLLATE utf8mb4_unicode_ci as status,
                    w.trigger_type COLLATE utf8mb4_unicode_ci as trigger_type,
                    w.trigger_config,
                    w.updated_at,
                    w.created_at,
                    CAST('workflow' AS CHAR) COLLATE utf8mb4_unicode_ci as type,
                    w.workspace_id as workspace_id,
                    CAST(NULL AS CHAR) COLLATE utf8mb4_unicode_ci as channel,
                    0 as action_count,
                    0 as execution_count
                FROM automation_workflows w
                WHERE w.workspace_id = ?

                UNION ALL

                SELECT 
                    fa.id,
                    fa.name COLLATE utf8mb4_unicode_ci as name,
                    fa.description COLLATE utf8mb4_unicode_ci as description,
                    CAST(CASE WHEN fa.is_active = 1 THEN 'active' ELSE 'paused' END AS CHAR) COLLATE utf8mb4_unicode_ci as status,
                    fa.trigger_type COLLATE utf8mb4_unicode_ci as trigger_type,
                    fa.trigger_conditions as trigger_config,
                    fa.updated_at,
                    fa.created_at,
                    CAST('automation' AS CHAR) COLLATE utf8mb4_unicode_ci as type,
                    wm.workspace_id as workspace_id,
                    fa.channel COLLATE utf8mb4_unicode_ci as channel,
                    0 as action_count,
                    0 as execution_count
                FROM followup_automations fa
                JOIN workspace_members wm ON wm.user_id = fa.user_id
                WHERE wm.workspace_id = ?
                
                ORDER BY updated_at DESC
            ";
            
            // Parameters: workspace_id for first query, workspace_id for second query
            $queryParams = [$scope['workspace_id'], $scope['workspace_id']];
            
            $stmt = $pdo->prepare($sql);
            $stmt->execute($queryParams);
            $workflows = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Decode JSON fields
            foreach ($workflows as &$wf) {
                $wf['trigger_config'] = ($wf['trigger_config'] ?? null) ? json_decode($wf['trigger_config'], true) : [];
            }
            
            Response::json([
                'success' => true,
                'flows' => $workflows,
                'data' => $workflows
            ]);
        } catch (Exception $e) {
            Response::error('Failed to list workflows: ' . $e->getMessage(), 500);
        }
    }
    
    /**
     * Get single workflow with actions
     * GET /automations/v2/workflows/:id
     */
    public static function getWorkflow(int $id): void {
        $userId = Auth::userIdOrFail();
        $scope = self::getScope();
        $pdo = Database::conn();
        
        $sql = "SELECT * FROM automation_workflows WHERE id = ? AND workspace_id = ?";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([$id, $scope['workspace_id']]);
        $workflow = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$workflow) {
            Response::notFound('Workflow not found');
            return;
        }
        
        $workflow['trigger_config'] = $workflow['trigger_config'] ? json_decode($workflow['trigger_config'], true) : [];
        
        // Get actions
        $actionsSql = "SELECT * FROM automation_actions WHERE workflow_id = ? ORDER BY sort_order ASC";
        $actionsStmt = $pdo->prepare($actionsSql);
        $actionsStmt->execute([$id]);
        $actions = $actionsStmt->fetchAll(PDO::FETCH_ASSOC);
        
        foreach ($actions as &$action) {
            // Map 'config' column to 'action_config' for frontend
            $action['action_config'] = ($action['config'] ?? null) ? json_decode($action['config'], true) : [];
            $action['condition_config'] = ($action['condition_config'] ?? null) ? json_decode($action['condition_config'], true) : null;
        }
        
        $workflow['actions'] = $actions;
        
        Response::json([
            'success' => true,
            'data' => $workflow
        ]);
    }
    
    /**
     * Create workflow
     * POST /automations/v2/workflows
     */
    public static function createWorkflow(): void {
        $userId = Auth::userIdOrFail();
        $scope = self::getScope();
        $body = get_json_body();
        $pdo = Database::conn();
        
        if (empty($body['name']) || empty($body['trigger_type'])) {
            Response::validationError('name and trigger_type are required');
            return;
        }
        
        $pdo->beginTransaction();
        try {
            $stmt = $pdo->prepare("
                INSERT INTO automation_workflows 
                (workspace_id, name, description, status, trigger_type, trigger_config, created_by, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
            ");
            $stmt->execute([
                $scope['workspace_id'],
                $body['name'],
                $body['description'] ?? null,
                $body['status'] ?? 'draft',
                $body['trigger_type'],
                isset($body['trigger_config']) ? json_encode($body['trigger_config']) : null,
                $userId
            ]);
            
            $workflowId = (int)$pdo->lastInsertId();
            
            // Create actions if provided
            if (!empty($body['actions']) && is_array($body['actions'])) {
                $actionStmt = $pdo->prepare("
                    INSERT INTO automation_actions 
                    (workflow_id, action_type, config, sort_order, created_at)
                    VALUES (?, ?, ?, ?, NOW())
                ");
                
                foreach ($body['actions'] as $i => $action) {
                    $actionStmt->execute([
                        $workflowId,
                        $action['action_type'],
                        isset($action['action_config']) ? json_encode($action['action_config']) : (isset($action['config']) ? json_encode($action['config']) : null),
                        $i
                    ]);
                }
            }
            
            $pdo->commit();
            
            Response::json([
                'success' => true,
                'data' => ['id' => $workflowId],
                'message' => 'Workflow created'
            ], 201);
        } catch (Exception $e) {
            $pdo->rollBack();
            Response::error('Failed to create workflow: ' . $e->getMessage());
        }
    }
    
    /**
     * Update workflow
     * PUT /automations/v2/workflows/:id
     */
    public static function updateWorkflow(int $id): void {
        $userId = Auth::userIdOrFail();
        $scope = self::getScope();
        $body = get_json_body();
        $pdo = Database::conn();
        
        // Verify ownership
        $checkStmt = $pdo->prepare("SELECT id FROM automation_workflows WHERE id = ? AND workspace_id = ?");
        $checkStmt->execute([$id, $scope['workspace_id']]);
        if (!$checkStmt->fetch()) {
            Response::notFound('Workflow not found');
            return;
        }
        
        $updates = [];
        $params = [];
        
        $fields = ['name', 'description', 'status', 'trigger_type'];
        foreach ($fields as $field) {
            if (isset($body[$field])) {
                $updates[] = "$field = ?";
                $params[] = $body[$field];
            }
        }
        
        if (isset($body['trigger_config'])) {
            $updates[] = 'trigger_config = ?';
            $params[] = json_encode($body['trigger_config']);
        }
        
        if (!empty($updates)) {
            $params[] = $id;
            $sql = "UPDATE automation_workflows SET " . implode(', ', $updates) . ", updated_at = NOW() WHERE id = ?";
            $pdo->prepare($sql)->execute($params);
        }
        
        // Update actions if provided
        if (isset($body['actions']) && is_array($body['actions'])) {
            // Delete existing actions
            $pdo->prepare("DELETE FROM automation_actions WHERE workflow_id = ?")->execute([$id]);
            
            // Insert new actions
            $actionStmt = $pdo->prepare("
                INSERT INTO automation_actions 
                (workflow_id, action_type, config, sort_order, created_at)
                VALUES (?, ?, ?, ?, NOW())
            ");
            
            foreach ($body['actions'] as $i => $action) {
                $actionStmt->execute([
                    $id,
                    $action['action_type'],
                    isset($action['action_config']) ? json_encode($action['action_config']) : (isset($action['config']) ? json_encode($action['config']) : null),
                    $i
                ]);
            }
        }
        
        Response::json(['success' => true, 'message' => 'Workflow updated']);
    }
    
    /**
     * Delete workflow
     * DELETE /automations/v2/workflows/:id
     */
    public static function deleteWorkflow(int $id): void {
        $userId = Auth::userIdOrFail();
        $scope = self::getScope();
        $pdo = Database::conn();
        
        $pdo->beginTransaction();
        try {
            // Check existence and ownership first
            $checkStmt = $pdo->prepare("SELECT id FROM automation_workflows WHERE id = ? AND workspace_id = ?");
            $checkStmt->execute([$id, $scope['workspace_id']]);
            if (!$checkStmt->fetch()) {
                $pdo->rollBack();
                Response::notFound('Workflow not found');
                return;
            }

            // Delete dependents first to avoid FK constraint violations
            $pdo->prepare("DELETE FROM automation_actions WHERE workflow_id = ?")->execute([$id]);
            $pdo->prepare("DELETE FROM automation_executions WHERE workflow_id = ?")->execute([$id]);
            
            // Delete the workflow
            $stmt = $pdo->prepare("DELETE FROM automation_workflows WHERE id = ? AND workspace_id = ?");
            $stmt->execute([$id, $scope['workspace_id']]);
            
            $pdo->commit();
            Response::json(['success' => true, 'message' => 'Workflow deleted']);

        } catch (Exception $e) {
            $pdo->rollBack();
            Response::error('Failed to delete workflow: ' . $e->getMessage());
        }
    }
    
    /**
     * Toggle workflow status
     * POST /automations/v2/workflows/:id/toggle
     */
    public static function toggleWorkflow(int $id): void {
        $userId = Auth::userIdOrFail();
        $scope = self::getScope();
        $pdo = Database::conn();
        
        $stmt = $pdo->prepare("SELECT status FROM automation_workflows WHERE id = ? AND workspace_id = ?");
        $stmt->execute([$id, $scope['workspace_id']]);
        $workflow = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$workflow) {
            Response::notFound('Workflow not found');
            return;
        }
        
        $newStatus = $workflow['status'] === 'active' ? 'paused' : 'active';
        $pdo->prepare("UPDATE automation_workflows SET status = ?, updated_at = NOW() WHERE id = ?")->execute([$newStatus, $id]);
        
        Response::json([
            'success' => true,
            'data' => ['status' => $newStatus],
            'message' => "Workflow $newStatus"
        ]);
    }
    
    // ==================== RECIPES ====================
    
    /**
     * List automation recipes
     * GET /automations/v2/recipes
     */
    public static function listRecipes(): void {
        $pdo = Database::conn();
        $scope = self::getScope();
        $workspaceId = $scope['workspace_id'];

        // 1. Fetch Real Recipes (System & Saved Custom)
        $stmt = $pdo->prepare("SELECT * FROM automation_recipes ORDER BY usage_count DESC, name ASC");
        $stmt->execute();
        $realRecipes = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $recipes = [];

        // Format Real Recipes
        foreach ($realRecipes as $r) {
            $recipes[] = [
                'id' => (int)$r['id'],
                'name' => $r['name'],
                'description' => $r['description'],
                'category' => $r['category'],
                'industry' => $r['industry'],
                'target_audience' => $r['target_audience'],
                'channels' => json_decode($r['channels'], true) ?: [],
                'type' => $r['type'] ?? 'workflow',
                'trigger_type' => $r['trigger_type'],
                'trigger_config' => ($r['trigger_config'] ?? null) ? json_decode($r['trigger_config'], true) : [],
                'actions' => ($r['steps'] ?? null) ? json_decode($r['steps'], true) : [],
                'estimated_duration' => $r['estimated_duration'],
                'difficulty' => $r['difficulty'],
                'tags' => json_decode($r['tags'], true) ?: [],
                'is_system' => (bool)$r['is_system'],
                'usage_count' => (int)$r['usage_count'],
                'created_at' => $r['created_at'],
                'is_user_owned' => false
            ];
        }

        // 2. Fetch Workspace Automations (Virtual Recipes)
        // We join workspace_members to get all automations in the workspace
        $sqlAuth = "SELECT DISTINCT fa.* FROM followup_automations fa 
                    JOIN workspace_members wm ON wm.user_id = fa.user_id 
                    WHERE wm.workspace_id = ?
                    ORDER BY fa.created_at DESC";
        $stmtAuth = $pdo->prepare($sqlAuth);
        $stmtAuth->execute([$workspaceId]);
        $automations = $stmtAuth->fetchAll(PDO::FETCH_ASSOC);

        foreach ($automations as $automation) {
            $recipes[] = [
                'id' => (int)$automation['id'],
                'name' => $automation['name'],
                'description' => $automation['description'] ?? '',
                'category' => 'My Automations',
                'industry' => 'General',
                'target_audience' => 'General',
                'channels' => [$automation['channel']],
                'trigger_type' => $automation['trigger_type'],
                'trigger_config' => $automation['trigger_conditions'] ? (json_decode($automation['trigger_conditions'], true) ?? []) : [],
                'actions' => $automation['action_config'] ? (json_decode($automation['action_config'], true) ?? []) : [],
                'estimated_duration' => 'Varies',
                'difficulty' => 'intermediate',
                'tags' => ['Workspace Automation'], // Tag them so we know source
                'is_system' => 0,
                'usage_count' => 1,
                'created_at' => $automation['created_at'],
                'is_user_owned' => true // Flag for "Save before uninstall" logic
            ];
        }

        Response::json([
            'success' => true,
            'data' => [
                'items' => $recipes,
                'total' => count($recipes)
            ]
        ]);
    }
    
    /**
     * Get recipe categories
     * GET /automations/v2/recipes/categories
     */
    public static function getRecipeCategories(): void {
        $pdo = Database::conn();
        
        $stmt = $pdo->query("SELECT DISTINCT category, COUNT(*) as count FROM automation_recipes GROUP BY category ORDER BY count DESC");
        $categories = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        Response::json([
            'success' => true,
            'data' => $categories
        ]);
    }
    
    /**
     * Create automation recipe
     * POST /automations/v2/recipes
     */
    public static function createRecipe(): void {
        $userId = Auth::userIdOrFail();
        $body = get_json_body();
        $pdo = Database::conn();
        
        if (empty($body['name']) || empty($body['category'])) {
            Response::validationError('name and category are required');
            return;
        }
        
        // Map target_audience to enum if needed
        $targetAudience = strtolower($body['target_audience'] ?? 'general');
        $validAudiences = ['local_business', 'home_services', 'agency', 'ecommerce', 'saas', 'general'];
        if (!in_array($targetAudience, $validAudiences)) {
            $targetAudience = 'general';
        }

        // Map category to enum
        $category = strtolower($body['category'] ?? 'custom');
        $validCategories = ['welcome', 'nurture', 'reengagement', 'abandoned_cart', 'post_purchase', 'birthday', 'review_request', 'appointment', 'custom'];
        if (!in_array($category, $validCategories)) {
            $category = 'custom';
        }

        // Map type to enum
        $type = strtolower($body['type'] ?? 'workflow');
        $validTypes = ['trigger', 'rule', 'workflow'];
        if (!in_array($type, $validTypes)) {
            $type = 'workflow';
        }

        try {
            $stmt = $pdo->prepare("
                INSERT INTO automation_recipes 
                (user_id, name, description, category, type, industry, target_audience, channels, trigger_type, trigger_config, steps, estimated_duration, difficulty, tags, is_system, usage_count, rating, status, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, 'published', NOW())
            ");
            
            $stmt->execute([
                $userId,
                $body['name'],
                $body['description'] ?? null,
                $category,
                $type,
                $body['industry'] ?? null,
                $targetAudience,
                isset($body['channels']) ? (is_array($body['channels']) ? json_encode($body['channels']) : $body['channels']) : json_encode([]),
                $body['trigger_type'] ?? null,
                isset($body['trigger_config']) ? (is_array($body['trigger_config']) ? json_encode($body['trigger_config']) : $body['trigger_config']) : null,
                isset($body['actions']) ? (is_array($body['actions']) ? json_encode($body['actions']) : $body['actions']) : (isset($body['steps']) ? (is_array($body['steps']) ? json_encode($body['steps']) : $body['steps']) : json_encode([])),
                $body['estimated_duration'] ?? null,
                $body['difficulty'] ?? 'intermediate',
                isset($body['tags']) ? (is_array($body['tags']) ? json_encode($body['tags']) : $body['tags']) : json_encode([]),
                $body['is_system'] ?? 0
            ]);
            
            $recipeId = (int)$pdo->lastInsertId();
            
            Response::json([
                'success' => true,
                'data' => ['id' => $recipeId],
                'message' => 'Recipe created'
            ], 201);
        } catch (Exception $e) {
            Response::error('Failed to create recipe: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Create workflow from recipe
     * POST /automations/v2/recipes/:id/use
     */
    public static function useRecipe(int $recipeId): void {
        $userId = Auth::userIdOrFail();
        $scope = self::getScope();
        $body = get_json_body();
        $pdo = Database::conn();
        
        // Get recipe
        $stmt = $pdo->prepare("SELECT * FROM automation_recipes WHERE id = ?");
        $stmt->execute([$recipeId]);
        $recipe = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$recipe) {
            Response::notFound('Recipe not found');
            return;
        }
        
        $pdo->beginTransaction();
        try {
            // Create workflow from recipe
            $workflowStmt = $pdo->prepare("
                INSERT INTO automation_workflows 
                (workspace_id, name, description, status, trigger_type, trigger_config, created_by, created_at)
                VALUES (?, ?, ?, 'draft', ?, ?, ?, NOW())
            ");
            $workflowStmt->execute([
                $scope['workspace_id'],
                $body['name'] ?? $recipe['name'],
                $recipe['description'],
                $recipe['trigger_type'],
                $recipe['trigger_config'],
                $userId
            ]);
            
            $workflowId = (int)$pdo->lastInsertId();
            
            // Create actions from recipe
            $actions = json_decode($recipe['actions'], true) ?: [];
            $actionStmt = $pdo->prepare("
                INSERT INTO automation_actions 
                (workflow_id, action_type, config, sort_order, created_at)
                VALUES (?, ?, ?, ?, NOW())
            ");
            
            foreach ($actions as $i => $action) {
                $actionStmt->execute([
                    $workflowId,
                    $action['action_type'],
                    isset($action['action_config']) ? json_encode($action['action_config']) : (isset($action['config']) ? json_encode($action['config']) : null),
                    $i
                ]);
            }
            
            // Increment recipe usage count
            $pdo->prepare("UPDATE automation_recipes SET usage_count = usage_count + 1 WHERE id = ?")->execute([$recipeId]);
            
            $pdo->commit();
            
            Response::json([
                'success' => true,
                'data' => ['id' => $workflowId],
                'message' => 'Workflow created from recipe'
            ], 201);
        } catch (Exception $e) {
            $pdo->rollBack();
            Response::error('Failed to create workflow: ' . $e->getMessage());
        }
    }
    
    // ==================== TRIGGERS & ACTIONS ====================
    
    /**
     * Get available trigger types
     * GET /automations/v2/triggers
     */
    public static function getTriggerTypes(): void {
        $triggers = [
            ['type' => 'form.submitted', 'name' => 'Form Submitted', 'category' => 'forms', 'icon' => 'file-text'],
            ['type' => 'contact.created', 'name' => 'Contact Created', 'category' => 'contacts', 'icon' => 'user-plus'],
            ['type' => 'contact.updated', 'name' => 'Contact Updated', 'category' => 'contacts', 'icon' => 'user-check'],
            ['type' => 'contact.tag_added', 'name' => 'Tag Added to Contact', 'category' => 'contacts', 'icon' => 'tag'],
            ['type' => 'opportunity.created', 'name' => 'Opportunity Created', 'category' => 'pipeline', 'icon' => 'plus-circle'],
            ['type' => 'opportunity.stage_changed', 'name' => 'Opportunity Stage Changed', 'category' => 'pipeline', 'icon' => 'git-branch'],
            ['type' => 'opportunity.won', 'name' => 'Opportunity Won', 'category' => 'pipeline', 'icon' => 'trophy'],
            ['type' => 'opportunity.lost', 'name' => 'Opportunity Lost', 'category' => 'pipeline', 'icon' => 'x-circle'],
            ['type' => 'message.received', 'name' => 'Message Received', 'category' => 'communication', 'icon' => 'message-circle'],
            ['type' => 'appointment.booked', 'name' => 'Appointment Booked', 'category' => 'appointments', 'icon' => 'calendar-plus'],
            ['type' => 'appointment.reminder', 'name' => 'Appointment Reminder', 'category' => 'appointments', 'icon' => 'bell'],
            ['type' => 'appointment.completed', 'name' => 'Appointment Completed', 'category' => 'appointments', 'icon' => 'calendar-check'],
            ['type' => 'invoice.paid', 'name' => 'Invoice Paid', 'category' => 'payments', 'icon' => 'credit-card'],
            ['type' => 'review.received', 'name' => 'Review Received', 'category' => 'reviews', 'icon' => 'star'],
        ];
        
        Response::json([
            'success' => true,
            'data' => $triggers
        ]);
    }
    
    /**
     * Get available action types
     * GET /automations/v2/actions
     */
    public static function getActionTypes(): void {
        $actions = [
            ['type' => 'send_email', 'name' => 'Send Email', 'category' => 'communication', 'icon' => 'mail'],
            ['type' => 'send_sms', 'name' => 'Send SMS', 'category' => 'communication', 'icon' => 'message-circle'],
            ['type' => 'add_tag', 'name' => 'Add Tag', 'category' => 'contacts', 'icon' => 'tag'],
            ['type' => 'remove_tag', 'name' => 'Remove Tag', 'category' => 'contacts', 'icon' => 'x'],
            ['type' => 'add_note', 'name' => 'Add Note', 'category' => 'contacts', 'icon' => 'sticky-note'],
            ['type' => 'assign_user', 'name' => 'Assign User', 'category' => 'workflow', 'icon' => 'user-check'],
            ['type' => 'create_opportunity', 'name' => 'Create Opportunity', 'category' => 'pipeline', 'icon' => 'plus-circle'],
            ['type' => 'move_opportunity', 'name' => 'Move Opportunity Stage', 'category' => 'pipeline', 'icon' => 'git-branch'],
            ['type' => 'create_task', 'name' => 'Create Task', 'category' => 'workflow', 'icon' => 'check-square'],
            ['type' => 'wait', 'name' => 'Wait/Delay', 'category' => 'flow', 'icon' => 'clock'],
            ['type' => 'condition', 'name' => 'If/Then Condition', 'category' => 'flow', 'icon' => 'git-merge'],
            ['type' => 'webhook', 'name' => 'Call Webhook', 'category' => 'integrations', 'icon' => 'globe'],
            ['type' => 'internal_notification', 'name' => 'Internal Notification', 'category' => 'workflow', 'icon' => 'bell'],
            ['type' => 'update_contact', 'name' => 'Update Contact Field', 'category' => 'contacts', 'icon' => 'edit'],
            ['type' => 'add_to_sequence', 'name' => 'Add to Sequence', 'category' => 'communication', 'icon' => 'layers'],
            ['type' => 'remove_from_sequence', 'name' => 'Remove from Sequence', 'category' => 'communication', 'icon' => 'minus-circle'],
        ];
        
        Response::json([
            'success' => true,
            'data' => $actions
        ]);
    }
    
    // ==================== EXECUTIONS ====================
    
    /**
     * Get workflow execution history
     * GET /automations/v2/workflows/:id/executions
     */
    public static function getExecutions(int $workflowId): void {
        $userId = Auth::userIdOrFail();
        $scope = self::getScope();
        $pdo = Database::conn();
        
        $limit = min((int)($_GET['limit'] ?? 50), 200);
        $offset = (int)($_GET['offset'] ?? 0);
        
        $sql = "SELECT e.*, c.first_name as contact_first_name, c.last_name as contact_last_name
                FROM automation_executions e
                LEFT JOIN contacts c ON e.contact_id = c.id
                WHERE e.workflow_id = ? AND e.workspace_id = ?
                ORDER BY e.created_at DESC
                LIMIT ? OFFSET ?";
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute([$workflowId, $scope['workspace_id'], $limit, $offset]);
        $executions = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        foreach ($executions as &$exec) {
            $exec['execution_log'] = $exec['execution_log'] ? json_decode($exec['execution_log'], true) : [];
        }
        
        Response::json([
            'success' => true,
            'data' => $executions
        ]);
    }
    
    /**
     * Get automation stats
     * GET /automations/v2/stats
     */
    public static function getStats(): void {
        $userId = Auth::userIdOrFail();
        $scope = self::getScope();
        $pdo = Database::conn();
        
        $where = 'workspace_id = ?';
        $params = [$scope['workspace_id']];
        
        // Workflow stats
        $wfSql = "SELECT 
                    COUNT(*) as total,
                    SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active,
                    SUM(CASE WHEN status = 'paused' THEN 1 ELSE 0 END) as paused,
                    SUM(CASE WHEN status = 'draft' THEN 1 ELSE 0 END) as draft,
                    SUM(run_count) as total_runs
                  FROM automation_workflows WHERE $where";
        $wfStmt = $pdo->prepare($wfSql);
        $wfStmt->execute($params);
        $workflowStats = $wfStmt->fetch(PDO::FETCH_ASSOC);
        
        // Execution stats (last 30 days)
        $execSql = "SELECT 
                        COUNT(*) as total,
                        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
                        SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed,
                        SUM(CASE WHEN status = 'running' THEN 1 ELSE 0 END) as running
                    FROM automation_executions 
                    WHERE $where AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)";
        $execStmt = $pdo->prepare($execSql);
        $execStmt->execute($params);
        $executionStats = $execStmt->fetch(PDO::FETCH_ASSOC);
        
        Response::json([
            'success' => true,
            'data' => [
                'workflows' => $workflowStats,
                'executions' => $executionStats
            ]
        ]);
    }
    /**
     * Get automation options (combined triggers and actions)
     * GET /automations/options
     */
    public static function options(): void {
        $triggers = [
            'form.submitted' => 'Form Submitted',
            'contact.created' => 'Contact Created',
            'contact.updated' => 'Contact Updated',
            'contact.tag_added' => 'Tag Added to Contact',
            'opportunity.created' => 'Opportunity Created',
            'opportunity.stage_changed' => 'Opportunity Stage Changed',
            'opportunity.won' => 'Opportunity Won',
            'opportunity.lost' => 'Opportunity Lost',
            'message.received' => 'Message Received',
            'appointment.booked' => 'Appointment Booked',
            'appointment.reminder' => 'Appointment Reminder',
            'appointment.completed' => 'Appointment Completed',
            'invoice.paid' => 'Invoice Paid',
            'review.received' => 'Review Received'
        ];

        $actions = [
            'send_email' => 'Send Email',
            'send_sms' => 'Send SMS',
            'add_tag' => 'Add Tag',
            'remove_tag' => 'Remove Tag',
            'add_note' => 'Add Note',
            'assign_user' => 'Assign User',
            'create_opportunity' => 'Create Opportunity',
            'move_opportunity' => 'Move Opportunity Stage',
            'create_task' => 'Create Task',
            'wait' => 'Wait/Delay',
            'condition' => 'If/Then Condition',
            'webhook' => 'Call Webhook',
            'internal_notification' => 'Internal Notification',
            'update_contact' => 'Update Contact Field',
            'add_to_sequence' => 'Add to Sequence',
            'remove_from_sequence' => 'Remove from Sequence'
        ];

        // Format for frontend: { trigger_types: { channel: { id: label } }, action_types: { id: label }, ... }
        // Simplified mapping for now, assuming unified types or just by category
        
        $triggerTypes = [];
        // Map everything to 'all' or specific channels if we know them. 
        // For now, map to 'all' and their specific categories if possible.
        // Frontend expects: trigger_types: Record<string, Record<string, string>>; (Channel -> Type -> Label)
        
        $triggerTypes['email'] = ['email_opened' => 'Email Opened', 'link_clicked' => 'Link Clicked'];
        $triggerTypes['sms'] = ['message.received' => 'Message Received'];
        $triggerTypes['form'] = ['form.submitted' => 'Form Submitted'];
        $triggerTypes['call'] = ['call.completed' => 'Call Completed', 'call.inbound' => 'Inbound Call'];
        
        // Add common ones
        $commonTriggers = [
            'contact.created' => 'Contact Created',
            'contact.tag_added' => 'Tag Added',
            'opportunity.stage_changed' => 'Opportunity Stage Changed'
        ];
        
        $triggerTypes['all'] = $commonTriggers;
        // Merge common into specific channels too
        foreach(['email', 'sms', 'form', 'call'] as $ch) {
            $triggerTypes[$ch] = array_merge($triggerTypes[$ch], $commonTriggers);
        }

        Response::json([
            'success' => true,
            'trigger_types' => $triggerTypes,
            'action_types' => $actions,
            'delay_units' => ['minutes' => 'Minutes', 'hours' => 'Hours', 'days' => 'Days'],
            'condition_types' => ['equals' => 'Equals', 'contains' => 'Contains', 'starts_with' => 'Starts With']
        ]);
    }

    /**
     * Alias for listWorkflows to support /flows endpoint
     * GET /flows
     */
    public static function listFlows(): void {
        self::listWorkflows();
    }
}
