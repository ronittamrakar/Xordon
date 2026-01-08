<?php
/**
 * Contact Stages Controller
 * Manage contact lifecycle stages and lead scoring
 */

require_once __DIR__ . '/../Database.php';
require_once __DIR__ . '/../Response.php';
require_once __DIR__ . '/../Auth.php';

class ContactStagesController {
    private static function getWorkspaceId(): int {
        $ctx = $GLOBALS['tenantContext'] ?? null;
        if ($ctx && isset($ctx->workspaceId)) {
            return (int)$ctx->workspaceId;
        }
        throw new Exception('Workspace context required');
    }

    // ==================== CONTACT STAGES ====================

    /**
     * List contact stages
     */
    public static function getStages() {
        try {
            $workspaceId = self::getWorkspaceId();
            $db = Database::conn();

            $stmt = $db->prepare("
                SELECT cs.*,
                    (SELECT COUNT(*) FROM contacts c WHERE c.stage_id = cs.id) as contact_count
                FROM contact_stages cs
                WHERE cs.workspace_id = ?
                ORDER BY cs.sort_order
            ");
            $stmt->execute([$workspaceId]);
            $stages = $stmt->fetchAll(PDO::FETCH_ASSOC);

            return Response::json(['data' => $stages]);
        } catch (Exception $e) {
            return Response::error('Failed to fetch stages: ' . $e->getMessage());
        }
    }

    /**
     * Create contact stage
     */
    public static function createStage() {
        try {
            $workspaceId = self::getWorkspaceId();
            $db = Database::conn();
            $data = json_decode(file_get_contents('php://input'), true) ?? [];

            if (empty($data['name'])) {
                return Response::error('name required', 400);
            }

            // Get next sort order
            $orderStmt = $db->prepare("SELECT COALESCE(MAX(sort_order), 0) + 1 FROM contact_stages WHERE workspace_id = ?");
            $orderStmt->execute([$workspaceId]);
            $sortOrder = (int)$orderStmt->fetchColumn();

            $stmt = $db->prepare("
                INSERT INTO contact_stages 
                (workspace_id, name, description, color, sort_order, is_default)
                VALUES (?, ?, ?, ?, ?, ?)
            ");

            $stmt->execute([
                $workspaceId,
                $data['name'],
                $data['description'] ?? null,
                $data['color'] ?? '#6366f1',
                $data['sort_order'] ?? $sortOrder,
                $data['is_default'] ?? 0
            ]);

            $id = $db->lastInsertId();

            return Response::json(['data' => ['id' => (int)$id]]);
        } catch (Exception $e) {
            if (strpos($e->getMessage(), 'Duplicate entry') !== false) {
                return Response::error('Stage name already exists', 400);
            }
            return Response::error('Failed to create stage: ' . $e->getMessage());
        }
    }

    /**
     * Update contact stage
     */
    public static function updateStage($id) {
        try {
            $workspaceId = self::getWorkspaceId();
            $db = Database::conn();
            $data = json_decode(file_get_contents('php://input'), true) ?? [];

            // Check if system stage
            $checkStmt = $db->prepare("SELECT is_system FROM contact_stages WHERE id = ? AND workspace_id = ?");
            $checkStmt->execute([$id, $workspaceId]);
            $stage = $checkStmt->fetch(PDO::FETCH_ASSOC);

            if (!$stage) {
                return Response::error('Stage not found', 404);
            }

            $updates = [];
            $params = [];

            // System stages can only update color
            $allowedFields = $stage['is_system'] 
                ? ['color'] 
                : ['name', 'description', 'color', 'sort_order', 'is_default'];

            foreach ($allowedFields as $field) {
                if (array_key_exists($field, $data)) {
                    $updates[] = "$field = ?";
                    $params[] = $data[$field];
                }
            }

            if (empty($updates)) {
                return Response::error('No valid fields to update', 400);
            }

            // If setting as default, unset other defaults
            if (isset($data['is_default']) && $data['is_default']) {
                $db->prepare("UPDATE contact_stages SET is_default = 0 WHERE workspace_id = ?")->execute([$workspaceId]);
            }

            $params[] = $id;
            $stmt = $db->prepare("UPDATE contact_stages SET " . implode(', ', $updates) . " WHERE id = ?");
            $stmt->execute($params);

            return Response::json(['success' => true]);
        } catch (Exception $e) {
            return Response::error('Failed to update stage: ' . $e->getMessage());
        }
    }

    /**
     * Delete contact stage
     */
    public static function deleteStage($id) {
        try {
            $workspaceId = self::getWorkspaceId();
            $db = Database::conn();

            // Check if system stage
            $checkStmt = $db->prepare("SELECT is_system FROM contact_stages WHERE id = ? AND workspace_id = ?");
            $checkStmt->execute([$id, $workspaceId]);
            $stage = $checkStmt->fetch(PDO::FETCH_ASSOC);

            if (!$stage) {
                return Response::error('Stage not found', 404);
            }

            if ($stage['is_system']) {
                return Response::error('Cannot delete system stages', 400);
            }

            // Move contacts to default stage
            $defaultStmt = $db->prepare("SELECT id FROM contact_stages WHERE workspace_id = ? AND is_default = 1 LIMIT 1");
            $defaultStmt->execute([$workspaceId]);
            $defaultStage = $defaultStmt->fetch(PDO::FETCH_ASSOC);

            if ($defaultStage) {
                $db->prepare("UPDATE contacts SET stage_id = ? WHERE stage_id = ? AND workspace_id = ?")
                    ->execute([$defaultStage['id'], $id, $workspaceId]);
            }

            $stmt = $db->prepare("DELETE FROM contact_stages WHERE id = ? AND workspace_id = ?");
            $stmt->execute([$id, $workspaceId]);

            return Response::json(['success' => true]);
        } catch (Exception $e) {
            return Response::error('Failed to delete stage: ' . $e->getMessage());
        }
    }

    /**
     * Reorder stages
     */
    public static function reorderStages() {
        try {
            $workspaceId = self::getWorkspaceId();
            $db = Database::conn();
            $data = json_decode(file_get_contents('php://input'), true) ?? [];

            if (!isset($data['stage_ids']) || !is_array($data['stage_ids'])) {
                return Response::error('stage_ids array required', 400);
            }

            $stmt = $db->prepare("UPDATE contact_stages SET sort_order = ? WHERE id = ? AND workspace_id = ?");

            foreach ($data['stage_ids'] as $order => $stageId) {
                $stmt->execute([$order, $stageId, $workspaceId]);
            }

            return Response::json(['success' => true]);
        } catch (Exception $e) {
            return Response::error('Failed to reorder stages: ' . $e->getMessage());
        }
    }

    /**
     * Move contact to stage
     */
    public static function moveContact($contactId, $stageId) {
        try {
            $workspaceId = self::getWorkspaceId();
            $db = Database::conn();

            // Verify stage exists
            $checkStmt = $db->prepare("SELECT id FROM contact_stages WHERE id = ? AND workspace_id = ?");
            $checkStmt->execute([$stageId, $workspaceId]);
            if (!$checkStmt->fetch()) {
                return Response::error('Stage not found', 404);
            }

            // Get old stage for activity log
            $oldStmt = $db->prepare("SELECT stage_id FROM contacts WHERE id = ? AND workspace_id = ?");
            $oldStmt->execute([$contactId, $workspaceId]);
            $contact = $oldStmt->fetch(PDO::FETCH_ASSOC);

            if (!$contact) {
                return Response::error('Contact not found', 404);
            }

            // Update contact
            $stmt = $db->prepare("UPDATE contacts SET stage_id = ? WHERE id = ? AND workspace_id = ?");
            $stmt->execute([$stageId, $contactId, $workspaceId]);

            // Log activity
            if (class_exists('ActivitiesController')) {
                ActivitiesController::log(
                    $workspaceId,
                    'contact',
                    $contactId,
                    'stage_changed',
                    'Stage changed',
                    null,
                    ['stage_id' => ['old' => $contact['stage_id'], 'new' => $stageId]]
                );
            }

            return Response::json(['success' => true]);
        } catch (Exception $e) {
            return Response::error('Failed to move contact: ' . $e->getMessage());
        }
    }

    // ==================== LEAD SCORING ====================

    /**
     * Get lead scoring rules
     */
    public static function getScoringRules() {
        try {
            $workspaceId = self::getWorkspaceId();
            $db = Database::conn();

            $stmt = $db->prepare("
                SELECT * FROM lead_scoring_rules 
                WHERE workspace_id = ?
                ORDER BY name
            ");
            $stmt->execute([$workspaceId]);
            $rules = $stmt->fetchAll(PDO::FETCH_ASSOC);

            foreach ($rules as &$rule) {
                $rule['conditions'] = json_decode($rule['conditions'], true);
            }

            return Response::json(['data' => $rules]);
        } catch (Exception $e) {
            return Response::error('Failed to fetch scoring rules: ' . $e->getMessage());
        }
    }

    /**
     * Create scoring rule
     */
    public static function createScoringRule() {
        try {
            $workspaceId = self::getWorkspaceId();
            $db = Database::conn();
            $data = json_decode(file_get_contents('php://input'), true) ?? [];

            if (empty($data['name']) || !isset($data['conditions']) || !isset($data['score_change'])) {
                return Response::error('name, conditions, and score_change required', 400);
            }

            $stmt = $db->prepare("
                INSERT INTO lead_scoring_rules 
                (workspace_id, name, description, conditions, score_change, max_applications, is_active)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            ");

            $stmt->execute([
                $workspaceId,
                $data['name'],
                $data['description'] ?? null,
                json_encode($data['conditions']),
                $data['score_change'],
                $data['max_applications'] ?? null,
                $data['is_active'] ?? 1
            ]);

            $id = $db->lastInsertId();

            return Response::json(['data' => ['id' => (int)$id]]);
        } catch (Exception $e) {
            return Response::error('Failed to create scoring rule: ' . $e->getMessage());
        }
    }

    /**
     * Update scoring rule
     */
    public static function updateScoringRule($id) {
        try {
            $workspaceId = self::getWorkspaceId();
            $db = Database::conn();
            $data = json_decode(file_get_contents('php://input'), true) ?? [];

            $updates = [];
            $params = [];

            $allowedFields = ['name', 'description', 'conditions', 'score_change', 'max_applications', 'is_active'];

            foreach ($allowedFields as $field) {
                if (array_key_exists($field, $data)) {
                    $updates[] = "$field = ?";
                    $params[] = $field === 'conditions' ? json_encode($data[$field]) : $data[$field];
                }
            }

            if (empty($updates)) {
                return Response::error('No valid fields to update', 400);
            }

            $params[] = $id;
            $params[] = $workspaceId;
            $stmt = $db->prepare("UPDATE lead_scoring_rules SET " . implode(', ', $updates) . " WHERE id = ? AND workspace_id = ?");
            $stmt->execute($params);

            return Response::json(['success' => true]);
        } catch (Exception $e) {
            return Response::error('Failed to update scoring rule: ' . $e->getMessage());
        }
    }

    /**
     * Delete scoring rule
     */
    public static function deleteScoringRule($id) {
        try {
            $workspaceId = self::getWorkspaceId();
            $db = Database::conn();

            $stmt = $db->prepare("DELETE FROM lead_scoring_rules WHERE id = ? AND workspace_id = ?");
            $stmt->execute([$id, $workspaceId]);

            return Response::json(['success' => true]);
        } catch (Exception $e) {
            return Response::error('Failed to delete scoring rule: ' . $e->getMessage());
        }
    }

    /**
     * Apply score to contact
     */
    public static function applyScore($contactId) {
        try {
            $workspaceId = self::getWorkspaceId();
            $db = Database::conn();
            $data = json_decode(file_get_contents('php://input'), true) ?? [];

            if (!isset($data['score_change'])) {
                return Response::error('score_change required', 400);
            }

            // Update contact score
            $stmt = $db->prepare("
                UPDATE contacts 
                SET score = GREATEST(0, score + ?) 
                WHERE id = ? AND workspace_id = ?
            ");
            $stmt->execute([$data['score_change'], $contactId, $workspaceId]);

            // Get new score
            $scoreStmt = $db->prepare("SELECT score FROM contacts WHERE id = ?");
            $scoreStmt->execute([$contactId]);
            $newScore = (int)$scoreStmt->fetchColumn();

            return Response::json(['data' => ['score' => $newScore]]);
        } catch (Exception $e) {
            return Response::error('Failed to apply score: ' . $e->getMessage());
        }
    }

    // ==================== CONTACT SEGMENTS ====================

    /**
     * List segments
     */
    public static function getSegments() {
        try {
            $workspaceId = self::getWorkspaceId();
            $db = Database::conn();

            $stmt = $db->prepare("
                SELECT * FROM contact_segments 
                WHERE workspace_id = ?
                ORDER BY name
            ");
            $stmt->execute([$workspaceId]);
            $segments = $stmt->fetchAll(PDO::FETCH_ASSOC);

            foreach ($segments as &$segment) {
                $segment['filters'] = json_decode($segment['filters'], true);
            }

            return Response::json(['data' => $segments]);
        } catch (Exception $e) {
            return Response::error('Failed to fetch segments: ' . $e->getMessage());
        }
    }

    /**
     * Create segment
     */
    public static function createSegment() {
        try {
            $workspaceId = self::getWorkspaceId();
            $userId = Auth::userIdOrFail();
            $db = Database::conn();
            $data = json_decode(file_get_contents('php://input'), true) ?? [];

            if (empty($data['name']) || !isset($data['filters'])) {
                return Response::error('name and filters required', 400);
            }

            $stmt = $db->prepare("
                INSERT INTO contact_segments 
                (workspace_id, name, description, filters, color, icon, is_dynamic, created_by)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ");

            $stmt->execute([
                $workspaceId,
                $data['name'],
                $data['description'] ?? null,
                json_encode($data['filters']),
                $data['color'] ?? '#6366f1',
                $data['icon'] ?? null,
                $data['is_dynamic'] ?? 1,
                $userId
            ]);

            $id = $db->lastInsertId();

            return Response::json(['data' => ['id' => (int)$id]]);
        } catch (Exception $e) {
            return Response::error('Failed to create segment: ' . $e->getMessage());
        }
    }

    /**
     * Update segment
     */
    public static function updateSegment($id) {
        try {
            $workspaceId = self::getWorkspaceId();
            $db = Database::conn();
            $data = json_decode(file_get_contents('php://input'), true) ?? [];

            $updates = [];
            $params = [];

            $allowedFields = ['name', 'description', 'filters', 'color', 'icon', 'is_dynamic'];

            foreach ($allowedFields as $field) {
                if (array_key_exists($field, $data)) {
                    $updates[] = "$field = ?";
                    $params[] = $field === 'filters' ? json_encode($data[$field]) : $data[$field];
                }
            }

            if (empty($updates)) {
                return Response::error('No valid fields to update', 400);
            }

            $params[] = $id;
            $params[] = $workspaceId;
            $stmt = $db->prepare("UPDATE contact_segments SET " . implode(', ', $updates) . " WHERE id = ? AND workspace_id = ?");
            $stmt->execute($params);

            return Response::json(['success' => true]);
        } catch (Exception $e) {
            return Response::error('Failed to update segment: ' . $e->getMessage());
        }
    }

    /**
     * Delete segment
     */
    public static function deleteSegment($id) {
        try {
            $workspaceId = self::getWorkspaceId();
            $db = Database::conn();

            $stmt = $db->prepare("DELETE FROM contact_segments WHERE id = ? AND workspace_id = ?");
            $stmt->execute([$id, $workspaceId]);

            return Response::json(['success' => true]);
        } catch (Exception $e) {
            return Response::error('Failed to delete segment: ' . $e->getMessage());
        }
    }

    /**
     * Get contacts in segment
     */
    public static function getSegmentContacts($id) {
        try {
            $workspaceId = self::getWorkspaceId();
            $db = Database::conn();

            // Get segment
            $segmentStmt = $db->prepare("SELECT * FROM contact_segments WHERE id = ? AND workspace_id = ?");
            $segmentStmt->execute([$id, $workspaceId]);
            $segment = $segmentStmt->fetch(PDO::FETCH_ASSOC);

            if (!$segment) {
                return Response::error('Segment not found', 404);
            }

            $filters = json_decode($segment['filters'], true);
            $limit = min((int)($_GET['limit'] ?? 50), 100);
            $offset = (int)($_GET['offset'] ?? 0);

            // Build dynamic query based on filters
            // This is a simplified version - in production you'd want more robust filter handling
            $where = ['workspace_id = ?'];
            $params = [$workspaceId];

            if (!empty($filters)) {
                foreach ($filters as $filter) {
                    $field = $filter['field'] ?? '';
                    $operator = $filter['operator'] ?? 'equals';
                    $value = $filter['value'] ?? '';

                    // Whitelist allowed fields
                    $allowedFields = ['stage_id', 'lead_source_id', 'assigned_to', 'rating', 'score', 'status', 'do_not_contact'];
                    if (!in_array($field, $allowedFields)) continue;

                    switch ($operator) {
                        case 'equals':
                            $where[] = "$field = ?";
                            $params[] = $value;
                            break;
                        case 'not_equals':
                            $where[] = "$field != ?";
                            $params[] = $value;
                            break;
                        case 'greater_than':
                            $where[] = "$field > ?";
                            $params[] = $value;
                            break;
                        case 'less_than':
                            $where[] = "$field < ?";
                            $params[] = $value;
                            break;
                        case 'is_null':
                            $where[] = "$field IS NULL";
                            break;
                        case 'is_not_null':
                            $where[] = "$field IS NOT NULL";
                            break;
                    }
                }
            }

            $whereClause = implode(' AND ', $where);

            $stmt = $db->prepare("
                SELECT * FROM contacts 
                WHERE $whereClause
                ORDER BY created_at DESC
                LIMIT ? OFFSET ?
            ");
            $params[] = $limit;
            $params[] = $offset;
            $stmt->execute($params);
            $contacts = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // Get count
            $countParams = array_slice($params, 0, -2);
            $countStmt = $db->prepare("SELECT COUNT(*) FROM contacts WHERE $whereClause");
            $countStmt->execute($countParams);
            $total = (int)$countStmt->fetchColumn();

            // Update segment count
            $db->prepare("UPDATE contact_segments SET contact_count = ?, last_calculated_at = NOW() WHERE id = ?")
                ->execute([$total, $id]);

            return Response::json([
                'data' => $contacts,
                'meta' => [
                    'total' => $total,
                    'limit' => $limit,
                    'offset' => $offset
                ]
            ]);
        } catch (Exception $e) {
            return Response::error('Failed to fetch segment contacts: ' . $e->getMessage());
        }
    }
}
