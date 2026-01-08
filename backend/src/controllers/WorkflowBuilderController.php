<?php

namespace Xordon\Controllers;

use Xordon\Core\Database;
use Xordon\Core\Auth;
use Xordon\Core\Response;

class WorkflowBuilderController {
    
    public static function saveWorkflow() {
        $data = json_decode(file_get_contents('php://input'), true);
        $ctx = $GLOBALS['tenantContext'] ?? null;
        
        if (!$ctx || !isset($ctx->workspaceId)) {
            return Response::error('Unauthorized', 401);
        }
        
        $db = Database::conn();
        
        $workflowId = $data['workflow_id'] ?? null;
        $nodes = $data['nodes'] ?? [];
        $connections = $data['connections'] ?? [];
        
        if ($workflowId) {
            // Update existing workflow
            $stmt = $db->prepare("
                UPDATE workflows 
                SET canvas_data = ?, node_positions = ?, zoom_level = ?, updated_at = NOW()
                WHERE id = ? AND workspace_id = ?
            ");
            $stmt->execute([
                json_encode($data['canvas_data'] ?? null),
                json_encode($data['node_positions'] ?? null),
                $data['zoom_level'] ?? 1.0,
                $workflowId,
                $ctx->workspaceId
            ]);
            
            // Delete existing nodes and connections
            $stmt = $db->prepare("DELETE FROM workflow_nodes WHERE workflow_id = ?");
            $stmt->execute([$workflowId]);
            $stmt = $db->prepare("DELETE FROM workflow_connections WHERE workflow_id = ?");
            $stmt->execute([$workflowId]);
        } else {
            // Create new workflow
            $stmt = $db->prepare("
                INSERT INTO workflows 
                (workspace_id, company_id, name, description, canvas_data, node_positions, zoom_level, status)
                VALUES (?, ?, ?, ?, ?, ?, ?, 'draft')
            ");
            $stmt->execute([
                $ctx->workspaceId,
                $ctx->activeCompanyId ?? null,
                $data['name'] ?? 'Untitled Workflow',
                $data['description'] ?? null,
                json_encode($data['canvas_data'] ?? null),
                json_encode($data['node_positions'] ?? null),
                $data['zoom_level'] ?? 1.0
            ]);
            $workflowId = $db->lastInsertId();
        }
        
        // Save nodes
        foreach ($nodes as $node) {
            $stmt = $db->prepare("
                INSERT INTO workflow_nodes 
                (workflow_id, node_type, node_config, position_x, position_y)
                VALUES (?, ?, ?, ?, ?)
            ");
            $stmt->execute([
                $workflowId,
                $node['type'],
                json_encode($node['config'] ?? []),
                $node['position']['x'] ?? 0,
                $node['position']['y'] ?? 0
            ]);
            $node['db_id'] = $db->lastInsertId();
        }
        
        // Save connections
        foreach ($connections as $connection) {
            $sourceNode = array_filter($nodes, fn($n) => $n['id'] === $connection['source']);
            $targetNode = array_filter($nodes, fn($n) => $n['id'] === $connection['target']);
            
            if (!empty($sourceNode) && !empty($targetNode)) {
                $sourceNode = reset($sourceNode);
                $targetNode = reset($targetNode);
                
                $stmt = $db->prepare("
                    INSERT INTO workflow_connections 
                    (workflow_id, source_node_id, target_node_id, condition_type, condition_config)
                    VALUES (?, ?, ?, ?, ?)
                ");
                $stmt->execute([
                    $workflowId,
                    $sourceNode['db_id'],
                    $targetNode['db_id'],
                    $connection['condition_type'] ?? null,
                    json_encode($connection['condition_config'] ?? null)
                ]);
            }
        }
        
        return Response::success(['workflow_id' => $workflowId]);
    }
    
    public static function getWorkflow($id) {
        $ctx = $GLOBALS['tenantContext'] ?? null;
        if (!$ctx || !isset($ctx->workspaceId)) {
            return Response::error('Unauthorized', 401);
        }
        
        $db = Database::conn();
        
        $stmt = $db->prepare("SELECT * FROM workflows WHERE id = ? AND workspace_id = ?");
        $stmt->execute([$id, $ctx->workspaceId]);
        $workflow = $stmt->fetch(\PDO::FETCH_ASSOC);
        
        if (!$workflow) {
            return Response::error('Workflow not found', 404);
        }
        
        // Get nodes
        $stmt = $db->prepare("SELECT * FROM workflow_nodes WHERE workflow_id = ?");
        $stmt->execute([$id]);
        $nodes = $stmt->fetchAll(\PDO::FETCH_ASSOC);
        
        // Get connections
        $stmt = $db->prepare("SELECT * FROM workflow_connections WHERE workflow_id = ?");
        $stmt->execute([$id]);
        $connections = $stmt->fetchAll(\PDO::FETCH_ASSOC);
        
        $workflow['nodes'] = array_map(function($node) {
            $node['config'] = json_decode($node['node_config'], true);
            return $node;
        }, $nodes);
        
        $workflow['connections'] = array_map(function($conn) {
            $conn['condition_config'] = json_decode($conn['condition_config'], true);
            return $conn;
        }, $connections);
        
        $workflow['canvas_data'] = json_decode($workflow['canvas_data'], true);
        $workflow['node_positions'] = json_decode($workflow['node_positions'], true);
        
        return Response::success($workflow);
    }
    
    public static function listTemplates() {
        $ctx = $GLOBALS['tenantContext'] ?? null;
        if (!$ctx || !isset($ctx->workspaceId)) {
            return Response::error('Unauthorized', 401);
        }
        
        $db = Database::conn();
        
        $stmt = $db->prepare("
            SELECT * FROM workflows 
            WHERE (workspace_id = ? OR is_template = 1) AND status = 'active'
            ORDER BY is_template DESC, name ASC
        ");
        $stmt->execute([$ctx->workspaceId]);
        $templates = $stmt->fetchAll(\PDO::FETCH_ASSOC);
        
        return Response::success($templates);
    }
}
