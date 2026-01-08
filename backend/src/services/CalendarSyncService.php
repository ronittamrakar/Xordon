<?php
/**
 * Calendar Sync Service
 * Handles Google Calendar and Outlook Calendar two-way synchronization
 */

require_once __DIR__ . '/../Database.php';
require_once __DIR__ . '/../Logger.php';

class CalendarSyncService {
    
    /**
     * Initialize Google Calendar OAuth flow
     */
    public static function getGoogleAuthUrl(int $workspaceId, int $calendarId): string {
        $clientId = getenv('GOOGLE_CLIENT_ID');
        $redirectUri = getenv('APP_URL') . '/api/calendar/google/callback';
        
        if (!$clientId) {
            throw new Exception('Google Calendar integration not configured');
        }
        
        $state = base64_encode(json_encode([
            'workspace_id' => $workspaceId,
            'calendar_id' => $calendarId,
            'timestamp' => time()
        ]));
        
        $params = http_build_query([
            'client_id' => $clientId,
            'redirect_uri' => $redirectUri,
            'response_type' => 'code',
            'scope' => 'https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/calendar.events',
            'access_type' => 'offline',
            'prompt' => 'consent',
            'state' => $state
        ]);
        
        return 'https://accounts.google.com/o/oauth2/v2/auth?' . $params;
    }
    
    /**
     * Handle Google OAuth callback and store tokens
     */
    public static function handleGoogleCallback(string $code, string $state): array {
        $stateData = json_decode(base64_decode($state), true);
        $workspaceId = $stateData['workspace_id'];
        $calendarId = $stateData['calendar_id'];
        
        $clientId = getenv('GOOGLE_CLIENT_ID');
        $clientSecret = getenv('GOOGLE_CLIENT_SECRET');
        $redirectUri = getenv('APP_URL') . '/api/calendar/google/callback';
        
        // Exchange code for tokens
        $ch = curl_init('https://oauth2.googleapis.com/token');
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query([
            'code' => $code,
            'client_id' => $clientId,
            'client_secret' => $clientSecret,
            'redirect_uri' => $redirectUri,
            'grant_type' => 'authorization_code'
        ]));
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        
        if ($httpCode !== 200) {
            throw new Exception('Failed to exchange authorization code: ' . $response);
        }
        
        $tokens = json_decode($response, true);
        
        // Store tokens in database
        $db = Database::conn();
        $stmt = $db->prepare("
            INSERT INTO google_calendar_tokens 
            (workspace_id, calendar_id, access_token, refresh_token, expires_at, scope)
            VALUES (?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
                access_token = VALUES(access_token),
                refresh_token = COALESCE(VALUES(refresh_token), refresh_token),
                expires_at = VALUES(expires_at),
                scope = VALUES(scope),
                updated_at = CURRENT_TIMESTAMP
        ");
        
        $expiresAt = date('Y-m-d H:i:s', time() + $tokens['expires_in']);
        $stmt->execute([
            $workspaceId,
            $calendarId,
            $tokens['access_token'],
            $tokens['refresh_token'] ?? null,
            $expiresAt,
            $tokens['scope'] ?? ''
        ]);
        
        return ['success' => true, 'calendar_id' => $calendarId];
    }
    
    /**
     * Refresh Google access token
     */
    public static function refreshGoogleToken(int $calendarId): ?string {
        $db = Database::conn();
        $stmt = $db->prepare("SELECT * FROM google_calendar_tokens WHERE calendar_id = ?");
        $stmt->execute([$calendarId]);
        $token = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$token || !$token['refresh_token']) {
            return null;
        }
        
        $clientId = getenv('GOOGLE_CLIENT_ID');
        $clientSecret = getenv('GOOGLE_CLIENT_SECRET');
        
        $ch = curl_init('https://oauth2.googleapis.com/token');
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query([
            'client_id' => $clientId,
            'client_secret' => $clientSecret,
            'refresh_token' => $token['refresh_token'],
            'grant_type' => 'refresh_token'
        ]));
        
        $response = curl_exec($ch);
        curl_close($ch);
        
        $newTokens = json_decode($response, true);
        
        if (!isset($newTokens['access_token'])) {
            return null;
        }
        
        // Update access token
        $expiresAt = date('Y-m-d H:i:s', time() + $newTokens['expires_in']);
        $stmt = $db->prepare("
            UPDATE google_calendar_tokens 
            SET access_token = ?, expires_at = ?, updated_at = CURRENT_TIMESTAMP
            WHERE calendar_id = ?
        ");
        $stmt->execute([$newTokens['access_token'], $expiresAt, $calendarId]);
        
        return $newTokens['access_token'];
    }
    
    /**
     * Get valid access token (refresh if needed)
     */
    public static function getGoogleAccessToken(int $calendarId): ?string {
        $db = Database::conn();
        $stmt = $db->prepare("SELECT * FROM google_calendar_tokens WHERE calendar_id = ?");
        $stmt->execute([$calendarId]);
        $token = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$token) {
            return null;
        }
        
        // Check if token is expired or about to expire (5 min buffer)
        if (strtotime($token['expires_at']) < time() + 300) {
            return self::refreshGoogleToken($calendarId);
        }
        
        return $token['access_token'];
    }
    
    /**
     * Sync events from Google Calendar
     */
    public static function syncFromGoogle(int $calendarId): array {
        $accessToken = self::getGoogleAccessToken($calendarId);
        
        if (!$accessToken) {
            return ['success' => false, 'error' => 'No valid access token'];
        }
        
        $db = Database::conn();
        
        // Get calendar details
        $stmt = $db->prepare("SELECT * FROM calendars WHERE id = ?");
        $stmt->execute([$calendarId]);
        $calendar = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$calendar) {
            return ['success' => false, 'error' => 'Calendar not found'];
        }
        
        // Fetch events from Google Calendar
        $timeMin = date('c', strtotime('-30 days'));
        $timeMax = date('c', strtotime('+90 days'));
        
        $url = 'https://www.googleapis.com/calendar/v3/calendars/primary/events?' . http_build_query([
            'timeMin' => $timeMin,
            'timeMax' => $timeMax,
            'singleEvents' => 'true',
            'orderBy' => 'startTime'
        ]);
        
        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Authorization: Bearer ' . $accessToken
        ]);
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        
        if ($httpCode !== 200) {
            self::logSync($calendarId, 'google', 'import', 'failed', 'HTTP ' . $httpCode . ': ' . $response);
            return ['success' => false, 'error' => 'Failed to fetch events'];
        }
        
        $data = json_decode($response, true);
        $events = $data['items'] ?? [];
        
        $imported = 0;
        $skipped = 0;
        
        foreach ($events as $event) {
            // Skip all-day events or events without start time
            if (!isset($event['start']['dateTime'])) {
                $skipped++;
                continue;
            }
            
            $startTime = date('Y-m-d H:i:s', strtotime($event['start']['dateTime']));
            $endTime = date('Y-m-d H:i:s', strtotime($event['end']['dateTime']));
            
            // Create calendar block for this busy time
            $stmt = $db->prepare("
                INSERT INTO calendar_blocks 
                (calendar_id, start_time, end_time, reason, external_id, external_source)
                VALUES (?, ?, ?, ?, ?, 'google')
                ON DUPLICATE KEY UPDATE
                    start_time = VALUES(start_time),
                    end_time = VALUES(end_time),
                    reason = VALUES(reason)
            ");
            
            $stmt->execute([
                $calendarId,
                $startTime,
                $endTime,
                $event['summary'] ?? 'Busy',
                $event['id']
            ]);
            
            $imported++;
        }
        
        self::logSync($calendarId, 'google', 'import', 'success', "Imported: $imported, Skipped: $skipped");
        
        return [
            'success' => true,
            'imported' => $imported,
            'skipped' => $skipped
        ];
    }
    
    /**
     * Push appointment to Google Calendar
     */
    public static function pushToGoogle(int $calendarId, array $appointment): array {
        $accessToken = self::getGoogleAccessToken($calendarId);
        
        if (!$accessToken) {
            return ['success' => false, 'error' => 'No valid access token'];
        }
        
        $event = [
            'summary' => $appointment['title'] ?? 'Appointment',
            'description' => $appointment['notes'] ?? '',
            'start' => [
                'dateTime' => date('c', strtotime($appointment['start_time'])),
                'timeZone' => $appointment['timezone'] ?? 'UTC'
            ],
            'end' => [
                'dateTime' => date('c', strtotime($appointment['end_time'])),
                'timeZone' => $appointment['timezone'] ?? 'UTC'
            ]
        ];
        
        $ch = curl_init('https://www.googleapis.com/calendar/v3/calendars/primary/events');
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($event));
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Authorization: Bearer ' . $accessToken,
            'Content-Type: application/json'
        ]);
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        
        if ($httpCode !== 200) {
            self::logSync($calendarId, 'google', 'export', 'failed', 'HTTP ' . $httpCode);
            return ['success' => false, 'error' => 'Failed to create event'];
        }
        
        $eventData = json_decode($response, true);
        self::logSync($calendarId, 'google', 'export', 'success', 'Event ID: ' . $eventData['id']);
        
        return ['success' => true, 'event_id' => $eventData['id']];
    }
    
    /**
     * Initialize Outlook Calendar OAuth flow
     */
    public static function getOutlookAuthUrl(int $workspaceId, int $calendarId): string {
        $clientId = getenv('OUTLOOK_CLIENT_ID');
        $redirectUri = getenv('APP_URL') . '/api/calendar/outlook/callback';
        
        if (!$clientId) {
            throw new Exception('Outlook Calendar integration not configured');
        }
        
        $state = base64_encode(json_encode([
            'workspace_id' => $workspaceId,
            'calendar_id' => $calendarId,
            'timestamp' => time()
        ]));
        
        $params = http_build_query([
            'client_id' => $clientId,
            'response_type' => 'code',
            'redirect_uri' => $redirectUri,
            'response_mode' => 'query',
            'scope' => 'offline_access Calendars.ReadWrite',
            'state' => $state
        ]);
        
        return 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize?' . $params;
    }
    
    /**
     * Log sync activity
     */
    private static function logSync(int $calendarId, string $provider, string $direction, string $status, ?string $details = null): void {
        try {
            $db = Database::conn();
            $stmt = $db->prepare("
                INSERT INTO calendar_sync_logs 
                (calendar_id, provider, direction, status, details)
                VALUES (?, ?, ?, ?, ?)
            ");
            $stmt->execute([$calendarId, $provider, $direction, $status, $details]);
        } catch (Exception $e) {
            Logger::error('Failed to log calendar sync: ' . $e->getMessage());
        }
    }
    
    /**
     * Disconnect calendar sync
     */
    public static function disconnect(int $calendarId, string $provider): bool {
        $db = Database::conn();
        
        if ($provider === 'google') {
            $stmt = $db->prepare("DELETE FROM google_calendar_tokens WHERE calendar_id = ?");
        } else {
            $stmt = $db->prepare("DELETE FROM outlook_calendar_tokens WHERE calendar_id = ?");
        }
        
        $stmt->execute([$calendarId]);
        
        // Remove external blocks
        $stmt = $db->prepare("DELETE FROM calendar_blocks WHERE calendar_id = ? AND external_source = ?");
        $stmt->execute([$calendarId, $provider]);
        
        self::logSync($calendarId, $provider, 'disconnect', 'success', 'Sync disconnected');
        
        return true;
    }
}
