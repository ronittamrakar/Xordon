<?php
/**
 * Review Requests Controller
 * Handles review request campaigns and tracking for Thryv/GHL reputation parity
 */

require_once __DIR__ . '/../Database.php';
require_once __DIR__ . '/../Response.php';
require_once __DIR__ . '/../Auth.php';
require_once __DIR__ . '/../services/JobQueueService.php';

class ReviewRequestsController {
    private static function getWorkspaceId(): int {
        $ctx = $GLOBALS['tenantContext'] ?? null;
        if ($ctx && isset($ctx->workspaceId)) {
            return (int)$ctx->workspaceId;
        }
        throw new Exception('Workspace context required');
    }

    /**
     * List review requests
     */
    public static function index() {
        try {
            $workspaceId = self::getWorkspaceId();
            $db = Database::conn();
            
            $status = $_GET['status'] ?? null;
            $limit = min((int)($_GET['limit'] ?? 50), 100);
            $offset = (int)($_GET['offset'] ?? 0);
            
            $sql = "
                SELECT rr.*, c.first_name, c.last_name, c.email as contact_email
                FROM review_requests rr
                LEFT JOIN contacts c ON rr.contact_id = c.id
                WHERE rr.workspace_id = ?
            ";
            $params = [$workspaceId];
            
            if ($status) {
                $sql .= " AND rr.status = ?";
                $params[] = $status;
            }
            
            $sql .= " ORDER BY rr.created_at DESC LIMIT ? OFFSET ?";
            $params[] = $limit;
            $params[] = $offset;
            
            $stmt = $db->prepare($sql);
            $stmt->execute($params);
            
            return Response::json(['data' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
        } catch (Exception $e) {
            return Response::error('Failed to fetch review requests: ' . $e->getMessage());
        }
    }

    /**
     * Get review request stats
     */
    public static function stats() {
        try {
            $workspaceId = self::getWorkspaceId();
            $db = Database::conn();
            
            $stmt = $db->prepare("
                SELECT 
                    COUNT(*) as total,
                    SUM(CASE WHEN status = 'sent' THEN 1 ELSE 0 END) as sent,
                    SUM(CASE WHEN status = 'clicked' THEN 1 ELSE 0 END) as clicked,
                    SUM(CASE WHEN status = 'reviewed' THEN 1 ELSE 0 END) as reviewed,
                    SUM(CASE WHEN status = 'declined' THEN 1 ELSE 0 END) as declined,
                    AVG(CASE WHEN review_rating IS NOT NULL THEN review_rating ELSE NULL END) as avg_rating
                FROM review_requests
                WHERE workspace_id = ?
            ");
            $stmt->execute([$workspaceId]);
            $stats = $stmt->fetch(PDO::FETCH_ASSOC);
            
            // Calculate rates
            $stats['click_rate'] = $stats['sent'] > 0 ? round(($stats['clicked'] / $stats['sent']) * 100, 1) : 0;
            $stats['review_rate'] = $stats['clicked'] > 0 ? round(($stats['reviewed'] / $stats['clicked']) * 100, 1) : 0;
            $stats['avg_rating'] = $stats['avg_rating'] ? round($stats['avg_rating'], 1) : null;
            
            return Response::json(['data' => $stats]);
        } catch (Exception $e) {
            return Response::error('Failed to fetch stats: ' . $e->getMessage());
        }
    }

    /**
     * Send a review request
     */
    public static function send() {
        try {
            $workspaceId = self::getWorkspaceId();
            $db = Database::conn();
            $data = json_decode(file_get_contents('php://input'), true);
            
            $contactId = $data['contact_id'] ?? null;
            $channel = $data['channel'] ?? 'email';
            $email = $data['email'] ?? null;
            $phone = $data['phone'] ?? null;
            
            if (!$contactId && !$email && !$phone) {
                return Response::error('contact_id, email, or phone is required', 400);
            }
            
            // Get contact info if contact_id provided
            if ($contactId) {
                $stmt = $db->prepare("SELECT email, phone FROM contacts WHERE id = ? AND workspace_id = ?");
                $stmt->execute([$contactId, $workspaceId]);
                $contact = $stmt->fetch(PDO::FETCH_ASSOC);
                if ($contact) {
                    $email = $email ?: $contact['email'];
                    $phone = $phone ?: $contact['phone'];
                }
            }
            
            // Validate channel requirements
            if ($channel === 'email' && !$email) {
                return Response::error('Email is required for email channel', 400);
            }
            if ($channel === 'sms' && !$phone) {
                return Response::error('Phone is required for SMS channel', 400);
            }
            
            // Generate token
            $token = bin2hex(random_bytes(32));
            
            // Get default review platform URL
            $stmt = $db->prepare("
                SELECT review_url FROM review_platform_configs 
                WHERE workspace_id = ? AND is_active = 1 
                ORDER BY priority DESC LIMIT 1
            ");
            $stmt->execute([$workspaceId]);
            $platform = $stmt->fetch(PDO::FETCH_ASSOC);
            
            $appUrl = getenv('APP_URL') ?: 'http://localhost:5173';
            $shortUrl = $appUrl . '/r/' . substr($token, 0, 12);
            
            // Create request
            $stmt = $db->prepare("
                INSERT INTO review_requests 
                (workspace_id, contact_id, appointment_id, job_id, invoice_id, channel, email, phone, 
                 request_token, short_url, status, expires_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', DATE_ADD(NOW(), INTERVAL 30 DAY))
            ");
            $stmt->execute([
                $workspaceId,
                $contactId,
                $data['appointment_id'] ?? null,
                $data['job_id'] ?? null,
                $data['invoice_id'] ?? null,
                $channel,
                $email,
                $phone,
                $token,
                $shortUrl
            ]);
            
            $requestId = $db->lastInsertId();
            
            // Queue the send job
            if ($channel === 'email' || $channel === 'both') {
                JobQueueService::schedule('review_request.send_email', [
                    'request_id' => $requestId,
                    'workspace_id' => $workspaceId,
                    'email' => $email,
                    'short_url' => $shortUrl,
                    'review_url' => $platform['review_url'] ?? null
                ], null, $workspaceId);
            }
            
            if ($channel === 'sms' || $channel === 'both') {
                JobQueueService::schedule('review_request.send_sms', [
                    'request_id' => $requestId,
                    'workspace_id' => $workspaceId,
                    'phone' => $phone,
                    'short_url' => $shortUrl
                ], null, $workspaceId);
            }
            
            return Response::json(['data' => ['id' => (int)$requestId, 'short_url' => $shortUrl]]);
        } catch (Exception $e) {
            return Response::error('Failed to send review request: ' . $e->getMessage());
        }
    }

    /**
     * Send bulk review requests
     */
    public static function sendBulk() {
        try {
            $workspaceId = self::getWorkspaceId();
            $db = Database::conn();
            $data = json_decode(file_get_contents('php://input'), true);
            
            $contactIds = $data['contact_ids'] ?? [];
            $channel = $data['channel'] ?? 'email';
            
            if (empty($contactIds)) {
                return Response::error('contact_ids is required', 400);
            }
            
            $sent = 0;
            $failed = 0;
            
            foreach ($contactIds as $contactId) {
                try {
                    // Get contact
                    $stmt = $db->prepare("SELECT email, phone FROM contacts WHERE id = ? AND workspace_id = ?");
                    $stmt->execute([$contactId, $workspaceId]);
                    $contact = $stmt->fetch(PDO::FETCH_ASSOC);
                    
                    if (!$contact) {
                        $failed++;
                        continue;
                    }
                    
                    $email = $contact['email'];
                    $phone = $contact['phone'];
                    
                    if (($channel === 'email' && !$email) || ($channel === 'sms' && !$phone)) {
                        $failed++;
                        continue;
                    }
                    
                    // Generate token
                    $token = bin2hex(random_bytes(32));
                    $appUrl = getenv('APP_URL') ?: 'http://localhost:5173';
                    $shortUrl = $appUrl . '/r/' . substr($token, 0, 12);
                    
                    // Create request
                    $stmt = $db->prepare("
                        INSERT INTO review_requests 
                        (workspace_id, contact_id, channel, email, phone, request_token, short_url, status, expires_at)
                        VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', DATE_ADD(NOW(), INTERVAL 30 DAY))
                    ");
                    $stmt->execute([$workspaceId, $contactId, $channel, $email, $phone, $token, $shortUrl]);
                    
                    $requestId = $db->lastInsertId();
                    
                    // Queue send
                    if ($channel === 'email') {
                        JobQueueService::schedule('review_request.send_email', [
                            'request_id' => $requestId,
                            'workspace_id' => $workspaceId,
                            'email' => $email,
                            'short_url' => $shortUrl
                        ], null, $workspaceId);
                    } else {
                        JobQueueService::schedule('review_request.send_sms', [
                            'request_id' => $requestId,
                            'workspace_id' => $workspaceId,
                            'phone' => $phone,
                            'short_url' => $shortUrl
                        ], null, $workspaceId);
                    }
                    
                    $sent++;
                } catch (Exception $e) {
                    $failed++;
                }
            }
            
            return Response::json(['data' => ['sent' => $sent, 'failed' => $failed]]);
        } catch (Exception $e) {
            return Response::error('Failed to send bulk requests: ' . $e->getMessage());
        }
    }

    /**
     * Track click on review request link
     */
    public static function trackClick($token) {
        try {
            $db = Database::conn();
            
            $stmt = $db->prepare("
                SELECT rr.*, rpc.review_url 
                FROM review_requests rr
                LEFT JOIN review_platform_configs rpc ON rr.workspace_id = rpc.workspace_id AND rpc.is_active = 1
                WHERE rr.request_token LIKE ? AND rr.expires_at > NOW()
                ORDER BY rpc.priority DESC
                LIMIT 1
            ");
            $stmt->execute([$token . '%']);
            $request = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$request) {
                return Response::error('Invalid or expired link', 404);
            }
            
            // Update click status
            if ($request['status'] === 'sent' || $request['status'] === 'pending') {
                $stmt = $db->prepare("UPDATE review_requests SET status = 'clicked', clicked_at = NOW() WHERE id = ?");
                $stmt->execute([$request['id']]);
            }
            
            // Return redirect URL
            $reviewUrl = $request['review_url'] ?: 'https://google.com/maps'; // Fallback
            
            return Response::json([
                'data' => [
                    'redirect_url' => $reviewUrl,
                    'workspace_id' => $request['workspace_id']
                ]
            ]);
        } catch (Exception $e) {
            return Response::error('Failed to track click: ' . $e->getMessage());
        }
    }

    /**
     * Record that a review was left
     */
    public static function recordReview() {
        try {
            $db = Database::conn();
            $data = json_decode(file_get_contents('php://input'), true);
            
            $token = $data['token'] ?? null;
            $rating = $data['rating'] ?? null;
            $platform = $data['platform'] ?? 'google';
            
            if (!$token) {
                return Response::error('Token is required', 400);
            }
            
            $stmt = $db->prepare("SELECT id FROM review_requests WHERE request_token LIKE ?");
            $stmt->execute([$token . '%']);
            $request = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$request) {
                return Response::error('Request not found', 404);
            }
            
            $stmt = $db->prepare("
                UPDATE review_requests 
                SET status = 'reviewed', reviewed_at = NOW(), review_rating = ?, review_platform = ?
                WHERE id = ?
            ");
            $stmt->execute([$rating, $platform, $request['id']]);
            
            return Response::json(['success' => true]);
        } catch (Exception $e) {
            return Response::error('Failed to record review: ' . $e->getMessage());
        }
    }

    // ==================== PLATFORM CONFIGS ====================

    /**
     * Get review platform configurations
     */
    public static function getPlatforms() {
        try {
            $workspaceId = self::getWorkspaceId();
            $db = Database::conn();
            
            $stmt = $db->prepare("
                SELECT * FROM review_platform_configs 
                WHERE workspace_id = ? 
                ORDER BY priority DESC, platform
            ");
            $stmt->execute([$workspaceId]);
            
            return Response::json(['data' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
        } catch (Exception $e) {
            return Response::error('Failed to fetch platforms: ' . $e->getMessage());
        }
    }

    /**
     * Add/update review platform
     */
    public static function savePlatform() {
        try {
            $workspaceId = self::getWorkspaceId();
            $db = Database::conn();
            $data = json_decode(file_get_contents('php://input'), true);
            
            $platform = $data['platform'] ?? null;
            $reviewUrl = $data['review_url'] ?? null;
            
            if (!$platform) {
                return Response::error('Platform is required', 400);
            }
            
            $stmt = $db->prepare("
                INSERT INTO review_platform_configs 
                (workspace_id, platform, platform_name, review_url, is_active, priority)
                VALUES (?, ?, ?, ?, 1, ?)
                ON DUPLICATE KEY UPDATE
                    platform_name = VALUES(platform_name),
                    review_url = VALUES(review_url),
                    is_active = 1,
                    priority = VALUES(priority)
            ");
            $stmt->execute([
                $workspaceId,
                $platform,
                $data['platform_name'] ?? ucfirst($platform),
                $reviewUrl,
                $data['priority'] ?? 0
            ]);
            
            return Response::json(['success' => true]);
        } catch (Exception $e) {
            return Response::error('Failed to save platform: ' . $e->getMessage());
        }
    }

    /**
     * Delete review platform
     */
    public static function deletePlatform($id) {
        try {
            $workspaceId = self::getWorkspaceId();
            $db = Database::conn();
            
            $stmt = $db->prepare("DELETE FROM review_platform_configs WHERE id = ? AND workspace_id = ?");
            $stmt->execute([$id, $workspaceId]);
            
            return Response::json(['success' => true]);
        } catch (Exception $e) {
            return Response::error('Failed to delete platform: ' . $e->getMessage());
        }
    }
}
