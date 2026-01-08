<?php
require_once __DIR__ . '/../Database.php';
require_once __DIR__ . '/../Response.php';
require_once __DIR__ . '/../Auth.php';

class ReviewsController {
    
    // ==================== PLATFORMS ====================
    
    public static function getPlatforms(): void {
        $userId = Auth::userIdOrFail();
        $pdo = Database::conn();
        
        $stmt = $pdo->prepare('
            SELECT p.*,
                   (SELECT COUNT(*) FROM reviews WHERE platform_id = p.id) as review_count,
                   (SELECT AVG(rating) FROM reviews WHERE platform_id = p.id) as avg_rating
            FROM review_platforms p
            WHERE p.user_id = ?
            ORDER BY p.platform ASC
        ');
        $stmt->execute([$userId]);
        
        Response::json(['items' => $stmt->fetchAll()]);
    }
    
    public static function createPlatform(): void {
        $userId = Auth::userIdOrFail();
        $body = get_json_body();
        $pdo = Database::conn();
        
        $platform = $body['platform'] ?? 'google';
        
        $stmt = $pdo->prepare('
            INSERT INTO review_platforms 
            (user_id, client_id, platform, platform_name, place_id, page_id, api_key, access_token, review_url, status, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
        ');
        $stmt->execute([
            $userId,
            $body['client_id'] ?? null,
            $platform,
            $body['platform_name'] ?? ucfirst($platform),
            $body['place_id'] ?? null,
            $body['page_id'] ?? null,
            $body['api_key'] ?? null,
            $body['access_token'] ?? null,
            $body['review_url'] ?? null,
            'active'
        ]);
        
        $id = (int)$pdo->lastInsertId();
        $stmt = $pdo->prepare('SELECT * FROM review_platforms WHERE id = ?');
        $stmt->execute([$id]);
        
        Response::json($stmt->fetch(), 201);
    }
    
    public static function updatePlatform(string $id): void {
        $userId = Auth::userIdOrFail();
        $body = get_json_body();
        $pdo = Database::conn();
        
        $stmt = $pdo->prepare('
            UPDATE review_platforms SET
                platform_name = COALESCE(?, platform_name),
                place_id = COALESCE(?, place_id),
                page_id = COALESCE(?, page_id),
                api_key = COALESCE(?, api_key),
                access_token = COALESCE(?, access_token),
                review_url = COALESCE(?, review_url),
                status = COALESCE(?, status),
                updated_at = NOW()
            WHERE id = ? AND user_id = ?
        ');
        $stmt->execute([
            $body['platform_name'] ?? null,
            $body['place_id'] ?? null,
            $body['page_id'] ?? null,
            $body['api_key'] ?? null,
            $body['access_token'] ?? null,
            $body['review_url'] ?? null,
            $body['status'] ?? null,
            $id,
            $userId
        ]);
        
        $stmt = $pdo->prepare('SELECT * FROM review_platforms WHERE id = ?');
        $stmt->execute([$id]);
        
        Response::json($stmt->fetch());
    }
    
    public static function deletePlatform(string $id): void {
        $userId = Auth::userIdOrFail();
        $pdo = Database::conn();
        
        $stmt = $pdo->prepare('DELETE FROM review_platforms WHERE id = ? AND user_id = ?');
        $stmt->execute([$id, $userId]);
        
        Response::json(['success' => true]);
    }
    
    // ==================== REVIEWS ====================
    
    public static function getReviews(): void {
        $userId = Auth::userIdOrFail();
        $platformId = $_GET['platform_id'] ?? null;
        $status = $_GET['status'] ?? null;
        $rating = $_GET['rating'] ?? null;
        $pdo = Database::conn();
        
        $sql = '
            SELECT r.*, p.platform, p.platform_name
            FROM reviews r
            JOIN review_platforms p ON r.platform_id = p.id
            WHERE r.user_id = ?
        ';
        $params = [$userId];
        
        if ($platformId) {
            $sql .= ' AND r.platform_id = ?';
            $params[] = $platformId;
        }
        
        if ($status) {
            $sql .= ' AND r.status = ?';
            $params[] = $status;
        }
        
        if ($rating) {
            $sql .= ' AND r.rating = ?';
            $params[] = $rating;
        }
        
        $sql .= ' ORDER BY r.review_date DESC LIMIT 100';
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        
        Response::json(['items' => $stmt->fetchAll()]);
    }
    
    public static function getReview(string $id): void {
        $userId = Auth::userIdOrFail();
        $pdo = Database::conn();
        
        $stmt = $pdo->prepare('
            SELECT r.*, p.platform, p.platform_name
            FROM reviews r
            JOIN review_platforms p ON r.platform_id = p.id
            WHERE r.id = ? AND r.user_id = ?
        ');
        $stmt->execute([$id, $userId]);
        $review = $stmt->fetch();
        
        if (!$review) {
            Response::error('Review not found', 404);
            return;
        }
        
        Response::json($review);
    }
    
    public static function respondToReview(string $id): void {
        $userId = Auth::userIdOrFail();
        $body = get_json_body();
        $pdo = Database::conn();
        
        $response = trim($body['response'] ?? '');
        if (!$response) {
            Response::error('Response text is required', 422);
            return;
        }
        
        $stmt = $pdo->prepare('
            UPDATE reviews SET
                response = ?,
                response_date = NOW(),
                status = "responded",
                updated_at = NOW()
            WHERE id = ? AND user_id = ?
        ');
        $stmt->execute([$response, $id, $userId]);
        
        // In production, this would also post the response to the platform API
        
        $stmt = $pdo->prepare('SELECT * FROM reviews WHERE id = ?');
        $stmt->execute([$id]);
        
        Response::json($stmt->fetch());
    }
    
    public static function updateReviewStatus(string $id): void {
        $userId = Auth::userIdOrFail();
        $body = get_json_body();
        $pdo = Database::conn();
        
        $status = $body['status'] ?? 'read';
        
        $stmt = $pdo->prepare('UPDATE reviews SET status = ? WHERE id = ? AND user_id = ?');
        $stmt->execute([$status, $id, $userId]);
        
        Response::json(['success' => true]);
    }
    
    // ==================== REVIEW REQUESTS ====================
    
    public static function getReviewRequests(): void {
        $userId = Auth::userIdOrFail();
        $pdo = Database::conn();
        
        $stmt = $pdo->prepare('
            SELECT rr.*, c.name as contact_name, c.email as contact_email, p.platform, p.platform_name
            FROM review_requests rr
            LEFT JOIN contacts c ON rr.contact_id = c.id
            LEFT JOIN review_platforms p ON rr.platform_id = p.id
            WHERE rr.user_id = ?
            ORDER BY rr.created_at DESC
            LIMIT 100
        ');
        $stmt->execute([$userId]);
        
        Response::json(['items' => $stmt->fetchAll()]);
    }
    
    public static function createReviewRequest(): void {
        $userId = Auth::userIdOrFail();
        $body = get_json_body();
        $pdo = Database::conn();
        
        $contactId = $body['contact_id'] ?? null;
        $platformId = $body['platform_id'] ?? null;
        $channel = $body['channel'] ?? 'email';
        
        if (!$contactId) {
            Response::error('Contact ID is required', 422);
            return;
        }
        
        $stmt = $pdo->prepare('
            INSERT INTO review_requests 
            (user_id, client_id, contact_id, platform_id, channel, status, created_at)
            VALUES (?, ?, ?, ?, ?, ?, NOW())
        ');
        $stmt->execute([
            $userId,
            $body['client_id'] ?? null,
            $contactId,
            $platformId,
            $channel,
            'pending'
        ]);
        
        $id = (int)$pdo->lastInsertId();
        
        Response::json(['id' => $id, 'status' => 'pending'], 201);
    }
    
    public static function sendReviewRequest(string $id): void {
        $userId = Auth::userIdOrFail();
        $pdo = Database::conn();
        
        // Update status to sent
        $stmt = $pdo->prepare('
            UPDATE review_requests SET status = "sent", sent_at = NOW()
            WHERE id = ? AND user_id = ? AND status = "pending"
        ');
        $stmt->execute([$id, $userId]);
        
        // In production, this would actually send the email/SMS
        
        Response::json(['success' => true, 'message' => 'Review request sent']);
    }
    
    // ==================== TEMPLATES ====================
    
    public static function getTemplates(): void {
        $userId = Auth::userIdOrFail();
        $channel = $_GET['channel'] ?? null;
        $pdo = Database::conn();
        
        $sql = 'SELECT * FROM review_templates WHERE user_id = ?';
        $params = [$userId];
        
        if ($channel) {
            $sql .= ' AND channel = ?';
            $params[] = $channel;
        }
        
        $sql .= ' ORDER BY is_default DESC, name ASC';
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        
        Response::json(['items' => $stmt->fetchAll()]);
    }
    
    public static function createTemplate(): void {
        $userId = Auth::userIdOrFail();
        $body = get_json_body();
        $pdo = Database::conn();
        
        $name = trim($body['name'] ?? '');
        $content = trim($body['content'] ?? '');
        
        if (!$name || !$content) {
            Response::error('Name and content are required', 422);
            return;
        }
        
        $stmt = $pdo->prepare('
            INSERT INTO review_templates 
            (user_id, client_id, name, channel, subject, content, is_default, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
        ');
        $stmt->execute([
            $userId,
            $body['client_id'] ?? null,
            $name,
            $body['channel'] ?? 'email',
            $body['subject'] ?? null,
            $content,
            $body['is_default'] ?? false
        ]);
        
        $id = (int)$pdo->lastInsertId();
        $stmt = $pdo->prepare('SELECT * FROM review_templates WHERE id = ?');
        $stmt->execute([$id]);
        
        Response::json($stmt->fetch(), 201);
    }
    
    // ==================== DASHBOARD / ANALYTICS ====================
    
    public static function getDashboard(): void {
        $userId = Auth::userIdOrFail();
        $pdo = Database::conn();
        
        // Overall stats
        $stmt = $pdo->prepare('
            SELECT 
                COUNT(*) as total_reviews,
                AVG(rating) as avg_rating,
                SUM(CASE WHEN rating >= 4 THEN 1 ELSE 0 END) as positive_reviews,
                SUM(CASE WHEN rating <= 2 THEN 1 ELSE 0 END) as negative_reviews,
                SUM(CASE WHEN status = "new" THEN 1 ELSE 0 END) as new_reviews,
                SUM(CASE WHEN response IS NOT NULL THEN 1 ELSE 0 END) as responded_reviews
            FROM reviews
            WHERE user_id = ?
        ');
        $stmt->execute([$userId]);
        $stats = $stmt->fetch();
        
        // By platform
        $stmt = $pdo->prepare('
            SELECT p.platform, p.platform_name, COUNT(r.id) as review_count, AVG(r.rating) as avg_rating
            FROM review_platforms p
            LEFT JOIN reviews r ON r.platform_id = p.id
            WHERE p.user_id = ?
            GROUP BY p.id
        ');
        $stmt->execute([$userId]);
        $byPlatform = $stmt->fetchAll();
        
        // Recent reviews
        $stmt = $pdo->prepare('
            SELECT r.*, p.platform, p.platform_name
            FROM reviews r
            JOIN review_platforms p ON r.platform_id = p.id
            WHERE r.user_id = ?
            ORDER BY r.review_date DESC
            LIMIT 5
        ');
        $stmt->execute([$userId]);
        $recentReviews = $stmt->fetchAll();
        
        // Rating distribution
        $stmt = $pdo->prepare('
            SELECT rating, COUNT(*) as count
            FROM reviews
            WHERE user_id = ?
            GROUP BY rating
            ORDER BY rating DESC
        ');
        $stmt->execute([$userId]);
        $ratingDistribution = $stmt->fetchAll();
        
        Response::json([
            'stats' => $stats,
            'by_platform' => $byPlatform,
            'recent_reviews' => $recentReviews,
            'rating_distribution' => $ratingDistribution
        ]);
    }
    
    public static function getReputationScore(): void {
        $userId = Auth::userIdOrFail();
        $pdo = Database::conn();
        
        // Get latest score
        $stmt = $pdo->prepare('
            SELECT * FROM reputation_scores
            WHERE user_id = ?
            ORDER BY date DESC
            LIMIT 1
        ');
        $stmt->execute([$userId]);
        $latest = $stmt->fetch();
        
        // Get trend (last 30 days)
        $stmt = $pdo->prepare('
            SELECT date, overall_score, total_reviews, new_reviews
            FROM reputation_scores
            WHERE user_id = ? AND date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
            ORDER BY date ASC
        ');
        $stmt->execute([$userId]);
        $trend = $stmt->fetchAll();
        
        Response::json([
            'current' => $latest,
            'trend' => $trend
        ]);
    }
}
