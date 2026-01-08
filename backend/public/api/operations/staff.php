<?php
/**
 * Operations Staff Handler
 * 
 * Handles CRUD operations for staff/technicians.
 */

function handleOperationsStaff($opsDb, $method, $userId, $workspaceId, $id) {
    if ($method === 'GET') {
        if ($id) {
            $stmt = $opsDb->prepare("SELECT * FROM fsm_staff WHERE id = ? AND workspace_id = ?");
            $stmt->execute([$id, $workspaceId]);
            $staff = $stmt->fetch(PDO::FETCH_ASSOC);
            if ($staff) {
                $staff['skills'] = json_decode($staff['skills'] ?? '[]', true);
                $staff['availability'] = json_decode($staff['availability'] ?? '{}', true);
                $staff['metadata'] = json_decode($staff['metadata'] ?? '{}', true);
            }
            echo json_encode($staff ?: ['error' => 'Not found']);
            return;
        }
        
        // List staff
        $isActive = $_GET['is_active'] ?? null;
        $role = $_GET['role'] ?? null;
        
        $sql = "SELECT * FROM fsm_staff WHERE workspace_id = ?";
        $params = [$workspaceId];
        
        if ($isActive !== null) {
            $sql .= " AND is_active = ?";
            $params[] = $isActive;
        }
        if ($role) {
            $sql .= " AND role = ?";
            $params[] = $role;
        }
        
        $sql .= " ORDER BY name ASC";
        
        $stmt = $opsDb->prepare($sql);
        $stmt->execute($params);
        $staffList = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        foreach ($staffList as &$s) {
            $s['skills'] = json_decode($s['skills'] ?? '[]', true);
            $s['availability'] = json_decode($s['availability'] ?? '{}', true);
        }
        
        echo json_encode(['items' => $staffList]);
        
    } elseif ($method === 'POST') {
        $data = json_decode(file_get_contents('php://input'), true);
        
        $stmt = $opsDb->prepare("
            INSERT INTO fsm_staff (workspace_id, user_id, name, email, phone, role, avatar_url, color, hourly_rate, is_active, skills, availability, metadata)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");
        
        $stmt->execute([
            $workspaceId,
            $userId,
            $data['name'],
            $data['email'] ?? null,
            $data['phone'] ?? null,
            $data['role'] ?? 'technician',
            $data['avatar_url'] ?? null,
            $data['color'] ?? '#3B82F6',
            $data['hourly_rate'] ?? null,
            $data['is_active'] ?? 1,
            json_encode($data['skills'] ?? []),
            json_encode($data['availability'] ?? []),
            json_encode($data['metadata'] ?? [])
        ]);
        
        echo json_encode(['success' => true, 'id' => $opsDb->lastInsertId()]);
        
    } elseif ($method === 'PUT' && $id) {
        $data = json_decode(file_get_contents('php://input'), true);
        
        $fields = [];
        $params = [];
        
        $allowedFields = ['name', 'email', 'phone', 'role', 'avatar_url', 'color', 'hourly_rate', 'is_active'];
        
        foreach ($allowedFields as $field) {
            if (isset($data[$field])) {
                $fields[] = "$field = ?";
                $params[] = $data[$field];
            }
        }
        
        if (isset($data['skills'])) {
            $fields[] = "skills = ?";
            $params[] = json_encode($data['skills']);
        }
        
        if (isset($data['availability'])) {
            $fields[] = "availability = ?";
            $params[] = json_encode($data['availability']);
        }
        
        if (isset($data['metadata'])) {
            $fields[] = "metadata = ?";
            $params[] = json_encode($data['metadata']);
        }
        
        if (!empty($fields)) {
            $params[] = $id;
            $params[] = $workspaceId;
            $stmt = $opsDb->prepare("UPDATE fsm_staff SET " . implode(', ', $fields) . " WHERE id = ? AND workspace_id = ?");
            $stmt->execute($params);
        }
        
        echo json_encode(['success' => true]);
        
    } elseif ($method === 'DELETE' && $id) {
        $stmt = $opsDb->prepare("DELETE FROM fsm_staff WHERE id = ? AND workspace_id = ?");
        $stmt->execute([$id, $workspaceId]);
        echo json_encode(['success' => true]);
        
    } else {
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
    }
}
