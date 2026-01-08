<?php
/**
 * Recall Schedules & Contact Recalls Handler
 */

function handleRecallSchedules($db, $method, $userId, $id) {
    if ($method === 'GET') {
        if ($id) {
            $stmt = $db->prepare("SELECT * FROM recall_schedules WHERE id = ? AND user_id = ?");
            $stmt->execute([$id, $userId]);
            $schedule = $stmt->fetch(PDO::FETCH_ASSOC);
            if ($schedule) {
                $schedule['custom_logic'] = json_decode($schedule['custom_logic'] ?? '{}', true);
                $schedule['reminder_days_before'] = json_decode($schedule['reminder_days_before'] ?? '[]', true);
            }
            echo json_encode($schedule ?: ['error' => 'Not found']);
        } else {
            $stmt = $db->prepare("
                SELECT rs.*, it.name as industry_name, s.name as service_name
                FROM recall_schedules rs
                LEFT JOIN industry_types it ON rs.industry_type_id = it.id
                LEFT JOIN services s ON rs.service_id = s.id
                WHERE rs.user_id = ?
                ORDER BY rs.name
            ");
            $stmt->execute([$userId]);
            $schedules = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            foreach ($schedules as &$s) {
                $s['reminder_days_before'] = json_decode($s['reminder_days_before'] ?? '[]', true);
            }
            
            echo json_encode(['items' => $schedules]);
        }
    } elseif ($method === 'POST') {
        $data = json_decode(file_get_contents('php://input'), true);
        
        $stmt = $db->prepare("
            INSERT INTO recall_schedules (user_id, industry_type_id, name, description, service_id, recall_type, interval_days, interval_months, custom_logic, message_template_email, message_template_sms, reminder_days_before, is_active)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");
        
        $stmt->execute([
            $userId,
            $data['industry_type_id'] ?? null,
            $data['name'],
            $data['description'] ?? null,
            $data['service_id'] ?? null,
            $data['recall_type'] ?? 'time_based',
            $data['interval_days'] ?? null,
            $data['interval_months'] ?? null,
            json_encode($data['custom_logic'] ?? []),
            $data['message_template_email'] ?? null,
            $data['message_template_sms'] ?? null,
            json_encode($data['reminder_days_before'] ?? [7, 3, 1]),
            $data['is_active'] ?? true
        ]);
        
        echo json_encode(['success' => true, 'id' => $db->lastInsertId()]);
    } elseif ($method === 'PUT' && $id) {
        $data = json_decode(file_get_contents('php://input'), true);
        
        $stmt = $db->prepare("
            UPDATE recall_schedules 
            SET industry_type_id = ?, name = ?, description = ?, service_id = ?, recall_type = ?, 
                interval_days = ?, interval_months = ?, custom_logic = ?, 
                message_template_email = ?, message_template_sms = ?, reminder_days_before = ?, is_active = ?
            WHERE id = ? AND user_id = ?
        ");
        
        $stmt->execute([
            $data['industry_type_id'] ?? null,
            $data['name'],
            $data['description'] ?? null,
            $data['service_id'] ?? null,
            $data['recall_type'] ?? 'time_based',
            $data['interval_days'] ?? null,
            $data['interval_months'] ?? null,
            json_encode($data['custom_logic'] ?? []),
            $data['message_template_email'] ?? null,
            $data['message_template_sms'] ?? null,
            json_encode($data['reminder_days_before'] ?? [7, 3, 1]),
            $data['is_active'] ?? true,
            $id,
            $userId
        ]);
        
        echo json_encode(['success' => true]);
    } elseif ($method === 'DELETE' && $id) {
        $stmt = $db->prepare("DELETE FROM recall_schedules WHERE id = ? AND user_id = ?");
        $stmt->execute([$id, $userId]);
        echo json_encode(['success' => true]);
    } else {
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
    }
}

function handleContactRecalls($db, $method, $userId, $id) {
    if ($method === 'GET') {
        $status = $_GET['status'] ?? null;
        $contactId = $_GET['contact_id'] ?? null;
        $scheduleId = $_GET['schedule_id'] ?? null;
        $upcoming = $_GET['upcoming'] ?? null;
        
        $sql = "
            SELECT cr.*, 
                   c.email as contact_email, c.first_name as contact_first_name, c.last_name as contact_last_name, c.phone as contact_phone,
                   rs.name as schedule_name, rs.interval_months,
                   s.name as service_name
            FROM contact_recalls cr
            LEFT JOIN contacts c ON cr.contact_id = c.id
            LEFT JOIN recall_schedules rs ON cr.recall_schedule_id = rs.id
            LEFT JOIN services s ON cr.service_id = s.id
            WHERE cr.user_id = ?
        ";
        $params = [$userId];
        
        if ($status) {
            $sql .= " AND cr.status = ?";
            $params[] = $status;
        }
        if ($contactId) {
            $sql .= " AND cr.contact_id = ?";
            $params[] = $contactId;
        }
        if ($scheduleId) {
            $sql .= " AND cr.recall_schedule_id = ?";
            $params[] = $scheduleId;
        }
        if ($upcoming) {
            $sql .= " AND cr.next_recall_date <= DATE_ADD(CURDATE(), INTERVAL ? DAY) AND cr.status IN ('upcoming', 'due')";
            $params[] = intval($upcoming);
        }
        
        $sql .= " ORDER BY cr.next_recall_date ASC";
        
        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        echo json_encode(['items' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
    } elseif ($method === 'POST') {
        $data = json_decode(file_get_contents('php://input'), true);
        
        $stmt = $db->prepare("
            INSERT INTO contact_recalls (user_id, contact_id, recall_schedule_id, service_id, last_service_date, next_recall_date, status, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ");
        
        $stmt->execute([
            $userId,
            $data['contact_id'],
            $data['recall_schedule_id'] ?? null,
            $data['service_id'] ?? null,
            $data['last_service_date'] ?? null,
            $data['next_recall_date'],
            $data['status'] ?? 'upcoming',
            $data['notes'] ?? null
        ]);
        
        echo json_encode(['success' => true, 'id' => $db->lastInsertId()]);
    } elseif ($method === 'PUT' && $id) {
        $data = json_decode(file_get_contents('php://input'), true);
        
        $fields = [];
        $params = [];
        
        $allowedFields = ['recall_schedule_id', 'service_id', 'last_service_date', 'next_recall_date', 
            'status', 'reminder_sent_at', 'completed_at', 'notes'];
        
        foreach ($allowedFields as $field) {
            if (isset($data[$field])) {
                $fields[] = "$field = ?";
                $params[] = $data[$field];
            }
        }
        
        if (!empty($fields)) {
            $params[] = $id;
            $params[] = $userId;
            $stmt = $db->prepare("UPDATE contact_recalls SET " . implode(', ', $fields) . " WHERE id = ? AND user_id = ?");
            $stmt->execute($params);
        }
        
        echo json_encode(['success' => true]);
    } elseif ($method === 'DELETE' && $id) {
        $stmt = $db->prepare("DELETE FROM contact_recalls WHERE id = ? AND user_id = ?");
        $stmt->execute([$id, $userId]);
        echo json_encode(['success' => true]);
    } else {
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
    }
}
