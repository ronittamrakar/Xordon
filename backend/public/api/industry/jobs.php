<?php
/**
 * Jobs & Dispatch Handlers
 */

function handleJobs($db, $method, $userId, $id, $subResource) {
    if ($method === 'GET') {
        if ($id && $subResource === 'history') {
            $stmt = $db->prepare("SELECT * FROM job_status_history WHERE job_id = ? ORDER BY created_at DESC");
            $stmt->execute([$id]);
            echo json_encode(['items' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
            return;
        }
        
        if ($id) {
            $stmt = $db->prepare("
                SELECT j.*, 
                       c.email as contact_email, c.first_name as contact_first_name, c.last_name as contact_last_name, c.phone as contact_phone,
                       s.name as service_name,
                       sm.name as assigned_staff_name
                FROM jobs j
                LEFT JOIN contacts c ON j.contact_id = c.id
                LEFT JOIN services s ON j.service_id = s.id
                LEFT JOIN staff_members sm ON j.assigned_to = sm.id
                WHERE j.id = ? AND j.user_id = ?
            ");
            $stmt->execute([$id, $userId]);
            $job = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if ($job) {
                $stmt = $db->prepare("SELECT * FROM job_line_items WHERE job_id = ?");
                $stmt->execute([$id]);
                $job['line_items'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
                $job['photos'] = json_decode($job['photos'] ?? '[]', true);
                $job['documents'] = json_decode($job['documents'] ?? '[]', true);
                $job['vehicle_info'] = json_decode($job['vehicle_info'] ?? '{}', true);
            }
            
            echo json_encode($job ?: ['error' => 'Not found']);
        } else {
            $status = $_GET['status'] ?? null;
            $assignedTo = $_GET['assigned_to'] ?? null;
            $date = $_GET['date'] ?? null;
            $priority = $_GET['priority'] ?? null;
            
            $sql = "
                SELECT j.*, 
                       c.email as contact_email, c.first_name as contact_first_name, c.last_name as contact_last_name, c.phone as contact_phone,
                       s.name as service_name,
                       sm.name as assigned_staff_name
                FROM jobs j
                LEFT JOIN contacts c ON j.contact_id = c.id
                LEFT JOIN services s ON j.service_id = s.id
                LEFT JOIN staff_members sm ON j.assigned_to = sm.id
                WHERE j.user_id = ?
            ";
            $params = [$userId];
            
            if ($status) {
                $sql .= " AND j.status = ?";
                $params[] = $status;
            }
            if ($assignedTo) {
                $sql .= " AND j.assigned_to = ?";
                $params[] = $assignedTo;
            }
            if ($date) {
                $sql .= " AND j.scheduled_date = ?";
                $params[] = $date;
            }
            if ($priority) {
                $sql .= " AND j.priority = ?";
                $params[] = $priority;
            }
            
            $sql .= " ORDER BY j.scheduled_date ASC, j.scheduled_time_start ASC";
            
            $stmt = $db->prepare($sql);
            $stmt->execute($params);
            $jobs = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            foreach ($jobs as &$job) {
                $job['photos'] = json_decode($job['photos'] ?? '[]', true);
                $job['vehicle_info'] = json_decode($job['vehicle_info'] ?? '{}', true);
            }
            
            echo json_encode(['items' => $jobs]);
        }
    } elseif ($method === 'POST') {
        $data = json_decode(file_get_contents('php://input'), true);
        
        // Generate job number
        $stmt = $db->prepare("SELECT COUNT(*) FROM jobs WHERE user_id = ?");
        $stmt->execute([$userId]);
        $count = $stmt->fetchColumn();
        $jobNumber = 'JOB-' . str_pad($count + 1, 5, '0', STR_PAD_LEFT);
        
        $stmt = $db->prepare("
            INSERT INTO jobs (user_id, contact_id, service_id, assigned_to, job_number, title, description, status, priority, job_type,
                service_address, service_city, service_state, service_zip, service_lat, service_lng,
                scheduled_date, scheduled_time_start, scheduled_time_end, estimated_duration,
                pickup_address, pickup_lat, pickup_lng, dropoff_address, dropoff_lat, dropoff_lng, vehicle_info,
                estimated_cost, internal_notes, customer_notes, photos, source, campaign_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");
        
        $stmt->execute([
            $userId,
            $data['contact_id'],
            $data['service_id'] ?? null,
            $data['assigned_to'] ?? null,
            $jobNumber,
            $data['title'],
            $data['description'] ?? null,
            $data['status'] ?? 'new',
            $data['priority'] ?? 'normal',
            $data['job_type'] ?? null,
            $data['service_address'] ?? null,
            $data['service_city'] ?? null,
            $data['service_state'] ?? null,
            $data['service_zip'] ?? null,
            $data['service_lat'] ?? null,
            $data['service_lng'] ?? null,
            $data['scheduled_date'] ?? null,
            $data['scheduled_time_start'] ?? null,
            $data['scheduled_time_end'] ?? null,
            $data['estimated_duration'] ?? null,
            $data['pickup_address'] ?? null,
            $data['pickup_lat'] ?? null,
            $data['pickup_lng'] ?? null,
            $data['dropoff_address'] ?? null,
            $data['dropoff_lat'] ?? null,
            $data['dropoff_lng'] ?? null,
            json_encode($data['vehicle_info'] ?? []),
            $data['estimated_cost'] ?? null,
            $data['internal_notes'] ?? null,
            $data['customer_notes'] ?? null,
            json_encode($data['photos'] ?? []),
            $data['source'] ?? null,
            $data['campaign_id'] ?? null
        ]);
        
        $jobId = $db->lastInsertId();
        
        // Add initial status history
        $stmt = $db->prepare("INSERT INTO job_status_history (job_id, status, notes) VALUES (?, 'new', 'Job created')");
        $stmt->execute([$jobId]);
        
        // Add line items
        if (!empty($data['line_items'])) {
            $stmt = $db->prepare("INSERT INTO job_line_items (job_id, description, quantity, unit_price, total, item_type) VALUES (?, ?, ?, ?, ?, ?)");
            foreach ($data['line_items'] as $item) {
                $stmt->execute([
                    $jobId,
                    $item['description'],
                    $item['quantity'] ?? 1,
                    $item['unit_price'] ?? 0,
                    $item['total'] ?? ($item['quantity'] * $item['unit_price']),
                    $item['item_type'] ?? 'service'
                ]);
            }
        }
        
        echo json_encode(['success' => true, 'id' => $jobId, 'job_number' => $jobNumber]);
    } elseif ($method === 'PUT' && $id) {
        $data = json_decode(file_get_contents('php://input'), true);
        
        // Check if status changed
        $stmt = $db->prepare("SELECT status FROM jobs WHERE id = ? AND user_id = ?");
        $stmt->execute([$id, $userId]);
        $oldStatus = $stmt->fetchColumn();
        
        $fields = [];
        $params = [];
        
        $allowedFields = ['contact_id', 'service_id', 'assigned_to', 'title', 'description', 'status', 'priority', 'job_type',
            'service_address', 'service_city', 'service_state', 'service_zip', 'service_lat', 'service_lng',
            'scheduled_date', 'scheduled_time_start', 'scheduled_time_end', 'actual_start_time', 'actual_end_time', 'estimated_duration',
            'pickup_address', 'pickup_lat', 'pickup_lng', 'dropoff_address', 'dropoff_lat', 'dropoff_lng',
            'estimated_cost', 'actual_cost', 'deposit_paid', 'payment_status',
            'internal_notes', 'customer_notes', 'source'];
        
        foreach ($allowedFields as $field) {
            if (isset($data[$field])) {
                $fields[] = "$field = ?";
                $params[] = $data[$field];
            }
        }
        
        if (isset($data['vehicle_info'])) {
            $fields[] = "vehicle_info = ?";
            $params[] = json_encode($data['vehicle_info']);
        }
        
        if (isset($data['photos'])) {
            $fields[] = "photos = ?";
            $params[] = json_encode($data['photos']);
        }
        
        if (!empty($fields)) {
            $params[] = $id;
            $params[] = $userId;
            $stmt = $db->prepare("UPDATE jobs SET " . implode(', ', $fields) . " WHERE id = ? AND user_id = ?");
            $stmt->execute($params);
        }
        
        // Add status history if status changed
        if (isset($data['status']) && $data['status'] !== $oldStatus) {
            $stmt = $db->prepare("INSERT INTO job_status_history (job_id, status, notes, location_lat, location_lng) VALUES (?, ?, ?, ?, ?)");
            $stmt->execute([
                $id,
                $data['status'],
                $data['status_notes'] ?? null,
                $data['location_lat'] ?? null,
                $data['location_lng'] ?? null
            ]);
        }
        
        echo json_encode(['success' => true]);
    } elseif ($method === 'DELETE' && $id) {
        $stmt = $db->prepare("DELETE FROM jobs WHERE id = ? AND user_id = ?");
        $stmt->execute([$id, $userId]);
        echo json_encode(['success' => true]);
    } else {
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
    }
}
