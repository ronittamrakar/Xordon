<?php
/**
 * OpportunitiesController - Pipeline & Deals (GHL-style)
 * Handles pipelines, stages, and opportunities
 */

require_once __DIR__ . '/../Database.php';
require_once __DIR__ . '/../Response.php';
require_once __DIR__ . '/../Auth.php';
require_once __DIR__ . '/../TenantContext.php';

class OpportunitiesController {
    
    /**
     * Get workspace and company scope from TenantContext
     */
    private static function getScope(): array {
        $ctx = $GLOBALS['tenantContext'] ?? null;
        if (!$ctx || !isset($ctx->workspaceId)) {
            Response::error('Workspace context required', 403);
            exit;
        }
        return [
            'workspace_id' => (int)$ctx->workspaceId,
            'company_id' => $ctx->activeCompanyId ? (int)$ctx->activeCompanyId : null
        ];
    }
    
    // ==================== PIPELINES ====================
    
    /**
     * List pipelines
     * GET /pipelines
     */
    public static function getPipelines(): void {
        $userId = Auth::userIdOrFail();
        $scope = self::getScope();
        $pdo = Database::conn();
        
        $sql = "SELECT p.*, 
                    (SELECT COUNT(*) FROM opportunities WHERE pipeline_id = p.id) as opportunity_count,
                    (SELECT SUM(value) FROM opportunities WHERE pipeline_id = p.id AND status = 'open') as total_value
                FROM pipelines p
                WHERE p.workspace_id = ?";
        $params = [$scope['workspace_id']];
        
        if ($scope['company_id']) {
            $sql .= ' AND (p.company_id = ? OR p.company_id IS NULL)';
            $params[] = $scope['company_id'];
        }
        
        $sql .= ' ORDER BY p.is_default DESC, p.name ASC';
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $pipelines = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Get stages for each pipeline
        foreach ($pipelines as &$pipeline) {
            $stagesSql = "SELECT * FROM pipeline_stages WHERE pipeline_id = ? ORDER BY sort_order ASC";
            $stagesStmt = $pdo->prepare($stagesSql);
            $stagesStmt->execute([$pipeline['id']]);
            $pipeline['stages'] = $stagesStmt->fetchAll(PDO::FETCH_ASSOC);
        }
        
        Response::json([
            'success' => true,
            'data' => $pipelines
        ]);
    }
    
    /**
     * Get single pipeline with stages
     * GET /pipelines/:id
     */
    public static function getPipeline(int $id): void {
        $userId = Auth::userIdOrFail();
        $scope = self::getScope();
        $pdo = Database::conn();
        
        $sql = "SELECT * FROM pipelines WHERE id = ? AND workspace_id = ?";
        $params = [$id, $scope['workspace_id']];
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $pipeline = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$pipeline) {
            Response::notFound('Pipeline not found');
            return;
        }
        
        // Get stages
        $stagesSql = "SELECT * FROM pipeline_stages WHERE pipeline_id = ? ORDER BY sort_order ASC";
        $stagesStmt = $pdo->prepare($stagesSql);
        $stagesStmt->execute([$id]);
        $pipeline['stages'] = $stagesStmt->fetchAll(PDO::FETCH_ASSOC);
        
        Response::json([
            'success' => true,
            'data' => $pipeline
        ]);
    }
    
    /**
     * Create pipeline
     * POST /pipelines
     */
    public static function createPipeline(): void {
        $userId = Auth::userIdOrFail();
        $scope = self::getScope();
        $body = get_json_body();
        $pdo = Database::conn();
        
        if (empty($body['name'])) {
            Response::validationError('Pipeline name is required');
            return;
        }
        
        $pdo->beginTransaction();
        try {
            // Create pipeline
            $stmt = $pdo->prepare("
                INSERT INTO pipelines (workspace_id, company_id, name, is_default, created_at)
                VALUES (?, ?, ?, ?, NOW())
            ");
            $stmt->execute([
                $scope['workspace_id'],
                $scope['company_id'],
                $body['name'],
                !empty($body['is_default']) ? 1 : 0
            ]);
            
            $pipelineId = (int)$pdo->lastInsertId();
            
            // Create default stages if none provided
            $stages = $body['stages'] ?? [
                ['name' => 'New Lead', 'color' => '#6366f1'],
                ['name' => 'Contacted', 'color' => '#8b5cf6'],
                ['name' => 'Qualified', 'color' => '#a855f7'],
                ['name' => 'Proposal Sent', 'color' => '#d946ef'],
                ['name' => 'Negotiation', 'color' => '#ec4899'],
                ['name' => 'Won', 'color' => '#22c55e', 'is_won' => true],
                ['name' => 'Lost', 'color' => '#ef4444', 'is_lost' => true]
            ];
            
            $stageStmt = $pdo->prepare("
                INSERT INTO pipeline_stages (workspace_id, company_id, pipeline_id, name, color, sort_order, is_won, is_lost, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
            ");
            
            foreach ($stages as $i => $stage) {
                $stageStmt->execute([
                    $scope['workspace_id'],
                    $scope['company_id'],
                    $pipelineId,
                    $stage['name'],
                    $stage['color'] ?? '#6366f1',
                    $i,
                    !empty($stage['is_won']) ? 1 : 0,
                    !empty($stage['is_lost']) ? 1 : 0
                ]);
            }
            
            $pdo->commit();
            
            // Emit event
            self::emitEvent($pdo, $scope, 'pipeline.created', 'pipeline', $pipelineId, [
                'name' => $body['name']
            ]);
            
            Response::json([
                'success' => true,
                'data' => ['id' => $pipelineId],
                'message' => 'Pipeline created'
            ], 201);
        } catch (Exception $e) {
            $pdo->rollBack();
            Response::error('Failed to create pipeline: ' . $e->getMessage());
        }
    }
    
    /**
     * Update pipeline
     * PUT /pipelines/:id
     */
    public static function updatePipeline(int $id): void {
        $userId = Auth::userIdOrFail();
        $scope = self::getScope();
        $body = get_json_body();
        $pdo = Database::conn();
        
        $updates = [];
        $params = [];
        
        if (isset($body['name'])) {
            $updates[] = 'name = ?';
            $params[] = $body['name'];
        }
        if (isset($body['is_default'])) {
            $updates[] = 'is_default = ?';
            $params[] = $body['is_default'] ? 1 : 0;
        }
        
        if (empty($updates)) {
            Response::json(['success' => true, 'message' => 'No updates']);
            return;
        }
        
        $params[] = $id;
        $params[] = $scope['workspace_id'];
        
        $sql = "UPDATE pipelines SET " . implode(', ', $updates) . ", updated_at = NOW() WHERE id = ? AND workspace_id = ?";
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        
        if ($stmt->rowCount() === 0) {
            Response::notFound('Pipeline not found');
            return;
        }
        
        Response::json(['success' => true, 'message' => 'Pipeline updated']);
    }
    
    /**
     * Delete pipeline
     * DELETE /pipelines/:id
     */
    public static function deletePipeline(int $id): void {
        $userId = Auth::userIdOrFail();
        $scope = self::getScope();
        $pdo = Database::conn();
        
        // Check if pipeline has opportunities
        $checkStmt = $pdo->prepare("SELECT COUNT(*) FROM opportunities WHERE pipeline_id = ?");
        $checkStmt->execute([$id]);
        if ($checkStmt->fetchColumn() > 0) {
            Response::error('Cannot delete pipeline with existing opportunities', 400);
            return;
        }
        
        $stmt = $pdo->prepare("DELETE FROM pipelines WHERE id = ? AND workspace_id = ?");
        $stmt->execute([$id, $scope['workspace_id']]);
        
        if ($stmt->rowCount() === 0) {
            Response::notFound('Pipeline not found');
            return;
        }
        
        Response::json(['success' => true, 'message' => 'Pipeline deleted']);
    }
    
    // ==================== STAGES ====================
    
    /**
     * Get stages for a pipeline
     * GET /pipelines/:id/stages
     */
    public static function getStages(int $pipelineId): void {
        $userId = Auth::userIdOrFail();
        $scope = self::getScope();
        $pdo = Database::conn();
        
        $sql = "SELECT s.*, 
                    (SELECT COUNT(*) FROM opportunities WHERE stage_id = s.id) as opportunity_count,
                    (SELECT SUM(value) FROM opportunities WHERE stage_id = s.id AND status = 'open') as total_value
                FROM pipeline_stages s
                WHERE s.pipeline_id = ? AND s.workspace_id = ?
                ORDER BY s.sort_order ASC";
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute([$pipelineId, $scope['workspace_id']]);
        $stages = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        Response::json([
            'success' => true,
            'data' => $stages
        ]);
    }
    
    /**
     * Create stage
     * POST /pipelines/:id/stages
     */
    public static function createStage(int $pipelineId): void {
        $userId = Auth::userIdOrFail();
        $scope = self::getScope();
        $body = get_json_body();
        $pdo = Database::conn();
        
        if (empty($body['name'])) {
            Response::validationError('Stage name is required');
            return;
        }
        
        // Get max sort order
        $maxStmt = $pdo->prepare("SELECT MAX(sort_order) FROM pipeline_stages WHERE pipeline_id = ?");
        $maxStmt->execute([$pipelineId]);
        $maxOrder = (int)$maxStmt->fetchColumn();
        
        $stmt = $pdo->prepare("
            INSERT INTO pipeline_stages (workspace_id, company_id, pipeline_id, name, color, sort_order, is_won, is_lost, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
        ");
        $stmt->execute([
            $scope['workspace_id'],
            $scope['company_id'],
            $pipelineId,
            $body['name'],
            $body['color'] ?? '#6366f1',
            $maxOrder + 1,
            !empty($body['is_won']) ? 1 : 0,
            !empty($body['is_lost']) ? 1 : 0
        ]);
        
        $stageId = (int)$pdo->lastInsertId();
        
        Response::json([
            'success' => true,
            'data' => ['id' => $stageId],
            'message' => 'Stage created'
        ], 201);
    }
    
    /**
     * Update stage
     * PUT /pipeline-stages/:id
     */
    public static function updateStage(int $id): void {
        $userId = Auth::userIdOrFail();
        $scope = self::getScope();
        $body = get_json_body();
        $pdo = Database::conn();
        
        $updates = [];
        $params = [];
        
        foreach (['name', 'color', 'sort_order', 'is_won', 'is_lost'] as $field) {
            if (isset($body[$field])) {
                $updates[] = "$field = ?";
                $params[] = $body[$field];
            }
        }
        
        if (empty($updates)) {
            Response::json(['success' => true, 'message' => 'No updates']);
            return;
        }
        
        $params[] = $id;
        $params[] = $scope['workspace_id'];
        
        $sql = "UPDATE pipeline_stages SET " . implode(', ', $updates) . " WHERE id = ? AND workspace_id = ?";
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        
        Response::json(['success' => true, 'message' => 'Stage updated']);
    }
    
    /**
     * Delete stage
     * DELETE /pipeline-stages/:id
     */
    public static function deleteStage(int $id): void {
        $userId = Auth::userIdOrFail();
        $scope = self::getScope();
        $pdo = Database::conn();
        
        // Check if stage has opportunities
        $checkStmt = $pdo->prepare("SELECT COUNT(*) FROM opportunities WHERE stage_id = ?");
        $checkStmt->execute([$id]);
        if ($checkStmt->fetchColumn() > 0) {
            Response::error('Cannot delete stage with existing opportunities. Move them first.', 400);
            return;
        }
        
        $stmt = $pdo->prepare("DELETE FROM pipeline_stages WHERE id = ? AND workspace_id = ?");
        $stmt->execute([$id, $scope['workspace_id']]);
        
        Response::json(['success' => true, 'message' => 'Stage deleted']);
    }
    
    /**
     * Reorder stages
     * POST /pipelines/:id/stages/reorder
     */
    public static function reorderStages(int $pipelineId): void {
        $userId = Auth::userIdOrFail();
        $scope = self::getScope();
        $body = get_json_body();
        $pdo = Database::conn();
        
        if (empty($body['stage_ids']) || !is_array($body['stage_ids'])) {
            Response::validationError('stage_ids array is required');
            return;
        }
        
        $stmt = $pdo->prepare("UPDATE pipeline_stages SET sort_order = ? WHERE id = ? AND pipeline_id = ? AND workspace_id = ?");
        
        foreach ($body['stage_ids'] as $order => $stageId) {
            $stmt->execute([$order, $stageId, $pipelineId, $scope['workspace_id']]);
        }
        
        Response::json(['success' => true, 'message' => 'Stages reordered']);
    }
    
    // ==================== OPPORTUNITIES ====================
    
    /**
     * List opportunities
     * GET /opportunities
     * Query params: pipeline_id, stage_id, status, owner, contact_id, q, limit, offset
     */
    public static function index(): void {
        $userId = Auth::userIdOrFail();
        $scope = self::getScope();
        $pdo = Database::conn();
        
        $pipelineId = $_GET['pipeline_id'] ?? null;
        $stageId = $_GET['stage_id'] ?? null;
        $status = $_GET['status'] ?? null;
        $ownerId = $_GET['owner'] ?? null;
        $contactId = $_GET['contact_id'] ?? null;
        $search = $_GET['q'] ?? null;
        $limit = min((int)($_GET['limit'] ?? 100), 500);
        $offset = (int)($_GET['offset'] ?? 0);
        
        $where = ['o.workspace_id = ?'];
        $params = [$scope['workspace_id']];
        
        if ($scope['company_id']) {
            $where[] = 'o.company_id = ?';
            $params[] = $scope['company_id'];
        }
        
        if ($pipelineId) {
            $where[] = 'o.pipeline_id = ?';
            $params[] = (int)$pipelineId;
        }
        if ($stageId) {
            $where[] = 'o.stage_id = ?';
            $params[] = (int)$stageId;
        }
        if ($status && in_array($status, ['open', 'won', 'lost'])) {
            $where[] = 'o.status = ?';
            $params[] = $status;
        }
        if ($ownerId === 'me') {
            $where[] = 'o.owner_user_id = ?';
            $params[] = $userId;
        } elseif ($ownerId && is_numeric($ownerId)) {
            $where[] = 'o.owner_user_id = ?';
            $params[] = (int)$ownerId;
        }
        if ($contactId) {
            $where[] = 'o.contact_id = ?';
            $params[] = (int)$contactId;
        }
        if ($search) {
            $where[] = '(o.name LIKE ? OR ct.first_name LIKE ? OR ct.last_name LIKE ? OR ct.email LIKE ?)';
            $searchTerm = "%$search%";
            $params = array_merge($params, [$searchTerm, $searchTerm, $searchTerm, $searchTerm]);
        }
        
        $whereClause = implode(' AND ', $where);
        
        // Get total
        $countSql = "SELECT COUNT(*) FROM opportunities o 
                     LEFT JOIN recipients ct ON o.contact_id = ct.id
                     WHERE $whereClause";
        $countStmt = $pdo->prepare($countSql);
        $countStmt->execute($params);
        $total = (int)$countStmt->fetchColumn();
        
        // Get opportunities
        $sql = "SELECT 
                    o.*,
                    p.name as pipeline_name,
                    s.name as stage_name,
                    s.color as stage_color,
                    ct.first_name as contact_first_name,
                    ct.last_name as contact_last_name,
                    ct.email as contact_email,
                    ct.phone as contact_phone,
                    u.name as owner_name
                FROM opportunities o
                LEFT JOIN pipelines p ON o.pipeline_id = p.id
                LEFT JOIN pipeline_stages s ON o.stage_id = s.id
                LEFT JOIN recipients ct ON o.contact_id = ct.id
                LEFT JOIN users u ON o.owner_user_id = u.id
                WHERE $whereClause
                ORDER BY s.sort_order ASC, o.created_at DESC
                LIMIT ? OFFSET ?";
        
        $params[] = $limit;
        $params[] = $offset;
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $opportunities = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        Response::json([
            'success' => true,
            'data' => $opportunities,
            'meta' => [
                'total' => $total,
                'limit' => $limit,
                'offset' => $offset
            ]
        ]);
    }
    
    /**
     * Get single opportunity
     * GET /opportunities/:id
     */
    public static function show(int $id): void {
        $userId = Auth::userIdOrFail();
        $scope = self::getScope();
        $pdo = Database::conn();
        
        $sql = "SELECT 
                    o.*,
                    p.name as pipeline_name,
                    s.name as stage_name,
                    s.color as stage_color,
                    ct.first_name as contact_first_name,
                    ct.last_name as contact_last_name,
                    ct.email as contact_email,
                    ct.phone as contact_phone,
                    u.name as owner_name
                FROM opportunities o
                LEFT JOIN pipelines p ON o.pipeline_id = p.id
                LEFT JOIN pipeline_stages s ON o.stage_id = s.id
                LEFT JOIN recipients ct ON o.contact_id = ct.id
                LEFT JOIN users u ON o.owner_user_id = u.id
                WHERE o.id = ? AND o.workspace_id = ?";
        $params = [$id, $scope['workspace_id']];
        
        if ($scope['company_id']) {
            $sql .= ' AND o.company_id = ?';
            $params[] = $scope['company_id'];
        }
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $opportunity = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$opportunity) {
            Response::notFound('Opportunity not found');
            return;
        }
        
        Response::json([
            'success' => true,
            'data' => $opportunity
        ]);
    }
    
    /**
     * Create opportunity
     * POST /opportunities
     */
    public static function create(): void {
        $userId = Auth::userIdOrFail();
        $scope = self::getScope();
        $body = get_json_body();
        $pdo = Database::conn();
        
        if (empty($body['name'])) {
            Response::validationError('Opportunity name is required');
            return;
        }
        
        // Get default pipeline if not specified
        $pipelineId = $body['pipeline_id'] ?? null;
        $stageId = $body['stage_id'] ?? null;
        
        if (!$pipelineId) {
            $defaultPipeline = $pdo->prepare("SELECT id FROM pipelines WHERE workspace_id = ? AND is_default = 1 LIMIT 1");
            $defaultPipeline->execute([$scope['workspace_id']]);
            $pipeline = $defaultPipeline->fetch();
            if ($pipeline) {
                $pipelineId = $pipeline['id'];
            } else {
                Response::validationError('No pipeline specified and no default pipeline exists');
                return;
            }
        }
        
        // Get first stage if not specified
        if (!$stageId) {
            $firstStage = $pdo->prepare("SELECT id FROM pipeline_stages WHERE pipeline_id = ? ORDER BY sort_order ASC LIMIT 1");
            $firstStage->execute([$pipelineId]);
            $stage = $firstStage->fetch();
            if ($stage) {
                $stageId = $stage['id'];
            } else {
                Response::validationError('Pipeline has no stages');
                return;
            }
        }
        
        $stmt = $pdo->prepare("
            INSERT INTO opportunities 
            (workspace_id, company_id, contact_id, pipeline_id, stage_id, owner_user_id, name, value, currency, status, expected_close_date, notes, metadata, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'open', ?, ?, ?, NOW())
        ");
        $stmt->execute([
            $scope['workspace_id'],
            $scope['company_id'],
            $body['contact_id'] ?? null,
            $pipelineId,
            $stageId,
            $body['owner_user_id'] ?? $userId,
            $body['name'],
            $body['value'] ?? 0,
            $body['currency'] ?? 'USD',
            $body['expected_close_date'] ?? null,
            $body['notes'] ?? null,
            isset($body['metadata']) ? json_encode($body['metadata']) : null
        ]);
        
        $opportunityId = (int)$pdo->lastInsertId();
        
        // Emit event
        self::emitEvent($pdo, $scope, 'opportunity.created', 'opportunity', $opportunityId, [
            'name' => $body['name'],
            'pipeline_id' => $pipelineId,
            'stage_id' => $stageId,
            'contact_id' => $body['contact_id'] ?? null,
            'value' => $body['value'] ?? 0
        ]);
        
        Response::json([
            'success' => true,
            'data' => ['id' => $opportunityId],
            'message' => 'Opportunity created'
        ], 201);
    }
    
    /**
     * Update opportunity
     * PUT /opportunities/:id
     */
    public static function update(int $id): void {
        $userId = Auth::userIdOrFail();
        $scope = self::getScope();
        $body = get_json_body();
        $pdo = Database::conn();
        
        $updates = [];
        $params = [];
        
        $fields = ['name', 'value', 'currency', 'status', 'expected_close_date', 'actual_close_date', 'lost_reason', 'notes', 'contact_id', 'owner_user_id', 'pipeline_id', 'stage_id'];
        foreach ($fields as $field) {
            if (array_key_exists($field, $body)) {
                $updates[] = "$field = ?";
                $params[] = $body[$field];
            }
        }
        
        if (isset($body['metadata'])) {
            $updates[] = 'metadata = ?';
            $params[] = json_encode($body['metadata']);
        }
        
        if (empty($updates)) {
            Response::json(['success' => true, 'message' => 'No updates']);
            return;
        }
        
        $params[] = $id;
        $params[] = $scope['workspace_id'];
        
        $sql = "UPDATE opportunities SET " . implode(', ', $updates) . ", updated_at = NOW() WHERE id = ? AND workspace_id = ?";
        if ($scope['company_id']) {
            $sql .= ' AND company_id = ?';
            $params[] = $scope['company_id'];
        }
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        
        if ($stmt->rowCount() === 0) {
            Response::notFound('Opportunity not found');
            return;
        }
        
        Response::json(['success' => true, 'message' => 'Opportunity updated']);
    }
    
    /**
     * Move opportunity to a different stage
     * POST /opportunities/:id/move
     */
    public static function moveStage(int $id): void {
        $userId = Auth::userIdOrFail();
        $scope = self::getScope();
        $body = get_json_body();
        $pdo = Database::conn();
        
        if (empty($body['stage_id'])) {
            Response::validationError('stage_id is required');
            return;
        }
        
        $newStageId = (int)$body['stage_id'];
        
        // Get current opportunity
        $currentSql = "SELECT stage_id, pipeline_id FROM opportunities WHERE id = ? AND workspace_id = ?";
        $currentParams = [$id, $scope['workspace_id']];
        if ($scope['company_id']) {
            $currentSql .= ' AND company_id = ?';
            $currentParams[] = $scope['company_id'];
        }
        $currentStmt = $pdo->prepare($currentSql);
        $currentStmt->execute($currentParams);
        $current = $currentStmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$current) {
            Response::notFound('Opportunity not found');
            return;
        }
        
        $oldStageId = (int)$current['stage_id'];
        
        // Get new stage info
        $stageSql = "SELECT is_won, is_lost FROM pipeline_stages WHERE id = ?";
        $stageStmt = $pdo->prepare($stageSql);
        $stageStmt->execute([$newStageId]);
        $stage = $stageStmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$stage) {
            Response::notFound('Stage not found');
            return;
        }
        
        // Determine status based on stage
        $status = 'open';
        $actualCloseDate = null;
        if ($stage['is_won']) {
            $status = 'won';
            $actualCloseDate = date('Y-m-d');
        } elseif ($stage['is_lost']) {
            $status = 'lost';
            $actualCloseDate = date('Y-m-d');
        }
        
        // Update opportunity
        $updateSql = "UPDATE opportunities SET stage_id = ?, status = ?, actual_close_date = ?, updated_at = NOW() WHERE id = ?";
        $pdo->prepare($updateSql)->execute([$newStageId, $status, $actualCloseDate, $id]);
        
        // Emit event
        self::emitEvent($pdo, $scope, 'opportunity.stage_changed', 'opportunity', $id, [
            'old_stage_id' => $oldStageId,
            'new_stage_id' => $newStageId,
            'status' => $status
        ]);
        
        Response::json([
            'success' => true,
            'message' => 'Opportunity moved',
            'data' => [
                'stage_id' => $newStageId,
                'status' => $status
            ]
        ]);
    }
    
    /**
     * Delete opportunity
     * DELETE /opportunities/:id
     */
    public static function delete(int $id): void {
        $userId = Auth::userIdOrFail();
        $scope = self::getScope();
        $pdo = Database::conn();
        
        $sql = "DELETE FROM opportunities WHERE id = ? AND workspace_id = ?";
        $params = [$id, $scope['workspace_id']];
        if ($scope['company_id']) {
            $sql .= ' AND company_id = ?';
            $params[] = $scope['company_id'];
        }
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        
        if ($stmt->rowCount() === 0) {
            Response::notFound('Opportunity not found');
            return;
        }
        
        Response::json(['success' => true, 'message' => 'Opportunity deleted']);
    }
    
    /**
     * Get pipeline/opportunity stats
     * GET /opportunities/stats
     */
    public static function stats(): void {
        $userId = Auth::userIdOrFail();
        $scope = self::getScope();
        $pdo = Database::conn();
        
        $where = 'workspace_id = ?';
        $params = [$scope['workspace_id']];
        if ($scope['company_id']) {
            $where .= ' AND company_id = ?';
            $params[] = $scope['company_id'];
        }
        
        $sql = "SELECT 
                    COUNT(*) as total,
                    SUM(CASE WHEN status = 'open' THEN 1 ELSE 0 END) as open,
                    SUM(CASE WHEN status = 'won' THEN 1 ELSE 0 END) as won,
                    SUM(CASE WHEN status = 'lost' THEN 1 ELSE 0 END) as lost,
                    SUM(CASE WHEN status = 'open' THEN value ELSE 0 END) as open_value,
                    SUM(CASE WHEN status = 'won' THEN value ELSE 0 END) as won_value,
                    SUM(CASE WHEN status = 'lost' THEN value ELSE 0 END) as lost_value
                FROM opportunities
                WHERE $where";
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $stats = $stmt->fetch(PDO::FETCH_ASSOC);
        
        Response::json([
            'success' => true,
            'data' => $stats
        ]);
    }
    
    // ==================== BUSINESS EVENTS ====================
    
    /**
     * Get business events (for debugging/audit)
     * GET /events
     */
    public static function getEvents(): void {
        $userId = Auth::userIdOrFail();
        $scope = self::getScope();
        $pdo = Database::conn();
        
        $eventType = $_GET['type'] ?? null;
        $entityType = $_GET['entity_type'] ?? null;
        $limit = min((int)($_GET['limit'] ?? 50), 200);
        $offset = (int)($_GET['offset'] ?? 0);
        
        $where = ['workspace_id = ?'];
        $params = [$scope['workspace_id']];
        
        if ($scope['company_id']) {
            $where[] = 'company_id = ?';
            $params[] = $scope['company_id'];
        }
        if ($eventType) {
            $where[] = 'event_type = ?';
            $params[] = $eventType;
        }
        if ($entityType) {
            $where[] = 'entity_type = ?';
            $params[] = $entityType;
        }
        
        $whereClause = implode(' AND ', $where);
        
        $sql = "SELECT * FROM business_events WHERE $whereClause ORDER BY created_at DESC LIMIT ? OFFSET ?";
        $params[] = $limit;
        $params[] = $offset;
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $events = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Decode payload
        foreach ($events as &$event) {
            $event['payload'] = $event['payload'] ? json_decode($event['payload'], true) : null;
        }
        
        Response::json([
            'success' => true,
            'data' => $events
        ]);
    }
    
    /**
     * Helper: Emit business event
     */
    private static function emitEvent(PDO $pdo, array $scope, string $eventType, string $entityType, int $entityId, array $payload = []): void {
        try {
            $stmt = $pdo->prepare("
                INSERT INTO business_events (workspace_id, company_id, event_type, entity_type, entity_id, actor_type, actor_id, payload, created_at)
                VALUES (?, ?, ?, ?, ?, 'user', ?, ?, NOW())
            ");
            $stmt->execute([
                $scope['workspace_id'],
                $scope['company_id'] ?? null,
                $eventType,
                $entityType,
                $entityId,
                Auth::userId(),
                json_encode($payload)
            ]);
        } catch (Exception $e) {
            error_log("Failed to emit event: " . $e->getMessage());
        }
    }
}
