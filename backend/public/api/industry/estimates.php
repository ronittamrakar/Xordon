<?php
/**
 * Estimates & Quotes Handler
 */

function handleEstimates($db, $method, $userId, $id) {
    if ($method === 'GET') {
        if ($id) {
            $stmt = $db->prepare("
                SELECT e.*, 
                       c.email as contact_email, c.first_name as contact_first_name, c.last_name as contact_last_name, c.phone as contact_phone
                FROM estimates e
                LEFT JOIN contacts c ON e.contact_id = c.id
                WHERE e.id = ? AND e.user_id = ?
            ");
            $stmt->execute([$id, $userId]);
            $estimate = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if ($estimate) {
                $stmt = $db->prepare("SELECT * FROM estimate_line_items WHERE estimate_id = ? ORDER BY sort_order");
                $stmt->execute([$id]);
                $estimate['line_items'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
            }
            
            echo json_encode($estimate ?: ['error' => 'Not found']);
        } else {
            $status = $_GET['status'] ?? null;
            $contactId = $_GET['contact_id'] ?? null;
            
            $sql = "
                SELECT e.*, 
                       c.email as contact_email, c.first_name as contact_first_name, c.last_name as contact_last_name
                FROM estimates e
                LEFT JOIN contacts c ON e.contact_id = c.id
                WHERE e.user_id = ?
            ";
            $params = [$userId];
            
            if ($status) {
                $sql .= " AND e.status = ?";
                $params[] = $status;
            }
            if ($contactId) {
                $sql .= " AND e.contact_id = ?";
                $params[] = $contactId;
            }
            
            $sql .= " ORDER BY e.created_at DESC";
            
            $stmt = $db->prepare($sql);
            $stmt->execute($params);
            echo json_encode(['items' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
        }
    } elseif ($method === 'POST') {
        $data = json_decode(file_get_contents('php://input'), true);
        
        // Generate estimate number
        $stmt = $db->prepare("SELECT COUNT(*) FROM estimates WHERE user_id = ?");
        $stmt->execute([$userId]);
        $count = $stmt->fetchColumn();
        $estimateNumber = 'EST-' . str_pad($count + 1, 5, '0', STR_PAD_LEFT);
        
        $stmt = $db->prepare("
            INSERT INTO estimates (user_id, contact_id, job_id, estimate_number, title, description, status,
                subtotal, tax_rate, tax_amount, discount_amount, total, valid_until, terms, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");
        
        $stmt->execute([
            $userId,
            $data['contact_id'],
            $data['job_id'] ?? null,
            $estimateNumber,
            $data['title'] ?? null,
            $data['description'] ?? null,
            $data['status'] ?? 'draft',
            $data['subtotal'] ?? 0,
            $data['tax_rate'] ?? 0,
            $data['tax_amount'] ?? 0,
            $data['discount_amount'] ?? 0,
            $data['total'] ?? 0,
            $data['valid_until'] ?? null,
            $data['terms'] ?? null,
            $data['notes'] ?? null
        ]);
        
        $estimateId = $db->lastInsertId();
        
        // Add line items
        if (!empty($data['line_items'])) {
            $stmt = $db->prepare("INSERT INTO estimate_line_items (estimate_id, service_id, description, quantity, unit_price, total, item_type, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
            $sortOrder = 0;
            foreach ($data['line_items'] as $item) {
                $stmt->execute([
                    $estimateId,
                    $item['service_id'] ?? null,
                    $item['description'],
                    $item['quantity'] ?? 1,
                    $item['unit_price'] ?? 0,
                    $item['total'] ?? ($item['quantity'] * $item['unit_price']),
                    $item['item_type'] ?? 'service',
                    $sortOrder++
                ]);
            }
        }
        
        echo json_encode(['success' => true, 'id' => $estimateId, 'estimate_number' => $estimateNumber]);
    } elseif ($method === 'PUT' && $id) {
        $data = json_decode(file_get_contents('php://input'), true);
        
        $fields = [];
        $params = [];
        
        $allowedFields = ['contact_id', 'job_id', 'title', 'description', 'status',
            'subtotal', 'tax_rate', 'tax_amount', 'discount_amount', 'total',
            'valid_until', 'terms', 'notes', 'sent_at', 'viewed_at', 'accepted_at', 'signature_url'];
        
        foreach ($allowedFields as $field) {
            if (isset($data[$field])) {
                $fields[] = "$field = ?";
                $params[] = $data[$field];
            }
        }
        
        if (!empty($fields)) {
            $params[] = $id;
            $params[] = $userId;
            $stmt = $db->prepare("UPDATE estimates SET " . implode(', ', $fields) . " WHERE id = ? AND user_id = ?");
            $stmt->execute($params);
        }
        
        // Update line items if provided
        if (isset($data['line_items'])) {
            // Delete existing
            $stmt = $db->prepare("DELETE FROM estimate_line_items WHERE estimate_id = ?");
            $stmt->execute([$id]);
            
            // Insert new
            $stmt = $db->prepare("INSERT INTO estimate_line_items (estimate_id, service_id, description, quantity, unit_price, total, item_type, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
            $sortOrder = 0;
            foreach ($data['line_items'] as $item) {
                $stmt->execute([
                    $id,
                    $item['service_id'] ?? null,
                    $item['description'],
                    $item['quantity'] ?? 1,
                    $item['unit_price'] ?? 0,
                    $item['total'] ?? ($item['quantity'] * $item['unit_price']),
                    $item['item_type'] ?? 'service',
                    $sortOrder++
                ]);
            }
        }
        
        echo json_encode(['success' => true]);
    } elseif ($method === 'DELETE' && $id) {
        $stmt = $db->prepare("DELETE FROM estimates WHERE id = ? AND user_id = ?");
        $stmt->execute([$id, $userId]);
        echo json_encode(['success' => true]);
    } else {
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
    }
}
