<?php
require_once __DIR__ . '/../Database.php';
require_once __DIR__ . '/../traits/WorkspaceScoped.php';

class SocialPlannerController {
    use WorkspaceScoped;

    private $db;

    public function __construct() {
        $this->db = Database::getInstance();
    }

    public function getAccounts() {
        $workspaceId = self::requireWorkspaceContext();
        $stmt = $this->db->prepare("SELECT * FROM social_accounts WHERE workspace_id = ? AND status = 'active'");
        $stmt->execute([$workspaceId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function connectAccount() {
        $workspaceId = self::requireWorkspaceContext();
        $data = json_decode(file_get_contents('php://input'), true);
        
        if (empty($data['platform']) || empty($data['account_name'])) {
            Response::error('Missing platform or account name', 400);
            exit;
        }

        $stmt = $this->db->prepare("
            INSERT INTO social_accounts (workspace_id, platform, account_internal_id, account_name, status, created_at)
            VALUES (?, ?, ?, ?, 'active', NOW())
        ");
        
        try {
            $internalId = $data['account_internal_id'] ?? uniqid($data['platform'] . '_');
            
            $stmt->execute([
                $workspaceId,
                $data['platform'],
                $internalId,
                $data['account_name']
            ]);
            
            return ['id' => $this->db->lastInsertId(), 'message' => 'Account connected'];
        } catch (Exception $e) {
            Response::error($e->getMessage(), 500);
            exit;
        }
    }

    public function disconnectAccount($id) {
        $workspaceId = self::requireWorkspaceContext();
        $stmt = $this->db->prepare("DELETE FROM social_accounts WHERE id = ? AND workspace_id = ?");
        $stmt->execute([$id, $workspaceId]);
        return ['message' => 'Account disconnected'];
    }

    public function getPosts() {
        $workspaceId = self::requireWorkspaceContext();
        $status = $_GET['status'] ?? null;
        
        $sql = "SELECT * FROM social_posts WHERE workspace_id = ?";
        $params = [$workspaceId];
        
        if ($status) {
            $sql .= " AND status = ?";
            $params[] = $status;
        }
        
        $sql .= " ORDER BY created_at DESC LIMIT 50";
        
        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        $posts = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        foreach ($posts as &$post) {
            $stmtTargets = $this->db->prepare("
                SELECT spt.*, sa.platform, sa.account_name 
                FROM social_post_targets spt
                JOIN social_accounts sa ON spt.account_id = sa.id
                WHERE spt.post_id = ?
            ");
            $stmtTargets->execute([$post['id']]);
            $post['accounts'] = $stmtTargets->fetchAll(PDO::FETCH_ASSOC);
        }
        
        return $posts;
    }

    public function createPost() {
        $workspaceId = self::requireWorkspaceContext();
        $data = json_decode(file_get_contents('php://input'), true);
        
        if (empty($data['content']) && empty($data['media_urls'])) {
            Response::error('Content or media required', 400);
            exit;
        }

        $this->db->beginTransaction();
        try {
            $stmt = $this->db->prepare("
                INSERT INTO social_posts (workspace_id, content, media_urls, status, scheduled_at, created_at)
                VALUES (?, ?, ?, ?, ?, NOW())
            ");
            
            $status = $data['scheduled_at'] ? 'scheduled' : 'draft';
            if (!empty($data['status'])) $status = $data['status'];
            
            $stmt->execute([
                $workspaceId,
                $data['content'] ?? '',
                json_encode($data['media_urls'] ?? []),
                $status,
                $data['scheduled_at'] ?? null
            ]);
            
            $postId = $this->db->lastInsertId();
            
            if (!empty($data['account_ids'])) {
                $stmtTarget = $this->db->prepare("
                    INSERT INTO social_post_targets (post_id, account_id, status)
                    VALUES (?, ?, ?)
                ");
                $targetStatus = ($status === 'scheduled') ? 'pending' : 'pending';
                
                foreach ($data['account_ids'] as $accountId) {
                    $stmtTarget->execute([$postId, $accountId, $targetStatus]);
                }
            }
            
            $this->db->commit();
            return ['id' => $postId, 'message' => 'Post created'];
        } catch (Exception $e) {
            $this->db->rollBack();
            Response::error($e->getMessage(), 500);
            exit;
        }
    }
    
    public function updatePost($id) {
         $workspaceId = self::requireWorkspaceContext();
         $data = json_decode(file_get_contents('php://input'), true);
         
         $verify = $this->db->prepare("SELECT id FROM social_posts WHERE id = ? AND workspace_id = ?");
         $verify->execute([$id, $workspaceId]);
         if (!$verify->fetch()) {
             Response::error('Post not found', 404);
             exit;
         }
         
         $fields = [];
         $params = [];
         
         if (isset($data['content'])) { $fields[] = "content = ?"; $params[] = $data['content']; }
         if (isset($data['status'])) { $fields[] = "status = ?"; $params[] = $data['status']; }
         if (isset($data['scheduled_at'])) { $fields[] = "scheduled_at = ?"; $params[] = $data['scheduled_at']; }
         if (isset($data['media_urls'])) { $fields[] = "media_urls = ?"; $params[] = json_encode($data['media_urls']); }
         
         if (empty($fields)) {
             return ['message' => 'No changes'];
         }
         
         $params[] = $id;
         $sql = "UPDATE social_posts SET " . implode(', ', $fields) . " WHERE id = ?";
         $stmt = $this->db->prepare($sql);
         $stmt->execute($params);
         
         return ['message' => 'Post updated'];
    }

    public function deletePost($id) {
        $workspaceId = self::requireWorkspaceContext();
        $stmt = $this->db->prepare("DELETE FROM social_posts WHERE id = ? AND workspace_id = ?");
        $stmt->execute([$id, $workspaceId]);
        return ['message' => 'Post deleted'];
    }
}
