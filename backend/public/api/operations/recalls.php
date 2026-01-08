<?php
/**
 * Operations Recalls Handler
 * 
 * Handles CRUD operations for recall schedules and contact recalls.
 */

function handleOperationsRecallSchedules($opsDb, $method, $userId, $workspaceId, $id) {
    if ($method === 'GET') {
        if ($id) {
            $stmt = $opsDb->prepare("SELECT * FROM fsm_recall_schedules WHERE id = ? AND workspace_id = ?");
            $stmt->execute([$id, $workspaceId]);
            echo json_encode($stmt->fetch(PDO::FETCH_ASSOC) ?: ['error' => 'Not found']);
            return;
        }
        
        $stmt = $opsDb->prepare("SELECT * FROM fsm_recall_schedules WHERE workspace_id = ? ORDER BY name ASC");
        $stmt->execute([$workspaceId]);
        echo json_encode(['items' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
        
    } elseif ($method === 'POST') {
        $data = json_decode(file_get_contents('php://input'), true);
        
        $stmt = $opsDb->prepare("
            INSERT INTO fsm_recall_schedules (workspace_id, user_id, service_id, name, description, interval_days, reminder_days_before, is_active, email_template_id, sms_template_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");
        
        $stmt->execute([
            $workspaceId,
            $userId,
            $data['service_id'] ?? null,
            $data['name'],
            $data['description'] ?? null,
            $data['interval_days'] ?? 365,
            $data['reminder_days_before'] ?? 30,
            $data['is_active'] ?? 1,
            $data['email_template_id'] ?? null,
            $data['sms_template_id'] ?? null
        ]);
        
        echo json_encode(['success' => true, 'id' => $opsDb->lastInsertId()]);
        
    } elseif ($method === 'PUT' && $id) {
        $data = json_decode(file_get_contents('php://input'), true);
        
        $fields = [];
        $params = [];
        
        foreach (['service_id', 'name', 'description', 'interval_days', 'reminder_days_before', 'is_active', 'email_template_id', 'sms_template_id'] as $field) {
            if (isset($data[$field])) {
                $fields[] = "$field = ?";
                $params[] = $data[$field];
            }
        }
        
        if (!empty($fields)) {
            $params[] = $id;
            $params[] = $workspaceId;
            $stmt = $opsDb->prepare("UPDATE fsm_recall_schedules SET " . implode(', ', $fields) . " WHERE id = ? AND workspace_id = ?");
            $stmt->execute($params);
        }
        
        echo json_encode(['success' => true]);
        
    } elseif ($method === 'DELETE' && $id) {
        $stmt = $opsDb->prepare("DELETE FROM fsm_recall_schedules WHERE id = ? AND workspace_id = ?");
        $stmt->execute([$id, $workspaceId]);
        echo json_encode(['success' => true]);
        
    } else {
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
    }
}

function handleOperationsContactRecalls($opsDb, $mainDb, $method, $userId, $workspaceId, $id) {
    if ($method === 'GET') {
        if ($id) {
            $stmt = $opsDb->prepare("SELECT * FROM fsm_contact_recalls WHERE id = ? AND workspace_id = ?");
            $stmt->execute([$id, $workspaceId]);
            echo json_encode($stmt->fetch(PDO::FETCH_ASSOC) ?: ['error' => 'Not found']);
            return;
        }
        
        $scheduleId = $_GET['schedule_id'] ?? null;
        $status = $_GET['status'] ?? null;
        $dueSoon = $_GET['due_soon'] ?? null;
        
        $sql = "SELECT cr.*, rs.name as schedule_name FROM fsm_contact_recalls cr LEFT JOIN fsm_recall_schedules rs ON cr.schedule_id = rs.id WHERE cr.workspace_id = ?";
        $params = [$workspaceId];
        
        if ($scheduleId) {
            $sql .= " AND cr.schedule_id = ?";
            $params[] = $scheduleId;
        }
        if ($status) {
            $sql .= " AND cr.status = ?";
            $params[] = $status;
        }
        if ($dueSoon) {
            $sql .= " AND cr.next_recall_date <= DATE_ADD(CURDATE(), INTERVAL ? DAY)";
            $params[] = $dueSoon;
        }
        
        $sql .= " ORDER BY cr.next_recall_date ASC";
        
        $stmt = $opsDb->prepare($sql);
        $stmt->execute($params);
        echo json_encode(['items' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
        
    } elseif ($method === 'POST') {
        $data = json_decode(file_get_contents('php://input'), true);
        
        // Calculate next recall date
        $lastServiceDate = $data['last_service_date'] ?? date('Y-m-d');
        $intervalDays = $data['interval_days'] ?? 365;
        $nextRecallDate = date('Y-m-d', strtotime($lastServiceDate . " + $intervalDays days"));
        
        $stmt = $opsDb->prepare("
            INSERT INTO fsm_contact_recalls (workspace_id, schedule_id, contact_id, job_id, last_service_date, next_recall_date, status, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ");
        
        $stmt->execute([
            $workspaceId,
            $data['schedule_id'],
            $data['contact_id'],
            $data['job_id'] ?? null,
            $lastServiceDate,
            $data['next_recall_date'] ?? $nextRecallDate,
            $data['status'] ?? 'pending',
            $data['notes'] ?? null
        ]);
        
        echo json_encode(['success' => true, 'id' => $opsDb->lastInsertId()]);
        
    } elseif ($method === 'PUT' && $id) {
        $data = json_decode(file_get_contents('php://input'), true);
        
        $fields = [];
        $params = [];
        
        foreach (['schedule_id', 'contact_id', 'job_id', 'last_service_date', 'next_recall_date', 'status', 'notified_at', 'notes'] as $field) {
            if (isset($data[$field])) {
                $fields[] = "$field = ?";
                $params[] = $data[$field];
            }
        }
        
        if (!empty($fields)) {
            $params[] = $id;
            $params[] = $workspaceId;
            $stmt = $opsDb->prepare("UPDATE fsm_contact_recalls SET " . implode(', ', $fields) . " WHERE id = ? AND workspace_id = ?");
            $stmt->execute($params);
        }
        
        echo json_encode(['success' => true]);
        
    } elseif ($method === 'DELETE' && $id) {
        $stmt = $opsDb->prepare("DELETE FROM fsm_contact_recalls WHERE id = ? AND workspace_id = ?");
        $stmt->execute([$id, $workspaceId]);
        echo json_encode(['success' => true]);
        
    } else {
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
    }
}
