<?php
/**
 * AppointmentAutomationService - Handles appointment lifecycle automation
 */

require_once __DIR__ . '/../Database.php';
require_once __DIR__ . '/EmailService.php';
require_once __DIR__ . '/SMSService.php';
require_once __DIR__ . '/NotificationService.php';

class AppointmentAutomationService {
    private $db;
    private $emailService;
    private $smsService;
    private $notificationService;
    
    public function __construct() {
        $this->db = Database::conn();
        $this->emailService = new EmailService();
        $this->smsService = new SMSService();
        $this->notificationService = new NotificationService();
    }
    
    /**
     * Trigger automation when appointment is booked
     */
    public function onAppointmentBooked(int $appointmentId): void {
        $appointment = $this->getAppointmentDetails($appointmentId);
        if (!$appointment) return;
        
        try {
            // Send confirmation email
            $this->sendConfirmationEmail($appointment);
            
            // Schedule reminders
            $this->scheduleReminders($appointmentId, $appointment);
            
            // Trigger any custom automations
            $this->triggerCustomAutomations($appointmentId, 'booked', $appointment);
            
            // Log the automation
            $this->logAutomation($appointmentId, 'booked', 'Confirmation sent and reminders scheduled', true);
            
            // Mark confirmation as sent
            $stmt = $this->db->prepare("UPDATE appointments SET confirmation_sent_at = NOW(), automation_triggered = 1 WHERE id = ?");
            $stmt->execute([$appointmentId]);
            
        } catch (Exception $e) {
            $this->logAutomation($appointmentId, 'booked', 'Failed to process booking automation', false, $e->getMessage());
            error_log("Appointment automation error: " . $e->getMessage());
        }
    }
    
    /**
     * Trigger automation when appointment is cancelled
     */
    public function onAppointmentCancelled(int $appointmentId, ?string $reason = null): void {
        $appointment = $this->getAppointmentDetails($appointmentId);
        if (!$appointment) return;
        
        try {
            // Send cancellation notification
            $this->sendCancellationEmail($appointment, $reason);
            
            // Cancel pending reminders
            $this->cancelPendingReminders($appointmentId);
            
            // Trigger win-back automation
            $this->triggerCustomAutomations($appointmentId, 'cancelled', $appointment);
            
            $this->logAutomation($appointmentId, 'cancelled', 'Cancellation processed', true);
            
        } catch (Exception $e) {
            $this->logAutomation($appointmentId, 'cancelled', 'Failed to process cancellation', false, $e->getMessage());
        }
    }
    
    /**
     * Trigger automation when appointment is rescheduled
     */
    public function onAppointmentRescheduled(int $appointmentId, string $oldDateTime, string $newDateTime): void {
        $appointment = $this->getAppointmentDetails($appointmentId);
        if (!$appointment) return;
        
        try {
            // Send reschedule notification
            $this->sendRescheduleEmail($appointment, $oldDateTime, $newDateTime);
            
            // Update reminders
            $this->cancelPendingReminders($appointmentId);
            $this->scheduleReminders($appointmentId, $appointment);
            
            $this->triggerCustomAutomations($appointmentId, 'rescheduled', $appointment);
            $this->logAutomation($appointmentId, 'rescheduled', 'Reschedule processed', true);
            
        } catch (Exception $e) {
            $this->logAutomation($appointmentId, 'rescheduled', 'Failed to process reschedule', false, $e->getMessage());
        }
    }
    
    /**
     * Trigger automation for no-show
     */
    public function onAppointmentNoShow(int $appointmentId): void {
        $appointment = $this->getAppointmentDetails($appointmentId);
        if (!$appointment) return;
        
        try {
            // Send no-show follow-up
            $this->sendNoShowEmail($appointment);
            
            // Trigger high-priority follow-up automation
            $this->triggerCustomAutomations($appointmentId, 'no_show', $appointment);
            
            $this->logAutomation($appointmentId, 'no_show', 'No-show follow-up sent', true);
            
        } catch (Exception $e) {
            $this->logAutomation($appointmentId, 'no_show', 'Failed to process no-show', false, $e->getMessage());
        }
    }
    
    /**
     * Trigger automation when appointment is completed
     */
    public function onAppointmentCompleted(int $appointmentId): void {
        $appointment = $this->getAppointmentDetails($appointmentId);
        if (!$appointment) return;
        
        try {
            // Send thank you / feedback request
            $this->sendCompletionEmail($appointment);
            
            // Trigger review request automation
            $this->triggerCustomAutomations($appointmentId, 'completed', $appointment);
            
            // Update analytics
            $this->updateAnalytics($appointment, 'completed');
            
            $this->logAutomation($appointmentId, 'completed', 'Completion follow-up sent', true);
            
        } catch (Exception $e) {
            $this->logAutomation($appointmentId, 'completed', 'Failed to process completion', false, $e->getMessage());
        }
    }
    
    /**
     * Send confirmation email with video link
     */
    private function sendConfirmationEmail(array $appointment): void {
        if (!$appointment['contact_email']) return;
        
        $variables = $this->getEmailVariables($appointment);
        
        $subject = "Appointment Confirmed - {$appointment['booking_type_name']}";
        $body = $this->renderEmailTemplate('appointment_confirmation', $variables);
        
        $this->emailService->send(
            $appointment['contact_email'],
            $subject,
            $body,
            ['appointment_id' => $appointment['id']]
        );
    }
    
    /**
     * Send cancellation email
     */
    private function sendCancellationEmail(array $appointment, ?string $reason): void {
        if (!$appointment['contact_email']) return;
        
        $variables = $this->getEmailVariables($appointment);
        $variables['cancellation_reason'] = $reason ?? 'No reason provided';
        
        $subject = "Appointment Cancelled - {$appointment['booking_type_name']}";
        $body = $this->renderEmailTemplate('appointment_cancellation', $variables);
        
        $this->emailService->send($appointment['contact_email'], $subject, $body);
    }
    
    /**
     * Send reschedule email
     */
    private function sendRescheduleEmail(array $appointment, string $oldDateTime, string $newDateTime): void {
        if (!$appointment['contact_email']) return;
        
        $variables = $this->getEmailVariables($appointment);
        $variables['old_date'] = date('F j, Y', strtotime($oldDateTime));
        $variables['old_time'] = date('g:i A', strtotime($oldDateTime));
        
        $subject = "Appointment Rescheduled - {$appointment['booking_type_name']}";
        $body = $this->renderEmailTemplate('appointment_reschedule', $variables);
        
        $this->emailService->send($appointment['contact_email'], $subject, $body);
    }
    
    /**
     * Send no-show follow-up
     */
    private function sendNoShowEmail(array $appointment): void {
        if (!$appointment['contact_email']) return;
        
        $variables = $this->getEmailVariables($appointment);
        
        $subject = "We Missed You - {$appointment['booking_type_name']}";
        $body = $this->renderEmailTemplate('appointment_no_show', $variables);
        
        $this->emailService->send($appointment['contact_email'], $subject, $body);
    }
    
    /**
     * Send completion/thank you email
     */
    private function sendCompletionEmail(array $appointment): void {
        if (!$appointment['contact_email']) return;
        
        $variables = $this->getEmailVariables($appointment);
        
        $subject = "Thank You - {$appointment['booking_type_name']}";
        $body = $this->renderEmailTemplate('appointment_completion', $variables);
        
        $this->emailService->send($appointment['contact_email'], $subject, $body);
    }
    
    /**
     * Schedule reminders for appointment
     */
    private function scheduleReminders(int $appointmentId, array $appointment): void {
        // Get default reminders for this booking type
        $stmt = $this->db->prepare("
            SELECT * FROM appointment_reminders 
            WHERE booking_type_id = ? AND appointment_id IS NULL
        ");
        $stmt->execute([$appointment['booking_type_id']]);
        $defaultReminders = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // If no defaults, create standard reminders
        if (empty($defaultReminders)) {
            $defaultReminders = [
                ['send_before_minutes' => 1440, 'reminder_type' => 'email'], // 24 hours
                ['send_before_minutes' => 60, 'reminder_type' => 'email'],   // 1 hour
            ];
        }
        
        $appointmentTime = strtotime($appointment['scheduled_at']);
        
        foreach ($defaultReminders as $reminder) {
            $sendTime = $appointmentTime - ($reminder['send_before_minutes'] * 60);
            
            // Only schedule if in the future
            if ($sendTime > time()) {
                $stmt = $this->db->prepare("
                    INSERT INTO appointment_reminders 
                    (appointment_id, reminder_type, send_before_minutes, scheduled_for)
                    VALUES (?, ?, ?, ?)
                ");
                $stmt->execute([
                    $appointmentId,
                    $reminder['reminder_type'],
                    $reminder['send_before_minutes'],
                    date('Y-m-d H:i:s', $sendTime)
                ]);
            }
        }
    }
    
    /**
     * Cancel pending reminders
     */
    private function cancelPendingReminders(int $appointmentId): void {
        $stmt = $this->db->prepare("DELETE FROM appointment_reminders WHERE appointment_id = ? AND sent = 0");
        $stmt->execute([$appointmentId]);
    }
    
    /**
     * Trigger custom automations via webhook or automation engine
     */
    private function triggerCustomAutomations(int $appointmentId, string $event, array $appointment): void {
        // This would integrate with your AutomationsV2Controller
        // For now, we'll just log it
        
        $payload = [
            'event' => "appointment.{$event}",
            'appointment_id' => $appointmentId,
            'contact_id' => $appointment['contact_id'],
            'booking_type_id' => $appointment['booking_type_id'],
            'scheduled_at' => $appointment['scheduled_at'],
            'video_link' => $appointment['video_meeting_url'] ?? null,
        ];
        
        // TODO: Call AutomationsV2Controller::triggerEvent($payload)
        error_log("Automation trigger: " . json_encode($payload));
    }
    
    /**
     * Get email template variables
     */
    private function getEmailVariables(array $appointment): array {
        return [
            'contact_name' => $appointment['contact_name'] ?? 'Valued Customer',
            'appointment_date' => date('F j, Y', strtotime($appointment['scheduled_at'])),
            'appointment_time' => date('g:i A', strtotime($appointment['scheduled_at'])),
            'appointment_duration' => $appointment['duration_minutes'] . ' minutes',
            'service_name' => $appointment['booking_type_name'],
            'location_type' => ucfirst(str_replace('_', ' ', $appointment['location_type'])),
            'location_details' => $appointment['location_details'] ?? '',
            'video_link' => $appointment['video_meeting_url'] ?? '',
            'video_password' => $appointment['video_meeting_password'] ?? '',
            'staff_name' => $appointment['staff_name'] ?? 'Our team',
            'calendar_link' => $this->generateCalendarLink($appointment),
        ];
    }
    
    /**
     * Render email template with variables
     */
    private function renderEmailTemplate(string $template, array $variables): string {
        // Simple template rendering - replace {{variable}} with values
        $templates = [
            'appointment_confirmation' => "
                <h2>Your Appointment is Confirmed!</h2>
                <p>Hi {{contact_name}},</p>
                <p>Your appointment has been confirmed for:</p>
                <ul>
                    <li><strong>Service:</strong> {{service_name}}</li>
                    <li><strong>Date:</strong> {{appointment_date}}</li>
                    <li><strong>Time:</strong> {{appointment_time}}</li>
                    <li><strong>Duration:</strong> {{appointment_duration}}</li>
                    <li><strong>With:</strong> {{staff_name}}</li>
                </ul>
                {{#if video_link}}
                <p><strong>Video Meeting:</strong><br>
                <a href='{{video_link}}'>Join Meeting</a>
                {{#if video_password}}<br>Password: {{video_password}}{{/if}}
                </p>
                {{/if}}
                <p><a href='{{calendar_link}}'>Add to Calendar</a></p>
            ",
            'appointment_cancellation' => "
                <h2>Appointment Cancelled</h2>
                <p>Hi {{contact_name}},</p>
                <p>Your appointment for {{service_name}} on {{appointment_date}} at {{appointment_time}} has been cancelled.</p>
                <p>Reason: {{cancellation_reason}}</p>
                <p>If you'd like to reschedule, please book a new appointment.</p>
            ",
            'appointment_reschedule' => "
                <h2>Appointment Rescheduled</h2>
                <p>Hi {{contact_name}},</p>
                <p>Your appointment has been rescheduled:</p>
                <p><strong>Previous:</strong> {{old_date}} at {{old_time}}<br>
                <strong>New:</strong> {{appointment_date}} at {{appointment_time}}</p>
                {{#if video_link}}<p><a href='{{video_link}}'>Join Video Meeting</a></p>{{/if}}
            ",
            'appointment_no_show' => "
                <h2>We Missed You</h2>
                <p>Hi {{contact_name}},</p>
                <p>We noticed you weren't able to make your appointment for {{service_name}} on {{appointment_date}}.</p>
                <p>We'd love to reschedule. Please let us know a time that works better for you.</p>
            ",
            'appointment_completion' => "
                <h2>Thank You!</h2>
                <p>Hi {{contact_name}},</p>
                <p>Thank you for your appointment with {{staff_name}}. We hope everything went well!</p>
                <p>We'd love to hear your feedback. Please take a moment to share your experience.</p>
            "
        ];
        
        $body = $templates[$template] ?? '';
        
        foreach ($variables as $key => $value) {
            $body = str_replace("{{" . $key . "}}", $value, $body);
        }
        
        // Remove unused conditionals (simple implementation)
        $body = preg_replace('/\{\{#if [^}]+\}\}.*?\{\{\/if\}\}/s', '', $body);
        
        return $body;
    }
    
    /**
     * Generate add to calendar link
     */
    private function generateCalendarLink(array $appointment): string {
        $start = date('Ymd\THis', strtotime($appointment['scheduled_at']));
        $end = date('Ymd\THis', strtotime($appointment['scheduled_at']) + ($appointment['duration_minutes'] * 60));
        
        $params = http_build_query([
            'action' => 'TEMPLATE',
            'text' => $appointment['booking_type_name'],
            'dates' => "{$start}/{$end}",
            'details' => $appointment['video_meeting_url'] ?? '',
        ]);
        
        return "https://calendar.google.com/calendar/render?{$params}";
    }
    
    /**
     * Update analytics
     */
    private function updateAnalytics(array $appointment, string $status): void {
        $date = date('Y-m-d', strtotime($appointment['scheduled_at']));
        
        $stmt = $this->db->prepare("
            INSERT INTO appointment_analytics 
            (date, booking_type_id, staff_id, workspace_id, total_bookings, completed_bookings, total_revenue)
            VALUES (?, ?, ?, ?, 1, ?, ?)
            ON DUPLICATE KEY UPDATE
                completed_bookings = completed_bookings + VALUES(completed_bookings),
                total_revenue = total_revenue + VALUES(total_revenue)
        ");
        
        $revenue = $status === 'completed' ? ($appointment['price'] ?? 0) : 0;
        $completed = $status === 'completed' ? 1 : 0;
        
        $stmt->execute([
            $date,
            $appointment['booking_type_id'],
            $appointment['staff_id'] ?? null,
            $appointment['workspace_id'],
            $completed,
            $revenue
        ]);
    }
    
    /**
     * Get appointment details
     */
    private function getAppointmentDetails(int $appointmentId): ?array {
        $stmt = $this->db->prepare("
            SELECT a.*, 
                   bt.name as booking_type_name, bt.duration_minutes, bt.price, bt.location_type, bt.location_details,
                   c.name as contact_name, c.email as contact_email, c.phone as contact_phone,
                   s.name as staff_name
            FROM appointments a
            LEFT JOIN booking_types bt ON bt.id = a.booking_type_id
            LEFT JOIN contacts c ON c.id = a.contact_id
            LEFT JOIN staff s ON s.id = a.staff_id
            WHERE a.id = ?
        ");
        $stmt->execute([$appointmentId]);
        return $stmt->fetch(PDO::FETCH_ASSOC) ?: null;
    }
    
    /**
     * Log automation action
     */
    private function logAutomation(int $appointmentId, string $event, string $action, bool $success, ?string $error = null): void {
        $stmt = $this->db->prepare("
            INSERT INTO appointment_automation_logs 
            (appointment_id, trigger_event, action_taken, success, error_message)
            VALUES (?, ?, ?, ?, ?)
        ");
        $stmt->execute([$appointmentId, $event, $action, $success ? 1 : 0, $error]);
    }
    
    /**
     * Process pending reminders (called by cron job)
     */
    public function processPendingReminders(): int {
        $stmt = $this->db->prepare("
            SELECT r.*, a.*, 
                   c.name as contact_name, c.email as contact_email, c.phone as contact_phone,
                   bt.name as booking_type_name
            FROM appointment_reminders r
            JOIN appointments a ON a.id = r.appointment_id
            LEFT JOIN contacts c ON c.id = a.contact_id
            LEFT JOIN booking_types bt ON bt.id = a.booking_type_id
            WHERE r.sent = 0 
            AND r.scheduled_for <= NOW()
            AND a.status IN ('scheduled', 'confirmed')
            ORDER BY r.scheduled_for ASC
            LIMIT 100
        ");
        $stmt->execute();
        $reminders = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        $processed = 0;
        foreach ($reminders as $reminder) {
            try {
                $this->sendReminder($reminder);
                
                // Mark as sent
                $updateStmt = $this->db->prepare("UPDATE appointment_reminders SET sent = 1, sent_at = NOW() WHERE id = ?");
                $updateStmt->execute([$reminder['id']]);
                
                $this->logAutomation($reminder['appointment_id'], 'reminder', 'Reminder sent', true);
                $processed++;
                
            } catch (Exception $e) {
                $this->logAutomation($reminder['appointment_id'], 'reminder', 'Failed to send reminder', false, $e->getMessage());
            }
        }
        
        return $processed;
    }
    
    /**
     * Send reminder
     */
    private function sendReminder(array $reminder): void {
        $variables = $this->getEmailVariables($reminder);
        
        switch ($reminder['reminder_type']) {
            case 'email':
                $subject = "Reminder: Upcoming Appointment - {$reminder['booking_type_name']}";
                $body = "Hi {$variables['contact_name']},<br><br>";
                $body .= "This is a reminder about your upcoming appointment:<br>";
                $body .= "<strong>Date:</strong> {$variables['appointment_date']}<br>";
                $body .= "<strong>Time:</strong> {$variables['appointment_time']}<br>";
                if ($reminder['video_meeting_url']) {
                    $body .= "<br><a href='{$reminder['video_meeting_url']}'>Join Video Meeting</a>";
                }
                $this->emailService->send($reminder['contact_email'], $subject, $body);
                break;
                
            case 'sms':
                $message = "Reminder: You have an appointment for {$reminder['booking_type_name']} on {$variables['appointment_date']} at {$variables['appointment_time']}.";
                if ($reminder['video_meeting_url']) {
                    $message .= " Join: {$reminder['video_meeting_url']}";
                }
                $this->smsService->send($reminder['contact_phone'], $message);
                break;
        }
    }
}
