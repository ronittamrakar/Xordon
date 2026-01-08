<?php
/**
 * MeetingSchedulerService - Calendar and meeting management
 * Requirements: 3.1, 3.2, 3.3, 3.4
 */

require_once __DIR__ . '/../Database.php';

class MeetingSchedulerService {
    private $db;
    
    public function __construct() {
        $this->db = Database::conn();
    }
    
    /**
     * Book a meeting with calendar integration
     * Requirements: 3.2, 3.3, 3.4
     * 
     * @param int $userId
     * @param int $contactId
     * @param string $title
     * @param string $scheduledAt
     * @param int $durationMinutes
     * @param array $options
     * @return int Meeting ID
     */
    public function bookMeeting(
        int $userId, 
        int $contactId, 
        string $title, 
        string $scheduledAt, 
        int $durationMinutes = 30,
        array $options = []
    ): int {
        // Validate scheduled time is in the future
        if (strtotime($scheduledAt) <= time()) {
            throw new InvalidArgumentException('Meeting must be scheduled in the future');
        }
        
        // Validate duration
        if ($durationMinutes < 5 || $durationMinutes > 480) {
            throw new InvalidArgumentException('Duration must be between 5 and 480 minutes');
        }
        
        // Check for conflicts
        if ($this->hasConflict($userId, $scheduledAt, $durationMinutes)) {
            throw new RuntimeException('Time slot conflicts with existing meeting');
        }
        
        $this->db->beginTransaction();
        
        try {
            // Create meeting record
            $stmt = $this->db->prepare("
                INSERT INTO meetings (
                    contact_id, user_id, title, description, scheduled_at, 
                    duration_minutes, location, meeting_link, status, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'scheduled', NOW())
            ");
            
            $stmt->execute([
                $contactId,
                $userId,
                $title,
                $options['description'] ?? null,
                $scheduledAt,
                $durationMinutes,
                $options['location'] ?? null,
                $options['meeting_link'] ?? null
            ]);
            
            $meetingId = (int) $this->db->lastInsertId();
            
            // Schedule default reminders (24 hours and 1 hour before)
            $this->scheduleReminders($meetingId, $scheduledAt);
            
            // Log activity to contact timeline
            $this->logMeetingActivity($contactId, $meetingId, 'scheduled', $title);
            
            // Sync with calendar if connected
            if (isset($options['sync_calendar']) && $options['sync_calendar']) {
                $this->syncToCalendar($meetingId, $userId);
            }
            
            $this->db->commit();
            
            return $meetingId;
            
        } catch (Exception $e) {
            $this->db->rollBack();
            throw $e;
        }
    }
    
    /**
     * Update meeting status with contact sync
     * Requirements: 3.4
     * 
     * @param int $meetingId
     * @param int $userId
     * @param string $status
     * @param array $options
     * @return bool
     */
    public function updateMeetingStatus(int $meetingId, int $userId, string $status, array $options = []): bool {
        $validStatuses = ['scheduled', 'confirmed', 'cancelled', 'rescheduled', 'completed', 'no_show'];
        
        if (!in_array($status, $validStatuses)) {
            throw new InvalidArgumentException("Invalid status: {$status}");
        }
        
        // Get current meeting
        $meeting = $this->getMeetingById($meetingId);
        if (!$meeting || $meeting['user_id'] != $userId) {
            throw new RuntimeException('Meeting not found or access denied');
        }
        
        $oldStatus = $meeting['status'];
        
        $this->db->beginTransaction();
        
        try {
            // Update meeting status
            $stmt = $this->db->prepare("
                UPDATE meetings 
                SET status = ?, updated_at = NOW()
                WHERE id = ?
            ");
            $stmt->execute([$status, $meetingId]);
            
            // Log status change to contact timeline
            $this->logMeetingActivity(
                $meeting['contact_id'], 
                $meetingId, 
                $status, 
                $meeting['title'],
                "Status changed from {$oldStatus} to {$status}"
            );
            
            // Handle status-specific actions
            $this->handleStatusChange($meeting, $oldStatus, $status, $options);
            
            $this->db->commit();
            
            return true;
            
        } catch (Exception $e) {
            $this->db->rollBack();
            throw $e;
        }
    }
    
    /**
     * Schedule reminders with configurable intervals
     * Requirements: 3.3
     * 
     * @param int $meetingId
     * @param string $scheduledAt
     * @param array|null $intervals Minutes before meeting
     * @return bool
     */
    public function scheduleReminders(int $meetingId, string $scheduledAt, ?array $intervals = null): bool {
        // Default intervals: 24 hours (1440 min) and 1 hour (60 min) before
        if ($intervals === null) {
            $intervals = [
                ['minutes' => 1440, 'type' => 'email'],
                ['minutes' => 60, 'type' => 'notification']
            ];
        }
        
        $meetingTime = strtotime($scheduledAt);
        
        foreach ($intervals as $interval) {
            $reminderTime = $meetingTime - ($interval['minutes'] * 60);
            
            // Only schedule if reminder time is in the future
            if ($reminderTime > time()) {
                $stmt = $this->db->prepare("
                    INSERT INTO meeting_reminders (meeting_id, remind_at, reminder_type, sent)
                    VALUES (?, ?, ?, FALSE)
                ");
                $stmt->execute([
                    $meetingId,
                    date('Y-m-d H:i:s', $reminderTime),
                    $interval['type'] ?? 'notification'
                ]);
            }
        }
        
        return true;
    }
    
    /**
     * Get meeting by ID
     */
    public function getMeetingById(int $meetingId): ?array {
        $stmt = $this->db->prepare("
            SELECT m.*, c.name as contact_name, c.email as contact_email
            FROM meetings m
            LEFT JOIN contacts c ON c.id = m.contact_id
            WHERE m.id = ?
        ");
        $stmt->execute([$meetingId]);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        return $result ?: null;
    }
    
    /**
     * Get meetings for a user
     */
    public function getMeetings(int $userId, array $filters = []): array {
        $sql = "
            SELECT m.*, c.name as contact_name, c.email as contact_email
            FROM meetings m
            LEFT JOIN contacts c ON c.id = m.contact_id
            WHERE m.user_id = ?
        ";
        $params = [$userId];
        
        if (!empty($filters['status'])) {
            $sql .= " AND m.status = ?";
            $params[] = $filters['status'];
        }
        
        if (!empty($filters['contact_id'])) {
            $sql .= " AND m.contact_id = ?";
            $params[] = $filters['contact_id'];
        }
        
        if (!empty($filters['from_date'])) {
            $sql .= " AND m.scheduled_at >= ?";
            $params[] = $filters['from_date'];
        }
        
        if (!empty($filters['to_date'])) {
            $sql .= " AND m.scheduled_at <= ?";
            $params[] = $filters['to_date'];
        }
        
        $sql .= " ORDER BY m.scheduled_at ASC";
        
        if (!empty($filters['limit'])) {
            $sql .= " LIMIT " . (int) $filters['limit'];
        }
        
        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    
    /**
     * Get upcoming meetings
     */
    public function getUpcomingMeetings(int $userId, int $limit = 10): array {
        return $this->getMeetings($userId, [
            'from_date' => date('Y-m-d H:i:s'),
            'status' => 'scheduled',
            'limit' => $limit
        ]);
    }
    
    /**
     * Check for meeting conflicts
     */
    private function hasConflict(int $userId, string $scheduledAt, int $durationMinutes, ?int $excludeMeetingId = null): bool {
        $startTime = strtotime($scheduledAt);
        $endTime = $startTime + ($durationMinutes * 60);
        
        $sql = "
            SELECT COUNT(*) as count FROM meetings 
            WHERE user_id = ? 
            AND status NOT IN ('cancelled', 'completed', 'no_show')
            AND (
                (scheduled_at <= ? AND DATE_ADD(scheduled_at, INTERVAL duration_minutes MINUTE) > ?)
                OR (scheduled_at < ? AND DATE_ADD(scheduled_at, INTERVAL duration_minutes MINUTE) >= ?)
                OR (scheduled_at >= ? AND scheduled_at < ?)
            )
        ";
        $params = [
            $userId,
            date('Y-m-d H:i:s', $startTime), date('Y-m-d H:i:s', $startTime),
            date('Y-m-d H:i:s', $endTime), date('Y-m-d H:i:s', $endTime),
            date('Y-m-d H:i:s', $startTime), date('Y-m-d H:i:s', $endTime)
        ];
        
        if ($excludeMeetingId) {
            $sql .= " AND id != ?";
            $params[] = $excludeMeetingId;
        }
        
        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        
        return $result['count'] > 0;
    }
    
    /**
     * Log meeting activity to contact timeline
     */
    private function logMeetingActivity(int $contactId, int $meetingId, string $action, string $title, ?string $notes = null): void {
        // This would integrate with a contact activity/timeline system
        // For now, we'll update the contact's updated_at timestamp
        $stmt = $this->db->prepare("UPDATE contacts SET updated_at = NOW() WHERE id = ?");
        $stmt->execute([$contactId]);
    }
    
    /**
     * Handle status-specific actions
     */
    private function handleStatusChange(array $meeting, string $oldStatus, string $newStatus, array $options): void {
        switch ($newStatus) {
            case 'cancelled':
                // Cancel pending reminders
                $this->cancelReminders($meeting['id']);
                break;
                
            case 'rescheduled':
                // Cancel old reminders and schedule new ones if new time provided
                if (!empty($options['new_scheduled_at'])) {
                    $this->cancelReminders($meeting['id']);
                    $this->scheduleReminders($meeting['id'], $options['new_scheduled_at']);
                    
                    // Update scheduled time
                    $stmt = $this->db->prepare("UPDATE meetings SET scheduled_at = ? WHERE id = ?");
                    $stmt->execute([$options['new_scheduled_at'], $meeting['id']]);
                }
                break;
                
            case 'completed':
                // Mark reminders as sent
                $this->cancelReminders($meeting['id']);
                break;
        }
    }
    
    /**
     * Cancel pending reminders for a meeting
     */
    private function cancelReminders(int $meetingId): void {
        $stmt = $this->db->prepare("DELETE FROM meeting_reminders WHERE meeting_id = ? AND sent = FALSE");
        $stmt->execute([$meetingId]);
    }
    
    /**
     * Sync meeting to calendar (placeholder for calendar integration)
     */
    private function syncToCalendar(int $meetingId, int $userId): void {
        // This would integrate with Google Calendar or Outlook
        // For now, just log that sync was requested
        error_log("Calendar sync requested for meeting {$meetingId} by user {$userId}");
    }
    
    /**
     * Get pending reminders that need to be sent
     */
    public function getPendingReminders(): array {
        $stmt = $this->db->prepare("
            SELECT mr.*, m.title, m.scheduled_at, m.user_id, m.contact_id,
                   c.name as contact_name, c.email as contact_email
            FROM meeting_reminders mr
            JOIN meetings m ON m.id = mr.meeting_id
            LEFT JOIN contacts c ON c.id = m.contact_id
            WHERE mr.sent = FALSE 
            AND mr.remind_at <= NOW()
            AND m.status IN ('scheduled', 'confirmed')
            ORDER BY mr.remind_at ASC
        ");
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    
    /**
     * Mark reminder as sent
     */
    public function markReminderSent(int $reminderId): bool {
        $stmt = $this->db->prepare("
            UPDATE meeting_reminders 
            SET sent = TRUE, sent_at = NOW() 
            WHERE id = ?
        ");
        return $stmt->execute([$reminderId]);
    }
    
    /**
     * Connect calendar provider
     * Requirements: 3.1
     */
    public function connectCalendar(int $userId, string $provider, string $accessToken, ?string $refreshToken = null, ?string $expiresAt = null): int {
        $validProviders = ['google', 'outlook'];
        if (!in_array($provider, $validProviders)) {
            throw new InvalidArgumentException("Invalid calendar provider: {$provider}");
        }
        
        // Check if connection already exists
        $stmt = $this->db->prepare("
            SELECT id FROM calendar_connections 
            WHERE user_id = ? AND provider = ?
        ");
        $stmt->execute([$userId, $provider]);
        $existing = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($existing) {
            // Update existing connection
            $stmt = $this->db->prepare("
                UPDATE calendar_connections 
                SET access_token = ?, refresh_token = ?, token_expires_at = ?, status = 'active', updated_at = NOW()
                WHERE id = ?
            ");
            $stmt->execute([$accessToken, $refreshToken, $expiresAt, $existing['id']]);
            return $existing['id'];
        }
        
        // Create new connection
        $stmt = $this->db->prepare("
            INSERT INTO calendar_connections (user_id, provider, access_token, refresh_token, token_expires_at, status, created_at)
            VALUES (?, ?, ?, ?, ?, 'active', NOW())
        ");
        $stmt->execute([$userId, $provider, $accessToken, $refreshToken, $expiresAt]);
        
        return (int) $this->db->lastInsertId();
    }
    
    /**
     * Get calendar connection for user
     */
    public function getCalendarConnection(int $userId, string $provider): ?array {
        $stmt = $this->db->prepare("
            SELECT * FROM calendar_connections 
            WHERE user_id = ? AND provider = ? AND status = 'active'
        ");
        $stmt->execute([$userId, $provider]);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        return $result ?: null;
    }
}
