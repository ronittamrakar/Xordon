<?php
namespace Xordon\Services;

use PDO;
use Exception;
use Xordon\Database;
use Xordon\Logger;

class ReviewIntegrationService {
    
    /**
     * Get Google Business Profile OAuth URL
     */
    public static function getGoogleBusinessAuthUrl(int $workspaceId, int $platformConfigId): string {
        $clientId = getenv('GOOGLE_CLIENT_ID');
        $redirectUri = getenv('APP_URL') . '/api/reviews/google/callback';
        
        if (!$clientId) {
            throw new Exception('Google Business Profile integration not configured');
        }
        
        $state = base64_encode(json_encode([
            'workspace_id' => $workspaceId,
            'platform_config_id' => $platformConfigId,
            'timestamp' => time()
        ]));
        
        $params = http_build_query([
            'client_id' => $clientId,
            'redirect_uri' => $redirectUri,
            'response_type' => 'code',
            'scope' => 'https://www.googleapis.com/auth/business.manage',
            'access_type' => 'offline',
            'prompt' => 'consent',
            'state' => $state
        ]);
        
        return 'https://accounts.google.com/o/oauth2/v2/auth?' . $params;
    }
    
    /**
     * Handle Google Business Profile OAuth callback
     */
    public static function handleGoogleBusinessCallback(string $code, string $state): array {
        $stateData = json_decode(base64_decode($state), true);
        $workspaceId = $stateData['workspace_id'];
        $platformConfigId = $stateData['platform_config_id'];
        
        $clientId = getenv('GOOGLE_CLIENT_ID');
        $clientSecret = getenv('GOOGLE_CLIENT_SECRET');
        $redirectUri = getenv('APP_URL') . '/api/reviews/google/callback';
        
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
            throw new Exception('Failed to exchange authorization code');
        }
        
        $tokens = json_decode($response, true);
        
        // Get business locations
        $locations = self::fetchGoogleBusinessLocations($tokens['access_token']);
        
        // Store tokens in platform config
        $db = Database::conn();
        $stmt = $db->prepare("
            UPDATE review_platform_configs 
            SET 
                access_token = ?,
                refresh_token = ?,
                token_expires_at = ?,
                config = ?,
                is_active = 1,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        ");
        
        $expiresAt = date('Y-m-d H:i:s', time() + $tokens['expires_in']);
        $config = json_encode(['locations' => $locations]);
        
        $stmt->execute([
            $tokens['access_token'],
            $tokens['refresh_token'] ?? null,
            $expiresAt,
            $config,
            $platformConfigId
        ]);
        
        return ['success' => true, 'locations' => $locations];
    }
    
    /**
     * Fetch Google Business locations
     */
    private static function fetchGoogleBusinessLocations(string $accessToken): array {
        $ch = curl_init('https://mybusinessbusinessinformation.googleapis.com/v1/accounts');
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Authorization: Bearer ' . $accessToken
        ]);
        
        $response = curl_exec($ch);
        curl_close($ch);
        
        $data = json_decode($response, true);
        $accounts = $data['accounts'] ?? [];
        
        $locations = [];
        
        foreach ($accounts as $account) {
            $accountName = $account['name'];
            
            // Fetch locations for this account
            $ch = curl_init("https://mybusinessbusinessinformation.googleapis.com/v1/{$accountName}/locations");
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_HTTPHEADER, [
                'Authorization: Bearer ' . $accessToken
            ]);
            
            $response = curl_exec($ch);
            curl_close($ch);
            
            $locationData = json_decode($response, true);
            
            foreach ($locationData['locations'] ?? [] as $location) {
                $locations[] = [
                    'id' => $location['name'],
                    'title' => $location['title'] ?? 'Unknown',
                    'address' => $location['storefrontAddress'] ?? []
                ];
            }
        }
        
        return $locations;
    }
    
    /**
     * Sync reviews from Google Business Profile
     */
    public static function syncGoogleBusinessReviews(int $platformConfigId): array {
        $db = Database::conn();
        
        $stmt = $db->prepare("SELECT * FROM review_platform_configs WHERE id = ?");
        $stmt->execute([$platformConfigId]);
        $config = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$config) {
            return ['success' => false, 'error' => 'Platform config not found'];
        }
        
        $accessToken = self::refreshGoogleBusinessToken($platformConfigId);
        
        if (!$accessToken) {
            return ['success' => false, 'error' => 'Failed to get access token'];
        }
        
        $configData = json_decode($config['config'], true);
        $locations = $configData['locations'] ?? [];
        
        $imported = 0;
        
        foreach ($locations as $location) {
            $locationId = $location['id'];
            
            // Fetch reviews for this location
            $ch = curl_init("https://mybusiness.googleapis.com/v4/{$locationId}/reviews");
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_HTTPHEADER, [
                'Authorization: Bearer ' . $accessToken
            ]);
            
            $response = curl_exec($ch);
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            curl_close($ch);
            
            if ($httpCode !== 200) {
                continue;
            }
            
            $data = json_decode($response, true);
            $reviews = $data['reviews'] ?? [];
            
            foreach ($reviews as $review) {
                // Store review in database
                $stmt = $db->prepare("
                    INSERT INTO reviews 
                    (workspace_id, platform, external_id, reviewer_name, rating, review_text, review_date, review_url)
                    VALUES (?, 'google', ?, ?, ?, ?, ?, ?)
                    ON DUPLICATE KEY UPDATE
                        rating = VALUES(rating),
                        review_text = VALUES(review_text),
                        updated_at = CURRENT_TIMESTAMP
                ");
                
                $stmt->execute([
                    $config['workspace_id'],
                    $review['reviewId'] ?? $review['name'],
                    $review['reviewer']['displayName'] ?? 'Anonymous',
                    $review['starRating'] ?? 0,
                    $review['comment'] ?? '',
                    date('Y-m-d H:i:s', strtotime($review['createTime'])),
                    $review['reviewReply']['comment'] ?? null
                ]);
                
                $imported++;
                
                // Trigger workflow if rating is low
                if (($review['starRating'] ?? 0) <= 3) {
                    self::triggerLowRatingWorkflow($config['workspace_id'], $review);
                }
            }
        }
        
        return ['success' => true, 'imported' => $imported];
    }
    
    /**
     * Refresh Google Business access token
     */
    private static function refreshGoogleBusinessToken(int $platformConfigId): ?string {
        $db = Database::conn();
        
        $stmt = $db->prepare("SELECT * FROM review_platform_configs WHERE id = ?");
        $stmt->execute([$platformConfigId]);
        $config = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$config || !$config['refresh_token']) {
            return null;
        }
        
        // Check if token is still valid
        if (strtotime($config['token_expires_at']) > time() + 300) {
            return $config['access_token'];
        }
        
        $clientId = getenv('GOOGLE_CLIENT_ID');
        $clientSecret = getenv('GOOGLE_CLIENT_SECRET');
        
        $ch = curl_init('https://oauth2.googleapis.com/token');
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query([
            'client_id' => $clientId,
            'client_secret' => $clientSecret,
            'refresh_token' => $config['refresh_token'],
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
            UPDATE review_platform_configs 
            SET access_token = ?, token_expires_at = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        ");
        $stmt->execute([$newTokens['access_token'], $expiresAt, $platformConfigId]);
        
        return $newTokens['access_token'];
    }
    
    /**
     * Reply to Google Business review
     */
    public static function replyToGoogleReview(int $platformConfigId, string $reviewId, string $replyText): array {
        $accessToken = self::refreshGoogleBusinessToken($platformConfigId);
        
        if (!$accessToken) {
            return ['success' => false, 'error' => 'Failed to get access token'];
        }
        
        $ch = curl_init("https://mybusiness.googleapis.com/v4/{$reviewId}/reply");
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'PUT');
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
            'comment' => $replyText
        ]));
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Authorization: Bearer ' . $accessToken,
            'Content-Type: application/json'
        ]);
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        
        if ($httpCode !== 200) {
            return ['success' => false, 'error' => 'Failed to post reply'];
        }
        
        return ['success' => true];
    }
    
    /**
     * Get Facebook Page OAuth URL
     */
    public static function getFacebookAuthUrl(int $workspaceId, int $platformConfigId): string {
        $appId = getenv('FACEBOOK_APP_ID');
        $redirectUri = getenv('APP_URL') . '/api/reviews/facebook/callback';
        
        if (!$appId) {
            throw new Exception('Facebook integration not configured');
        }
        
        $state = base64_encode(json_encode([
            'workspace_id' => $workspaceId,
            'platform_config_id' => $platformConfigId,
            'timestamp' => time()
        ]));
        
        $params = http_build_query([
            'client_id' => $appId,
            'redirect_uri' => $redirectUri,
            'state' => $state,
            'scope' => 'pages_show_list,pages_read_engagement,pages_manage_metadata'
        ]);
        
        return 'https://www.facebook.com/v18.0/dialog/oauth?' . $params;
    }
    
    /**
     * Sync reviews from Facebook
     */
    public static function syncFacebookReviews(int $platformConfigId): array {
        $db = Database::conn();
        
        $stmt = $db->prepare("SELECT * FROM review_platform_configs WHERE id = ?");
        $stmt->execute([$platformConfigId]);
        $config = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$config || !$config['access_token']) {
            return ['success' => false, 'error' => 'Platform config not found or not connected'];
        }
        
        $configData = json_decode($config['config'], true);
        $pageId = $configData['page_id'] ?? null;
        
        if (!$pageId) {
            return ['success' => false, 'error' => 'Page ID not configured'];
        }
        
        // Fetch ratings/reviews from Facebook
        $url = "https://graph.facebook.com/v18.0/{$pageId}/ratings?access_token=" . urlencode($config['access_token']);
        
        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        
        if ($httpCode !== 200) {
            return ['success' => false, 'error' => 'Failed to fetch reviews'];
        }
        
        $data = json_decode($response, true);
        $ratings = $data['data'] ?? [];
        
        $imported = 0;
        
        foreach ($ratings as $rating) {
            $stmt = $db->prepare("
                INSERT INTO reviews 
                (workspace_id, platform, external_id, reviewer_name, rating, review_text, review_date)
                VALUES (?, 'facebook', ?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE
                    rating = VALUES(rating),
                    review_text = VALUES(review_text),
                    updated_at = CURRENT_TIMESTAMP
            ");
            
            $stmt->execute([
                $config['workspace_id'],
                $rating['id'],
                $rating['reviewer']['name'] ?? 'Anonymous',
                $rating['rating'] ?? 0,
                $rating['review_text'] ?? $rating['recommendation_type'] ?? '',
                date('Y-m-d H:i:s', strtotime($rating['created_time']))
            ]);
            
            $imported++;
            
            // Trigger workflow if rating is low
            if (($rating['rating'] ?? 0) <= 3) {
                self::triggerLowRatingWorkflow($config['workspace_id'], $rating);
            }
        }
        
        return ['success' => true, 'imported' => $imported];
    }
    
    /**
     * Reply to Facebook review
     */
    public static function replyToFacebookReview(int $platformConfigId, string $reviewId, string $replyText): array {
        $db = Database::conn();
        $stmt = $db->prepare("SELECT * FROM review_platform_configs WHERE id = ?");
        $stmt->execute([$platformConfigId]);
        $config = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$config || !$config['access_token']) {
            return ['success' => false, 'error' => 'Platform config not found or not connected'];
        }
        
        $url = "https://graph.facebook.com/v18.0/{$reviewId}/comments";
        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query([
            'message' => $replyText,
            'access_token' => $config['access_token']
        ]));
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        
        if ($httpCode !== 200) {
            $data = json_decode($response, true);
            return ['success' => false, 'error' => $data['error']['message'] ?? 'Failed to post reply to Facebook'];
        }
        
        return ['success' => true];
    }
    
    /**
     * Trigger workflow for low rating
     */
    private static function triggerLowRatingWorkflow(int $workspaceId, array $review): void {
        try {
            $db = Database::conn();
            
            // Find workflows with "review.low_rating" trigger
            $stmt = $db->prepare("
                SELECT * FROM workflows 
                WHERE workspace_id = ? 
                AND trigger_type = 'review.low_rating'
                AND is_active = 1
            ");
            $stmt->execute([$workspaceId]);
            $workflows = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            foreach ($workflows as $workflow) {
                // Create a task or notification for the low rating
                $stmt = $db->prepare("
                    INSERT INTO tasks 
                    (workspace_id, title, description, priority, status, due_date)
                    VALUES (?, ?, ?, 'high', 'pending', DATE_ADD(NOW(), INTERVAL 1 DAY))
                ");
                
                $title = "Low rating received: " . ($review['starRating'] ?? $review['rating'] ?? 0) . " stars";
                $description = "Review: " . ($review['comment'] ?? $review['review_text'] ?? 'No comment');
                
                $stmt->execute([$workspaceId, $title, $description]);
            }
        } catch (Exception $e) {
            Logger::error('Failed to trigger low rating workflow: ' . $e->getMessage());
        }
    }
    
    /**
     * Disconnect review platform
     */
    public static function disconnect(int $platformConfigId): bool {
        $db = Database::conn();
        
        $stmt = $db->prepare("
            UPDATE review_platform_configs 
            SET 
                access_token = NULL,
                refresh_token = NULL,
                is_active = 0,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        ");
        
        return $stmt->execute([$platformConfigId]);
    }
}
