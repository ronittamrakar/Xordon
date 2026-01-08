<?php

require_once __DIR__ . '/../Database.php';
require_once __DIR__ . '/../Auth.php';
require_once __DIR__ . '/../Response.php';

class CallAgentsController {

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

    public static function getAgents(): void {
        Auth::userIdOrFail();
        try {
            $pdo = Database::conn();
            $scope = self::getWorkspaceScope();
            
            $stmt = $pdo->prepare("
                SELECT 
                    id,
                    name,
                    email,
                    phone,
                    extension,
                    status,
                    max_concurrent_calls,
                    skills,
                    notes,
                    created_at,
                    updated_at
                FROM call_agents 
                WHERE {$scope['col']} = ? 
                ORDER BY name ASC
            ");
            $stmt->execute([$scope['val']]);
            $agents = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Parse JSON fields
            foreach ($agents as &$agent) {
                $agent['skills'] = !empty($agent['skills']) ? json_decode($agent['skills'], true) : [];
            }
            
            Response::json($agents);
        } catch (Exception $e) {
            Response::error('Failed to fetch agents: ' . $e->getMessage(), 500);
        }
    }

    public static function getAgent(string $id): void {
        Auth::userIdOrFail();
        try {
            $pdo = Database::conn();
            $scope = self::getWorkspaceScope();
            
            $stmt = $pdo->prepare("
                SELECT * FROM call_agents 
                WHERE id = ? AND {$scope['col']} = ?
            ");
            $stmt->execute([$id, $scope['val']]);
            $agent = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$agent) {
                Response::error('Agent not found', 404);
                return;
            }
            
            // Parse JSON fields
            $agent['skills'] = !empty($agent['skills']) ? json_decode($agent['skills'], true) : [];
            
            Response::json($agent);
        } catch (Exception $e) {
            Response::error('Failed to fetch agent: ' . $e->getMessage(), 500);
        }
    }

    public static function createAgent(): void {
        Auth::userIdOrFail();
        try {
            $b = get_json_body();
            
            if (empty($b['name'])) {
                Response::validationError('Agent name is required');
                return;
            }
            
            $pdo = Database::conn();
            $userId = Auth::userId();
            $workspaceId = self::getWorkspaceId();
            
            $skills = isset($b['skills']) ? json_encode($b['skills']) : json_encode([]);
            
            $stmt = $pdo->prepare('
                INSERT INTO call_agents 
                (user_id, workspace_id, name, email, phone, extension, status, max_concurrent_calls, skills, notes, created_at, updated_at) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            ');
            
            $stmt->execute([
                $userId,
                $workspaceId,
                $b['name'],
                $b['email'] ?? null,
                $b['phone'] ?? null,
                $b['extension'] ?? null,
                $b['status'] ?? 'active',
                $b['max_concurrent_calls'] ?? 1,
                $skills,
                $b['notes'] ?? null
            ]);
            
            $agentId = $pdo->lastInsertId();
            
            // Fetch the created agent
            $stmt = $pdo->prepare('SELECT * FROM call_agents WHERE id = ?');
            $stmt->execute([$agentId]);
            $agent = $stmt->fetch(PDO::FETCH_ASSOC);
            
            // Parse JSON fields
            $agent['skills'] = json_decode($agent['skills'], true);
            
            Response::json($agent, 201);
        } catch (Exception $e) {
            Response::error('Failed to create agent: ' . $e->getMessage(), 500);
        }
    }

    public static function updateAgent(string $id): void {
        Auth::userIdOrFail();
        try {
            $pdo = Database::conn();
            $scope = self::getWorkspaceScope();
            $b = get_json_body();
            
            // Verify agent exists and belongs to workspace
            $stmt = $pdo->prepare("SELECT id FROM call_agents WHERE id = ? AND {$scope['col']} = ?");
            $stmt->execute([$id, $scope['val']]);
            if (!$stmt->fetch()) {
                Response::error('Agent not found or access denied', 404);
                return;
            }
            
            $updates = [];
            $params = [];
            
            $fields = ['name', 'email', 'phone', 'extension', 'status', 'max_concurrent_calls', 'notes'];
            foreach ($fields as $field) {
                if (isset($b[$field])) {
                    $updates[] = "$field = ?";
                    $params[] = $b[$field];
                }
            }
            
            // Handle JSON fields
            if (isset($b['skills'])) {
                $updates[] = "skills = ?";
                $params[] = json_encode($b['skills']);
            }
            
            if (empty($updates)) {
                Response::error('No fields to update', 400);
                return;
            }
            
            $params[] = $id;
            $params[] = $userId;
            
            $stmt = $pdo->prepare('
                UPDATE call_agents 
                SET ' . implode(', ', $updates) . ', updated_at = CURRENT_TIMESTAMP 
                WHERE id = ? AND user_id = ?
            ');
            $stmt->execute($params);
            
            // Fetch updated agent
            $stmt = $pdo->prepare('SELECT * FROM call_agents WHERE id = ?');
            $stmt->execute([$id]);
            $agent = $stmt->fetch(PDO::FETCH_ASSOC);
            
            // Parse JSON fields
            $agent['skills'] = json_decode($agent['skills'], true);
            
            Response::json($agent);
        } catch (Exception $e) {
            Response::error('Failed to update agent: ' . $e->getMessage(), 500);
        }
    }

    public static function deleteAgent(string $id): void {
        Auth::userIdOrFail();
        try {
            $pdo = Database::conn();
            $userId = Auth::userId();
            
            // Verify agent exists and belongs to user
            $stmt = $pdo->prepare('SELECT id FROM call_agents WHERE id = ? AND user_id = ?');
            $stmt->execute([$id, $userId]);
            if (!$stmt->fetch()) {
                Response::error('Agent not found or access denied', 404);
                return;
            }
            
            $stmt = $pdo->prepare('DELETE FROM call_agents WHERE id = ? AND user_id = ?');
            $stmt->execute([$id, $userId]);
            
            Response::json(['message' => 'Agent deleted successfully']);
        } catch (Exception $e) {
            Response::error('Failed to delete agent: ' . $e->getMessage(), 500);
        }
    }

    public static function getAgentStats(string $id): void {
        Auth::userIdOrFail();
        try {
            $pdo = Database::conn();
            $userId = Auth::userId();
            
            // Verify agent exists and belongs to user
            $stmt = $pdo->prepare('SELECT id FROM call_agents WHERE id = ? AND user_id = ?');
            $stmt->execute([$id, $userId]);
            if (!$stmt->fetch()) {
                Response::error('Agent not found or access denied', 404);
                return;
            }
            
            // Get call statistics
            $stmt = $pdo->prepare('
                SELECT 
                    COUNT(*) as total_calls,
                    SUM(CASE WHEN status = "completed" THEN 1 ELSE 0 END) as completed_calls,
                    SUM(CASE WHEN status = "failed" THEN 1 ELSE 0 END) as failed_calls,
                    AVG(CASE WHEN duration > 0 THEN duration ELSE NULL END) as avg_duration
                FROM call_logs 
                WHERE agent_id = ? AND user_id = ?
            ');
            $stmt->execute([$id, $userId]);
            $stats = $stmt->fetch(PDO::FETCH_ASSOC);
            
            // Get campaigns assigned
            $stmt = $pdo->prepare('
                SELECT COUNT(*) as assigned_campaigns
                FROM call_campaigns 
                WHERE agent_id = ? AND user_id = ?
            ');
            $stmt->execute([$id, $userId]);
            $campaignStats = $stmt->fetch(PDO::FETCH_ASSOC);
            
            Response::json([
                'total_calls' => (int)$stats['total_calls'],
                'completed_calls' => (int)$stats['completed_calls'],
                'failed_calls' => (int)$stats['failed_calls'],
                'avg_duration' => $stats['avg_duration'] ? round($stats['avg_duration'], 2) : 0,
                'assigned_campaigns' => (int)$campaignStats['assigned_campaigns']
            ]);
        } catch (Exception $e) {
            Response::error('Failed to fetch agent stats: ' . $e->getMessage(), 500);
        }
    }
}
