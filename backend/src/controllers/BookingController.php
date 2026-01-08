<?php
/**
 * Booking Controller
 * Handles slot generation, public booking, and appointment management
 * Supports per-staff and round-robin booking modes
 */

require_once __DIR__ . '/../Database.php';
require_once __DIR__ . '/../Response.php';
require_once __DIR__ . '/../Auth.php';
require_once __DIR__ . '/../services/JobQueueService.php';
require_once __DIR__ . '/../services/NotificationSender.php';

class BookingController {
    private static function getWorkspaceId(): int {
        $ctx = $GLOBALS['tenantContext'] ?? null;
        if ($ctx && isset($ctx->workspaceId)) {
            return (int)$ctx->workspaceId;
        }
        throw new Exception('Workspace context required');
    }

    /**
     * Get available time slots for a service
     * Supports per-staff and round-robin modes
     */
    public static function getSlots() {
        try {
            $serviceId = $_GET['service_id'] ?? null;
            $date = $_GET['date'] ?? date('Y-m-d');
            $staffId = $_GET['staff_id'] ?? null;
            $mode = $_GET['mode'] ?? 'per_staff'; // per_staff or round_robin
            $workspaceId = isset($_GET['workspace_id']) ? (int)$_GET['workspace_id'] : self::getWorkspaceId();
            
            if (!$serviceId) {
                return Response::error('service_id is required', 400);
            }
            
            $db = Database::conn();
            
            // Get service details
            $stmt = $db->prepare("SELECT * FROM services WHERE id = ? AND workspace_id = ? AND is_active = 1");
            $stmt->execute([$serviceId, $workspaceId]);
            $service = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$service) {
                return Response::error('Service not found', 404);
            }
            
            // Get booking settings and overrides
            $stmt = $db->prepare("SELECT * FROM booking_settings WHERE workspace_id = ?");
            $stmt->execute([$workspaceId]);
            $settings = $stmt->fetch(PDO::FETCH_ASSOC) ?: [
                'min_notice_hours' => 1,
                'max_advance_days' => 60,
                'slot_interval_minutes' => 30
            ];
            
            // Allow overrides from query params (e.g. from booking page config)
            $minNoticeHours = isset($_GET['min_notice_hours']) ? (int)$_GET['min_notice_hours'] : ($settings['min_notice_hours'] ?? 1);
            $maxAdvanceDays = isset($_GET['max_advance_days']) ? (int)$_GET['max_advance_days'] : ($settings['max_advance_days'] ?? 60);
            $bufferBeforeOverride = isset($_GET['buffer_before']) ? (int)$_GET['buffer_before'] : null;
            $bufferAfterOverride = isset($_GET['buffer_after']) ? (int)$_GET['buffer_after'] : null;

            // Validate date
            $dateObj = new DateTime($date);
            $now = new DateTime();
            $minDate = (clone $now)->modify("+{$minNoticeHours} hours");
            $maxDate = (clone $now)->modify("+{$maxAdvanceDays} days");
            
            if ($dateObj < $minDate->setTime(0, 0) || $dateObj > $maxDate) {
                return Response::json(['data' => ['date' => $date, 'slots' => [], 'message' => 'Date outside booking window']]);
            }
            
            // Get staff who can perform this service
            $staffQuery = "
                SELECT sm.* FROM staff_members sm
                JOIN staff_services ss ON sm.id = ss.staff_id
                WHERE ss.service_id = ? AND sm.workspace_id = ? AND sm.is_active = 1 AND sm.accepts_bookings = 1
            ";
            $staffParams = [$serviceId, $workspaceId];
            
            if ($staffId) {
                $staffQuery .= " AND sm.id = ?";
                $staffParams[] = $staffId;
            }
            
            $stmt = $db->prepare($staffQuery);
            $stmt->execute($staffParams);
            $staffMembers = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            if (empty($staffMembers)) {
                return Response::json(['data' => ['date' => $date, 'slots' => [], 'message' => 'No available staff']]);
            }
            
            $dayOfWeek = (int)$dateObj->format('w');
            $duration = $service['duration_minutes'];
            $bufferBefore = $bufferBeforeOverride !== null ? $bufferBeforeOverride : $service['buffer_before_minutes'];
            $bufferAfter = $bufferAfterOverride !== null ? $bufferAfterOverride : $service['buffer_after_minutes'];
            $totalDuration = $duration + $bufferBefore + $bufferAfter;
            $slotInterval = $settings['slot_interval_minutes'];
            
            $allSlots = [];
            
            foreach ($staffMembers as $staff) {
                // Get staff availability for this day
                $stmt = $db->prepare("
                    SELECT * FROM staff_availability 
                    WHERE staff_id = ? AND day_of_week = ? AND is_available = 1
                    ORDER BY start_time
                ");
                $stmt->execute([$staff['id'], $dayOfWeek]);
                $availability = $stmt->fetchAll(PDO::FETCH_ASSOC);
                
                if (empty($availability)) {
                    continue;
                }
                
                // Check for time off
                $stmt = $db->prepare("
                    SELECT * FROM staff_time_off 
                    WHERE staff_id = ? AND DATE(start_datetime) <= ? AND DATE(end_datetime) >= ?
                ");
                $stmt->execute([$staff['id'], $date, $date]);
                $timeOff = $stmt->fetchAll(PDO::FETCH_ASSOC);
                
                // Get existing appointments
                $stmt = $db->prepare("
                    SELECT start_time, end_time FROM appointments 
                    WHERE staff_id = ? AND DATE(start_time) = ? AND status NOT IN ('cancelled')
                ");
                $stmt->execute([$staff['id'], $date]);
                $appointments = $stmt->fetchAll(PDO::FETCH_ASSOC);
                
                // Generate slots for each availability window
                foreach ($availability as $window) {
                    $windowStart = new DateTime($date . ' ' . $window['start_time']);
                    $windowEnd = new DateTime($date . ' ' . $window['end_time']);
                    
                    $slotStart = clone $windowStart;
                    
                    while ($slotStart < $windowEnd) {
                        $slotEnd = (clone $slotStart)->modify("+{$duration} minutes");
                        $blockEnd = (clone $slotStart)->modify("+{$totalDuration} minutes");
                        
                        // Check if slot fits in window
                        if ($blockEnd > $windowEnd) {
                            break;
                        }
                        
                        // Check minimum notice
                        if ($slotStart < $minDate) {
                            $slotStart->modify("+{$slotInterval} minutes");
                            continue;
                        }
                        
                        // Check time off
                        $isTimeOff = false;
                        foreach ($timeOff as $off) {
                            $offStart = new DateTime($off['start_datetime']);
                            $offEnd = new DateTime($off['end_datetime']);
                            if ($slotStart < $offEnd && $blockEnd > $offStart) {
                                $isTimeOff = true;
                                break;
                            }
                        }
                        
                        if ($isTimeOff) {
                            $slotStart->modify("+{$slotInterval} minutes");
                            continue;
                        }
                        
                        // Check existing appointments
                        $isBooked = false;
                        foreach ($appointments as $apt) {
                            $aptStart = new DateTime($apt['start_time']);
                            $aptEnd = new DateTime($apt['end_time']);
                            // Add buffer consideration
                            $aptStart->modify("-{$bufferBefore} minutes");
                            $aptEnd->modify("+{$bufferAfter} minutes");
                            
                            if ($slotStart < $aptEnd && $blockEnd > $aptStart) {
                                $isBooked = true;
                                break;
                            }
                        }
                        
                        if (!$isBooked) {
                            $allSlots[] = [
                                'start' => $slotStart->format('Y-m-d\TH:i:s'),
                                'end' => $slotEnd->format('Y-m-d\TH:i:s'),
                                'staff_id' => $staff['id'],
                                'staff_name' => $staff['first_name'] . ' ' . $staff['last_name']
                            ];
                        }
                        
                        $slotStart->modify("+{$slotInterval} minutes");
                    }
                }
            }
            
            // Sort slots by time
            usort($allSlots, fn($a, $b) => strcmp($a['start'], $b['start']));
            
            // For round-robin mode, pick one staff per time slot
            if ($mode === 'round_robin' && !$staffId) {
                $allSlots = self::applyRoundRobin($db, $workspaceId, $allSlots);
            }
            
            return Response::json([
                'data' => [
                    'date' => $date,
                    'service' => [
                        'id' => $service['id'],
                        'name' => $service['name'],
                        'duration_minutes' => $duration,
                        'price' => $service['price']
                    ],
                    'mode' => $mode,
                    'slots' => $allSlots
                ]
            ]);
            
        } catch (Exception $e) {
            return Response::error('Failed to get slots: ' . $e->getMessage());
        }
    }

    /**
     * Apply round-robin selection to slots
     * Picks staff with least upcoming appointments
     */
    private static function applyRoundRobin(PDO $db, int $workspaceId, array $slots): array {
        if (empty($slots)) return $slots;
        
        // Get appointment counts per staff for next 7 days
        $stmt = $db->prepare("
            SELECT staff_id, COUNT(*) as count 
            FROM appointments 
            WHERE workspace_id = ? AND status NOT IN ('cancelled') 
            AND start_time BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL 7 DAY)
            GROUP BY staff_id
        ");
        $stmt->execute([$workspaceId]);
        $counts = [];
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $counts[$row['staff_id']] = (int)$row['count'];
        }
        
        // Group slots by time
        $slotsByTime = [];
        foreach ($slots as $slot) {
            $time = $slot['start'];
            if (!isset($slotsByTime[$time])) {
                $slotsByTime[$time] = [];
            }
            $slotsByTime[$time][] = $slot;
        }
        
        // Pick one staff per time slot (least busy)
        $result = [];
        foreach ($slotsByTime as $time => $timeSlots) {
            usort($timeSlots, function($a, $b) use ($counts) {
                $countA = $counts[$a['staff_id']] ?? 0;
                $countB = $counts[$b['staff_id']] ?? 0;
                return $countA - $countB;
            });
            $result[] = $timeSlots[0];
        }
        
        return $result;
    }

    /**
     * Create a booking (public endpoint)
     */
    public static function createBooking() {
        try {
            $data = json_decode(file_get_contents('php://input'), true);
            
            $workspaceId = $data['workspace_id'] ?? null;
            $serviceId = $data['service_id'] ?? null;
            $staffId = $data['staff_id'] ?? null;
            $startTime = $data['start_time'] ?? null;
            $customer = $data['customer'] ?? [];
            
            if (!$workspaceId || !$serviceId || !$startTime) {
                return Response::error('workspace_id, service_id, and start_time are required', 400);
            }
            
            if (empty($customer['name']) && empty($customer['email']) && empty($customer['phone'])) {
                return Response::error('Customer name, email, or phone is required', 400);
            }
            
            $db = Database::conn();
            
            // Get service
            $stmt = $db->prepare("SELECT * FROM services WHERE id = ? AND workspace_id = ? AND is_active = 1");
            $stmt->execute([$serviceId, $workspaceId]);
            $service = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$service) {
                return Response::error('Service not found', 404);
            }
            
            // If no staff specified, use round-robin
            if (!$staffId) {
                $stmt = $db->prepare("
                    SELECT sm.id FROM staff_members sm
                    JOIN staff_services ss ON sm.id = ss.staff_id
                    WHERE ss.service_id = ? AND sm.workspace_id = ? AND sm.is_active = 1 AND sm.accepts_bookings = 1
                    ORDER BY (
                        SELECT COUNT(*) FROM appointments a 
                        WHERE a.staff_id = sm.id AND a.status NOT IN ('cancelled')
                        AND a.start_time BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL 7 DAY)
                    ) ASC
                    LIMIT 1
                ");
                $stmt->execute([$serviceId, $workspaceId]);
                $row = $stmt->fetch(PDO::FETCH_ASSOC);
                $staffId = $row ? $row['id'] : null;
            }
            
            if (!$staffId) {
                return Response::error('No available staff for this service', 400);
            }
            
            // Calculate end time
            $startDateTime = new DateTime($startTime);
            $endDateTime = (clone $startDateTime)->modify("+{$service['duration_minutes']} minutes");
            
            // Verify slot is still available
            $stmt = $db->prepare("
                SELECT id FROM appointments 
                WHERE staff_id = ? AND status NOT IN ('cancelled')
                AND (
                    (start_time <= ? AND end_time > ?) OR
                    (start_time < ? AND end_time >= ?) OR
                    (start_time >= ? AND end_time <= ?)
                )
            ");
            $stmt->execute([
                $staffId,
                $startTime, $startTime,
                $endDateTime->format('Y-m-d H:i:s'), $endDateTime->format('Y-m-d H:i:s'),
                $startTime, $endDateTime->format('Y-m-d H:i:s')
            ]);
            
            if ($stmt->fetch()) {
                return Response::error('This time slot is no longer available', 409);
            }
            
            // Find or create contact
            $contactId = null;
            if (!empty($customer['email'])) {
                $stmt = $db->prepare("SELECT id FROM contacts WHERE workspace_id = ? AND email = ?");
                $stmt->execute([$workspaceId, $customer['email']]);
                $contact = $stmt->fetch(PDO::FETCH_ASSOC);
                $contactId = $contact ? $contact['id'] : null;
            }
            
            if (!$contactId && !empty($customer['phone'])) {
                $stmt = $db->prepare("SELECT id FROM contacts WHERE workspace_id = ? AND phone = ?");
                $stmt->execute([$workspaceId, $customer['phone']]);
                $contact = $stmt->fetch(PDO::FETCH_ASSOC);
                $contactId = $contact ? $contact['id'] : null;
            }
            
            if (!$contactId) {
                // Create new contact
                $nameParts = explode(' ', $customer['name'] ?? '', 2);
                $stmt = $db->prepare("
                    INSERT INTO contacts (workspace_id, first_name, last_name, email, phone, source)
                    VALUES (?, ?, ?, ?, ?, 'booking')
                ");
                $stmt->execute([
                    $workspaceId,
                    $nameParts[0] ?? '',
                    $nameParts[1] ?? '',
                    $customer['email'] ?? null,
                    $customer['phone'] ?? null
                ]);
                $contactId = $db->lastInsertId();
            }
            
            // Get booking settings for confirmation
            $stmt = $db->prepare("SELECT * FROM booking_settings WHERE workspace_id = ?");
            $stmt->execute([$workspaceId]);
            $settings = $stmt->fetch(PDO::FETCH_ASSOC) ?: ['auto_confirm' => 1];
            
            $status = $service['requires_confirmation'] || !$settings['auto_confirm'] ? 'pending' : 'confirmed';
            
            // Handle booking page specific configuration
            $bookingPageId = $data['booking_page_id'] ?? null;
            $answers = isset($data['answers']) ? json_encode($data['answers']) : null;
            $paymentStatus = 'pending'; // Default for appointments table but we might override
            
            if ($bookingPageId) {
                $stmt = $db->prepare("SELECT * FROM booking_pages WHERE id = ?");
                $stmt->execute([$bookingPageId]);
                $page = $stmt->fetch(PDO::FETCH_ASSOC);
                
                if ($page) {
                    $paymentConfig = $page['payment_config'] ? json_decode($page['payment_config'], true) : null;
                    if ($paymentConfig && ($paymentConfig['requires_payment'] ?? false)) {
                        $status = 'pending'; // Keep as pending until paid
                        $paymentStatus = 'pending';
                    }
                }
            }

            // Create appointment
            $stmt = $db->prepare("
                INSERT INTO appointments 
                (workspace_id, contact_id, staff_id, service_id, title, start_time, end_time, 
                 status, price, notes, source, booking_page_id, custom_answers, payment_status)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'public_booking', ?, ?, ?)
            ");
            $stmt->execute([
                $workspaceId,
                $contactId,
                $staffId,
                $serviceId,
                $service['name'],
                $startTime,
                $endDateTime->format('Y-m-d H:i:s'),
                $status,
                $service['price'],
                $customer['notes'] ?? null,
                $bookingPageId,
                $answers,
                $paymentStatus
            ]);
            
            $appointmentId = $db->lastInsertId();
            
            // Schedule confirmation email
            if (!empty($customer['email'])) {
                JobQueueService::schedule('notification.email', [
                    'workspace_id' => $workspaceId,
                    'to' => $customer['email'],
                    'subject' => 'Booking Confirmation: ' . $service['name'],
                    'html_body' => self::buildConfirmationEmail($service, $startDateTime, $customer)
                ], null, $workspaceId);
            }
            
            // Schedule reminders
            JobQueueService::schedule('appointment.reminder', [
                'appointment_id' => $appointmentId,
                'reminder_type' => '24h',
                'channel' => 'email'
            ], date('Y-m-d H:i:s', strtotime($startTime) - 86400), $workspaceId, "apt_reminder_{$appointmentId}_24h");
            
            // Emit business event
            self::emitBookingEvent($db, $workspaceId, $appointmentId, 'appointment.booked');
            
            return Response::json([
                'success' => true,
                'data' => [
                    'appointment_id' => (int)$appointmentId,
                    'status' => $status,
                    'service' => $service['name'],
                    'start_time' => $startTime,
                    'end_time' => $endDateTime->format('Y-m-d H:i:s')
                ]
            ]);
            
        } catch (Exception $e) {
            return Response::error('Booking failed: ' . $e->getMessage());
        }
    }

    /**
     * Cancel a booking
     */
    public static function cancelBooking($id) {
        try {
            $data = json_decode(file_get_contents('php://input'), true);
            $reason = $data['reason'] ?? null;
            
            $db = Database::conn();
            
            // For public cancellation, we need token-based auth
            // For admin, use workspace context
            $workspaceId = self::getWorkspaceId();
            
            $stmt = $db->prepare("
                SELECT * FROM appointments WHERE id = ? AND workspace_id = ?
            ");
            $stmt->execute([$id, $workspaceId]);
            $appointment = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$appointment) {
                return Response::error('Appointment not found', 404);
            }
            
            if ($appointment['status'] === 'cancelled') {
                return Response::error('Appointment already cancelled', 400);
            }
            
            $stmt = $db->prepare("
                UPDATE appointments 
                SET status = 'cancelled', cancellation_reason = ?, updated_at = NOW()
                WHERE id = ?
            ");
            $stmt->execute([$reason, $id]);
            
            // Cancel scheduled reminders
            JobQueueService::cancel("apt_reminder_{$id}_24h");
            JobQueueService::cancel("apt_reminder_{$id}_email");
            JobQueueService::cancel("apt_reminder_{$id}_sms");
            
            // Emit event
            self::emitBookingEvent($db, $workspaceId, $id, 'appointment.cancelled');
            
            return Response::json(['success' => true]);
            
        } catch (Exception $e) {
            return Response::error('Cancellation failed: ' . $e->getMessage());
        }
    }

    /**
     * Reschedule a booking
     */
    public static function rescheduleBooking($id) {
        try {
            $data = json_decode(file_get_contents('php://input'), true);
            $newStartTime = $data['start_time'] ?? null;
            $newStaffId = $data['staff_id'] ?? null;
            
            if (!$newStartTime) {
                return Response::error('start_time is required', 400);
            }
            
            $db = Database::conn();
            $workspaceId = self::getWorkspaceId();
            
            $stmt = $db->prepare("
                SELECT a.*, s.duration_minutes FROM appointments a
                LEFT JOIN services s ON a.service_id = s.id
                WHERE a.id = ? AND a.workspace_id = ?
            ");
            $stmt->execute([$id, $workspaceId]);
            $appointment = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$appointment) {
                return Response::error('Appointment not found', 404);
            }
            
            $staffId = $newStaffId ?: $appointment['staff_id'];
            $duration = $appointment['duration_minutes'] ?: 60;
            
            $startDateTime = new DateTime($newStartTime);
            $endDateTime = (clone $startDateTime)->modify("+{$duration} minutes");
            
            // Verify new slot is available
            $stmt = $db->prepare("
                SELECT id FROM appointments 
                WHERE staff_id = ? AND id != ? AND status NOT IN ('cancelled')
                AND (
                    (start_time <= ? AND end_time > ?) OR
                    (start_time < ? AND end_time >= ?)
                )
            ");
            $stmt->execute([
                $staffId, $id,
                $newStartTime, $newStartTime,
                $endDateTime->format('Y-m-d H:i:s'), $endDateTime->format('Y-m-d H:i:s')
            ]);
            
            if ($stmt->fetch()) {
                return Response::error('New time slot is not available', 409);
            }
            
            $stmt = $db->prepare("
                UPDATE appointments 
                SET staff_id = ?, start_time = ?, end_time = ?, 
                    rescheduled_from = ?, reminder_sent = 0, updated_at = NOW()
                WHERE id = ?
            ");
            $stmt->execute([
                $staffId,
                $newStartTime,
                $endDateTime->format('Y-m-d H:i:s'),
                $id,
                $id
            ]);
            
            // Reschedule reminders
            JobQueueService::cancel("apt_reminder_{$id}_24h");
            JobQueueService::schedule('appointment.reminder', [
                'appointment_id' => $id,
                'reminder_type' => '24h',
                'channel' => 'email'
            ], date('Y-m-d H:i:s', strtotime($newStartTime) - 86400), $workspaceId, "apt_reminder_{$id}_24h");
            
            self::emitBookingEvent($db, $workspaceId, $id, 'appointment.rescheduled');
            
            return Response::json(['success' => true]);
            
        } catch (Exception $e) {
            return Response::error('Reschedule failed: ' . $e->getMessage());
        }
    }

    /**
     * Get public booking page data
     */
    public static function getPublicBookingPage($companySlug) {
        try {
            $db = Database::conn();
            
            // Get company/workspace by slug
            $stmt = $db->prepare("
                SELECT c.*, w.id as workspace_id 
                FROM companies c
                JOIN workspaces w ON c.workspace_id = w.id
                WHERE c.slug = ? OR c.id = ?
            ");
            $stmt->execute([$companySlug, $companySlug]);
            $company = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$company) {
                return Response::error('Booking page not found', 404);
            }
            
            $workspaceId = $company['workspace_id'];
            
            // Get booking settings
            $stmt = $db->prepare("SELECT * FROM booking_settings WHERE workspace_id = ?");
            $stmt->execute([$workspaceId]);
            $settings = $stmt->fetch(PDO::FETCH_ASSOC) ?: [];
            
            // Get active services
            $stmt = $db->prepare("
                SELECT s.*, sc.name as category_name
                FROM services s
                LEFT JOIN service_categories sc ON s.category_id = sc.id
                WHERE s.workspace_id = ? AND s.is_active = 1 AND s.allow_online_booking = 1
                ORDER BY s.sort_order, s.name
            ");
            $stmt->execute([$workspaceId]);
            $services = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Get staff who accept bookings
            $stmt = $db->prepare("
                SELECT id, first_name, last_name, title, bio, avatar_url, color
                FROM staff_members 
                WHERE workspace_id = ? AND is_active = 1 AND accepts_bookings = 1
                ORDER BY sort_order, first_name
            ");
            $stmt->execute([$workspaceId]);
            $staff = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            return Response::json([
                'data' => [
                    'workspace_id' => $workspaceId,
                    'company' => [
                        'name' => $company['name'],
                        'logo' => $company['logo_url'] ?? $settings['logo_url'] ?? null
                    ],
                    'settings' => [
                        'page_title' => $settings['page_title'] ?? $company['name'],
                        'page_description' => $settings['page_description'] ?? null,
                        'primary_color' => $settings['primary_color'] ?? '#6366f1',
                        'min_notice_hours' => $settings['min_notice_hours'] ?? 1,
                        'max_advance_days' => $settings['max_advance_days'] ?? 60,
                        'cancellation_policy' => $settings['cancellation_policy'] ?? null
                    ],
                    'services' => $services,
                    'staff' => $staff
                ]
            ]);
            
        } catch (Exception $e) {
            return Response::error('Failed to load booking page: ' . $e->getMessage());
        }
    }

    private static function buildConfirmationEmail(array $service, DateTime $startTime, array $customer): string {
        $name = $customer['name'] ?? 'there';
        $date = $startTime->format('l, F j, Y');
        $time = $startTime->format('g:i A');
        
        return "
            <h2>Booking Confirmed!</h2>
            <p>Hi {$name},</p>
            <p>Your appointment has been confirmed:</p>
            <div style='background:#f3f4f6;padding:16px;border-radius:8px;margin:16px 0;'>
                <p><strong>Service:</strong> {$service['name']}</p>
                <p><strong>Date:</strong> {$date}</p>
                <p><strong>Time:</strong> {$time}</p>
                <p><strong>Duration:</strong> {$service['duration_minutes']} minutes</p>
            </div>
            <p>We look forward to seeing you!</p>
        ";
    }

    private static function emitBookingEvent(PDO $db, int $workspaceId, int $appointmentId, string $eventType): void {
        try {
            $stmt = $db->prepare("
                INSERT INTO business_events (workspace_id, event_type, entity_type, entity_id, payload)
                VALUES (?, ?, 'appointment', ?, ?)
            ");
            $stmt->execute([$workspaceId, $eventType, $appointmentId, json_encode(['appointment_id' => $appointmentId])]);
        } catch (Exception $e) {
            error_log("Failed to emit booking event: " . $e->getMessage());
        }
    }
}
