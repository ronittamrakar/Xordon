<?php
/**
 * AppointmentsV2Controller - GHL-style Appointments/Calendar
 * Handles booking types, availability, and appointments
 */

require_once __DIR__ . '/../Database.php';
require_once __DIR__ . '/../Response.php';
require_once __DIR__ . '/../Auth.php';
require_once __DIR__ . '/../TenantContext.php';

class AppointmentsV2Controller {
    
    private static function getScope(): array {
        $ctx = $GLOBALS['tenantContext'] ?? null;
        if (!$ctx || !isset($ctx->workspaceId)) {
            Response::error('Workspace context required', 403);
            exit;
        }
        return [
            'workspace_id' => (int)$ctx->workspaceId,
            'company_id' => $ctx->activeCompanyId ? (int)$ctx->activeCompanyId : null
        ];
    }
    
    // ==================== BOOKING TYPES ====================
    
    /**
     * List booking types
     * GET /booking-types
     */
    public static function listBookingTypes(): void {
        $userId = Auth::userIdOrFail();
        $scope = self::getScope();
        $pdo = Database::conn();
        
        $sql = "SELECT bt.*, u.name as user_name,
                    (SELECT COUNT(*) FROM appointments_v2 WHERE booking_type_id = bt.id AND status = 'scheduled') as upcoming_count
                FROM booking_types bt
                LEFT JOIN users u ON bt.user_id = u.id
                WHERE bt.workspace_id = ?";
        $params = [$scope['workspace_id']];
        
        if ($scope['company_id']) {
            $sql .= ' AND (bt.company_id = ? OR bt.company_id IS NULL)';
            $params[] = $scope['company_id'];
        }
        
        $sql .= ' ORDER BY bt.name ASC';
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $types = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        foreach ($types as &$type) {
            $type['questions'] = $type['questions'] ? json_decode($type['questions'], true) : [];
        }
        
        Response::json([
            'success' => true,
            'data' => $types
        ]);
    }
    
    /**
     * Get single booking type
     * GET /booking-types/:id
     */
    public static function getBookingType(int $id): void {
        $userId = Auth::userIdOrFail();
        $scope = self::getScope();
        $pdo = Database::conn();
        
        $stmt = $pdo->prepare("SELECT * FROM booking_types WHERE id = ? AND workspace_id = ?");
        $stmt->execute([$id, $scope['workspace_id']]);
        $type = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$type) {
            Response::notFound('Booking type not found');
            return;
        }
        
        $type['questions'] = $type['questions'] ? json_decode($type['questions'], true) : [];
        
        Response::json([
            'success' => true,
            'data' => $type
        ]);
    }
    
    /**
     * Create booking type
     * POST /booking-types
     */
    public static function createBookingType(): void {
        $userId = Auth::userIdOrFail();
        $scope = self::getScope();
        $body = get_json_body();
        $pdo = Database::conn();
        
        if (empty($body['name'])) {
            Response::validationError('name is required');
            return;
        }
        
        // Generate slug
        $slug = $body['slug'] ?? self::generateSlug($body['name']);
        
        // Check slug uniqueness
        $checkStmt = $pdo->prepare("SELECT id FROM booking_types WHERE workspace_id = ? AND slug = ?");
        $checkStmt->execute([$scope['workspace_id'], $slug]);
        if ($checkStmt->fetch()) {
            $slug .= '-' . substr(uniqid(), -4);
        }
        
        $stmt = $pdo->prepare("
            INSERT INTO booking_types 
            (workspace_id, company_id, user_id, name, slug, description, duration_minutes, 
             buffer_before_minutes, buffer_after_minutes, color, location_type, location_details,
             price, currency, requires_payment, is_active, is_public, max_bookings_per_day,
             min_notice_hours, max_future_days, confirmation_message, reminder_enabled, 
             reminder_hours_before, questions, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
        ");
        $stmt->execute([
            $scope['workspace_id'],
            $scope['company_id'],
            $body['user_id'] ?? $userId,
            $body['name'],
            $slug,
            $body['description'] ?? null,
            $body['duration_minutes'] ?? 30,
            $body['buffer_before_minutes'] ?? 0,
            $body['buffer_after_minutes'] ?? 0,
            $body['color'] ?? '#6366f1',
            $body['location_type'] ?? 'video',
            $body['location_details'] ?? null,
            $body['price'] ?? 0,
            $body['currency'] ?? 'USD',
            !empty($body['requires_payment']) ? 1 : 0,
            isset($body['is_active']) ? ($body['is_active'] ? 1 : 0) : 1,
            isset($body['is_public']) ? ($body['is_public'] ? 1 : 0) : 1,
            $body['max_bookings_per_day'] ?? null,
            $body['min_notice_hours'] ?? 1,
            $body['max_future_days'] ?? 60,
            $body['confirmation_message'] ?? null,
            isset($body['reminder_enabled']) ? ($body['reminder_enabled'] ? 1 : 0) : 1,
            $body['reminder_hours_before'] ?? 24,
            isset($body['questions']) ? json_encode($body['questions']) : null
        ]);
        
        $typeId = (int)$pdo->lastInsertId();
        
        Response::json([
            'success' => true,
            'data' => ['id' => $typeId, 'slug' => $slug],
            'message' => 'Booking type created'
        ], 201);
    }
    
    /**
     * Update booking type
     * PUT /booking-types/:id
     */
    public static function updateBookingType(int $id): void {
        $userId = Auth::userIdOrFail();
        $scope = self::getScope();
        $body = get_json_body();
        $pdo = Database::conn();
        
        $fields = ['name', 'description', 'duration_minutes', 'buffer_before_minutes', 
                   'buffer_after_minutes', 'color', 'location_type', 'location_details',
                   'price', 'currency', 'requires_payment', 'is_active', 'is_public',
                   'max_bookings_per_day', 'min_notice_hours', 'max_future_days',
                   'confirmation_message', 'reminder_enabled', 'reminder_hours_before', 'user_id'];
        
        $updates = [];
        $params = [];
        
        foreach ($fields as $field) {
            if (isset($body[$field])) {
                $updates[] = "$field = ?";
                $params[] = $body[$field];
            }
        }
        
        if (isset($body['questions'])) {
            $updates[] = 'questions = ?';
            $params[] = json_encode($body['questions']);
        }
        
        if (empty($updates)) {
            Response::json(['success' => true, 'message' => 'No updates']);
            return;
        }
        
        $params[] = $id;
        $params[] = $scope['workspace_id'];
        
        $sql = "UPDATE booking_types SET " . implode(', ', $updates) . ", updated_at = NOW() WHERE id = ? AND workspace_id = ?";
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        
        Response::json(['success' => true, 'message' => 'Booking type updated']);
    }
    
    /**
     * Delete booking type
     * DELETE /booking-types/:id
     */
    public static function deleteBookingType(int $id): void {
        $userId = Auth::userIdOrFail();
        $scope = self::getScope();
        $pdo = Database::conn();
        
        // Check for existing appointments
        $checkStmt = $pdo->prepare("SELECT COUNT(*) FROM appointments_v2 WHERE booking_type_id = ? AND status = 'scheduled'");
        $checkStmt->execute([$id]);
        if ($checkStmt->fetchColumn() > 0) {
            Response::error('Cannot delete booking type with scheduled appointments', 400);
            return;
        }
        
        $stmt = $pdo->prepare("DELETE FROM booking_types WHERE id = ? AND workspace_id = ?");
        $stmt->execute([$id, $scope['workspace_id']]);
        
        Response::json(['success' => true, 'message' => 'Booking type deleted']);
    }
    
    // ==================== AVAILABILITY ====================
    
    /**
     * Get user availability
     * GET /availability
     */
    public static function getAvailability(): void {
        $userId = Auth::userIdOrFail();
        $scope = self::getScope();
        $pdo = Database::conn();
        
        $targetUserId = $_GET['user_id'] ?? $userId;
        
        $stmt = $pdo->prepare("SELECT * FROM user_availability WHERE user_id = ? AND workspace_id = ? ORDER BY day_of_week, start_time");
        $stmt->execute([$targetUserId, $scope['workspace_id']]);
        $availability = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        Response::json([
            'success' => true,
            'data' => $availability
        ]);
    }
    
    /**
     * Set user availability
     * POST /availability
     */
    public static function setAvailability(): void {
        $userId = Auth::userIdOrFail();
        $scope = self::getScope();
        $body = get_json_body();
        $pdo = Database::conn();
        
        $targetUserId = $body['user_id'] ?? $userId;
        
        if (empty($body['schedule']) || !is_array($body['schedule'])) {
            Response::validationError('schedule array is required');
            return;
        }
        
        $pdo->beginTransaction();
        try {
            // Delete existing availability
            $pdo->prepare("DELETE FROM user_availability WHERE user_id = ? AND workspace_id = ?")
                ->execute([$targetUserId, $scope['workspace_id']]);
            
            // Insert new availability
            $stmt = $pdo->prepare("
                INSERT INTO user_availability (workspace_id, user_id, day_of_week, start_time, end_time, is_available, created_at)
                VALUES (?, ?, ?, ?, ?, ?, NOW())
            ");
            
            foreach ($body['schedule'] as $slot) {
                $stmt->execute([
                    $scope['workspace_id'],
                    $targetUserId,
                    $slot['day_of_week'],
                    $slot['start_time'],
                    $slot['end_time'],
                    isset($slot['is_available']) ? ($slot['is_available'] ? 1 : 0) : 1
                ]);
            }
            
            $pdo->commit();
            
            Response::json(['success' => true, 'message' => 'Availability updated']);
        } catch (Exception $e) {
            $pdo->rollBack();
            Response::error('Failed to update availability: ' . $e->getMessage());
        }
    }
    
    /**
     * Get available time slots for a booking type
     * GET /booking-types/:id/slots
     */
    public static function getAvailableSlots(int $bookingTypeId): void {
        $scope = self::getScope();
        $pdo = Database::conn();
        
        $date = $_GET['date'] ?? date('Y-m-d');
        $days = min((int)($_GET['days'] ?? 7), 30);
        
        // Get booking type
        $typeStmt = $pdo->prepare("SELECT * FROM booking_types WHERE id = ? AND workspace_id = ? AND is_active = 1");
        $typeStmt->execute([$bookingTypeId, $scope['workspace_id']]);
        $bookingType = $typeStmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$bookingType) {
            Response::notFound('Booking type not found');
            return;
        }
        
        $userId = $bookingType['user_id'];
        $duration = (int)$bookingType['duration_minutes'];
        $bufferBefore = (int)$bookingType['buffer_before_minutes'];
        $bufferAfter = (int)$bookingType['buffer_after_minutes'];
        $minNotice = (int)$bookingType['min_notice_hours'];
        
        // Get user availability
        $availStmt = $pdo->prepare("SELECT * FROM user_availability WHERE user_id = ? AND is_available = 1 ORDER BY day_of_week, start_time");
        $availStmt->execute([$userId]);
        $availability = $availStmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Group by day of week
        $availByDay = [];
        foreach ($availability as $slot) {
            $dow = (int)$slot['day_of_week'];
            if (!isset($availByDay[$dow])) $availByDay[$dow] = [];
            $availByDay[$dow][] = $slot;
        }
        
        // Get existing appointments
        $startDate = new DateTime($date);
        $endDate = (clone $startDate)->modify("+$days days");
        
        $apptStmt = $pdo->prepare("
            SELECT start_time, end_time FROM appointments_v2 
            WHERE assigned_user_id = ? AND status IN ('scheduled', 'confirmed')
            AND start_time >= ? AND start_time < ?
        ");
        $apptStmt->execute([$userId, $startDate->format('Y-m-d 00:00:00'), $endDate->format('Y-m-d 23:59:59')]);
        $existingAppts = $apptStmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Build slots
        $slots = [];
        $now = new DateTime();
        $minNoticeTime = (clone $now)->modify("+$minNotice hours");
        
        for ($i = 0; $i < $days; $i++) {
            $currentDate = (clone $startDate)->modify("+$i days");
            $dayOfWeek = (int)$currentDate->format('w'); // 0 = Sunday
            
            if (!isset($availByDay[$dayOfWeek])) continue;
            
            $daySlots = [];
            foreach ($availByDay[$dayOfWeek] as $avail) {
                $slotStart = new DateTime($currentDate->format('Y-m-d') . ' ' . $avail['start_time']);
                $slotEnd = new DateTime($currentDate->format('Y-m-d') . ' ' . $avail['end_time']);
                
                while ($slotStart < $slotEnd) {
                    $appointmentEnd = (clone $slotStart)->modify("+$duration minutes");
                    
                    if ($appointmentEnd > $slotEnd) break;
                    if ($slotStart < $minNoticeTime) {
                        $slotStart->modify("+$duration minutes");
                        continue;
                    }
                    
                    // Check for conflicts
                    $hasConflict = false;
                    $checkStart = (clone $slotStart)->modify("-$bufferBefore minutes");
                    $checkEnd = (clone $appointmentEnd)->modify("+$bufferAfter minutes");
                    
                    foreach ($existingAppts as $appt) {
                        $apptStart = new DateTime($appt['start_time']);
                        $apptEnd = new DateTime($appt['end_time']);
                        
                        if ($checkStart < $apptEnd && $checkEnd > $apptStart) {
                            $hasConflict = true;
                            break;
                        }
                    }
                    
                    if (!$hasConflict) {
                        $daySlots[] = $slotStart->format('H:i');
                    }
                    
                    $slotStart->modify("+$duration minutes");
                }
            }
            
            if (!empty($daySlots)) {
                $slots[$currentDate->format('Y-m-d')] = $daySlots;
            }
        }
        
        Response::json([
            'success' => true,
            'data' => [
                'booking_type' => $bookingType,
                'slots' => $slots
            ]
        ]);
    }
    
    // ==================== APPOINTMENTS ====================
    
    /**
     * List appointments
     * GET /appointments/v2
     */
    public static function listAppointments(): void {
        $userId = Auth::userIdOrFail();
        $scope = self::getScope();
        $pdo = Database::conn();
        
        $status = $_GET['status'] ?? null;
        $startDate = $_GET['start_date'] ?? null;
        $endDate = $_GET['end_date'] ?? null;
        $assignedTo = $_GET['assigned_to'] ?? null;
        
        $where = ['a.workspace_id = ?'];
        $params = [$scope['workspace_id']];
        
        if ($scope['company_id']) {
            $where[] = '(a.company_id = ? OR a.company_id IS NULL)';
            $params[] = $scope['company_id'];
        }
        
        if ($status && in_array($status, ['scheduled', 'confirmed', 'completed', 'cancelled', 'no_show'])) {
            $where[] = 'a.status = ?';
            $params[] = $status;
        }
        
        if ($startDate) {
            $where[] = 'a.start_time >= ?';
            $params[] = $startDate . ' 00:00:00';
        }
        
        if ($endDate) {
            $where[] = 'a.start_time <= ?';
            $params[] = $endDate . ' 23:59:59';
        }
        
        if ($assignedTo === 'me') {
            $where[] = 'a.assigned_user_id = ?';
            $params[] = $userId;
        } elseif ($assignedTo && is_numeric($assignedTo)) {
            $where[] = 'a.assigned_user_id = ?';
            $params[] = (int)$assignedTo;
        }
        
        $whereClause = implode(' AND ', $where);
        
        $sql = "SELECT a.*, bt.name as booking_type_name, bt.color as booking_type_color,
                    u.name as assigned_user_name,
                    c.first_name as contact_first_name, c.last_name as contact_last_name
                FROM appointments_v2 a
                LEFT JOIN booking_types bt ON a.booking_type_id = bt.id
                LEFT JOIN users u ON a.assigned_user_id = u.id
                LEFT JOIN contacts c ON a.contact_id = c.id
                WHERE $whereClause
                ORDER BY a.start_time ASC";
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $appointments = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        foreach ($appointments as &$appt) {
            $appt['answers'] = $appt['answers'] ? json_decode($appt['answers'], true) : [];
        }
        
        Response::json([
            'success' => true,
            'data' => $appointments
        ]);
    }
    
    /**
     * Book appointment (public endpoint)
     * POST /appointments/v2/book
     */
    public static function bookAppointment(): void {
        $body = get_json_body();
        $pdo = Database::conn();
        
        if (empty($body['booking_type_id']) || empty($body['start_time'])) {
            Response::validationError('booking_type_id and start_time are required');
            return;
        }
        
        // Get booking type
        $typeStmt = $pdo->prepare("SELECT * FROM booking_types WHERE id = ? AND is_active = 1 AND is_public = 1");
        $typeStmt->execute([$body['booking_type_id']]);
        $bookingType = $typeStmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$bookingType) {
            Response::notFound('Booking type not found or not available');
            return;
        }
        
        $startTime = new DateTime($body['start_time']);
        $endTime = (clone $startTime)->modify("+{$bookingType['duration_minutes']} minutes");
        
        // Check for conflicts
        $conflictStmt = $pdo->prepare("
            SELECT id FROM appointments_v2 
            WHERE assigned_user_id = ? AND status IN ('scheduled', 'confirmed')
            AND ((start_time <= ? AND end_time > ?) OR (start_time < ? AND end_time >= ?))
        ");
        $conflictStmt->execute([
            $bookingType['user_id'],
            $startTime->format('Y-m-d H:i:s'),
            $startTime->format('Y-m-d H:i:s'),
            $endTime->format('Y-m-d H:i:s'),
            $endTime->format('Y-m-d H:i:s')
        ]);
        
        if ($conflictStmt->fetch()) {
            Response::error('This time slot is no longer available', 409);
            return;
        }
        
        // Create appointment
        $stmt = $pdo->prepare("
            INSERT INTO appointments_v2 
            (workspace_id, company_id, booking_type_id, contact_id, assigned_user_id, title,
             start_time, end_time, timezone, status, location_type, location_details,
             guest_name, guest_email, guest_phone, notes, answers, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'scheduled', ?, ?, ?, ?, ?, ?, ?, NOW())
        ");
        $stmt->execute([
            $bookingType['workspace_id'],
            $bookingType['company_id'],
            $bookingType['id'],
            $body['contact_id'] ?? null,
            $bookingType['user_id'],
            $body['title'] ?? $bookingType['name'],
            $startTime->format('Y-m-d H:i:s'),
            $endTime->format('Y-m-d H:i:s'),
            $body['timezone'] ?? 'UTC',
            $bookingType['location_type'],
            $bookingType['location_details'],
            $body['guest_name'] ?? null,
            $body['guest_email'] ?? null,
            $body['guest_phone'] ?? null,
            $body['notes'] ?? null,
            isset($body['answers']) ? json_encode($body['answers']) : null
        ]);
        
        $appointmentId = (int)$pdo->lastInsertId();
        
        // Emit event
        require_once __DIR__ . '/../services/BusinessEventsService.php';
        BusinessEventsService::onAppointmentBooked(
            $bookingType['workspace_id'],
            $bookingType['company_id'],
            $appointmentId,
            $body['contact_id'] ?? null,
            [
                'start_time' => $startTime->format('Y-m-d H:i:s'),
                'type' => $bookingType['name']
            ]
        );
        
        Response::json([
            'success' => true,
            'data' => ['id' => $appointmentId],
            'message' => 'Appointment booked successfully'
        ], 201);
    }
    
    /**
     * Update appointment status
     * POST /appointments/v2/:id/status
     */
    public static function updateAppointmentStatus(int $id): void {
        $userId = Auth::userIdOrFail();
        $scope = self::getScope();
        $body = get_json_body();
        $pdo = Database::conn();
        
        $status = $body['status'] ?? null;
        if (!$status || !in_array($status, ['scheduled', 'confirmed', 'completed', 'cancelled', 'no_show'])) {
            Response::validationError('Valid status required');
            return;
        }
        
        $updates = ['status = ?'];
        $params = [$status];
        
        if ($status === 'cancelled') {
            $updates[] = 'cancelled_at = NOW()';
            $updates[] = 'cancelled_by = ?';
            $params[] = 'host';
            if (!empty($body['cancellation_reason'])) {
                $updates[] = 'cancellation_reason = ?';
                $params[] = $body['cancellation_reason'];
            }
        }
        
        $params[] = $id;
        $params[] = $scope['workspace_id'];
        
        $sql = "UPDATE appointments_v2 SET " . implode(', ', $updates) . ", updated_at = NOW() WHERE id = ? AND workspace_id = ?";
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        
        Response::json(['success' => true, 'message' => 'Appointment updated']);
    }
    
    /**
     * Get appointment stats
     * GET /appointments/v2/stats
     */
    public static function getStats(): void {
        $userId = Auth::userIdOrFail();
        $scope = self::getScope();
        $pdo = Database::conn();
        
        $where = 'workspace_id = ?';
        $params = [$scope['workspace_id']];
        
        $sql = "SELECT 
                    COUNT(*) as total,
                    SUM(CASE WHEN status = 'scheduled' AND start_time > NOW() THEN 1 ELSE 0 END) as upcoming,
                    SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
                    SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled,
                    SUM(CASE WHEN status = 'no_show' THEN 1 ELSE 0 END) as no_show,
                    SUM(CASE WHEN DATE(start_time) = CURDATE() AND status IN ('scheduled', 'confirmed') THEN 1 ELSE 0 END) as today
                FROM appointments_v2 WHERE $where";
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $stats = $stmt->fetch(PDO::FETCH_ASSOC);
        
        Response::json([
            'success' => true,
            'data' => $stats
        ]);
    }
    
    /**
     * Get public booking page data
     * GET /book/:slug
     */
    public static function getPublicBookingPage(string $slug): void {
        $pdo = Database::conn();
        
        // Find booking type by slug
        $stmt = $pdo->prepare("
            SELECT bt.*, u.name as user_name, w.name as workspace_name
            FROM booking_types bt
            JOIN users u ON bt.user_id = u.id
            JOIN workspaces w ON bt.workspace_id = w.id
            WHERE bt.slug = ? AND bt.is_active = 1 AND bt.is_public = 1
        ");
        $stmt->execute([$slug]);
        $bookingType = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$bookingType) {
            Response::notFound('Booking page not found');
            return;
        }
        
        $bookingType['questions'] = $bookingType['questions'] ? json_decode($bookingType['questions'], true) : [];
        
        Response::json([
            'success' => true,
            'data' => $bookingType
        ]);
    }
    
    private static function generateSlug(string $name): string {
        $slug = strtolower(trim($name));
        $slug = preg_replace('/[^a-z0-9]+/', '-', $slug);
        $slug = trim($slug, '-');
        return $slug ?: 'booking';
    }
}
