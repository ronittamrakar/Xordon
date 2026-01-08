<?php
/**
 * Field Service Controller
 * GPS Tracking, Dispatch, and Technician Management
 */

require_once __DIR__ . '/../Database.php';
require_once __DIR__ . '/../Response.php';
require_once __DIR__ . '/../Auth.php';

class FieldServiceController {
    
    private static function getWorkspaceId(): int {
        $ctx = $GLOBALS['tenantContext'] ?? null;
        if ($ctx && isset($ctx->workspaceId)) {
            return (int)$ctx->workspaceId;
        }
        return 1;
    }

    // =====================================================
    // GPS LOCATION TRACKING
    // =====================================================

    /**
     * POST /field-service/location
     * Record GPS location
     */
    public static function recordLocation(): void {
        $userId = Auth::userIdOrFail();
        $pdo = Database::conn();
        $body = get_json_body();
        $workspaceId = self::getWorkspaceId();

        $latitude = $body['latitude'] ?? null;
        $longitude = $body['longitude'] ?? null;

        if ($latitude === null || $longitude === null) {
            Response::error('Latitude and longitude are required', 422);
            return;
        }

        $stmt = $pdo->prepare("
            INSERT INTO gps_location_logs (
                user_id, workspace_id, latitude, longitude, accuracy, 
                altitude, speed, heading, recorded_at, source, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?, NOW())
        ");
        $stmt->execute([
            $userId,
            $workspaceId,
            $latitude,
            $longitude,
            $body['accuracy'] ?? null,
            $body['altitude'] ?? null,
            $body['speed'] ?? null,
            $body['heading'] ?? null,
            $body['source'] ?? 'mobile'
        ]);

        // Update technician status with current location
        $stmt = $pdo->prepare("
            INSERT INTO technician_status (user_id, workspace_id, current_lat, current_lng, last_location_update)
            VALUES (?, ?, ?, ?, NOW())
            ON DUPLICATE KEY UPDATE 
                current_lat = VALUES(current_lat),
                current_lng = VALUES(current_lng),
                last_location_update = NOW()
        ");
        $stmt->execute([$userId, $workspaceId, $latitude, $longitude]);

        Response::json(['success' => true]);
    }

    /**
     * GET /field-service/locations
     * Get location history for a user
     */
    public static function getLocationHistory(): void {
        Auth::userIdOrFail();
        $pdo = Database::conn();
        $workspaceId = self::getWorkspaceId();

        $userId = $_GET['user_id'] ?? null;
        $startDate = $_GET['start_date'] ?? date('Y-m-d');
        $endDate = $_GET['end_date'] ?? date('Y-m-d');

        $where = ['workspace_id = ?'];
        $params = [$workspaceId];

        if ($userId) {
            $where[] = 'user_id = ?';
            $params[] = $userId;
        }

        $where[] = 'DATE(recorded_at) BETWEEN ? AND ?';
        $params[] = $startDate;
        $params[] = $endDate;

        $stmt = $pdo->prepare("
            SELECT * FROM gps_location_logs
            WHERE " . implode(' AND ', $where) . "
            ORDER BY recorded_at ASC
            LIMIT 1000
        ");
        $stmt->execute($params);
        $locations = $stmt->fetchAll();

        Response::json(['items' => $locations]);
    }

    // =====================================================
    // TECHNICIAN STATUS
    // =====================================================

    /**
     * GET /field-service/technicians
     * Get all technicians with their status
     */
    public static function getTechnicians(): void {
        Auth::userIdOrFail();
        $pdo = Database::conn();
        $workspaceId = self::getWorkspaceId();

        $stmt = $pdo->prepare("
            SELECT ts.*, u.name as user_name, u.email as user_email,
                   j.id as current_job_id, j.customer_name as current_job_customer
            FROM technician_status ts
            JOIN users u ON ts.user_id = u.id
            LEFT JOIN field_dispatch_jobs j ON ts.current_job_id = j.id
            WHERE ts.workspace_id = ?
            ORDER BY u.name ASC
        ");
        $stmt->execute([$workspaceId]);
        $technicians = $stmt->fetchAll();

        Response::json(['items' => $technicians]);
    }

    /**
     * PUT /field-service/technicians/{userId}/status
     * Update technician status
     */
    public static function updateTechnicianStatus(string $userId): void {
        Auth::userIdOrFail();
        $pdo = Database::conn();
        $body = get_json_body();
        $workspaceId = self::getWorkspaceId();

        $status = $body['status'] ?? 'available';
        $validStatuses = ['available', 'busy', 'on_break', 'offline', 'en_route'];
        if (!in_array($status, $validStatuses)) {
            Response::error('Invalid status', 422);
            return;
        }

        $stmt = $pdo->prepare("
            INSERT INTO technician_status (user_id, workspace_id, current_status, updated_at)
            VALUES (?, ?, ?, NOW())
            ON DUPLICATE KEY UPDATE 
                current_status = VALUES(current_status),
                updated_at = NOW()
        ");
        $stmt->execute([$userId, $workspaceId, $status]);

        Response::json(['success' => true, 'status' => $status]);
    }

    // =====================================================
    // DISPATCH JOBS
    // =====================================================

    /**
     * GET /field-service/jobs
     * Get dispatch jobs
     */
    public static function getJobs(): void {
        Auth::userIdOrFail();
        $pdo = Database::conn();
        $workspaceId = self::getWorkspaceId();

        $status = $_GET['status'] ?? null;
        $technicianId = $_GET['technician_id'] ?? null;
        $date = $_GET['date'] ?? null;

        $where = ['fdj.workspace_id = ?'];
        $params = [$workspaceId];

        if ($status) {
            $where[] = 'fdj.status = ?';
            $params[] = $status;
        }
        if ($technicianId) {
            $where[] = 'fdj.assigned_technician_id = ?';
            $params[] = $technicianId;
        }
        if ($date) {
            $where[] = 'DATE(fdj.scheduled_start) = ?';
            $params[] = $date;
        }

        $stmt = $pdo->prepare("
            SELECT fdj.*, u.name as technician_name
            FROM field_dispatch_jobs fdj
            LEFT JOIN users u ON fdj.assigned_technician_id = u.id
            WHERE " . implode(' AND ', $where) . "
            ORDER BY fdj.scheduled_start ASC
        ");
        $stmt->execute($params);
        $jobs = $stmt->fetchAll();

        Response::json(['items' => $jobs]);
    }

    /**
     * POST /field-service/jobs
     * Create a dispatch job
     */
    public static function createJob(): void {
        Auth::userIdOrFail();
        $pdo = Database::conn();
        $body = get_json_body();
        $workspaceId = self::getWorkspaceId();

        $stmt = $pdo->prepare("
            INSERT INTO field_dispatch_jobs (
                workspace_id, company_id, job_id, appointment_id, assigned_technician_id,
                status, priority, scheduled_start, scheduled_end,
                customer_name, customer_phone, service_address, service_lat, service_lng, notes,
                created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
        ");
        $stmt->execute([
            $workspaceId,
            $body['company_id'] ?? null,
            $body['job_id'] ?? null,
            $body['appointment_id'] ?? null,
            $body['assigned_technician_id'] ?? null,
            $body['status'] ?? 'pending',
            $body['priority'] ?? 'normal',
            $body['scheduled_start'] ?? null,
            $body['scheduled_end'] ?? null,
            $body['customer_name'] ?? null,
            $body['customer_phone'] ?? null,
            $body['service_address'] ?? null,
            $body['service_lat'] ?? null,
            $body['service_lng'] ?? null,
            $body['notes'] ?? null
        ]);

        $id = $pdo->lastInsertId();

        $stmt = $pdo->prepare("SELECT * FROM field_dispatch_jobs WHERE id = ?");
        $stmt->execute([$id]);
        $job = $stmt->fetch();

        Response::json($job, 201);
    }

    /**
     * PUT /field-service/jobs/{id}
     * Update a dispatch job
     */
    public static function updateJob(string $id): void {
        Auth::userIdOrFail();
        $pdo = Database::conn();
        $body = get_json_body();
        $workspaceId = self::getWorkspaceId();

        $updates = [];
        $params = [];

        $fields = [
            'assigned_technician_id', 'status', 'priority', 
            'scheduled_start', 'scheduled_end', 'actual_start', 'actual_end',
            'customer_name', 'customer_phone', 'service_address', 
            'service_lat', 'service_lng', 'notes'
        ];

        foreach ($fields as $field) {
            if (array_key_exists($field, $body)) {
                $updates[] = "$field = ?";
                $params[] = $body[$field];
            }
        }

        if (empty($updates)) {
            Response::error('No fields to update', 422);
            return;
        }

        $params[] = $id;
        $params[] = $workspaceId;

        $stmt = $pdo->prepare("
            UPDATE field_dispatch_jobs SET " . implode(', ', $updates) . "
            WHERE id = ? AND workspace_id = ?
        ");
        $stmt->execute($params);

        // If status changed to en_route or on_site, update technician status
        if (isset($body['status'])) {
            $stmt = $pdo->prepare("SELECT assigned_technician_id FROM field_dispatch_jobs WHERE id = ?");
            $stmt->execute([$id]);
            $job = $stmt->fetch();

            if ($job && $job['assigned_technician_id']) {
                $techStatus = 'busy';
                if ($body['status'] === 'en_route') $techStatus = 'en_route';
                if ($body['status'] === 'completed' || $body['status'] === 'cancelled') $techStatus = 'available';

                $stmt = $pdo->prepare("
                    UPDATE technician_status SET 
                        current_status = ?,
                        current_job_id = ?
                    WHERE user_id = ?
                ");
                $stmt->execute([
                    $techStatus,
                    $body['status'] === 'completed' || $body['status'] === 'cancelled' ? null : $id,
                    $job['assigned_technician_id']
                ]);
            }
        }

        $stmt = $pdo->prepare("SELECT * FROM field_dispatch_jobs WHERE id = ?");
        $stmt->execute([$id]);
        $job = $stmt->fetch();

        Response::json($job);
    }

    /**
     * POST /field-service/jobs/{id}/dispatch
     * Dispatch a job to a technician
     */
    public static function dispatchJob(string $id): void {
        Auth::userIdOrFail();
        $pdo = Database::conn();
        $body = get_json_body();
        $workspaceId = self::getWorkspaceId();

        $technicianId = $body['technician_id'] ?? null;
        if (!$technicianId) {
            Response::error('Technician ID is required', 422);
            return;
        }

        $stmt = $pdo->prepare("
            UPDATE field_dispatch_jobs 
            SET assigned_technician_id = ?, status = 'dispatched'
            WHERE id = ? AND workspace_id = ?
        ");
        $stmt->execute([$technicianId, $id, $workspaceId]);

        // Update technician status
        $stmt = $pdo->prepare("
            UPDATE technician_status 
            SET current_status = 'busy', current_job_id = ?
            WHERE user_id = ?
        ");
        $stmt->execute([$id, $technicianId]);

        $stmt = $pdo->prepare("SELECT * FROM field_dispatch_jobs WHERE id = ?");
        $stmt->execute([$id]);
        $job = $stmt->fetch();

        Response::json($job);
    }

    // =====================================================
    // SERVICE ZONES
    // =====================================================

    /**
     * GET /field-service/zones
     */
    public static function getZones(): void {
        Auth::userIdOrFail();
        $pdo = Database::conn();
        $workspaceId = self::getWorkspaceId();

        $stmt = $pdo->prepare("
            SELECT * FROM service_zones
            WHERE workspace_id = ?
            ORDER BY name ASC
        ");
        $stmt->execute([$workspaceId]);
        $zones = $stmt->fetchAll();

        // Decode zone_data JSON
        foreach ($zones as &$zone) {
            if ($zone['zone_data']) {
                $zone['zone_data'] = json_decode($zone['zone_data'], true);
            }
        }

        Response::json(['items' => $zones]);
    }

    /**
     * POST /field-service/zones
     */
    public static function createZone(): void {
        Auth::userIdOrFail();
        $pdo = Database::conn();
        $body = get_json_body();
        $workspaceId = self::getWorkspaceId();

        $name = trim($body['name'] ?? '');
        if (!$name) {
            Response::error('Name is required', 422);
            return;
        }

        $stmt = $pdo->prepare("
            INSERT INTO service_zones (
                workspace_id, name, description, zone_type, zone_data, 
                color, assigned_team_id, is_active, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
        ");
        $stmt->execute([
            $workspaceId,
            $name,
            $body['description'] ?? null,
            $body['zone_type'] ?? 'polygon',
            json_encode($body['zone_data'] ?? []),
            $body['color'] ?? '#3b82f6',
            $body['assigned_team_id'] ?? null,
            (int)($body['is_active'] ?? true)
        ]);

        $id = $pdo->lastInsertId();

        $stmt = $pdo->prepare("SELECT * FROM service_zones WHERE id = ?");
        $stmt->execute([$id]);
        $zone = $stmt->fetch();

        Response::json($zone, 201);
    }

    /**
     * PUT /field-service/zones/{id}
     */
    public static function updateZone(string $id): void {
        Auth::userIdOrFail();
        $pdo = Database::conn();
        $body = get_json_body();
        $workspaceId = self::getWorkspaceId();

        $updates = [];
        $params = [];

        $fields = ['name', 'description', 'zone_type', 'color', 'assigned_team_id', 'is_active'];

        foreach ($fields as $field) {
            if (isset($body[$field])) {
                $updates[] = "$field = ?";
                $params[] = $body[$field];
            }
        }

        if (isset($body['zone_data'])) {
            $updates[] = 'zone_data = ?';
            $params[] = json_encode($body['zone_data']);
        }

        if (empty($updates)) {
            Response::error('No fields to update', 422);
            return;
        }

        $params[] = $id;
        $params[] = $workspaceId;

        $stmt = $pdo->prepare("UPDATE service_zones SET " . implode(', ', $updates) . " WHERE id = ? AND workspace_id = ?");
        $stmt->execute($params);

        $stmt = $pdo->prepare("SELECT * FROM service_zones WHERE id = ?");
        $stmt->execute([$id]);
        $zone = $stmt->fetch();

        Response::json($zone);
    }

    /**
     * DELETE /field-service/zones/{id}
     */
    public static function deleteZone(string $id): void {
        Auth::userIdOrFail();
        $pdo = Database::conn();
        $workspaceId = self::getWorkspaceId();

        $stmt = $pdo->prepare("DELETE FROM service_zones WHERE id = ? AND workspace_id = ?");
        $stmt->execute([$id, $workspaceId]);

        Response::json(['success' => true]);
    }

    // =====================================================
    // ANALYTICS
    // =====================================================

    /**
     * GET /field-service/analytics
     */
    public static function getAnalytics(): void {
        Auth::userIdOrFail();
        $pdo = Database::conn();
        $workspaceId = self::getWorkspaceId();

        // Job stats
        $stmt = $pdo->prepare("
            SELECT 
                COUNT(*) as total_jobs,
                SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_jobs,
                SUM(CASE WHEN status = 'dispatched' THEN 1 ELSE 0 END) as dispatched_jobs,
                SUM(CASE WHEN status = 'en_route' THEN 1 ELSE 0 END) as en_route_jobs,
                SUM(CASE WHEN status = 'on_site' THEN 1 ELSE 0 END) as on_site_jobs,
                SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_jobs,
                AVG(TIMESTAMPDIFF(MINUTE, scheduled_start, actual_end)) as avg_duration_minutes
            FROM field_dispatch_jobs
            WHERE workspace_id = ? AND DATE(scheduled_start) = CURDATE()
        ");
        $stmt->execute([$workspaceId]);
        $jobStats = $stmt->fetch();

        // Technician availability
        $stmt = $pdo->prepare("
            SELECT 
                COUNT(*) as total_technicians,
                SUM(CASE WHEN current_status = 'available' THEN 1 ELSE 0 END) as available,
                SUM(CASE WHEN current_status = 'busy' THEN 1 ELSE 0 END) as busy,
                SUM(CASE WHEN current_status = 'en_route' THEN 1 ELSE 0 END) as en_route,
                SUM(CASE WHEN current_status = 'offline' THEN 1 ELSE 0 END) as offline
            FROM technician_status
            WHERE workspace_id = ?
        ");
        $stmt->execute([$workspaceId]);
        $techStats = $stmt->fetch();

        Response::json([
            'jobs' => $jobStats,
            'technicians' => $techStats
        ]);
    }
}
