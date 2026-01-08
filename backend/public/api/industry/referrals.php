<?php
/**
 * Referral Programs & Referrals Handler
 */

function handleReferralPrograms($db, $method, $userId, $id) {
    if ($method === 'GET') {
        if ($id) {
            $stmt = $db->prepare("SELECT * FROM referral_programs WHERE id = ? AND user_id = ?");
            $stmt->execute([$id, $userId]);
            echo json_encode($stmt->fetch(PDO::FETCH_ASSOC) ?: ['error' => 'Not found']);
        } else {
            $stmt = $db->prepare("SELECT * FROM referral_programs WHERE user_id = ? ORDER BY created_at DESC");
            $stmt->execute([$userId]);
            echo json_encode(['items' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
        }
    } elseif ($method === 'POST') {
        $data = json_decode(file_get_contents('php://input'), true);
        
        $stmt = $db->prepare("
            INSERT INTO referral_programs (user_id, name, description, referrer_reward_type, referrer_reward_amount, referee_reward_type, referee_reward_amount, terms, is_active)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");
        
        $stmt->execute([
            $userId,
            $data['name'],
            $data['description'] ?? null,
            $data['referrer_reward_type'] ?? 'fixed',
            $data['referrer_reward_amount'] ?? 0,
            $data['referee_reward_type'] ?? 'fixed',
            $data['referee_reward_amount'] ?? 0,
            $data['terms'] ?? null,
            $data['is_active'] ?? true
        ]);
        
        echo json_encode(['success' => true, 'id' => $db->lastInsertId()]);
    } elseif ($method === 'PUT' && $id) {
        $data = json_decode(file_get_contents('php://input'), true);
        
        $stmt = $db->prepare("
            UPDATE referral_programs 
            SET name = ?, description = ?, referrer_reward_type = ?, referrer_reward_amount = ?, 
                referee_reward_type = ?, referee_reward_amount = ?, terms = ?, is_active = ?
            WHERE id = ? AND user_id = ?
        ");
        
        $stmt->execute([
            $data['name'],
            $data['description'] ?? null,
            $data['referrer_reward_type'] ?? 'fixed',
            $data['referrer_reward_amount'] ?? 0,
            $data['referee_reward_type'] ?? 'fixed',
            $data['referee_reward_amount'] ?? 0,
            $data['terms'] ?? null,
            $data['is_active'] ?? true,
            $id,
            $userId
        ]);
        
        echo json_encode(['success' => true]);
    } elseif ($method === 'DELETE' && $id) {
        $stmt = $db->prepare("DELETE FROM referral_programs WHERE id = ? AND user_id = ?");
        $stmt->execute([$id, $userId]);
        echo json_encode(['success' => true]);
    } else {
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
    }
}

function handleReferrals($db, $method, $userId, $id) {
    if ($method === 'GET') {
        if ($id) {
            $stmt = $db->prepare("
                SELECT r.*, 
                       rp.name as program_name,
                       c1.email as referrer_email, c1.first_name as referrer_first_name, c1.last_name as referrer_last_name,
                       c2.email as referee_email_actual, c2.first_name as referee_first_name_actual, c2.last_name as referee_last_name_actual
                FROM referrals r
                LEFT JOIN referral_programs rp ON r.program_id = rp.id
                LEFT JOIN contacts c1 ON r.referrer_contact_id = c1.id
                LEFT JOIN contacts c2 ON r.referee_contact_id = c2.id
                WHERE r.id = ? AND r.user_id = ?
            ");
            $stmt->execute([$id, $userId]);
            echo json_encode($stmt->fetch(PDO::FETCH_ASSOC) ?: ['error' => 'Not found']);
        } else {
            $status = $_GET['status'] ?? null;
            $programId = $_GET['program_id'] ?? null;
            
            $sql = "
                SELECT r.*, 
                       rp.name as program_name,
                       c1.email as referrer_email, c1.first_name as referrer_first_name, c1.last_name as referrer_last_name
                FROM referrals r
                LEFT JOIN referral_programs rp ON r.program_id = rp.id
                LEFT JOIN contacts c1 ON r.referrer_contact_id = c1.id
                WHERE r.user_id = ?
            ";
            $params = [$userId];
            
            if ($status) {
                $sql .= " AND r.status = ?";
                $params[] = $status;
            }
            if ($programId) {
                $sql .= " AND r.program_id = ?";
                $params[] = $programId;
            }
            
            $sql .= " ORDER BY r.created_at DESC";
            
            $stmt = $db->prepare($sql);
            $stmt->execute($params);
            echo json_encode(['items' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
        }
    } elseif ($method === 'POST') {
        $data = json_decode(file_get_contents('php://input'), true);
        
        $stmt = $db->prepare("
            INSERT INTO referrals (user_id, program_id, referrer_contact_id, referee_contact_id, referee_name, referee_email, referee_phone, status, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");
        
        $stmt->execute([
            $userId,
            $data['program_id'] ?? null,
            $data['referrer_contact_id'],
            $data['referee_contact_id'] ?? null,
            $data['referee_name'] ?? null,
            $data['referee_email'] ?? null,
            $data['referee_phone'] ?? null,
            $data['status'] ?? 'pending',
            $data['notes'] ?? null
        ]);
        
        echo json_encode(['success' => true, 'id' => $db->lastInsertId()]);
    } elseif ($method === 'PUT' && $id) {
        $data = json_decode(file_get_contents('php://input'), true);
        
        $fields = [];
        $params = [];
        
        $allowedFields = ['program_id', 'referee_contact_id', 'referee_name', 'referee_email', 'referee_phone',
            'status', 'referrer_reward_status', 'referee_reward_status', 'conversion_date', 'conversion_value', 'notes'];
        
        foreach ($allowedFields as $field) {
            if (isset($data[$field])) {
                $fields[] = "$field = ?";
                $params[] = $data[$field];
            }
        }
        
        if (!empty($fields)) {
            $params[] = $id;
            $params[] = $userId;
            $stmt = $db->prepare("UPDATE referrals SET " . implode(', ', $fields) . " WHERE id = ? AND user_id = ?");
            $stmt->execute($params);
        }
        
        echo json_encode(['success' => true]);
    } elseif ($method === 'DELETE' && $id) {
        $stmt = $db->prepare("DELETE FROM referrals WHERE id = ? AND user_id = ?");
        $stmt->execute([$id, $userId]);
        echo json_encode(['success' => true]);
    } else {
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
    }
}
