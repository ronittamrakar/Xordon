<?php
/**
 * AppointmentsController - Handles appointments, booking types, and availability
 */

require_once __DIR__ . '/../Database.php';
require_once __DIR__ . '/../Response.php';
require_once __DIR__ . '/../Auth.php';
require_once __DIR__ . '/../services/PaymentService.php';

class AppointmentsController {
    
    /**
     * Get workspace scope for queries
     */
    private static function getWorkspaceScope(): array {
        $ctx = $GLOBALS['tenantContext'] ?? null;
        if ($ctx && isset($ctx->workspaceId)) {
            return ['col' => 'workspace_id', 'val' => (int)$ctx->workspaceId];
        }
        return ['col' => 'user_id', 'val' => Auth::userIdOrFail()];
    }
    
    private static function getWorkspaceId(): ?int {
        $ctx = $GLOBALS['tenantContext'] ?? null;
        return ($ctx && isset($ctx->workspaceId)) ? (int)$ctx->workspaceId : null;
    }
    
    // ==================== BOOKING TYPES ====================
    
    public static function getBookingTypes(): void {
        $userId = Auth::userIdOrFail();
        $pdo = Database::conn();
        $scope = self::getWorkspaceScope();
        
        $stmt = $pdo->prepare("SELECT * FROM booking_types WHERE {$scope['col']} = ? ORDER BY created_at DESC");
        $stmt->execute([$scope['val']]);
        $items = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Decode JSON fields
        foreach ($items as &$item) {
            if (isset($item['assigned_staff_ids']) && is_string($item['assigned_staff_ids'])) {
                $item['assigned_staff_ids'] = json_decode($item['assigned_staff_ids'], true) ?? [];
            }
        }
        
        Response::json(['items' => $items]);
    }
    
    public static function getBookingType(string $id): void {
        $userId = Auth::userIdOrFail();
        $pdo = Database::conn();
        $scope = self::getWorkspaceScope();
        
        $stmt = $pdo->prepare("SELECT * FROM booking_types WHERE id = ? AND {$scope['col']} = ?");
        $stmt->execute([$id, $scope['val']]);
        $type = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$type) {
            Response::notFound('Booking type not found');
            return;
        }
        
        // Decode JSON fields
        if (isset($type['assigned_staff_ids']) && is_string($type['assigned_staff_ids'])) {
            $type['assigned_staff_ids'] = json_decode($type['assigned_staff_ids'], true) ?? [];
        }
        
        // Get associated reminders
        $stmt = $pdo->prepare('SELECT * FROM appointment_reminders WHERE booking_type_id = ?');
        $stmt->execute([$id]);
        $type['reminders'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        Response::json($type);
    }
    
    public static function createBookingType(): void {
        $userId = Auth::userIdOrFail();
        $body = get_json_body();
        $pdo = Database::conn();
        
        if (empty($body['name'])) {
            Response::validationError('Booking type name is required');
            return;
        }
        
        // Generate slug
        $slug = $body['slug'] ?? strtolower(preg_replace('/[^a-zA-Z0-9]+/', '-', $body['name']));
        
        // Check slug uniqueness
        $stmt = $pdo->prepare('SELECT id FROM booking_types WHERE user_id = ? AND slug = ?');
        $stmt->execute([$userId, $slug]);
        if ($stmt->fetch()) {
            $slug .= '-' . time();
        }
        
        $workspaceId = self::getWorkspaceId();
        $stmt = $pdo->prepare('
            INSERT INTO booking_types (user_id, workspace_id, service_id, name, slug, description, duration_minutes, buffer_before, buffer_after,
                color, location_type, location_details, price, currency, requires_payment, 
                max_bookings_per_day, min_notice_hours, max_future_days, is_active,
                assigned_staff_ids, intake_form_id, allow_staff_selection, require_deposit, deposit_amount,
                is_group_event, max_participants, min_participants, waitlist_enabled, participant_confirmation,
                smart_buffer_mode, overlap_prevention, travel_time_minutes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ');
        $stmt->execute([
            $userId,
            $workspaceId,
            $body['service_id'] ?? null,
            $body['name'],
            $slug,
            $body['description'] ?? null,
            $body['duration_minutes'] ?? 30,
            $body['buffer_before'] ?? 0,
            $body['buffer_after'] ?? 15,
            $body['color'] ?? '#3B82F6',
            $body['location_type'] ?? 'video',
            $body['location_details'] ?? null,
            $body['price'] ?? null,
            $body['currency'] ?? 'USD',
            $body['requires_payment'] ?? 0,
            $body['max_bookings_per_day'] ?? null,
            $body['min_notice_hours'] ?? 24,
            $body['max_future_days'] ?? 60,
            1,
            isset($body['assigned_staff_ids']) ? json_encode($body['assigned_staff_ids']) : null,
            $body['intake_form_id'] ?? null,
            $body['allow_staff_selection'] ?? 0,
            $body['require_deposit'] ?? 0,
            $body['deposit_amount'] ?? null,
            $body['is_group_event'] ?? 0,
            $body['max_participants'] ?? 1,
            $body['min_participants'] ?? 1,
            $body['waitlist_enabled'] ?? 0,
            $body['participant_confirmation'] ?? 0,
            $body['smart_buffer_mode'] ?? 'fixed',
            $body['overlap_prevention'] ?? 'strict',
            $body['travel_time_minutes'] ?? 0
        ]);
        
        $id = $pdo->lastInsertId();
        
        Response::json(['id' => $id, 'slug' => $slug, 'message' => 'Booking type created successfully'], 201);
    }
    
    public static function updateBookingType(string $id): void {
        $userId = Auth::userIdOrFail();
        $body = get_json_body();
        $pdo = Database::conn();
        $scope = self::getWorkspaceScope();
        
        $stmt = $pdo->prepare("SELECT id FROM booking_types WHERE id = ? AND {$scope['col']} = ?");
        $stmt->execute([$id, $scope['val']]);
        if (!$stmt->fetch()) {
            Response::notFound('Booking type not found');
            return;
        }
        
        $updates = [];
        $params = [];
        
        $fields = ['name', 'slug', 'description', 'duration_minutes', 'buffer_before', 'buffer_after',
                   'color', 'location_type', 'location_details', 'price', 'currency', 'requires_payment',
                   'max_bookings_per_day', 'min_notice_hours', 'max_future_days', 'is_active',
                   'service_id', 'intake_form_id', 'allow_staff_selection', 'require_deposit', 'deposit_amount',
                   'is_group_event', 'max_participants', 'min_participants', 'waitlist_enabled', 'participant_confirmation',
                   'smart_buffer_mode', 'overlap_prevention', 'travel_time_minutes'];
        foreach ($fields as $field) {
            if (isset($body[$field])) {
                $updates[] = "$field = ?";
                $params[] = $body[$field];
            }
        }
        
        // Handle assigned_staff_ids as JSON
        if (isset($body['assigned_staff_ids'])) {
            $updates[] = "assigned_staff_ids = ?";
            $params[] = is_array($body['assigned_staff_ids']) ? json_encode($body['assigned_staff_ids']) : $body['assigned_staff_ids'];
        }
        
        if (empty($updates)) {
            Response::json(['message' => 'No updates provided']);
            return;
        }
        
        $params[] = $id;
        $params[] = $scope['val'];
        
        $stmt = $pdo->prepare('UPDATE booking_types SET ' . implode(', ', $updates) . " WHERE id = ? AND {$scope['col']} = ?");
        $stmt->execute($params);
        
        Response::json(['message' => 'Booking type updated successfully']);
    }
    
    public static function deleteBookingType(string $id): void {
        $userId = Auth::userIdOrFail();
        $pdo = Database::conn();
        $scope = self::getWorkspaceScope();
        
        $stmt = $pdo->prepare("DELETE FROM booking_types WHERE id = ? AND {$scope['col']} = ?");
        $stmt->execute([$id, $scope['val']]);
        
        if ($stmt->rowCount() === 0) {
            Response::notFound('Booking type not found');
            return;
        }
        
        Response::json(['message' => 'Booking type deleted successfully']);
    }
    
    // ==================== AVAILABILITY ====================
    
    public static function getAvailability(): void {
        $userId = Auth::userIdOrFail();
        $pdo = Database::conn();
        $scope = self::getWorkspaceScope();
        
        // Get schedules
        $stmt = $pdo->prepare("SELECT * FROM availability_schedules WHERE {$scope['col']} = ?");
        $stmt->execute([$scope['val']]);
        $schedules = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Get slots for each schedule
        foreach ($schedules as &$schedule) {
            $stmt = $pdo->prepare('SELECT * FROM availability_slots WHERE schedule_id = ? ORDER BY day_of_week, start_time');
            $stmt->execute([$schedule['id']]);
            $schedule['slots'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
        }
        
        // Get overrides
        $stmt = $pdo->prepare("SELECT * FROM availability_overrides WHERE {$scope['col']} = ? AND override_date >= CURDATE() ORDER BY override_date");
        $stmt->execute([$scope['val']]);
        $overrides = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        Response::json([
            'schedules' => $schedules,
            'overrides' => $overrides
        ]);
    }
    
    public static function saveAvailability(): void {
        $userId = Auth::userIdOrFail();
        $body = get_json_body();
        $pdo = Database::conn();
        
        $pdo->beginTransaction();
        
        try {
            // Create or update schedule
            $scheduleName = $body['schedule_name'] ?? 'Default Schedule';
            $timezone = $body['timezone'] ?? 'UTC';
            
            $stmt = $pdo->prepare('SELECT id FROM availability_schedules WHERE user_id = ? AND is_default = 1');
            $stmt->execute([$userId]);
            $existing = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if ($existing) {
                $scheduleId = $existing['id'];
                $stmt = $pdo->prepare('UPDATE availability_schedules SET name = ?, timezone = ? WHERE id = ?');
                $stmt->execute([$scheduleName, $timezone, $scheduleId]);
                
                // Clear existing slots
                $stmt = $pdo->prepare('DELETE FROM availability_slots WHERE schedule_id = ?');
                $stmt->execute([$scheduleId]);
            } else {
                $stmt = $pdo->prepare('INSERT INTO availability_schedules (user_id, name, timezone, is_default, advanced_settings) VALUES (?, ?, ?, 1, ?)');
                $stmt->execute([$userId, $scheduleName, $timezone, isset($body['advanced_settings']) ? json_encode($body['advanced_settings']) : null]);
                $scheduleId = $pdo->lastInsertId();
            }

            // Update advanced settings if present and updating existing schedule
            if ($existing && isset($body['advanced_settings'])) {
                $stmt = $pdo->prepare('UPDATE availability_schedules SET advanced_settings = ? WHERE id = ?');
                $stmt->execute([json_encode($body['advanced_settings']), $scheduleId]);
            }
            
            // Insert slots
            if (!empty($body['slots'])) {
                foreach ($body['slots'] as $slot) {
                    $stmt = $pdo->prepare('
                        INSERT INTO availability_slots (schedule_id, day_of_week, start_time, end_time, is_available)
                        VALUES (?, ?, ?, ?, ?)
                    ');
                    $stmt->execute([
                        $scheduleId,
                        $slot['day_of_week'],
                        $slot['start_time'],
                        $slot['end_time'],
                        $slot['is_available'] ?? true
                    ]);
                }
            }
            
            $pdo->commit();
            Response::json(['message' => 'Availability saved successfully']);
            
        } catch (Exception $e) {
            $pdo->rollBack();
            Response::error('Failed to save availability: ' . $e->getMessage());
        }
    }
    
    public static function addOverride(): void {
        $userId = Auth::userIdOrFail();
        $body = get_json_body();
        $pdo = Database::conn();
        
        if (empty($body['override_date'])) {
            Response::validationError('Override date is required');
            return;
        }
        
        $stmt = $pdo->prepare('
            INSERT INTO availability_overrides (user_id, override_date, is_available, start_time, end_time, reason)
            VALUES (?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE is_available = VALUES(is_available), start_time = VALUES(start_time), 
                end_time = VALUES(end_time), reason = VALUES(reason)
        ');
        $stmt->execute([
            $userId,
            $body['override_date'],
            $body['is_available'] ?? false,
            $body['start_time'] ?? null,
            $body['end_time'] ?? null,
            $body['reason'] ?? null
        ]);
        
        Response::json(['message' => 'Override added successfully']);
    }
    
    public static function deleteOverride(string $id): void {
        $userId = Auth::userIdOrFail();
        $pdo = Database::conn();
        
        $stmt = $pdo->prepare('DELETE FROM availability_overrides WHERE id = ? AND user_id = ?');
        $stmt->execute([$id, $userId]);
        
        Response::json(['message' => 'Override deleted successfully']);
    }
    
    // ==================== APPOINTMENTS ====================
    
    public static function getAppointments(): void {
        $userId = Auth::userIdOrFail();
        $pdo = Database::conn();
        
        $status = $_GET['status'] ?? null;
        $from = $_GET['from'] ?? null;
        $to = $_GET['to'] ?? null;
        
        $sql = 'SELECT a.*, bt.name as booking_type_name, bt.color,
                       c.first_name, c.last_name, c.email as contact_email,
                       s.name as staff_name, s.color as staff_color
                FROM appointments a
                LEFT JOIN booking_types bt ON a.booking_type_id = bt.id
                LEFT JOIN contacts c ON a.contact_id = c.id
                LEFT JOIN staff_members s ON a.staff_id = s.id
                WHERE a.user_id = ?';
        $params = [$userId];
        
        if ($status) {
            $sql .= ' AND a.status = ?';
            $params[] = $status;
        }
        
        if ($from) {
            $sql .= ' AND a.scheduled_at >= ?';
            $params[] = $from;
        }
        
        if ($to) {
            $sql .= ' AND a.scheduled_at <= ?';
            $params[] = $to;
        }
        
        $sql .= ' ORDER BY a.scheduled_at ASC';
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        
        Response::json(['items' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
    }
    
    public static function getAppointment(string $id): void {
        $userId = Auth::userIdOrFail();
        $pdo = Database::conn();
        
        $stmt = $pdo->prepare('
            SELECT a.*, bt.name as booking_type_name, bt.color,
                   c.first_name, c.last_name, c.email as contact_email, c.phone as contact_phone
            FROM appointments a
            LEFT JOIN booking_types bt ON a.booking_type_id = bt.id
            LEFT JOIN contacts c ON a.contact_id = c.id
            WHERE a.id = ? AND a.user_id = ?
        ');
        $stmt->execute([$id, $userId]);
        $appointment = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$appointment) {
            Response::notFound('Appointment not found');
            return;
        }
        
        Response::json($appointment);
    }
    
    public static function createAppointment(): void {
        $userId = Auth::userIdOrFail();
        $body = get_json_body();
        $pdo = Database::conn();
        
        if (empty($body['scheduled_at'])) {
            Response::validationError('Scheduled time is required');
            return;
        }
        
        // Get title from body or generate from booking type
        $title = $body['title'] ?? null;
        if (empty($title) && !empty($body['booking_type_id'])) {
            $stmt = $pdo->prepare('SELECT name FROM booking_types WHERE id = ?');
            $stmt->execute([$body['booking_type_id']]);
            $bt = $stmt->fetch(PDO::FETCH_ASSOC);
            $title = $bt ? $bt['name'] : 'Appointment';
        }
        if (empty($title)) {
            $title = 'Appointment';
        }
        
        $duration = $body['duration_minutes'] ?? 30;
        $scheduledAt = new DateTime($body['scheduled_at']);
        $endAt = clone $scheduledAt;
        $endAt->modify("+{$duration} minutes");
        
        $stmt = $pdo->prepare('
            INSERT INTO appointments (user_id, booking_type_id, contact_id, staff_id, guest_name, guest_email, guest_phone,
                title, description, scheduled_at, duration_minutes, end_at, timezone, location_type, location,
                meeting_link, status, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ');
        $stmt->execute([
            $userId,
            $body['booking_type_id'] ?? null,
            $body['contact_id'] ?? null,
            $body['staff_id'] ?? null,
            $body['guest_name'] ?? null,
            $body['guest_email'] ?? null,
            $body['guest_phone'] ?? null,
            $title,
            $body['description'] ?? null,
            $scheduledAt->format('Y-m-d H:i:s'),
            $duration,
            $endAt->format('Y-m-d H:i:s'),
            $body['timezone'] ?? 'UTC',
            $body['location_type'] ?? 'video',
            $body['location'] ?? null,
            $body['meeting_link'] ?? null,
            $body['status'] ?? 'scheduled',
            $body['notes'] ?? null
        ]);
        
        $id = $pdo->lastInsertId();
        
        // TODO: Send confirmation email, create calendar event
        
        Response::json(['id' => $id, 'message' => 'Appointment created successfully'], 201);
    }
    
    public static function updateAppointment(string $id): void {
        $userId = Auth::userIdOrFail();
        $body = get_json_body();
        $pdo = Database::conn();
        
        $stmt = $pdo->prepare('SELECT * FROM appointments WHERE id = ? AND user_id = ?');
        $stmt->execute([$id, $userId]);
        $appointment = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$appointment) {
            Response::notFound('Appointment not found');
            return;
        }
        
        $updates = [];
        $params = [];
        
        $fields = ['booking_type_id', 'contact_id', 'staff_id', 'guest_name', 'guest_email', 'guest_phone',
                   'title', 'description', 'scheduled_at', 'duration_minutes', 'timezone',
                   'location_type', 'location', 'meeting_link', 'status', 'notes', 'internal_notes',
                   'location_type', 'location', 'meeting_link', 'status', 'notes', 'internal_notes',
                   'cancellation_reason', 'payment_status'];
        
        foreach ($fields as $field) {
            if (isset($body[$field])) {
                $updates[] = "$field = ?";
                $params[] = $body[$field];
            }
        }
        
        // Recalculate end_at if scheduled_at or duration changed
        if (isset($body['scheduled_at']) || isset($body['duration_minutes'])) {
            $scheduledAt = new DateTime($body['scheduled_at'] ?? $appointment['scheduled_at']);
            $duration = $body['duration_minutes'] ?? $appointment['duration_minutes'];
            $endAt = clone $scheduledAt;
            $endAt->modify("+{$duration} minutes");
            $updates[] = 'end_at = ?';
            $params[] = $endAt->format('Y-m-d H:i:s');
        }
        
        if (empty($updates)) {
            Response::json(['message' => 'No updates provided']);
            return;
        }
        
        $params[] = $id;
        $params[] = $userId;
        
        $stmt = $pdo->prepare('UPDATE appointments SET ' . implode(', ', $updates) . ' WHERE id = ? AND user_id = ?');
        $stmt->execute($params);
        
        Response::json(['message' => 'Appointment updated successfully']);
    }
    
    public static function cancelAppointment(string $id): void {
        $userId = Auth::userIdOrFail();
        $body = get_json_body();
        $pdo = Database::conn();
        
        $stmt = $pdo->prepare('
            UPDATE appointments 
            SET status = ?, cancellation_reason = ?, cancelled_by = ?
            WHERE id = ? AND user_id = ?
        ');
        $stmt->execute([
            'cancelled',
            $body['reason'] ?? null,
            'host',
            $id,
            $userId
        ]);
        
        if ($stmt->rowCount() === 0) {
            Response::notFound('Appointment not found');
            return;
        }
        
        // TODO: Send cancellation email
        
        Response::json(['message' => 'Appointment cancelled successfully']);
    }
    
    public static function rescheduleAppointment(string $id): void {
        $userId = Auth::userIdOrFail();
        $body = get_json_body();
        $pdo = Database::conn();
        
        if (empty($body['new_scheduled_at'])) {
            Response::validationError('New scheduled time is required');
            return;
        }
        
        $stmt = $pdo->prepare('SELECT * FROM appointments WHERE id = ? AND user_id = ?');
        $stmt->execute([$id, $userId]);
        $appointment = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$appointment) {
            Response::notFound('Appointment not found');
            return;
        }
        
        $scheduledAt = new DateTime($body['new_scheduled_at']);
        $endAt = clone $scheduledAt;
        $endAt->modify("+{$appointment['duration_minutes']} minutes");
        
        $stmt = $pdo->prepare('
            UPDATE appointments 
            SET scheduled_at = ?, end_at = ?, status = ?
            WHERE id = ? AND user_id = ?
        ');
        $stmt->execute([
            $scheduledAt->format('Y-m-d H:i:s'),
            $endAt->format('Y-m-d H:i:s'),
            'rescheduled',
            $id,
            $userId
        ]);
        
        // TODO: Send reschedule notification
        
        Response::json(['message' => 'Appointment rescheduled successfully']);
    }
    
    // ==================== PUBLIC BOOKING ====================
    
    public static function getPublicBookingPage(string $userSlug, ?string $typeSlug = null): void {
        $pdo = Database::conn();
        
        // Get user by booking page slug
        $stmt = $pdo->prepare('
            SELECT u.id, u.name, bps.page_title, bps.welcome_message, bps.logo_url, bps.brand_color
            FROM users u
            JOIN booking_page_settings bps ON u.id = bps.user_id
            WHERE bps.page_slug = ?
        ');
        $stmt->execute([$userSlug]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$user) {
            Response::notFound('Booking page not found');
            return;
        }

        if ($typeSlug) {
            // Specific booking type mode
            $stmt = $pdo->prepare('
                SELECT * FROM booking_types 
                WHERE user_id = ? AND slug = ? AND is_active = 1
            ');
            $stmt->execute([$user['id'], $typeSlug]);
            $bookingType = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$bookingType) {
                Response::notFound('Booking type not found');
                return;
            }
            
            Response::json([
                'user' => [
                    'name' => $user['name'],
                    'page_title' => $user['page_title'],
                    'welcome_message' => $user['welcome_message'],
                    'logo_url' => $user['logo_url'],
                    'brand_color' => $user['brand_color']
                ],
                'booking_type' => $bookingType
            ]);
        } else {
            // Landing page mode (list all types)
            $stmt = $pdo->prepare('
                SELECT * FROM booking_types 
                WHERE user_id = ? AND is_active = 1
                ORDER BY created_at DESC
            ');
            $stmt->execute([$user['id']]);
            $bookingTypes = $stmt->fetchAll(PDO::FETCH_ASSOC);

            Response::json([
                'user' => [
                    'name' => $user['name'],
                    'page_title' => $user['page_title'],
                    'welcome_message' => $user['welcome_message'],
                    'logo_url' => $user['logo_url'],
                    'brand_color' => $user['brand_color']
                ],
                'booking_types' => $bookingTypes
            ]);
        }
    }
    
    public static function getAvailableSlots(string $userSlug, string $typeSlug): void {
        $pdo = Database::conn();
        
        $date = $_GET['date'] ?? date('Y-m-d');
        
        // Get user and booking type
        $stmt = $pdo->prepare('
            SELECT bt.*, u.id as owner_id
            FROM booking_types bt
            JOIN booking_page_settings bps ON bt.user_id = bps.user_id
            JOIN users u ON bt.user_id = u.id
            WHERE bps.page_slug = ? AND bt.slug = ? AND bt.is_active = 1
        ');
        $stmt->execute([$userSlug, $typeSlug]);
        $bookingType = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$bookingType) {
            Response::notFound('Booking type not found');
            return;
        }
        
        $userId = $bookingType['owner_id'];
        $dayOfWeek = date('w', strtotime($date));
        
        // Get availability for this day
        $stmt = $pdo->prepare('
            SELECT as2.start_time, as2.end_time 
            FROM availability_slots as2
            JOIN availability_schedules asc ON as2.schedule_id = asc.id
            WHERE asc.user_id = ? AND asc.is_default = 1 AND as2.day_of_week = ? AND as2.is_available = 1
        ');
        $stmt->execute([$userId, $dayOfWeek]);
        $slots = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Check for overrides
        $stmt = $pdo->prepare('SELECT * FROM availability_overrides WHERE user_id = ? AND override_date = ?');
        $stmt->execute([$userId, $date]);
        $override = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($override && !$override['is_available']) {
            Response::json(['slots' => [], 'message' => 'Not available on this date']);
            return;
        }
        
        // Get existing appointments for this date with more details
        $stmt = $pdo->prepare('
            SELECT scheduled_at, end_at, booking_type_id 
            FROM appointments 
            WHERE user_id = ? AND DATE(scheduled_at) = ? AND status NOT IN (?, ?)
        ');
        $stmt->execute([$userId, $date, 'cancelled', 'no_show']);
        $existingAppointments = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Generate available time slots
        $availableSlots = [];
        $duration = $bookingType['duration_minutes'];
        $bufferBefore = $bookingType['buffer_before'];
        $bufferAfter = $bookingType['buffer_after'];
        $isGroupEvent = !empty($bookingType['is_group_event']);
        $maxParticipants = $bookingType['max_participants'] ?? 1;
        
        foreach ($slots as $slot) {
            $start = new DateTime($date . ' ' . $slot['start_time']);
            $end = new DateTime($date . ' ' . $slot['end_time']);
            
            while ($start < $end) {
                $slotEnd = clone $start;
                $slotEnd->modify("+{$duration} minutes");
                
                if ($slotEnd > $end) break;
                
                // Check if slot conflicts with existing appointments
                $isAvailable = true;
                $currentParticipants = 0;
                
                foreach ($existingAppointments as $appt) {
                    $apptStart = new DateTime($appt['scheduled_at']);
                    $apptEnd = new DateTime($appt['end_at']);
                    
                    // Smart Buffer & Overlap Logic
                    $overlapType = $bookingType['overlap_prevention'] ?? 'strict';
                    $travelTime = $bookingType['travel_time_minutes'] ?? 0;
                    
                    if ($overlapType === 'none') {
                        // Allow double booking
                        continue;
                    }
                    
                    // For group events, checking "Same Event" vs "Conflict"
                    if ($isGroupEvent) {
                         // Logic: If it's the exact same time AND same booking type, it's a participant, not a block.
                         // Note: We use string comparison for exact time match to be safe
                         if ($appt['booking_type_id'] == $bookingType['id'] && 
                             $apptStart->format('H:i') == $start->format('H:i')) {
                             $currentParticipants++;
                             continue; // Count participant and move to next appointment validation
                         }
                    }

                    // Add buffers (Fixed)
                    $effectiveBufferBefore = $bufferBefore + $travelTime;
                    $effectiveBufferAfter = $bufferAfter;

                    $apptStart->modify("-{$effectiveBufferBefore} minutes");
                    $apptEnd->modify("+{$effectiveBufferAfter} minutes");
                    
                    // Check intersection
                    if ($overlapType === 'allow_partial') {
                         // Reset to core appointment times for Strict check
                         $coreApptStart = new DateTime($appt['scheduled_at']);
                         $coreApptEnd = new DateTime($appt['end_at']);
                         
                         if ($slotEnd > $coreApptStart && $start < $coreApptEnd) {
                             $isAvailable = false;
                             break;
                         }
                    } else {
                        // Strict
                         if ($start < $apptEnd && $slotEnd > $apptStart) {
                            $isAvailable = false;
                            break;
                        }
                    }
                }
                
                if ($isAvailable) {
                    // Final capacity check for group events
                    if ($isGroupEvent && $currentParticipants >= $maxParticipants) {
                         // If waitlist enabled, we might still return it but marked as full/waitlist
                         if (!empty($bookingType['waitlist_enabled'])) {
                             $availableSlots[] = [
                                'start' => $start->format('H:i'),
                                'end' => $slotEnd->format('H:i'),
                                'spots_remaining' => 0,
                                'is_waitlist' => true
                            ];
                         }
                    } else {
                        $availableSlots[] = [
                            'start' => $start->format('H:i'),
                            'end' => $slotEnd->format('H:i'),
                            'spots_remaining' => $isGroupEvent ? ($maxParticipants - $currentParticipants) : 1,
                            'is_waitlist' => false
                        ];
                    }
                }
                
                $start->modify("+{$duration} minutes");
                $start->modify("+{$bufferAfter} minutes");
            }
        }
        
        Response::json(['slots' => $availableSlots]);
    }
    
    public static function createPaymentIntent(string $userSlug, string $typeSlug): void {
        $body = get_json_body();
        $pdo = Database::conn();
        
        // Get booking type
        $stmt = $pdo->prepare('
            SELECT bt.*, bps.user_id as owner_id
            FROM booking_types bt
            JOIN booking_page_settings bps ON bt.user_id = bps.user_id
            WHERE bps.page_slug = ? AND bt.slug = ? AND bt.is_active = 1
        ');
        $stmt->execute([$userSlug, $typeSlug]);
        $bookingType = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$bookingType) {
            Response::notFound('Booking type not found');
            return;
        }
        
        if (!$bookingType['requires_payment'] && !$bookingType['require_deposit']) {
            Response::json(['message' => 'Payment not required'], 400);
            return;
        }
        
        // Determine amount
        $amount = (float)$bookingType['price'];
        if ($bookingType['require_deposit'] && $bookingType['deposit_amount'] > 0) {
            $amount = (float)$bookingType['deposit_amount'];
        }
        
        try {
            $intent = PaymentService::createPaymentIntent(
                $bookingType['owner_id'],
                $amount, 
                $bookingType['currency'] ?? 'USD'
            );
            
            Response::json([
                'clientSecret' => $intent['client_secret'],
                'paymentIntentId' => $intent['id'],
                'amount' => $amount,
                'currency' => $bookingType['currency'] ?? 'USD',
                'mock' => $intent['mock'] ?? false
            ]);
        } catch (Exception $e) {
            Response::error('Payment initialization failed: ' . $e->getMessage());
        }
    }

    public static function bookPublicAppointment(string $userSlug, string $typeSlug): void {
        $body = get_json_body();
        $pdo = Database::conn();
        
        // Validate required fields
        if (empty($body['guest_name']) || empty($body['guest_email']) || empty($body['scheduled_at'])) {
            Response::validationError('Name, email, and time are required');
            return;
        }
        
        // Get booking type
        $stmt = $pdo->prepare('
            SELECT bt.*, bps.user_id as owner_id
            FROM booking_types bt
            JOIN booking_page_settings bps ON bt.user_id = bps.user_id
            WHERE bps.page_slug = ? AND bt.slug = ? AND bt.is_active = 1
        ');
        $stmt->execute([$userSlug, $typeSlug]);
        $bookingType = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$bookingType) {
            Response::notFound('Booking type not found');
            return;
        }
        
        $userId = $bookingType['owner_id'];
        $duration = $bookingType['duration_minutes'];
        
        $scheduledAt = new DateTime($body['scheduled_at']);
        $endAt = clone $scheduledAt;
        $endAt->modify("+{$duration} minutes");
        
        // Check capacity for Group Events
        $status = 'scheduled';
        $isWaitlist = false;
        
        if (!empty($bookingType['is_group_event'])) {
            $stmt = $pdo->prepare('
                SELECT COUNT(*) FROM appointments 
                WHERE booking_type_id = ? AND scheduled_at = ? AND status NOT IN (?, ?)
            ');
            $stmt->execute([
                $bookingType['id'],
                $scheduledAt->format('Y-m-d H:i:s'),
                'cancelled',
                'no_show'
            ]);
            $count = $stmt->fetchColumn();
            $max = $bookingType['max_participants'] ?? 1;
            
            if ($count >= $max) {
                if (!empty($bookingType['waitlist_enabled'])) {
                    $status = 'waitlist';
                    $isWaitlist = true;
                } else {
                    Response::validationError('Class is full');
                    return;
                }
            }
        }
        
        // Payment Logic - Verify & Record
        $paymentStatus = 'unpaid';
        $transactionId = null;
        
        if (!empty($bookingType['requires_payment']) && $status !== 'waitlist') {
            if (empty($body['paymentIntentId'])) {
                Response::validationError('Payment is required');
                return;
            }
            
            try {
                $verification = PaymentService::verifyPaymentIntent($userId, $body['paymentIntentId']);
                if ($verification['status'] !== 'succeeded') {
                     throw new Exception('Payment not successful');
                }
                
                $transactionId = $body['paymentIntentId'];
                $paymentStatus = 'paid';
                if (!empty($bookingType['require_deposit'])) {
                    $paymentStatus = 'deposit_paid';
                }
            } catch (Exception $e) {
                Response::error('Payment verification failed: ' . $e->getMessage(), 402);
                return;
            }
        }

        // Create appointment
        $stmt = $pdo->prepare('
            INSERT INTO appointments (user_id, booking_type_id, guest_name, guest_email, guest_phone,
                title, description, scheduled_at, duration_minutes, end_at, timezone, 
                location_type, location, meeting_link, status, payment_status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ');
        $stmt->execute([
            $userId,
            $bookingType['id'],
            $body['guest_name'],
            $body['guest_email'],
            $body['guest_phone'] ?? null,
            $bookingType['name'] . ' with ' . $body['guest_name'],
            $body['notes'] ?? null,
            $scheduledAt->format('Y-m-d H:i:s'),
            $duration,
            $endAt->format('Y-m-d H:i:s'),
            $body['timezone'] ?? 'UTC',
            $bookingType['location_type'],
            $bookingType['location_details'],
            $bookingType['meeting_link_template'],
            $status,
            $paymentStatus
        ]);
        
        $appointmentId = $pdo->lastInsertId();
        
        // Record Transaction
        if ($transactionId) {
             PaymentService::recordPayment($userId, [
                 'appointment_id' => $appointmentId,
                 'amount' => (!empty($bookingType['require_deposit'])) ? $bookingType['deposit_amount'] : $bookingType['price'],
                 'currency' => $bookingType['currency'] ?? 'USD',
                 'transaction_id' => $transactionId,
                 'contact_id' => null, 
                 'status' => 'completed'
             ]);
        }
        
        // Send confirmation emails
        self::sendConfirmationEmail($pdo, $appointmentId, $bookingType, $body, $scheduledAt, $endAt, $status);
        
        Response::json([
            'id' => $appointmentId,
            'message' => 'Appointment booked successfully',
            'scheduled_at' => $scheduledAt->format('Y-m-d H:i:s'),
            'duration_minutes' => $duration
        ], 201);
    }

    private static function sendConfirmationEmail($pdo, $appointmentId, $bookingType, $guestData, $start, $end, $status) {
        // Get Host (Owner) Email
        $stmt = $pdo->prepare('SELECT name, email FROM users WHERE id = ?');
        $stmt->execute([$bookingType['owner_id']]);
        $host = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$host) return;

        $subject = "Appointment Confirmed: " . $bookingType['name'];
        if ($status === 'waitlist') {
            $subject = "Waitlist Confirmation: " . $bookingType['name'];
        }

        // Simple Email Content for Guest
        $guestContent = "
            <h1>Hello {$guestData['guest_name']},</h1>
            <p>" . ($status === 'waitlist' ? "You have been added to the waitlist for:" : "Your appointment is confirmed:") . "</p>
            <h3>{$bookingType['name']}</h3>
            <p><strong>When:</strong> " . $start->format('F j, Y, g:i a') . " - " . $end->format('g:i a') . " (" . ($guestData['timezone'] ?? 'UTC') . ")</p>
            <p><strong>Where:</strong> " . ($bookingType['location_type'] === 'video' ? 'Video Call (Link provided)' : $bookingType['location_details'] ?? 'TBD') . "</p>
            " . (!empty($bookingType['meeting_link_template']) ? "<p><strong>Meeting Link:</strong> <a href='{$bookingType['meeting_link_template']}'>Join Meeting</a></p>" : "") . "
            <br>
            <p>Need to reschedule? Reply to this email.</p>
        ";

        // Simple Email Content for Host
        $hostContent = "
            <h1>New Booking!</h1>
            <p><strong>Guest:</strong> {$guestData['guest_name']} ({$guestData['guest_email']})</p>
            <p><strong>Event:</strong> {$bookingType['name']}</p>
            <p><strong>Time:</strong> " . $start->format('F j, Y, g:i a') . "</p>
            <p><strong>Status:</strong> " . ucfirst($status) . "</p>
            " . (!empty($guestData['notes']) ? "<p><strong>Notes:</strong> {$guestData['notes']}</p>" : "") . "
        ";

        // Use standard PHP mail for MVP reliability
        // In production, we would use the SimpleMail service with proper SMTP
        $headers = "MIME-Version: 1.0\r\n";
        $headers .= "Content-Type: text/html; charset=UTF-8\r\n";
        $headers .= "From: " . $host['name'] . " <" . $host['email'] . ">\r\n";

        // Send to Guest
        mail($guestData['guest_email'], $subject, $guestContent, $headers);

        // Send to Host
        $hostHeaders = "MIME-Version: 1.0\r\n";
        $hostHeaders .= "Content-Type: text/html; charset=UTF-8\r\n";
        $hostHeaders .= "From: System <no-reply@xordon.com>\r\n"; // Prevent self-spam loops
        mail($host['email'], "New Booking: " . $guestData['guest_name'], $hostContent, $hostHeaders);
    }
    
    // ==================== BOOKING PAGE SETTINGS ====================
    
    public static function getBookingPageSettings(): void {
        $userId = Auth::userIdOrFail();
        $pdo = Database::conn();
        
        $stmt = $pdo->prepare('SELECT * FROM booking_page_settings WHERE user_id = ?');
        $stmt->execute([$userId]);
        $settings = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$settings) {
            $settings = [
                'page_slug' => '',
                'page_title' => '',
                'welcome_message' => '',
                'brand_color' => '#3B82F6',
                'show_branding' => true,
                'require_phone' => false
            ];
        }
        
        Response::json($settings);
    }
    
    public static function updateBookingPageSettings(): void {
        $userId = Auth::userIdOrFail();
        $body = get_json_body();
        $pdo = Database::conn();
        
        $stmt = $pdo->prepare('SELECT id FROM booking_page_settings WHERE user_id = ?');
        $stmt->execute([$userId]);
        $exists = $stmt->fetch();
        
        if ($exists) {
            $updates = [];
            $params = [];
            
            $fields = ['page_slug', 'page_title', 'welcome_message', 'logo_url', 'brand_color',
                       'show_branding', 'require_phone', 'custom_questions', 'confirmation_message', 'redirect_url'];
            foreach ($fields as $field) {
                if (isset($body[$field])) {
                    $updates[] = "$field = ?";
                    $params[] = is_array($body[$field]) ? json_encode($body[$field]) : $body[$field];
                }
            }
            
            if (!empty($updates)) {
                $params[] = $userId;
                $stmt = $pdo->prepare('UPDATE booking_page_settings SET ' . implode(', ', $updates) . ' WHERE user_id = ?');
                $stmt->execute($params);
            }
        } else {
            $slug = $body['page_slug'] ?? strtolower(preg_replace('/[^a-zA-Z0-9]+/', '-', $body['page_title'] ?? 'booking'));
            
            $stmt = $pdo->prepare('
                INSERT INTO booking_page_settings (user_id, page_slug, page_title, welcome_message, brand_color, show_branding, require_phone)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            ');
            $stmt->execute([
                $userId,
                $slug,
                $body['page_title'] ?? '',
                $body['welcome_message'] ?? '',
                $body['brand_color'] ?? '#3B82F6',
                $body['show_branding'] ?? true,
                $body['require_phone'] ?? false
            ]);
        }
        
        Response::json(['message' => 'Booking page settings updated successfully']);
    }
    
    // ==================== DASHBOARD STATS ====================
    
    public static function getDashboardStats(): void {
        $userId = Auth::userIdOrFail();
        $pdo = Database::conn();
        
        // Upcoming appointments
        $stmt = $pdo->prepare('SELECT COUNT(*) as count FROM appointments WHERE user_id = ? AND scheduled_at > NOW() AND status IN (?, ?)');
        $stmt->execute([$userId, 'scheduled', 'confirmed']);
        $upcoming = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
        
        // Today's appointments
        $stmt = $pdo->prepare('SELECT COUNT(*) as count FROM appointments WHERE user_id = ? AND DATE(scheduled_at) = CURDATE() AND status IN (?, ?)');
        $stmt->execute([$userId, 'scheduled', 'confirmed']);
        $today = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
        
        // This week
        $stmt = $pdo->prepare('SELECT COUNT(*) as count FROM appointments WHERE user_id = ? AND YEARWEEK(scheduled_at) = YEARWEEK(NOW()) AND status IN (?, ?)');
        $stmt->execute([$userId, 'scheduled', 'confirmed']);
        $thisWeek = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
        
        // Completed this month
        $stmt = $pdo->prepare('SELECT COUNT(*) as count FROM appointments WHERE user_id = ? AND MONTH(scheduled_at) = MONTH(NOW()) AND YEAR(scheduled_at) = YEAR(NOW()) AND status = ?');
        $stmt->execute([$userId, 'completed']);
        $completedThisMonth = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
        
        // Cancellation rate
        $stmt = $pdo->prepare('SELECT COUNT(*) as total, SUM(CASE WHEN status = ? THEN 1 ELSE 0 END) as cancelled FROM appointments WHERE user_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)');
        $stmt->execute(['cancelled', $userId]);
        $rates = $stmt->fetch(PDO::FETCH_ASSOC);
        $cancellationRate = $rates['total'] > 0 ? round(($rates['cancelled'] / $rates['total']) * 100, 1) : 0;
        
        Response::json([
            'upcoming' => (int) $upcoming,
            'today' => (int) $today,
            'this_week' => (int) $thisWeek,
            'completed_this_month' => (int) $completedThisMonth,
            'cancellation_rate' => $cancellationRate
        ]);
    }
    
    // ==================== DELETE APPOINTMENT ====================
    
    public static function deleteAppointment(string $id): void {
        $userId = Auth::userIdOrFail();
        $pdo = Database::conn();
        
        $stmt = $pdo->prepare('DELETE FROM appointments WHERE id = ? AND user_id = ?');
        $stmt->execute([$id, $userId]);
        
        if ($stmt->rowCount() === 0) {
            Response::notFound('Appointment not found');
            return;
        }
        
        Response::json(['message' => 'Appointment deleted successfully']);
    }
    
    // ==================== PUBLIC BOOKING PAGE LIST ====================
    
    public static function getPublicBookingPageList(string $userSlug): void {
        $pdo = Database::conn();
        
        // Get user by booking page slug
        $stmt = $pdo->prepare('
            SELECT u.id, u.name, bps.page_title, bps.welcome_message, bps.logo_url, bps.brand_color
            FROM users u
            JOIN booking_page_settings bps ON u.id = bps.user_id
            WHERE bps.page_slug = ?
        ');
        $stmt->execute([$userSlug]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$user) {
            Response::notFound('Booking page not found');
            return;
        }
        
        // Get all active booking types for this user
        $stmt = $pdo->prepare('
            SELECT id, name, slug, description, duration_minutes, location_type, location_details, 
                   price, currency, color
            FROM booking_types 
            WHERE user_id = ? AND is_active = 1
            ORDER BY name ASC
        ');
        $stmt->execute([$user['id']]);
        $bookingTypes = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        Response::json([
            'user' => [
                'name' => $user['name'],
                'page_title' => $user['page_title'],
                'welcome_message' => $user['welcome_message'],
                'logo_url' => $user['logo_url'],
                'brand_color' => $user['brand_color']
            ],
            'booking_types' => $bookingTypes
        ]);
    }
    
    // ==================== AUTOMATION TRIGGERS ====================
    
    /**
     * Fire an automation trigger for appointment events
     */
    public static function fireAppointmentTrigger(int $userId, string $triggerType, int $appointmentId, ?int $contactId = null, array $extraData = []): array {
        // Include the FollowUpAutomationsController if not already loaded
        require_once __DIR__ . '/FollowUpAutomationsController.php';
        
        $pdo = Database::conn();
        
        // Get appointment details
        $stmt = $pdo->prepare('
            SELECT a.*, bt.name as booking_type_name, bt.slug as booking_type_slug
            FROM appointments a
            LEFT JOIN booking_types bt ON a.booking_type_id = bt.id
            WHERE a.id = ? AND a.user_id = ?
        ');
        $stmt->execute([$appointmentId, $userId]);
        $appointment = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$appointment) {
            return ['success' => false, 'error' => 'Appointment not found'];
        }
        
        // Use contact_id from appointment if not provided
        $contactId = $contactId ?? $appointment['contact_id'];
        
        // Build trigger data
        $triggerData = array_merge([
            'appointment_id' => $appointmentId,
            'booking_type_id' => $appointment['booking_type_id'],
            'booking_type_name' => $appointment['booking_type_name'],
            'scheduled_at' => $appointment['scheduled_at'],
            'duration_minutes' => $appointment['duration_minutes'],
            'location_type' => $appointment['location_type'],
            'status' => $appointment['status'],
            'guest_name' => $appointment['guest_name'],
            'guest_email' => $appointment['guest_email'],
        ], $extraData);
        
        // Process the trigger through the automations system
        if ($contactId) {
            return FollowUpAutomationsController::processTrigger($userId, 'appointment', $triggerType, $contactId, $triggerData);
        }
        
        return ['success' => true, 'message' => 'No contact associated with appointment'];
    }
    
    /**
     * Get appointments that need reminder triggers
     */
    public static function getAppointmentsNeedingReminders(): void {
        // This would be called by a cron job
        $pdo = Database::conn();
        
        // Get appointments scheduled for 24 hours from now (within a 5-minute window)
        $stmt = $pdo->prepare("
            SELECT a.*, u.id as owner_id
            FROM appointments a
            JOIN users u ON a.user_id = u.id
            WHERE a.status IN ('scheduled', 'confirmed')
            AND a.scheduled_at BETWEEN DATE_ADD(NOW(), INTERVAL 23 HOUR) AND DATE_ADD(NOW(), INTERVAL 24 HOUR)
            AND a.reminder_24h_sent = 0
        ");
        $stmt->execute();
        $appointments = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        $results = [];
        foreach ($appointments as $appointment) {
            $result = self::fireAppointmentTrigger(
                $appointment['owner_id'],
                'appointment_reminder_due',
                $appointment['id'],
                $appointment['contact_id']
            );
            $results[] = $result;
            
            // Mark reminder as sent
            $updateStmt = $pdo->prepare('UPDATE appointments SET reminder_24h_sent = 1 WHERE id = ?');
            $updateStmt->execute([$appointment['id']]);
        }
        
        Response::json(['processed' => count($results), 'results' => $results]);
    }
    
    /**
     * Get appointments starting soon (1 hour)
     */
    public static function getAppointmentsStartingSoon(): void {
        $pdo = Database::conn();
        
        $stmt = $pdo->prepare("
            SELECT a.*, u.id as owner_id
            FROM appointments a
            JOIN users u ON a.user_id = u.id
            WHERE a.status IN ('scheduled', 'confirmed')
            AND a.scheduled_at BETWEEN DATE_ADD(NOW(), INTERVAL 55 MINUTE) AND DATE_ADD(NOW(), INTERVAL 65 MINUTE)
            AND a.reminder_1h_sent = 0
        ");
        $stmt->execute();
        $appointments = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        $results = [];
        foreach ($appointments as $appointment) {
            $result = self::fireAppointmentTrigger(
                $appointment['owner_id'],
                'appointment_starting_soon',
                $appointment['id'],
                $appointment['contact_id']
            );
            $results[] = $result;
            
            // Mark reminder as sent
            $updateStmt = $pdo->prepare('UPDATE appointments SET reminder_1h_sent = 1 WHERE id = ?');
            $updateStmt->execute([$appointment['id']]);
        }
        
        Response::json(['processed' => count($results), 'results' => $results]);
    }
    
    /**
     * Generate a booking link for a contact
     */
    public static function generateBookingLink(): void {
        $userId = Auth::userIdOrFail();
        $body = get_json_body();
        $pdo = Database::conn();
        
        $bookingTypeId = $body['booking_type_id'] ?? null;
        $contactId = $body['contact_id'] ?? null;
        
        // Get booking page settings
        $stmt = $pdo->prepare('SELECT page_slug FROM booking_page_settings WHERE user_id = ?');
        $stmt->execute([$userId]);
        $settings = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$settings || !$settings['page_slug']) {
            Response::error('Booking page not configured. Please set up your booking page first.', 400);
            return;
        }
        
        // Get booking type slug
        $bookingTypeSlug = null;
        if ($bookingTypeId) {
            $stmt = $pdo->prepare('SELECT slug FROM booking_types WHERE id = ? AND user_id = ?');
            $stmt->execute([$bookingTypeId, $userId]);
            $bookingType = $stmt->fetch(PDO::FETCH_ASSOC);
            $bookingTypeSlug = $bookingType['slug'] ?? null;
        }
        
        // Build the booking URL
        $baseUrl = rtrim($_ENV['APP_URL'] ?? 'http://localhost:5173', '/');
        $bookingUrl = $baseUrl . '/book/' . $settings['page_slug'];
        
        if ($bookingTypeSlug) {
            $bookingUrl .= '/' . $bookingTypeSlug;
        }
        
        // Add contact pre-fill parameters if contact provided
        if ($contactId) {
            $stmt = $pdo->prepare('SELECT first_name, last_name, email, phone FROM contacts WHERE id = ? AND user_id = ?');
            $stmt->execute([$contactId, $userId]);
            $contact = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if ($contact) {
                $params = [];
                if ($contact['first_name']) $params['name'] = trim($contact['first_name'] . ' ' . ($contact['last_name'] ?? ''));
                if ($contact['email']) $params['email'] = $contact['email'];
                if ($contact['phone']) $params['phone'] = $contact['phone'];
                
                if (!empty($params)) {
                    $bookingUrl .= '?' . http_build_query($params);
                }
            }
        }
        
        Response::json([
            'booking_url' => $bookingUrl,
            'page_slug' => $settings['page_slug'],
            'booking_type_slug' => $bookingTypeSlug,
        ]);
    }
    
    /**
     * Get embeddable widget code
     */
    public static function getWidgetCode(): void {
        $userId = Auth::userIdOrFail();
        $pdo = Database::conn();
        
        // Get booking page settings
        $stmt = $pdo->prepare('SELECT * FROM booking_page_settings WHERE user_id = ?');
        $stmt->execute([$userId]);
        $settings = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$settings || !$settings['page_slug']) {
            Response::error('Booking page not configured', 400);
            return;
        }
        
        $baseUrl = rtrim($_ENV['APP_URL'] ?? 'http://localhost:5173', '/');
        $pageSlug = $settings['page_slug'];
        $brandColor = $settings['brand_color'] ?? '#3B82F6';
        
        // Generate inline widget code
        $inlineCode = <<<HTML
<!-- Booking Widget - Inline -->
<div id="booking-widget-{$pageSlug}" style="width: 100%; min-height: 600px;">
  <iframe 
    src="{$baseUrl}/book/{$pageSlug}?embed=true" 
    style="width: 100%; height: 100%; min-height: 600px; border: none; border-radius: 8px;"
    title="Book an Appointment"
  ></iframe>
</div>
HTML;

        // Generate popup button code
        $popupCode = <<<HTML
<!-- Booking Widget - Popup Button -->
<button 
  onclick="window.open('{$baseUrl}/book/{$pageSlug}?popup=true', 'booking', 'width=500,height=700,scrollbars=yes')"
  style="background-color: {$brandColor}; color: white; padding: 12px 24px; border: none; border-radius: 6px; cursor: pointer; font-size: 16px; font-weight: 500;"
>
  Book an Appointment
</button>
HTML;

        // Generate floating button code
        $floatingCode = <<<HTML
<!-- Booking Widget - Floating Button -->
<style>
  .booking-float-btn {
    position: fixed;
    bottom: 20px;
    right: 20px;
    background-color: {$brandColor};
    color: white;
    padding: 16px 24px;
    border: none;
    border-radius: 50px;
    cursor: pointer;
    font-size: 16px;
    font-weight: 500;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    z-index: 9999;
    transition: transform 0.2s, box-shadow 0.2s;
  }
  .booking-float-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(0,0,0,0.2);
  }
</style>
<button 
  class="booking-float-btn"
  onclick="window.open('{$baseUrl}/book/{$pageSlug}?popup=true', 'booking', 'width=500,height=700,scrollbars=yes')"
>
  📅 Book Now
</button>
HTML;

        Response::json([
            'inline' => $inlineCode,
            'popup' => $popupCode,
            'floating' => $floatingCode,
            'base_url' => $baseUrl,
            'page_slug' => $pageSlug,
            'brand_color' => $brandColor,
        ]);
    }
}
