<?php
/**
 * SnapshotsController - GHL-style Snapshots
 * Export/import pipelines, automations, forms, templates
 */

require_once __DIR__ . '/../Database.php';
require_once __DIR__ . '/../Response.php';
require_once __DIR__ . '/../Auth.php';
require_once __DIR__ . '/../TenantContext.php';

class SnapshotsController {
    
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
    
    // ==================== SNAPSHOTS ====================
    
    /**
     * List snapshots
     * GET /snapshots
     */
    public static function listSnapshots(): void {
        $userId = Auth::userIdOrFail();
        $scope = self::getScope();
        $pdo = Database::conn();
        
        $category = $_GET['category'] ?? null;
        
        $where = ['s.workspace_id = ?'];
        $params = [$scope['workspace_id']];
        
        if ($scope['company_id']) {
            $where[] = '(s.company_id = ? OR s.company_id IS NULL)';
            $params[] = $scope['company_id'];
        }
        
        if ($category && in_array($category, ['full', 'pipelines', 'automations', 'forms', 'templates', 'custom'])) {
            $where[] = 's.category = ?';
            $params[] = $category;
        }
        
        $whereClause = implode(' AND ', $where);
        
        $sql = "SELECT s.id, s.name, s.description, s.version, s.category, s.is_template, s.is_public,
                    s.thumbnail_url, s.metadata, s.created_by, s.created_at, s.updated_at,
                    u.name as created_by_name
                FROM snapshots s
                LEFT JOIN users u ON s.created_by = u.id
                WHERE $whereClause
                ORDER BY s.created_at DESC";
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $snapshots = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        foreach ($snapshots as &$snapshot) {
            $snapshot['metadata'] = $snapshot['metadata'] ? json_decode($snapshot['metadata'], true) : null;
        }
        
        Response::json([
            'success' => true,
            'data' => $snapshots
        ]);
    }
    
    /**
     * Get snapshot details
     * GET /snapshots/:id
     */
    public static function getSnapshot(int $id): void {
        $userId = Auth::userIdOrFail();
        $scope = self::getScope();
        $pdo = Database::conn();
        
        $stmt = $pdo->prepare("SELECT * FROM snapshots WHERE id = ? AND workspace_id = ?");
        $stmt->execute([$id, $scope['workspace_id']]);
        $snapshot = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$snapshot) {
            Response::notFound('Snapshot not found');
            return;
        }
        
        $snapshot['contents'] = json_decode($snapshot['contents'], true);
        $snapshot['metadata'] = $snapshot['metadata'] ? json_decode($snapshot['metadata'], true) : null;
        
        Response::json([
            'success' => true,
            'data' => $snapshot
        ]);
    }
    
    /**
     * Create snapshot (export)
     * POST /snapshots
     */
    public static function createSnapshot(): void {
        $userId = Auth::userIdOrFail();
        $scope = self::getScope();
        $body = get_json_body();
        $pdo = Database::conn();
        
        if (empty($body['name'])) {
            Response::validationError('name is required');
            return;
        }
        
        $category = $body['category'] ?? 'custom';
        $includeItems = $body['include'] ?? [];
        
        // Build snapshot contents based on what to include
        $contents = [
            'version' => '1.0.0',
            'exported_at' => date('c'),
            'source_workspace_id' => $scope['workspace_id'],
        ];
        
        // Export pipelines
        if (in_array('pipelines', $includeItems) || $category === 'pipelines' || $category === 'full') {
            $pipelinesStmt = $pdo->prepare("SELECT * FROM pipelines WHERE workspace_id = ?");
            $pipelinesStmt->execute([$scope['workspace_id']]);
            $pipelines = $pipelinesStmt->fetchAll(PDO::FETCH_ASSOC);
            
            foreach ($pipelines as &$pipeline) {
                $stagesStmt = $pdo->prepare("SELECT * FROM pipeline_stages WHERE pipeline_id = ? ORDER BY sort_order");
                $stagesStmt->execute([$pipeline['id']]);
                $pipeline['stages'] = $stagesStmt->fetchAll(PDO::FETCH_ASSOC);
            }
            $contents['pipelines'] = $pipelines;
        }
        
        // Export automations
        if (in_array('automations', $includeItems) || $category === 'automations' || $category === 'full') {
            $autoStmt = $pdo->prepare("SELECT * FROM automation_workflows WHERE workspace_id = ?");
            $autoStmt->execute([$scope['workspace_id']]);
            $workflows = $autoStmt->fetchAll(PDO::FETCH_ASSOC);
            
            foreach ($workflows as &$workflow) {
                $actionsStmt = $pdo->prepare("SELECT * FROM automation_actions WHERE workflow_id = ? ORDER BY sort_order");
                $actionsStmt->execute([$workflow['id']]);
                $workflow['actions'] = $actionsStmt->fetchAll(PDO::FETCH_ASSOC);
            }
            $contents['automations'] = $workflows;
        }
        
        // Export forms (if table exists)
        if (in_array('forms', $includeItems) || $category === 'forms' || $category === 'full') {
            try {
                $formsStmt = $pdo->prepare("SELECT * FROM forms WHERE workspace_id = ?");
                $formsStmt->execute([$scope['workspace_id']]);
                $contents['forms'] = $formsStmt->fetchAll(PDO::FETCH_ASSOC);
            } catch (Exception $e) {
                $contents['forms'] = [];
            }
        }
        
        // Export email templates
        if (in_array('templates', $includeItems) || $category === 'templates' || $category === 'full') {
            try {
                $templatesStmt = $pdo->prepare("SELECT * FROM email_templates WHERE workspace_id = ?");
                $templatesStmt->execute([$scope['workspace_id']]);
                $contents['email_templates'] = $templatesStmt->fetchAll(PDO::FETCH_ASSOC);
            } catch (Exception $e) {
                $contents['email_templates'] = [];
            }
            
            try {
                $smsTemplatesStmt = $pdo->prepare("SELECT * FROM sms_templates WHERE workspace_id = ?");
                $smsTemplatesStmt->execute([$scope['workspace_id']]);
                $contents['sms_templates'] = $smsTemplatesStmt->fetchAll(PDO::FETCH_ASSOC);
            } catch (Exception $e) {
                $contents['sms_templates'] = [];
            }
        }
        
        // Calculate metadata
        $metadata = [
            'item_counts' => [
                'pipelines' => count($contents['pipelines'] ?? []),
                'automations' => count($contents['automations'] ?? []),
                'forms' => count($contents['forms'] ?? []),
                'email_templates' => count($contents['email_templates'] ?? []),
                'sms_templates' => count($contents['sms_templates'] ?? []),
            ]
        ];
        
        $stmt = $pdo->prepare("
            INSERT INTO snapshots 
            (workspace_id, company_id, name, description, version, category, is_template, is_public, contents, metadata, created_by, created_at)
            VALUES (?, ?, ?, ?, '1.0.0', ?, ?, ?, ?, ?, ?, NOW())
        ");
        $stmt->execute([
            $scope['workspace_id'],
            $scope['company_id'],
            $body['name'],
            $body['description'] ?? null,
            $category,
            !empty($body['is_template']) ? 1 : 0,
            !empty($body['is_public']) ? 1 : 0,
            json_encode($contents),
            json_encode($metadata),
            $userId
        ]);
        
        $snapshotId = (int)$pdo->lastInsertId();
        
        Response::json([
            'success' => true,
            'data' => ['id' => $snapshotId, 'metadata' => $metadata],
            'message' => 'Snapshot created'
        ], 201);
    }
    
    /**
     * Import snapshot
     * POST /snapshots/:id/import
     */
    public static function importSnapshot(int $id): void {
        $userId = Auth::userIdOrFail();
        $scope = self::getScope();
        $body = get_json_body();
        $pdo = Database::conn();
        
        // Get snapshot
        $stmt = $pdo->prepare("SELECT * FROM snapshots WHERE id = ?");
        $stmt->execute([$id]);
        $snapshot = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$snapshot) {
            Response::notFound('Snapshot not found');
            return;
        }
        
        // Check access
        if ($snapshot['workspace_id'] != $scope['workspace_id'] && !$snapshot['is_public']) {
            Response::error('Access denied', 403);
            return;
        }
        
        $contents = json_decode($snapshot['contents'], true);
        $importItems = $body['import'] ?? array_keys($contents);
        
        // Create import record
        $importStmt = $pdo->prepare("
            INSERT INTO snapshot_imports 
            (workspace_id, company_id, snapshot_id, source_type, source_name, status, imported_by, started_at, created_at)
            VALUES (?, ?, ?, 'internal', ?, 'processing', ?, NOW(), NOW())
        ");
        $importStmt->execute([
            $scope['workspace_id'],
            $scope['company_id'],
            $id,
            $snapshot['name'],
            $userId
        ]);
        $importId = (int)$pdo->lastInsertId();
        
        $itemsImported = [];
        
        $pdo->beginTransaction();
        try {
            // Import pipelines
            if (in_array('pipelines', $importItems) && !empty($contents['pipelines'])) {
                $pipelineCount = 0;
                foreach ($contents['pipelines'] as $pipeline) {
                    $pipelineStmt = $pdo->prepare("
                        INSERT INTO pipelines (workspace_id, company_id, name, description, is_default, created_at)
                        VALUES (?, ?, ?, ?, 0, NOW())
                    ");
                    $pipelineStmt->execute([
                        $scope['workspace_id'],
                        $scope['company_id'],
                        $pipeline['name'] . ' (Imported)',
                        $pipeline['description'] ?? null
                    ]);
                    $newPipelineId = (int)$pdo->lastInsertId();
                    
                    // Import stages
                    if (!empty($pipeline['stages'])) {
                        foreach ($pipeline['stages'] as $stage) {
                            $stageStmt = $pdo->prepare("
                                INSERT INTO pipeline_stages (pipeline_id, name, color, sort_order, is_won, is_lost, created_at)
                                VALUES (?, ?, ?, ?, ?, ?, NOW())
                            ");
                            $stageStmt->execute([
                                $newPipelineId,
                                $stage['name'],
                                $stage['color'] ?? '#6366f1',
                                $stage['sort_order'] ?? 0,
                                $stage['is_won'] ?? 0,
                                $stage['is_lost'] ?? 0
                            ]);
                        }
                    }
                    $pipelineCount++;
                }
                $itemsImported['pipelines'] = $pipelineCount;
            }
            
            // Import automations
            if (in_array('automations', $importItems) && !empty($contents['automations'])) {
                $autoCount = 0;
                foreach ($contents['automations'] as $workflow) {
                    $workflowStmt = $pdo->prepare("
                        INSERT INTO automation_workflows 
                        (workspace_id, company_id, name, description, trigger_type, trigger_config, is_active, created_at)
                        VALUES (?, ?, ?, ?, ?, ?, 0, NOW())
                    ");
                    $workflowStmt->execute([
                        $scope['workspace_id'],
                        $scope['company_id'],
                        $workflow['name'] . ' (Imported)',
                        $workflow['description'] ?? null,
                        $workflow['trigger_type'] ?? 'manual',
                        $workflow['trigger_config'] ?? '{}'
                    ]);
                    $newWorkflowId = (int)$pdo->lastInsertId();
                    
                    // Import actions
                    if (!empty($workflow['actions'])) {
                        foreach ($workflow['actions'] as $action) {
                            $actionStmt = $pdo->prepare("
                                INSERT INTO automation_actions 
                                (workflow_id, action_type, action_config, delay_minutes, sort_order, created_at)
                                VALUES (?, ?, ?, ?, ?, NOW())
                            ");
                            $actionStmt->execute([
                                $newWorkflowId,
                                $action['action_type'],
                                $action['action_config'] ?? '{}',
                                $action['delay_minutes'] ?? 0,
                                $action['sort_order'] ?? 0
                            ]);
                        }
                    }
                    $autoCount++;
                }
                $itemsImported['automations'] = $autoCount;
            }
            
            $pdo->commit();
            
            // Update import record
            $pdo->prepare("
                UPDATE snapshot_imports SET status = 'completed', items_imported = ?, completed_at = NOW()
                WHERE id = ?
            ")->execute([json_encode($itemsImported), $importId]);
            
            Response::json([
                'success' => true,
                'data' => ['import_id' => $importId, 'items_imported' => $itemsImported],
                'message' => 'Snapshot imported successfully'
            ]);
        } catch (Exception $e) {
            $pdo->rollBack();
            
            $pdo->prepare("
                UPDATE snapshot_imports SET status = 'failed', error_message = ?, completed_at = NOW()
                WHERE id = ?
            ")->execute([$e->getMessage(), $importId]);
            
            Response::error('Import failed: ' . $e->getMessage());
        }
    }
    
    /**
     * Delete snapshot
     * DELETE /snapshots/:id
     */
    public static function deleteSnapshot(int $id): void {
        $userId = Auth::userIdOrFail();
        $scope = self::getScope();
        $pdo = Database::conn();
        
        $stmt = $pdo->prepare("DELETE FROM snapshots WHERE id = ? AND workspace_id = ?");
        $stmt->execute([$id, $scope['workspace_id']]);
        
        if ($stmt->rowCount() === 0) {
            Response::notFound('Snapshot not found');
            return;
        }
        
        Response::json(['success' => true, 'message' => 'Snapshot deleted']);
    }
    
    /**
     * Download snapshot as JSON
     * GET /snapshots/:id/download
     */
    public static function downloadSnapshot(int $id): void {
        $userId = Auth::userIdOrFail();
        $scope = self::getScope();
        $pdo = Database::conn();
        
        $stmt = $pdo->prepare("SELECT * FROM snapshots WHERE id = ? AND workspace_id = ?");
        $stmt->execute([$id, $scope['workspace_id']]);
        $snapshot = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$snapshot) {
            Response::notFound('Snapshot not found');
            return;
        }
        
        $exportData = [
            'name' => $snapshot['name'],
            'description' => $snapshot['description'],
            'version' => $snapshot['version'],
            'category' => $snapshot['category'],
            'exported_at' => date('c'),
            'contents' => json_decode($snapshot['contents'], true),
            'metadata' => json_decode($snapshot['metadata'], true)
        ];
        
        header('Content-Type: application/json');
        header('Content-Disposition: attachment; filename="snapshot-' . $id . '.json"');
        echo json_encode($exportData, JSON_PRETTY_PRINT);
        exit;
    }
    
    /**
     * List import history
     * GET /snapshots/imports
     */
    public static function listImports(): void {
        $userId = Auth::userIdOrFail();
        $scope = self::getScope();
        $pdo = Database::conn();
        
        $sql = "SELECT si.*, s.name as snapshot_name, u.name as imported_by_name
                FROM snapshot_imports si
                LEFT JOIN snapshots s ON si.snapshot_id = s.id
                LEFT JOIN users u ON si.imported_by = u.id
                WHERE si.workspace_id = ?
                ORDER BY si.created_at DESC
                LIMIT 50";
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute([$scope['workspace_id']]);
        $imports = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        foreach ($imports as &$import) {
            $import['items_imported'] = $import['items_imported'] ? json_decode($import['items_imported'], true) : null;
        }
        
        Response::json([
            'success' => true,
            'data' => $imports
        ]);
    }
}
