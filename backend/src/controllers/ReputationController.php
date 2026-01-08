<?php
namespace Xordon\Controllers;

use Xordon\Database;
use Xordon\Response;
use Xordon\Services\ReviewIntegrationService;
use PDO;

class ReputationController {
    
    /**
     * Get reputation statistics for overview
     */
    public static function getStats() {
        try {
            $db = Database::conn();
            $workspaceId = $_SESSION['workspace_id'] ?? 1;
            
            // Get time range from query params (default 6 months)
            $timeRange = $_GET['timeRange'] ?? '6m';
            $interval = self::getIntervalFromRange($timeRange);
            
            // Current period stats
            $reviewsStmt = $db->prepare("
                SELECT COUNT(*) as total,
                       AVG(rating) as avg_rating
                FROM reviews 
                WHERE workspace_id = ? 
                AND review_date >= DATE_SUB(NOW(), INTERVAL $interval)
            ");
            $reviewsStmt->execute([$workspaceId]);
            $reviewsData = $reviewsStmt->fetch(PDO::FETCH_ASSOC);
            
            $totalReviews = (int)($reviewsData['total'] ?? 0);
            $avgRating = round((float)($reviewsData['avg_rating'] ?? 0), 1);
            
            // Previous period stats for change calculation
            $prevReviewsStmt = $db->prepare("
                SELECT COUNT(*) as total,
                       AVG(rating) as avg_rating
                FROM reviews 
                WHERE workspace_id = ? 
                AND review_date >= DATE_SUB(NOW(), INTERVAL 2 * $interval)
                AND review_date < DATE_SUB(NOW(), INTERVAL $interval)
            ");
            $prevReviewsStmt->execute([$workspaceId]);
            $prevReviewsData = $prevReviewsStmt->fetch(PDO::FETCH_ASSOC);
            
            $prevTotal = (int)($prevReviewsData['total'] ?? 0);
            $prevAvgRating = round((float)($prevReviewsData['avg_rating'] ?? 0), 1);
            
            $reviewsChange = $prevTotal > 0 ? round((($totalReviews - $prevTotal) / $prevTotal) * 100) : 0;
            $ratingChange = round($avgRating - $prevAvgRating, 1);
            
            // Get sentiment breakdown
            $sentimentStmt = $db->prepare("
                SELECT sentiment, COUNT(*) as count
                FROM reviews 
                WHERE workspace_id = ? 
                AND review_date >= DATE_SUB(NOW(), INTERVAL $interval)
                GROUP BY sentiment
            ");
            $sentimentStmt->execute([$workspaceId]);
            $sentimentData = $sentimentStmt->fetchAll(PDO::FETCH_ASSOC);
            
            $sentiment = [
                'positive' => 0,
                'neutral' => 0,
                'negative' => 0
            ];
            
            foreach ($sentimentData as $row) {
                if ($totalReviews > 0) {
                    $sentiment[$row['sentiment']] = round(($row['count'] / $totalReviews) * 100);
                }
            }
            
            // Get rating breakdown
            $ratingStmt = $db->prepare("
                SELECT FLOOR(rating) as rating_floor, COUNT(*) as count
                FROM reviews 
                WHERE workspace_id = ? 
                AND review_date >= DATE_SUB(NOW(), INTERVAL $interval)
                GROUP BY FLOOR(rating)
            ");
            $ratingStmt->execute([$workspaceId]);
            $ratingData = $ratingStmt->fetchAll(PDO::FETCH_ASSOC);
            
            $ratingBreakdown = [5 => 0, 4 => 0, 3 => 0, 2 => 0, 1 => 0];
            foreach ($ratingData as $row) {
                $ratingBreakdown[(int)$row['rating_floor']] = (int)$row['count'];
            }
            
            // Get review requests stats
            $requestsStmt = $db->prepare("
                SELECT COUNT(*) as sent,
                       SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed
                FROM review_requests 
                WHERE workspace_id = ? 
                AND created_at >= DATE_SUB(NOW(), INTERVAL $interval)
            ");
            $requestsStmt->execute([$workspaceId]);
            $requestsData = $requestsStmt->fetch(PDO::FETCH_ASSOC);
            
            // Get response rate
            $repliedStmt = $db->prepare("
                SELECT COUNT(*) as replied
                FROM reviews 
                WHERE workspace_id = ? 
                AND replied = TRUE
                AND review_date >= DATE_SUB(NOW(), INTERVAL $interval)
            ");
            $repliedStmt->execute([$workspaceId]);
            $repliedData = $repliedStmt->fetch(PDO::FETCH_ASSOC);
            
            $responseRate = $totalReviews > 0 ? round(($repliedData['replied'] / $totalReviews) * 100) : 0;
            
            $stats = [
                'invitesGoal' => 20,
                'invitesSent' => (int)($requestsData['sent'] ?? 0),
                'reviewsReceived' => $totalReviews,
                'reviewsChange' => $reviewsChange,
                'averageRating' => $avgRating,
                'ratingChange' => $ratingChange,
                'responseRate' => $responseRate,
                'sentiment' => $sentiment,
                'ratingBreakdown' => $ratingBreakdown
            ];
            
            return Response::json($stats);
            
        } catch (\Exception $e) {
            return Response::json(['error' => 'Failed to fetch stats', 'message' => $e->getMessage()], 500);
        }
    }
    
    /**
     * Get all reviews with filters
     */
    public static function getReviews() {
        try {
            $db = Database::conn();
            $workspaceId = $_SESSION['workspace_id'] ?? 1;
            
            // Get query parameters
            $platform = $_GET['platform'] ?? null;
            $rating = $_GET['rating'] ?? null;
            $sentiment = $_GET['sentiment'] ?? null;
            $search = $_GET['search'] ?? null;
            $page = (int)($_GET['page'] ?? 1);
            $limit = (int)($_GET['limit'] ?? 20);
            $offset = ($page - 1) * $limit;
            
            // Build WHERE clause
            $where = ['workspace_id = ?'];
            $params = [$workspaceId];
            
            if ($platform) {
                $where[] = 'platform = ?';
                $params[] = $platform;
            }
            
            if ($rating) {
                $where[] = 'FLOOR(rating) = ?';
                $params[] = $rating;
            }
            
            if ($sentiment) {
                $where[] = 'sentiment = ?';
                $params[] = $sentiment;
            }
            
            if ($search) {
                $where[] = '(author_name LIKE ? OR review_text LIKE ?)';
                $searchTerm = "%$search%";
                $params[] = $searchTerm;
                $params[] = $searchTerm;
            }
            
            $whereClause = implode(' AND ', $where);
            
            // Get total count
            $countStmt = $db->prepare("SELECT COUNT(*) as total FROM reviews WHERE $whereClause");
            $countStmt->execute($params);
            $total = (int)($countStmt->fetch(PDO::FETCH_ASSOC)['total'] ?? 0);
            
            // Get reviews
            $stmt = $db->prepare("
                SELECT * FROM reviews 
                WHERE $whereClause 
                ORDER BY review_date DESC 
                LIMIT ? OFFSET ?
            ");
            $finalParams = array_merge($params, [(int)$limit, (int)$offset]);
            $stmt->execute($finalParams);
            $reviews = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            return Response::json([
                'reviews' => $reviews,
                'total' => $total,
                'page' => $page,
                'limit' => $limit
            ]);
            
        } catch (\Exception $e) {
            return Response::json(['error' => 'Failed to fetch reviews', 'message' => $e->getMessage()], 500);
        }
    }
    
    /**
     * Get single review
     */
    public static function getReview($id) {
        try {
            $db = Database::conn();
            $workspaceId = $_SESSION['workspace_id'] ?? 1;
            
            $stmt = $db->prepare("SELECT * FROM reviews WHERE id = ? AND workspace_id = ?");
            $stmt->execute([$id, $workspaceId]);
            $review = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$review) {
                return Response::json(['error' => 'Review not found'], 404);
            }
            
            return Response::json($review);
            
        } catch (\Exception $e) {
            return Response::json(['error' => 'Failed to fetch review', 'message' => $e->getMessage()], 500);
        }
    }
    
    /**
     * Reply to a review
     */
    public static function replyToReview($id) {
        try {
            $db = Database::conn();
            $workspaceId = $_SESSION['workspace_id'] ?? 1;
            
            $input = json_decode(file_get_contents('php://input'), true);
            $replyText = $input['reply_text'] ?? '';
            
            if (empty($replyText)) {
                return Response::json(['error' => 'Reply text is required'], 400);
            }
            
            $stmt = $db->prepare("
                UPDATE reviews 
                SET reply_text = ?, 
                    reply_date = NOW(), 
                    replied = TRUE,
                    updated_at = NOW()
                WHERE id = ? AND workspace_id = ?
            ");
            $stmt->execute([$replyText, $id, $workspaceId]);
            
            // Get review details to check platform
            $getStmt = $db->prepare("SELECT * FROM reviews WHERE id = ? AND workspace_id = ?");
            $getStmt->execute([$id, $workspaceId]);
            $review = $getStmt->fetch(PDO::FETCH_ASSOC);
            
            if ($review) {
                // Post to external platform if supported
                try {
                    if ($review['platform'] === 'google') {
                        // Find platform config
                        $configStmt = $db->prepare("SELECT id FROM review_platform_configs WHERE workspace_id = ? AND platform = 'google' AND is_active = 1 LIMIT 1");
                        $configStmt->execute([$workspaceId]);
                        $config = $configStmt->fetch(PDO::FETCH_ASSOC);
                        if ($config) {
                            ReviewIntegrationService::replyToGoogleReview((int)$config['id'], $review['external_id'], $replyText);
                        }
                    } else if ($review['platform'] === 'facebook') {
                        // Find platform config
                        $configStmt = $db->prepare("SELECT id FROM review_platform_configs WHERE workspace_id = ? AND platform = 'facebook' AND is_active = 1 LIMIT 1");
                        $configStmt->execute([$workspaceId]);
                        $config = $configStmt->fetch(PDO::FETCH_ASSOC);
                        if ($config) {
                            \Xordon\Services\ReviewIntegrationService::replyToFacebookReview((int)$config['id'], $review['external_id'], $replyText);
                        }
                    }
                } catch (\Exception $e) {
                    // Log external posting failure but still return success for local update
                    // Logger::error('Failed to post reply to external platform: ' . $e->getMessage());
                }
            }
            
            return Response::json($review);
            
        } catch (\Exception $e) {
            return Response::json(['error' => 'Failed to reply to review', 'message' => $e->getMessage()], 500);
        }
    }
    
    /**
     * Update review (mark as spam, etc)
     */
    public static function updateReview($id) {
        try {
            $db = Database::conn();
            $workspaceId = $_SESSION['workspace_id'] ?? 1;
            
            $input = json_decode(file_get_contents('php://input'), true);
            
            $updates = [];
            $params = [];
            
            if (isset($input['is_spam'])) {
                $updates[] = 'is_spam = ?';
                $params[] = $input['is_spam'] ? 1 : 0;
            }
            
            if (empty($updates)) {
                return Response::json(['error' => 'No updates provided'], 400);
            }
            
            $updates[] = 'updated_at = NOW()';
            $updateClause = implode(', ', $updates);
            $params[] = $id;
            $params[] = $workspaceId;
            
            $stmt = $db->prepare("UPDATE reviews SET $updateClause WHERE id = ? AND workspace_id = ?");
            $stmt->execute($params);
            
            // Get updated review
            $getStmt = $db->prepare("SELECT * FROM reviews WHERE id = ? AND workspace_id = ?");
            $getStmt->execute([$id, $workspaceId]);
            $review = $getStmt->fetch(PDO::FETCH_ASSOC);
            
            return Response::json($review);
            
        } catch (\Exception $e) {
            return Response::json(['error' => 'Failed to update review', 'message' => $e->getMessage()], 500);
        }
    }
    
    /**
     * Delete review
     */
    public static function deleteReview($id) {
        try {
            $db = Database::conn();
            $workspaceId = $_SESSION['workspace_id'] ?? 1;
            
            $stmt = $db->prepare("DELETE FROM reviews WHERE id = ? AND workspace_id = ?");
            $stmt->execute([$id, $workspaceId]);
            
            return Response::json(['success' => true]);
            
        } catch (\Exception $e) {
            return Response::json(['error' => 'Failed to delete review', 'message' => $e->getMessage()], 500);
        }
    }
    
    /**
     * Convert time range to SQL interval
     */
    private static function getIntervalFromRange($range) {
        $intervals = [
            '1w' => '1 WEEK',
            '1m' => '1 MONTH',
            '3m' => '3 MONTH',
            '6m' => '6 MONTH',
            '1y' => '1 YEAR',
            'all' => '10 YEAR'
        ];
        
        return $intervals[$range] ?? '6 MONTH';
    }
}

