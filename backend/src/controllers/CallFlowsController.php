<?php
/**
 * CallFlowsController - Manages visual IVR call flows
 */

require_once __DIR__ . '/../Database.php';
require_once __DIR__ . '/../Auth.php';
require_once __DIR__ . '/../Response.php';

class CallFlowsController {

    private static function getWorkspaceScope(): array {
        $ctx = $GLOBALS['tenantContext'] ?? null;
        if ($ctx && isset($ctx->workspaceId)) {
            return ['col' => 'workspace_id', 'val' => (int)$ctx->workspaceId];
        }
        return ['col' => 'user_id', 'val' => Auth::userIdOrFail()];
    }
    
    private static function getWorkspaceId(): ?int {
        $ctx = $GLOBALS['tenantContext'] ?? null;
        return ($ctx && isset($ctx->workspaceId)) ? (int)$ctx->workspaceId : null;
    }

    /**
     * GET /api/call-flows - List all call flows
     */
    public static function getFlows(): void {
        Auth::userIdOrFail();
        try {
            $pdo = Database::conn();
            $scope = self::getWorkspaceScope();
            
            $stmt = $pdo->prepare("
                SELECT 
                    cf.id,
                    cf.name,
                    cf.description,
                    cf.phone_number_id,
                    cf.status,
                    cf.nodes,
                    cf.edges,
                    cf.created_at,
                    cf.updated_at,
                    pn.phone_number,
                    (SELECT COUNT(*) FROM phone_call_logs WHERE call_flow_id = cf.id) as call_count,
                    (SELECT COUNT(*) FROM phone_numbers WHERE call_flow_id = cf.id) as assigned_numbers_count,
                    (SELECT GROUP_CONCAT(phone_number SEPARATOR \', \') FROM phone_numbers WHERE call_flow_id = cf.id) as assigned_numbers
                FROM call_flows cf
                LEFT JOIN phone_numbers pn ON cf.phone_number_id = pn.id
                WHERE cf.{$scope['col']} = ?
                ORDER BY cf.updated_at DESC
            ");
            $stmt->execute([$scope['val']]);
            $flows = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            foreach ($flows as &$flow) {
                $flow['nodes'] = $flow['nodes'] ? json_decode($flow['nodes'], true) : [];
                $flow['edges'] = $flow['edges'] ? json_decode($flow['edges'], true) : [];
            }
            
            Response::json(['items' => $flows]);
        } catch (Exception $e) {
            Response::error('Failed to fetch call flows: ' . $e->getMessage(), 500);
        }
    }

    /**
     * GET /api/call-flows/{id} - Get a single call flow
     */
    public static function getFlow(string $id): void {
        Auth::userIdOrFail();
        try {
            $pdo = Database::conn();
            $scope = self::getWorkspaceScope();
            
            $stmt = $pdo->prepare("
                SELECT * FROM call_flows 
                WHERE id = ? AND {$scope['col']} = ?
            ");
            $stmt->execute([$id, $scope['val']]);
            $flow = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$flow) {
                Response::error('Call flow not found', 404);
                return;
            }
            
            $flow['nodes'] = $flow['nodes'] ? json_decode($flow['nodes'], true) : [];
            $flow['edges'] = $flow['edges'] ? json_decode($flow['edges'], true) : [];
            
            Response::json($flow);
        } catch (Exception $e) {
            Response::error('Failed to fetch call flow: ' . $e->getMessage(), 500);
        }
    }

    /**
     * POST /api/call-flows - Create a new call flow
     */
    public static function createFlow(): void {
        Auth::userIdOrFail();
        try {
            $b = get_json_body();
            
            if (empty($b['name'])) {
                Response::validationError('Flow name is required');
                return;
            }
            
            $pdo = Database::conn();
            $userId = Auth::userId();
            $workspaceId = self::getWorkspaceId();
            
            $stmt = $pdo->prepare('
                INSERT INTO call_flows 
                (user_id, workspace_id, name, description, phone_number_id, status, nodes, edges, created_at, updated_at) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
            ');
            
            $stmt->execute([
                $userId,
                $workspaceId,
                $b['name'],
                $b['description'] ?? null,
                $b['phone_number_id'] ?? null,
                $b['status'] ?? 'draft',
                json_encode($b['nodes'] ?? []),
                json_encode($b['edges'] ?? [])
            ]);
            
            $flowId = $pdo->lastInsertId();
            
            // Return the created flow
            $stmt = $pdo->prepare('SELECT * FROM call_flows WHERE id = ?');
            $stmt->execute([$flowId]);
            $flow = $stmt->fetch(PDO::FETCH_ASSOC);
            
            $flow['nodes'] = json_decode($flow['nodes'], true);
            $flow['edges'] = json_decode($flow['edges'], true);
            
            Response::json($flow, 201);
        } catch (Exception $e) {
            Response::error('Failed to create call flow: ' . $e->getMessage(), 500);
        }
    }

    /**
     * PUT /api/call-flows/{id} - Update a call flow
     */
    public static function updateFlow(string $id): void {
        Auth::userIdOrFail();
        try {
            $pdo = Database::conn();
            $scope = self::getWorkspaceScope();
            $b = get_json_body();
            
            // Verify flow exists and belongs to user/workspace
            $stmt = $pdo->prepare("SELECT id FROM call_flows WHERE id = ? AND {$scope['col']} = ?");
            $stmt->execute([$id, $scope['val']]);
            if (!$stmt->fetch()) {
                Response::error('Call flow not found or access denied', 404);
                return;
            }
            
            $updates = [];
            $params = [];
            
            $fields = ['name', 'description', 'phone_number_id', 'status'];
            foreach ($fields as $field) {
                if (isset($b[$field])) {
                    $updates[] = "$field = ?";
                    $params[] = $b[$field];
                }
            }
            
            // Handle JSON fields
            if (isset($b['nodes'])) {
                $updates[] = "nodes = ?";
                $params[] = json_encode($b['nodes']);
            }
            if (isset($b['edges'])) {
                $updates[] = "edges = ?";
                $params[] = json_encode($b['edges']);
            }
            
            if (empty($updates)) {
                Response::error('No fields to update', 400);
                return;
            }
            
            $updates[] = "updated_at = NOW()";
            $params[] = $id;
            
            $stmt = $pdo->prepare('
                UPDATE call_flows 
                SET ' . implode(', ', $updates) . ' 
                WHERE id = ?
            ');
            $stmt->execute($params);
            
            // Return updated flow
            $stmt = $pdo->prepare('SELECT * FROM call_flows WHERE id = ?');
            $stmt->execute([$id]);
            $flow = $stmt->fetch(PDO::FETCH_ASSOC);
            
            $flow['nodes'] = json_decode($flow['nodes'], true);
            $flow['edges'] = json_decode($flow['edges'], true);
            
            Response::json($flow);
        } catch (Exception $e) {
            Response::error('Failed to update call flow: ' . $e->getMessage(), 500);
        }
    }

    /**
     * DELETE /api/call-flows/{id} - Delete a call flow
     */
    public static function deleteFlow(string $id): void {
        Auth::userIdOrFail();
        try {
            $pdo = Database::conn();
            $scope = self::getWorkspaceScope();
            
            // Verify flow exists and belongs to user/workspace
            $stmt = $pdo->prepare("SELECT id FROM call_flows WHERE id = ? AND {$scope['col']} = ?");
            $stmt->execute([$id, $scope['val']]);
            if (!$stmt->fetch()) {
                Response::error('Call flow not found or access denied', 404);
                return;
            }
            
            $stmt = $pdo->prepare("DELETE FROM call_flows WHERE id = ?");
            $stmt->execute([$id]);
            
            Response::json(['message' => 'Call flow deleted successfully']);
        } catch (Exception $e) {
            Response::error('Failed to delete call flow: ' . $e->getMessage(), 500);
        }
    }

    /**
     * POST /api/call-flows/{id}/duplicate - Duplicate a call flow
     */
    public static function duplicateFlow(string $id): void {
        Auth::userIdOrFail();
        try {
            $pdo = Database::conn();
            $scope = self::getWorkspaceScope();
            $userId = Auth::userId();
            $workspaceId = self::getWorkspaceId();
            
            // Get original flow
            $stmt = $pdo->prepare("SELECT * FROM call_flows WHERE id = ? AND {$scope['col']} = ?");
            $stmt->execute([$id, $scope['val']]);
            $original = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$original) {
                Response::error('Call flow not found or access denied', 404);
                return;
            }
            
            // Create duplicate
            $stmt = $pdo->prepare('
                INSERT INTO call_flows 
                (user_id, workspace_id, name, description, status, nodes, edges, created_at, updated_at) 
                VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
            ');
            
            $stmt->execute([
                $userId,
                $workspaceId,
                $original['name'] . ' (Copy)',
                $original['description'],
                'draft',
                $original['nodes'],
                $original['edges']
            ]);
            
            $newId = $pdo->lastInsertId();
            
            // Return the new flow
            $stmt = $pdo->prepare('SELECT * FROM call_flows WHERE id = ?');
            $stmt->execute([$newId]);
            $flow = $stmt->fetch(PDO::FETCH_ASSOC);
            
            $flow['nodes'] = json_decode($flow['nodes'], true);
            $flow['edges'] = json_decode($flow['edges'], true);
            
            Response::json($flow, 201);
        } catch (Exception $e) {
            Response::error('Failed to duplicate call flow: ' . $e->getMessage(), 500);
        }
    }
}
