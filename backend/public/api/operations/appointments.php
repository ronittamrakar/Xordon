<?php
/**
 * Operations Appointments Handler
 * 
 * Handles CRUD operations for appointments/bookings.
 * Contact data is hydrated from the main database.
 */

function hydrateAppointmentContacts($mainDb, $appointments, $workspaceId) {
    if (empty($appointments)) return $appointments;
    
    $contactIds = array_unique(array_filter(array_column($appointments, 'contact_id')));
    if (empty($contactIds)) return $appointments;
    
    $placeholders = implode(',', array_fill(0, count($contactIds), '?'));
    $stmt = $mainDb->prepare("
        SELECT id, first_name, last_name, email, phone 
        FROM contacts 
        WHERE id IN ($placeholders) AND workspace_id = ?
    ");
    $params = array_merge($contactIds, [$workspaceId]);
    $stmt->execute($params);
    $contacts = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    $contactMap = [];
    foreach ($contacts as $c) {
        $contactMap[$c['id']] = $c;
    }
    
    foreach ($appointments as &$apt) {
        if (!empty($apt['contact_id']) && isset($contactMap[$apt['contact_id']])) {
            $c = $contactMap[$apt['contact_id']];
            $apt['first_name'] = $c['first_name'];
            $apt['last_name'] = $c['last_name'];
            $apt['contact_email'] = $c['email'];
            $apt['contact_phone'] = $c['phone'];
        }
    }
    
    return $appointments;
}

function handleOperationsAppointments($opsDb, $mainDb, $method, $userId, $workspaceId, $id, $subResource) {
    // Handle sub-resources
    if ($id && $subResource === 'cancel' && $method === 'POST') {
        $data = json_decode(file_get_contents('php://input'), true);
        $stmt = $opsDb->prepare("UPDATE fsm_appointments SET status = 'cancelled', internal_notes = CONCAT(IFNULL(internal_notes, ''), '\nCancelled: ', ?) WHERE id = ? AND workspace_id = ?");
        $stmt->execute([$data['reason'] ?? 'No reason provided', $id, $workspaceId]);
        echo json_encode(['success' => true]);
        return;
    }
    
    if ($id && $subResource === 'reschedule' && $method === 'POST') {
        $data = json_decode(file_get_contents('php://input'), true);
        $stmt = $opsDb->prepare("UPDATE fsm_appointments SET scheduled_at = ?, status = 'rescheduled' WHERE id = ? AND workspace_id = ?");
        $stmt->execute([$data['new_scheduled_at'], $id, $workspaceId]);
        echo json_encode(['success' => true]);
        return;
    }
    
    if ($method === 'GET') {
        if ($id) {
            $stmt = $opsDb->prepare("
                SELECT a.*, bt.name as booking_type_name, bt.color
                FROM fsm_appointments a
                LEFT JOIN fsm_booking_types bt ON a.booking_type_id = bt.id
                WHERE a.id = ? AND a.workspace_id = ?
            ");
            $stmt->execute([$id, $workspaceId]);
            $apt = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if ($apt) {
                $apts = hydrateAppointmentContacts($mainDb, [$apt], $workspaceId);
                $apt = $apts[0];
            }
            
            echo json_encode($apt ?: ['error' => 'Not found']);
            return;
        }
        
        // List appointments
        $status = $_GET['status'] ?? null;
        $staffId = $_GET['staff_id'] ?? null;
        $dateFrom = $_GET['date_from'] ?? null;
        $dateTo = $_GET['date_to'] ?? null;
        
        $sql = "
            SELECT a.*, bt.name as booking_type_name, bt.color
            FROM fsm_appointments a
            LEFT JOIN fsm_booking_types bt ON a.booking_type_id = bt.id
            WHERE a.workspace_id = ?
        ";
        $params = [$workspaceId];
        
        if ($status) {
            $sql .= " AND a.status = ?";
            $params[] = $status;
        }
        if ($staffId) {
            $sql .= " AND a.staff_id = ?";
            $params[] = $staffId;
        }
        if ($dateFrom) {
            $sql .= " AND a.scheduled_at >= ?";
            $params[] = $dateFrom;
        }
        if ($dateTo) {
            $sql .= " AND a.scheduled_at <= ?";
            $params[] = $dateTo;
        }
        
        $sql .= " ORDER BY a.scheduled_at ASC";
        
        $stmt = $opsDb->prepare($sql);
        $stmt->execute($params);
        $appointments = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        $appointments = hydrateAppointmentContacts($mainDb, $appointments, $workspaceId);
        
        echo json_encode(['items' => $appointments]);
        
    } elseif ($method === 'POST') {
        $data = json_decode(file_get_contents('php://input'), true);
        
        // Calculate end_at
        $scheduledAt = new DateTime($data['scheduled_at']);
        $duration = $data['duration_minutes'] ?? 30;
        $endAt = clone $scheduledAt;
        $endAt->modify("+{$duration} minutes");
        
        $stmt = $opsDb->prepare("
            INSERT INTO fsm_appointments (
                workspace_id, user_id, contact_id, staff_id, service_id, job_id, booking_type_id,
                title, description, guest_name, guest_email, guest_phone,
                scheduled_at, duration_minutes, end_at, timezone,
                location_type, location, meeting_link, status, notes, internal_notes
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");
        
        $stmt->execute([
            $workspaceId,
            $userId,
            $data['contact_id'] ?? null,
            $data['staff_id'] ?? null,
            $data['service_id'] ?? null,
            $data['job_id'] ?? null,
            $data['booking_type_id'] ?? null,
            $data['title'],
            $data['description'] ?? null,
            $data['guest_name'] ?? null,
            $data['guest_email'] ?? null,
            $data['guest_phone'] ?? null,
            $data['scheduled_at'],
            $duration,
            $endAt->format('Y-m-d H:i:s'),
            $data['timezone'] ?? 'America/New_York',
            $data['location_type'] ?? 'in_person',
            $data['location'] ?? null,
            $data['meeting_link'] ?? null,
            $data['status'] ?? 'scheduled',
            $data['notes'] ?? null,
            $data['internal_notes'] ?? null
        ]);
        
        echo json_encode(['success' => true, 'id' => $opsDb->lastInsertId()]);
        
    } elseif ($method === 'PUT' && $id) {
        $data = json_decode(file_get_contents('php://input'), true);
        
        $fields = [];
        $params = [];
        
        $allowedFields = [
            'contact_id', 'staff_id', 'service_id', 'job_id', 'booking_type_id',
            'title', 'description', 'guest_name', 'guest_email', 'guest_phone',
            'scheduled_at', 'duration_minutes', 'timezone',
            'location_type', 'location', 'meeting_link', 'status', 'notes', 'internal_notes'
        ];
        
        foreach ($allowedFields as $field) {
            if (isset($data[$field])) {
                $fields[] = "$field = ?";
                $params[] = $data[$field];
            }
        }
        
        // Recalculate end_at if scheduled_at or duration changed
        if (isset($data['scheduled_at']) || isset($data['duration_minutes'])) {
            // Get current values
            $stmt = $opsDb->prepare("SELECT scheduled_at, duration_minutes FROM fsm_appointments WHERE id = ? AND workspace_id = ?");
            $stmt->execute([$id, $workspaceId]);
            $current = $stmt->fetch(PDO::FETCH_ASSOC);
            
            $scheduledAt = new DateTime($data['scheduled_at'] ?? $current['scheduled_at']);
            $duration = $data['duration_minutes'] ?? $current['duration_minutes'];
            $endAt = clone $scheduledAt;
            $endAt->modify("+{$duration} minutes");
            
            $fields[] = "end_at = ?";
            $params[] = $endAt->format('Y-m-d H:i:s');
        }
        
        if (!empty($fields)) {
            $params[] = $id;
            $params[] = $workspaceId;
            $stmt = $opsDb->prepare("UPDATE fsm_appointments SET " . implode(', ', $fields) . " WHERE id = ? AND workspace_id = ?");
            $stmt->execute($params);
        }
        
        echo json_encode(['success' => true]);
        
    } elseif ($method === 'DELETE' && $id) {
        $stmt = $opsDb->prepare("DELETE FROM fsm_appointments WHERE id = ? AND workspace_id = ?");
        $stmt->execute([$id, $workspaceId]);
        echo json_encode(['success' => true]);
        
    } else {
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
    }
}

function handleOperationsDashboardStats($opsDb, $method, $userId, $workspaceId) {
    if ($method !== 'GET') {
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
        return;
    }
    
    $now = new DateTime();
    $today = $now->format('Y-m-d');
    $weekStart = (clone $now)->modify('monday this week')->format('Y-m-d');
    $weekEnd = (clone $now)->modify('sunday this week')->format('Y-m-d');
    $monthStart = $now->format('Y-m-01');
    $monthEnd = $now->format('Y-m-t');
    
    // Upcoming appointments
    $stmt = $opsDb->prepare("SELECT COUNT(*) FROM fsm_appointments WHERE workspace_id = ? AND scheduled_at >= NOW() AND status NOT IN ('cancelled', 'completed')");
    $stmt->execute([$workspaceId]);
    $upcoming = $stmt->fetchColumn();
    
    // Today's appointments
    $stmt = $opsDb->prepare("SELECT COUNT(*) FROM fsm_appointments WHERE workspace_id = ? AND DATE(scheduled_at) = ?");
    $stmt->execute([$workspaceId, $today]);
    $todayCount = $stmt->fetchColumn();
    
    // This week
    $stmt = $opsDb->prepare("SELECT COUNT(*) FROM fsm_appointments WHERE workspace_id = ? AND DATE(scheduled_at) BETWEEN ? AND ?");
    $stmt->execute([$workspaceId, $weekStart, $weekEnd]);
    $thisWeek = $stmt->fetchColumn();
    
    // Completed this month
    $stmt = $opsDb->prepare("SELECT COUNT(*) FROM fsm_appointments WHERE workspace_id = ? AND status = 'completed' AND DATE(scheduled_at) BETWEEN ? AND ?");
    $stmt->execute([$workspaceId, $monthStart, $monthEnd]);
    $completedThisMonth = $stmt->fetchColumn();
    
    // Cancellation rate this month
    $stmt = $opsDb->prepare("SELECT COUNT(*) FROM fsm_appointments WHERE workspace_id = ? AND DATE(scheduled_at) BETWEEN ? AND ?");
    $stmt->execute([$workspaceId, $monthStart, $monthEnd]);
    $totalThisMonth = $stmt->fetchColumn();
    
    $stmt = $opsDb->prepare("SELECT COUNT(*) FROM fsm_appointments WHERE workspace_id = ? AND status = 'cancelled' AND DATE(scheduled_at) BETWEEN ? AND ?");
    $stmt->execute([$workspaceId, $monthStart, $monthEnd]);
    $cancelledThisMonth = $stmt->fetchColumn();
    
    $cancellationRate = $totalThisMonth > 0 ? round(($cancelledThisMonth / $totalThisMonth) * 100, 1) : 0;
    
    echo json_encode([
        'upcoming' => (int)$upcoming,
        'today' => (int)$todayCount,
        'this_week' => (int)$thisWeek,
        'completed_this_month' => (int)$completedThisMonth,
        'cancellation_rate' => $cancellationRate
    ]);
}
