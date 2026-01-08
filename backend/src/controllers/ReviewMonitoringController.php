<?php

namespace Xordon\Controllers;

use Xordon\Core\Database;
use Xordon\Core\Auth;
use Xordon\Core\Response;

class ReviewMonitoringController {
    
    public static function connectPlatform() {
        $data = json_decode(file_get_contents('php://input'), true);
        $ctx = $GLOBALS['tenantContext'] ?? null;
        
        if (!$ctx || !isset($ctx->workspaceId)) {
            return Response::error('Unauthorized', 401);
        }
        
        $platform = $data['platform'] ?? null;
        $platformName = $data['platform_name'] ?? null;
        
        if (!$platform || !$platformName) {
            return Response::error('Platform and platform_name required', 400);
        }
        
        $db = Database::conn();
        
        $stmt = $db->prepare("
            INSERT INTO review_platform_connections 
            (workspace_id, company_id, platform, platform_name, review_url, location_id, page_id, business_id, api_key, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')
        ");
        
        $stmt->execute([
            $ctx->workspaceId,
            $ctx->activeCompanyId ?? null,
            $platform,
            $platformName,
            $data['review_url'] ?? null,
            $data['location_id'] ?? null,
            $data['page_id'] ?? null,
            $data['business_id'] ?? null,
            $data['api_key'] ?? null
        ]);
        
        $connectionId = $db->lastInsertId();
        
        $stmt = $db->prepare("SELECT * FROM review_platform_connections WHERE id = ?");
        $stmt->execute([$connectionId]);
        $connection = $stmt->fetch(\PDO::FETCH_ASSOC);
        
        return Response::success($connection);
    }
    
    public static function listConnections() {
        $ctx = $GLOBALS['tenantContext'] ?? null;
        if (!$ctx || !isset($ctx->workspaceId)) {
            return Response::error('Unauthorized', 401);
        }
        
        $db = Database::conn();
        
        $stmt = $db->prepare("
            SELECT c.*, 
                   COUNT(r.id) as review_count,
                   AVG(r.rating) as avg_rating
            FROM review_platform_connections c
            LEFT JOIN external_reviews r ON r.connection_id = c.id
            WHERE c.workspace_id = ?
            GROUP BY c.id
            ORDER BY c.created_at DESC
        ");
        $stmt->execute([$ctx->workspaceId]);
        $connections = $stmt->fetchAll(\PDO::FETCH_ASSOC);
        
        return Response::success(['items' => $connections]);
    }
    
    public static function updateConnection($id) {
        $data = json_decode(file_get_contents('php://input'), true);
        $ctx = $GLOBALS['tenantContext'] ?? null;
        
        if (!$ctx || !isset($ctx->workspaceId)) {
            return Response::error('Unauthorized', 401);
        }
        
        $db = Database::conn();
        
        $fields = [];
        $params = [];
        
        $allowedFields = ['platform_name', 'status', 'review_url', 'location_id', 'page_id', 'business_id', 'api_key', 'sync_frequency_minutes'];
        
        foreach ($allowedFields as $field) {
            if (isset($data[$field])) {
                $fields[] = "$field = ?";
                $params[] = $data[$field];
            }
        }
        
        if (empty($fields)) {
            return Response::error('No fields to update', 400);
        }
        
        $params[] = $id;
        $params[] = $ctx->workspaceId;
        
        $sql = "UPDATE review_platform_connections SET " . implode(', ', $fields) . " WHERE id = ? AND workspace_id = ?";
        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        
        $stmt = $db->prepare("SELECT * FROM review_platform_connections WHERE id = ? AND workspace_id = ?");
        $stmt->execute([$id, $ctx->workspaceId]);
        $connection = $stmt->fetch(\PDO::FETCH_ASSOC);
        
        return Response::success($connection);
    }
    
    public static function deleteConnection($id) {
        $ctx = $GLOBALS['tenantContext'] ?? null;
        if (!$ctx || !isset($ctx->workspaceId)) {
            return Response::error('Unauthorized', 401);
        }
        
        $db = Database::conn();
        
        $stmt = $db->prepare("DELETE FROM review_platform_connections WHERE id = ? AND workspace_id = ?");
        $stmt->execute([$id, $ctx->workspaceId]);
        
        return Response::success(['deleted' => true]);
    }
    
    public static function listReviews() {
        $ctx = $GLOBALS['tenantContext'] ?? null;
        if (!$ctx || !isset($ctx->workspaceId)) {
            return Response::error('Unauthorized', 401);
        }
        
        $status = $_GET['status'] ?? null;
        $sentiment = $_GET['sentiment'] ?? null;
        $platform = $_GET['platform'] ?? null;
        $limit = (int)($_GET['limit'] ?? 50);
        $offset = (int)($_GET['offset'] ?? 0);
        
        $db = Database::conn();
        
        $sql = "SELECT * FROM external_reviews WHERE workspace_id = ?";
        $params = [$ctx->workspaceId];
        
        if ($status) {
            $sql .= " AND status = ?";
            $params[] = $status;
        }
        
        if ($sentiment) {
            $sql .= " AND sentiment = ?";
            $params[] = $sentiment;
        }
        
        if ($platform) {
            $sql .= " AND platform = ?";
            $params[] = $platform;
        }
        
        $sql .= " ORDER BY review_date DESC LIMIT ? OFFSET ?";
        $params[] = $limit;
        $params[] = $offset;
        
        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        $reviews = $stmt->fetchAll(\PDO::FETCH_ASSOC);
        
        return Response::success(['items' => $reviews]);
    }
    
    public static function getReview($id) {
        $ctx = $GLOBALS['tenantContext'] ?? null;
        if (!$ctx || !isset($ctx->workspaceId)) {
            return Response::error('Unauthorized', 401);
        }
        
        $db = Database::conn();
        
        $stmt = $db->prepare("SELECT * FROM external_reviews WHERE id = ? AND workspace_id = ?");
        $stmt->execute([$id, $ctx->workspaceId]);
        $review = $stmt->fetch(\PDO::FETCH_ASSOC);
        
        if (!$review) {
            return Response::error('Review not found', 404);
        }
        
        return Response::success($review);
    }
    
    public static function respondToReview($id) {
        $data = json_decode(file_get_contents('php://input'), true);
        $ctx = $GLOBALS['tenantContext'] ?? null;
        
        if (!$ctx || !isset($ctx->workspaceId)) {
            return Response::error('Unauthorized', 401);
        }
        
        $response = $data['response'] ?? null;
        if (!$response) {
            return Response::error('Response text required', 400);
        }
        
        $db = Database::conn();
        
        $stmt = $db->prepare("
            UPDATE external_reviews 
            SET response_text = ?, response_date = NOW(), responded_by = ?, status = 'responded', has_response = 1
            WHERE id = ? AND workspace_id = ?
        ");
        $stmt->execute([$response, Auth::userId(), $id, $ctx->workspaceId]);
        
        // TODO: Submit response to actual platform API (GMB, Facebook, etc.)
        
        return self::getReview($id);
    }
    
    public static function updateReviewStatus($id) {
        $data = json_decode(file_get_contents('php://input'), true);
        $ctx = $GLOBALS['tenantContext'] ?? null;
        
        if (!$ctx || !isset($ctx->workspaceId)) {
            return Response::error('Unauthorized', 401);
        }
        
        $status = $data['status'] ?? null;
        if (!$status) {
            return Response::error('Status required', 400);
        }
        
        $db = Database::conn();
        
        $stmt = $db->prepare("UPDATE external_reviews SET status = ? WHERE id = ? AND workspace_id = ?");
        $stmt->execute([$status, $id, $ctx->workspaceId]);
        
        return self::getReview($id);
    }
    
    public static function getDashboard() {
        $ctx = $GLOBALS['tenantContext'] ?? null;
        if (!$ctx || !isset($ctx->workspaceId)) {
            return Response::error('Unauthorized', 401);
        }
        
        $db = Database::conn();
        
        // Overall stats
        $stmt = $db->prepare("
            SELECT 
                COUNT(*) as total_reviews,
                AVG(rating) as avg_rating,
                SUM(CASE WHEN sentiment = 'positive' THEN 1 ELSE 0 END) as positive_reviews,
                SUM(CASE WHEN sentiment = 'negative' THEN 1 ELSE 0 END) as negative_reviews,
                SUM(CASE WHEN status = 'new' THEN 1 ELSE 0 END) as new_reviews,
                SUM(CASE WHEN has_response = 1 THEN 1 ELSE 0 END) as responded_reviews
            FROM external_reviews
            WHERE workspace_id = ?
        ");
        $stmt->execute([$ctx->workspaceId]);
        $stats = $stmt->fetch(\PDO::FETCH_ASSOC);
        
        // Rating distribution
        $stmt = $db->prepare("
            SELECT rating, COUNT(*) as count
            FROM external_reviews
            WHERE workspace_id = ?
            GROUP BY rating
            ORDER BY rating DESC
        ");
        $stmt->execute([$ctx->workspaceId]);
        $ratingDistribution = $stmt->fetchAll(\PDO::FETCH_ASSOC);
        
        // Recent reviews
        $stmt = $db->prepare("
            SELECT * FROM external_reviews
            WHERE workspace_id = ?
            ORDER BY review_date DESC
            LIMIT 10
        ");
        $stmt->execute([$ctx->workspaceId]);
        $recentReviews = $stmt->fetchAll(\PDO::FETCH_ASSOC);
        
        return Response::success([
            'stats' => $stats,
            'rating_distribution' => $ratingDistribution,
            'recent_reviews' => $recentReviews
        ]);
    }
    
    public static function listTemplates() {
        $ctx = $GLOBALS['tenantContext'] ?? null;
        if (!$ctx || !isset($ctx->workspaceId)) {
            return Response::error('Unauthorized', 401);
        }
        
        $db = Database::conn();
        
        $stmt = $db->prepare("SELECT * FROM review_response_templates WHERE workspace_id = ? AND is_active = 1 ORDER BY usage_count DESC");
        $stmt->execute([$ctx->workspaceId]);
        $templates = $stmt->fetchAll(\PDO::FETCH_ASSOC);
        
        return Response::success($templates);
    }
    
    public static function createTemplate() {
        $data = json_decode(file_get_contents('php://input'), true);
        $ctx = $GLOBALS['tenantContext'] ?? null;
        
        if (!$ctx || !isset($ctx->workspaceId)) {
            return Response::error('Unauthorized', 401);
        }
        
        $db = Database::conn();
        
        $stmt = $db->prepare("
            INSERT INTO review_response_templates (workspace_id, name, category, template_text)
            VALUES (?, ?, ?, ?)
        ");
        $stmt->execute([
            $ctx->workspaceId,
            $data['name'],
            $data['category'] ?? 'general',
            $data['template_text']
        ]);
        
        $templateId = $db->lastInsertId();
        
        $stmt = $db->prepare("SELECT * FROM review_response_templates WHERE id = ?");
        $stmt->execute([$templateId]);
        $template = $stmt->fetch(\PDO::FETCH_ASSOC);
        
        return Response::success($template);
    }
    
    public static function syncReviews($connectionId) {
        $ctx = $GLOBALS['tenantContext'] ?? null;
        if (!$ctx || !isset($ctx->workspaceId)) {
            return Response::error('Unauthorized', 401);
        }
        
        $db = Database::conn();
        
        $stmt = $db->prepare("SELECT * FROM review_platform_connections WHERE id = ? AND workspace_id = ?");
        $stmt->execute([$connectionId, $ctx->workspaceId]);
        $connection = $stmt->fetch(\PDO::FETCH_ASSOC);
        
        if (!$connection) {
            return Response::error('Connection not found', 404);
        }
        
        // TODO: Implement actual API polling for each platform
        // For now, just update last_sync_at
        $stmt = $db->prepare("UPDATE review_platform_connections SET last_sync_at = NOW() WHERE id = ?");
        $stmt->execute([$connectionId]);
        
        return Response::success(['synced' => true, 'message' => 'Sync initiated']);
    }
}
