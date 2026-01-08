<?php
/**
 * Industry Types & Settings Handlers
 */

function handleIndustryTypes($db, $method, $id) {
    if ($method === 'GET') {
        if ($id) {
            $stmt = $db->prepare("SELECT * FROM industry_types WHERE id = ?");
            $stmt->execute([$id]);
            $type = $stmt->fetch(PDO::FETCH_ASSOC);
            echo json_encode($type ?: ['error' => 'Not found']);
        } else {
            $stmt = $db->query("SELECT * FROM industry_types WHERE is_active = 1 ORDER BY name");
            echo json_encode(['items' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
        }
    } else {
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
    }
}

function handleUserIndustrySettings($db, $method, $userId, $id) {
    if ($method === 'GET') {
        $stmt = $db->prepare("
            SELECT uis.*, it.slug, it.name as industry_name, it.icon, it.color
            FROM user_industry_settings uis
            JOIN industry_types it ON uis.industry_type_id = it.id
            WHERE uis.user_id = ?
        ");
        $stmt->execute([$userId]);
        $settings = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode(['items' => $settings]);
    } elseif ($method === 'POST') {
        $data = json_decode(file_get_contents('php://input'), true);
        
        $stmt = $db->prepare("
            INSERT INTO user_industry_settings 
            (user_id, industry_type_id, business_name, business_phone, business_email, business_address, business_hours, service_area, license_number, insurance_info, custom_settings)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
            business_name = VALUES(business_name),
            business_phone = VALUES(business_phone),
            business_email = VALUES(business_email),
            business_address = VALUES(business_address),
            business_hours = VALUES(business_hours),
            service_area = VALUES(service_area),
            license_number = VALUES(license_number),
            insurance_info = VALUES(insurance_info),
            custom_settings = VALUES(custom_settings)
        ");
        
        $stmt->execute([
            $userId,
            $data['industry_type_id'],
            $data['business_name'] ?? null,
            $data['business_phone'] ?? null,
            $data['business_email'] ?? null,
            $data['business_address'] ?? null,
            json_encode($data['business_hours'] ?? []),
            $data['service_area'] ?? null,
            $data['license_number'] ?? null,
            $data['insurance_info'] ?? null,
            json_encode($data['custom_settings'] ?? [])
        ]);
        
        echo json_encode(['success' => true, 'id' => $db->lastInsertId()]);
    } else {
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
    }
}

function handlePipelineTemplates($db, $method, $id) {
    if ($method === 'GET') {
        if ($id) {
            $stmt = $db->prepare("SELECT * FROM industry_pipeline_templates WHERE industry_type_id = ?");
            $stmt->execute([$id]);
        } else {
            $stmt = $db->query("SELECT ipt.*, it.name as industry_name FROM industry_pipeline_templates ipt JOIN industry_types it ON ipt.industry_type_id = it.id");
        }
        $templates = $stmt->fetchAll(PDO::FETCH_ASSOC);
        foreach ($templates as &$t) {
            $t['stages'] = json_decode($t['stages'], true);
        }
        echo json_encode(['items' => $templates]);
    } else {
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
    }
}

function handlePlaybooks($db, $method, $userId, $id) {
    if ($method === 'GET') {
        $industryId = $_GET['industry_type_id'] ?? null;
        $category = $_GET['category'] ?? null;
        $type = $_GET['type'] ?? null;
        
        $sql = "SELECT pt.*, it.name as industry_name FROM playbook_templates pt LEFT JOIN industry_types it ON pt.industry_type_id = it.id WHERE 1=1";
        $params = [];
        
        if ($industryId) {
            $sql .= " AND (pt.industry_type_id = ? OR pt.industry_type_id IS NULL)";
            $params[] = $industryId;
        }
        if ($category) {
            $sql .= " AND pt.category = ?";
            $params[] = $category;
        }
        if ($type) {
            $sql .= " AND pt.template_type = ?";
            $params[] = $type;
        }
        
        $sql .= " ORDER BY pt.is_featured DESC, pt.usage_count DESC";
        
        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        $playbooks = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        foreach ($playbooks as &$p) {
            $p['template_data'] = json_decode($p['template_data'], true);
        }
        
        echo json_encode(['items' => $playbooks]);
    } else {
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
    }
}

function handleSpeedToLead($db, $method, $userId) {
    if ($method === 'GET') {
        $stmt = $db->prepare("SELECT * FROM speed_to_lead_settings WHERE user_id = ?");
        $stmt->execute([$userId]);
        $settings = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($settings) {
            $settings['business_hours'] = json_decode($settings['business_hours'] ?? '{}', true);
            $settings['assigned_staff_ids'] = json_decode($settings['assigned_staff_ids'] ?? '[]', true);
        } else {
            $settings = [
                'is_enabled' => true,
                'auto_call_new_leads' => false,
                'auto_sms_new_leads' => true,
                'new_lead_delay_seconds' => 30,
                'missed_call_auto_sms' => true,
                'missed_call_delay_seconds' => 60,
                'respect_business_hours' => true,
                'round_robin_enabled' => false
            ];
        }
        
        echo json_encode($settings);
    } elseif ($method === 'POST' || $method === 'PUT') {
        $data = json_decode(file_get_contents('php://input'), true);
        
        $stmt = $db->prepare("
            INSERT INTO speed_to_lead_settings 
            (user_id, is_enabled, auto_call_new_leads, auto_sms_new_leads, new_lead_sms_template_id, new_lead_delay_seconds,
             missed_call_auto_sms, missed_call_sms_template_id, missed_call_delay_seconds,
             respect_business_hours, business_hours, after_hours_sms_template_id,
             round_robin_enabled, assigned_staff_ids)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
            is_enabled = VALUES(is_enabled),
            auto_call_new_leads = VALUES(auto_call_new_leads),
            auto_sms_new_leads = VALUES(auto_sms_new_leads),
            new_lead_sms_template_id = VALUES(new_lead_sms_template_id),
            new_lead_delay_seconds = VALUES(new_lead_delay_seconds),
            missed_call_auto_sms = VALUES(missed_call_auto_sms),
            missed_call_sms_template_id = VALUES(missed_call_sms_template_id),
            missed_call_delay_seconds = VALUES(missed_call_delay_seconds),
            respect_business_hours = VALUES(respect_business_hours),
            business_hours = VALUES(business_hours),
            after_hours_sms_template_id = VALUES(after_hours_sms_template_id),
            round_robin_enabled = VALUES(round_robin_enabled),
            assigned_staff_ids = VALUES(assigned_staff_ids)
        ");
        
        $stmt->execute([
            $userId,
            $data['is_enabled'] ?? true,
            $data['auto_call_new_leads'] ?? false,
            $data['auto_sms_new_leads'] ?? true,
            $data['new_lead_sms_template_id'] ?? null,
            $data['new_lead_delay_seconds'] ?? 30,
            $data['missed_call_auto_sms'] ?? true,
            $data['missed_call_sms_template_id'] ?? null,
            $data['missed_call_delay_seconds'] ?? 60,
            $data['respect_business_hours'] ?? true,
            json_encode($data['business_hours'] ?? []),
            $data['after_hours_sms_template_id'] ?? null,
            $data['round_robin_enabled'] ?? false,
            json_encode($data['assigned_staff_ids'] ?? [])
        ]);
        
        echo json_encode(['success' => true]);
    } else {
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
    }
}
