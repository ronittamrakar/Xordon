<?php
/**
 * ReviewsV2Controller - GHL-style Reviews & Reputation
 * Handles review requests, reviews inbox, and reputation management
 */

require_once __DIR__ . '/../Database.php';
require_once __DIR__ . '/../Response.php';
require_once __DIR__ . '/../Auth.php';
require_once __DIR__ . '/../TenantContext.php';

class ReviewsV2Controller {
    
    private static function getScope(): array {
        $ctx = $GLOBALS['tenantContext'] ?? null;
        if (!$ctx || !isset($ctx->workspaceId)) {
            Response::error('Workspace context required', 403);
            exit;
        }
        return [
            'workspace_id' => (int)$ctx->workspaceId,
            'company_id' => $ctx->activeCompanyId ? (int)$ctx->activeCompanyId : null
        ];
    }
    
    // ==================== REVIEWS ====================
    
    /**
     * List reviews
     * GET /reviews/v2
     */
    public static function listReviews(): void {
        $userId = Auth::userIdOrFail();
        $scope = self::getScope();
        $pdo = Database::conn();
        
        $platform = $_GET['platform'] ?? null;
        $rating = $_GET['rating'] ?? null;
        $status = $_GET['status'] ?? null;
        $limit = min((int)($_GET['limit'] ?? 50), 200);
        $offset = (int)($_GET['offset'] ?? 0);
        
        $where = ['r.workspace_id = ?'];
        $params = [$scope['workspace_id']];
        
        if ($scope['company_id']) {
            $where[] = '(r.company_id = ? OR r.company_id IS NULL)';
            $params[] = $scope['company_id'];
        }
        
        if ($platform) {
            $where[] = 'r.platform = ?';
            $params[] = $platform;
        }
        
        if ($rating) {
            $where[] = 'r.rating = ?';
            $params[] = (int)$rating;
        }
        
        if ($status && in_array($status, ['pending', 'approved', 'hidden', 'flagged'])) {
            $where[] = 'r.status = ?';
            $params[] = $status;
        }
        
        $whereClause = implode(' AND ', $where);
        
        // Get total
        $countSql = "SELECT COUNT(*) FROM reviews r WHERE $whereClause";
        $countStmt = $pdo->prepare($countSql);
        $countStmt->execute($params);
        $total = (int)$countStmt->fetchColumn();
        
        $sql = "SELECT r.*, p.platform_url
                FROM reviews r
                LEFT JOIN review_platforms p ON r.platform_id = p.id
                WHERE $whereClause
                ORDER BY r.review_date DESC, r.created_at DESC
                LIMIT ? OFFSET ?";
        
        $params[] = $limit;
        $params[] = $offset;
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $reviews = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        Response::json([
            'success' => true,
            'data' => $reviews,
            'meta' => ['total' => $total, 'limit' => $limit, 'offset' => $offset]
        ]);
    }
    
    /**
     * Get review stats
     * GET /reviews/v2/stats
     */
    public static function getStats(): void {
        $userId = Auth::userIdOrFail();
        $scope = self::getScope();
        $pdo = Database::conn();
        
        $where = 'workspace_id = ?';
        $params = [$scope['workspace_id']];
        
        $sql = "SELECT 
                    COUNT(*) as total,
                    AVG(rating) as average_rating,
                    SUM(CASE WHEN rating = 5 THEN 1 ELSE 0 END) as five_star,
                    SUM(CASE WHEN rating = 4 THEN 1 ELSE 0 END) as four_star,
                    SUM(CASE WHEN rating = 3 THEN 1 ELSE 0 END) as three_star,
                    SUM(CASE WHEN rating = 2 THEN 1 ELSE 0 END) as two_star,
                    SUM(CASE WHEN rating = 1 THEN 1 ELSE 0 END) as one_star,
                    SUM(CASE WHEN reply IS NOT NULL THEN 1 ELSE 0 END) as replied,
                    SUM(CASE WHEN reply IS NULL AND rating <= 3 THEN 1 ELSE 0 END) as needs_attention
                FROM reviews WHERE $where AND status = 'approved'";
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $stats = $stmt->fetch(PDO::FETCH_ASSOC);
        
        // Get recent trend (last 30 days vs previous 30 days)
        $trendSql = "SELECT 
                        SUM(CASE WHEN review_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY) THEN 1 ELSE 0 END) as recent,
                        SUM(CASE WHEN review_date >= DATE_SUB(CURDATE(), INTERVAL 60 DAY) AND review_date < DATE_SUB(CURDATE(), INTERVAL 30 DAY) THEN 1 ELSE 0 END) as previous
                     FROM reviews WHERE $where";
        $trendStmt = $pdo->prepare($trendSql);
        $trendStmt->execute($params);
        $trend = $trendStmt->fetch(PDO::FETCH_ASSOC);
        
        $stats['trend'] = $trend;
        $stats['average_rating'] = round((float)$stats['average_rating'], 1);
        
        Response::json([
            'success' => true,
            'data' => $stats
        ]);
    }
    
    /**
     * Reply to a review
     * POST /reviews/v2/:id/reply
     */
    public static function replyToReview(int $id): void {
        $userId = Auth::userIdOrFail();
        $scope = self::getScope();
        $body = get_json_body();
        $pdo = Database::conn();
        
        if (empty($body['reply'])) {
            Response::validationError('reply is required');
            return;
        }
        
        $stmt = $pdo->prepare("UPDATE reviews SET reply = ?, replied_at = NOW(), updated_at = NOW() WHERE id = ? AND workspace_id = ?");
        $stmt->execute([$body['reply'], $id, $scope['workspace_id']]);
        
        if ($stmt->rowCount() === 0) {
            Response::notFound('Review not found');
            return;
        }
        
        Response::json(['success' => true, 'message' => 'Reply saved']);
    }
    
    /**
     * Update review status
     * POST /reviews/v2/:id/status
     */
    public static function updateReviewStatus(int $id): void {
        $userId = Auth::userIdOrFail();
        $scope = self::getScope();
        $body = get_json_body();
        $pdo = Database::conn();
        
        $status = $body['status'] ?? null;
        if (!$status || !in_array($status, ['pending', 'approved', 'hidden', 'flagged'])) {
            Response::validationError('Valid status required');
            return;
        }
        
        $stmt = $pdo->prepare("UPDATE reviews SET status = ?, updated_at = NOW() WHERE id = ? AND workspace_id = ?");
        $stmt->execute([$status, $id, $scope['workspace_id']]);
        
        Response::json(['success' => true, 'message' => 'Status updated']);
    }
    
    // ==================== REVIEW REQUESTS ====================
    
    /**
     * List review requests
     * GET /reviews/v2/requests
     */
    public static function listRequests(): void {
        $userId = Auth::userIdOrFail();
        $scope = self::getScope();
        $pdo = Database::conn();
        
        $status = $_GET['status'] ?? null;
        $limit = min((int)($_GET['limit'] ?? 50), 200);
        $offset = (int)($_GET['offset'] ?? 0);
        
        $where = ['rr.workspace_id = ?'];
        $params = [$scope['workspace_id']];
        
        if ($scope['company_id']) {
            $where[] = '(rr.company_id = ? OR rr.company_id IS NULL)';
            $params[] = $scope['company_id'];
        }
        
        if ($status && in_array($status, ['pending', 'sent', 'clicked', 'reviewed', 'declined', 'failed'])) {
            $where[] = 'rr.status = ?';
            $params[] = $status;
        }
        
        $whereClause = implode(' AND ', $where);
        
        $sql = "SELECT rr.*, c.first_name as contact_first_name, c.last_name as contact_last_name,
                    p.platform as platform_name
                FROM review_requests rr
                LEFT JOIN contacts c ON rr.contact_id = c.id
                LEFT JOIN review_platforms p ON rr.platform_id = p.id
                WHERE $whereClause
                ORDER BY rr.created_at DESC
                LIMIT ? OFFSET ?";
        
        $params[] = $limit;
        $params[] = $offset;
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $requests = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        Response::json([
            'success' => true,
            'data' => $requests
        ]);
    }
    
    /**
     * Send review request
     * POST /reviews/v2/requests
     */
    public static function sendRequest(): void {
        $userId = Auth::userIdOrFail();
        $scope = self::getScope();
        $body = get_json_body();
        $pdo = Database::conn();
        
        if (empty($body['contact_id']) && empty($body['recipient_phone']) && empty($body['recipient_email'])) {
            Response::validationError('contact_id or recipient contact info required');
            return;
        }
        
        // Get primary platform
        $platformStmt = $pdo->prepare("SELECT * FROM review_platforms WHERE workspace_id = ? AND is_primary = 1 LIMIT 1");
        $platformStmt->execute([$scope['workspace_id']]);
        $platform = $platformStmt->fetch(PDO::FETCH_ASSOC);
        
        $platformId = $platform ? $platform['id'] : null;
        $reviewUrl = $platform ? $platform['platform_url'] : null;
        
        // Get contact info if contact_id provided
        $recipientName = $body['recipient_name'] ?? null;
        $recipientEmail = $body['recipient_email'] ?? null;
        $recipientPhone = $body['recipient_phone'] ?? null;
        
        if (!empty($body['contact_id'])) {
            $contactStmt = $pdo->prepare("SELECT first_name, last_name, email, phone FROM contacts WHERE id = ?");
            $contactStmt->execute([$body['contact_id']]);
            $contact = $contactStmt->fetch(PDO::FETCH_ASSOC);
            if ($contact) {
                $recipientName = $recipientName ?: trim($contact['first_name'] . ' ' . $contact['last_name']);
                $recipientEmail = $recipientEmail ?: $contact['email'];
                $recipientPhone = $recipientPhone ?: $contact['phone'];
            }
        }
        
        $channel = $body['channel'] ?? 'sms';
        $message = $body['message'] ?? "Hi {$recipientName}! We'd love to hear about your experience. Please leave us a review: {$reviewUrl}";
        
        $stmt = $pdo->prepare("
            INSERT INTO review_requests 
            (workspace_id, company_id, contact_id, platform_id, channel, status, recipient_name, recipient_email, recipient_phone, message, review_url, created_at)
            VALUES (?, ?, ?, ?, ?, 'pending', ?, ?, ?, ?, ?, NOW())
        ");
        $stmt->execute([
            $scope['workspace_id'],
            $scope['company_id'],
            $body['contact_id'] ?? null,
            $platformId,
            $channel,
            $recipientName,
            $recipientEmail,
            $recipientPhone,
            $message,
            $reviewUrl
        ]);
        
        $requestId = (int)$pdo->lastInsertId();
        
        // TODO: Actually send the SMS/email via provider
        // For now, mark as sent
        $pdo->prepare("UPDATE review_requests SET status = 'sent', sent_at = NOW() WHERE id = ?")->execute([$requestId]);
        
        Response::json([
            'success' => true,
            'data' => ['id' => $requestId],
            'message' => 'Review request sent'
        ], 201);
    }
    
    /**
     * Get request stats
     * GET /reviews/v2/requests/stats
     */
    public static function getRequestStats(): void {
        $userId = Auth::userIdOrFail();
        $scope = self::getScope();
        $pdo = Database::conn();
        
        $where = 'workspace_id = ?';
        $params = [$scope['workspace_id']];
        
        $sql = "SELECT 
                    COUNT(*) as total,
                    SUM(CASE WHEN status = 'sent' THEN 1 ELSE 0 END) as sent,
                    SUM(CASE WHEN status = 'clicked' THEN 1 ELSE 0 END) as clicked,
                    SUM(CASE WHEN status = 'reviewed' THEN 1 ELSE 0 END) as reviewed,
                    SUM(CASE WHEN status = 'declined' THEN 1 ELSE 0 END) as declined
                FROM review_requests WHERE $where";
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $stats = $stmt->fetch(PDO::FETCH_ASSOC);
        
        // Calculate conversion rate
        $sent = (int)$stats['sent'] + (int)$stats['clicked'] + (int)$stats['reviewed'];
        $stats['conversion_rate'] = $sent > 0 ? round(((int)$stats['reviewed'] / $sent) * 100, 1) : 0;
        
        Response::json([
            'success' => true,
            'data' => $stats
        ]);
    }
    
    // ==================== PLATFORMS ====================
    
    /**
     * List review platforms
     * GET /reviews/v2/platforms
     */
    public static function listPlatforms(): void {
        $userId = Auth::userIdOrFail();
        $scope = self::getScope();
        $pdo = Database::conn();
        
        $sql = "SELECT p.*, 
                    (SELECT COUNT(*) FROM reviews WHERE platform_id = p.id) as review_count,
                    (SELECT AVG(rating) FROM reviews WHERE platform_id = p.id) as avg_rating
                FROM review_platforms p
                WHERE p.workspace_id = ?";
        $params = [$scope['workspace_id']];
        
        if ($scope['company_id']) {
            $sql .= ' AND (p.company_id = ? OR p.company_id IS NULL)';
            $params[] = $scope['company_id'];
        }
        
        $sql .= ' ORDER BY p.is_primary DESC, p.platform ASC';
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $platforms = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        Response::json([
            'success' => true,
            'data' => $platforms
        ]);
    }
    
    /**
     * Add review platform
     * POST /reviews/v2/platforms
     */
    public static function addPlatform(): void {
        $userId = Auth::userIdOrFail();
        $scope = self::getScope();
        $body = get_json_body();
        $pdo = Database::conn();
        
        if (empty($body['platform'])) {
            Response::validationError('platform is required');
            return;
        }
        
        $stmt = $pdo->prepare("
            INSERT INTO review_platforms 
            (workspace_id, company_id, platform, platform_url, place_id, is_active, is_primary, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
        ");
        $stmt->execute([
            $scope['workspace_id'],
            $scope['company_id'],
            $body['platform'],
            $body['platform_url'] ?? null,
            $body['place_id'] ?? null,
            isset($body['is_active']) ? ($body['is_active'] ? 1 : 0) : 1,
            !empty($body['is_primary']) ? 1 : 0
        ]);
        
        $platformId = (int)$pdo->lastInsertId();
        
        Response::json([
            'success' => true,
            'data' => ['id' => $platformId],
            'message' => 'Platform added'
        ], 201);
    }
    
    /**
     * Update platform
     * PUT /reviews/v2/platforms/:id
     */
    public static function updatePlatform(int $id): void {
        $userId = Auth::userIdOrFail();
        $scope = self::getScope();
        $body = get_json_body();
        $pdo = Database::conn();
        
        $fields = ['platform_url', 'place_id', 'is_active', 'is_primary'];
        $updates = [];
        $params = [];
        
        foreach ($fields as $field) {
            if (isset($body[$field])) {
                $updates[] = "$field = ?";
                $params[] = $body[$field];
            }
        }
        
        if (empty($updates)) {
            Response::json(['success' => true, 'message' => 'No updates']);
            return;
        }
        
        $params[] = $id;
        $params[] = $scope['workspace_id'];
        
        $sql = "UPDATE review_platforms SET " . implode(', ', $updates) . ", updated_at = NOW() WHERE id = ? AND workspace_id = ?";
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        
        Response::json(['success' => true, 'message' => 'Platform updated']);
    }
}
