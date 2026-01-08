<?php
require_once __DIR__ . '/../Database.php';
require_once __DIR__ . '/../traits/WorkspaceScoped.php';

class CommunitiesController {
    use WorkspaceScoped;

    private $db;

    public function __construct() {
        $this->db = Database::getInstance();
    }

    public function getCommunities() {
        $workspaceId = self::requireWorkspaceContext();
        $stmt = $this->db->prepare("SELECT * FROM communities WHERE workspace_id = ? ORDER BY created_at DESC");
        $stmt->execute([$workspaceId]);
        $communities = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        foreach ($communities as &$comm) {
             $stmtG = $this->db->prepare("SELECT count(*) as count FROM community_groups WHERE community_id = ?");
             $stmtG->execute([$comm['id']]);
             $comm['group_count'] = $stmtG->fetch(PDO::FETCH_ASSOC)['count'];
        }
        
        return $communities;
    }

    public function createCommunity() {
        $workspaceId = self::requireWorkspaceContext();
        $data = json_decode(file_get_contents('php://input'), true);
        
        if (empty($data['name'])) {
            Response::error('Community name required', 400);
            exit;
        }

        $stmt = $this->db->prepare("
            INSERT INTO communities (workspace_id, name, description, slug, settings, is_private, created_at)
            VALUES (?, ?, ?, ?, ?, ?, NOW())
        ");
        
        $slug = strtolower(trim(preg_replace('/[^A-Za-z0-9-]+/', '-', $data['name'])));
        
        $stmt->execute([
            $workspaceId,
            $data['name'],
            $data['description'] ?? '',
            $slug,
            json_encode($data['settings'] ?? []),
            $data['is_private'] ? 1 : 0
        ]);
        
        return ['id' => $this->db->lastInsertId(), 'message' => 'Community created'];
    }

    public function updateCommunity($id) {
        $workspaceId = self::requireWorkspaceContext();
        $data = json_decode(file_get_contents('php://input'), true);

        $check = $this->db->prepare("SELECT id FROM communities WHERE id = ? AND workspace_id = ?");
        $check->execute([$id, $workspaceId]);
        if (!$check->fetch()) {
            Response::error('Community not found', 404);
            exit;
        }

        $fields = [];
        $params = [];
        
        if (isset($data['name'])) { $fields[] = "name = ?"; $params[] = $data['name']; }
        if (isset($data['description'])) { $fields[] = "description = ?"; $params[] = $data['description']; }
        if (isset($data['is_private'])) { $fields[] = "is_private = ?"; $params[] = $data['is_private'] ? 1 : 0; }
        
        if (empty($fields)) return ['message' => 'No changes'];
        
        $params[] = $id;
        $sql = "UPDATE communities SET " . implode(', ', $fields) . " WHERE id = ?";
        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        
        return ['message' => 'Community updated'];
    }
    
    public function deleteCommunity($id) {
        $workspaceId = self::requireWorkspaceContext();
        $stmt = $this->db->prepare("DELETE FROM communities WHERE id = ? AND workspace_id = ?");
        $stmt->execute([$id, $workspaceId]);
        return ['message' => 'Community deleted'];
    }

    // --- Groups ---

    public function getGroups($communityId) {
        // Here we should verify that community belongs to workspace
        $workspaceId = self::requireWorkspaceContext();
        $check = $this->db->prepare("SELECT id FROM communities WHERE id = ? AND workspace_id = ?");
        $check->execute([$communityId, $workspaceId]);
        if (!$check->fetch()) {
            Response::error('Community not found or access denied', 404);
            exit;
        }

        $stmt = $this->db->prepare("SELECT * FROM community_groups WHERE community_id = ? ORDER BY created_at DESC");
        $stmt->execute([$communityId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function createGroup($communityId) {
        $workspaceId = self::requireWorkspaceContext();
        $check = $this->db->prepare("SELECT id FROM communities WHERE id = ? AND workspace_id = ?");
        $check->execute([$communityId, $workspaceId]);
        if (!$check->fetch()) {
            Response::error('Community not found or access denied', 404);
            exit;
        }

        $data = json_decode(file_get_contents('php://input'), true);
        
        if (empty($data['name'])) {
            Response::error('Group name required', 400);
            exit;
        }
        
        $stmt = $this->db->prepare("
            INSERT INTO community_groups (community_id, name, description, slug, is_private, created_at)
            VALUES (?, ?, ?, ?, ?, NOW())
        ");
        
        $slug = strtolower(trim(preg_replace('/[^A-Za-z0-9-]+/', '-', $data['name'])));
        
        $stmt->execute([
            $communityId,
            $data['name'],
            $data['description'] ?? '',
            $slug,
            $data['is_private'] ? 1 : 0
        ]);
        
        return ['id' => $this->db->lastInsertId(), 'message' => 'Group created'];
    }
    
    public function deleteGroup($groupId) {
         $workspaceId = self::requireWorkspaceContext();
         // Verify group -> community -> workspace ownership
         $stmtCheck = $this->db->prepare("
            SELECT cg.id FROM community_groups cg 
            JOIN communities c ON cg.community_id = c.id 
            WHERE cg.id = ? AND c.workspace_id = ?
         ");
         $stmtCheck->execute([$groupId, $workspaceId]);
         if (!$stmtCheck->fetch()) {
             Response::error('Group not found or access denied', 404);
             exit;
         }

         $stmt = $this->db->prepare("DELETE FROM community_groups WHERE id = ?");
         $stmt->execute([$groupId]);
         return ['message' => 'Group deleted'];
    }
}
