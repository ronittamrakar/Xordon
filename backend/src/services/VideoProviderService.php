<?php
/**
 * VideoProviderService - Handles video conferencing integrations
 * Supports: Zoom, Google Meet, Microsoft Teams
 */

require_once __DIR__ . '/../Database.php';
require_once __DIR__ . '/OAuthService.php';

class VideoProviderService {
    private $db;
    private $oauthService;
    
    // OAuth Configuration
    private const ZOOM_CLIENT_ID = ''; // Set in .env
    private const ZOOM_CLIENT_SECRET = ''; // Set in .env
    private const ZOOM_REDIRECT_URI = '/api/video/zoom/callback';
    
    private const GOOGLE_CLIENT_ID = ''; // Set in .env
    private const GOOGLE_CLIENT_SECRET = ''; // Set in .env
    private const GOOGLE_REDIRECT_URI = '/api/video/google/callback';
    
    private const TEAMS_CLIENT_ID = ''; // Set in .env
    private const TEAMS_CLIENT_SECRET = ''; // Set in .env
    private const TEAMS_REDIRECT_URI = '/api/video/teams/callback';
    
    public function __construct() {
        $this->db = Database::conn();
        $this->oauthService = new OAuthService();
    }
    
    /**
     * Get OAuth authorization URL for a provider
     */
    public function getAuthUrl(string $provider, int $userId, ?int $workspaceId = null): string {
        $state = base64_encode(json_encode([
            'user_id' => $userId,
            'workspace_id' => $workspaceId,
            'provider' => $provider,
            'timestamp' => time()
        ]));
        
        switch ($provider) {
            case 'zoom':
                return $this->getZoomAuthUrl($state);
            case 'google_meet':
                return $this->getGoogleMeetAuthUrl($state);
            case 'microsoft_teams':
                return $this->getTeamsAuthUrl($state);
            default:
                throw new InvalidArgumentException("Unsupported provider: {$provider}");
        }
    }
    
    /**
     * Handle OAuth callback and store credentials
     */
    public function handleCallback(string $provider, string $code, string $state): array {
        $stateData = json_decode(base64_decode($state), true);
        
        if (!$stateData || !isset($stateData['user_id'])) {
            throw new RuntimeException('Invalid state parameter');
        }
        
        $userId = $stateData['user_id'];
        $workspaceId = $stateData['workspace_id'] ?? null;
        
        switch ($provider) {
            case 'zoom':
                $tokens = $this->exchangeZoomCode($code);
                break;
            case 'google_meet':
                $tokens = $this->exchangeGoogleCode($code);
                break;
            case 'microsoft_teams':
                $tokens = $this->exchangeTeamsCode($code);
                break;
            default:
                throw new InvalidArgumentException("Unsupported provider: {$provider}");
        }
        
        // Store connection
        return $this->storeConnection($userId, $workspaceId, $provider, $tokens);
    }
    
    /**
     * Create a video meeting for an appointment
     */
    public function createMeeting(int $appointmentId, string $provider, array $meetingData): array {
        // Get appointment details
        $stmt = $this->db->prepare("
            SELECT a.*, bt.name as booking_type_name, bt.duration_minutes,
                   c.name as contact_name, c.email as contact_email
            FROM appointments a
            LEFT JOIN booking_types bt ON bt.id = a.booking_type_id
            LEFT JOIN contacts c ON c.id = a.contact_id
            WHERE a.id = ?
        ");
        $stmt->execute([$appointmentId]);
        $appointment = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$appointment) {
            throw new RuntimeException('Appointment not found');
        }
        
        // Get provider connection
        $connection = $this->getConnection($appointment['user_id'], $provider);
        if (!$connection) {
            throw new RuntimeException("No active {$provider} connection found");
        }
        
        // Refresh token if needed
        if ($this->isTokenExpired($connection)) {
            $connection = $this->refreshToken($connection);
        }
        
        // Create meeting based on provider
        switch ($provider) {
            case 'zoom':
                $meeting = $this->createZoomMeeting($connection, $appointment, $meetingData);
                break;
            case 'google_meet':
                $meeting = $this->createGoogleMeet($connection, $appointment, $meetingData);
                break;
            case 'microsoft_teams':
                $meeting = $this->createTeamsMeeting($connection, $appointment, $meetingData);
                break;
            default:
                throw new InvalidArgumentException("Unsupported provider: {$provider}");
        }
        
        // Update appointment with video details
        $this->updateAppointmentVideo($appointmentId, $provider, $meeting);
        
        // Log the action
        $this->logMeetingAction($appointmentId, $provider, $meeting['id'], 'created', $meeting);
        
        return $meeting;
    }
    
    /**
     * Delete a video meeting
     */
    public function deleteMeeting(int $appointmentId): bool {
        $stmt = $this->db->prepare("
            SELECT video_provider, video_meeting_id, user_id 
            FROM appointments 
            WHERE id = ?
        ");
        $stmt->execute([$appointmentId]);
        $appointment = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$appointment || $appointment['video_provider'] === 'none') {
            return false;
        }
        
        $connection = $this->getConnection($appointment['user_id'], $appointment['video_provider']);
        if (!$connection) {
            return false;
        }
        
        // Refresh token if needed
        if ($this->isTokenExpired($connection)) {
            $connection = $this->refreshToken($connection);
        }
        
        $success = false;
        switch ($appointment['video_provider']) {
            case 'zoom':
                $success = $this->deleteZoomMeeting($connection, $appointment['video_meeting_id']);
                break;
            case 'google_meet':
                $success = $this->deleteGoogleMeet($connection, $appointment['video_meeting_id']);
                break;
            case 'microsoft_teams':
                $success = $this->deleteTeamsMeeting($connection, $appointment['video_meeting_id']);
                break;
        }
        
        if ($success) {
            // Clear video details from appointment
            $stmt = $this->db->prepare("
                UPDATE appointments 
                SET video_provider = 'none', 
                    video_meeting_url = NULL, 
                    video_meeting_id = NULL,
                    video_meeting_password = NULL,
                    video_provider_data = NULL
                WHERE id = ?
            ");
            $stmt->execute([$appointmentId]);
            
            $this->logMeetingAction($appointmentId, $appointment['video_provider'], $appointment['video_meeting_id'], 'deleted', null);
        }
        
        return $success;
    }
    
    // ==================== ZOOM INTEGRATION ====================
    
    private function getZoomAuthUrl(string $state): string {
        $params = http_build_query([
            'response_type' => 'code',
            'client_id' => self::ZOOM_CLIENT_ID,
            'redirect_uri' => $this->getFullRedirectUri(self::ZOOM_REDIRECT_URI),
            'state' => $state
        ]);
        
        return "https://zoom.us/oauth/authorize?{$params}";
    }
    
    private function exchangeZoomCode(string $code): array {
        $response = $this->httpPost('https://zoom.us/oauth/token', [
            'grant_type' => 'authorization_code',
            'code' => $code,
            'redirect_uri' => $this->getFullRedirectUri(self::ZOOM_REDIRECT_URI)
        ], [
            'Authorization: Basic ' . base64_encode(self::ZOOM_CLIENT_ID . ':' . self::ZOOM_CLIENT_SECRET)
        ]);
        
        return json_decode($response, true);
    }
    
    private function createZoomMeeting(array $connection, array $appointment, array $data): array {
        $meetingData = [
            'topic' => $data['topic'] ?? $appointment['booking_type_name'] ?? 'Meeting',
            'type' => 2, // Scheduled meeting
            'start_time' => date('Y-m-d\TH:i:s', strtotime($appointment['scheduled_at'])),
            'duration' => $appointment['duration_minutes'] ?? 30,
            'timezone' => 'UTC',
            'agenda' => $data['agenda'] ?? '',
            'settings' => [
                'host_video' => true,
                'participant_video' => true,
                'join_before_host' => false,
                'mute_upon_entry' => true,
                'waiting_room' => true,
                'auto_recording' => 'none'
            ]
        ];
        
        $response = $this->httpPost(
            'https://api.zoom.us/v2/users/me/meetings',
            $meetingData,
            ['Authorization: Bearer ' . $connection['access_token']],
            true
        );
        
        $meeting = json_decode($response, true);
        
        return [
            'id' => $meeting['id'],
            'join_url' => $meeting['join_url'],
            'start_url' => $meeting['start_url'],
            'password' => $meeting['password'] ?? null,
            'provider_data' => $meeting
        ];
    }
    
    private function deleteZoomMeeting(array $connection, string $meetingId): bool {
        try {
            $this->httpDelete(
                "https://api.zoom.us/v2/meetings/{$meetingId}",
                ['Authorization: Bearer ' . $connection['access_token']]
            );
            return true;
        } catch (Exception $e) {
            error_log("Failed to delete Zoom meeting: " . $e->getMessage());
            return false;
        }
    }
    
    // ==================== GOOGLE MEET INTEGRATION ====================
    
    private function getGoogleMeetAuthUrl(string $state): string {
        $params = http_build_query([
            'client_id' => self::GOOGLE_CLIENT_ID,
            'redirect_uri' => $this->getFullRedirectUri(self::GOOGLE_REDIRECT_URI),
            'response_type' => 'code',
            'scope' => 'https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/calendar.events',
            'access_type' => 'offline',
            'prompt' => 'consent',
            'state' => $state
        ]);
        
        return "https://accounts.google.com/o/oauth2/v2/auth?{$params}";
    }
    
    private function exchangeGoogleCode(string $code): array {
        $response = $this->httpPost('https://oauth2.googleapis.com/token', [
            'code' => $code,
            'client_id' => self::GOOGLE_CLIENT_ID,
            'client_secret' => self::GOOGLE_CLIENT_SECRET,
            'redirect_uri' => $this->getFullRedirectUri(self::GOOGLE_REDIRECT_URI),
            'grant_type' => 'authorization_code'
        ]);
        
        return json_decode($response, true);
    }
    
    private function createGoogleMeet(array $connection, array $appointment, array $data): array {
        $eventData = [
            'summary' => $data['topic'] ?? $appointment['booking_type_name'] ?? 'Meeting',
            'description' => $data['agenda'] ?? '',
            'start' => [
                'dateTime' => date('c', strtotime($appointment['scheduled_at'])),
                'timeZone' => 'UTC'
            ],
            'end' => [
                'dateTime' => date('c', strtotime($appointment['scheduled_at']) + ($appointment['duration_minutes'] * 60)),
                'timeZone' => 'UTC'
            ],
            'conferenceData' => [
                'createRequest' => [
                    'requestId' => uniqid('meet_'),
                    'conferenceSolutionKey' => ['type' => 'hangoutsMeet']
                ]
            ],
            'attendees' => []
        ];
        
        if (!empty($appointment['contact_email'])) {
            $eventData['attendees'][] = ['email' => $appointment['contact_email']];
        }
        
        $response = $this->httpPost(
            'https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1',
            $eventData,
            ['Authorization: Bearer ' . $connection['access_token']],
            true
        );
        
        $event = json_decode($response, true);
        $meetData = $event['conferenceData']['entryPoints'][0] ?? null;
        
        return [
            'id' => $event['id'],
            'join_url' => $meetData['uri'] ?? null,
            'password' => null,
            'provider_data' => $event
        ];
    }
    
    private function deleteGoogleMeet(array $connection, string $eventId): bool {
        try {
            $this->httpDelete(
                "https://www.googleapis.com/calendar/v3/calendars/primary/events/{$eventId}",
                ['Authorization: Bearer ' . $connection['access_token']]
            );
            return true;
        } catch (Exception $e) {
            error_log("Failed to delete Google Meet: " . $e->getMessage());
            return false;
        }
    }
    
    // ==================== MICROSOFT TEAMS INTEGRATION ====================
    
    private function getTeamsAuthUrl(string $state): string {
        $params = http_build_query([
            'client_id' => self::TEAMS_CLIENT_ID,
            'response_type' => 'code',
            'redirect_uri' => $this->getFullRedirectUri(self::TEAMS_REDIRECT_URI),
            'response_mode' => 'query',
            'scope' => 'OnlineMeetings.ReadWrite Calendars.ReadWrite offline_access',
            'state' => $state
        ]);
        
        return "https://login.microsoftonline.com/common/oauth2/v2.0/authorize?{$params}";
    }
    
    private function exchangeTeamsCode(string $code): array {
        $response = $this->httpPost('https://login.microsoftonline.com/common/oauth2/v2.0/token', [
            'client_id' => self::TEAMS_CLIENT_ID,
            'client_secret' => self::TEAMS_CLIENT_SECRET,
            'code' => $code,
            'redirect_uri' => $this->getFullRedirectUri(self::TEAMS_REDIRECT_URI),
            'grant_type' => 'authorization_code'
        ]);
        
        return json_decode($response, true);
    }
    
    private function createTeamsMeeting(array $connection, array $appointment, array $data): array {
        $meetingData = [
            'startDateTime' => date('c', strtotime($appointment['scheduled_at'])),
            'endDateTime' => date('c', strtotime($appointment['scheduled_at']) + ($appointment['duration_minutes'] * 60)),
            'subject' => $data['topic'] ?? $appointment['booking_type_name'] ?? 'Meeting'
        ];
        
        $response = $this->httpPost(
            'https://graph.microsoft.com/v1.0/me/onlineMeetings',
            $meetingData,
            ['Authorization: Bearer ' . $connection['access_token']],
            true
        );
        
        $meeting = json_decode($response, true);
        
        return [
            'id' => $meeting['id'],
            'join_url' => $meeting['joinWebUrl'],
            'password' => null,
            'provider_data' => $meeting
        ];
    }
    
    private function deleteTeamsMeeting(array $connection, string $meetingId): bool {
        try {
            $this->httpDelete(
                "https://graph.microsoft.com/v1.0/me/onlineMeetings/{$meetingId}",
                ['Authorization: Bearer ' . $connection['access_token']]
            );
            return true;
        } catch (Exception $e) {
            error_log("Failed to delete Teams meeting: " . $e->getMessage());
            return false;
        }
    }
    
    // ==================== HELPER METHODS ====================
    
    private function storeConnection(int $userId, ?int $workspaceId, string $provider, array $tokens): array {
        $expiresAt = isset($tokens['expires_in']) 
            ? date('Y-m-d H:i:s', time() + $tokens['expires_in']) 
            : null;
        
        $stmt = $this->db->prepare("
            INSERT INTO video_provider_connections 
            (user_id, workspace_id, provider, access_token, refresh_token, token_expires_at, is_active)
            VALUES (?, ?, ?, ?, ?, ?, 1)
            ON DUPLICATE KEY UPDATE
                access_token = VALUES(access_token),
                refresh_token = VALUES(refresh_token),
                token_expires_at = VALUES(token_expires_at),
                is_active = 1,
                updated_at = CURRENT_TIMESTAMP
        ");
        
        $stmt->execute([
            $userId,
            $workspaceId,
            $provider,
            $tokens['access_token'],
            $tokens['refresh_token'] ?? null,
            $expiresAt
        ]);
        
        return [
            'user_id' => $userId,
            'provider' => $provider,
            'connected' => true
        ];
    }
    
    private function getConnection(int $userId, string $provider): ?array {
        $stmt = $this->db->prepare("
            SELECT * FROM video_provider_connections
            WHERE user_id = ? AND provider = ? AND is_active = 1
        ");
        $stmt->execute([$userId, $provider]);
        return $stmt->fetch(PDO::FETCH_ASSOC) ?: null;
    }
    
    private function isTokenExpired(array $connection): bool {
        if (!$connection['token_expires_at']) {
            return false;
        }
        return strtotime($connection['token_expires_at']) <= time() + 300; // 5 min buffer
    }
    
    private function refreshToken(array $connection): array {
        // Token refresh logic would go here
        // For now, just return the connection as-is
        return $connection;
    }
    
    private function updateAppointmentVideo(int $appointmentId, string $provider, array $meeting): void {
        $stmt = $this->db->prepare("
            UPDATE appointments
            SET video_provider = ?,
                video_meeting_url = ?,
                video_meeting_id = ?,
                video_meeting_password = ?,
                video_provider_data = ?
            WHERE id = ?
        ");
        
        $stmt->execute([
            $provider,
            $meeting['join_url'],
            $meeting['id'],
            $meeting['password'],
            json_encode($meeting['provider_data']),
            $appointmentId
        ]);
    }
    
    private function logMeetingAction(int $appointmentId, string $provider, string $meetingId, string $action, ?array $data): void {
        $stmt = $this->db->prepare("
            INSERT INTO video_meetings_log (appointment_id, provider, meeting_id, action, response_data)
            VALUES (?, ?, ?, ?, ?)
        ");
        
        $stmt->execute([
            $appointmentId,
            $provider,
            $meetingId,
            $action,
            $data ? json_encode($data) : null
        ]);
    }
    
    private function getFullRedirectUri(string $path): string {
        $protocol = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? 'https' : 'http';
        $host = $_SERVER['HTTP_HOST'] ?? 'localhost';
        return "{$protocol}://{$host}{$path}";
    }
    
    private function httpPost(string $url, array $data, array $headers = [], bool $json = false): string {
        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        
        if ($json) {
            $headers[] = 'Content-Type: application/json';
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
        } else {
            curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($data));
        }
        
        if ($headers) {
            curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
        }
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        
        if ($httpCode >= 400) {
            throw new RuntimeException("HTTP request failed with code {$httpCode}: {$response}");
        }
        
        return $response;
    }
    
    private function httpDelete(string $url, array $headers = []): void {
        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'DELETE');
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        
        if ($headers) {
            curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
        }
        
        curl_exec($ch);
        curl_close($ch);
    }
}
