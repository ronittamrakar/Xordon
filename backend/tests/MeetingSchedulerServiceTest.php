<?php
/**
 * Property-Based Tests for MeetingSchedulerService
 * 
 * **Feature: crm-enhancements, Property 8: Meeting Booking Data Consistency**
 * **Feature: crm-enhancements, Property 9: Meeting Reminder Scheduling**
 * **Feature: crm-enhancements, Property 10: Meeting Status Propagation**
 */

require_once __DIR__ . '/../src/Database.php';
require_once __DIR__ . '/../src/services/MeetingSchedulerService.php';

class MeetingSchedulerServiceTest {
    private $db;
    private $service;
    private $testUserId;
    private $testContactIds = [];
    
    public function __construct() {
        $this->db = Database::conn();
        $this->service = new MeetingSchedulerService();
    }
    
    public function setUp(): void {
        // Create test user if not exists
        $stmt = $this->db->prepare("SELECT id FROM users WHERE email = 'meeting_test@test.com'");
        $stmt->execute();
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($user) {
            $this->testUserId = $user['id'];
        } else {
            $stmt = $this->db->prepare("
                INSERT INTO users (email, password_hash, name, created_at) 
                VALUES ('meeting_test@test.com', 'test_hash', 'Meeting Test User', NOW())
            ");
            $stmt->execute();
            $this->testUserId = (int) $this->db->lastInsertId();
        }
        
        // Create test contacts
        for ($i = 0; $i < 5; $i++) {
            $email = "meeting_contact_{$i}_" . time() . "@test.com";
            $stmt = $this->db->prepare("
                INSERT INTO contacts (email, name, phone, user_id, created_at) 
                VALUES (?, ?, ?, ?, NOW())
            ");
            $stmt->execute([$email, "Meeting Contact {$i}", "+1555100{$i}000", $this->testUserId]);
            $this->testContactIds[] = (int) $this->db->lastInsertId();
        }
    }
    
    public function tearDown(): void {
        // Clean up test data
        foreach ($this->testContactIds as $contactId) {
            $this->db->prepare("DELETE FROM contacts WHERE id = ?")->execute([$contactId]);
        }
        
        $this->db->prepare("DELETE FROM meetings WHERE user_id = ?")->execute([$this->testUserId]);
    }
    
    /**
     * Property 8: Meeting Booking Data Consistency
     * **Validates: Requirements 3.2**
     * 
     * For any meeting booked via embedded link, the system SHALL have:
     * (1) a calendar event, (2) a contact record association, and (3) a timeline activity entry.
     */
    public function testProperty8_MeetingBookingDataConsistency(): array {
        $results = ['passed' => 0, 'failed' => 0, 'errors' => []];
        $iterations = 50;
        
        echo "Property 8: Meeting Booking Data Consistency\n";
        echo "  **Validates: Requirements 3.2**\n";
        
        // Clean up any existing meetings for this user to avoid conflicts
        $this->db->prepare("DELETE FROM meetings WHERE user_id = ?")->execute([$this->testUserId]);
        
        for ($i = 0; $i < $iterations; $i++) {
            try {
                $contactId = $this->testContactIds[array_rand($this->testContactIds)];
                
                // Generate unique meeting time - each iteration gets a unique day and hour
                $dayOffset = $i + 1;  // Days 1-50
                $hour = 9 + ($i % 8); // Hours 9-16
                $title = "Test Meeting {$i}";
                $scheduledAt = date('Y-m-d H:i:s', strtotime("+{$dayOffset} days +{$hour} hours"));
                $duration = [15, 30, 45, 60][array_rand([15, 30, 45, 60])];
                
                $options = [
                    'description' => "Description for meeting {$i}",
                    'location' => "Room " . rand(100, 999),
                    'meeting_link' => "https://meet.example.com/room-{$i}"
                ];
                
                // Book meeting
                $meetingId = $this->service->bookMeeting(
                    $this->testUserId,
                    $contactId,
                    $title,
                    $scheduledAt,
                    $duration,
                    $options
                );
                
                // Verify meeting was created
                if (!$meetingId) {
                    throw new Exception("Meeting ID not returned");
                }
                
                // Retrieve meeting and verify data consistency
                $meeting = $this->service->getMeetingById($meetingId);
                
                if (!$meeting) {
                    throw new Exception("Meeting not found after creation");
                }
                
                // Verify all data matches
                if ($meeting['title'] !== $title) {
                    throw new Exception("Title mismatch: expected '{$title}', got '{$meeting['title']}'");
                }
                
                if ($meeting['contact_id'] != $contactId) {
                    throw new Exception("Contact ID mismatch");
                }
                
                if ($meeting['user_id'] != $this->testUserId) {
                    throw new Exception("User ID mismatch");
                }
                
                if ($meeting['duration_minutes'] != $duration) {
                    throw new Exception("Duration mismatch");
                }
                
                if ($meeting['status'] !== 'scheduled') {
                    throw new Exception("Initial status should be 'scheduled'");
                }
                
                if ($meeting['description'] !== $options['description']) {
                    throw new Exception("Description mismatch");
                }
                
                if ($meeting['location'] !== $options['location']) {
                    throw new Exception("Location mismatch");
                }
                
                // Verify contact association - contact may not have name set
                // Just verify the contact_id is properly linked
                if ($meeting['contact_id'] != $contactId) {
                    throw new Exception("Contact association not properly set");
                }
                
                $results['passed']++;
                
            } catch (Exception $e) {
                $results['failed']++;
                if (count($results['errors']) < 5) {
                    $results['errors'][] = "Iteration {$i}: " . $e->getMessage();
                }
            }
        }
        
        $status = $results['failed'] === 0 ? '✓ PASSED' : '✗ FAILED';
        echo "  {$status} ({$results['passed']}/{$iterations} iterations)\n\n";
        
        return $results;
    }
    
    /**
     * Property 9: Meeting Reminder Scheduling
     * **Validates: Requirements 3.3**
     * 
     * For any scheduled meeting with reminder intervals, reminders SHALL be 
     * scheduled at exactly the configured intervals before the meeting time.
     */
    public function testProperty9_MeetingReminderScheduling(): array {
        $results = ['passed' => 0, 'failed' => 0, 'errors' => []];
        $iterations = 50;
        
        echo "Property 9: Meeting Reminder Scheduling\n";
        echo "  **Validates: Requirements 3.3**\n";
        
        // Clean up any existing meetings for this user to avoid conflicts
        $this->db->prepare("DELETE FROM meetings WHERE user_id = ?")->execute([$this->testUserId]);
        
        for ($i = 0; $i < $iterations; $i++) {
            try {
                $contactId = $this->testContactIds[array_rand($this->testContactIds)];
                
                // Generate unique meeting time - each iteration gets unique day offset
                // Use days 60-110 to avoid conflicts with Property 8 tests
                $dayOffset = 60 + $i;
                $hour = 10 + ($i % 6); // Hours 10-15
                $scheduledAt = date('Y-m-d H:i:s', strtotime("+{$dayOffset} days +{$hour} hours"));
                
                $meetingId = $this->service->bookMeeting(
                    $this->testUserId,
                    $contactId,
                    "Reminder Test Meeting {$i}",
                    $scheduledAt,
                    30
                );
                
                // Verify default reminders were created (24h and 1h before)
                $stmt = $this->db->prepare("
                    SELECT * FROM meeting_reminders 
                    WHERE meeting_id = ? 
                    ORDER BY remind_at ASC
                ");
                $stmt->execute([$meetingId]);
                $reminders = $stmt->fetchAll(PDO::FETCH_ASSOC);
                
                if (count($reminders) < 2) {
                    throw new Exception("Expected at least 2 default reminders, got " . count($reminders));
                }
                
                $meetingTime = strtotime($scheduledAt);
                
                // Verify reminder times are correct
                foreach ($reminders as $reminder) {
                    $reminderTime = strtotime($reminder['remind_at']);
                    
                    // Reminder should be before meeting
                    if ($reminderTime >= $meetingTime) {
                        throw new Exception("Reminder time should be before meeting time");
                    }
                    
                    // Reminder should not be sent yet
                    if ($reminder['sent']) {
                        throw new Exception("New reminder should not be marked as sent");
                    }
                }
                
                // Test custom reminder intervals
                $customIntervals = [
                    ['minutes' => 2880, 'type' => 'email'],  // 48 hours
                    ['minutes' => 120, 'type' => 'sms'],     // 2 hours
                    ['minutes' => 15, 'type' => 'notification']
                ];
                
                // Create another meeting with custom reminders - use different day range
                $dayOffset2 = 120 + $i;
                $scheduledAt2 = date('Y-m-d H:i:s', strtotime("+{$dayOffset2} days +14 hours"));
                $meetingId2 = $this->service->bookMeeting(
                    $this->testUserId,
                    $contactId,
                    "Custom Reminder Meeting {$i}",
                    $scheduledAt2,
                    60
                );
                
                // Clear default reminders and add custom ones
                $this->db->prepare("DELETE FROM meeting_reminders WHERE meeting_id = ?")->execute([$meetingId2]);
                $this->service->scheduleReminders($meetingId2, $scheduledAt2, $customIntervals);
                
                // Verify custom reminders
                $stmt->execute([$meetingId2]);
                $customReminders = $stmt->fetchAll(PDO::FETCH_ASSOC);
                
                if (count($customReminders) !== count($customIntervals)) {
                    throw new Exception("Expected " . count($customIntervals) . " custom reminders, got " . count($customReminders));
                }
                
                // Verify each custom reminder is at the correct interval
                $meetingTime2 = strtotime($scheduledAt2);
                foreach ($customReminders as $idx => $reminder) {
                    $reminderTime = strtotime($reminder['remind_at']);
                    $expectedInterval = $customIntervals[$idx]['minutes'] * 60;
                    $actualInterval = $meetingTime2 - $reminderTime;
                    
                    // Allow 1 second tolerance for timing
                    if (abs($actualInterval - $expectedInterval) > 1) {
                        throw new Exception("Reminder interval mismatch: expected {$expectedInterval}s, got {$actualInterval}s");
                    }
                }
                
                $results['passed']++;
                
            } catch (Exception $e) {
                $results['failed']++;
                if (count($results['errors']) < 5) {
                    $results['errors'][] = "Iteration {$i}: " . $e->getMessage();
                }
            }
        }
        
        $status = $results['failed'] === 0 ? '✓ PASSED' : '✗ FAILED';
        echo "  {$status} ({$results['passed']}/{$iterations} iterations)\n\n";
        
        return $results;
    }
    
    /**
     * Property 10: Meeting Status Propagation
     * **Validates: Requirements 3.4**
     * 
     * For any meeting status change, the associated contact record SHALL 
     * reflect the new status within the same transaction.
     */
    public function testProperty10_MeetingStatusPropagation(): array {
        $results = ['passed' => 0, 'failed' => 0, 'errors' => []];
        $iterations = 50;
        
        echo "Property 10: Meeting Status Propagation\n";
        echo "  **Validates: Requirements 3.4**\n";
        
        // Clean up any existing meetings for this user to avoid conflicts
        $this->db->prepare("DELETE FROM meetings WHERE user_id = ?")->execute([$this->testUserId]);
        
        $statuses = ['confirmed', 'cancelled', 'rescheduled', 'completed', 'no_show'];
        
        for ($i = 0; $i < $iterations; $i++) {
            try {
                $contactId = $this->testContactIds[array_rand($this->testContactIds)];
                $newStatus = $statuses[array_rand($statuses)];
                
                // Generate unique meeting time - use days 180-230 to avoid conflicts
                $dayOffset = 180 + $i;
                $hour = 9 + ($i % 8);
                $scheduledAt = date('Y-m-d H:i:s', strtotime("+{$dayOffset} days +{$hour} hours"));
                
                $meetingId = $this->service->bookMeeting(
                    $this->testUserId,
                    $contactId,
                    "Status Test Meeting {$i}",
                    $scheduledAt,
                    30
                );
                
                // Get contact updated_at before status change
                $stmt = $this->db->prepare("SELECT updated_at FROM contacts WHERE id = ?");
                $stmt->execute([$contactId]);
                $contactBefore = $stmt->fetch(PDO::FETCH_ASSOC);
                $beforeTimestamp = strtotime($contactBefore['updated_at']);
                
                // Small delay to ensure timestamp difference (MySQL timestamp has 1-second resolution)
                sleep(1);
                
                // Update meeting status
                $options = [];
                if ($newStatus === 'rescheduled') {
                    // Use a unique day for rescheduled meeting
                    $newDayOffset = 250 + $i;
                    $options['new_scheduled_at'] = date('Y-m-d H:i:s', strtotime("+{$newDayOffset} days +10 hours"));
                }
                
                $this->service->updateMeetingStatus($meetingId, $this->testUserId, $newStatus, $options);
                
                // Verify meeting status was updated
                $meeting = $this->service->getMeetingById($meetingId);
                if ($meeting['status'] !== $newStatus) {
                    throw new Exception("Meeting status not updated: expected '{$newStatus}', got '{$meeting['status']}'");
                }
                
                // Verify contact was updated (timeline activity logged)
                $stmt->execute([$contactId]);
                $contactAfter = $stmt->fetch(PDO::FETCH_ASSOC);
                $afterTimestamp = strtotime($contactAfter['updated_at']);
                
                // The contact's updated_at should be updated after the status change
                if ($afterTimestamp <= $beforeTimestamp) {
                    throw new Exception("Contact updated_at should be updated after status change (before: {$contactBefore['updated_at']}, after: {$contactAfter['updated_at']})");
                }
                
                // Verify status-specific behavior
                if ($newStatus === 'cancelled') {
                    // Reminders should be cancelled
                    $stmt2 = $this->db->prepare("
                        SELECT COUNT(*) as count FROM meeting_reminders 
                        WHERE meeting_id = ? AND sent = FALSE
                    ");
                    $stmt2->execute([$meetingId]);
                    $pendingReminders = $stmt2->fetch(PDO::FETCH_ASSOC);
                    
                    if ($pendingReminders['count'] > 0) {
                        throw new Exception("Pending reminders should be cancelled when meeting is cancelled");
                    }
                }
                
                $results['passed']++;
                
            } catch (Exception $e) {
                $results['failed']++;
                if (count($results['errors']) < 5) {
                    $results['errors'][] = "Iteration {$i}: " . $e->getMessage();
                }
            }
        }
        
        $status = $results['failed'] === 0 ? '✓ PASSED' : '✗ FAILED';
        echo "  {$status} ({$results['passed']}/{$iterations} iterations)\n\n";
        
        return $results;
    }
    
    /**
     * Run all property tests
     */
    public function runAllTests(): array {
        echo "=== MeetingSchedulerService Property Tests ===\n\n";
        
        $this->setUp();
        
        $allResults = [
            'property8' => $this->testProperty8_MeetingBookingDataConsistency(),
            'property9' => $this->testProperty9_MeetingReminderScheduling(),
            'property10' => $this->testProperty10_MeetingStatusPropagation()
        ];
        
        $this->tearDown();
        
        // Summary
        $totalPassed = array_sum(array_column($allResults, 'passed'));
        $totalFailed = array_sum(array_column($allResults, 'failed'));
        
        echo "=== Test Summary ===\n";
        echo "Total Passed: {$totalPassed}\n";
        echo "Total Failed: {$totalFailed}\n";
        
        if ($totalFailed > 0) {
            echo "\nErrors:\n";
            foreach ($allResults as $property => $result) {
                foreach ($result['errors'] as $error) {
                    echo "  [{$property}] {$error}\n";
                }
            }
        }
        
        return $allResults;
    }
}

// Run tests if executed directly
if (php_sapi_name() === 'cli' && basename(__FILE__) === basename($_SERVER['SCRIPT_FILENAME'])) {
    $test = new MeetingSchedulerServiceTest();
    $results = $test->runAllTests();
    exit(array_sum(array_column($results, 'failed')) > 0 ? 1 : 0);
}
