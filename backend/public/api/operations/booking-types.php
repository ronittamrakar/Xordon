<?php
/**
 * Operations Booking Types Handler
 * 
 * Handles CRUD operations for booking/appointment types.
 */

function handleOperationsBookingTypes($opsDb, $method, $userId, $workspaceId, $id) {
    if ($method === 'GET') {
        if ($id) {
            $stmt = $opsDb->prepare("SELECT * FROM fsm_booking_types WHERE id = ? AND workspace_id = ?");
            $stmt->execute([$id, $workspaceId]);
            $type = $stmt->fetch(PDO::FETCH_ASSOC);
            if ($type) {
                $type['assigned_staff_ids'] = json_decode($type['assigned_staff_ids'] ?? '[]', true);
            }
            echo json_encode($type ?: ['error' => 'Not found']);
            return;
        }
        
        $isActive = $_GET['is_active'] ?? null;
        
        $sql = "SELECT * FROM fsm_booking_types WHERE workspace_id = ?";
        $params = [$workspaceId];
        
        if ($isActive !== null) {
            $sql .= " AND is_active = ?";
            $params[] = $isActive;
        }
        
        $sql .= " ORDER BY name ASC";
        
        $stmt = $opsDb->prepare($sql);
        $stmt->execute($params);
        $types = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        foreach ($types as &$t) {
            $t['assigned_staff_ids'] = json_decode($t['assigned_staff_ids'] ?? '[]', true);
        }
        
        echo json_encode(['items' => $types]);
        
    } elseif ($method === 'POST') {
        $data = json_decode(file_get_contents('php://input'), true);
        
        $stmt = $opsDb->prepare("
            INSERT INTO fsm_booking_types (
                workspace_id, user_id, service_id, name, slug, description,
                duration_minutes, buffer_before, buffer_after,
                location_type, location_details, price, currency,
                requires_payment, require_deposit, deposit_amount,
                color, is_active, max_bookings_per_day, min_notice_hours, max_future_days,
                allow_staff_selection, assigned_staff_ids, intake_form_id
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");
        
        $slug = $data['slug'] ?? strtolower(preg_replace('/[^a-z0-9]+/', '-', strtolower($data['name'])));
        
        $stmt->execute([
            $workspaceId,
            $userId,
            $data['service_id'] ?? null,
            $data['name'],
            $slug,
            $data['description'] ?? null,
            $data['duration_minutes'] ?? 30,
            $data['buffer_before'] ?? 0,
            $data['buffer_after'] ?? 15,
            $data['location_type'] ?? 'video',
            $data['location_details'] ?? null,
            $data['price'] ?? 0,
            $data['currency'] ?? 'USD',
            $data['requires_payment'] ?? 0,
            $data['require_deposit'] ?? 0,
            $data['deposit_amount'] ?? null,
            $data['color'] ?? '#3B82F6',
            $data['is_active'] ?? 1,
            $data['max_bookings_per_day'] ?? null,
            $data['min_notice_hours'] ?? 24,
            $data['max_future_days'] ?? 60,
            $data['allow_staff_selection'] ?? 0,
            json_encode($data['assigned_staff_ids'] ?? []),
            $data['intake_form_id'] ?? null
        ]);
        
        echo json_encode(['success' => true, 'id' => $opsDb->lastInsertId()]);
        
    } elseif ($method === 'PUT' && $id) {
        $data = json_decode(file_get_contents('php://input'), true);
        
        $fields = [];
        $params = [];
        
        $allowedFields = [
            'service_id', 'name', 'slug', 'description',
            'duration_minutes', 'buffer_before', 'buffer_after',
            'location_type', 'location_details', 'price', 'currency',
            'requires_payment', 'require_deposit', 'deposit_amount',
            'color', 'is_active', 'max_bookings_per_day', 'min_notice_hours', 'max_future_days',
            'allow_staff_selection', 'intake_form_id'
        ];
        
        foreach ($allowedFields as $field) {
            if (isset($data[$field])) {
                $fields[] = "$field = ?";
                $params[] = $data[$field];
            }
        }
        
        if (isset($data['assigned_staff_ids'])) {
            $fields[] = "assigned_staff_ids = ?";
            $params[] = json_encode($data['assigned_staff_ids']);
        }
        
        if (!empty($fields)) {
            $params[] = $id;
            $params[] = $workspaceId;
            $stmt = $opsDb->prepare("UPDATE fsm_booking_types SET " . implode(', ', $fields) . " WHERE id = ? AND workspace_id = ?");
            $stmt->execute($params);
        }
        
        echo json_encode(['success' => true]);
        
    } elseif ($method === 'DELETE' && $id) {
        $stmt = $opsDb->prepare("DELETE FROM fsm_booking_types WHERE id = ? AND workspace_id = ?");
        $stmt->execute([$id, $workspaceId]);
        echo json_encode(['success' => true]);
        
    } else {
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
    }
}
