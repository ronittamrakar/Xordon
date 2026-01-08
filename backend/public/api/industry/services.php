<?php
/**
 * Services & Categories Handlers
 */

function handleServices($db, $method, $userId, $id) {
    if ($method === 'GET') {
        if ($id) {
            $stmt = $db->prepare("SELECT * FROM services WHERE id = ? AND user_id = ?");
            $stmt->execute([$id, $userId]);
            echo json_encode($stmt->fetch(PDO::FETCH_ASSOC) ?: ['error' => 'Not found']);
        } else {
            $categoryId = $_GET['category_id'] ?? null;
            $sql = "SELECT s.*, sc.name as category_name FROM services s 
                    LEFT JOIN service_categories sc ON s.category_id = sc.id 
                    WHERE s.user_id = ?";
            $params = [$userId];
            
            if ($categoryId) {
                $sql .= " AND s.category_id = ?";
                $params[] = $categoryId;
            }
            
            $sql .= " ORDER BY sc.sort_order, s.name";
            $stmt = $db->prepare($sql);
            $stmt->execute($params);
            echo json_encode(['items' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
        }
    } elseif ($method === 'POST') {
        $data = json_decode(file_get_contents('php://input'), true);
        
        $stmt = $db->prepare("
            INSERT INTO services (user_id, category_id, name, description, duration_minutes, price, price_type, deposit_required, deposit_amount, deposit_percentage, buffer_before, buffer_after, max_bookings_per_day, requires_confirmation, intake_form_id, is_active)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");
        
        $stmt->execute([
            $userId,
            $data['category_id'] ?? null,
            $data['name'],
            $data['description'] ?? null,
            $data['duration_minutes'] ?? 60,
            $data['price'] ?? null,
            $data['price_type'] ?? 'fixed',
            $data['deposit_required'] ?? false,
            $data['deposit_amount'] ?? null,
            $data['deposit_percentage'] ?? null,
            $data['buffer_before'] ?? 0,
            $data['buffer_after'] ?? 0,
            $data['max_bookings_per_day'] ?? null,
            $data['requires_confirmation'] ?? false,
            $data['intake_form_id'] ?? null,
            $data['is_active'] ?? true
        ]);
        
        echo json_encode(['success' => true, 'id' => $db->lastInsertId()]);
    } elseif ($method === 'PUT' && $id) {
        $data = json_decode(file_get_contents('php://input'), true);
        
        $fields = [];
        $params = [];
        
        foreach (['category_id', 'name', 'description', 'duration_minutes', 'price', 'price_type', 'deposit_required', 'deposit_amount', 'deposit_percentage', 'buffer_before', 'buffer_after', 'max_bookings_per_day', 'requires_confirmation', 'intake_form_id', 'is_active'] as $field) {
            if (isset($data[$field])) {
                $fields[] = "$field = ?";
                $params[] = $data[$field];
            }
        }
        
        if (!empty($fields)) {
            $params[] = $id;
            $params[] = $userId;
            $stmt = $db->prepare("UPDATE services SET " . implode(', ', $fields) . " WHERE id = ? AND user_id = ?");
            $stmt->execute($params);
        }
        
        echo json_encode(['success' => true]);
    } elseif ($method === 'DELETE' && $id) {
        $stmt = $db->prepare("DELETE FROM services WHERE id = ? AND user_id = ?");
        $stmt->execute([$id, $userId]);
        echo json_encode(['success' => true]);
    } else {
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
    }
}

function handleServiceCategories($db, $method, $userId, $id) {
    if ($method === 'GET') {
        $stmt = $db->prepare("SELECT * FROM service_categories WHERE user_id = ? ORDER BY sort_order, name");
        $stmt->execute([$userId]);
        echo json_encode(['items' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
    } elseif ($method === 'POST') {
        $data = json_decode(file_get_contents('php://input'), true);
        
        $stmt = $db->prepare("
            INSERT INTO service_categories (user_id, industry_type_id, name, description, icon, color, sort_order, is_active)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ");
        
        $stmt->execute([
            $userId,
            $data['industry_type_id'] ?? null,
            $data['name'],
            $data['description'] ?? null,
            $data['icon'] ?? null,
            $data['color'] ?? null,
            $data['sort_order'] ?? 0,
            $data['is_active'] ?? true
        ]);
        
        echo json_encode(['success' => true, 'id' => $db->lastInsertId()]);
    } elseif ($method === 'PUT' && $id) {
        $data = json_decode(file_get_contents('php://input'), true);
        
        $stmt = $db->prepare("
            UPDATE service_categories 
            SET name = ?, description = ?, icon = ?, color = ?, sort_order = ?, is_active = ?
            WHERE id = ? AND user_id = ?
        ");
        
        $stmt->execute([
            $data['name'],
            $data['description'] ?? null,
            $data['icon'] ?? null,
            $data['color'] ?? null,
            $data['sort_order'] ?? 0,
            $data['is_active'] ?? true,
            $id,
            $userId
        ]);
        
        echo json_encode(['success' => true]);
    } elseif ($method === 'DELETE' && $id) {
        $stmt = $db->prepare("DELETE FROM service_categories WHERE id = ? AND user_id = ?");
        $stmt->execute([$id, $userId]);
        echo json_encode(['success' => true]);
    } else {
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
    }
}
