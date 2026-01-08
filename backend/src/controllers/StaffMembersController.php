<?php
/**
 * Staff Members Controller
 * CRUD for staff/team members who can be booked
 */

require_once __DIR__ . '/../Database.php';
require_once __DIR__ . '/../Response.php';
require_once __DIR__ . '/../Auth.php';

class StaffMembersController {
    private static function getWorkspaceId(): int {
        $ctx = $GLOBALS['tenantContext'] ?? null;
        if ($ctx && isset($ctx->workspaceId)) {
            return (int)$ctx->workspaceId;
        }
        throw new Exception('Workspace context required');
    }

    /**
     * List all staff members
     */
    public static function index() {
        try {
            $workspaceId = self::getWorkspaceId();
            $db = Database::conn();
            
            $includeInactive = ($_GET['include_inactive'] ?? '') === 'true';
            $acceptsBookings = $_GET['accepts_bookings'] ?? null;
            
            $sql = "
                SELECT sm.*,
                       (SELECT COUNT(*) FROM staff_services ss WHERE ss.staff_id = sm.id) as services_count,
                       (SELECT COUNT(*) FROM appointments a WHERE a.staff_id = sm.id AND a.status = 'confirmed') as upcoming_appointments
                FROM staff_members sm
                WHERE sm.workspace_id = ?
            ";
            $params = [$workspaceId];
            
            if (!$includeInactive) {
                $sql .= " AND sm.is_active = 1";
            }
            
            if ($acceptsBookings !== null) {
                $sql .= " AND sm.accepts_bookings = ?";
                $params[] = $acceptsBookings === 'true' ? 1 : 0;
            }
            
            $sql .= " ORDER BY sm.name";
            
            $stmt = $db->prepare($sql);
            $stmt->execute($params);
            
            return Response::json(['data' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
        } catch (Exception $e) {
            return Response::error('Failed to fetch staff: ' . $e->getMessage());
        }
    }

    /**
     * Get single staff member with availability
     */
    public static function show($id) {
        try {
            $workspaceId = self::getWorkspaceId();
            $db = Database::conn();
            
            $stmt = $db->prepare("SELECT * FROM staff_members WHERE id = ? AND workspace_id = ?");
            $stmt->execute([$id, $workspaceId]);
            $staff = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$staff) {
                return Response::error('Staff member not found', 404);
            }
            
            // Get availability schedule
            $stmt = $db->prepare("
                SELECT * FROM staff_availability 
                WHERE staff_id = ? 
                ORDER BY day_of_week, start_time
            ");
            $stmt->execute([$id]);
            $staff['availability'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Get assigned services
            $stmt = $db->prepare("
                SELECT s.*, ss.custom_duration_minutes, ss.custom_price
                FROM services s
                JOIN staff_services ss ON s.id = ss.service_id
                WHERE ss.staff_id = ? AND s.is_active = 1
                ORDER BY s.name
            ");
            $stmt->execute([$id]);
            $staff['services'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Get upcoming time off
            $stmt = $db->prepare("
                SELECT * FROM staff_time_off 
                WHERE staff_id = ? AND end_datetime >= NOW()
                ORDER BY start_datetime
                LIMIT 10
            ");
            $stmt->execute([$id]);
            $staff['time_off'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            return Response::json(['data' => $staff]);
        } catch (Exception $e) {
            return Response::error('Failed to fetch staff: ' . $e->getMessage());
        }
    }

    /**
     * Create staff member
     */
    public static function store() {
        try {
            $workspaceId = self::getWorkspaceId();
            $db = Database::conn();
            $data = json_decode(file_get_contents('php://input'), true);
            
            $name = $data['name'] ?? trim(($data['first_name'] ?? '') . ' ' . ($data['last_name'] ?? ''));
            if (empty($name)) {
                return Response::error('Name is required', 400);
            }
            
            $stmt = $db->prepare("
                INSERT INTO staff_members 
                (workspace_id, user_id, name, email, phone, title, bio, photo_url, color, is_active)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ");
            
            $stmt->execute([
                $workspaceId,
                $data['user_id'] ?? null,
                $name,
                $data['email'] ?? null,
                $data['phone'] ?? null,
                $data['title'] ?? null,
                $data['bio'] ?? null,
                $data['photo_url'] ?? $data['avatar_url'] ?? null,
                $data['color'] ?? '#6366f1',
                $data['is_active'] ?? 1
            ]);
            
            $id = $db->lastInsertId();
            
            // Set default availability (Mon-Fri 9-5) if not provided
            if (empty($data['availability'])) {
                self::setDefaultAvailability($db, $id);
            } else {
                self::setAvailability($db, $id, $data['availability']);
            }
            
            // Assign services if provided
            if (!empty($data['service_ids'])) {
                self::assignServices($db, $id, $data['service_ids']);
            }
            
            return self::show($id);
        } catch (Exception $e) {
            return Response::error('Failed to create staff: ' . $e->getMessage());
        }
    }

    /**
     * Update staff member
     */
    public static function update($id) {
        try {
            $workspaceId = self::getWorkspaceId();
            $db = Database::conn();
            $data = json_decode(file_get_contents('php://input'), true);
            
            // Verify ownership
            $stmt = $db->prepare("SELECT id FROM staff_members WHERE id = ? AND workspace_id = ?");
            $stmt->execute([$id, $workspaceId]);
            if (!$stmt->fetch()) {
                return Response::error('Staff member not found', 404);
            }
            
            $fields = [];
            $params = [];
            
            $allowedFields = [
                'user_id', 'first_name', 'last_name', 'email', 'phone',
                'title', 'bio', 'avatar_url', 'color', 'accepts_bookings',
                'booking_page_url', 'sort_order', 'is_active'
            ];
            
            foreach ($allowedFields as $field) {
                if (array_key_exists($field, $data)) {
                    $fields[] = "$field = ?";
                    $params[] = $data[$field];
                }
            }
            
            if (!empty($fields)) {
                $params[] = $id;
                $params[] = $workspaceId;
                $stmt = $db->prepare("UPDATE staff_members SET " . implode(', ', $fields) . " WHERE id = ? AND workspace_id = ?");
                $stmt->execute($params);
            }
            
            // Update availability if provided
            if (isset($data['availability'])) {
                $db->prepare("DELETE FROM staff_availability WHERE staff_id = ?")->execute([$id]);
                if (!empty($data['availability'])) {
                    self::setAvailability($db, $id, $data['availability']);
                }
            }
            
            // Update service assignments if provided
            if (isset($data['service_ids'])) {
                $db->prepare("DELETE FROM staff_services WHERE staff_id = ?")->execute([$id]);
                if (!empty($data['service_ids'])) {
                    self::assignServices($db, $id, $data['service_ids']);
                }
            }
            
            return self::show($id);
        } catch (Exception $e) {
            return Response::error('Failed to update staff: ' . $e->getMessage());
        }
    }

    /**
     * Delete/archive staff member
     */
    public static function destroy($id) {
        try {
            $workspaceId = self::getWorkspaceId();
            $db = Database::conn();
            
            $stmt = $db->prepare("UPDATE staff_members SET is_active = 0 WHERE id = ? AND workspace_id = ?");
            $stmt->execute([$id, $workspaceId]);
            
            if ($stmt->rowCount() === 0) {
                return Response::error('Staff member not found', 404);
            }
            
            return Response::json(['success' => true]);
        } catch (Exception $e) {
            return Response::error('Failed to delete staff: ' . $e->getMessage());
        }
    }

    /**
     * Get staff availability for a specific date
     */
    public static function getAvailability($id) {
        try {
            $workspaceId = self::getWorkspaceId();
            $db = Database::conn();
            $date = $_GET['date'] ?? date('Y-m-d');
            
            // Verify staff exists
            $stmt = $db->prepare("SELECT * FROM staff_members WHERE id = ? AND workspace_id = ?");
            $stmt->execute([$id, $workspaceId]);
            $staff = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$staff) {
                return Response::error('Staff member not found', 404);
            }
            
            $dayOfWeek = date('w', strtotime($date)); // 0 = Sunday
            
            // Get regular availability for this day
            $stmt = $db->prepare("
                SELECT * FROM staff_availability 
                WHERE staff_id = ? AND day_of_week = ? AND is_available = 1
                ORDER BY start_time
            ");
            $stmt->execute([$id, $dayOfWeek]);
            $regularHours = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Check for time off on this date
            $stmt = $db->prepare("
                SELECT * FROM staff_time_off 
                WHERE staff_id = ? 
                AND DATE(start_datetime) <= ? AND DATE(end_datetime) >= ?
            ");
            $stmt->execute([$id, $date, $date]);
            $timeOff = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Get existing appointments for this date
            $stmt = $db->prepare("
                SELECT start_time, end_time FROM appointments 
                WHERE staff_id = ? AND DATE(start_time) = ? AND status NOT IN ('cancelled')
            ");
            $stmt->execute([$id, $date]);
            $appointments = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            return Response::json([
                'data' => [
                    'date' => $date,
                    'day_of_week' => $dayOfWeek,
                    'regular_hours' => $regularHours,
                    'time_off' => $timeOff,
                    'appointments' => $appointments,
                    'is_available' => count($regularHours) > 0 && count($timeOff) === 0
                ]
            ]);
        } catch (Exception $e) {
            return Response::error('Failed to get availability: ' . $e->getMessage());
        }
    }

    /**
     * Add time off
     */
    public static function addTimeOff($id) {
        try {
            $workspaceId = self::getWorkspaceId();
            $db = Database::conn();
            $data = json_decode(file_get_contents('php://input'), true);
            
            // Verify staff exists
            $stmt = $db->prepare("SELECT id FROM staff_members WHERE id = ? AND workspace_id = ?");
            $stmt->execute([$id, $workspaceId]);
            if (!$stmt->fetch()) {
                return Response::error('Staff member not found', 404);
            }
            
            if (empty($data['start_datetime']) || empty($data['end_datetime'])) {
                return Response::error('Start and end datetime are required', 400);
            }
            
            $stmt = $db->prepare("
                INSERT INTO staff_time_off (staff_id, title, start_datetime, end_datetime, is_all_day, reason)
                VALUES (?, ?, ?, ?, ?, ?)
            ");
            $stmt->execute([
                $id,
                $data['title'] ?? 'Time Off',
                $data['start_datetime'],
                $data['end_datetime'],
                $data['is_all_day'] ?? 0,
                $data['reason'] ?? null
            ]);
            
            return Response::json(['data' => ['id' => (int)$db->lastInsertId()]]);
        } catch (Exception $e) {
            return Response::error('Failed to add time off: ' . $e->getMessage());
        }
    }

    /**
     * Remove time off
     */
    public static function removeTimeOff($id, $timeOffId) {
        try {
            $workspaceId = self::getWorkspaceId();
            $db = Database::conn();
            
            // Verify staff exists
            $stmt = $db->prepare("SELECT id FROM staff_members WHERE id = ? AND workspace_id = ?");
            $stmt->execute([$id, $workspaceId]);
            if (!$stmt->fetch()) {
                return Response::error('Staff member not found', 404);
            }
            
            $stmt = $db->prepare("DELETE FROM staff_time_off WHERE id = ? AND staff_id = ?");
            $stmt->execute([$timeOffId, $id]);
            
            return Response::json(['success' => true]);
        } catch (Exception $e) {
            return Response::error('Failed to remove time off: ' . $e->getMessage());
        }
    }

    private static function setDefaultAvailability(PDO $db, int $staffId): void {
        $stmt = $db->prepare("
            INSERT INTO staff_availability (staff_id, day_of_week, start_time, end_time, is_available)
            VALUES (?, ?, ?, ?, 1)
        ");
        
        // Mon-Fri 9:00-17:00
        for ($day = 1; $day <= 5; $day++) {
            $stmt->execute([$staffId, $day, '09:00:00', '17:00:00']);
        }
    }

    private static function setAvailability(PDO $db, int $staffId, array $availability): void {
        $stmt = $db->prepare("
            INSERT INTO staff_availability (staff_id, day_of_week, start_time, end_time, is_available)
            VALUES (?, ?, ?, ?, ?)
        ");
        
        foreach ($availability as $slot) {
            $stmt->execute([
                $staffId,
                $slot['day_of_week'],
                $slot['start_time'],
                $slot['end_time'],
                $slot['is_available'] ?? 1
            ]);
        }
    }

    private static function assignServices(PDO $db, int $staffId, array $serviceIds): void {
        $stmt = $db->prepare("INSERT INTO staff_services (staff_id, service_id) VALUES (?, ?)");
        foreach ($serviceIds as $serviceId) {
            $stmt->execute([$staffId, $serviceId]);
        }
    }
}
