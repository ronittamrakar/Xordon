<?php
/**
 * MeetingController - REST API endpoints for meeting scheduler
 * Requirements: 3.1, 3.2, 3.4
 */

require_once __DIR__ . '/../services/MeetingSchedulerService.php';
require_once __DIR__ . '/../Auth.php';

class MeetingController {
    private $service;
    
    public function __construct() {
        $this->service = new MeetingSchedulerService();
    }
    
    /**
     * GET /api/meetings - List meetings for the authenticated user
     * Requirements: 3.2
     */
    public function index(): void {
        try {
            $userId = Auth::userId();
            if (!$userId) {
                $this->jsonResponse(['error' => 'Unauthorized'], 401);
                return;
            }
            
            $filters = [
                'status' => $_GET['status'] ?? null,
                'contact_id' => $_GET['contact_id'] ?? null,
                'from_date' => $_GET['from_date'] ?? null,
                'to_date' => $_GET['to_date'] ?? null,
                'limit' => $_GET['limit'] ?? 50
            ];
            
            $meetings = $this->service->getMeetings($userId, array_filter($filters));
            
            $formatted = array_map(function($meeting) {
                return $this->formatMeeting($meeting);
            }, $meetings);
            
            $this->jsonResponse(['success' => true, 'data' => $formatted]);
            
        } catch (Exception $e) {
            error_log("MeetingController::index error: " . $e->getMessage());
            $this->jsonResponse(['error' => 'Failed to fetch meetings'], 500);
        }
    }
    
    /**
     * GET /api/meetings/upcoming - Get upcoming meetings
     */
    public function upcoming(): void {
        try {
            $userId = Auth::userId();
            if (!$userId) {
                $this->jsonResponse(['error' => 'Unauthorized'], 401);
                return;
            }
            
            $limit = $_GET['limit'] ?? 10;
            $meetings = $this->service->getUpcomingMeetings($userId, (int) $limit);
            
            $formatted = array_map(function($meeting) {
                return $this->formatMeeting($meeting);
            }, $meetings);
            
            $this->jsonResponse(['success' => true, 'data' => $formatted]);
            
        } catch (Exception $e) {
            error_log("MeetingController::upcoming error: " . $e->getMessage());
            $this->jsonResponse(['error' => 'Failed to fetch upcoming meetings'], 500);
        }
    }
    
    /**
     * GET /api/meetings/{id} - Get a single meeting
     */
    public function show(int $id): void {
        try {
            $userId = Auth::userId();
            if (!$userId) {
                $this->jsonResponse(['error' => 'Unauthorized'], 401);
                return;
            }
            
            $meeting = $this->service->getMeetingById($id);
            
            if (!$meeting || $meeting['user_id'] != $userId) {
                $this->jsonResponse(['error' => 'Meeting not found'], 404);
                return;
            }
            
            $this->jsonResponse(['success' => true, 'data' => $this->formatMeeting($meeting)]);
            
        } catch (Exception $e) {
            error_log("MeetingController::show error: " . $e->getMessage());
            $this->jsonResponse(['error' => 'Failed to fetch meeting'], 500);
        }
    }
    
    /**
     * POST /api/meetings - Book a new meeting
     * Requirements: 3.2
     */
    public function store(): void {
        try {
            $userId = Auth::userId();
            if (!$userId) {
                $this->jsonResponse(['error' => 'Unauthorized'], 401);
                return;
            }
            
            $data = json_decode(file_get_contents('php://input'), true);
            
            if (!$data) {
                $this->jsonResponse(['error' => 'Invalid JSON'], 400);
                return;
            }
            
            // Validate required fields
            if (empty($data['contact_id'])) {
                $this->jsonResponse(['error' => 'contact_id is required'], 400);
                return;
            }
            
            if (empty($data['title'])) {
                $this->jsonResponse(['error' => 'title is required'], 400);
                return;
            }
            
            if (empty($data['scheduled_at'])) {
                $this->jsonResponse(['error' => 'scheduled_at is required'], 400);
                return;
            }
            
            $options = [
                'description' => $data['description'] ?? null,
                'location' => $data['location'] ?? null,
                'meeting_link' => $data['meeting_link'] ?? null,
                'sync_calendar' => $data['sync_calendar'] ?? false
            ];
            
            $meetingId = $this->service->bookMeeting(
                $userId,
                (int) $data['contact_id'],
                $data['title'],
                $data['scheduled_at'],
                $data['duration_minutes'] ?? 30,
                $options
            );
            
            $meeting = $this->service->getMeetingById($meetingId);
            
            $this->jsonResponse([
                'success' => true,
                'data' => $this->formatMeeting($meeting),
                'message' => 'Meeting booked successfully'
            ], 201);
            
        } catch (InvalidArgumentException $e) {
            $this->jsonResponse(['error' => $e->getMessage()], 400);
        } catch (RuntimeException $e) {
            $this->jsonResponse(['error' => $e->getMessage()], 409);
        } catch (Exception $e) {
            error_log("MeetingController::store error: " . $e->getMessage());
            $this->jsonResponse(['error' => 'Failed to book meeting'], 500);
        }
    }
    
    /**
     * PUT /api/meetings/{id}/status - Update meeting status
     * Requirements: 3.4
     */
    public function updateStatus(int $id): void {
        try {
            $userId = Auth::userId();
            if (!$userId) {
                $this->jsonResponse(['error' => 'Unauthorized'], 401);
                return;
            }
            
            $data = json_decode(file_get_contents('php://input'), true);
            
            if (empty($data['status'])) {
                $this->jsonResponse(['error' => 'status is required'], 400);
                return;
            }
            
            $options = [];
            if (!empty($data['new_scheduled_at'])) {
                $options['new_scheduled_at'] = $data['new_scheduled_at'];
            }
            
            $this->service->updateMeetingStatus($id, $userId, $data['status'], $options);
            
            $meeting = $this->service->getMeetingById($id);
            
            $this->jsonResponse([
                'success' => true,
                'data' => $this->formatMeeting($meeting),
                'message' => 'Meeting status updated'
            ]);
            
        } catch (InvalidArgumentException $e) {
            $this->jsonResponse(['error' => $e->getMessage()], 400);
        } catch (RuntimeException $e) {
            $this->jsonResponse(['error' => $e->getMessage()], 404);
        } catch (Exception $e) {
            error_log("MeetingController::updateStatus error: " . $e->getMessage());
            $this->jsonResponse(['error' => 'Failed to update meeting status'], 500);
        }
    }
    
    /**
     * POST /api/calendar/connect - Connect calendar provider via OAuth
     * Requirements: 3.1
     */
    public function connectCalendar(): void {
        try {
            $userId = Auth::userId();
            if (!$userId) {
                $this->jsonResponse(['error' => 'Unauthorized'], 401);
                return;
            }
            
            $data = json_decode(file_get_contents('php://input'), true);
            
            if (empty($data['provider'])) {
                $this->jsonResponse(['error' => 'provider is required (google or outlook)'], 400);
                return;
            }
            
            if (empty($data['access_token'])) {
                $this->jsonResponse(['error' => 'access_token is required'], 400);
                return;
            }
            
            $connectionId = $this->service->connectCalendar(
                $userId,
                $data['provider'],
                $data['access_token'],
                $data['refresh_token'] ?? null,
                $data['expires_at'] ?? null
            );
            
            $this->jsonResponse([
                'success' => true,
                'data' => ['connection_id' => $connectionId],
                'message' => 'Calendar connected successfully'
            ]);
            
        } catch (InvalidArgumentException $e) {
            $this->jsonResponse(['error' => $e->getMessage()], 400);
        } catch (Exception $e) {
            error_log("MeetingController::connectCalendar error: " . $e->getMessage());
            $this->jsonResponse(['error' => 'Failed to connect calendar'], 500);
        }
    }
    
    /**
     * GET /api/calendar/status - Get calendar connection status
     */
    public function calendarStatus(): void {
        try {
            $userId = Auth::userId();
            if (!$userId) {
                $this->jsonResponse(['error' => 'Unauthorized'], 401);
                return;
            }
            
            $googleConnection = $this->service->getCalendarConnection($userId, 'google');
            $outlookConnection = $this->service->getCalendarConnection($userId, 'outlook');
            
            $this->jsonResponse([
                'success' => true,
                'data' => [
                    'google' => $googleConnection ? [
                        'connected' => true,
                        'status' => $googleConnection['status'],
                        'expires_at' => $googleConnection['token_expires_at']
                    ] : ['connected' => false],
                    'outlook' => $outlookConnection ? [
                        'connected' => true,
                        'status' => $outlookConnection['status'],
                        'expires_at' => $outlookConnection['token_expires_at']
                    ] : ['connected' => false]
                ]
            ]);
            
        } catch (Exception $e) {
            error_log("MeetingController::calendarStatus error: " . $e->getMessage());
            $this->jsonResponse(['error' => 'Failed to get calendar status'], 500);
        }
    }
    
    /**
     * Format meeting for API response
     */
    private function formatMeeting(array $meeting): array {
        return [
            'id' => (int) $meeting['id'],
            'contact_id' => (int) $meeting['contact_id'],
            'contact_name' => $meeting['contact_name'] ?? null,
            'contact_email' => $meeting['contact_email'] ?? null,
            'title' => $meeting['title'],
            'description' => $meeting['description'],
            'scheduled_at' => $meeting['scheduled_at'],
            'duration_minutes' => (int) $meeting['duration_minutes'],
            'location' => $meeting['location'],
            'meeting_link' => $meeting['meeting_link'],
            'status' => $meeting['status'],
            'calendar_event_id' => $meeting['calendar_event_id'],
            'calendar_provider' => $meeting['calendar_provider'],
            'created_at' => $meeting['created_at'],
            'updated_at' => $meeting['updated_at']
        ];
    }
    
    /**
     * Send JSON response
     */
    private function jsonResponse(array $data, int $statusCode = 200): void {
        http_response_code($statusCode);
        header('Content-Type: application/json');
        echo json_encode($data);
    }
}
