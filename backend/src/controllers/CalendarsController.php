<?php
/**
 * Calendars Controller
 * Multi-calendar management for GHL/Thryv parity
 * Supports: calendar CRUD, availability, staff assignments, external sync
 */

require_once __DIR__ . '/../Database.php';
require_once __DIR__ . '/../Response.php';
require_once __DIR__ . '/../Auth.php';

class CalendarsController {
    private static function getWorkspaceId(): int {
        $ctx = $GLOBALS['tenantContext'] ?? null;
        if ($ctx && isset($ctx->workspaceId)) {
            return (int)$ctx->workspaceId;
        }
        throw new Exception('Workspace context required');
    }

    /**
     * List all calendars
     */
    public static function index() {
        try {
            $workspaceId = self::getWorkspaceId();
            $db = Database::conn();
            
            $includeInactive = ($_GET['include_inactive'] ?? '') === 'true';
            
            $sql = "
                SELECT c.*,
                       (SELECT COUNT(*) FROM calendar_staff cs WHERE cs.calendar_id = c.id) as staff_count,
                       (SELECT COUNT(*) FROM calendar_services csvc WHERE csvc.calendar_id = c.id) as services_count,
                       (SELECT COUNT(*) FROM appointments a WHERE a.calendar_id = c.id AND a.status NOT IN ('cancelled')) as appointment_count
                FROM calendars c
                WHERE c.workspace_id = ?
            ";
            $params = [$workspaceId];
            
            if (!$includeInactive) {
                $sql .= " AND c.is_active = 1";
            }
            
            $sql .= " ORDER BY c.name";
            
            $stmt = $db->prepare($sql);
            $stmt->execute($params);
            
            return Response::json(['data' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
        } catch (Exception $e) {
            return Response::error('Failed to fetch calendars: ' . $e->getMessage());
        }
    }

    /**
     * Get single calendar with full details
     */
    public static function show($id) {
        try {
            $workspaceId = self::getWorkspaceId();
            $db = Database::conn();
            
            $stmt = $db->prepare("SELECT * FROM calendars WHERE id = ? AND workspace_id = ?");
            $stmt->execute([$id, $workspaceId]);
            $calendar = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$calendar) {
                return Response::error('Calendar not found', 404);
            }
            
            // Get availability
            $stmt = $db->prepare("SELECT * FROM calendar_availability WHERE calendar_id = ? ORDER BY day_of_week, start_time");
            $stmt->execute([$id]);
            $calendar['availability'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Get assigned staff
            $stmt = $db->prepare("
                SELECT sm.*, cs.is_primary
                FROM staff_members sm
                JOIN calendar_staff cs ON sm.id = cs.staff_id
                WHERE cs.calendar_id = ? AND sm.is_active = 1
                ORDER BY cs.is_primary DESC, sm.name
            ");
            $stmt->execute([$id]);
            $calendar['staff'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Get assigned services
            $stmt = $db->prepare("
                SELECT s.*, csvc.custom_duration_minutes, csvc.custom_price
                FROM services s
                JOIN calendar_services csvc ON s.id = csvc.service_id
                WHERE csvc.calendar_id = ? AND s.is_active = 1
                ORDER BY s.name
            ");
            $stmt->execute([$id]);
            $calendar['services'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Get upcoming blocks
            $stmt = $db->prepare("
                SELECT * FROM calendar_blocks 
                WHERE calendar_id = ? AND end_datetime >= NOW()
                ORDER BY start_datetime
                LIMIT 50
            ");
            $stmt->execute([$id]);
            $calendar['blocks'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            return Response::json(['data' => $calendar]);
        } catch (Exception $e) {
            return Response::error('Failed to fetch calendar: ' . $e->getMessage());
        }
    }

    /**
     * Create calendar
     */
    public static function store() {
        try {
            $workspaceId = self::getWorkspaceId();
            $db = Database::conn();
            $data = json_decode(file_get_contents('php://input'), true);
            
            if (empty($data['name'])) {
                return Response::error('Name is required', 400);
            }
            
            // Generate slug
            $slug = $data['slug'] ?? self::generateSlug($data['name']);
            
            // Check slug uniqueness
            $stmt = $db->prepare("SELECT id FROM calendars WHERE workspace_id = ? AND slug = ?");
            $stmt->execute([$workspaceId, $slug]);
            if ($stmt->fetch()) {
                $slug = $slug . '-' . time();
            }
            
            $stmt = $db->prepare("
                INSERT INTO calendars 
                (workspace_id, name, description, slug, owner_type, owner_id, timezone, location_id,
                 min_notice_hours, max_advance_days, slot_interval_minutes, buffer_before_minutes, buffer_after_minutes,
                 availability_mode, color, is_public, is_active)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ");
            
            $stmt->execute([
                $workspaceId,
                $data['name'],
                $data['description'] ?? null,
                $slug,
                $data['owner_type'] ?? 'user',
                $data['owner_id'] ?? null,
                $data['timezone'] ?? 'UTC',
                $data['location_id'] ?? null,
                $data['min_notice_hours'] ?? 1,
                $data['max_advance_days'] ?? 60,
                $data['slot_interval_minutes'] ?? 30,
                $data['buffer_before_minutes'] ?? 0,
                $data['buffer_after_minutes'] ?? 0,
                $data['availability_mode'] ?? 'custom',
                $data['color'] ?? '#6366f1',
                $data['is_public'] ?? 1,
                $data['is_active'] ?? 1
            ]);
            
            $id = $db->lastInsertId();
            
            // Set default availability (Mon-Fri 9-5) if not provided
            if (empty($data['availability'])) {
                self::setDefaultAvailability($db, $id);
            } else {
                self::setAvailability($db, $id, $data['availability']);
            }
            
            // Assign staff if provided
            if (!empty($data['staff_ids'])) {
                self::assignStaff($db, $id, $data['staff_ids']);
            }
            
            // Assign services if provided
            if (!empty($data['service_ids'])) {
                self::assignServices($db, $id, $data['service_ids']);
            }
            
            return self::show($id);
        } catch (Exception $e) {
            return Response::error('Failed to create calendar: ' . $e->getMessage());
        }
    }

    /**
     * Update calendar
     */
    public static function update($id) {
        try {
            $workspaceId = self::getWorkspaceId();
            $db = Database::conn();
            $data = json_decode(file_get_contents('php://input'), true);
            
            // Verify ownership
            $stmt = $db->prepare("SELECT id FROM calendars WHERE id = ? AND workspace_id = ?");
            $stmt->execute([$id, $workspaceId]);
            if (!$stmt->fetch()) {
                return Response::error('Calendar not found', 404);
            }
            
            $fields = [];
            $params = [];
            
            $allowedFields = [
                'name', 'description', 'slug', 'owner_type', 'owner_id', 'timezone', 'location_id',
                'min_notice_hours', 'max_advance_days', 'slot_interval_minutes', 
                'buffer_before_minutes', 'buffer_after_minutes', 'availability_mode',
                'color', 'is_public', 'is_active'
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
                $stmt = $db->prepare("UPDATE calendars SET " . implode(', ', $fields) . " WHERE id = ? AND workspace_id = ?");
                $stmt->execute($params);
            }
            
            // Update availability if provided
            if (isset($data['availability'])) {
                self::setAvailability($db, $id, $data['availability']);
            }
            
            // Update staff assignments if provided
            if (isset($data['staff_ids'])) {
                $db->prepare("DELETE FROM calendar_staff WHERE calendar_id = ?")->execute([$id]);
                if (!empty($data['staff_ids'])) {
                    self::assignStaff($db, $id, $data['staff_ids']);
                }
            }
            
            // Update service assignments if provided
            if (isset($data['service_ids'])) {
                $db->prepare("DELETE FROM calendar_services WHERE calendar_id = ?")->execute([$id]);
                if (!empty($data['service_ids'])) {
                    self::assignServices($db, $id, $data['service_ids']);
                }
            }
            
            return self::show($id);
        } catch (Exception $e) {
            return Response::error('Failed to update calendar: ' . $e->getMessage());
        }
    }

    /**
     * Delete calendar
     */
    public static function destroy($id) {
        try {
            $workspaceId = self::getWorkspaceId();
            $db = Database::conn();
            
            $stmt = $db->prepare("DELETE FROM calendars WHERE id = ? AND workspace_id = ?");
            $stmt->execute([$id, $workspaceId]);
            
            if ($stmt->rowCount() === 0) {
                return Response::error('Calendar not found', 404);
            }
            
            return Response::json(['success' => true]);
        } catch (Exception $e) {
            return Response::error('Failed to delete calendar: ' . $e->getMessage());
        }
    }

    /**
     * Get calendar availability
     */
    public static function getAvailability($id) {
        try {
            $workspaceId = self::getWorkspaceId();
            $db = Database::conn();
            
            // Verify ownership
            $stmt = $db->prepare("SELECT id FROM calendars WHERE id = ? AND workspace_id = ?");
            $stmt->execute([$id, $workspaceId]);
            if (!$stmt->fetch()) {
                return Response::error('Calendar not found', 404);
            }
            
            $stmt = $db->prepare("SELECT * FROM calendar_availability WHERE calendar_id = ? ORDER BY day_of_week, start_time");
            $stmt->execute([$id]);
            
            return Response::json(['data' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
        } catch (Exception $e) {
            return Response::error('Failed to fetch availability: ' . $e->getMessage());
        }
    }

    /**
     * Set calendar availability
     */
    public static function setAvailabilityEndpoint($id) {
        try {
            $workspaceId = self::getWorkspaceId();
            $db = Database::conn();
            $data = json_decode(file_get_contents('php://input'), true);
            
            // Verify ownership
            $stmt = $db->prepare("SELECT id FROM calendars WHERE id = ? AND workspace_id = ?");
            $stmt->execute([$id, $workspaceId]);
            if (!$stmt->fetch()) {
                return Response::error('Calendar not found', 404);
            }
            
            self::setAvailability($db, $id, $data['availability'] ?? []);
            
            return self::getAvailability($id);
        } catch (Exception $e) {
            return Response::error('Failed to set availability: ' . $e->getMessage());
        }
    }

    /**
     * Add block to calendar
     */
    public static function addBlock($id) {
        try {
            $workspaceId = self::getWorkspaceId();
            $db = Database::conn();
            $data = json_decode(file_get_contents('php://input'), true);
            
            // Verify ownership
            $stmt = $db->prepare("SELECT id FROM calendars WHERE id = ? AND workspace_id = ?");
            $stmt->execute([$id, $workspaceId]);
            if (!$stmt->fetch()) {
                return Response::error('Calendar not found', 404);
            }
            
            if (empty($data['start_datetime']) || empty($data['end_datetime'])) {
                return Response::error('start_datetime and end_datetime are required', 400);
            }
            
            $stmt = $db->prepare("
                INSERT INTO calendar_blocks 
                (calendar_id, title, start_datetime, end_datetime, is_all_day, block_type, source)
                VALUES (?, ?, ?, ?, ?, ?, 'manual')
            ");
            $stmt->execute([
                $id,
                $data['title'] ?? null,
                $data['start_datetime'],
                $data['end_datetime'],
                $data['is_all_day'] ?? 0,
                $data['block_type'] ?? 'busy'
            ]);
            
            return Response::json(['data' => ['id' => (int)$db->lastInsertId()]]);
        } catch (Exception $e) {
            return Response::error('Failed to add block: ' . $e->getMessage());
        }
    }

    /**
     * Remove block from calendar
     */
    public static function removeBlock($calendarId, $blockId) {
        try {
            $workspaceId = self::getWorkspaceId();
            $db = Database::conn();
            
            // Verify ownership
            $stmt = $db->prepare("
                SELECT cb.id FROM calendar_blocks cb
                JOIN calendars c ON cb.calendar_id = c.id
                WHERE cb.id = ? AND c.id = ? AND c.workspace_id = ?
            ");
            $stmt->execute([$blockId, $calendarId, $workspaceId]);
            if (!$stmt->fetch()) {
                return Response::error('Block not found', 404);
            }
            
            $stmt = $db->prepare("DELETE FROM calendar_blocks WHERE id = ?");
            $stmt->execute([$blockId]);
            
            return Response::json(['success' => true]);
        } catch (Exception $e) {
            return Response::error('Failed to remove block: ' . $e->getMessage());
        }
    }

    /**
     * Get available slots for a calendar
     */
    public static function getSlots($id) {
        try {
            $workspaceId = self::getWorkspaceId();
            $db = Database::conn();
            
            $date = $_GET['date'] ?? date('Y-m-d');
            $serviceId = $_GET['service_id'] ?? null;
            $staffId = $_GET['staff_id'] ?? null;
            
            // Get calendar
            $stmt = $db->prepare("SELECT * FROM calendars WHERE id = ? AND workspace_id = ? AND is_active = 1");
            $stmt->execute([$id, $workspaceId]);
            $calendar = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$calendar) {
                return Response::error('Calendar not found', 404);
            }
            
            // Get service if specified
            $service = null;
            $duration = 60;
            if ($serviceId) {
                $stmt = $db->prepare("
                    SELECT s.*, csvc.custom_duration_minutes
                    FROM services s
                    LEFT JOIN calendar_services csvc ON s.id = csvc.service_id AND csvc.calendar_id = ?
                    WHERE s.id = ? AND s.workspace_id = ? AND s.is_active = 1
                ");
                $stmt->execute([$id, $serviceId, $workspaceId]);
                $service = $stmt->fetch(PDO::FETCH_ASSOC);
                if ($service) {
                    $duration = $service['custom_duration_minutes'] ?? $service['duration_minutes'] ?? 60;
                }
            }
            
            // Validate date
            $dateObj = new DateTime($date);
            $now = new DateTime();
            $minDate = (clone $now)->modify("+{$calendar['min_notice_hours']} hours");
            $maxDate = (clone $now)->modify("+{$calendar['max_advance_days']} days");
            
            if ($dateObj < $minDate->setTime(0, 0) || $dateObj > $maxDate) {
                return Response::json(['data' => ['date' => $date, 'slots' => [], 'message' => 'Date outside booking window']]);
            }
            
            $dayOfWeek = (int)$dateObj->format('w');
            $slotInterval = $calendar['slot_interval_minutes'];
            $bufferBefore = $calendar['buffer_before_minutes'];
            $bufferAfter = $calendar['buffer_after_minutes'];
            
            // Get availability for this day
            $stmt = $db->prepare("
                SELECT * FROM calendar_availability 
                WHERE calendar_id = ? AND day_of_week = ? AND is_available = 1
                ORDER BY start_time
            ");
            $stmt->execute([$id, $dayOfWeek]);
            $availability = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            if (empty($availability)) {
                return Response::json(['data' => ['date' => $date, 'slots' => [], 'message' => 'No availability on this day']]);
            }
            
            // Get blocks for this date
            $stmt = $db->prepare("
                SELECT * FROM calendar_blocks 
                WHERE calendar_id = ? AND DATE(start_datetime) <= ? AND DATE(end_datetime) >= ?
            ");
            $stmt->execute([$id, $date, $date]);
            $blocks = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Get existing appointments
            $stmt = $db->prepare("
                SELECT scheduled_at as start_time, end_at as end_time 
                FROM appointments 
                WHERE calendar_id = ? AND DATE(scheduled_at) = ? AND status NOT IN ('cancelled')
            ");
            $stmt->execute([$id, $date]);
            $appointments = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Generate slots
            $slots = [];
            $totalDuration = $duration + $bufferBefore + $bufferAfter;
            
            foreach ($availability as $window) {
                $windowStart = new DateTime($date . ' ' . $window['start_time']);
                $windowEnd = new DateTime($date . ' ' . $window['end_time']);
                
                $slotStart = clone $windowStart;
                
                while ($slotStart < $windowEnd) {
                    $slotEnd = (clone $slotStart)->modify("+{$duration} minutes");
                    $blockEnd = (clone $slotStart)->modify("+{$totalDuration} minutes");
                    
                    if ($blockEnd > $windowEnd) {
                        break;
                    }
                    
                    // Check minimum notice
                    if ($slotStart < $minDate) {
                        $slotStart->modify("+{$slotInterval} minutes");
                        continue;
                    }
                    
                    // Check blocks
                    $isBlocked = false;
                    foreach ($blocks as $block) {
                        $blockStart = new DateTime($block['start_datetime']);
                        $blockEndTime = new DateTime($block['end_datetime']);
                        if ($slotStart < $blockEndTime && $blockEnd > $blockStart) {
                            $isBlocked = true;
                            break;
                        }
                    }
                    
                    if ($isBlocked) {
                        $slotStart->modify("+{$slotInterval} minutes");
                        continue;
                    }
                    
                    // Check existing appointments
                    $isBooked = false;
                    foreach ($appointments as $apt) {
                        $aptStart = new DateTime($apt['start_time']);
                        $aptEnd = new DateTime($apt['end_time']);
                        $aptStart->modify("-{$bufferBefore} minutes");
                        $aptEnd->modify("+{$bufferAfter} minutes");
                        
                        if ($slotStart < $aptEnd && $blockEnd > $aptStart) {
                            $isBooked = true;
                            break;
                        }
                    }
                    
                    if (!$isBooked) {
                        $slots[] = [
                            'start' => $slotStart->format('Y-m-d\TH:i:s'),
                            'end' => $slotEnd->format('Y-m-d\TH:i:s'),
                            'calendar_id' => (int)$id
                        ];
                    }
                    
                    $slotStart->modify("+{$slotInterval} minutes");
                }
            }
            
            return Response::json([
                'data' => [
                    'date' => $date,
                    'calendar' => [
                        'id' => (int)$calendar['id'],
                        'name' => $calendar['name']
                    ],
                    'service' => $service ? [
                        'id' => (int)$service['id'],
                        'name' => $service['name'],
                        'duration_minutes' => $duration
                    ] : null,
                    'slots' => $slots
                ]
            ]);
        } catch (Exception $e) {
            return Response::error('Failed to get slots: ' . $e->getMessage());
        }
    }

    // ==================== HELPER METHODS ====================

    private static function generateSlug(string $name): string {
        $slug = strtolower(trim($name));
        $slug = preg_replace('/[^a-z0-9]+/', '-', $slug);
        $slug = trim($slug, '-');
        return $slug ?: 'calendar';
    }

    private static function setDefaultAvailability(PDO $db, int $calendarId): void {
        // Mon-Fri 9:00-17:00
        $stmt = $db->prepare("
            INSERT INTO calendar_availability (calendar_id, day_of_week, start_time, end_time, is_available)
            VALUES (?, ?, ?, ?, 1)
        ");
        
        for ($day = 1; $day <= 5; $day++) {
            $stmt->execute([$calendarId, $day, '09:00:00', '17:00:00']);
        }
    }

    private static function setAvailability(PDO $db, int $calendarId, array $availability): void {
        $db->prepare("DELETE FROM calendar_availability WHERE calendar_id = ?")->execute([$calendarId]);
        
        if (empty($availability)) {
            return;
        }
        
        $stmt = $db->prepare("
            INSERT INTO calendar_availability (calendar_id, day_of_week, start_time, end_time, is_available)
            VALUES (?, ?, ?, ?, ?)
        ");
        
        foreach ($availability as $slot) {
            $stmt->execute([
                $calendarId,
                $slot['day_of_week'],
                $slot['start_time'],
                $slot['end_time'],
                $slot['is_available'] ?? 1
            ]);
        }
    }

    private static function assignStaff(PDO $db, int $calendarId, array $staffIds): void {
        $stmt = $db->prepare("INSERT INTO calendar_staff (calendar_id, staff_id, is_primary) VALUES (?, ?, ?)");
        
        $first = true;
        foreach ($staffIds as $staffId) {
            $stmt->execute([$calendarId, $staffId, $first ? 1 : 0]);
            $first = false;
        }
    }

    private static function assignServices(PDO $db, int $calendarId, array $serviceIds): void {
        $stmt = $db->prepare("INSERT INTO calendar_services (calendar_id, service_id) VALUES (?, ?)");
        
        foreach ($serviceIds as $serviceId) {
            $stmt->execute([$calendarId, $serviceId]);
        }
    }
}
