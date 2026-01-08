<?php
/**
 * MarketplaceReviewsController
 * 
 * Handles reviews for lead marketplace providers (distinct from external review platform syncs).
 * Consumers can leave reviews after lead completion, providers can respond.
 */

namespace App\Controllers;

require_once __DIR__ . '/../Database.php';
require_once __DIR__ . '/../Auth.php';

use \Xordon\Database;
use Auth;

class MarketplaceReviewsController
{
    /**
     * Helper to get workspace context with dev mode fallback
     */
    private static function getWorkspaceIdOrFail(): int
    {
        $ctx = $GLOBALS['tenantContext'] ?? null;
        $workspaceId = $ctx->workspaceId ?? null;
        
        if ($workspaceId) {
            return (int)$workspaceId;
        }
        
        // Dev mode fallback
        $appEnv = \Config::get('APP_ENV', 'development');
        if ($appEnv !== 'production') {
            return 1;
        }
        
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Workspace required']);
        exit;
    }

    private static function getCompanyIdOrFail(): int
    {
        $ctx = $GLOBALS['tenantContext'] ?? null;
        $companyId = $ctx->activeCompanyId ?? null;
        
        if ($companyId) {
            return (int)$companyId;
        }
        
        // Dev mode fallback
        $appEnv = \Config::get('APP_ENV', 'development');
        if ($appEnv !== 'production') {
            $workspaceId = self::getWorkspaceIdOrFail();
            $pdo = Database::conn();
            $stmt = $pdo->prepare('SELECT id FROM companies WHERE workspace_id = ? LIMIT 1');
            $stmt->execute([$workspaceId]);
            $row = $stmt->fetch(\PDO::FETCH_ASSOC);
            return $row ? (int)$row['id'] : 1;
        }
        
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Company required']);
        exit;
    }

    // ==================== PUBLIC REVIEWS ====================

    /**
     * GET /lead-marketplace/reviews
     * List marketplace reviews with filters
     */
    public static function getReviews(): void
    {
        $workspaceId = self::getWorkspaceIdOrFail();
        $pdo = Database::conn();

        $companyId = $_GET['company_id'] ?? null;
        $proId = $_GET['pro_id'] ?? null;
        $status = $_GET['status'] ?? 'approved'; // Only show approved by default
        $minRating = $_GET['min_rating'] ?? null;
        $limit = min((int)($_GET['limit'] ?? 20), 100);
        $offset = max((int)($_GET['offset'] ?? 0), 0);

        $sql = '
            SELECT r.*,
                   sp.business_name as provider_name,
                   sp.logo_url as provider_logo,
                   lr.title as lead_title,
                   lr.consumer_name as reviewer_name_fallback
            FROM marketplace_reviews r
            LEFT JOIN service_pros sp ON r.company_id = sp.company_id AND sp.workspace_id = r.workspace_id
            LEFT JOIN lead_requests lr ON r.lead_request_id = lr.id
            WHERE r.workspace_id = ?
        ';
        $params = [$workspaceId];

        if ($companyId) {
            $sql .= ' AND r.company_id = ?';
            $params[] = $companyId;
        }

        if ($proId) {
            $sql .= ' AND sp.id = ?';
            $params[] = $proId;
        }

        if ($status && $status !== 'all') {
            $sql .= ' AND r.status = ?';
            $params[] = $status;
        }

        if ($minRating) {
            $sql .= ' AND r.rating >= ?';
            $params[] = (int)$minRating;
        }

        // Only show public reviews on public endpoints
        if (!isset($_GET['include_private']) || !Auth::userId()) {
            $sql .= ' AND r.is_public = 1';
        }

        $sql .= ' ORDER BY r.created_at DESC LIMIT ? OFFSET ?';
        $params[] = $limit;
        $params[] = $offset;

        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $reviews = $stmt->fetchAll(\PDO::FETCH_ASSOC);

        // Get total count
        $countSql = str_replace(
            'SELECT r.*,',
            'SELECT COUNT(*) as total FROM (SELECT r.id',
            $sql
        );
        $countSql = preg_replace('/ORDER BY.*$/', ') as cnt', $countSql);
        // Simplified count query
        $countParams = array_slice($params, 0, -2);

        echo json_encode([
            'success' => true,
            'data' => $reviews,
            'meta' => [
                'limit' => $limit,
                'offset' => $offset,
                'returned' => count($reviews)
            ]
        ]);
    }

    /**
     * GET /lead-marketplace/reviews/{id}
     */
    public static function getReview(int $id): void
    {
        $workspaceId = self::getWorkspaceIdOrFail();
        $pdo = Database::conn();

        $stmt = $pdo->prepare('
            SELECT r.*,
                   sp.business_name as provider_name,
                   sp.logo_url as provider_logo,
                   sp.avg_rating as provider_avg_rating,
                   sp.total_reviews as provider_total_reviews,
                   lr.title as lead_title,
                   lr.consumer_name,
                   lr.consumer_email
            FROM marketplace_reviews r
            LEFT JOIN service_pros sp ON r.company_id = sp.company_id AND sp.workspace_id = r.workspace_id
            LEFT JOIN lead_requests lr ON r.lead_request_id = lr.id
            WHERE r.id = ? AND r.workspace_id = ?
        ');
        $stmt->execute([$id, $workspaceId]);
        $review = $stmt->fetch(\PDO::FETCH_ASSOC);

        if (!$review) {
            http_response_code(404);
            echo json_encode(['success' => false, 'error' => 'Review not found']);
            return;
        }

        echo json_encode(['success' => true, 'data' => $review]);
    }

    /**
     * GET /lead-marketplace/providers/{id}/reviews
     * Get all reviews for a specific provider (public)
     */
    public static function getProviderReviews(int $proId): void
    {
        $workspaceId = self::getWorkspaceIdOrFail();
        $pdo = Database::conn();

        // Get provider's company_id
        $stmt = $pdo->prepare('SELECT company_id FROM service_pros WHERE id = ? AND workspace_id = ?');
        $stmt->execute([$proId, $workspaceId]);
        $pro = $stmt->fetch(\PDO::FETCH_ASSOC);

        if (!$pro) {
            http_response_code(404);
            echo json_encode(['success' => false, 'error' => 'Provider not found']);
            return;
        }

        $limit = min((int)($_GET['limit'] ?? 20), 100);
        $offset = max((int)($_GET['offset'] ?? 0), 0);

        $stmt = $pdo->prepare('
            SELECT r.*,
                   lr.title as lead_title
            FROM marketplace_reviews r
            LEFT JOIN lead_requests lr ON r.lead_request_id = lr.id
            WHERE r.company_id = ? AND r.workspace_id = ? AND r.status = ? AND r.is_public = 1
            ORDER BY r.is_featured DESC, r.created_at DESC
            LIMIT ? OFFSET ?
        ');
        $stmt->execute([$pro['company_id'], $workspaceId, 'approved', $limit, $offset]);
        $reviews = $stmt->fetchAll(\PDO::FETCH_ASSOC);

        // Get aggregate stats
        $stmt = $pdo->prepare('
            SELECT 
                COUNT(*) as total_reviews,
                AVG(rating) as avg_rating,
                SUM(CASE WHEN rating = 5 THEN 1 ELSE 0 END) as five_star,
                SUM(CASE WHEN rating = 4 THEN 1 ELSE 0 END) as four_star,
                SUM(CASE WHEN rating = 3 THEN 1 ELSE 0 END) as three_star,
                SUM(CASE WHEN rating = 2 THEN 1 ELSE 0 END) as two_star,
                SUM(CASE WHEN rating = 1 THEN 1 ELSE 0 END) as one_star
            FROM marketplace_reviews
            WHERE company_id = ? AND workspace_id = ? AND status = ? AND is_public = 1
        ');
        $stmt->execute([$pro['company_id'], $workspaceId, 'approved']);
        $stats = $stmt->fetch(\PDO::FETCH_ASSOC);

        echo json_encode([
            'success' => true,
            'data' => $reviews,
            'stats' => $stats
        ]);
    }

    // ==================== CONSUMER REVIEWS ====================

    /**
     * POST /lead-marketplace/reviews
     * Consumer submits a review after lead completion
     */
    public static function createReview(): void
    {
        $workspaceId = self::getWorkspaceIdOrFail();
        $pdo = Database::conn();
        $body = json_decode(file_get_contents('php://input'), true) ?: [];

        $leadMatchId = $body['lead_match_id'] ?? null;
        $rating = (int)($body['rating'] ?? 0);
        $title = trim($body['title'] ?? '');
        $comment = trim($body['comment'] ?? '');
        $pros = trim($body['pros'] ?? '');
        $cons = trim($body['cons'] ?? '');
        $reviewerName = trim($body['reviewer_name'] ?? '');
        $reviewerEmail = trim($body['reviewer_email'] ?? '');

        // Validation
        if (!$leadMatchId) {
            http_response_code(422);
            echo json_encode(['success' => false, 'error' => 'lead_match_id is required']);
            return;
        }

        if ($rating < 1 || $rating > 5) {
            http_response_code(422);
            echo json_encode(['success' => false, 'error' => 'Rating must be between 1 and 5']);
            return;
        }

        // Get lead match and verify it's complete
        $stmt = $pdo->prepare('
            SELECT lm.*, lr.consumer_name, lr.consumer_email, lr.consumer_phone, lr.id as lead_id
            FROM lead_matches lm
            JOIN lead_requests lr ON lm.lead_request_id = lr.id
            WHERE lm.id = ? AND lm.workspace_id = ?
        ');
        $stmt->execute([$leadMatchId, $workspaceId]);
        $match = $stmt->fetch(\PDO::FETCH_ASSOC);

        if (!$match) {
            http_response_code(404);
            echo json_encode(['success' => false, 'error' => 'Lead match not found']);
            return;
        }

        // Check if lead was accepted (only allow reviews for accepted/won/lost matches)
        $allowedStatuses = ['accepted', 'won', 'lost'];
        if (!in_array($match['status'], $allowedStatuses)) {
            http_response_code(422);
            echo json_encode(['success' => false, 'error' => 'Can only review completed leads']);
            return;
        }

        // Check if already reviewed
        $stmt = $pdo->prepare('SELECT id FROM marketplace_reviews WHERE lead_match_id = ? AND workspace_id = ?');
        $stmt->execute([$leadMatchId, $workspaceId]);
        if ($stmt->fetch()) {
            http_response_code(409);
            echo json_encode(['success' => false, 'error' => 'This lead has already been reviewed']);
            return;
        }

        // Auto-verify if email matches lead consumer
        $isVerified = false;
        if ($reviewerEmail && strtolower($reviewerEmail) === strtolower($match['consumer_email'] ?? '')) {
            $isVerified = true;
        }

        // Create review (pending approval)
        $stmt = $pdo->prepare('
            INSERT INTO marketplace_reviews (
                workspace_id, company_id, lead_request_id, lead_match_id,
                reviewer_name, reviewer_email, rating, title, comment, pros, cons,
                is_verified, verified_at, is_public, status, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, NOW())
        ');
        $stmt->execute([
            $workspaceId,
            $match['company_id'],
            $match['lead_id'],
            $leadMatchId,
            $reviewerName ?: $match['consumer_name'],
            $reviewerEmail ?: $match['consumer_email'],
            $rating,
            $title,
            $comment,
            $pros,
            $cons,
            $isVerified ? 1 : 0,
            $isVerified ? date('Y-m-d H:i:s') : null,
            'pending' // Require admin approval
        ]);

        $reviewId = (int)$pdo->lastInsertId();

        // If auto-approved (optional: auto-approve verified reviews)
        $autoApprove = $isVerified && $rating >= 3;
        if ($autoApprove) {
            $stmt = $pdo->prepare('UPDATE marketplace_reviews SET status = ? WHERE id = ?');
            $stmt->execute(['approved', $reviewId]);
            
            // Update provider rating
            self::updateProviderRating($pdo, $match['company_id'], $workspaceId);
        }

        echo json_encode([
            'success' => true,
            'data' => ['id' => $reviewId, 'status' => $autoApprove ? 'approved' : 'pending'],
            'message' => $autoApprove ? 'Review published' : 'Review submitted for approval'
        ], 201);
    }

    /**
     * GET /lead-marketplace/reviews/pending-for-consumer
     * Get leads that consumer can review (public endpoint with token)
     */
    public static function getPendingReviewsForConsumer(): void
    {
        $workspaceId = self::getWorkspaceIdOrFail();
        $pdo = Database::conn();

        $email = $_GET['email'] ?? null;
        $token = $_GET['token'] ?? null;

        if (!$email) {
            http_response_code(422);
            echo json_encode(['success' => false, 'error' => 'Email required']);
            return;
        }

        // Verify token for security
        // In production, this should validate a JWT or signed hash generated when the "Review this pro" link was sent
        $appKey = $_ENV['APP_KEY'] ?? 'dev_secret';
        $expectedToken = hash_hmac('sha256', $email, $appKey);
        
        // Allow a universal dev token in non-production
        $isDev = ($_ENV['APP_ENV'] ?? 'development') !== 'production';
        if (!hash_equals($expectedToken, $token)) {
            if (!$isDev || $token !== 'dev_bypass') {
                 http_response_code(403);
                 echo json_encode(['success' => false, 'error' => 'Invalid review token']);
                 return;
            }
        }
        
        // Find all accepted leads for this consumer without reviews
        $stmt = $pdo->prepare('
            SELECT lm.id as match_id, lm.company_id, lm.accepted_at, lm.status,
                   lr.title as lead_title, lr.consumer_name,
                   sp.business_name as provider_name, sp.logo_url as provider_logo
            FROM lead_matches lm
            JOIN lead_requests lr ON lm.lead_request_id = lr.id
            LEFT JOIN service_pros sp ON lm.company_id = sp.company_id AND sp.workspace_id = lm.workspace_id
            LEFT JOIN marketplace_reviews mr ON mr.lead_match_id = lm.id
            WHERE lr.consumer_email = ?
              AND lr.workspace_id = ?
              AND lm.status IN (?, ?, ?)
              AND mr.id IS NULL
            ORDER BY lm.accepted_at DESC
            LIMIT 10
        ');
        $stmt->execute([$email, $workspaceId, 'accepted', 'won', 'lost']);
        $pendingReviews = $stmt->fetchAll(\PDO::FETCH_ASSOC);

        echo json_encode(['success' => true, 'data' => $pendingReviews]);
    }

    // ==================== PROVIDER RESPONSES ====================

    /**
     * POST /lead-marketplace/reviews/{id}/respond
     * Provider responds to a review
     */
    public static function respondToReview(int $id): void
    {
        $workspaceId = self::getWorkspaceIdOrFail();
        $companyId = self::getCompanyIdOrFail();
        $pdo = Database::conn();
        $body = json_decode(file_get_contents('php://input'), true) ?: [];

        $response = trim($body['response'] ?? '');
        if (!$response) {
            http_response_code(422);
            echo json_encode(['success' => false, 'error' => 'Response text is required']);
            return;
        }

        // Verify review belongs to this provider's company
        $stmt = $pdo->prepare('SELECT * FROM marketplace_reviews WHERE id = ? AND workspace_id = ? AND company_id = ?');
        $stmt->execute([$id, $workspaceId, $companyId]);
        $review = $stmt->fetch(\PDO::FETCH_ASSOC);

        if (!$review) {
            http_response_code(404);
            echo json_encode(['success' => false, 'error' => 'Review not found or not yours']);
            return;
        }

        $userId = Auth::userId() ?? 0;

        $stmt = $pdo->prepare('
            UPDATE marketplace_reviews SET
                response = ?,
                response_at = NOW(),
                response_by = ?,
                updated_at = NOW()
            WHERE id = ?
        ');
        $stmt->execute([$response, $userId, $id]);

        echo json_encode(['success' => true, 'message' => 'Response submitted']);
    }

    /**
     * GET /lead-marketplace/my-reviews
     * Provider views their reviews
     */
    public static function getMyReviews(): void
    {
        $workspaceId = self::getWorkspaceIdOrFail();
        $companyId = self::getCompanyIdOrFail();
        $pdo = Database::conn();

        $status = $_GET['status'] ?? null;
        $limit = min((int)($_GET['limit'] ?? 20), 100);
        $offset = max((int)($_GET['offset'] ?? 0), 0);

        $sql = '
            SELECT r.*,
                   lr.title as lead_title,
                   lr.consumer_name
            FROM marketplace_reviews r
            LEFT JOIN lead_requests lr ON r.lead_request_id = lr.id
            WHERE r.company_id = ? AND r.workspace_id = ?
        ';
        $params = [$companyId, $workspaceId];

        if ($status) {
            $sql .= ' AND r.status = ?';
            $params[] = $status;
        }

        $sql .= ' ORDER BY r.created_at DESC LIMIT ? OFFSET ?';
        $params[] = $limit;
        $params[] = $offset;

        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $reviews = $stmt->fetchAll(\PDO::FETCH_ASSOC);

        // Get stats
        $stmt = $pdo->prepare('
            SELECT 
                COUNT(*) as total,
                AVG(rating) as avg_rating,
                SUM(CASE WHEN response IS NOT NULL THEN 1 ELSE 0 END) as responded,
                SUM(CASE WHEN status = ? THEN 1 ELSE 0 END) as pending
            FROM marketplace_reviews
            WHERE company_id = ? AND workspace_id = ?
        ');
        $stmt->execute(['pending', $companyId, $workspaceId]);
        $stats = $stmt->fetch(\PDO::FETCH_ASSOC);

        echo json_encode([
            'success' => true,
            'data' => $reviews,
            'stats' => $stats
        ]);
    }

    // ==================== ADMIN MODERATION ====================

    /**
     * GET /lead-marketplace/admin/reviews
     * Admin views all reviews with moderation queue
     */
    public static function adminGetReviews(): void
    {
        $workspaceId = self::getWorkspaceIdOrFail();
        $pdo = Database::conn();

        $status = $_GET['status'] ?? 'pending';
        $limit = min((int)($_GET['limit'] ?? 50), 200);
        $offset = max((int)($_GET['offset'] ?? 0), 0);

        $sql = '
            SELECT r.*,
                   sp.business_name as provider_name,
                   lr.title as lead_title,
                   lr.consumer_name, lr.consumer_email
            FROM marketplace_reviews r
            LEFT JOIN service_pros sp ON r.company_id = sp.company_id AND sp.workspace_id = r.workspace_id
            LEFT JOIN lead_requests lr ON r.lead_request_id = lr.id
            WHERE r.workspace_id = ?
        ';
        $params = [$workspaceId];

        if ($status && $status !== 'all') {
            $sql .= ' AND r.status = ?';
            $params[] = $status;
        }

        $sql .= ' ORDER BY r.created_at DESC LIMIT ? OFFSET ?';
        $params[] = $limit;
        $params[] = $offset;

        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $reviews = $stmt->fetchAll(\PDO::FETCH_ASSOC);

        // Get counts per status
        $stmt = $pdo->prepare('
            SELECT status, COUNT(*) as count
            FROM marketplace_reviews
            WHERE workspace_id = ?
            GROUP BY status
        ');
        $stmt->execute([$workspaceId]);
        $counts = [];
        while ($row = $stmt->fetch(\PDO::FETCH_ASSOC)) {
            $counts[$row['status']] = (int)$row['count'];
        }

        echo json_encode([
            'success' => true,
            'data' => $reviews,
            'counts' => $counts
        ]);
    }

    /**
     * PUT /lead-marketplace/admin/reviews/{id}
     * Admin moderates a review (approve/reject/flag)
     */
    public static function adminUpdateReview(int $id): void
    {
        $workspaceId = self::getWorkspaceIdOrFail();
        $pdo = Database::conn();
        $body = json_decode(file_get_contents('php://input'), true) ?: [];

        $status = $body['status'] ?? null;
        $isFeatured = isset($body['is_featured']) ? (int)$body['is_featured'] : null;
        $isPublic = isset($body['is_public']) ? (int)$body['is_public'] : null;

        // Verify review exists
        $stmt = $pdo->prepare('SELECT * FROM marketplace_reviews WHERE id = ? AND workspace_id = ?');
        $stmt->execute([$id, $workspaceId]);
        $review = $stmt->fetch(\PDO::FETCH_ASSOC);

        if (!$review) {
            http_response_code(404);
            echo json_encode(['success' => false, 'error' => 'Review not found']);
            return;
        }

        $updates = [];
        $params = [];

        if ($status && in_array($status, ['pending', 'approved', 'rejected', 'flagged'])) {
            $updates[] = 'status = ?';
            $params[] = $status;
        }

        if ($isFeatured !== null) {
            $updates[] = 'is_featured = ?';
            $params[] = $isFeatured;
        }

        if ($isPublic !== null) {
            $updates[] = 'is_public = ?';
            $params[] = $isPublic;
        }

        if (empty($updates)) {
            http_response_code(422);
            echo json_encode(['success' => false, 'error' => 'No valid updates provided']);
            return;
        }

        $updates[] = 'updated_at = NOW()';
        $params[] = $id;

        $stmt = $pdo->prepare('UPDATE marketplace_reviews SET ' . implode(', ', $updates) . ' WHERE id = ?');
        $stmt->execute($params);

        // Update provider rating if status changed to approved or rejected
        if ($status === 'approved' || ($review['status'] === 'approved' && $status === 'rejected')) {
            self::updateProviderRating($pdo, $review['company_id'], $workspaceId);
        }

        echo json_encode(['success' => true, 'message' => 'Review updated']);
    }

    /**
     * DELETE /lead-marketplace/admin/reviews/{id}
     */
    public static function adminDeleteReview(int $id): void
    {
        $workspaceId = self::getWorkspaceIdOrFail();
        $pdo = Database::conn();

        $stmt = $pdo->prepare('SELECT company_id FROM marketplace_reviews WHERE id = ? AND workspace_id = ?');
        $stmt->execute([$id, $workspaceId]);
        $review = $stmt->fetch(\PDO::FETCH_ASSOC);

        if (!$review) {
            http_response_code(404);
            echo json_encode(['success' => false, 'error' => 'Review not found']);
            return;
        }

        $stmt = $pdo->prepare('DELETE FROM marketplace_reviews WHERE id = ?');
        $stmt->execute([$id]);

        // Update provider rating
        self::updateProviderRating($pdo, $review['company_id'], $workspaceId);

        echo json_encode(['success' => true, 'message' => 'Review deleted']);
    }

    // ==================== HELPERS ====================

    /**
     * Update provider's avg_rating and total_reviews based on approved reviews
     */
    private static function updateProviderRating(\PDO $pdo, int $companyId, int $workspaceId): void
    {
        $stmt = $pdo->prepare('
            SELECT COUNT(*) as total, AVG(rating) as avg
            FROM marketplace_reviews
            WHERE company_id = ? AND workspace_id = ? AND status = ?
        ');
        $stmt->execute([$companyId, $workspaceId, 'approved']);
        $stats = $stmt->fetch(\PDO::FETCH_ASSOC);

        $stmt = $pdo->prepare('
            UPDATE service_pros SET
                avg_rating = ?,
                total_reviews = ?,
                updated_at = NOW()
            WHERE company_id = ? AND workspace_id = ?
        ');
        $stmt->execute([
            $stats['avg'] ? round($stats['avg'], 2) : 0,
            (int)$stats['total'],
            $companyId,
            $workspaceId
        ]);
    }
}
