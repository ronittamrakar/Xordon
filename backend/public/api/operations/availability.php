<?php
/**
 * Operations Availability Handler
 * 
 * Handles CRUD operations for availability schedules and booking page settings.
 */

function handleOperationsAvailability($opsDb, $method, $userId, $workspaceId, $id) {
    if ($method === 'GET') {
        if ($id) {
            $stmt = $opsDb->prepare("SELECT * FROM fsm_availability_schedules WHERE id = ? AND workspace_id = ?");
            $stmt->execute([$id, $workspaceId]);
            $schedule = $stmt->fetch(PDO::FETCH_ASSOC);
            if ($schedule) {
                $schedule['slots'] = json_decode($schedule['slots'] ?? '[]', true);
            }
            echo json_encode($schedule ?: ['error' => 'Not found']);
            return;
        }
        
        $staffId = $_GET['staff_id'] ?? null;
        
        $sql = "SELECT * FROM fsm_availability_schedules WHERE workspace_id = ?";
        $params = [$workspaceId];
        
        if ($staffId) {
            $sql .= " AND (staff_id = ? OR staff_id IS NULL)";
            $params[] = $staffId;
        }
        
        $sql .= " ORDER BY is_default DESC, name ASC";
        
        $stmt = $opsDb->prepare($sql);
        $stmt->execute($params);
        $schedules = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        foreach ($schedules as &$s) {
            $s['slots'] = json_decode($s['slots'] ?? '[]', true);
        }
        
        echo json_encode(['schedules' => $schedules, 'overrides' => []]);
        
    } elseif ($method === 'POST') {
        $data = json_decode(file_get_contents('php://input'), true);
        
        // If setting as default, unset other defaults
        if (!empty($data['is_default'])) {
            $stmt = $opsDb->prepare("UPDATE fsm_availability_schedules SET is_default = 0 WHERE workspace_id = ?");
            $stmt->execute([$workspaceId]);
        }
        
        $stmt = $opsDb->prepare("
            INSERT INTO fsm_availability_schedules (workspace_id, user_id, staff_id, name, timezone, is_default, slots)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ");
        
        $stmt->execute([
            $workspaceId,
            $userId,
            $data['staff_id'] ?? null,
            $data['schedule_name'] ?? $data['name'] ?? 'Default Schedule',
            $data['timezone'] ?? 'America/New_York',
            $data['is_default'] ?? 0,
            json_encode($data['slots'] ?? [])
        ]);
        
        echo json_encode(['success' => true, 'id' => $opsDb->lastInsertId()]);
        
    } elseif ($method === 'PUT' && $id) {
        $data = json_decode(file_get_contents('php://input'), true);
        
        // If setting as default, unset other defaults
        if (!empty($data['is_default'])) {
            $stmt = $opsDb->prepare("UPDATE fsm_availability_schedules SET is_default = 0 WHERE workspace_id = ? AND id != ?");
            $stmt->execute([$workspaceId, $id]);
        }
        
        $fields = [];
        $params = [];
        
        foreach (['staff_id', 'name', 'timezone', 'is_default'] as $field) {
            if (isset($data[$field])) {
                $fields[] = "$field = ?";
                $params[] = $data[$field];
            }
        }
        
        if (isset($data['schedule_name'])) {
            $fields[] = "name = ?";
            $params[] = $data['schedule_name'];
        }
        
        if (isset($data['slots'])) {
            $fields[] = "slots = ?";
            $params[] = json_encode($data['slots']);
        }
        
        if (!empty($fields)) {
            $params[] = $id;
            $params[] = $workspaceId;
            $stmt = $opsDb->prepare("UPDATE fsm_availability_schedules SET " . implode(', ', $fields) . " WHERE id = ? AND workspace_id = ?");
            $stmt->execute($params);
        }
        
        echo json_encode(['success' => true]);
        
    } elseif ($method === 'DELETE' && $id) {
        $stmt = $opsDb->prepare("DELETE FROM fsm_availability_schedules WHERE id = ? AND workspace_id = ?");
        $stmt->execute([$id, $workspaceId]);
        echo json_encode(['success' => true]);
        
    } else {
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
    }
}

function handleOperationsBookingPageSettings($opsDb, $method, $userId, $workspaceId) {
    if ($method === 'GET') {
        $stmt = $opsDb->prepare("SELECT * FROM fsm_booking_page_settings WHERE workspace_id = ?");
        $stmt->execute([$workspaceId]);
        $settings = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($settings) {
            $settings['custom_questions'] = json_decode($settings['custom_questions'] ?? '[]', true);
        }
        
        echo json_encode($settings ?: null);
        
    } elseif ($method === 'POST' || $method === 'PUT') {
        $data = json_decode(file_get_contents('php://input'), true);
        
        // Check if settings exist
        $stmt = $opsDb->prepare("SELECT id FROM fsm_booking_page_settings WHERE workspace_id = ?");
        $stmt->execute([$workspaceId]);
        $existing = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($existing) {
            // Update
            $stmt = $opsDb->prepare("
                UPDATE fsm_booking_page_settings 
                SET page_slug = ?, page_title = ?, welcome_message = ?, logo_url = ?,
                    brand_color = ?, show_branding = ?, require_phone = ?,
                    custom_questions = ?, confirmation_message = ?, redirect_url = ?
                WHERE workspace_id = ?
            ");
            $stmt->execute([
                $data['page_slug'] ?? null,
                $data['page_title'] ?? null,
                $data['welcome_message'] ?? null,
                $data['logo_url'] ?? null,
                $data['brand_color'] ?? '#3B82F6',
                $data['show_branding'] ?? 1,
                $data['require_phone'] ?? 0,
                json_encode($data['custom_questions'] ?? []),
                $data['confirmation_message'] ?? null,
                $data['redirect_url'] ?? null,
                $workspaceId
            ]);
        } else {
            // Insert
            $stmt = $opsDb->prepare("
                INSERT INTO fsm_booking_page_settings (
                    workspace_id, user_id, page_slug, page_title, welcome_message, logo_url,
                    brand_color, show_branding, require_phone, custom_questions, confirmation_message, redirect_url
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ");
            $stmt->execute([
                $workspaceId,
                $userId,
                $data['page_slug'] ?? null,
                $data['page_title'] ?? null,
                $data['welcome_message'] ?? null,
                $data['logo_url'] ?? null,
                $data['brand_color'] ?? '#3B82F6',
                $data['show_branding'] ?? 1,
                $data['require_phone'] ?? 0,
                json_encode($data['custom_questions'] ?? []),
                $data['confirmation_message'] ?? null,
                $data['redirect_url'] ?? null
            ]);
        }
        
        echo json_encode(['success' => true]);
        
    } else {
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
    }
}
