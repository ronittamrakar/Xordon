<?php
/**
 * Staff Controller
 * Manage staff members, availability, and services for scheduling
 */

require_once __DIR__ . '/../Database.php';
require_once __DIR__ . '/../Response.php';
require_once __DIR__ . '/../Auth.php';

class StaffController {
    private static function getWorkspaceId(): int {
        $ctx = $GLOBALS['tenantContext'] ?? null;
        if ($ctx && isset($ctx->workspaceId)) {
            return (int)$ctx->workspaceId;
        }
        throw new Exception('Workspace context required');
    }

    // ==================== STAFF MEMBERS ====================

    /**
     * List staff members
     */
    public static function index() {
        try {
            $workspaceId = self::getWorkspaceId();
            $db = Database::conn();

            $activeOnly = !isset($_GET['include_inactive']) || $_GET['include_inactive'] !== 'true';
            $where = $activeOnly ? 'AND is_active = 1' : '';

            $stmt = $db->prepare("
                SELECT s.*,
                    s.name as full_name,
                    SUBSTRING_INDEX(s.name, ' ', 1) as first_name,
                    CASE WHEN LOCATE(' ', s.name) > 0 THEN SUBSTRING(s.name, LOCATE(' ', s.name) + 1) ELSE '' END as last_name,
                    s.photo_url as avatar_url,
                    (SELECT COUNT(*) FROM staff_services ss WHERE ss.staff_id = s.id) as service_count,
                    (SELECT COUNT(*) FROM appointments a WHERE a.staff_id = s.id AND a.status = 'scheduled' AND a.scheduled_at > NOW()) as upcoming_appointments
                FROM staff_members s
                WHERE s.workspace_id = ? $where
                ORDER BY s.name
            ");
            $stmt->execute([$workspaceId]);
            $staff = $stmt->fetchAll(PDO::FETCH_ASSOC);

            return Response::json(['data' => $staff]);
        } catch (Exception $e) {
            return Response::error('Failed to fetch staff: ' . $e->getMessage());
        }
    }

    /**
     * Get single staff member with details
     */
    public static function show($id) {
        try {
            $workspaceId = self::getWorkspaceId();
            $db = Database::conn();

            $stmt = $db->prepare("
                SELECT *,
                SUBSTRING_INDEX(name, ' ', 1) as first_name,
                CASE WHEN LOCATE(' ', name) > 0 THEN SUBSTRING(name, LOCATE(' ', name) + 1) ELSE '' END as last_name,
                photo_url as avatar_url
                FROM staff_members 
                WHERE id = ? AND workspace_id = ?
            ");
            $stmt->execute([$id, $workspaceId]);
            $staff = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$staff) {
                return Response::error('Staff member not found', 404);
            }

            // Get availability
            $availStmt = $db->prepare("
                SELECT * FROM staff_availability 
                WHERE staff_id = ? 
                ORDER BY day_of_week, start_time
            ");
            $availStmt->execute([$id]);
            $staff['availability'] = $availStmt->fetchAll(PDO::FETCH_ASSOC);

            // Get services
            $servicesStmt = $db->prepare("
                SELECT ss.*, s.name as service_name, s.duration_minutes, s.price
                FROM staff_services ss
                JOIN services s ON s.id = ss.service_id
                WHERE ss.staff_id = ?
            ");
            $servicesStmt->execute([$id]);
            $staff['services'] = $servicesStmt->fetchAll(PDO::FETCH_ASSOC);

            return Response::json(['data' => $staff]);
        } catch (Exception $e) {
            return Response::error('Failed to fetch staff member: ' . $e->getMessage());
        }
    }

    /**
     * Create staff member
     */
    public static function create() {
        try {
            $workspaceId = self::getWorkspaceId();
            $db = Database::conn();
            $data = json_decode(file_get_contents('php://input'), true) ?? [];

            if (empty($data['first_name']) || empty($data['last_name'])) {
                return Response::error('first_name and last_name required', 400);
            }

            $stmt = $db->prepare("
                INSERT INTO staff_members 
                (workspace_id, user_id, name, email, phone, title, bio, 
                 photo_url, color, accepts_bookings, booking_page_url)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ");

            $name = trim($data['first_name'] . ' ' . $data['last_name']);

            $stmt->execute([
                $workspaceId,
                $data['user_id'] ?? null,
                $name,
                $data['email'] ?? null,
                $data['phone'] ?? null,
                $data['title'] ?? null,
                $data['bio'] ?? null,
                $data['avatar_url'] ?? null,
                $data['color'] ?? '#6366f1',
                $data['accepts_bookings'] ?? 1,
                $data['booking_page_url'] ?? null
            ]);

            $id = $db->lastInsertId();

            // Set default availability (Mon-Fri 9-5)
            $availStmt = $db->prepare("
                INSERT INTO staff_availability (staff_id, day_of_week, start_time, end_time, is_available)
                VALUES (?, ?, ?, ?, 1)
            ");
            for ($day = 1; $day <= 5; $day++) {
                $availStmt->execute([$id, $day, '09:00:00', '17:00:00']);
            }

            return Response::json(['data' => ['id' => (int)$id]]);
        } catch (Exception $e) {
            return Response::error('Failed to create staff member: ' . $e->getMessage());
        }
    }

    /**
     * Update staff member
     */
    public static function update($id) {
        try {
            $workspaceId = self::getWorkspaceId();
            $db = Database::conn();
            $data = json_decode(file_get_contents('php://input'), true) ?? [];

            // Verify ownership
            $checkStmt = $db->prepare("SELECT id FROM staff_members WHERE id = ? AND workspace_id = ?");
            $checkStmt->execute([$id, $workspaceId]);
            if (!$checkStmt->fetch()) {
                return Response::error('Staff member not found', 404);
            }

            $updates = [];
            $params = [];

            $allowedFields = [
                'user_id', 'first_name', 'last_name', 'email', 'phone', 'title', 'bio',
                'avatar_url', 'color', 'accepts_bookings', 'booking_page_url', 'is_active'
            ];
            
            // Handle name update if first/last name provided
            if (isset($data['first_name']) || isset($data['last_name'])) {
                // Fetch current name to merge if only one is provided? 
                // For simplicity, assume both or use current. 
                // Better: just construct name from what's available + what's in DB?
                // Let's assume frontend sends both for 'update'.
                // If not, we might overwrite part of name.
                // Safest is to fetch current name first.
                $currentName = $checkStmt->fetch()['name'] ?? '';
                $parts = explode(' ', $currentName);
                $curFirst = $parts[0] ?? '';
                $curLast = implode(' ', array_slice($parts, 1));
                
                $newFirst = $data['first_name'] ?? $curFirst;
                $newLast = $data['last_name'] ?? $curLast;
                $data['name'] = trim("$newFirst $newLast");
            }
            if (isset($data['avatar_url'])) {
                $data['photo_url'] = $data['avatar_url'];
            }

            $validDbFields = [
                'user_id', 'name', 'email', 'phone', 'title', 'bio',
                'photo_url', 'color', 'accepts_bookings', 'booking_page_url', 'is_active'
            ];

            foreach ($validDbFields as $field) {
                if (array_key_exists($field, $data)) {
                    $updates[] = "$field = ?";
                    $params[] = $data[$field];
                }
            }

            if (!empty($updates)) {
                $params[] = $id;
                $stmt = $db->prepare("UPDATE staff_members SET " . implode(', ', $updates) . " WHERE id = ?");
                $stmt->execute($params);
            }

            return Response::json(['success' => true]);
        } catch (Exception $e) {
            return Response::error('Failed to update staff member: ' . $e->getMessage());
        }
    }

    /**
     * Delete staff member
     */
    public static function delete($id) {
        try {
            $workspaceId = self::getWorkspaceId();
            $db = Database::conn();

            $stmt = $db->prepare("DELETE FROM staff_members WHERE id = ? AND workspace_id = ?");
            $stmt->execute([$id, $workspaceId]);

            return Response::json(['success' => true]);
        } catch (Exception $e) {
            return Response::error('Failed to delete staff member: ' . $e->getMessage());
        }
    }

    // ==================== AVAILABILITY ====================

    /**
     * Get staff availability
     */
    public static function getAvailability($staffId) {
        try {
            $workspaceId = self::getWorkspaceId();
            $db = Database::conn();

            // Verify staff belongs to workspace
            $checkStmt = $db->prepare("SELECT id FROM staff_members WHERE id = ? AND workspace_id = ?");
            $checkStmt->execute([$staffId, $workspaceId]);
            if (!$checkStmt->fetch()) {
                return Response::error('Staff member not found', 404);
            }

            $stmt = $db->prepare("
                SELECT * FROM staff_availability 
                WHERE staff_id = ? 
                ORDER BY day_of_week, start_time
            ");
            $stmt->execute([$staffId]);
            $availability = $stmt->fetchAll(PDO::FETCH_ASSOC);

            return Response::json(['data' => $availability]);
        } catch (Exception $e) {
            return Response::error('Failed to fetch availability: ' . $e->getMessage());
        }
    }

    /**
     * Set staff availability (replaces all)
     */
    public static function setAvailability($staffId) {
        try {
            $workspaceId = self::getWorkspaceId();
            $db = Database::conn();
            $data = json_decode(file_get_contents('php://input'), true) ?? [];

            // Verify staff belongs to workspace
            $checkStmt = $db->prepare("SELECT id FROM staff_members WHERE id = ? AND workspace_id = ?");
            $checkStmt->execute([$staffId, $workspaceId]);
            if (!$checkStmt->fetch()) {
                return Response::error('Staff member not found', 404);
            }

            if (!isset($data['availability']) || !is_array($data['availability'])) {
                return Response::error('availability array required', 400);
            }

            // Delete existing
            $db->prepare("DELETE FROM staff_availability WHERE staff_id = ?")->execute([$staffId]);

            // Insert new
            $stmt = $db->prepare("
                INSERT INTO staff_availability (staff_id, day_of_week, start_time, end_time, is_available)
                VALUES (?, ?, ?, ?, ?)
            ");

            foreach ($data['availability'] as $slot) {
                $stmt->execute([
                    $staffId,
                    $slot['day_of_week'],
                    $slot['start_time'],
                    $slot['end_time'],
                    $slot['is_available'] ?? 1
                ]);
            }

            return Response::json(['success' => true]);
        } catch (Exception $e) {
            return Response::error('Failed to set availability: ' . $e->getMessage());
        }
    }

    // ==================== TIME OFF ====================

    /**
     * Get staff time off
     */
    public static function getTimeOff($staffId) {
        try {
            $workspaceId = self::getWorkspaceId();
            $db = Database::conn();

            // Verify staff belongs to workspace
            $checkStmt = $db->prepare("SELECT id FROM staff_members WHERE id = ? AND workspace_id = ?");
            $checkStmt->execute([$staffId, $workspaceId]);
            if (!$checkStmt->fetch()) {
                return Response::error('Staff member not found', 404);
            }

            $from = $_GET['from'] ?? date('Y-m-d');
            $to = $_GET['to'] ?? date('Y-m-d', strtotime('+90 days'));

            $stmt = $db->prepare("
                SELECT * FROM staff_time_off 
                WHERE staff_id = ? AND end_datetime >= ? AND start_datetime <= ?
                ORDER BY start_datetime
            ");
            $stmt->execute([$staffId, $from, $to . ' 23:59:59']);
            $timeOff = $stmt->fetchAll(PDO::FETCH_ASSOC);

            return Response::json(['data' => $timeOff]);
        } catch (Exception $e) {
            return Response::error('Failed to fetch time off: ' . $e->getMessage());
        }
    }

    /**
     * Add time off
     */
    public static function addTimeOff($staffId) {
        try {
            $workspaceId = self::getWorkspaceId();
            $db = Database::conn();
            $data = json_decode(file_get_contents('php://input'), true) ?? [];

            // Verify staff belongs to workspace
            $checkStmt = $db->prepare("SELECT id FROM staff_members WHERE id = ? AND workspace_id = ?");
            $checkStmt->execute([$staffId, $workspaceId]);
            if (!$checkStmt->fetch()) {
                return Response::error('Staff member not found', 404);
            }

            if (empty($data['start_datetime']) || empty($data['end_datetime'])) {
                return Response::error('start_datetime and end_datetime required', 400);
            }

            $stmt = $db->prepare("
                INSERT INTO staff_time_off (staff_id, title, start_datetime, end_datetime, is_all_day, reason)
                VALUES (?, ?, ?, ?, ?, ?)
            ");

            $stmt->execute([
                $staffId,
                $data['title'] ?? null,
                $data['start_datetime'],
                $data['end_datetime'],
                $data['is_all_day'] ?? 0,
                $data['reason'] ?? null
            ]);

            $id = $db->lastInsertId();

            return Response::json(['data' => ['id' => (int)$id]]);
        } catch (Exception $e) {
            return Response::error('Failed to add time off: ' . $e->getMessage());
        }
    }

    /**
     * Delete time off
     */
    public static function deleteTimeOff($staffId, $timeOffId) {
        try {
            $workspaceId = self::getWorkspaceId();
            $db = Database::conn();

            // Verify staff belongs to workspace
            $checkStmt = $db->prepare("SELECT id FROM staff_members WHERE id = ? AND workspace_id = ?");
            $checkStmt->execute([$staffId, $workspaceId]);
            if (!$checkStmt->fetch()) {
                return Response::error('Staff member not found', 404);
            }

            $stmt = $db->prepare("DELETE FROM staff_time_off WHERE id = ? AND staff_id = ?");
            $stmt->execute([$timeOffId, $staffId]);

            return Response::json(['success' => true]);
        } catch (Exception $e) {
            return Response::error('Failed to delete time off: ' . $e->getMessage());
        }
    }

    // ==================== STAFF SERVICES ====================

    /**
     * Get services for a staff member
     */
    public static function getServices($staffId) {
        try {
            $workspaceId = self::getWorkspaceId();
            $db = Database::conn();

            $stmt = $db->prepare("
                SELECT ss.*, s.name, s.description, s.duration_minutes, s.price, s.price_type, s.color
                FROM staff_services ss
                JOIN services s ON s.id = ss.service_id
                JOIN staff_members sm ON sm.id = ss.staff_id
                WHERE ss.staff_id = ? AND sm.workspace_id = ?
            ");
            $stmt->execute([$staffId, $workspaceId]);
            $services = $stmt->fetchAll(PDO::FETCH_ASSOC);

            return Response::json(['data' => $services]);
        } catch (Exception $e) {
            return Response::error('Failed to fetch services: ' . $e->getMessage());
        }
    }

    /**
     * Assign services to staff member
     */
    public static function setServices($staffId) {
        try {
            $workspaceId = self::getWorkspaceId();
            $db = Database::conn();
            $data = json_decode(file_get_contents('php://input'), true) ?? [];

            // Verify staff belongs to workspace
            $checkStmt = $db->prepare("SELECT id FROM staff_members WHERE id = ? AND workspace_id = ?");
            $checkStmt->execute([$staffId, $workspaceId]);
            if (!$checkStmt->fetch()) {
                return Response::error('Staff member not found', 404);
            }

            if (!isset($data['service_ids']) || !is_array($data['service_ids'])) {
                return Response::error('service_ids array required', 400);
            }

            // Delete existing
            $db->prepare("DELETE FROM staff_services WHERE staff_id = ?")->execute([$staffId]);

            // Insert new
            $stmt = $db->prepare("
                INSERT INTO staff_services (staff_id, service_id, custom_duration_minutes, custom_price)
                VALUES (?, ?, ?, ?)
            ");

            foreach ($data['service_ids'] as $serviceId) {
                $customDuration = $data['custom_durations'][$serviceId] ?? null;
                $customPrice = $data['custom_prices'][$serviceId] ?? null;
                $stmt->execute([$staffId, $serviceId, $customDuration, $customPrice]);
            }

            return Response::json(['success' => true]);
        } catch (Exception $e) {
            return Response::error('Failed to set services: ' . $e->getMessage());
        }
    }

    // ==================== AVAILABLE SLOTS ====================

    /**
     * Get available booking slots for a staff member
     */
    public static function getAvailableSlots($staffId) {
        try {
            $workspaceId = self::getWorkspaceId();
            $db = Database::conn();

            $serviceId = $_GET['service_id'] ?? null;
            $date = $_GET['date'] ?? date('Y-m-d');
            $days = min((int)($_GET['days'] ?? 7), 30);

            // Get staff
            $staffStmt = $db->prepare("SELECT * FROM staff_members WHERE id = ? AND workspace_id = ? AND is_active = 1");
            $staffStmt->execute([$staffId, $workspaceId]);
            $staff = $staffStmt->fetch(PDO::FETCH_ASSOC);

            if (!$staff) {
                return Response::error('Staff member not found', 404);
            }

            // Get service duration
            $duration = 60;
            if ($serviceId) {
                $serviceStmt = $db->prepare("
                    SELECT COALESCE(ss.custom_duration_minutes, s.duration_minutes) as duration
                    FROM services s
                    LEFT JOIN staff_services ss ON ss.service_id = s.id AND ss.staff_id = ?
                    WHERE s.id = ? AND s.workspace_id = ?
                ");
                $serviceStmt->execute([$staffId, $serviceId, $workspaceId]);
                $service = $serviceStmt->fetch(PDO::FETCH_ASSOC);
                if ($service) {
                    $duration = (int)$service['duration'];
                }
            }

            // Get availability
            $availStmt = $db->prepare("SELECT * FROM staff_availability WHERE staff_id = ? AND is_available = 1");
            $availStmt->execute([$staffId]);
            $availability = [];
            while ($row = $availStmt->fetch(PDO::FETCH_ASSOC)) {
                $availability[$row['day_of_week']][] = $row;
            }

            // Get time off
            $endDate = date('Y-m-d', strtotime($date . " +$days days"));
            $timeOffStmt = $db->prepare("
                SELECT * FROM staff_time_off 
                WHERE staff_id = ? AND end_datetime >= ? AND start_datetime <= ?
            ");
            $timeOffStmt->execute([$staffId, $date, $endDate . ' 23:59:59']);
            $timeOff = $timeOffStmt->fetchAll(PDO::FETCH_ASSOC);

            // Get existing appointments
            $apptStmt = $db->prepare("
                SELECT scheduled_at as start_time, end_at as end_time FROM appointments 
                WHERE staff_id = ? AND status IN ('scheduled', 'confirmed')
                AND DATE(scheduled_at) BETWEEN ? AND ?
            ");
            $apptStmt->execute([$staffId, $date, $endDate]);
            $appointments = $apptStmt->fetchAll(PDO::FETCH_ASSOC);

            // Get booking settings
            $settingsStmt = $db->prepare("SELECT * FROM booking_settings WHERE workspace_id = ?");
            $settingsStmt->execute([$workspaceId]);
            $settings = $settingsStmt->fetch(PDO::FETCH_ASSOC) ?: [
                'min_notice_hours' => 1,
                'slot_interval_minutes' => 30
            ];

            // Generate available slots
            $slots = [];
            $slotInterval = (int)$settings['slot_interval_minutes'];
            $minNotice = (int)$settings['min_notice_hours'];
            $minTime = strtotime("+$minNotice hours");

            for ($i = 0; $i < $days; $i++) {
                $currentDate = date('Y-m-d', strtotime($date . " +$i days"));
                $dayOfWeek = (int)date('w', strtotime($currentDate));

                if (!isset($availability[$dayOfWeek])) {
                    continue;
                }

                $daySlots = [];

                foreach ($availability[$dayOfWeek] as $avail) {
                    $startTime = strtotime($currentDate . ' ' . $avail['start_time']);
                    $endTime = strtotime($currentDate . ' ' . $avail['end_time']);

                    for ($time = $startTime; $time + ($duration * 60) <= $endTime; $time += $slotInterval * 60) {
                        // Check minimum notice
                        if ($time < $minTime) {
                            continue;
                        }

                        // Check time off
                        $blocked = false;
                        foreach ($timeOff as $off) {
                            $offStart = strtotime($off['start_datetime']);
                            $offEnd = strtotime($off['end_datetime']);
                            if ($time < $offEnd && ($time + $duration * 60) > $offStart) {
                                $blocked = true;
                                break;
                            }
                        }
                        if ($blocked) continue;

                        // Check existing appointments
                        foreach ($appointments as $appt) {
                            $apptStart = strtotime($appt['start_time']);
                            $apptEnd = strtotime($appt['end_time']);
                            if ($time < $apptEnd && ($time + $duration * 60) > $apptStart) {
                                $blocked = true;
                                break;
                            }
                        }
                        if ($blocked) continue;

                        $daySlots[] = date('H:i', $time);
                    }
                }

                if (!empty($daySlots)) {
                    $slots[$currentDate] = $daySlots;
                }
            }

            return Response::json([
                'data' => [
                    'staff_id' => (int)$staffId,
                    'service_id' => $serviceId ? (int)$serviceId : null,
                    'duration_minutes' => $duration,
                    'slots' => $slots
                ]
            ]);
        } catch (Exception $e) {
            return Response::error('Failed to get available slots: ' . $e->getMessage());
        }
    }
}
