<?php
/**
 * Operations Jobs Handler
 * 
 * Handles CRUD operations for jobs/dispatch.
 * Contact data is hydrated from the main database.
 */

/**
 * Hydrate contact information from main DB for a list of jobs
 */
function hydrateJobContacts($mainDb, $jobs, $workspaceId) {
    if (empty($jobs)) return $jobs;
    
    // Extract unique contact IDs
    $contactIds = array_unique(array_filter(array_column($jobs, 'contact_id')));
    if (empty($contactIds)) return $jobs;
    
    // Fetch contacts from main DB
    $placeholders = implode(',', array_fill(0, count($contactIds), '?'));
    $stmt = $mainDb->prepare("
        SELECT id, first_name, last_name, email, phone 
        FROM contacts 
        WHERE id IN ($placeholders) AND workspace_id = ?
    ");
    $params = array_merge($contactIds, [$workspaceId]);
    $stmt->execute($params);
    $contacts = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Index by ID
    $contactMap = [];
    foreach ($contacts as $c) {
        $contactMap[$c['id']] = $c;
    }
    
    // Merge into jobs
    foreach ($jobs as &$job) {
        if (!empty($job['contact_id']) && isset($contactMap[$job['contact_id']])) {
            $c = $contactMap[$job['contact_id']];
            $job['contact_email'] = $c['email'];
            $job['contact_first_name'] = $c['first_name'];
            $job['contact_last_name'] = $c['last_name'];
            $job['contact_phone'] = $c['phone'];
        }
    }
    
    return $jobs;
}

/**
 * Hydrate staff information for jobs
 */
function hydrateJobStaff($opsDb, $jobs, $workspaceId) {
    if (empty($jobs)) return $jobs;
    
    $staffIds = array_unique(array_filter(array_column($jobs, 'assigned_to')));
    if (empty($staffIds)) return $jobs;
    
    $placeholders = implode(',', array_fill(0, count($staffIds), '?'));
    $stmt = $opsDb->prepare("
        SELECT id, name, email, phone, color 
        FROM fsm_staff 
        WHERE id IN ($placeholders) AND workspace_id = ?
    ");
    $params = array_merge($staffIds, [$workspaceId]);
    $stmt->execute($params);
    $staff = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    $staffMap = [];
    foreach ($staff as $s) {
        $staffMap[$s['id']] = $s;
    }
    
    foreach ($jobs as &$job) {
        if (!empty($job['assigned_to']) && isset($staffMap[$job['assigned_to']])) {
            $job['assigned_staff_name'] = $staffMap[$job['assigned_to']]['name'];
        }
    }
    
    return $jobs;
}

function handleOperationsJobs($opsDb, $mainDb, $method, $userId, $workspaceId, $id, $subResource) {
    if ($method === 'GET') {
        // Get job status history
        if ($id && $subResource === 'history') {
            $stmt = $opsDb->prepare("SELECT * FROM fsm_job_status_history WHERE job_id = ? ORDER BY created_at DESC");
            $stmt->execute([$id]);
            echo json_encode(['items' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
            return;
        }
        
        // Get single job
        if ($id) {
            $stmt = $opsDb->prepare("
                SELECT j.* 
                FROM fsm_jobs j
                WHERE j.id = ? AND j.workspace_id = ?
            ");
            $stmt->execute([$id, $workspaceId]);
            $job = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if ($job) {
                // Hydrate contact
                $jobs = hydrateJobContacts($mainDb, [$job], $workspaceId);
                $jobs = hydrateJobStaff($opsDb, $jobs, $workspaceId);
                $job = $jobs[0];
                
                // Get line items
                $stmt = $opsDb->prepare("SELECT * FROM fsm_job_line_items WHERE job_id = ?");
                $stmt->execute([$id]);
                $job['line_items'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
                
                // Decode JSON fields
                $job['photos'] = json_decode($job['photos'] ?? '[]', true);
                $job['documents'] = json_decode($job['documents'] ?? '[]', true);
                $job['vehicle_info'] = json_decode($job['vehicle_info'] ?? '{}', true);
            }
            
            echo json_encode($job ?: ['error' => 'Not found']);
            return;
        }
        
        // List jobs with filters
        $status = $_GET['status'] ?? null;
        $assignedTo = $_GET['assigned_to'] ?? null;
        $date = $_GET['date'] ?? null;
        $priority = $_GET['priority'] ?? null;
        
        $sql = "SELECT j.* FROM fsm_jobs j WHERE j.workspace_id = ?";
        $params = [$workspaceId];
        
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
        
        $stmt = $opsDb->prepare($sql);
        $stmt->execute($params);
        $jobs = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Hydrate contacts and staff
        $jobs = hydrateJobContacts($mainDb, $jobs, $workspaceId);
        $jobs = hydrateJobStaff($opsDb, $jobs, $workspaceId);
        
        // Decode JSON fields
        foreach ($jobs as &$job) {
            $job['photos'] = json_decode($job['photos'] ?? '[]', true);
            $job['vehicle_info'] = json_decode($job['vehicle_info'] ?? '{}', true);
        }
        
        echo json_encode(['items' => $jobs]);
        
    } elseif ($method === 'POST') {
        $data = json_decode(file_get_contents('php://input'), true);
        
        // Generate job number
        $stmt = $opsDb->prepare("SELECT COUNT(*) FROM fsm_jobs WHERE workspace_id = ?");
        $stmt->execute([$workspaceId]);
        $count = $stmt->fetchColumn();
        $jobNumber = 'JOB-' . str_pad($count + 1, 5, '0', STR_PAD_LEFT);
        
        $stmt = $opsDb->prepare("
            INSERT INTO fsm_jobs (
                workspace_id, user_id, contact_id, company_id, service_id, assigned_to, campaign_id,
                job_number, title, description, status, priority, job_type,
                service_address, service_city, service_state, service_zip, service_lat, service_lng,
                scheduled_date, scheduled_time_start, scheduled_time_end, estimated_duration,
                pickup_address, pickup_lat, pickup_lng, dropoff_address, dropoff_lat, dropoff_lng, vehicle_info,
                estimated_cost, internal_notes, customer_notes, photos, source
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");
        
        $stmt->execute([
            $workspaceId,
            $userId,
            $data['contact_id'] ?? null,
            $data['company_id'] ?? null,
            $data['service_id'] ?? null,
            $data['assigned_to'] ?? null,
            $data['campaign_id'] ?? null,
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
            $data['estimated_duration'] ?? 60,
            $data['pickup_address'] ?? null,
            $data['pickup_lat'] ?? null,
            $data['pickup_lng'] ?? null,
            $data['dropoff_address'] ?? null,
            $data['dropoff_lat'] ?? null,
            $data['dropoff_lng'] ?? null,
            json_encode($data['vehicle_info'] ?? []),
            $data['estimated_cost'] ?? 0,
            $data['internal_notes'] ?? null,
            $data['customer_notes'] ?? null,
            json_encode($data['photos'] ?? []),
            $data['source'] ?? null
        ]);
        
        $jobId = $opsDb->lastInsertId();
        
        // Add initial status history
        $stmt = $opsDb->prepare("INSERT INTO fsm_job_status_history (job_id, status, notes, changed_by) VALUES (?, 'new', 'Job created', ?)");
        $stmt->execute([$jobId, $userId]);
        
        // Add line items
        if (!empty($data['line_items'])) {
            $stmt = $opsDb->prepare("INSERT INTO fsm_job_line_items (job_id, service_id, description, quantity, unit_price, total, item_type, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
            $sortOrder = 0;
            foreach ($data['line_items'] as $item) {
                $stmt->execute([
                    $jobId,
                    $item['service_id'] ?? null,
                    $item['description'],
                    $item['quantity'] ?? 1,
                    $item['unit_price'] ?? 0,
                    $item['total'] ?? (($item['quantity'] ?? 1) * ($item['unit_price'] ?? 0)),
                    $item['item_type'] ?? 'service',
                    $sortOrder++
                ]);
            }
        }
        
        echo json_encode(['success' => true, 'id' => $jobId, 'job_number' => $jobNumber]);
        
    } elseif ($method === 'PUT' && $id) {
        $data = json_decode(file_get_contents('php://input'), true);
        
        // Check if status changed
        $stmt = $opsDb->prepare("SELECT status FROM fsm_jobs WHERE id = ? AND workspace_id = ?");
        $stmt->execute([$id, $workspaceId]);
        $oldStatus = $stmt->fetchColumn();
        
        if ($oldStatus === false) {
            http_response_code(404);
            echo json_encode(['error' => 'Job not found']);
            return;
        }
        
        $fields = [];
        $params = [];
        
        $allowedFields = [
            'contact_id', 'company_id', 'service_id', 'assigned_to', 'title', 'description', 
            'status', 'priority', 'job_type', 'service_address', 'service_city', 'service_state', 
            'service_zip', 'service_lat', 'service_lng', 'scheduled_date', 'scheduled_time_start', 
            'scheduled_time_end', 'actual_start_time', 'actual_end_time', 'estimated_duration',
            'pickup_address', 'pickup_lat', 'pickup_lng', 'dropoff_address', 'dropoff_lat', 'dropoff_lng',
            'estimated_cost', 'actual_cost', 'deposit_paid', 'payment_status',
            'internal_notes', 'customer_notes', 'source'
        ];
        
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
            $params[] = $workspaceId;
            $stmt = $opsDb->prepare("UPDATE fsm_jobs SET " . implode(', ', $fields) . " WHERE id = ? AND workspace_id = ?");
            $stmt->execute($params);
        }
        
        // Add status history if status changed
        if (isset($data['status']) && $data['status'] !== $oldStatus) {
            $stmt = $opsDb->prepare("INSERT INTO fsm_job_status_history (job_id, status, notes, location_lat, location_lng, changed_by) VALUES (?, ?, ?, ?, ?, ?)");
            $stmt->execute([
                $id,
                $data['status'],
                $data['status_notes'] ?? null,
                $data['location_lat'] ?? null,
                $data['location_lng'] ?? null,
                $userId
            ]);
        }
        
        echo json_encode(['success' => true]);
        
    } elseif ($method === 'DELETE' && $id) {
        $stmt = $opsDb->prepare("DELETE FROM fsm_jobs WHERE id = ? AND workspace_id = ?");
        $stmt->execute([$id, $workspaceId]);
        echo json_encode(['success' => true]);
        
    } else {
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
    }
}
