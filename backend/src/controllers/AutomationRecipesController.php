<?php
require_once __DIR__ . '/../Database.php';
require_once __DIR__ . '/../Response.php';
require_once __DIR__ . '/../Auth.php';

class AutomationRecipesController {
    
    // Get all recipes (system + user's custom)
    public static function index(): void {
        $userId = Auth::userIdOrFail();
        $category = $_GET['category'] ?? null;
        $audience = $_GET['audience'] ?? null;
        $pdo = Database::conn();

        try {
            $sql = 'SELECT * FROM automation_recipes WHERE (is_system = 1 OR user_id = ?) AND status = "published"';
            $params = [$userId];

            if ($category) {
                $sql .= ' AND category = ?';
                $params[] = $category;
            }

            if ($audience) {
                $sql .= ' AND (target_audience = ? OR target_audience = "general")';
                $params[] = $audience;
            }

            $sql .= ' ORDER BY is_system DESC, usage_count DESC, name ASC';

            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);

            $recipes = $stmt->fetchAll();
            foreach ($recipes as &$r) {
                $r['channels'] = json_decode($r['channels'] ?? '[]', true);
                $r['steps'] = json_decode($r['steps'] ?? '[]', true);
                $r['tags'] = json_decode($r['tags'] ?? '[]', true);
                $r['trigger_config'] = json_decode($r['trigger_config'] ?? '{}', true);
            }

            Response::json(['items' => $recipes]);
        } catch (PDOException $e) {
            $sqlState = $e->getCode();
            if ($sqlState === '42S02') {
                Response::json([
                    'items' => [],
                    'warning' => 'Automation recipes tables are missing in the database. Please apply backend/migrations/add_automation_recipes.sql.'
                ]);
                return;
            }
            Response::error('Failed to load automation recipes: ' . $e->getMessage(), 500);
        }
    }
    
    // Get single recipe
    public static function show(string $id): void {
        $userId = Auth::userIdOrFail();
        $pdo = Database::conn();
        
        $stmt = $pdo->prepare('SELECT * FROM automation_recipes WHERE id = ? AND (is_system = 1 OR user_id = ?)');
        $stmt->execute([$id, $userId]);
        $recipe = $stmt->fetch();
        
        if (!$recipe) {
            Response::error('Recipe not found', 404);
            return;
        }
        
        $recipe['channels'] = json_decode($recipe['channels'] ?? '[]', true);
        $recipe['steps'] = json_decode($recipe['steps'] ?? '[]', true);
        $recipe['tags'] = json_decode($recipe['tags'] ?? '[]', true);
        $recipe['trigger_config'] = json_decode($recipe['trigger_config'] ?? '{}', true);
        
        Response::json($recipe);
    }
    
    // Create custom recipe
    public static function create(): void {
        $userId = Auth::userIdOrFail();
        $body = get_json_body();
        $pdo = Database::conn();
        
        $name = trim($body['name'] ?? '');
        if (!$name) {
            Response::error('Recipe name is required', 422);
            return;
        }
        
        $stmt = $pdo->prepare('
            INSERT INTO automation_recipes 
            (user_id, is_system, name, description, category, industry, target_audience, channels, trigger_type, trigger_config, steps, estimated_duration, difficulty, tags, preview_image, status, type, created_at)
            VALUES (?, 0, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
        ');
        $stmt->execute([
            $userId,
            $name,
            $body['description'] ?? null,
            $body['category'] ?? 'custom',
            $body['industry'] ?? null,
            $body['target_audience'] ?? 'general',
            json_encode($body['channels'] ?? ['email']),
            $body['trigger_type'] ?? null,
            json_encode($body['trigger_config'] ?? []),
            json_encode($body['steps'] ?? []),
            $body['estimated_duration'] ?? null,
            $body['difficulty'] ?? 'beginner',
            json_encode($body['tags'] ?? []),
            $body['preview_image'] ?? null,
            $body['status'] ?? 'draft',
            $body['type'] ?? 'workflow'
        ]);
        
        $id = (int)$pdo->lastInsertId();
        $stmt = $pdo->prepare('SELECT * FROM automation_recipes WHERE id = ?');
        $stmt->execute([$id]);
        $recipe = $stmt->fetch();
        
        $recipe['channels'] = json_decode($recipe['channels'] ?? '[]', true);
        $recipe['steps'] = json_decode($recipe['steps'] ?? '[]', true);
        $recipe['tags'] = json_decode($recipe['tags'] ?? '[]', true);
        
        Response::json($recipe, 201);
    }
    
    // Update recipe
    public static function update(string $id): void {
        $userId = Auth::userIdOrFail();
        $body = get_json_body();
        $pdo = Database::conn();
        
        // Can only update own recipes
        $stmt = $pdo->prepare('SELECT * FROM automation_recipes WHERE id = ? AND user_id = ? AND is_system = 0');
        $stmt->execute([$id, $userId]);
        if (!$stmt->fetch()) {
            Response::error('Recipe not found or cannot be edited', 404);
            return;
        }
        
        $stmt = $pdo->prepare('
            UPDATE automation_recipes SET
                name = COALESCE(?, name),
                description = COALESCE(?, description),
                category = COALESCE(?, category),
                industry = COALESCE(?, industry),
                target_audience = COALESCE(?, target_audience),
                channels = COALESCE(?, channels),
                trigger_type = COALESCE(?, trigger_type),
                trigger_config = COALESCE(?, trigger_config),
                steps = COALESCE(?, steps),
                estimated_duration = COALESCE(?, estimated_duration),
                difficulty = COALESCE(?, difficulty),
                tags = COALESCE(?, tags),
                status = COALESCE(?, status),
                type = COALESCE(?, type),
                updated_at = NOW()
            WHERE id = ? AND user_id = ?
        ');
        $stmt->execute([
            $body['name'] ?? null,
            $body['description'] ?? null,
            $body['category'] ?? null,
            $body['industry'] ?? null,
            $body['target_audience'] ?? null,
            isset($body['channels']) ? json_encode($body['channels']) : null,
            $body['trigger_type'] ?? null,
            isset($body['trigger_config']) ? json_encode($body['trigger_config']) : null,
            isset($body['steps']) ? json_encode($body['steps']) : null,
            $body['estimated_duration'] ?? null,
            $body['difficulty'] ?? null,
            isset($body['tags']) ? json_encode($body['tags']) : null,
            $body['status'] ?? null,
            $body['type'] ?? null,
            $id,
            $userId
        ]);
        
        $stmt = $pdo->prepare('SELECT * FROM automation_recipes WHERE id = ?');
        $stmt->execute([$id]);
        $recipe = $stmt->fetch();
        
        $recipe['channels'] = json_decode($recipe['channels'] ?? '[]', true);
        $recipe['steps'] = json_decode($recipe['steps'] ?? '[]', true);
        $recipe['tags'] = json_decode($recipe['tags'] ?? '[]', true);
        
        Response::json($recipe);
    }
    
    // Delete recipe
    public static function delete(string $id): void {
        $userId = Auth::userIdOrFail();
        $pdo = Database::conn();
        
        $stmt = $pdo->prepare('DELETE FROM automation_recipes WHERE id = ? AND user_id = ? AND is_system = 0');
        $stmt->execute([$id, $userId]);
        
        Response::json(['success' => true]);
    }
    
    // Install/use a recipe (create instance + automation OR workflow)
    public static function install(string $id): void {
        $userId = Auth::userIdOrFail();
        $body = get_json_body();
        $pdo = Database::conn();
        
        // Get recipe
        $stmt = $pdo->prepare('SELECT * FROM automation_recipes WHERE id = ? AND (is_system = 1 OR user_id = ?)');
        $stmt->execute([$id, $userId]);
        $recipe = $stmt->fetch();
        
        if (!$recipe) {
            Response::error('Recipe not found', 404);
            return;
        }
        
        $name = $body['name'] ?? $recipe['name'];
        $description = $body['description'] ?? $recipe['description'];
        $steps = json_decode($recipe['steps'] ?? '[]', true);
        $triggerConfig = json_decode($recipe['trigger_config'] ?? '{}', true);
        $recipeTriggerType = $recipe['trigger_type'] ?? 'manual';
        
        // Determine installation type: 'model' (Workflow V2) vs 'legacy' (Trigger/Rule V1)
        // If it has steps and duration, it's likely a workflow. If it's single action or just duration, could be rule.
        // Frontend uses 'type' property. We should check recipe data.
        $isWorkflow = ($recipe['difficulty'] !== 'beginner') || count($steps) > 1 || $recipeTriggerType === 'manual';
        
        // Context setup (Workspace/Company)
        // We need workspace context for V2 workflows
        $workspaceId = Auth::workspaceId($userId);
        if (!$workspaceId) {
            $ws = Auth::ensureWorkspaceForUser($userId);
            $workspaceId = (int)$ws['id'];
        }
        
        $ctx = $GLOBALS['tenantContext'] ?? null;
        $companyId = ($ctx && isset($ctx->activeCompanyId)) ? (int)$ctx->activeCompanyId : null;

        // Create instance record (for library tracking)
        $stmt = $pdo->prepare('
            INSERT INTO user_automation_instances 
            (user_id, client_id, recipe_id, name, description, customized_steps, status, trigger_config, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
        ');
        $customizedSteps = $body['customized_steps'] ?? $steps;
        $stmt->execute([
            $userId,
            $body['client_id'] ?? null,
            $id,
            $name,
            $description,
            json_encode($customizedSteps),
            'draft',
            $recipe['trigger_config']
        ]);
        $instanceId = (int)$pdo->lastInsertId();

        $automationId = null;
        $workflowId = null;

        if ($isWorkflow) {
            // === V2 WORKFLOW INSTALLATION ===
            try {
                // Ensure automation_workflows has recipe_id
                try {
                    $pdo->exec("ALTER TABLE automation_workflows ADD COLUMN recipe_id INT NULL AFTER description");
                    $pdo->exec("ALTER TABLE automation_workflows ADD INDEX idx_recipe (recipe_id)");
                } catch (PDOException $e) {}

                // Create Workflow
                $stmt = $pdo->prepare("
                    INSERT INTO automation_workflows 
                    (workspace_id, name, description, status, trigger_type, trigger_config, created_by, recipe_id, created_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
                ");
                $stmt->execute([
                    $workspaceId,
                    $name,
                    $description,
                    'draft',
                    $recipeTriggerType,
                    json_encode($triggerConfig),
                    $userId,
                    $id
                ]);
                $workflowId = (int)$pdo->lastInsertId();

                // Create Actions
                $actionStmt = $pdo->prepare("
                    INSERT INTO automation_actions 
                    (workflow_id, action_type, action_config, sort_order, delay_seconds, created_at)
                    VALUES (?, ?, ?, ?, ?, NOW())
                ");

                foreach ($steps as $i => $step) {
                    // Map step to action
                    $actionType = $step['type'] === 'sms' ? 'send_sms' : 'send_email';
                    $config = [];
                    if ($actionType === 'send_email') {
                        $config['subject'] = $step['subject'] ?? '';
                        $config['template_id'] = $step['template_id'] ?? null;
                    } else {
                        $config['message'] = $step['message'] ?? '';
                    }

                    // Convert delay (hours to seconds)
                    $delaySeconds = 0;
                    if (!empty($step['delay'])) {
                        $delaySeconds = (int)$step['delay'] * 3600;
                    }

                    $actionStmt->execute([
                        $workflowId,
                        $actionType,
                        json_encode($config),
                        $i,
                        $delaySeconds
                    ]);
                }

                // Increment usage
                $pdo->prepare('UPDATE automation_recipes SET usage_count = usage_count + 1 WHERE id = ?')->execute([$id]);

                // Update instance
                // We use flow_id column to store workflow_id for frontend compatibility (it checks flow_id for workflows)
                $pdo->prepare('UPDATE user_automation_instances SET flow_id = ? WHERE id = ?')->execute([$workflowId, $instanceId]);

            } catch (Exception $e) {
                error_log('Failed to install workflow V2: ' . $e->getMessage());
                Response::error('Failed to create workflow: ' . $e->getMessage(), 500);
                return;
            }
        } else {
            // === V1 TRIGGER/RULE INSTALLATION ===
            try {
                // Ensure recipe_id column exists
                try {
                    $pdo->exec("ALTER TABLE followup_automations ADD COLUMN recipe_id INT NULL AFTER user_id");
                    $pdo->exec("ALTER TABLE followup_automations ADD INDEX idx_recipe (recipe_id)");
                } catch (PDOException $e) {}

                $actionType = 'send_email';
                $actionConfig = [];
                if (!empty($steps) && isset($steps[0])) {
                    $firstStep = $steps[0];
                    if (($firstStep['type'] ?? '') === 'sms') {
                        $actionType = 'send_sms';
                        $actionConfig = ['message' => $firstStep['message'] ?? ''];
                    } else {
                        $actionType = 'send_email';
                        $actionConfig = ['subject' => $firstStep['subject'] ?? '', 'template_id' => $firstStep['template_id'] ?? null];
                    }
                }
                
                $stmt = $pdo->prepare('
                    INSERT INTO followup_automations 
                    (user_id, recipe_id, name, description, channel, trigger_type, trigger_conditions, action_type, action_config, delay_amount, delay_unit, is_active, priority, created_at, updated_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, NOW(), NOW())
                ');
                $stmt->execute([
                    $userId,
                    $id,
                    $name,
                    $description,
                    $recipe['channels'][0] ?? 'email', // Simple triggers usually single channel
                    $recipeTriggerType,
                    json_encode($triggerConfig),
                    $actionType,
                    json_encode($actionConfig),
                    $steps[0]['delay'] ?? 0,
                    'hours'
                ]);
                $automationId = (int)$pdo->lastInsertId();

                // Increment usage
                $pdo->prepare('UPDATE automation_recipes SET usage_count = usage_count + 1 WHERE id = ?')->execute([$id]);

                // Update instance
                $pdo->prepare('UPDATE user_automation_instances SET automation_id = ? WHERE id = ?')->execute([$automationId, $instanceId]);

            } catch (Exception $e) {
                error_log('Failed to install trigger V1: ' . $e->getMessage());
                Response::error('Failed to create trigger: ' . $e->getMessage(), 500);
                return;
            }
        }
        
        $stmt = $pdo->prepare('SELECT * FROM user_automation_instances WHERE id = ?');
        $stmt->execute([$instanceId]);
        $instance = $stmt->fetch();
        
        $instance['customized_steps'] = json_decode($instance['customized_steps'] ?? '[]', true);
        $instance['trigger_config'] = json_decode($instance['trigger_config'] ?? '{}', true);
        $instance['automation_id'] = $automationId;
        $instance['flow_id'] = $workflowId; // This maps to V2 workflow ID
        
        Response::json($instance, 201);
    }
    
    // Get categories
    public static function getCategories(): void {
        $categories = [
            ['value' => 'welcome', 'label' => 'Welcome Series', 'icon' => 'hand-wave'],
            ['value' => 'nurture', 'label' => 'Lead Nurture', 'icon' => 'sprout'],
            ['value' => 'reengagement', 'label' => 'Re-engagement', 'icon' => 'refresh'],
            ['value' => 'abandoned_cart', 'label' => 'Abandoned Cart', 'icon' => 'shopping-cart'],
            ['value' => 'post_purchase', 'label' => 'Post-Purchase', 'icon' => 'package'],
            ['value' => 'birthday', 'label' => 'Birthday/Anniversary', 'icon' => 'cake'],
            ['value' => 'review_request', 'label' => 'Review Request', 'icon' => 'star'],
            ['value' => 'appointment', 'label' => 'Appointment', 'icon' => 'calendar'],
            ['value' => 'custom', 'label' => 'Custom', 'icon' => 'settings']
        ];
        
        Response::json(['items' => $categories]);
    }
}
