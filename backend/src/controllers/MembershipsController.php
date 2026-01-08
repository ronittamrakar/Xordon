<?php
/**
 * Memberships Controller
 * GHL-style memberships, courses, and gated content
 */

require_once __DIR__ . '/../Database.php';
require_once __DIR__ . '/../Response.php';
require_once __DIR__ . '/../Auth.php';
require_once __DIR__ . '/../TenantContext.php';

class MembershipsController {
    private static function getWorkspaceId(): int {
        try {
            $ctx = TenantContext::resolveOrFail();
            return $ctx->workspaceId;
        } catch (\Exception $e) {
            throw new Exception('Workspace context required: ' . $e->getMessage());
        }
    }

    /**
     * List all memberships
     */
    public static function index() {
        try {
            $workspaceId = self::getWorkspaceId();
            $db = Database::conn();
            
            $status = $_GET['status'] ?? null;
            
            $sql = "
                SELECT m.*,
                       (SELECT COUNT(*) FROM membership_content mc WHERE mc.membership_id = m.id) as content_count,
                       (SELECT COUNT(*) FROM member_access ma WHERE ma.membership_id = m.id AND ma.status = 'active') as active_members
                FROM memberships m
                WHERE m.workspace_id = ?
            ";
            $params = [$workspaceId];
            
            if ($status) {
                $sql .= " AND m.status = ?";
                $params[] = $status;
            }
            
            $sql .= " ORDER BY m.created_at DESC";
            
            $stmt = $db->prepare($sql);
            $stmt->execute($params);
            
            return Response::json(['data' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
        } catch (Exception $e) {
            return Response::error('Failed to fetch memberships: ' . $e->getMessage());
        }
    }

    /**
     * Get single membership with content
     */
    public static function show($id) {
        try {
            $workspaceId = self::getWorkspaceId();
            $db = Database::conn();
            
            $stmt = $db->prepare("SELECT * FROM memberships WHERE id = ? AND workspace_id = ?");
            $stmt->execute([$id, $workspaceId]);
            $membership = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$membership) {
                return Response::error('Membership not found', 404);
            }
            
            // Get content (modules and lessons)
            $stmt = $db->prepare("
                SELECT * FROM membership_content 
                WHERE membership_id = ? 
                ORDER BY ISNULL(parent_id) DESC, parent_id, sort_order
            ");
            $stmt->execute([$id]);
            $content = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Build tree structure
            $membership['content'] = self::buildContentTree($content);
            
            // Get member stats
            $stmt = $db->prepare("
                SELECT 
                    COUNT(*) as total_members,
                    SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active,
                    SUM(CASE WHEN status = 'expired' THEN 1 ELSE 0 END) as expired,
                    AVG(progress_percent) as avg_progress
                FROM member_access
                WHERE membership_id = ?
            ");
            $stmt->execute([$id]);
            $membership['stats'] = $stmt->fetch(PDO::FETCH_ASSOC);
            
            return Response::json(['data' => $membership]);
        } catch (Exception $e) {
            return Response::error('Failed to fetch membership: ' . $e->getMessage());
        }
    }

    /**
     * Create membership
     */
    public static function store() {
        try {
            $workspaceId = self::getWorkspaceId();
            $db = Database::conn();
            $data = json_decode(file_get_contents('php://input'), true);
            
            if (empty($data['name'])) {
                return Response::error('Name is required', 400);
            }
            
            $slug = self::generateSlug($data['name']);
            
            // Check slug uniqueness
            $stmt = $db->prepare("SELECT id FROM memberships WHERE workspace_id = ? AND slug = ?");
            $stmt->execute([$workspaceId, $slug]);
            if ($stmt->fetch()) {
                $slug = $slug . '-' . time();
            }
            
            $stmt = $db->prepare("
                INSERT INTO memberships 
                (workspace_id, name, slug, description, access_type, price, currency, 
                 billing_interval, trial_days, welcome_message, status)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ");
            
            $stmt->execute([
                $workspaceId,
                $data['name'],
                $slug,
                $data['description'] ?? null,
                $data['access_type'] ?? 'paid',
                $data['price'] ?? null,
                $data['currency'] ?? 'USD',
                $data['billing_interval'] ?? 'one_time',
                $data['trial_days'] ?? 0,
                $data['welcome_message'] ?? null,
                $data['status'] ?? 'draft'
            ]);
            
            return self::show($db->lastInsertId());
        } catch (Exception $e) {
            return Response::error('Failed to create membership: ' . $e->getMessage());
        }
    }

    /**
     * Update membership
     */
    public static function update($id) {
        try {
            $workspaceId = self::getWorkspaceId();
            $db = Database::conn();
            $data = json_decode(file_get_contents('php://input'), true);
            
            // Verify ownership
            $stmt = $db->prepare("SELECT id FROM memberships WHERE id = ? AND workspace_id = ?");
            $stmt->execute([$id, $workspaceId]);
            if (!$stmt->fetch()) {
                return Response::error('Membership not found', 404);
            }
            
            $fields = [];
            $params = [];
            
            $allowedFields = [
                'name', 'slug', 'description', 'access_type', 'price', 'currency',
                'billing_interval', 'trial_days', 'welcome_message', 'status'
            ];
            
            foreach ($allowedFields as $field) {
                if (array_key_exists($field, $data)) {
                    $fields[] = "$field = ?";
                    $params[] = $data[$field];
                }
            }
            
            if (!empty($fields)) {
                $params[] = $id;
                $params[] = $workspaceId;
                $stmt = $db->prepare("UPDATE memberships SET " . implode(', ', $fields) . " WHERE id = ? AND workspace_id = ?");
                $stmt->execute($params);
            }
            
            return self::show($id);
        } catch (Exception $e) {
            return Response::error('Failed to update membership: ' . $e->getMessage());
        }
    }

    /**
     * Delete membership
     */
    public static function destroy($id) {
        try {
            $workspaceId = self::getWorkspaceId();
            $db = Database::conn();
            
            $stmt = $db->prepare("DELETE FROM memberships WHERE id = ? AND workspace_id = ?");
            $stmt->execute([$id, $workspaceId]);
            
            if ($stmt->rowCount() === 0) {
                return Response::error('Membership not found', 404);
            }
            
            return Response::json(['success' => true]);
        } catch (Exception $e) {
            return Response::error('Failed to delete membership: ' . $e->getMessage());
        }
    }

    // ==================== CONTENT MANAGEMENT ====================

    /**
     * Add content (module/lesson) to membership
     */
    public static function addContent($membershipId) {
        try {
            $workspaceId = self::getWorkspaceId();
            $db = Database::conn();
            $data = json_decode(file_get_contents('php://input'), true);
            
            // Verify ownership
            $stmt = $db->prepare("SELECT id FROM memberships WHERE id = ? AND workspace_id = ?");
            $stmt->execute([$membershipId, $workspaceId]);
            if (!$stmt->fetch()) {
                return Response::error('Membership not found', 404);
            }
            
            if (empty($data['title'])) {
                return Response::error('Title is required', 400);
            }
            
            // Get next sort order
            $stmt = $db->prepare("
                SELECT COALESCE(MAX(sort_order), -1) + 1 as next_order 
                FROM membership_content 
                WHERE membership_id = ? AND parent_id IS NULL
            ");
            $stmt->execute([$membershipId]);
            $nextOrder = $stmt->fetch(PDO::FETCH_ASSOC)['next_order'];
            
            $stmt = $db->prepare("
                INSERT INTO membership_content 
                (membership_id, title, content_type, parent_id, sort_order, content, 
                 video_url, file_url, duration_minutes, drip_enabled, drip_days, is_published)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ");
            
            $stmt->execute([
                $membershipId,
                $data['title'],
                $data['content_type'] ?? 'lesson',
                $data['parent_id'] ?? null,
                $data['sort_order'] ?? $nextOrder,
                $data['content'] ?? null,
                $data['video_url'] ?? null,
                $data['file_url'] ?? null,
                $data['duration_minutes'] ?? null,
                $data['drip_enabled'] ?? 0,
                $data['drip_days'] ?? 0,
                $data['is_published'] ?? 0
            ]);
            
            return Response::json(['data' => ['id' => (int)$db->lastInsertId()]]);
        } catch (Exception $e) {
            return Response::error('Failed to add content: ' . $e->getMessage());
        }
    }

    /**
     * Update content
     */
    public static function updateContent($membershipId, $contentId) {
        try {
            $workspaceId = self::getWorkspaceId();
            $db = Database::conn();
            $data = json_decode(file_get_contents('php://input'), true);
            
            // Verify ownership
            $stmt = $db->prepare("
                SELECT mc.id FROM membership_content mc
                JOIN memberships m ON mc.membership_id = m.id
                WHERE mc.id = ? AND m.id = ? AND m.workspace_id = ?
            ");
            $stmt->execute([$contentId, $membershipId, $workspaceId]);
            if (!$stmt->fetch()) {
                return Response::error('Content not found', 404);
            }
            
            $fields = [];
            $params = [];
            
            $allowedFields = [
                'title', 'content_type', 'parent_id', 'sort_order', 'content',
                'video_url', 'file_url', 'duration_minutes', 'drip_enabled', 'drip_days', 'is_published'
            ];
            
            foreach ($allowedFields as $field) {
                if (array_key_exists($field, $data)) {
                    $fields[] = "$field = ?";
                    $params[] = $data[$field];
                }
            }
            
            if (!empty($fields)) {
                $params[] = $contentId;
                $stmt = $db->prepare("UPDATE membership_content SET " . implode(', ', $fields) . " WHERE id = ?");
                $stmt->execute($params);
            }
            
            return Response::json(['success' => true]);
        } catch (Exception $e) {
            return Response::error('Failed to update content: ' . $e->getMessage());
        }
    }

    /**
     * Delete content
     */
    public static function deleteContent($membershipId, $contentId) {
        try {
            $workspaceId = self::getWorkspaceId();
            $db = Database::conn();
            
            // Verify ownership
            $stmt = $db->prepare("
                SELECT mc.id FROM membership_content mc
                JOIN memberships m ON mc.membership_id = m.id
                WHERE mc.id = ? AND m.id = ? AND m.workspace_id = ?
            ");
            $stmt->execute([$contentId, $membershipId, $workspaceId]);
            if (!$stmt->fetch()) {
                return Response::error('Content not found', 404);
            }
            
            $stmt = $db->prepare("DELETE FROM membership_content WHERE id = ?");
            $stmt->execute([$contentId]);
            
            return Response::json(['success' => true]);
        } catch (Exception $e) {
            return Response::error('Failed to delete content: ' . $e->getMessage());
        }
    }

    // ==================== MEMBER ACCESS ====================

    /**
     * Get members of a membership
     */
    public static function getMembers($membershipId) {
        try {
            $workspaceId = self::getWorkspaceId();
            $db = Database::conn();
            
            // Verify ownership
            $stmt = $db->prepare("SELECT id FROM memberships WHERE id = ? AND workspace_id = ?");
            $stmt->execute([$membershipId, $workspaceId]);
            if (!$stmt->fetch()) {
                return Response::error('Membership not found', 404);
            }
            
            $status = $_GET['status'] ?? null;
            
            $sql = "
                SELECT ma.*, c.first_name, c.last_name, c.email
                FROM member_access ma
                LEFT JOIN contacts c ON ma.contact_id = c.id
                WHERE ma.membership_id = ?
            ";
            $params = [$membershipId];
            
            if ($status) {
                $sql .= " AND ma.status = ?";
                $params[] = $status;
            }
            
            $sql .= " ORDER BY ma.access_granted_at DESC";
            
            $stmt = $db->prepare($sql);
            $stmt->execute($params);
            
            return Response::json(['data' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
        } catch (Exception $e) {
            return Response::error('Failed to fetch members: ' . $e->getMessage());
        }
    }

    /**
     * Grant access to a contact
     */
    public static function grantAccess($membershipId) {
        try {
            $workspaceId = self::getWorkspaceId();
            $db = Database::conn();
            $data = json_decode(file_get_contents('php://input'), true);
            
            $contactId = $data['contact_id'] ?? null;
            
            if (!$contactId) {
                return Response::error('contact_id is required', 400);
            }
            
            // Verify membership ownership
            $stmt = $db->prepare("SELECT * FROM memberships WHERE id = ? AND workspace_id = ?");
            $stmt->execute([$membershipId, $workspaceId]);
            $membership = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$membership) {
                return Response::error('Membership not found', 404);
            }
            
            // Check if already has access
            $stmt = $db->prepare("SELECT id FROM member_access WHERE membership_id = ? AND contact_id = ?");
            $stmt->execute([$membershipId, $contactId]);
            if ($stmt->fetch()) {
                return Response::error('Contact already has access', 400);
            }
            
            // Calculate expiry
            $expiresAt = null;
            if ($membership['billing_interval'] === 'monthly') {
                $expiresAt = date('Y-m-d H:i:s', strtotime('+1 month'));
            } elseif ($membership['billing_interval'] === 'yearly') {
                $expiresAt = date('Y-m-d H:i:s', strtotime('+1 year'));
            }
            
            $stmt = $db->prepare("
                INSERT INTO member_access 
                (membership_id, contact_id, status, access_granted_at, access_expires_at, payment_id, subscription_id)
                VALUES (?, ?, 'active', NOW(), ?, ?, ?)
            ");
            $stmt->execute([
                $membershipId,
                $contactId,
                $expiresAt,
                $data['payment_id'] ?? null,
                $data['subscription_id'] ?? null
            ]);
            
            return Response::json(['data' => ['id' => (int)$db->lastInsertId()]]);
        } catch (Exception $e) {
            return Response::error('Failed to grant access: ' . $e->getMessage());
        }
    }

    /**
     * Revoke access from a contact
     */
    public static function revokeAccess($membershipId, $accessId) {
        try {
            $workspaceId = self::getWorkspaceId();
            $db = Database::conn();
            
            // Verify ownership
            $stmt = $db->prepare("
                SELECT ma.id FROM member_access ma
                JOIN memberships m ON ma.membership_id = m.id
                WHERE ma.id = ? AND m.id = ? AND m.workspace_id = ?
            ");
            $stmt->execute([$accessId, $membershipId, $workspaceId]);
            if (!$stmt->fetch()) {
                return Response::error('Access record not found', 404);
            }
            
            $stmt = $db->prepare("UPDATE member_access SET status = 'cancelled' WHERE id = ?");
            $stmt->execute([$accessId]);
            
            return Response::json(['success' => true]);
        } catch (Exception $e) {
            return Response::error('Failed to revoke access: ' . $e->getMessage());
        }
    }

    /**
     * Update member progress
     */
    public static function updateProgress($membershipId, $accessId) {
        try {
            $db = Database::conn();
            $data = json_decode(file_get_contents('php://input'), true);
            
            $completedContentIds = $data['completed_content_ids'] ?? [];
            
            // Calculate progress
            $stmt = $db->prepare("SELECT COUNT(*) as total FROM membership_content WHERE membership_id = ? AND is_published = 1");
            $stmt->execute([$membershipId]);
            $total = $stmt->fetch(PDO::FETCH_ASSOC)['total'];
            
            $progressPercent = $total > 0 ? round((count($completedContentIds) / $total) * 100) : 0;
            
            $stmt = $db->prepare("
                UPDATE member_access 
                SET completed_content_ids = ?, progress_percent = ?, last_accessed_at = NOW()
                WHERE id = ?
            ");
            $stmt->execute([json_encode($completedContentIds), $progressPercent, $accessId]);
            
            return Response::json(['data' => ['progress_percent' => $progressPercent]]);
        } catch (Exception $e) {
            return Response::error('Failed to update progress: ' . $e->getMessage());
        }
    }

    // ==================== HELPER METHODS ====================

    private static function generateSlug(string $name): string {
        $slug = strtolower(trim($name));
        $slug = preg_replace('/[^a-z0-9]+/', '-', $slug);
        $slug = trim($slug, '-');
        return $slug ?: 'membership';
    }

    private static function buildContentTree(array $content): array {
        $tree = [];
        $lookup = [];
        
        foreach ($content as $item) {
            $item['children'] = [];
            $lookup[$item['id']] = $item;
        }
        
        foreach ($lookup as $id => $item) {
            if ($item['parent_id'] === null) {
                $tree[] = &$lookup[$id];
            } else {
                if (isset($lookup[$item['parent_id']])) {
                    $lookup[$item['parent_id']]['children'][] = &$lookup[$id];
                }
            }
        }
        
        return $tree;
    }
}
