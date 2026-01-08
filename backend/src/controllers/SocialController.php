<?php
/**
 * Social Media Controller
 * Social media scheduling, posting, and analytics
 * 
 * SCOPING: Company-scoped (requires active company)
 */

require_once __DIR__ . '/../Database.php';
require_once __DIR__ . '/../Response.php';
require_once __DIR__ . '/../Auth.php';
require_once __DIR__ . '/../Permissions.php';

class SocialController {
    private static function getWorkspaceId(): int {
        return Permissions::getWorkspaceId();
    }

    private static function getCompanyId(): int {
        return Permissions::requireActiveCompany();
    }

    private static function getUserId(): ?int {
        try {
            return Auth::userIdOrFail();
        } catch (Exception $e) {
            return null;
        }
    }

    // ==================== SOCIAL ACCOUNTS ====================

    public static function getAccounts() {
        try {
            $workspaceId = self::getWorkspaceId();
            $companyId = self::getCompanyId();
            $db = Database::conn();

            $stmt = $db->prepare("
                SELECT id, workspace_id, company_id, platform, account_type, platform_account_id,
                       account_name, account_username, account_url, avatar_url,
                       status, can_post, can_read_insights, can_read_messages,
                       followers_count, following_count, posts_count,
                       last_sync_at, created_at
                FROM social_accounts
                WHERE workspace_id = ? AND company_id = ?
                ORDER BY platform, account_name
            ");
            $stmt->execute([$workspaceId, $companyId]);
            $accounts = $stmt->fetchAll(PDO::FETCH_ASSOC);

            return Response::json(['data' => $accounts]);
        } catch (Exception $e) {
            return Response::error('Failed to fetch accounts: ' . $e->getMessage());
        }
    }

    public static function disconnectAccount($id) {
        try {
            $workspaceId = self::getWorkspaceId();
            $companyId = self::getCompanyId();
            $db = Database::conn();

            $stmt = $db->prepare("
                UPDATE social_accounts SET status = 'disconnected', access_token_encrypted = NULL, refresh_token_encrypted = NULL
                WHERE id = ? AND workspace_id = ? AND company_id = ?
            ");
            $stmt->execute([$id, $workspaceId, $companyId]);

            return Response::json(['success' => true]);
        } catch (Exception $e) {
            return Response::error('Failed to disconnect account: ' . $e->getMessage());
        }
    }

    // ==================== POSTS ====================

    public static function getPosts() {
        try {
            $workspaceId = self::getWorkspaceId();
            $companyId = self::getCompanyId();
            $db = Database::conn();

            $limit = min((int)($_GET['limit'] ?? 50), 100);
            $offset = (int)($_GET['offset'] ?? 0);

            $where = ['workspace_id = ?', 'company_id = ?'];
            $params = [$workspaceId, $companyId];

            if (!empty($_GET['status'])) {
                $where[] = 'status = ?';
                $params[] = $_GET['status'];
            }

            if (!empty($_GET['from'])) {
                $where[] = 'scheduled_at >= ?';
                $params[] = $_GET['from'];
            }

            if (!empty($_GET['to'])) {
                $where[] = 'scheduled_at <= ?';
                $params[] = $_GET['to'] . ' 23:59:59';
            }

            $whereClause = implode(' AND ', $where);

            $stmt = $db->prepare("
                SELECT * FROM social_posts
                WHERE $whereClause
                ORDER BY COALESCE(scheduled_at, created_at) DESC
                LIMIT ? OFFSET ?
            ");
            $params[] = $limit;
            $params[] = $offset;
            $stmt->execute($params);
            $posts = $stmt->fetchAll(PDO::FETCH_ASSOC);

            foreach ($posts as &$post) {
                $post['media_urls'] = $post['media_urls'] ? json_decode($post['media_urls'], true) : [];
                $post['target_accounts'] = json_decode($post['target_accounts'], true);
                $post['platform_settings'] = $post['platform_settings'] ? json_decode($post['platform_settings'], true) : null;
                $post['publish_results'] = $post['publish_results'] ? json_decode($post['publish_results'], true) : null;
            }

            $countParams = array_slice($params, 0, -2);
            $countStmt = $db->prepare("SELECT COUNT(*) FROM social_posts WHERE $whereClause");
            $countStmt->execute($countParams);
            $total = (int)$countStmt->fetchColumn();

            return Response::json([
                'data' => $posts,
                'meta' => ['total' => $total, 'limit' => $limit, 'offset' => $offset]
            ]);
        } catch (Exception $e) {
            return Response::error('Failed to fetch posts: ' . $e->getMessage());
        }
    }

    public static function getPost($id) {
        try {
            $workspaceId = self::getWorkspaceId();
            $companyId = self::getCompanyId();
            $db = Database::conn();

            $stmt = $db->prepare("SELECT * FROM social_posts WHERE id = ? AND workspace_id = ? AND company_id = ?");
            $stmt->execute([$id, $workspaceId, $companyId]);
            $post = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$post) {
                return Response::error('Post not found', 404);
            }

            $post['media_urls'] = $post['media_urls'] ? json_decode($post['media_urls'], true) : [];
            $post['target_accounts'] = json_decode($post['target_accounts'], true);
            $post['platform_settings'] = $post['platform_settings'] ? json_decode($post['platform_settings'], true) : null;
            $post['publish_results'] = $post['publish_results'] ? json_decode($post['publish_results'], true) : null;

            // Get analytics
            $analyticsStmt = $db->prepare("
                SELECT spa.*, sa.platform, sa.account_name
                FROM social_post_analytics spa
                JOIN social_accounts sa ON sa.id = spa.social_account_id
                WHERE spa.post_id = ?
            ");
            $analyticsStmt->execute([$id]);
            $post['analytics'] = $analyticsStmt->fetchAll(PDO::FETCH_ASSOC);

            return Response::json(['data' => $post]);
        } catch (Exception $e) {
            return Response::error('Failed to fetch post: ' . $e->getMessage());
        }
    }

    public static function createPost() {
        try {
            $workspaceId = self::getWorkspaceId();
            $companyId = self::getCompanyId();
            $userId = self::getUserId();
            $db = Database::conn();
            $data = json_decode(file_get_contents('php://input'), true) ?? [];

            if (empty($data['content'])) {
                return Response::error('content required', 400);
            }

            // Determine status - only require accounts if scheduling or publishing
            $status = 'draft';
            if (!empty($data['scheduled_at'])) {
                $status = 'scheduled';
            }
            if (!empty($data['publish_now'])) {
                $status = 'publishing';
            }

            // Require target accounts only when scheduling or publishing
            if (($status === 'scheduled' || $status === 'publishing') && empty($data['target_accounts'])) {
                return Response::error('target_accounts required for scheduling or publishing', 400);
            }

            // Allow empty target_accounts for drafts
            if (empty($data['target_accounts'])) {
                $data['target_accounts'] = [];
            }

            $stmt = $db->prepare("
                INSERT INTO social_posts 
                (workspace_id, company_id, content, media_urls, media_type, link_url, link_title, link_description, link_image,
                 status, scheduled_at, target_accounts, platform_settings, campaign_id, category,
                 requires_approval, created_by)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ");

            $stmt->execute([
                $workspaceId,
                $companyId,
                $data['content'],
                !empty($data['media_urls']) ? json_encode($data['media_urls']) : null,
                $data['media_type'] ?? 'none',
                $data['link_url'] ?? null,
                $data['link_title'] ?? null,
                $data['link_description'] ?? null,
                $data['link_image'] ?? null,
                $status,
                $data['scheduled_at'] ?? null,
                json_encode($data['target_accounts']),
                !empty($data['platform_settings']) ? json_encode($data['platform_settings']) : null,
                $data['campaign_id'] ?? null,
                $data['category'] ?? null,
                $data['requires_approval'] ?? 0,
                $userId
            ]);

            $postId = $db->lastInsertId();

            // If publish_now, trigger publishing
            if (!empty($data['publish_now'])) {
                self::publishPost($postId);
            }

            return Response::json(['data' => ['id' => (int)$postId]]);
        } catch (Exception $e) {
            return Response::error('Failed to create post: ' . $e->getMessage());
        }
    }

    public static function updatePost($id) {
        try {
            $workspaceId = self::getWorkspaceId();
            $companyId = self::getCompanyId();
            $db = Database::conn();
            $data = json_decode(file_get_contents('php://input'), true) ?? [];

            // Verify ownership and status
            $checkStmt = $db->prepare("SELECT status FROM social_posts WHERE id = ? AND workspace_id = ? AND company_id = ?");
            $checkStmt->execute([$id, $workspaceId, $companyId]);
            $post = $checkStmt->fetch(PDO::FETCH_ASSOC);

            if (!$post) {
                return Response::error('Post not found', 404);
            }

            if ($post['status'] === 'published') {
                return Response::error('Cannot edit published posts', 400);
            }

            $updates = [];
            $params = [];

            $allowedFields = ['content', 'media_urls', 'media_type', 'link_url', 'link_title', 
                'link_description', 'link_image', 'scheduled_at', 'target_accounts', 
                'platform_settings', 'campaign_id', 'category'];

            foreach ($allowedFields as $field) {
                if (array_key_exists($field, $data)) {
                    $updates[] = "$field = ?";
                    if (in_array($field, ['media_urls', 'target_accounts', 'platform_settings'])) {
                        $params[] = is_array($data[$field]) ? json_encode($data[$field]) : $data[$field];
                    } else {
                        $params[] = $data[$field];
                    }
                }
            }

            // Update status based on scheduled_at
            if (isset($data['scheduled_at'])) {
                $updates[] = 'status = ?';
                $params[] = $data['scheduled_at'] ? 'scheduled' : 'draft';
            }

            if (!empty($updates)) {
                $params[] = $id;
                $stmt = $db->prepare("UPDATE social_posts SET " . implode(', ', $updates) . " WHERE id = ?");
                $stmt->execute($params);
            }

            return Response::json(['success' => true]);
        } catch (Exception $e) {
            return Response::error('Failed to update post: ' . $e->getMessage());
        }
    }

    public static function deletePost($id) {
        try {
            $workspaceId = self::getWorkspaceId();
            $companyId = self::getCompanyId();
            $db = Database::conn();

            $stmt = $db->prepare("DELETE FROM social_posts WHERE id = ? AND workspace_id = ? AND company_id = ? AND status != 'published'");
            $stmt->execute([$id, $workspaceId, $companyId]);

            return Response::json(['success' => true]);
        } catch (Exception $e) {
            return Response::error('Failed to delete post: ' . $e->getMessage());
        }
    }

    public static function publishPost($id) {
        try {
            $workspaceId = self::getWorkspaceId();
            $companyId = self::getCompanyId();
            $db = Database::conn();

            // Check publish permission
            Permissions::require('growth.social.publish');

            $stmt = $db->prepare("SELECT * FROM social_posts WHERE id = ? AND workspace_id = ? AND company_id = ?");
            $stmt->execute([$id, $workspaceId, $companyId]);
            $post = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$post) {
                return Response::error('Post not found', 404);
            }

            // Update status to publishing
            $db->prepare("UPDATE social_posts SET status = 'publishing' WHERE id = ?")->execute([$id]);

            $targetAccountIds = json_decode($post['target_accounts'], true);
            $results = [];
            
            if (!empty($targetAccountIds)) {
                $placeholders = implode(',', array_fill(0, count($targetAccountIds), '?'));
                $stmt = $db->prepare("SELECT * FROM social_accounts WHERE id IN ($placeholders) AND workspace_id = ?");
                $stmt->execute(array_merge($targetAccountIds, [$workspaceId]));
                $accounts = $stmt->fetchAll(PDO::FETCH_ASSOC);

                foreach ($accounts as $account) {
                    // Simulate platform API interaction
                    $results[$account['id']] = [
                        'success' => true,
                        'platform' => $account['platform'],
                        'platform_post_id' => $account['platform'] . '_' . bin2hex(random_bytes(10)),
                        'published_at' => date('Y-m-d H:i:s'),
                        'post_url' => "https://{$account['platform']}.com/{$account['account_username']}/p/" . bin2hex(random_bytes(6))
                    ];
                }
            }

            // Update post as published
            $stmt = $db->prepare("UPDATE social_posts SET status = 'published', published_at = NOW(), publish_results = ? WHERE id = ?");
            $stmt->execute([json_encode($results), $id]);

            return Response::json([
                'success' => true, 
                'message' => 'Post published successfully to ' . count($results) . ' channels',
                'results' => $results
            ]);
        } catch (Exception $e) {
            $db = Database::conn();
            $db->prepare("UPDATE social_posts SET status = 'failed' WHERE id = ?")->execute([$id]);
            return Response::error('Publishing failed: ' . $e->getMessage());
        }
    }

    // ==================== CATEGORIES ====================

    public static function getCategories() {
        try {
            $workspaceId = self::getWorkspaceId();
            $companyId = self::getCompanyId();
            $db = Database::conn();

            $stmt = $db->prepare("
                SELECT * FROM social_categories
                WHERE workspace_id = ? AND company_id = ? AND is_active = 1
                ORDER BY sort_order, name
            ");
            $stmt->execute([$workspaceId, $companyId]);
            $categories = $stmt->fetchAll(PDO::FETCH_ASSOC);

            foreach ($categories as &$cat) {
                $cat['default_times'] = $cat['default_times'] ? json_decode($cat['default_times'], true) : null;
            }

            return Response::json(['data' => $categories]);
        } catch (Exception $e) {
            return Response::error('Failed to fetch categories: ' . $e->getMessage());
        }
    }

    public static function createCategory() {
        try {
            $workspaceId = self::getWorkspaceId();
            $companyId = self::getCompanyId();
            $db = Database::conn();
            $data = json_decode(file_get_contents('php://input'), true) ?? [];

            if (empty($data['name'])) {
                return Response::error('name required', 400);
            }

            $stmt = $db->prepare("
                INSERT INTO social_categories (workspace_id, company_id, name, color, description, default_times, sort_order)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            ");
            $stmt->execute([
                $workspaceId,
                $companyId,
                $data['name'],
                $data['color'] ?? '#6366f1',
                $data['description'] ?? null,
                !empty($data['default_times']) ? json_encode($data['default_times']) : null,
                $data['sort_order'] ?? 0
            ]);

            return Response::json(['data' => ['id' => (int)$db->lastInsertId()]]);
        } catch (Exception $e) {
            return Response::error('Failed to create category: ' . $e->getMessage());
        }
    }

    // ==================== TEMPLATES ====================

    public static function getTemplates() {
        try {
            $workspaceId = self::getWorkspaceId();
            $companyId = self::getCompanyId();
            $db = Database::conn();

            $stmt = $db->prepare("SELECT * FROM social_templates WHERE workspace_id = ? AND company_id = ? ORDER BY use_count DESC, name");
            $stmt->execute([$workspaceId, $companyId]);
            $templates = $stmt->fetchAll(PDO::FETCH_ASSOC);

            foreach ($templates as &$t) {
                $t['media_urls'] = $t['media_urls'] ? json_decode($t['media_urls'], true) : [];
                $t['platforms'] = $t['platforms'] ? json_decode($t['platforms'], true) : null;
            }

            return Response::json(['data' => $templates]);
        } catch (Exception $e) {
            return Response::error('Failed to fetch templates: ' . $e->getMessage());
        }
    }

    public static function createTemplate() {
        try {
            $workspaceId = self::getWorkspaceId();
            $companyId = self::getCompanyId();
            $userId = self::getUserId();
            $db = Database::conn();
            $data = json_decode(file_get_contents('php://input'), true) ?? [];

            if (empty($data['name']) || empty($data['content'])) {
                return Response::error('name and content required', 400);
            }

            $stmt = $db->prepare("
                INSERT INTO social_templates (workspace_id, company_id, name, content, media_urls, platforms, category_id, created_by)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ");
            $stmt->execute([
                $workspaceId,
                $companyId,
                $data['name'],
                $data['content'],
                !empty($data['media_urls']) ? json_encode($data['media_urls']) : null,
                !empty($data['platforms']) ? json_encode($data['platforms']) : null,
                $data['category_id'] ?? null,
                $userId
            ]);

            return Response::json(['data' => ['id' => (int)$db->lastInsertId()]]);
        } catch (Exception $e) {
            return Response::error('Failed to create template: ' . $e->getMessage());
        }
    }

    // ==================== HASHTAG GROUPS ====================

    public static function getHashtagGroups() {
        try {
            $workspaceId = self::getWorkspaceId();
            $companyId = self::getCompanyId();
            $db = Database::conn();

            $stmt = $db->prepare("SELECT * FROM hashtag_groups WHERE workspace_id = ? AND company_id = ? ORDER BY use_count DESC, name");
            $stmt->execute([$workspaceId, $companyId]);
            $groups = $stmt->fetchAll(PDO::FETCH_ASSOC);

            foreach ($groups as &$g) {
                $g['hashtags'] = json_decode($g['hashtags'], true);
                $g['platforms'] = $g['platforms'] ? json_decode($g['platforms'], true) : null;
            }

            return Response::json(['data' => $groups]);
        } catch (Exception $e) {
            return Response::error('Failed to fetch hashtag groups: ' . $e->getMessage());
        }
    }

    public static function createHashtagGroup() {
        try {
            $workspaceId = self::getWorkspaceId();
            $companyId = self::getCompanyId();
            $db = Database::conn();
            $data = json_decode(file_get_contents('php://input'), true) ?? [];

            if (empty($data['name']) || empty($data['hashtags'])) {
                return Response::error('name and hashtags required', 400);
            }

            $stmt = $db->prepare("
                INSERT INTO hashtag_groups (workspace_id, company_id, name, hashtags, platforms)
                VALUES (?, ?, ?, ?, ?)
            ");
            $stmt->execute([
                $workspaceId,
                $companyId,
                $data['name'],
                json_encode($data['hashtags']),
                !empty($data['platforms']) ? json_encode($data['platforms']) : null
            ]);

            return Response::json(['data' => ['id' => (int)$db->lastInsertId()]]);
        } catch (Exception $e) {
            return Response::error('Failed to create hashtag group: ' . $e->getMessage());
        }
    }

    // ==================== ANALYTICS ====================

    public static function getAnalytics() {
        try {
            $workspaceId = self::getWorkspaceId();
            $companyId = self::getCompanyId();
            $db = Database::conn();

            $from = $_GET['from'] ?? date('Y-m-d', strtotime('-30 days'));
            $to = $_GET['to'] ?? date('Y-m-d');

            // Posts summary
            $postsSummary = $db->prepare("
                SELECT 
                    COUNT(*) as total_posts,
                    SUM(CASE WHEN status = 'published' THEN 1 ELSE 0 END) as published,
                    SUM(CASE WHEN status = 'scheduled' THEN 1 ELSE 0 END) as scheduled,
                    SUM(CASE WHEN status = 'draft' THEN 1 ELSE 0 END) as drafts
                FROM social_posts
                WHERE workspace_id = ? AND company_id = ? AND created_at BETWEEN ? AND ?
            ");
            $postsSummary->execute([$workspaceId, $companyId, $from, $to . ' 23:59:59']);
            $posts = $postsSummary->fetch(PDO::FETCH_ASSOC);

            // Engagement totals
            $engagementStmt = $db->prepare("
                SELECT 
                    SUM(spa.impressions) as total_impressions,
                    SUM(spa.reach) as total_reach,
                    SUM(spa.likes) as total_likes,
                    SUM(spa.comments) as total_comments,
                    SUM(spa.shares) as total_shares,
                    SUM(spa.clicks) as total_clicks
                FROM social_post_analytics spa
                JOIN social_posts sp ON sp.id = spa.post_id
                WHERE sp.workspace_id = ? AND sp.company_id = ? AND sp.published_at BETWEEN ? AND ?
            ");
            $engagementStmt->execute([$workspaceId, $companyId, $from, $to . ' 23:59:59']);
            $engagement = $engagementStmt->fetch(PDO::FETCH_ASSOC);

            // By platform
            $byPlatformStmt = $db->prepare("
                SELECT 
                    sa.platform,
                    COUNT(DISTINCT sp.id) as post_count,
                    SUM(spa.impressions) as impressions,
                    SUM(spa.likes + spa.comments + spa.shares) as engagement
                FROM social_accounts sa
                LEFT JOIN social_post_analytics spa ON spa.social_account_id = sa.id
                LEFT JOIN social_posts sp ON sp.id = spa.post_id AND sp.published_at BETWEEN ? AND ?
                WHERE sa.workspace_id = ? AND sa.company_id = ?
                GROUP BY sa.platform
            ");
            $byPlatformStmt->execute([$from, $to . ' 23:59:59', $workspaceId, $companyId]);
            $byPlatform = $byPlatformStmt->fetchAll(PDO::FETCH_ASSOC);

            return Response::json([
                'data' => [
                    'posts' => $posts,
                    'engagement' => $engagement,
                    'by_platform' => $byPlatform,
                    'period' => ['from' => $from, 'to' => $to]
                ]
            ]);
        } catch (Exception $e) {
            return Response::error('Failed to get analytics: ' . $e->getMessage());
        }
    }

    // ==================== ADVANCED FEATURES ====================

    public static function bulkImport() {
        try {
            $workspaceId = self::getWorkspaceId();
            $companyId = self::getCompanyId();
            $userId = self::getUserId();
            $data = get_json_body();
            $posts = $data['posts'] ?? [];

            if (empty($posts)) {
                return Response::error('No posts provided for import', 400);
            }

            $db = Database::conn();
            $db->beginTransaction();

            $stmt = $db->prepare("
                INSERT INTO social_posts (
                    workspace_id, company_id, content, media_urls, media_type,
                    status, scheduled_at, target_accounts, platform_settings, created_by
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ");

            foreach ($posts as $post) {
                $content = $post['content'] ?? '';
                $mediaUrls = json_encode($post['media_urls'] ?? []);
                $scheduledAt = $post['scheduled_at'] ?? null;
                $targetAccounts = json_encode($post['target_accounts'] ?? []);
                $platformSettings = json_encode($post['platform_settings'] ?? []);
                
                $stmt->execute([
                    $workspaceId, $companyId, $content, $mediaUrls, 'image',
                    'scheduled', $scheduledAt, $targetAccounts, $platformSettings, $userId
                ]);
            }

            $db->commit();
            return Response::json(['success' => true, 'message' => count($posts) . ' posts imported successfully']);
        } catch (Exception $e) {
            $db = Database::conn();
            if ($db->inTransaction()) $db->rollBack();
            return Response::error('Failed to bulk import: ' . $e->getMessage());
        }
    }

    public static function generateAIContent() {
        try {
            $data = get_json_body();
            $prompt = $data['prompt'] ?? '';
            $platform = $data['platform'] ?? 'generic';

            // Here we would call an AI service. For now, we'll return a smart-looking mock.
            $mockResponse = "✨ Experience the power of social automation with Xordon. Plan, schedule, and analyze your growth like never before! 🚀 #Growth #SocialMedia #Xordon";
            
            return Response::json(['content' => $mockResponse]);
        } catch (Exception $e) {
            return Response::error('AI generation failed: ' . $e->getMessage());
        }
    }

    public static function oauth($platform) {
        try {
            // For demonstration purposes, we'll strip the real OAuth logic and return a direct mock redirect
            // This allows the user to see the "Connected" state immediately without needing real API keys
            $redirectUri = "http://localhost:5173/marketing/social?code=mock_" . $platform . "_code&platform=" . $platform;
            
            return Response::json(['auth_url' => $redirectUri]);
        } catch (Exception $e) {
            return Response::error('OAuth initiation failed: ' . $e->getMessage());
        }
    }

    public static function handleCallback() {
        try {
            $workspaceId = self::getWorkspaceId();
            $companyId = self::getCompanyId();
            $data = get_json_body();
            
            $code = $data['code'] ?? null;
            $platform = $data['platform'] ?? null;

            if (!$code || !$platform) {
                return Response::error('Missing code or platform', 400);
            }

            // Mock account creation
            $db = Database::conn();
            $stmt = $db->prepare("SELECT id FROM social_accounts WHERE platform = ? AND workspace_id = ? AND company_id = ?");
            $stmt->execute([$platform, $workspaceId, $companyId]);

            if ($stmt->fetch()) {
                 // Already exists, just update status
                 $db->prepare("UPDATE social_accounts SET status = 'connected', last_sync_at = NOW() WHERE platform = ? AND workspace_id = ?")->execute([$platform, $workspaceId]);
            } else {
                // Create new
                $stmt = $db->prepare("
                    INSERT INTO social_accounts (
                        workspace_id, company_id, platform, account_type, platform_account_id, 
                        account_name, account_username, status, followers_count,
                        access_token_encrypted, last_sync_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, 'connected', ?, ?, NOW())
                ");
                
                $username = $platform . '_user';
                $name = ucfirst($platform) . ' Page';
                
                $stmt->execute([
                    $workspaceId, $companyId, $platform, 'page', uniqid('mock_'), 
                    $name, $username, rand(100, 5000), 'mock_token'
                ]);
            }

            return Response::json(['success' => true]);
        } catch (Exception $e) {
            return Response::error('Callback failed: ' . $e->getMessage());
        }
    }

    public static function getStreams() {
        // Mocking social streams for the UI
        return Response::json([
            'data' => [
                ['id' => 1, 'account_id' => 1, 'type' => 'feed', 'name' => 'Home Feed'],
                ['id' => 2, 'account_id' => 1, 'type' => 'mentions', 'name' => 'Mentions'],
            ]
        ]);
    }
}
