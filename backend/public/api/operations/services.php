<?php
/**
 * Operations Services Handler
 * 
 * Handles CRUD operations for services catalog.
 */

function handleOperationsServices($opsDb, $method, $userId, $workspaceId, $id) {
    if ($method === 'GET') {
        if ($id) {
            $stmt = $opsDb->prepare("SELECT * FROM fsm_services WHERE id = ? AND workspace_id = ?");
            $stmt->execute([$id, $workspaceId]);
            $service = $stmt->fetch(PDO::FETCH_ASSOC);
            echo json_encode($service ?: ['error' => 'Not found']);
            return;
        }
        
        // List services
        $categoryId = $_GET['category_id'] ?? null;
        $isActive = $_GET['is_active'] ?? null;
        
        $sql = "SELECT s.*, c.name as category_name FROM fsm_services s LEFT JOIN fsm_service_categories c ON s.category_id = c.id WHERE s.workspace_id = ?";
        $params = [$workspaceId];
        
        if ($categoryId) {
            $sql .= " AND s.category_id = ?";
            $params[] = $categoryId;
        }
        if ($isActive !== null) {
            $sql .= " AND s.is_active = ?";
            $params[] = $isActive;
        }
        
        $sql .= " ORDER BY s.sort_order ASC, s.name ASC";
        
        $stmt = $opsDb->prepare($sql);
        $stmt->execute($params);
        echo json_encode(['items' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
        
    } elseif ($method === 'POST') {
        $data = json_decode(file_get_contents('php://input'), true);
        
        $stmt = $opsDb->prepare("
            INSERT INTO fsm_services (workspace_id, user_id, category_id, name, description, price, duration_minutes, is_active, sort_order, metadata)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");
        
        $stmt->execute([
            $workspaceId,
            $userId,
            $data['category_id'] ?? null,
            $data['name'],
            $data['description'] ?? null,
            $data['price'] ?? 0,
            $data['duration_minutes'] ?? 60,
            $data['is_active'] ?? 1,
            $data['sort_order'] ?? 0,
            json_encode($data['metadata'] ?? [])
        ]);
        
        echo json_encode(['success' => true, 'id' => $opsDb->lastInsertId()]);
        
    } elseif ($method === 'PUT' && $id) {
        $data = json_decode(file_get_contents('php://input'), true);
        
        $fields = [];
        $params = [];
        
        $allowedFields = ['category_id', 'name', 'description', 'price', 'duration_minutes', 'is_active', 'sort_order'];
        
        foreach ($allowedFields as $field) {
            if (isset($data[$field])) {
                $fields[] = "$field = ?";
                $params[] = $data[$field];
            }
        }
        
        if (isset($data['metadata'])) {
            $fields[] = "metadata = ?";
            $params[] = json_encode($data['metadata']);
        }
        
        if (!empty($fields)) {
            $params[] = $id;
            $params[] = $workspaceId;
            $stmt = $opsDb->prepare("UPDATE fsm_services SET " . implode(', ', $fields) . " WHERE id = ? AND workspace_id = ?");
            $stmt->execute($params);
        }
        
        echo json_encode(['success' => true]);
        
    } elseif ($method === 'DELETE' && $id) {
        $stmt = $opsDb->prepare("DELETE FROM fsm_services WHERE id = ? AND workspace_id = ?");
        $stmt->execute([$id, $workspaceId]);
        echo json_encode(['success' => true]);
        
    } else {
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
    }
}

function handleOperationsServiceCategories($opsDb, $method, $userId, $workspaceId, $id) {
    if ($method === 'GET') {
        if ($id) {
            $stmt = $opsDb->prepare("SELECT * FROM fsm_service_categories WHERE id = ? AND workspace_id = ?");
            $stmt->execute([$id, $workspaceId]);
            echo json_encode($stmt->fetch(PDO::FETCH_ASSOC) ?: ['error' => 'Not found']);
            return;
        }
        
        $stmt = $opsDb->prepare("SELECT * FROM fsm_service_categories WHERE workspace_id = ? ORDER BY sort_order ASC, name ASC");
        $stmt->execute([$workspaceId]);
        echo json_encode(['items' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
        
    } elseif ($method === 'POST') {
        $data = json_decode(file_get_contents('php://input'), true);
        
        $stmt = $opsDb->prepare("
            INSERT INTO fsm_service_categories (workspace_id, user_id, name, description, color, sort_order)
            VALUES (?, ?, ?, ?, ?, ?)
        ");
        
        $stmt->execute([
            $workspaceId,
            $userId,
            $data['name'],
            $data['description'] ?? null,
            $data['color'] ?? '#3B82F6',
            $data['sort_order'] ?? 0
        ]);
        
        echo json_encode(['success' => true, 'id' => $opsDb->lastInsertId()]);
        
    } elseif ($method === 'PUT' && $id) {
        $data = json_decode(file_get_contents('php://input'), true);
        
        $fields = [];
        $params = [];
        
        foreach (['name', 'description', 'color', 'sort_order'] as $field) {
            if (isset($data[$field])) {
                $fields[] = "$field = ?";
                $params[] = $data[$field];
            }
        }
        
        if (!empty($fields)) {
            $params[] = $id;
            $params[] = $workspaceId;
            $stmt = $opsDb->prepare("UPDATE fsm_service_categories SET " . implode(', ', $fields) . " WHERE id = ? AND workspace_id = ?");
            $stmt->execute($params);
        }
        
        echo json_encode(['success' => true]);
        
    } elseif ($method === 'DELETE' && $id) {
        $stmt = $opsDb->prepare("DELETE FROM fsm_service_categories WHERE id = ? AND workspace_id = ?");
        $stmt->execute([$id, $workspaceId]);
        echo json_encode(['success' => true]);
        
    } else {
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
    }
}
