<?php
/**
 * Social Media Controller
 * Manage social media accounts, content scheduling, and cross-platform posting
 */

require_once __DIR__ . '/../Database.php';
require_once __DIR__ . '/../Response.php';
require_once __DIR__ . '/../Auth.php';
require_once __DIR__ . '/../Permissions.php';

class SocialMediaController {
    private static function getWorkspaceId(): int {
        return Permissions::getWorkspaceId();
    }

    private static function getUserId(): int {
        return Permissions::getUserId();
    }

    private static function getCompanyId(): ?int {
        try {
            return Permissions::requireActiveCompany();
        } catch (Exception $e) {
            return null;
        }
    }

    // ==================== ACCOUNTS ====================

    public static function getAccounts() {
        try {
            $workspaceId = self::getWorkspaceId();
            $companyId = self::getCompanyId();
            $db = Database::conn();

            $stmt = $db->prepare("
                SELECT * FROM social_accounts 
                WHERE workspace_id = ? AND (company_id = ? OR company_id IS NULL)
                ORDER BY platform ASC, name ASC
            ");
            $stmt->execute([$workspaceId, $companyId]);
            
            return Response::json(['data' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
        } catch (Exception $e) {
            return Response::error('Failed to fetch social accounts: ' . $e->getMessage());
        }
    }

    public static function addAccount() {
        try {
            Permissions::require('growth.marketing.manage');
            $workspaceId = self::getWorkspaceId();
            $companyId = self::getCompanyId();
            $userId = self::getUserId();
            $db = Database::conn();
            $data = json_decode(file_get_contents('php://input'), true) ?? [];

            if (empty($data['platform']) || empty($data['external_id']) || empty($data['name'])) {
                return Response::error('platform, external_id, and name required', 400);
            }

            $stmt = $db->prepare("
                INSERT INTO social_accounts 
                (workspace_id, company_id, platform, external_id, name, avatar_url, 
                 access_token, refresh_token, token_expires_at, status)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ");
            $stmt->execute([
                $workspaceId,
                $companyId,
                $data['platform'],
                $data['external_id'],
                $data['name'],
                $data['avatar_url'] ?? null,
                $data['access_token'] ?? null,
                $data['refresh_token'] ?? null,
                $data['expires_at'] ?? null,
                'active'
            ]);

            return Response::json(['data' => ['id' => (int)$db->lastInsertId()]]);
        } catch (Exception $e) {
            return Response::error('Failed to add social account: ' . $e->getMessage());
        }
    }

    // ==================== POSTS ====================

    public static function getPosts() {
        try {
            $workspaceId = self::getWorkspaceId();
            $companyId = self::getCompanyId();
            $db = Database::conn();

            $where = ['workspace_id = ?'];
            $params = [$workspaceId];

            if ($companyId) {
                $where[] = "company_id = ?";
                $params[] = $companyId;
            }

            if (!empty($_GET['status'])) {
                $where[] = 'status = ?';
                $params[] = $_GET['status'];
            }

            $whereClause = implode(' AND ', $where);

            $stmt = $db->prepare("
                SELECT p.*, 
                    u.name as created_by_name,
                    (SELECT COUNT(*) FROM social_post_queue WHERE post_id = p.id) as distribution_count,
                    (SELECT COUNT(*) FROM social_post_queue WHERE post_id = p.id AND status = 'published') as published_count
                FROM social_posts p
                LEFT JOIN users u ON u.id = p.created_by
                WHERE $whereClause
                ORDER BY p.created_at DESC
            ");
            $stmt->execute($params);
            
            return Response::json(['data' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
        } catch (Exception $e) {
            return Response::error('Failed to fetch social posts: ' . $e->getMessage());
        }
    }

    public static function createPost() {
        try {
            Permissions::require('growth.marketing.manage');
            $workspaceId = self::getWorkspaceId();
            $companyId = self::getCompanyId();
            $userId = self::getUserId();
            $db = Database::conn();
            $data = json_decode(file_get_contents('php://input'), true) ?? [];

            if (empty($data['content'])) {
                return Response::error('content required', 400);
            }

            $db->beginTransaction();

            try {
                // 1. Create the main post record
                $stmt = $db->prepare("
                    INSERT INTO social_posts 
                    (workspace_id, company_id, content, media_urls, status, created_by)
                    VALUES (?, ?, ?, ?, ?, ?)
                ");
                $stmt->execute([
                    $workspaceId,
                    $companyId,
                    $data['content'],
                    isset($data['media_urls']) ? json_encode($data['media_urls']) : null,
                    'draft',
                    $userId
                ]);
                $postId = (int)$db->lastInsertId();

                // 2. Queue for specific platforms/accounts if provided
                if (!empty($data['accounts']) && !empty($data['scheduled_for'])) {
                    $queueStmt = $db->prepare("
                        INSERT INTO social_post_queue 
                        (workspace_id, company_id, post_id, account_id, platform, scheduled_for, status)
                        VALUES (?, ?, ?, ?, ?, ?, ?)
                    ");
                    foreach ($data['accounts'] as $acc) {
                        $queueStmt->execute([
                            $workspaceId,
                            $companyId,
                            $postId,
                            $acc['id'],
                            $acc['platform'],
                            $data['scheduled_for'],
                            'pending'
                        ]);
                    }
                    
                    // Update main status to scheduled
                    $db->prepare("UPDATE social_posts SET status = 'scheduled' WHERE id = ?")->execute([$postId]);
                }

                $db->commit();
                return Response::json(['data' => ['id' => $postId]]);
            } catch (Exception $e) {
                $db->rollBack();
                throw $e;
            }
        } catch (Exception $e) {
            return Response::error('Failed to create post: ' . $e->getMessage());
        }
    }

    // ==================== CALENDAR ====================

    public static function getCalendar() {
        try {
            $workspaceId = self::getWorkspaceId();
            $companyId = self::getCompanyId();
            $db = Database::conn();

            $stmt = $db->prepare("
                SELECT * FROM social_content_calendar 
                WHERE workspace_id = ? AND (company_id = ? OR company_id IS NULL)
                ORDER BY planned_date ASC
            ");
            $stmt->execute([$workspaceId, $companyId]);
            
            return Response::json(['data' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
        } catch (Exception $e) {
            return Response::error('Failed to fetch calendar: ' . $e->getMessage());
        }
    }

    public static function addToCalendar() {
        try {
            Permissions::require('growth.marketing.manage');
            $workspaceId = self::getWorkspaceId();
            $companyId = self::getCompanyId();
            $db = Database::conn();
            $data = json_decode(file_get_contents('php://input'), true) ?? [];

            if (empty($data['title']) || empty($data['planned_date'])) {
                return Response::error('title and planned_date required', 400);
            }

            $stmt = $db->prepare("
                INSERT INTO social_content_calendar 
                (workspace_id, company_id, title, content_type, planned_date, platforms, notes, status, color)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ");
            $stmt->execute([
                $workspaceId,
                $companyId,
                $data['title'],
                $data['content_type'] ?? 'post',
                $data['planned_date'],
                isset($data['platforms']) ? json_encode($data['platforms']) : null,
                $data['notes'] ?? null,
                $data['status'] ?? 'idea',
                $data['color'] ?? '#3b82f6'
            ]);

            return Response::json(['data' => ['id' => (int)$db->lastInsertId()]]);
        } catch (Exception $e) {
            return Response::error('Failed to add to calendar: ' . $e->getMessage());
        }
    }

    // ==================== METRICS ====================

    public static function getAnalytics() {
        try {
            $workspaceId = self::getWorkspaceId();
            $companyId = self::getCompanyId();
            $db = Database::conn();

            // Aggregate metrics across all published posts
            $stmt = $db->prepare("
                SELECT 
                    platform,
                    SUM(likes) as total_likes,
                    SUM(comments) as total_comments,
                    SUM(shares) as total_shares,
                    SUM(reach) as total_reach,
                    SUM(impressions) as total_impressions,
                    AVG(engagement_rate) as avg_engagement
                FROM social_post_metrics m
                JOIN social_posts p ON p.id = m.post_id
                WHERE p.workspace_id = ? AND (p.company_id = ? OR p.company_id IS NULL)
                GROUP BY platform
            ");
            $stmt->execute([$workspaceId, $companyId]);
            
            return Response::json(['data' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
        } catch (Exception $e) {
            return Response::error('Failed to fetch analytics: ' . $e->getMessage());
        }
    }
}
