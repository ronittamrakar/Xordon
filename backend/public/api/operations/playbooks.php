<?php
/**
 * Operations Playbooks Handler
 * 
 * Handles CRUD operations for sales/service playbooks.
 */

function handleOperationsPlaybooks($opsDb, $method, $userId, $workspaceId, $id) {
    if ($method === 'GET') {
        if ($id) {
            $stmt = $opsDb->prepare("SELECT * FROM fsm_playbooks WHERE id = ? AND workspace_id = ?");
            $stmt->execute([$id, $workspaceId]);
            $playbook = $stmt->fetch(PDO::FETCH_ASSOC);
            if ($playbook) {
                $playbook['content'] = json_decode($playbook['content'] ?? '{}', true);
            }
            echo json_encode($playbook ?: ['error' => 'Not found']);
            return;
        }
        
        $category = $_GET['category'] ?? null;
        $isActive = $_GET['is_active'] ?? null;
        
        $sql = "SELECT * FROM fsm_playbooks WHERE workspace_id = ?";
        $params = [$workspaceId];
        
        if ($category) {
            $sql .= " AND category = ?";
            $params[] = $category;
        }
        if ($isActive !== null) {
            $sql .= " AND is_active = ?";
            $params[] = $isActive;
        }
        
        $sql .= " ORDER BY name ASC";
        
        $stmt = $opsDb->prepare($sql);
        $stmt->execute($params);
        $playbooks = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        foreach ($playbooks as &$p) {
            $p['content'] = json_decode($p['content'] ?? '{}', true);
        }
        
        echo json_encode(['items' => $playbooks]);
        
    } elseif ($method === 'POST') {
        $data = json_decode(file_get_contents('php://input'), true);
        
        $stmt = $opsDb->prepare("
            INSERT INTO fsm_playbooks (workspace_id, user_id, name, description, category, content, is_active)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ");
        
        $stmt->execute([
            $workspaceId,
            $userId,
            $data['name'],
            $data['description'] ?? null,
            $data['category'] ?? null,
            json_encode($data['content'] ?? []),
            $data['is_active'] ?? 1
        ]);
        
        echo json_encode(['success' => true, 'id' => $opsDb->lastInsertId()]);
        
    } elseif ($method === 'PUT' && $id) {
        $data = json_decode(file_get_contents('php://input'), true);
        
        $fields = [];
        $params = [];
        
        foreach (['name', 'description', 'category', 'is_active'] as $field) {
            if (isset($data[$field])) {
                $fields[] = "$field = ?";
                $params[] = $data[$field];
            }
        }
        
        if (isset($data['content'])) {
            $fields[] = "content = ?";
            $params[] = json_encode($data['content']);
        }
        
        if (!empty($fields)) {
            $params[] = $id;
            $params[] = $workspaceId;
            $stmt = $opsDb->prepare("UPDATE fsm_playbooks SET " . implode(', ', $fields) . " WHERE id = ? AND workspace_id = ?");
            $stmt->execute($params);
        }
        
        echo json_encode(['success' => true]);
        
    } elseif ($method === 'DELETE' && $id) {
        $stmt = $opsDb->prepare("DELETE FROM fsm_playbooks WHERE id = ? AND workspace_id = ?");
        $stmt->execute([$id, $workspaceId]);
        echo json_encode(['success' => true]);
        
    } else {
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
    }
}
