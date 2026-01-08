<?php
/**
 * VideoProvidersController - API endpoints for video conferencing
 */

require_once __DIR__ . '/../Database.php';
require_once __DIR__ . '/../Response.php';
require_once __DIR__ . '/../Auth.php';
require_once __DIR__ . '/../services/VideoProviderService.php';

class VideoProvidersController {
    
    /**
     * Get list of connected video providers
     */
    public static function getConnections(): void {
        $userId = Auth::userIdOrFail();
        $pdo = Database::conn();
        
        $stmt = $pdo->prepare("
            SELECT id, provider, provider_email, is_active, created_at, updated_at
            FROM video_provider_connections
            WHERE user_id = ?
            ORDER BY created_at DESC
        ");
        $stmt->execute([$userId]);
        $connections = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        Response::json(['connections' => $connections]);
    }
    
    /**
     * Get OAuth URL for connecting a provider
     */
    public static function getAuthUrl(): void {
        $userId = Auth::userIdOrFail();
        $body = get_json_body();
        
        if (empty($body['provider'])) {
            Response::validationError('Provider is required');
            return;
        }
        
        $provider = $body['provider'];
        $validProviders = ['zoom', 'google_meet', 'microsoft_teams'];
        
        if (!in_array($provider, $validProviders)) {
            Response::validationError('Invalid provider');
            return;
        }
        
        try {
            $service = new VideoProviderService();
            $ctx = $GLOBALS['tenantContext'] ?? null;
            $workspaceId = $ctx && isset($ctx->workspaceId) ? $ctx->workspaceId : null;
            
            $authUrl = $service->getAuthUrl($provider, $userId, $workspaceId);
            
            Response::json([
                'auth_url' => $authUrl,
                'provider' => $provider
            ]);
        } catch (Exception $e) {
            Response::error($e->getMessage(), 500);
        }
    }
    
    /**
     * Handle OAuth callback
     */
    public static function handleCallback(string $provider): void {
        if (empty($_GET['code']) || empty($_GET['state'])) {
            Response::validationError('Missing code or state parameter');
            return;
        }
        
        try {
            $service = new VideoProviderService();
            $result = $service->handleCallback($provider, $_GET['code'], $_GET['state']);
            
            // Redirect to success page
            $redirectUrl = '/scheduling/calendar-sync?video_connected=' . $provider;
            header("Location: {$redirectUrl}");
            exit;
        } catch (Exception $e) {
            error_log("Video provider callback error: " . $e->getMessage());
            $redirectUrl = '/scheduling/calendar-sync?error=' . urlencode($e->getMessage());
            header("Location: {$redirectUrl}");
            exit;
        }
    }
    
    /**
     * Disconnect a video provider
     */
    public static function disconnect(string $id): void {
        $userId = Auth::userIdOrFail();
        $pdo = Database::conn();
        
        $stmt = $pdo->prepare("
            UPDATE video_provider_connections
            SET is_active = 0
            WHERE id = ? AND user_id = ?
        ");
        $stmt->execute([$id, $userId]);
        
        if ($stmt->rowCount() === 0) {
            Response::notFound('Connection not found');
            return;
        }
        
        Response::json(['success' => true, 'message' => 'Provider disconnected']);
    }
    
    /**
     * Create video meeting for an appointment
     */
    public static function createMeeting(): void {
        $userId = Auth::userIdOrFail();
        $body = get_json_body();
        
        if (empty($body['appointment_id']) || empty($body['provider'])) {
            Response::validationError('appointment_id and provider are required');
            return;
        }
        
        $pdo = Database::conn();
        
        // Verify appointment belongs to user
        $stmt = $pdo->prepare("SELECT id FROM appointments WHERE id = ? AND user_id = ?");
        $stmt->execute([$body['appointment_id'], $userId]);
        if (!$stmt->fetch()) {
            Response::notFound('Appointment not found');
            return;
        }
        
        try {
            $service = new VideoProviderService();
            $meeting = $service->createMeeting(
                $body['appointment_id'],
                $body['provider'],
                $body['meeting_data'] ?? []
            );
            
            Response::json([
                'success' => true,
                'meeting' => $meeting
            ]);
        } catch (Exception $e) {
            Response::error($e->getMessage(), 500);
        }
    }
    
    /**
     * Delete video meeting for an appointment
     */
    public static function deleteMeeting(string $appointmentId): void {
        $userId = Auth::userIdOrFail();
        $pdo = Database::conn();
        
        // Verify appointment belongs to user
        $stmt = $pdo->prepare("SELECT id FROM appointments WHERE id = ? AND user_id = ?");
        $stmt->execute([$appointmentId, $userId]);
        if (!$stmt->fetch()) {
            Response::notFound('Appointment not found');
            return;
        }
        
        try {
            $service = new VideoProviderService();
            $success = $service->deleteMeeting($appointmentId);
            
            Response::json([
                'success' => $success,
                'message' => $success ? 'Meeting deleted' : 'No meeting to delete'
            ]);
        } catch (Exception $e) {
            Response::error($e->getMessage(), 500);
        }
    }
    
    /**
     * Get video meeting details for an appointment
     */
    public static function getMeetingDetails(string $appointmentId): void {
        $userId = Auth::userIdOrFail();
        $pdo = Database::conn();
        
        $stmt = $pdo->prepare("
            SELECT video_provider, video_meeting_url, video_meeting_id, 
                   video_meeting_password, video_provider_data
            FROM appointments
            WHERE id = ? AND user_id = ?
        ");
        $stmt->execute([$appointmentId, $userId]);
        $details = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$details) {
            Response::notFound('Appointment not found');
            return;
        }
        
        if ($details['video_provider_data']) {
            $details['video_provider_data'] = json_decode($details['video_provider_data'], true);
        }
        
        Response::json($details);
    }
}
