<?php
/**
 * Funnels Controller
 * Multi-step funnels for GHL-style marketing automation
 */

require_once __DIR__ . '/../Database.php';
require_once __DIR__ . '/../Response.php';
require_once __DIR__ . '/../Auth.php';

class FunnelsController {
    private static function getWorkspaceId(): int {
        $ctx = $GLOBALS['tenantContext'] ?? null;
        if ($ctx && isset($ctx->workspaceId)) {
            return (int)$ctx->workspaceId;
        }
        throw new Exception('Workspace context required');
    }

    /**
     * List all funnels
     */
    public static function index() {
        try {
            $workspaceId = self::getWorkspaceId();
            $db = Database::conn();
            
            $status = $_GET['status'] ?? null;
            
            $sql = "
                SELECT f.*,
                       (SELECT COUNT(*) FROM funnel_steps fs WHERE fs.funnel_id = f.id) as step_count
                FROM funnels f
                WHERE f.workspace_id = ?
            ";
            $params = [$workspaceId];
            
            if ($status) {
                $sql .= " AND f.status = ?";
                $params[] = $status;
            }
            
            $sql .= " ORDER BY f.updated_at DESC";
            
            $stmt = $db->prepare($sql);
            $stmt->execute($params);
            
            return Response::json(['data' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
        } catch (Exception $e) {
            return Response::error('Failed to fetch funnels: ' . $e->getMessage());
        }
    }

    /**
     * Get single funnel with steps
     */
    public static function show($id) {
        try {
            $workspaceId = self::getWorkspaceId();
            $db = Database::conn();
            
            $stmt = $db->prepare("SELECT * FROM funnels WHERE id = ? AND workspace_id = ?");
            $stmt->execute([$id, $workspaceId]);
            $funnel = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$funnel) {
                return Response::error('Funnel not found', 404);
            }
            
            // Get steps
            $stmt = $db->prepare("SELECT * FROM funnel_steps WHERE funnel_id = ? ORDER BY sort_order");
            $stmt->execute([$id]);
            $funnel['steps'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            return Response::json(['data' => $funnel]);
        } catch (Exception $e) {
            return Response::error('Failed to fetch funnel: ' . $e->getMessage());
        }
    }

    /**
     * Create funnel
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
            $stmt = $db->prepare("SELECT id FROM funnels WHERE workspace_id = ? AND slug = ?");
            $stmt->execute([$workspaceId, $slug]);
            if ($stmt->fetch()) {
                $slug = $slug . '-' . time();
            }
            
            $stmt = $db->prepare("
                INSERT INTO funnels 
                (workspace_id, name, slug, description, domain, favicon_url, status)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            ");
            
            $stmt->execute([
                $workspaceId,
                $data['name'],
                $slug,
                $data['description'] ?? null,
                $data['domain'] ?? null,
                $data['favicon_url'] ?? null,
                $data['status'] ?? 'draft'
            ]);
            
            $id = $db->lastInsertId();
            
            // Create default steps if provided
            if (!empty($data['steps'])) {
                self::syncSteps($db, $id, $data['steps']);
            }
            
            return self::show($id);
        } catch (Exception $e) {
            return Response::error('Failed to create funnel: ' . $e->getMessage());
        }
    }

    /**
     * Update funnel
     */
    public static function update($id) {
        try {
            $workspaceId = self::getWorkspaceId();
            $db = Database::conn();
            $data = json_decode(file_get_contents('php://input'), true);
            
            // Verify ownership
            $stmt = $db->prepare("SELECT id FROM funnels WHERE id = ? AND workspace_id = ?");
            $stmt->execute([$id, $workspaceId]);
            if (!$stmt->fetch()) {
                return Response::error('Funnel not found', 404);
            }
            
            $fields = [];
            $params = [];
            
            $allowedFields = ['name', 'slug', 'description', 'domain', 'favicon_url', 'status'];
            
            foreach ($allowedFields as $field) {
                if (array_key_exists($field, $data)) {
                    $fields[] = "$field = ?";
                    $params[] = $data[$field];
                }
            }
            
            if (!empty($fields)) {
                $params[] = $id;
                $params[] = $workspaceId;
                $stmt = $db->prepare("UPDATE funnels SET " . implode(', ', $fields) . " WHERE id = ? AND workspace_id = ?");
                $stmt->execute($params);
            }
            
            // Update steps if provided
            if (isset($data['steps'])) {
                self::syncSteps($db, $id, $data['steps']);
            }
            
            return self::show($id);
        } catch (Exception $e) {
            return Response::error('Failed to update funnel: ' . $e->getMessage());
        }
    }

    /**
     * Delete funnel
     */
    public static function destroy($id) {
        try {
            $workspaceId = self::getWorkspaceId();
            $db = Database::conn();
            
            $stmt = $db->prepare("DELETE FROM funnels WHERE id = ? AND workspace_id = ?");
            $stmt->execute([$id, $workspaceId]);
            
            if ($stmt->rowCount() === 0) {
                return Response::error('Funnel not found', 404);
            }
            
            return Response::json(['success' => true]);
        } catch (Exception $e) {
            return Response::error('Failed to delete funnel: ' . $e->getMessage());
        }
    }

    /**
     * Publish funnel
     */
    public static function publish($id) {
        try {
            $workspaceId = self::getWorkspaceId();
            $db = Database::conn();
            
            $stmt = $db->prepare("
                UPDATE funnels SET status = 'published', published_at = NOW() 
                WHERE id = ? AND workspace_id = ?
            ");
            $stmt->execute([$id, $workspaceId]);
            
            if ($stmt->rowCount() === 0) {
                return Response::error('Funnel not found', 404);
            }
            
            return Response::json(['success' => true]);
        } catch (Exception $e) {
            return Response::error('Failed to publish funnel: ' . $e->getMessage());
        }
    }

    /**
     * Get funnel analytics
     */
    public static function analytics($id) {
        try {
            $workspaceId = self::getWorkspaceId();
            $db = Database::conn();
            
            $stmt = $db->prepare("SELECT * FROM funnels WHERE id = ? AND workspace_id = ?");
            $stmt->execute([$id, $workspaceId]);
            $funnel = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$funnel) {
                return Response::error('Funnel not found', 404);
            }
            
            // Get step analytics
            $stmt = $db->prepare("
                SELECT id, name, step_type, views, conversions,
                       CASE WHEN views > 0 THEN ROUND((conversions / views) * 100, 2) ELSE 0 END as conversion_rate
                FROM funnel_steps 
                WHERE funnel_id = ? 
                ORDER BY sort_order
            ");
            $stmt->execute([$id]);
            $steps = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            return Response::json([
                'data' => [
                    'funnel' => [
                        'id' => $funnel['id'],
                        'name' => $funnel['name'],
                        'total_views' => $funnel['total_views'],
                        'total_conversions' => $funnel['total_conversions'],
                        'conversion_rate' => $funnel['conversion_rate']
                    ],
                    'steps' => $steps
                ]
            ]);
        } catch (Exception $e) {
            return Response::error('Failed to fetch analytics: ' . $e->getMessage());
        }
    }

    /**
     * Track funnel step view
     */
    public static function trackView($funnelId, $stepId) {
        try {
            $db = Database::conn();
            
            // Update step views
            $stmt = $db->prepare("UPDATE funnel_steps SET views = views + 1 WHERE id = ? AND funnel_id = ?");
            $stmt->execute([$stepId, $funnelId]);
            
            // Update funnel total views (only for first step)
            $stmt = $db->prepare("
                UPDATE funnels f SET total_views = total_views + 1 
                WHERE f.id = ? AND EXISTS (
                    SELECT 1 FROM funnel_steps fs 
                    WHERE fs.funnel_id = f.id AND fs.id = ? AND fs.sort_order = 0
                )
            ");
            $stmt->execute([$funnelId, $stepId]);
            
            return Response::json(['success' => true]);
        } catch (Exception $e) {
            return Response::error('Failed to track view: ' . $e->getMessage());
        }
    }

    /**
     * Track funnel step conversion
     */
    public static function trackConversion($funnelId, $stepId) {
        try {
            $db = Database::conn();
            
            // Update step conversions
            $stmt = $db->prepare("UPDATE funnel_steps SET conversions = conversions + 1 WHERE id = ? AND funnel_id = ?");
            $stmt->execute([$stepId, $funnelId]);
            
            // Check if this is the last step (final conversion)
            $stmt = $db->prepare("
                SELECT MAX(sort_order) as max_order FROM funnel_steps WHERE funnel_id = ?
            ");
            $stmt->execute([$funnelId]);
            $maxOrder = $stmt->fetch(PDO::FETCH_ASSOC)['max_order'];
            
            $stmt = $db->prepare("SELECT sort_order FROM funnel_steps WHERE id = ?");
            $stmt->execute([$stepId]);
            $currentOrder = $stmt->fetch(PDO::FETCH_ASSOC)['sort_order'];
            
            if ($currentOrder == $maxOrder) {
                // Final step conversion
                $stmt = $db->prepare("UPDATE funnels SET total_conversions = total_conversions + 1 WHERE id = ?");
                $stmt->execute([$funnelId]);
                
                // Recalculate conversion rate
                $stmt = $db->prepare("
                    UPDATE funnels 
                    SET conversion_rate = CASE WHEN total_views > 0 THEN ROUND((total_conversions / total_views) * 100, 2) ELSE 0 END
                    WHERE id = ?
                ");
                $stmt->execute([$funnelId]);
            }
            
            return Response::json(['success' => true]);
        } catch (Exception $e) {
            return Response::error('Failed to track conversion: ' . $e->getMessage());
        }
    }

    // ==================== HELPER METHODS ====================

    private static function generateSlug(string $name): string {
        $slug = strtolower(trim($name));
        $slug = preg_replace('/[^a-z0-9]+/', '-', $slug);
        $slug = trim($slug, '-');
        return $slug ?: 'funnel';
    }

    private static function syncSteps(PDO $db, int $funnelId, array $inputSteps): void {
        // 1. Get existing IDs
        $stmt = $db->prepare("SELECT id FROM funnel_steps WHERE funnel_id = ?");
        $stmt->execute([$funnelId]);
        $existingIds = $stmt->fetchAll(PDO::FETCH_COLUMN);

        $keepIds = [];

        $stmtInsert = $db->prepare("
            INSERT INTO funnel_steps 
            (funnel_id, name, slug, step_type, sort_order, landing_page_id, page_content, 
             conversion_goal, conversion_value, is_active)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");

        $stmtUpdate = $db->prepare("
            UPDATE funnel_steps SET
                name = ?, slug = ?, step_type = ?, sort_order = ?, landing_page_id = ?, 
                page_content = ?, conversion_goal = ?, conversion_value = ?, is_active = ?
            WHERE id = ? AND funnel_id = ?
        ");

        foreach ($inputSteps as $index => $step) {
            $slug = self::generateSlug($step['name'] ?? 'step-' . ($index + 1));
            // Ensure inputs are valid
            $name = $step['name'] ?? 'Step ' . ($index + 1);
            $type = $step['step_type'] ?? 'landing';
            $sort = $index; // Force sort order based on array order
            $lpId = !empty($step['landing_page_id']) ? $step['landing_page_id'] : null;
            $content = $step['page_content'] ?? null;
            $goal = $step['conversion_goal'] ?? 'pageview';
            $val = !empty($step['conversion_value']) ? $step['conversion_value'] : null;
            $active = isset($step['is_active']) ? $step['is_active'] : 1;

            $stepId = $step['id'] ?? null;
            
            // Check if this is an existing step (and ID is in our known existing list)
            if ($stepId && in_array($stepId, $existingIds)) {
                // UPDATE
                $stmtUpdate->execute([
                    $name, $slug, $type, $sort, $lpId, $content, $goal, $val, $active,
                    $stepId, $funnelId
                ]);
                $keepIds[] = $stepId;
            } else {
                // INSERT
                $stmtInsert->execute([
                    $funnelId, $name, $slug, $type, $sort, $lpId, $content, $goal, $val, $active
                ]);
            }
        }

        // DELETE removed steps
        $deleteIds = array_diff($existingIds, $keepIds);
        if (!empty($deleteIds)) {
            $placeholders = implode(',', array_fill(0, count($deleteIds), '?'));
            $deleteStmt = $db->prepare("DELETE FROM funnel_steps WHERE id IN ($placeholders) AND funnel_id = ?");
            $params = array_values($deleteIds);
            $params[] = $funnelId;
            $deleteStmt->execute($params);
        }
    }
}
