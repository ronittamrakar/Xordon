<?php
/**
 * MarketplaceBookingController
 * 
 * Connects the appointments system with lead marketplace.
 * Allows consumers to book appointments with providers after lead acceptance.
 */

namespace App\Controllers;

require_once __DIR__ . '/../Database.php';
require_once __DIR__ . '/../Auth.php';

use \Xordon\Database;
use Auth;

class MarketplaceBookingController
{
    private static function getWorkspaceIdOrFail(): int
    {
        $ctx = $GLOBALS['tenantContext'] ?? null;
        return (int)($ctx->workspaceId ?? 1);
    }

    private static function getCompanyIdOrFail(): int
    {
        $ctx = $GLOBALS['tenantContext'] ?? null;
        $companyId = $ctx->activeCompanyId ?? null;
        
        if ($companyId) return (int)$companyId;
        
        $workspaceId = self::getWorkspaceIdOrFail();
        $pdo = Database::conn();
        $stmt = $pdo->prepare('SELECT id FROM companies WHERE workspace_id = ? LIMIT 1');
        $stmt->execute([$workspaceId]);
        $row = $stmt->fetch(\PDO::FETCH_ASSOC);
        return $row ? (int)$row['id'] : 1;
    }

    // ==================== PROVIDER BOOKING SETUP ====================

    /**
     * GET /lead-marketplace/booking/types
     * Provider gets their booking types for lead follow-up
     */
    public static function getBookingTypes(): void
    {
        $workspaceId = self::getWorkspaceIdOrFail();
        $pdo = Database::conn();
        $userId = Auth::userId();

        $stmt = $pdo->prepare('
            SELECT * FROM booking_types 
            WHERE user_id = ? AND is_active = 1
            ORDER BY sort_order, name
        ');
        $stmt->execute([$userId]);
        $types = $stmt->fetchAll(\PDO::FETCH_ASSOC);

        echo json_encode(['success' => true, 'data' => $types]);
    }

    /**
     * POST /lead-marketplace/booking/types
     * Create a booking type for lead marketplace
     */
    public static function createBookingType(): void
    {
        $workspaceId = self::getWorkspaceIdOrFail();
        $userId = Auth::userId();
        $pdo = Database::conn();
        $body = json_decode(file_get_contents('php://input'), true) ?: [];

        $name = trim($body['name'] ?? '');
        $duration = (int)($body['duration_minutes'] ?? 30);
        $locationType = $body['location_type'] ?? 'video';

        if (!$name) {
            http_response_code(422);
            echo json_encode(['success' => false, 'error' => 'Name required']);
            return;
        }

        $slug = preg_replace('/[^a-z0-9]+/', '-', strtolower($name));
        $slug = trim($slug, '-') . '-' . substr(md5(uniqid()), 0, 6);

        $stmt = $pdo->prepare('
            INSERT INTO booking_types (
                user_id, name, slug, description, duration_minutes,
                buffer_before, buffer_after, color, location_type, location_details,
                price, currency, requires_payment, min_notice_hours, max_future_days, is_active
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
        ');
        $stmt->execute([
            $userId,
            $name,
            $slug,
            $body['description'] ?? null,
            $duration,
            (int)($body['buffer_before'] ?? 0),
            (int)($body['buffer_after'] ?? 15),
            $body['color'] ?? '#3B82F6',
            $locationType,
            $body['location_details'] ?? null,
            $body['price'] ?? null,
            $body['currency'] ?? 'USD',
            isset($body['requires_payment']) ? (int)$body['requires_payment'] : 0,
            (int)($body['min_notice_hours'] ?? 24),
            (int)($body['max_future_days'] ?? 60)
        ]);

        $typeId = (int)$pdo->lastInsertId();

        echo json_encode([
            'success' => true,
            'data' => ['id' => $typeId, 'slug' => $slug]
        ], 201);
    }

    // ==================== PROVIDER AVAILABILITY ====================

    /**
     * GET /lead-marketplace/booking/availability
     * Get provider's availability schedule
     */
    public static function getAvailability(): void
    {
        $userId = Auth::userId();
        $pdo = Database::conn();

        // Get default schedule
        $stmt = $pdo->prepare('
            SELECT * FROM availability_schedules 
            WHERE user_id = ? AND is_default = 1
            LIMIT 1
        ');
        $stmt->execute([$userId]);
        $schedule = $stmt->fetch(\PDO::FETCH_ASSOC);

        if (!$schedule) {
            echo json_encode(['success' => true, 'data' => null, 'message' => 'No schedule set up']);
            return;
        }

        // Get slots
        $stmt = $pdo->prepare('SELECT * FROM availability_slots WHERE schedule_id = ? ORDER BY day_of_week, start_time');
        $stmt->execute([$schedule['id']]);
        $slots = $stmt->fetchAll(\PDO::FETCH_ASSOC);

        // Get upcoming overrides
        $stmt = $pdo->prepare('
            SELECT * FROM availability_overrides 
            WHERE user_id = ? AND override_date >= CURDATE()
            ORDER BY override_date
            LIMIT 30
        ');
        $stmt->execute([$userId]);
        $overrides = $stmt->fetchAll(\PDO::FETCH_ASSOC);

        echo json_encode([
            'success' => true,
            'data' => [
                'schedule' => $schedule,
                'slots' => $slots,
                'overrides' => $overrides
            ]
        ]);
    }

    /**
     * PUT /lead-marketplace/booking/availability
     * Update provider's availability
     */
    public static function updateAvailability(): void
    {
        $userId = Auth::userId();
        $pdo = Database::conn();
        $body = json_decode(file_get_contents('php://input'), true) ?: [];

        $timezone = $body['timezone'] ?? 'UTC';
        $slots = $body['slots'] ?? [];

        // Create or update default schedule
        $stmt = $pdo->prepare('SELECT id FROM availability_schedules WHERE user_id = ? AND is_default = 1');
        $stmt->execute([$userId]);
        $scheduleId = $stmt->fetchColumn();

        if (!$scheduleId) {
            $stmt = $pdo->prepare('
                INSERT INTO availability_schedules (user_id, name, timezone, is_default)
                VALUES (?, ?, ?, 1)
            ');
            $stmt->execute([$userId, 'Default Schedule', $timezone]);
            $scheduleId = (int)$pdo->lastInsertId();
        } else {
            $stmt = $pdo->prepare('UPDATE availability_schedules SET timezone = ?, updated_at = NOW() WHERE id = ?');
            $stmt->execute([$timezone, $scheduleId]);
        }

        // Clear existing slots and recreate
        $stmt = $pdo->prepare('DELETE FROM availability_slots WHERE schedule_id = ?');
        $stmt->execute([$scheduleId]);

        if (!empty($slots)) {
            $insertStmt = $pdo->prepare('
                INSERT INTO availability_slots (schedule_id, day_of_week, start_time, end_time, is_available)
                VALUES (?, ?, ?, ?, ?)
            ');
            foreach ($slots as $slot) {
                $insertStmt->execute([
                    $scheduleId,
                    (int)$slot['day_of_week'],
                    $slot['start_time'],
                    $slot['end_time'],
                    isset($slot['is_available']) ? (int)$slot['is_available'] : 1
                ]);
            }
        }

        echo json_encode(['success' => true, 'message' => 'Availability updated']);
    }

    // ==================== CONSUMER BOOKING (Public) ====================

    /**
     * GET /lead-marketplace/booking/{matchId}/slots
     * Consumer gets available booking slots for a provider (after lead acceptance)
     */
    public static function getAvailableSlots(int $matchId): void
    {
        $workspaceId = self::getWorkspaceIdOrFail();
        $pdo = Database::conn();

        $date = $_GET['date'] ?? date('Y-m-d');
        $bookingTypeId = $_GET['booking_type_id'] ?? null;

        // Get match and provider info
        $stmt = $pdo->prepare('
            SELECT lm.*, sp.user_id as provider_user_id
            FROM lead_matches lm
            LEFT JOIN service_pros sp ON lm.company_id = sp.company_id AND sp.workspace_id = lm.workspace_id
            WHERE lm.id = ? AND lm.workspace_id = ?
        ');
        $stmt->execute([$matchId, $workspaceId]);
        $match = $stmt->fetch(\PDO::FETCH_ASSOC);

        if (!$match) {
            http_response_code(404);
            echo json_encode(['success' => false, 'error' => 'Match not found']);
            return;
        }

        // Must be accepted lead
        if (!in_array($match['status'], ['accepted', 'won'])) {
            http_response_code(403);
            echo json_encode(['success' => false, 'error' => 'Booking only available for accepted leads']);
            return;
        }

        $providerUserId = $match['provider_user_id'];

        // Get provider's booking types
        $stmt = $pdo->prepare('SELECT * FROM booking_types WHERE user_id = ? AND is_active = 1');
        $stmt->execute([$providerUserId]);
        $bookingTypes = $stmt->fetchAll(\PDO::FETCH_ASSOC);

        if (empty($bookingTypes)) {
            echo json_encode([
                'success' => true,
                'data' => [],
                'booking_types' => [],
                'message' => 'Provider has not set up booking'
            ]);
            return;
        }

        // Get provider's availability for the requested date
        $dayOfWeek = date('w', strtotime($date)); // 0=Sunday

        $stmt = $pdo->prepare('
            SELECT s.* FROM availability_slots s
            JOIN availability_schedules sch ON s.schedule_id = sch.id
            WHERE sch.user_id = ? AND sch.is_default = 1 AND s.day_of_week = ? AND s.is_available = 1
        ');
        $stmt->execute([$providerUserId, $dayOfWeek]);
        $availableSlots = $stmt->fetchAll(\PDO::FETCH_ASSOC);

        // Check for overrides
        $stmt = $pdo->prepare('SELECT * FROM availability_overrides WHERE user_id = ? AND override_date = ?');
        $stmt->execute([$providerUserId, $date]);
        $override = $stmt->fetch(\PDO::FETCH_ASSOC);

        if ($override && !$override['is_available']) {
            echo json_encode([
                'success' => true,
                'data' => [],
                'booking_types' => $bookingTypes,
                'message' => 'Provider not available on this date'
            ]);
            return;
        }

        // Get existing appointments for the date
        $stmt = $pdo->prepare('
            SELECT start_time, end_time FROM appointments 
            WHERE user_id = ? AND DATE(start_time) = ? AND status NOT IN (?, ?)
        ');
        $stmt->execute([$providerUserId, $date, 'cancelled', 'no_show']);
        $existingAppointments = $stmt->fetchAll(\PDO::FETCH_ASSOC);

        // Generate available time slots
        $selectedType = $bookingTypeId 
            ? array_filter($bookingTypes, fn($t) => $t['id'] == $bookingTypeId)
            : [$bookingTypes[0]];
        $selectedType = reset($selectedType) ?: $bookingTypes[0];

        $duration = (int)$selectedType['duration_minutes'];
        $buffer = (int)$selectedType['buffer_after'];
        $minNotice = (int)$selectedType['min_notice_hours'];

        $slots = [];
        foreach ($availableSlots as $avail) {
            $slotStart = strtotime($date . ' ' . $avail['start_time']);
            $slotEnd = strtotime($date . ' ' . $avail['end_time']);
            $now = time();
            $minBookingTime = $now + ($minNotice * 3600);

            while ($slotStart + ($duration * 60) <= $slotEnd) {
                $potentialEnd = $slotStart + ($duration * 60);

                // Skip if too soon
                if ($slotStart < $minBookingTime) {
                    $slotStart += 30 * 60; // 30 min increments
                    continue;
                }

                // Check conflicts with existing appointments
                $hasConflict = false;
                foreach ($existingAppointments as $apt) {
                    $aptStart = strtotime($apt['start_time']);
                    $aptEnd = strtotime($apt['end_time']);
                    
                    if ($slotStart < $aptEnd && $potentialEnd > $aptStart) {
                        $hasConflict = true;
                        break;
                    }
                }

                if (!$hasConflict) {
                    $slots[] = [
                        'start' => date('Y-m-d H:i:s', $slotStart),
                        'end' => date('Y-m-d H:i:s', $potentialEnd),
                        'start_time' => date('H:i', $slotStart),
                        'end_time' => date('H:i', $potentialEnd)
                    ];
                }

                $slotStart += 30 * 60; // 30 min increments
            }
        }

        echo json_encode([
            'success' => true,
            'data' => $slots,
            'booking_types' => $bookingTypes,
            'selected_type' => $selectedType
        ]);
    }

    /**
     * POST /lead-marketplace/booking/{matchId}
     * Consumer books an appointment with provider
     */
    public static function createBooking(int $matchId): void
    {
        $workspaceId = self::getWorkspaceIdOrFail();
        $pdo = Database::conn();
        $body = json_decode(file_get_contents('php://input'), true) ?: [];

        $startTime = $body['start_time'] ?? null;
        $bookingTypeId = $body['booking_type_id'] ?? null;
        $notes = trim($body['notes'] ?? '');
        $consumerEmail = trim($body['email'] ?? '');

        if (!$startTime) {
            http_response_code(422);
            echo json_encode(['success' => false, 'error' => 'Start time required']);
            return;
        }

        // Get match details
        $stmt = $pdo->prepare('
            SELECT lm.*, lr.consumer_name, lr.consumer_email, lr.consumer_phone, lr.title as lead_title,
                   sp.user_id as provider_user_id
            FROM lead_matches lm
            JOIN lead_requests lr ON lm.lead_request_id = lr.id
            LEFT JOIN service_pros sp ON lm.company_id = sp.company_id AND sp.workspace_id = lm.workspace_id
            WHERE lm.id = ? AND lm.workspace_id = ?
        ');
        $stmt->execute([$matchId, $workspaceId]);
        $match = $stmt->fetch(\PDO::FETCH_ASSOC);

        if (!$match) {
            http_response_code(404);
            echo json_encode(['success' => false, 'error' => 'Match not found']);
            return;
        }

        if (!in_array($match['status'], ['accepted', 'won'])) {
            http_response_code(403);
            echo json_encode(['success' => false, 'error' => 'Can only book appointments for accepted leads']);
            return;
        }

        // Get booking type
        $stmt = $pdo->prepare('SELECT * FROM booking_types WHERE id = ? AND user_id = ?');
        $stmt->execute([$bookingTypeId, $match['provider_user_id']]);
        $bookingType = $stmt->fetch(\PDO::FETCH_ASSOC);

        if (!$bookingType) {
            // Use first available
            $stmt = $pdo->prepare('SELECT * FROM booking_types WHERE user_id = ? AND is_active = 1 LIMIT 1');
            $stmt->execute([$match['provider_user_id']]);
            $bookingType = $stmt->fetch(\PDO::FETCH_ASSOC);
        }

        $duration = $bookingType ? (int)$bookingType['duration_minutes'] : 30;
        $endTime = date('Y-m-d H:i:s', strtotime($startTime) + ($duration * 60));

        // Create appointment
        $stmt = $pdo->prepare('
            INSERT INTO appointments (
                user_id, booking_type_id, lead_match_id, lead_request_id,
                contact_id, guest_name, guest_email, guest_phone,
                title, notes, start_time, end_time,
                location_type, status, created_at
            ) VALUES (?, ?, ?, ?, NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
        ');
        $stmt->execute([
            $match['provider_user_id'],
            $bookingType ? $bookingType['id'] : null,
            $matchId,
            $match['lead_request_id'],
            $match['consumer_name'],
            $consumerEmail ?: $match['consumer_email'],
            $match['consumer_phone'],
            'Lead: ' . ($match['lead_title'] ?: 'Service Request'),
            $notes,
            $startTime,
            $endTime,
            $bookingType ? $bookingType['location_type'] : 'video',
            'confirmed'
        ]);

        $appointmentId = (int)$pdo->lastInsertId();

        // Send system message in thread
        $stmt = $pdo->prepare('
            INSERT INTO marketplace_messages (
                workspace_id, lead_match_id, lead_request_id,
                sender_type, message, created_at
            ) VALUES (?, ?, ?, ?, ?, NOW())
        ');
        $stmt->execute([
            $workspaceId,
            $matchId,
            $match['lead_request_id'],
            'system',
            sprintf('📅 Appointment booked for %s at %s', 
                date('F j, Y', strtotime($startTime)),
                date('g:i A', strtotime($startTime))
            )
        ]);


        // Send confirmation emails/SMS
        // 1. Send to Consumer
        if ($consumerEmail) {
            require_once __DIR__ . '/../services/EmailService.php';
            $startTimeFormatted = date('l, F j, Y \a\t g:i A', strtotime($startTime));
            EmailService::sendEmail(
                $consumerEmail,
                "Appointment Confirmed: " . ($match['lead_title'] ?: 'Service Request'),
                "<h1>Appointment Confirmed</h1>
                 <p>Your appointment has been scheduled.</p>
                 <p><strong>When:</strong> $startTimeFormatted</p>
                 <p><strong>Topic:</strong> " . ($match['lead_title'] ?: 'Service Request') . "</p>
                 " . ($notes ? "<p><strong>Notes:</strong> " . htmlspecialchars($notes) . "</p>" : ""),
                "Appointment Confirmed\n\nWhen: $startTimeFormatted\nTopic: " . ($match['lead_title'] ?: 'Service Request')
            );
        }

        // 2. Notify Provider (if they have phone/email configured)
        // Get provider details
        $provStmt = $pdo->prepare('SELECT email, phone FROM users WHERE id = ?');
        $provStmt->execute([$match['provider_user_id']]);
        $provider = $provStmt->fetch(\PDO::FETCH_ASSOC);

        if ($provider) {
             // Email Provider
             if ($provider['email']) {
                 require_once __DIR__ . '/../services/EmailService.php';
                 $consumerName = $match['consumer_name'];
                 EmailService::sendEmail(
                    $provider['email'],
                    "New Appointment: $consumerName",
                    "<h1>New Appointment</h1>
                     <p>You have a new booking.</p>
                     <p><strong>Client:</strong> $consumerName</p>
                     <p><strong>Time:</strong> " . date('l, F j, Y \a\t g:i A', strtotime($startTime)) . "</p>",
                    "New Appointment\nClient: $consumerName\nTime: $startTime"
                 );
             }
             
             // SMS Provider
             if ($provider['phone']) {
                 require_once __DIR__ . '/../services/SMSService.php';
                 try {
                     $smsService = new \SMSService(null, (string)$match['provider_user_id']);
                     $smsService->sendMessage(
                         $provider['phone'],
                         "New Booking: " . $match['consumer_name'] . " at " . date('g:i A', strtotime($startTime))
                     );
                 } catch (\Exception $e) {
                     error_log("Failed to send provider SMS: " . $e->getMessage());
                 }
             }
        }

        echo json_encode([
            'success' => true,
            'data' => [
                'id' => $appointmentId,
                'start_time' => $startTime,
                'end_time' => $endTime,
                'status' => 'confirmed'
            ],
            'message' => 'Appointment booked successfully'
        ], 201);
    }

    /**
     * GET /lead-marketplace/booking/{matchId}/appointment
     * Get appointment for a lead match
     */
    public static function getMatchAppointment(int $matchId): void
    {
        $workspaceId = self::getWorkspaceIdOrFail();
        $pdo = Database::conn();

        $stmt = $pdo->prepare('
            SELECT a.*, bt.name as booking_type_name, bt.duration_minutes, bt.location_type as type_location
            FROM appointments a
            LEFT JOIN booking_types bt ON a.booking_type_id = bt.id
            WHERE a.lead_match_id = ?
            ORDER BY a.start_time DESC
            LIMIT 1
        ');
        $stmt->execute([$matchId]);
        $appointment = $stmt->fetch(\PDO::FETCH_ASSOC);

        echo json_encode(['success' => true, 'data' => $appointment]);
    }

    /**
     * POST /lead-marketplace/booking/{matchId}/complete
     * Mark appointment as completed and optionally update lead status to 'won'
     */
    public static function completeAppointment(int $matchId): void
    {
        $workspaceId = self::getWorkspaceIdOrFail();
        $companyId = self::getCompanyIdOrFail();
        $pdo = Database::conn();
        $body = json_decode(file_get_contents('php://input'), true) ?: [];

        $outcome = $body['outcome'] ?? 'completed'; // completed, no_show, cancelled
        $markWon = (bool)($body['mark_won'] ?? false);
        $wonValue = $body['won_value'] ?? null;

        // Verify ownership
        $stmt = $pdo->prepare('SELECT * FROM lead_matches WHERE id = ? AND company_id = ? AND workspace_id = ?');
        $stmt->execute([$matchId, $companyId, $workspaceId]);
        $match = $stmt->fetch(\PDO::FETCH_ASSOC);

        if (!$match) {
            http_response_code(404);
            echo json_encode(['success' => false, 'error' => 'Match not found']);
            return;
        }

        // Update appointment status
        $stmt = $pdo->prepare('UPDATE appointments SET status = ?, updated_at = NOW() WHERE lead_match_id = ?');
        $stmt->execute([$outcome, $matchId]);

        // Optionally mark lead as won
        if ($markWon && $outcome === 'completed') {
            $stmt = $pdo->prepare('
                UPDATE lead_matches SET
                    status = ?,
                    won_at = NOW(),
                    won_value = ?,
                    updated_at = NOW()
                WHERE id = ?
            ');
            $stmt->execute(['won', $wonValue, $matchId]);

            // Update provider stats
            $stmt = $pdo->prepare('
                UPDATE service_pros SET
                    total_leads_won = total_leads_won + 1,
                    updated_at = NOW()
                WHERE company_id = ? AND workspace_id = ?
            ');
            $stmt->execute([$companyId, $workspaceId]);
        }

        echo json_encode(['success' => true, 'message' => 'Appointment marked as ' . $outcome]);
    }

    // ==================== APPOINTMENT LISTING ====================

    /**
     * GET /lead-marketplace/booking/upcoming
     * Get upcoming appointments for the current provider
     */
    public static function getUpcomingAppointments(): void
    {
        $userId = Auth::userId();
        $pdo = Database::conn();
        
        $limit = (int)($_GET['limit'] ?? 20);
        $dateFrom = $_GET['date_from'] ?? date('Y-m-d');
        
        $stmt = $pdo->prepare('
            SELECT a.*, bt.name as booking_type_name, bt.duration_minutes,
                   lm.status as match_status, lr.title as lead_title, lr.consumer_name
            FROM appointments a
            LEFT JOIN booking_types bt ON a.booking_type_id = bt.id
            LEFT JOIN lead_matches lm ON a.lead_match_id = lm.id
            LEFT JOIN lead_requests lr ON a.lead_request_id = lr.id
            WHERE a.user_id = ? 
              AND a.start_time >= ?
              AND a.status NOT IN (?, ?)
            ORDER BY a.start_time ASC
            LIMIT ?
        ');
        $stmt->execute([$userId, $dateFrom, 'cancelled', 'no_show', $limit]);
        $appointments = $stmt->fetchAll(\PDO::FETCH_ASSOC);

        echo json_encode(['success' => true, 'data' => $appointments]);
    }

    /**
     * POST /lead-marketplace/booking/{id}/cancel
     * Cancel an appointment
     */
    public static function cancelAppointment(int $id): void
    {
        $userId = Auth::userId();
        $pdo = Database::conn();
        $body = json_decode(file_get_contents('php://input'), true) ?: [];
        
        $reason = trim($body['reason'] ?? '');

        // Verify ownership - either the provider (user_id) can cancel
        $stmt = $pdo->prepare('SELECT * FROM appointments WHERE id = ? AND user_id = ?');
        $stmt->execute([$id, $userId]);
        $appointment = $stmt->fetch(\PDO::FETCH_ASSOC);

        if (!$appointment) {
            http_response_code(404);
            echo json_encode(['success' => false, 'error' => 'Appointment not found']);
            return;
        }

        if ($appointment['status'] === 'cancelled') {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Appointment already cancelled']);
            return;
        }

        // Update appointment status
        $stmt = $pdo->prepare('UPDATE appointments SET status = ?, notes = CONCAT(COALESCE(notes, ""), ?) , updated_at = NOW() WHERE id = ?');
        $cancellationNote = $reason ? "\n[Cancelled: $reason]" : "\n[Cancelled]";
        $stmt->execute(['cancelled', $cancellationNote, $id]);

        // If linked to a lead match, send system message
        if ($appointment['lead_match_id']) {
            $workspaceId = self::getWorkspaceIdOrFail();
            $stmt = $pdo->prepare('SELECT lead_request_id FROM lead_matches WHERE id = ?');
            $stmt->execute([$appointment['lead_match_id']]);
            $match = $stmt->fetch(\PDO::FETCH_ASSOC);
            
            if ($match) {
                $stmt = $pdo->prepare('
                    INSERT INTO marketplace_messages (
                        workspace_id, lead_match_id, lead_request_id,
                        sender_type, message, created_at
                    ) VALUES (?, ?, ?, ?, ?, NOW())
                ');
                $stmt->execute([
                    $workspaceId,
                    $appointment['lead_match_id'],
                    $match['lead_request_id'],
                    'system',
                    '❌ Appointment cancelled' . ($reason ? ": $reason" : '')
                ]);
            }
        }

        echo json_encode(['success' => true, 'message' => 'Appointment cancelled']);
    }
}
