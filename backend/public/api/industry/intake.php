<?php
// Intake Forms API Handler

function handleIntakeForms($pdo, $userId, $method, $pathParts, $data) {
    $resource = $pathParts[0] ?? '';
    $id = $pathParts[1] ?? null;
    
    switch ($resource) {
        case 'templates':
            return handleIntakeTemplates($pdo, $userId, $method, $id, $data);
        case 'submissions':
            return handleIntakeSubmissions($pdo, $userId, $method, $id, $data);
        default:
            return handleIntakeTemplates($pdo, $userId, $method, $resource ?: null, $data);
    }
}

function handleIntakeTemplates($pdo, $userId, $method, $id, $data) {
    switch ($method) {
        case 'GET':
            if ($id) {
                $stmt = $pdo->prepare("SELECT * FROM intake_form_templates WHERE id = ? AND user_id = ?");
                $stmt->execute([$id, $userId]);
                $template = $stmt->fetch(PDO::FETCH_ASSOC);
                if (!$template) return ['error' => 'Template not found', 'status' => 404];
                $template['fields'] = json_decode($template['fields'] ?? '[]', true);
                $template['conditional_logic'] = json_decode($template['conditional_logic'] ?? '[]', true);
                return $template;
            }
            
            $where = ["user_id = ?"];
            $params = [$userId];
            
            if (!empty($data['industry'])) {
                $where[] = "industry_slug = ?";
                $params[] = $data['industry'];
            }
            if (!empty($data['is_active'])) {
                $where[] = "is_active = 1";
            }
            
            $sql = "SELECT * FROM intake_form_templates WHERE " . implode(" AND ", $where) . " ORDER BY name";
            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);
            $templates = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            foreach ($templates as &$t) {
                $t['fields'] = json_decode($t['fields'] ?? '[]', true);
            }
            
            return ['items' => $templates];
            
        case 'POST':
            $stmt = $pdo->prepare("INSERT INTO intake_form_templates 
                (user_id, industry_slug, name, description, fields, conditional_logic, is_active, created_at) 
                VALUES (?, ?, ?, ?, ?, ?, ?, NOW())");
            $stmt->execute([
                $userId,
                $data['industry_slug'] ?? null,
                $data['name'],
                $data['description'] ?? null,
                json_encode($data['fields'] ?? []),
                json_encode($data['conditional_logic'] ?? []),
                $data['is_active'] ?? 1
            ]);
            return ['id' => $pdo->lastInsertId(), 'message' => 'Template created'];
            
        case 'PUT':
            if (!$id) return ['error' => 'ID required', 'status' => 400];
            
            $updates = [];
            $params = [];
            
            foreach (['name', 'description', 'industry_slug', 'is_active'] as $field) {
                if (isset($data[$field])) {
                    $updates[] = "$field = ?";
                    $params[] = $data[$field];
                }
            }
            
            if (isset($data['fields'])) {
                $updates[] = "fields = ?";
                $params[] = json_encode($data['fields']);
            }
            if (isset($data['conditional_logic'])) {
                $updates[] = "conditional_logic = ?";
                $params[] = json_encode($data['conditional_logic']);
            }
            
            if (empty($updates)) return ['error' => 'No fields to update', 'status' => 400];
            
            $updates[] = "updated_at = NOW()";
            $params[] = $id;
            $params[] = $userId;
            
            $stmt = $pdo->prepare("UPDATE intake_form_templates SET " . implode(", ", $updates) . " WHERE id = ? AND user_id = ?");
            $stmt->execute($params);
            return ['message' => 'Template updated'];
            
        case 'DELETE':
            if (!$id) return ['error' => 'ID required', 'status' => 400];
            $stmt = $pdo->prepare("DELETE FROM intake_form_templates WHERE id = ? AND user_id = ?");
            $stmt->execute([$id, $userId]);
            return ['message' => 'Template deleted'];
    }
    
    return ['error' => 'Method not allowed', 'status' => 405];
}

function handleIntakeSubmissions($pdo, $userId, $method, $id, $data) {
    switch ($method) {
        case 'GET':
            if ($id) {
                $stmt = $pdo->prepare("SELECT s.*, t.name as template_name, c.first_name, c.last_name, c.email 
                    FROM intake_form_submissions s
                    LEFT JOIN intake_form_templates t ON s.template_id = t.id
                    LEFT JOIN contacts c ON s.contact_id = c.id
                    WHERE s.id = ? AND s.user_id = ?");
                $stmt->execute([$id, $userId]);
                $submission = $stmt->fetch(PDO::FETCH_ASSOC);
                if (!$submission) return ['error' => 'Submission not found', 'status' => 404];
                $submission['form_data'] = json_decode($submission['form_data'] ?? '{}', true);
                return $submission;
            }
            
            $where = ["s.user_id = ?"];
            $params = [$userId];
            
            if (!empty($data['template_id'])) {
                $where[] = "s.template_id = ?";
                $params[] = $data['template_id'];
            }
            if (!empty($data['contact_id'])) {
                $where[] = "s.contact_id = ?";
                $params[] = $data['contact_id'];
            }
            if (!empty($data['status'])) {
                $where[] = "s.status = ?";
                $params[] = $data['status'];
            }
            
            $sql = "SELECT s.*, t.name as template_name, c.first_name, c.last_name, c.email 
                FROM intake_form_submissions s
                LEFT JOIN intake_form_templates t ON s.template_id = t.id
                LEFT JOIN contacts c ON s.contact_id = c.id
                WHERE " . implode(" AND ", $where) . " ORDER BY s.submitted_at DESC";
            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);
            $submissions = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            foreach ($submissions as &$s) {
                $s['form_data'] = json_decode($s['form_data'] ?? '{}', true);
            }
            
            return ['items' => $submissions];
            
        case 'POST':
            $stmt = $pdo->prepare("INSERT INTO intake_form_submissions 
                (user_id, template_id, contact_id, form_data, status, submitted_at) 
                VALUES (?, ?, ?, ?, ?, NOW())");
            $stmt->execute([
                $userId,
                $data['template_id'],
                $data['contact_id'] ?? null,
                json_encode($data['form_data'] ?? []),
                $data['status'] ?? 'pending'
            ]);
            return ['id' => $pdo->lastInsertId(), 'message' => 'Submission created'];
            
        case 'PUT':
            if (!$id) return ['error' => 'ID required', 'status' => 400];
            
            $updates = [];
            $params = [];
            
            if (isset($data['status'])) {
                $updates[] = "status = ?";
                $params[] = $data['status'];
            }
            if (isset($data['form_data'])) {
                $updates[] = "form_data = ?";
                $params[] = json_encode($data['form_data']);
            }
            if (isset($data['reviewed_at'])) {
                $updates[] = "reviewed_at = ?";
                $params[] = $data['reviewed_at'];
            }
            
            if (empty($updates)) return ['error' => 'No fields to update', 'status' => 400];
            
            $params[] = $id;
            $params[] = $userId;
            
            $stmt = $pdo->prepare("UPDATE intake_form_submissions SET " . implode(", ", $updates) . " WHERE id = ? AND user_id = ?");
            $stmt->execute($params);
            return ['message' => 'Submission updated'];
            
        case 'DELETE':
            if (!$id) return ['error' => 'ID required', 'status' => 400];
            $stmt = $pdo->prepare("DELETE FROM intake_form_submissions WHERE id = ? AND user_id = ?");
            $stmt->execute([$id, $userId]);
            return ['message' => 'Submission deleted'];
    }
    
    return ['error' => 'Method not allowed', 'status' => 405];
}
