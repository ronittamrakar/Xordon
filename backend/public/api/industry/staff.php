<?php
/**
 * Staff Members Handler
 */

function handleStaff($db, $method, $userId, $id) {
    if ($method === 'GET') {
        if ($id) {
            $stmt = $db->prepare("SELECT * FROM staff_members WHERE id = ? AND user_id = ?");
            $stmt->execute([$id, $userId]);
            $staff = $stmt->fetch(PDO::FETCH_ASSOC);
            if ($staff) {
                $staff['skills'] = json_decode($staff['skills'] ?? '[]', true);
                $staff['certifications'] = json_decode($staff['certifications'] ?? '[]', true);
                $staff['service_ids'] = json_decode($staff['service_ids'] ?? '[]', true);
                $staff['availability'] = json_decode($staff['availability'] ?? '{}', true);
            }
            echo json_encode($staff ?: ['error' => 'Not found']);
        } else {
            $role = $_GET['role'] ?? null;
            $sql = "SELECT * FROM staff_members WHERE user_id = ?";
            $params = [$userId];
            
            if ($role) {
                $sql .= " AND role = ?";
                $params[] = $role;
            }
            
            $sql .= " ORDER BY name";
            $stmt = $db->prepare($sql);
            $stmt->execute($params);
            $staff = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            foreach ($staff as &$s) {
                $s['skills'] = json_decode($s['skills'] ?? '[]', true);
                $s['service_ids'] = json_decode($s['service_ids'] ?? '[]', true);
            }
            
            echo json_encode(['items' => $staff]);
        }
    } elseif ($method === 'POST') {
        $data = json_decode(file_get_contents('php://input'), true);
        
        $stmt = $db->prepare("
            INSERT INTO staff_members (user_id, name, email, phone, role, title, photo_url, bio, skills, certifications, service_ids, availability, color, is_active)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");
        
        $stmt->execute([
            $userId,
            $data['name'],
            $data['email'] ?? null,
            $data['phone'] ?? null,
            $data['role'] ?? 'staff',
            $data['title'] ?? null,
            $data['photo_url'] ?? null,
            $data['bio'] ?? null,
            json_encode($data['skills'] ?? []),
            json_encode($data['certifications'] ?? []),
            json_encode($data['service_ids'] ?? []),
            json_encode($data['availability'] ?? []),
            $data['color'] ?? null,
            $data['is_active'] ?? true
        ]);
        
        echo json_encode(['success' => true, 'id' => $db->lastInsertId()]);
    } elseif ($method === 'PUT' && $id) {
        $data = json_decode(file_get_contents('php://input'), true);
        
        $stmt = $db->prepare("
            UPDATE staff_members 
            SET name = ?, email = ?, phone = ?, role = ?, title = ?, photo_url = ?, bio = ?, 
                skills = ?, certifications = ?, service_ids = ?, availability = ?, color = ?, is_active = ?
            WHERE id = ? AND user_id = ?
        ");
        
        $stmt->execute([
            $data['name'],
            $data['email'] ?? null,
            $data['phone'] ?? null,
            $data['role'] ?? 'staff',
            $data['title'] ?? null,
            $data['photo_url'] ?? null,
            $data['bio'] ?? null,
            json_encode($data['skills'] ?? []),
            json_encode($data['certifications'] ?? []),
            json_encode($data['service_ids'] ?? []),
            json_encode($data['availability'] ?? []),
            $data['color'] ?? null,
            $data['is_active'] ?? true,
            $id,
            $userId
        ]);
        
        echo json_encode(['success' => true]);
    } elseif ($method === 'DELETE' && $id) {
        $stmt = $db->prepare("DELETE FROM staff_members WHERE id = ? AND user_id = ?");
        $stmt->execute([$id, $userId]);
        echo json_encode(['success' => true]);
    } else {
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
    }
}
