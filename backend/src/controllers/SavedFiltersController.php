<?php

/**
 * SavedFiltersController
 * CRUD for ticket_saved_filters
 */

use Xordon\Database;
use Xordon\Response;
use Xordon\Auth;
use PDO;

class SavedFiltersController {

    // GET /helpdesk/saved-filters
    public static function list() {
        $userId = Auth::userIdOrFail();
        $workspace = Auth::resolveWorkspace($userId);
        if (!$workspace) Response::error('Workspace not found', 404);
        $workspaceId = $workspace['id'];

        $db = Database::conn();
        $stmt = $db->prepare("SELECT * FROM ticket_saved_filters WHERE workspace_id = ? ORDER BY is_default DESC, name ASC");
        $stmt->execute([$workspaceId]);
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Decode JSON criteria
        foreach ($rows as &$r) {
            $r['filter_criteria'] = $r['filter_criteria'] ? json_decode($r['filter_criteria'], true) : [];
        }

        Response::json($rows);
    }

    // POST /helpdesk/saved-filters
    public static function create() {
        $userId = Auth::userIdOrFail();
        $workspace = Auth::resolveWorkspace($userId);
        if (!$workspace) Response::error('Workspace not found', 404);
        $workspaceId = $workspace['id'];

        $db = Database::conn();
        $data = get_json_input();
        if (empty($data['name']) || !isset($data['filter_criteria'])) {
            Response::error('Missing required fields', 400);
            return;
        }

        $isShared = isset($data['is_shared']) ? (bool)$data['is_shared'] : false;
        $isDefault = isset($data['is_default']) ? (bool)$data['is_default'] : false;

        try {
            $db->beginTransaction();

            if ($isDefault) {
                // unset existing defaults for workspace
                $db->prepare("UPDATE ticket_saved_filters SET is_default = FALSE WHERE workspace_id = ?")->execute([$workspaceId]);
            }

            $ins = $db->prepare("INSERT INTO ticket_saved_filters (workspace_id, user_id, name, description, filter_criteria, is_shared, is_default, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())");
            $ins->execute([
                $workspaceId,
                $data['user_id'] ?? $userId,
                $data['name'],
                $data['description'] ?? null,
                json_encode($data['filter_criteria']),
                $isShared ? 1 : 0,
                $isDefault ? 1 : 0,
            ]);

            $id = $db->lastInsertId();
            $db->commit();

            Response::json(['id' => (int)$id], 201);
        } catch (Exception $e) {
            if ($db->inTransaction()) $db->rollBack();
            Logger::error('SavedFilters create error: ' . $e->getMessage());
            Response::error('Failed to create saved filter', 500);
        }
    }

    // PUT /helpdesk/saved-filters/:id
    public static function update($id) {
        $userId = Auth::userIdOrFail();
        $workspace = Auth::resolveWorkspace($userId);
        if (!$workspace) Response::error('Workspace not found', 404);
        $workspaceId = $workspace['id'];

        $db = Database::conn();
        $data = get_json_input();

        $stmt = $db->prepare("SELECT * FROM ticket_saved_filters WHERE id = ? AND workspace_id = ?");
        $stmt->execute([$id, $workspaceId]);
        $existing = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$existing) {
            Response::error('Saved filter not found', 404);
            return;
        }

        $fields = [];
        $params = [];

        if (isset($data['name'])) { $fields[] = 'name = ?'; $params[] = $data['name']; }
        if (array_key_exists('description', $data)) { $fields[] = 'description = ?'; $params[] = $data['description']; }
        if (isset($data['filter_criteria'])) { $fields[] = 'filter_criteria = ?'; $params[] = json_encode($data['filter_criteria']); }
        if (isset($data['is_shared'])) { $fields[] = 'is_shared = ?'; $params[] = $data['is_shared'] ? 1 : 0; }
        if (isset($data['is_default'])) { $fields[] = 'is_default = ?'; $params[] = $data['is_default'] ? 1 : 0; }

        if (empty($fields)) {
            Response::json(['message' => 'No changes']);
            return;
        }

        try {
            $db->beginTransaction();

            if (isset($data['is_default']) && $data['is_default']) {
                // unset others
                $db->prepare("UPDATE ticket_saved_filters SET is_default = FALSE WHERE workspace_id = ?")->execute([$workspaceId]);
            }

            $sql = "UPDATE ticket_saved_filters SET " . implode(', ', $fields) . ", updated_at = NOW() WHERE id = ? AND workspace_id = ?";
            $params[] = $id;
            $params[] = $workspaceId;
            $upd = $db->prepare($sql);
            $upd->execute($params);

            $db->commit();

            Response::json(['updated' => true]);
        } catch (Exception $e) {
            if ($db->inTransaction()) $db->rollBack();
            Logger::error('SavedFilters update error: ' . $e->getMessage());
            Response::error('Failed to update saved filter', 500);
        }
    }

    // DELETE /helpdesk/saved-filters/:id
    public static function delete($id) {
        $userId = Auth::userIdOrFail();
        $workspace = Auth::resolveWorkspace($userId);
        if (!$workspace) Response::error('Workspace not found', 404);
        $workspaceId = $workspace['id'];

        $db = Database::conn();
        $stmt = $db->prepare("DELETE FROM ticket_saved_filters WHERE id = ? AND workspace_id = ?");
        $stmt->execute([$id, $workspaceId]);

        Response::json(['deleted' => true]);
    }
}
