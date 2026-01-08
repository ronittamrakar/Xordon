<?php
/**
 * Operations Referrals Handler
 * 
 * Handles CRUD operations for referral programs and referrals.
 */

function handleOperationsReferralPrograms($opsDb, $method, $userId, $workspaceId, $id) {
    if ($method === 'GET') {
        if ($id) {
            $stmt = $opsDb->prepare("SELECT * FROM fsm_referral_programs WHERE id = ? AND workspace_id = ?");
            $stmt->execute([$id, $workspaceId]);
            echo json_encode($stmt->fetch(PDO::FETCH_ASSOC) ?: ['error' => 'Not found']);
            return;
        }
        
        $stmt = $opsDb->prepare("SELECT * FROM fsm_referral_programs WHERE workspace_id = ? ORDER BY created_at DESC");
        $stmt->execute([$workspaceId]);
        echo json_encode(['items' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
        
    } elseif ($method === 'POST') {
        $data = json_decode(file_get_contents('php://input'), true);
        
        $stmt = $opsDb->prepare("
            INSERT INTO fsm_referral_programs (workspace_id, user_id, name, description, reward_type, reward_value, is_active, terms)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ");
        
        $stmt->execute([
            $workspaceId,
            $userId,
            $data['name'],
            $data['description'] ?? null,
            $data['reward_type'] ?? 'fixed',
            $data['reward_value'] ?? 0,
            $data['is_active'] ?? 1,
            $data['terms'] ?? null
        ]);
        
        echo json_encode(['success' => true, 'id' => $opsDb->lastInsertId()]);
        
    } elseif ($method === 'PUT' && $id) {
        $data = json_decode(file_get_contents('php://input'), true);
        
        $fields = [];
        $params = [];
        
        foreach (['name', 'description', 'reward_type', 'reward_value', 'is_active', 'terms'] as $field) {
            if (isset($data[$field])) {
                $fields[] = "$field = ?";
                $params[] = $data[$field];
            }
        }
        
        if (!empty($fields)) {
            $params[] = $id;
            $params[] = $workspaceId;
            $stmt = $opsDb->prepare("UPDATE fsm_referral_programs SET " . implode(', ', $fields) . " WHERE id = ? AND workspace_id = ?");
            $stmt->execute($params);
        }
        
        echo json_encode(['success' => true]);
        
    } elseif ($method === 'DELETE' && $id) {
        $stmt = $opsDb->prepare("DELETE FROM fsm_referral_programs WHERE id = ? AND workspace_id = ?");
        $stmt->execute([$id, $workspaceId]);
        echo json_encode(['success' => true]);
        
    } else {
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
    }
}

function handleOperationsReferrals($opsDb, $mainDb, $method, $userId, $workspaceId, $id) {
    if ($method === 'GET') {
        if ($id) {
            $stmt = $opsDb->prepare("SELECT * FROM fsm_referrals WHERE id = ? AND workspace_id = ?");
            $stmt->execute([$id, $workspaceId]);
            echo json_encode($stmt->fetch(PDO::FETCH_ASSOC) ?: ['error' => 'Not found']);
            return;
        }
        
        $programId = $_GET['program_id'] ?? null;
        $status = $_GET['status'] ?? null;
        
        $sql = "SELECT r.*, p.name as program_name FROM fsm_referrals r LEFT JOIN fsm_referral_programs p ON r.program_id = p.id WHERE r.workspace_id = ?";
        $params = [$workspaceId];
        
        if ($programId) {
            $sql .= " AND r.program_id = ?";
            $params[] = $programId;
        }
        if ($status) {
            $sql .= " AND r.status = ?";
            $params[] = $status;
        }
        
        $sql .= " ORDER BY r.created_at DESC";
        
        $stmt = $opsDb->prepare($sql);
        $stmt->execute($params);
        echo json_encode(['items' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
        
    } elseif ($method === 'POST') {
        $data = json_decode(file_get_contents('php://input'), true);
        
        $stmt = $opsDb->prepare("
            INSERT INTO fsm_referrals (workspace_id, user_id, program_id, referrer_contact_id, referred_contact_id, job_id, status, reward_amount, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");
        
        $stmt->execute([
            $workspaceId,
            $userId,
            $data['program_id'] ?? null,
            $data['referrer_contact_id'] ?? null,
            $data['referred_contact_id'] ?? null,
            $data['job_id'] ?? null,
            $data['status'] ?? 'pending',
            $data['reward_amount'] ?? 0,
            $data['notes'] ?? null
        ]);
        
        echo json_encode(['success' => true, 'id' => $opsDb->lastInsertId()]);
        
    } elseif ($method === 'PUT' && $id) {
        $data = json_decode(file_get_contents('php://input'), true);
        
        $fields = [];
        $params = [];
        
        foreach (['program_id', 'referrer_contact_id', 'referred_contact_id', 'job_id', 'status', 'reward_amount', 'reward_paid_at', 'notes'] as $field) {
            if (isset($data[$field])) {
                $fields[] = "$field = ?";
                $params[] = $data[$field];
            }
        }
        
        if (!empty($fields)) {
            $params[] = $id;
            $params[] = $workspaceId;
            $stmt = $opsDb->prepare("UPDATE fsm_referrals SET " . implode(', ', $fields) . " WHERE id = ? AND workspace_id = ?");
            $stmt->execute($params);
        }
        
        echo json_encode(['success' => true]);
        
    } elseif ($method === 'DELETE' && $id) {
        $stmt = $opsDb->prepare("DELETE FROM fsm_referrals WHERE id = ? AND workspace_id = ?");
        $stmt->execute([$id, $workspaceId]);
        echo json_encode(['success' => true]);
        
    } else {
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
    }
}
