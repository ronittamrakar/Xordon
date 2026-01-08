<?php
/**
 * GPS Tracking Controller
 * Comprehensive GPS tracking, ETA calculations, and route optimization
 */

require_once __DIR__ . '/../Database.php';
require_once __DIR__ . '/../Response.php';
require_once __DIR__ . '/../Auth.php';

class GPSTrackingController {
    
    private static function getWorkspaceId(): int {
        $ctx = $GLOBALS['tenantContext'] ?? null;
        if ($ctx && isset($ctx->workspaceId)) {
            return (int)$ctx->workspaceId;
        }
        return 1;
    }

    // =====================================================
    // TRACKED ENTITIES
    // =====================================================

    /**
     * GET /gps/entities
     * List all tracked entities
     */
    public static function listTrackedEntities(): void {
        Auth::userIdOrFail();
        $pdo = Database::conn();
        $workspaceId = self::getWorkspaceId();

        $type = $_GET['type'] ?? null;
        $status = $_GET['status'] ?? null;

        // Get technicians with their current status
        $where = ['ts.workspace_id = ?'];
        $params = [$workspaceId];

        if ($status) {
            $where[] = 'ts.current_status = ?';
            $params[] = $status;
        }

        $stmt = $pdo->prepare("
            SELECT 
                CONCAT('user_', ts.user_id) as id,
                ts.workspace_id,
                'user' as type,
                u.name,
                ts.user_id,
                ts.current_status as status,
                ts.current_lat as current_location_lat,
                ts.current_lng as current_location_lng,
                ts.last_location_update as last_seen_at,
                1 as tracking_enabled,
                NULL as battery_level
            FROM technician_status ts
            JOIN users u ON ts.user_id = u.id
            WHERE " . implode(' AND ', $where) . "
            ORDER BY u.name ASC
        ");
        $stmt->execute($params);
        $entities = $stmt->fetchAll();

        Response::json($entities);
    }

    /**
     * GET /gps/technicians/locations
     * Get all technician locations for dispatcher view
     */
    public static function getAllTechnicianLocations(): void {
        Auth::userIdOrFail();
        $pdo = Database::conn();
        $workspaceId = self::getWorkspaceId();

        $stmt = $pdo->prepare("
            SELECT 
                CONCAT('user_', ts.user_id) as entity_id,
                ts.user_id,
                u.name,
                ts.current_lat as latitude,
                ts.current_lng as longitude,
                ts.last_location_update as timestamp,
                ts.current_status as status
            FROM technician_status ts
            JOIN users u ON ts.user_id = u.id
            WHERE ts.workspace_id = ? 
              AND ts.current_lat IS NOT NULL 
              AND ts.current_lng IS NOT NULL
            ORDER BY u.name ASC
        ");
        $stmt->execute([$workspaceId]);
        $locations = $stmt->fetchAll();

        Response::json($locations);
    }

    /**
     * GET /gps/entities/{id}/location
     * Get current location of an entity
     */
    public static function getCurrentLocation(string $id): void {
        Auth::userIdOrFail();
        $pdo = Database::conn();
        $workspaceId = self::getWorkspaceId();

        // Extract user ID from entity ID (format: user_123)
        $userId = (int)str_replace('user_', '', $id);

        $stmt = $pdo->prepare("
            SELECT 
                current_lat as latitude,
                current_lng as longitude,
                last_location_update as timestamp
            FROM technician_status
            WHERE user_id = ? AND workspace_id = ?
        ");
        $stmt->execute([$userId, $workspaceId]);
        $location = $stmt->fetch();

        if (!$location) {
            Response::error('Location not found', 404);
            return;
        }

        Response::json($location);
    }

    /**
     * GET /gps/entities/{id}/history
     * Get location history for an entity
     */
    public static function getLocationHistory(string $id): void {
        Auth::userIdOrFail();
        $pdo = Database::conn();
        $workspaceId = self::getWorkspaceId();

        $userId = (int)str_replace('user_', '', $id);
        $start = $_GET['start'] ?? date('Y-m-d 00:00:00');
        $end = $_GET['end'] ?? date('Y-m-d 23:59:59');

        $stmt = $pdo->prepare("
            SELECT 
                latitude,
                longitude,
                accuracy,
                altitude,
                speed,
                heading,
                recorded_at as timestamp
            FROM gps_location_logs
            WHERE user_id = ? 
              AND workspace_id = ? 
              AND recorded_at BETWEEN ? AND ?
            ORDER BY recorded_at ASC
            LIMIT 1000
        ");
        $stmt->execute([$userId, $workspaceId, $start, $end]);
        $locations = $stmt->fetchAll();

        // Calculate distance traveled
        $distance = 0;
        for ($i = 1; $i < count($locations); $i++) {
            $distance += self::calculateDistance(
                $locations[$i-1]['latitude'],
                $locations[$i-1]['longitude'],
                $locations[$i]['latitude'],
                $locations[$i]['longitude']
            );
        }

        $duration = 0;
        if (count($locations) > 1) {
            $startTime = strtotime($locations[0]['timestamp']);
            $endTime = strtotime($locations[count($locations)-1]['timestamp']);
            $duration = ($endTime - $startTime) / 60; // minutes
        }

        Response::json([
            'entity_id' => $id,
            'locations' => $locations,
            'distance_traveled_km' => round($distance, 2),
            'duration_minutes' => round($duration)
        ]);
    }

    // =====================================================
    // ETA & CUSTOMER NOTIFICATIONS
    // =====================================================

    /**
     * POST /gps/eta/calculate
     * Calculate ETA for a technician to a destination
     */
    public static function calculateETA(): void {
        Auth::userIdOrFail();
        $pdo = Database::conn();
        $body = get_json_body();
        $workspaceId = self::getWorkspaceId();

        $technicianId = $body['technician_id'] ?? null;
        $destination = $body['destination'] ?? null;

        if (!$technicianId || !$destination) {
            Response::error('Technician ID and destination are required', 422);
            return;
        }

        // Get technician current location
        $stmt = $pdo->prepare("
            SELECT ts.*, u.name as technician_name
            FROM technician_status ts
            JOIN users u ON ts.user_id = u.id
            WHERE ts.user_id = ? AND ts.workspace_id = ?
        ");
        $stmt->execute([$technicianId, $workspaceId]);
        $tech = $stmt->fetch();

        if (!$tech || !$tech['current_lat'] || !$tech['current_lng']) {
            Response::error('Technician location not available', 404);
            return;
        }

        // Parse destination
        $destLat = $destination['latitude'] ?? null;
        $destLng = $destination['longitude'] ?? null;

        if (!$destLat || !$destLng) {
            Response::error('Invalid destination coordinates', 422);
            return;
        }

        // Calculate distance and ETA
        $distance = self::calculateDistance(
            $tech['current_lat'],
            $tech['current_lng'],
            $destLat,
            $destLng
        );

        // Assume average speed of 40 km/h in city
        $durationMinutes = ($distance / 40) * 60;
        $eta = date('Y-m-d H:i:s', time() + ($durationMinutes * 60));

        Response::json([
            'technician_id' => $technicianId,
            'technician_name' => $tech['technician_name'],
            'current_location' => [
                'latitude' => $tech['current_lat'],
                'longitude' => $tech['current_lng'],
                'timestamp' => $tech['last_location_update']
            ],
            'destination' => [
                'latitude' => $destLat,
                'longitude' => $destLng
            ],
            'estimated_arrival' => $eta,
            'distance_remaining_km' => round($distance, 2),
            'duration_remaining_minutes' => round($durationMinutes),
            'traffic_conditions' => 'moderate'
        ]);
    }

    /**
     * GET /gps/jobs/{jobId}/eta
     * Get ETA for a specific job
     */
    public static function getJobETA(string $jobId): void {
        Auth::userIdOrFail();
        $pdo = Database::conn();
        $workspaceId = self::getWorkspaceId();

        $stmt = $pdo->prepare("
            SELECT * FROM field_dispatch_jobs
            WHERE id = ? AND workspace_id = ?
        ");
        $stmt->execute([$jobId, $workspaceId]);
        $job = $stmt->fetch();

        if (!$job || !$job['assigned_technician_id']) {
            Response::json(null);
            return;
        }

        if (!$job['service_lat'] || !$job['service_lng']) {
            Response::json(null);
            return;
        }

        // Get technician location
        $stmt = $pdo->prepare("
            SELECT ts.*, u.name as technician_name
            FROM technician_status ts
            JOIN users u ON ts.user_id = u.id
            WHERE ts.user_id = ? AND ts.workspace_id = ?
        ");
        $stmt->execute([$job['assigned_technician_id'], $workspaceId]);
        $tech = $stmt->fetch();

        if (!$tech || !$tech['current_lat'] || !$tech['current_lng']) {
            Response::json(null);
            return;
        }

        $distance = self::calculateDistance(
            $tech['current_lat'],
            $tech['current_lng'],
            $job['service_lat'],
            $job['service_lng']
        );

        $durationMinutes = ($distance / 40) * 60;
        $eta = date('Y-m-d H:i:s', time() + ($durationMinutes * 60));

        Response::json([
            'technician_id' => $job['assigned_technician_id'],
            'technician_name' => $tech['technician_name'],
            'current_location' => [
                'latitude' => $tech['current_lat'],
                'longitude' => $tech['current_lng'],
                'timestamp' => $tech['last_location_update']
            ],
            'destination' => [
                'latitude' => $job['service_lat'],
                'longitude' => $job['service_lng']
            ],
            'estimated_arrival' => $eta,
            'distance_remaining_km' => round($distance, 2),
            'duration_remaining_minutes' => round($durationMinutes),
            'traffic_conditions' => 'moderate'
        ]);
    }

    /**
     * POST /gps/jobs/{jobId}/notify/en-route
     * Send "on my way" notification to customer
     */
    public static function sendEnRouteNotification(string $jobId): void {
        Auth::userIdOrFail();
        $pdo = Database::conn();
        $body = get_json_body();
        $workspaceId = self::getWorkspaceId();

        $via = $body['via'] ?? 'sms';
        $customMessage = $body['custom_message'] ?? null;
        $includeTrackingLink = $body['include_tracking_link'] ?? false;

        // Get job details
        $stmt = $pdo->prepare("
            SELECT * FROM field_dispatch_jobs
            WHERE id = ? AND workspace_id = ?
        ");
        $stmt->execute([$jobId, $workspaceId]);
        $job = $stmt->fetch();

        if (!$job) {
            Response::error('Job not found', 404);
            return;
        }

        // Calculate ETA
        $etaMinutes = 15; // Default
        if ($job['assigned_technician_id'] && $job['service_lat'] && $job['service_lng']) {
            $stmt = $pdo->prepare("
                SELECT current_lat, current_lng
                FROM technician_status
                WHERE user_id = ? AND workspace_id = ?
            ");
            $stmt->execute([$job['assigned_technician_id'], $workspaceId]);
            $tech = $stmt->fetch();

            if ($tech && $tech['current_lat'] && $tech['current_lng']) {
                $distance = self::calculateDistance(
                    $tech['current_lat'],
                    $tech['current_lng'],
                    $job['service_lat'],
                    $job['service_lng']
                );
                $etaMinutes = round(($distance / 40) * 60);
            }
        }

        // Create tracking link if requested
        $trackingLink = null;
        if ($includeTrackingLink) {
            $token = bin2hex(random_bytes(32));
            $expiresAt = date('Y-m-d H:i:s', time() + (24 * 3600)); // 24 hours

            $stmt = $pdo->prepare("
                INSERT INTO customer_tracking_links (workspace_id, job_id, token, expires_at)
                VALUES (?, ?, ?, ?)
            ");
            $stmt->execute([$workspaceId, $jobId, $token, $expiresAt]);

            $trackingLink = "https://yourdomain.com/track/{$token}";
        }

        // Log notification
        $message = $customMessage ?? "Your technician is on the way! ETA: {$etaMinutes} minutes.";
        
        $stmt = $pdo->prepare("
            INSERT INTO gps_customer_notifications 
            (workspace_id, job_id, notification_type, sent_via, message, eta_minutes, tracking_link)
            VALUES (?, ?, 'en_route', ?, ?, ?, ?)
        ");
        $stmt->execute([$workspaceId, $jobId, $via, $message, $etaMinutes, $trackingLink]);

        $notificationId = $pdo->lastInsertId();

        Response::json([
            'id' => $notificationId,
            'job_id' => $jobId,
            'type' => 'en_route',
            'sent_via' => $via,
            'sent_at' => date('Y-m-d H:i:s'),
            'eta' => $etaMinutes,
            'message' => $message,
            'tracking_link' => $trackingLink
        ], 201);
    }

    /**
     * GET /gps/jobs/{jobId}/tracking-link
     * Get customer tracking link for a job
     */
    public static function getCustomerTrackingLink(string $jobId): void {
        Auth::userIdOrFail();
        $pdo = Database::conn();
        $workspaceId = self::getWorkspaceId();

        $stmt = $pdo->prepare("
            SELECT token, expires_at
            FROM customer_tracking_links
            WHERE job_id = ? AND workspace_id = ? AND is_active = 1 AND expires_at > NOW()
            ORDER BY created_at DESC
            LIMIT 1
        ");
        $stmt->execute([$jobId, $workspaceId]);
        $link = $stmt->fetch();

        if (!$link) {
            // Create new link
            $token = bin2hex(random_bytes(32));
            $expiresAt = date('Y-m-d H:i:s', time() + (24 * 3600));

            $stmt = $pdo->prepare("
                INSERT INTO customer_tracking_links (workspace_id, job_id, token, expires_at)
                VALUES (?, ?, ?, ?)
            ");
            $stmt->execute([$workspaceId, $jobId, $token, $expiresAt]);

            Response::json([
                'url' => "https://yourdomain.com/track/{$token}",
                'expires_at' => $expiresAt
            ]);
            return;
        }

        Response::json([
            'url' => "https://yourdomain.com/track/{$link['token']}",
            'expires_at' => $link['expires_at']
        ]);
    }

    // =====================================================
    // ROUTE OPTIMIZATION
    // =====================================================

    /**
     * GET /gps/routes/daily/{technicianId}
     * Get daily route for a technician
     */
    public static function getDailyRoute(string $technicianId): void {
        Auth::userIdOrFail();
        $pdo = Database::conn();
        $workspaceId = self::getWorkspaceId();

        $date = $_GET['date'] ?? date('Y-m-d');

        $stmt = $pdo->prepare("
            SELECT 
                fdj.*,
                u.name as technician_name
            FROM field_dispatch_jobs fdj
            JOIN users u ON fdj.assigned_technician_id = u.id
            WHERE fdj.assigned_technician_id = ? 
              AND fdj.workspace_id = ?
              AND DATE(fdj.scheduled_start) = ?
            ORDER BY fdj.scheduled_start ASC
        ");
        $stmt->execute([$technicianId, $workspaceId, $date]);
        $jobs = $stmt->fetchAll();

        $route = [
            'id' => "route_{$technicianId}_{$date}",
            'date' => $date,
            'technician_id' => $technicianId,
            'technician_name' => $jobs[0]['technician_name'] ?? 'Unknown',
            'jobs' => array_map(function($job, $index) {
                return [
                    'job_id' => $job['id'],
                    'address' => $job['service_address'],
                    'scheduled_time' => $job['scheduled_start'],
                    'estimated_arrival' => $job['scheduled_start'],
                    'status' => $job['status'],
                    'order' => $index + 1
                ];
            }, $jobs, array_keys($jobs)),
            'total_distance_km' => 0,
            'total_duration_minutes' => 0,
            'optimized' => false
        ];

        Response::json($route);
    }

    // =====================================================
    // SETTINGS
    // =====================================================

    /**
     * GET /gps/settings
     * Get GPS settings
     */
    public static function getSettings(): void {
        Auth::userIdOrFail();
        
        Response::json([
            'enabled' => true,
            'default_update_interval_seconds' => 30,
            'auto_send_en_route_notification' => false,
            'auto_send_arriving_notification' => true,
            'arriving_notification_minutes' => 10,
            'customer_tracking_page_enabled' => true,
            'customer_tracking_page_branding' => [
                'logo_url' => null,
                'primary_color' => '#3b82f6',
                'message' => 'Your technician is on the way!'
            ]
        ]);
    }

    // =====================================================
    // HELPER METHODS
    // =====================================================

    /**
     * Calculate distance between two coordinates using Haversine formula
     * Returns distance in kilometers
     */
    private static function calculateDistance(float $lat1, float $lon1, float $lat2, float $lon2): float {
        $earthRadius = 6371; // km

        $dLat = deg2rad($lat2 - $lat1);
        $dLon = deg2rad($lon2 - $lon1);

        $a = sin($dLat/2) * sin($dLat/2) +
             cos(deg2rad($lat1)) * cos(deg2rad($lat2)) *
             sin($dLon/2) * sin($dLon/2);

        $c = 2 * atan2(sqrt($a), sqrt(1-$a));

        return $earthRadius * $c;
    }
}
