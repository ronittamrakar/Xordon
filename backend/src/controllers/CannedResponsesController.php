<?php

/**
 * Canned Responses Controller
 * Manages quick replies, macros, and templates for agents
 */

use Xordon\Database;
use Xordon\Response;
use Xordon\Auth;
use PDO;

class CannedResponsesController {
    
    /**
     * List canned responses
     * GET /api/canned-responses
     */
    public function list() {
        $db = getDBConnection();
        $user = requireAuth();
        $workspaceId = $user['workspace_id'];
        
        $category = $_GET['category'] ?? null;
        $search = $_GET['search'] ?? null;
        
        $where = ['workspace_id = ?'];
        $params = [$workspaceId];
        
        if ($category) {
            $where[] = 'category = ?';
            $params[] = $category;
        }
        
        if ($search) {
            $where[] = '(name LIKE ? OR shortcut LIKE ? OR body LIKE ?)';
            $searchTerm = '%' . $search . '%';
            $params[] = $searchTerm;
            $params[] = $searchTerm;
            $params[] = $searchTerm;
        }
        
        $whereClause = implode(' AND ', $where);
        
        $stmt = $db->prepare("
            SELECT cr.*, u.name as creator_name
            FROM ticket_canned_responses cr
            LEFT JOIN users u ON cr.created_by = u.id
            WHERE $whereClause
            ORDER BY category, name
        ");
        $stmt->execute($params);
        $responses = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        foreach ($responses as &$response) {
            $response['actions'] = $response['actions'] ? json_decode($response['actions'], true) : [];
        }
        
        jsonResponse($responses);
    }
    
    /**
     * Get single canned response
     * GET /api/canned-responses/:id
     */
    public function get($id) {
        $db = getDBConnection();
        $user = requireAuth();
        $workspaceId = $user['workspace_id'];
        
        $stmt = $db->prepare("SELECT * FROM ticket_canned_responses WHERE id = ? AND workspace_id = ?");
        $stmt->execute([$id, $workspaceId]);
        $response = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$response) {
            http_response_code(404);
            jsonResponse(['error' => 'Canned response not found']);
            return;
        }
        
        $response['actions'] = $response['actions'] ? json_decode($response['actions'], true) : [];
        
        jsonResponse($response);
    }
    
    /**
     * Create canned response
     * POST /api/canned-responses
     */
    public function create() {
        $db = getDBConnection();
        $user = requireAuth();
        $workspaceId = $user['workspace_id'];
        
        $data = json_decode(file_get_contents('php://input'), true);
        
        $stmt = $db->prepare("
            INSERT INTO ticket_canned_responses (
                workspace_id, name, shortcut, subject, body, body_html,
                category, actions, is_shared, created_by
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");
        
        $stmt->execute([
            $workspaceId,
            $data['name'],
            $data['shortcut'] ?? null,
            $data['subject'] ?? null,
            $data['body'],
            $data['body_html'] ?? null,
            $data['category'] ?? 'general',
            isset($data['actions']) ? json_encode($data['actions']) : null,
            $data['is_shared'] ?? true,
            $user['id']
        ]);
        
        jsonResponse(['id' => $db->lastInsertId()], 201);
    }
    
    /**
     * Update canned response
     * PUT /api/canned-responses/:id
     */
    public function update($id) {
        $db = getDBConnection();
        $user = requireAuth();
        $workspaceId = $user['workspace_id'];
        
        $data = json_decode(file_get_contents('php://input'), true);
        
        $fields = [];
        $params = [];
        
        $allowedFields = ['name', 'shortcut', 'subject', 'body', 'body_html', 'category', 'is_shared'];
        
        foreach ($allowedFields as $field) {
            if (isset($data[$field])) {
                $fields[] = "$field = ?";
                $params[] = $data[$field];
            }
        }
        
        if (isset($data['actions'])) {
            $fields[] = "actions = ?";
            $params[] = json_encode($data['actions']);
        }
        
        if (empty($fields)) {
            jsonResponse(['message' => 'No changes']);
            return;
        }
        
        $fields[] = "updated_at = NOW()";
        $params[] = $id;
        $params[] = $workspaceId;
        
        $sql = "UPDATE ticket_canned_responses SET " . implode(', ', $fields) . " WHERE id = ? AND workspace_id = ?";
        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        
        jsonResponse(['message' => 'Canned response updated']);
    }
    
    /**
     * Delete canned response
     * DELETE /api/canned-responses/:id
     */
    public function delete($id) {
        $db = getDBConnection();
        $user = requireAuth();
        $workspaceId = $user['workspace_id'];
        
        $stmt = $db->prepare("DELETE FROM ticket_canned_responses WHERE id = ? AND workspace_id = ?");
        $stmt->execute([$id, $workspaceId]);
        
        jsonResponse(['message' => 'Canned response deleted']);
    }
}
