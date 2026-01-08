<?php
/**
 * Operations Intake Forms Handler
 * 
 * Handles CRUD operations for intake form templates and submissions.
 */

function handleOperationsIntakeTemplates($opsDb, $method, $userId, $workspaceId, $id) {
    if ($method === 'GET') {
        if ($id) {
            $stmt = $opsDb->prepare("SELECT * FROM fsm_intake_templates WHERE id = ? AND workspace_id = ?");
            $stmt->execute([$id, $workspaceId]);
            $template = $stmt->fetch(PDO::FETCH_ASSOC);
            if ($template) {
                $template['fields'] = json_decode($template['fields'] ?? '[]', true);
            }
            echo json_encode($template ?: ['error' => 'Not found']);
            return;
        }
        
        $isActive = $_GET['is_active'] ?? null;
        
        $sql = "SELECT * FROM fsm_intake_templates WHERE workspace_id = ?";
        $params = [$workspaceId];
        
        if ($isActive !== null) {
            $sql .= " AND is_active = ?";
            $params[] = $isActive;
        }
        
        $sql .= " ORDER BY name ASC";
        
        $stmt = $opsDb->prepare($sql);
        $stmt->execute($params);
        $templates = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        foreach ($templates as &$t) {
            $t['fields'] = json_decode($t['fields'] ?? '[]', true);
        }
        
        echo json_encode(['items' => $templates]);
        
    } elseif ($method === 'POST') {
        $data = json_decode(file_get_contents('php://input'), true);
        
        $stmt = $opsDb->prepare("
            INSERT INTO fsm_intake_templates (workspace_id, user_id, name, description, fields, is_active)
            VALUES (?, ?, ?, ?, ?, ?)
        ");
        
        $stmt->execute([
            $workspaceId,
            $userId,
            $data['name'],
            $data['description'] ?? null,
            json_encode($data['fields'] ?? []),
            $data['is_active'] ?? 1
        ]);
        
        echo json_encode(['success' => true, 'id' => $opsDb->lastInsertId()]);
        
    } elseif ($method === 'PUT' && $id) {
        $data = json_decode(file_get_contents('php://input'), true);
        
        $fields = [];
        $params = [];
        
        foreach (['name', 'description', 'is_active'] as $field) {
            if (isset($data[$field])) {
                $fields[] = "$field = ?";
                $params[] = $data[$field];
            }
        }
        
        if (isset($data['fields'])) {
            $fields[] = "fields = ?";
            $params[] = json_encode($data['fields']);
        }
        
        if (!empty($fields)) {
            $params[] = $id;
            $params[] = $workspaceId;
            $stmt = $opsDb->prepare("UPDATE fsm_intake_templates SET " . implode(', ', $fields) . " WHERE id = ? AND workspace_id = ?");
            $stmt->execute($params);
        }
        
        echo json_encode(['success' => true]);
        
    } elseif ($method === 'DELETE' && $id) {
        $stmt = $opsDb->prepare("DELETE FROM fsm_intake_templates WHERE id = ? AND workspace_id = ?");
        $stmt->execute([$id, $workspaceId]);
        echo json_encode(['success' => true]);
        
    } else {
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
    }
}

function handleOperationsIntakeSubmissions($opsDb, $mainDb, $method, $userId, $workspaceId, $id) {
    if ($method === 'GET') {
        if ($id) {
            $stmt = $opsDb->prepare("SELECT * FROM fsm_intake_submissions WHERE id = ? AND workspace_id = ?");
            $stmt->execute([$id, $workspaceId]);
            $submission = $stmt->fetch(PDO::FETCH_ASSOC);
            if ($submission) {
                $submission['response_data'] = json_decode($submission['response_data'] ?? '{}', true);
            }
            echo json_encode($submission ?: ['error' => 'Not found']);
            return;
        }
        
        $templateId = $_GET['template_id'] ?? null;
        $contactId = $_GET['contact_id'] ?? null;
        
        $sql = "SELECT s.*, t.name as template_name FROM fsm_intake_submissions s LEFT JOIN fsm_intake_templates t ON s.template_id = t.id WHERE s.workspace_id = ?";
        $params = [$workspaceId];
        
        if ($templateId) {
            $sql .= " AND s.template_id = ?";
            $params[] = $templateId;
        }
        if ($contactId) {
            $sql .= " AND s.contact_id = ?";
            $params[] = $contactId;
        }
        
        $sql .= " ORDER BY s.submitted_at DESC";
        
        $stmt = $opsDb->prepare($sql);
        $stmt->execute($params);
        $submissions = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        foreach ($submissions as &$s) {
            $s['response_data'] = json_decode($s['response_data'] ?? '{}', true);
        }
        
        echo json_encode(['items' => $submissions]);
        
    } elseif ($method === 'POST') {
        $data = json_decode(file_get_contents('php://input'), true);
        
        $stmt = $opsDb->prepare("
            INSERT INTO fsm_intake_submissions (workspace_id, template_id, contact_id, job_id, appointment_id, response_data, ip_address, user_agent)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ");
        
        $stmt->execute([
            $workspaceId,
            $data['template_id'],
            $data['contact_id'] ?? null,
            $data['job_id'] ?? null,
            $data['appointment_id'] ?? null,
            json_encode($data['response_data'] ?? []),
            $_SERVER['REMOTE_ADDR'] ?? null,
            $_SERVER['HTTP_USER_AGENT'] ?? null
        ]);
        
        echo json_encode(['success' => true, 'id' => $opsDb->lastInsertId()]);
        
    } elseif ($method === 'DELETE' && $id) {
        $stmt = $opsDb->prepare("DELETE FROM fsm_intake_submissions WHERE id = ? AND workspace_id = ?");
        $stmt->execute([$id, $workspaceId]);
        echo json_encode(['success' => true]);
        
    } else {
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
    }
}
