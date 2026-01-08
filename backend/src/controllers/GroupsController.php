<?php

require_once __DIR__ . '/../Database.php';
require_once __DIR__ . '/../Auth.php';
require_once __DIR__ . '/../Response.php';
require_once __DIR__ . '/../traits/WorkspaceScoped.php';

class GroupsController {
    use WorkspaceScoped;
    
    public static function index() {
        try {
            $userId = Auth::userIdOrFail();
            $db = Database::conn();
            
            $scope = self::workspaceWhere('g');
            $workspaceId = $scope['params'][0];
            
            $stmt = $db->prepare("
                SELECT id, name, description, parent_id, created_at, updated_at,
                       (SELECT COUNT(*) FROM sms_campaigns sc WHERE sc.group_id = g.id AND sc.workspace_id = ?) as campaign_count,
                       (SELECT COUNT(*) FROM sms_sequences ssq WHERE ssq.group_id = g.id AND ssq.workspace_id = ?) as sequence_count,
                       (SELECT COUNT(*) FROM sms_templates st WHERE st.group_id = g.id AND st.workspace_id = ?) as template_count,
                       (SELECT COUNT(*) FROM sms_recipients sr WHERE sr.group_id = g.id AND sr.workspace_id = ?) as recipient_count
                FROM groups g 
                WHERE {$scope['sql']} 
                ORDER BY name ASC
            ");
            $stmt->execute([$workspaceId, $workspaceId, $workspaceId, $workspaceId, ...$scope['params']]);
            $groups = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            Response::json($groups);
            
        } catch (Exception $e) {
            Response::error('Failed to fetch groups: ' . $e->getMessage(), 500);
        }
    }
    
    public static function create() {
        try {
            $userId = Auth::userIdOrFail();
            $input = json_decode(file_get_contents('php://input'), true);
            
            if (!isset($input['name']) || empty(trim($input['name']))) {
                Response::error('Group name is required', 400);
                return;
            }
            
            $db = Database::conn();
            $scope = self::workspaceWhere();
            $workspaceId = $scope['params'][0];
            
            // Check if group name already exists for this user
            $stmt = $db->prepare("SELECT id FROM groups WHERE " . str_replace('?', ':ws_id', $scope['sql']) . " AND name = :name");
            $stmt->execute([
                'ws_id' => $workspaceId,
                'name' => trim($input['name'])
            ]);
            
            if ($stmt->fetch()) {
                Response::error('A group with this name already exists', 400);
                return;
            }
            
            $stmt = $db->prepare("
                INSERT INTO groups (user_id, workspace_id, name, description, parent_id, created_at, updated_at) 
                VALUES (:user_id, :workspace_id, :name, :description, :parent_id, NOW(), NOW())
            ");
            
            $stmt->execute([
                'user_id' => $userId,
                'workspace_id' => $workspaceId,
                'name' => trim($input['name']),
                'description' => isset($input['description']) ? trim($input['description']) : null,
                'parent_id' => isset($input['parent_id']) ? $input['parent_id'] : null
            ]);
            
            $groupId = $db->lastInsertId();
            
            // Return the created group
            $stmt = $db->prepare("
                SELECT id, name, description, parent_id, created_at, updated_at 
                FROM groups 
                WHERE id = :id AND " . str_replace('?', ':ws_id', $scope['sql'])
            );
            $stmt->execute(['id' => $groupId, 'ws_id' => $workspaceId]);
            $group = $stmt->fetch(PDO::FETCH_ASSOC);
            
            Response::json($group, 201);
            
        } catch (Exception $e) {
            Response::error('Failed to create group: ' . $e->getMessage(), 500);
        }
    }
    
    public static function update($id) {
        try {
            $userId = Auth::userIdOrFail();
            $input = json_decode(file_get_contents('php://input'), true);
            
            if (!isset($input['name']) || empty(trim($input['name']))) {
                Response::error('Group name is required', 400);
                return;
            }
            
            $db = Database::conn();
            $scope = self::workspaceWhere();
            $workspaceId = $scope['params'][0];
            
            // Check if group exists and belongs to user
            $stmt = $db->prepare("SELECT id FROM groups WHERE id = :id AND " . str_replace('?', ':ws_id', $scope['sql']));
            $stmt->execute(['id' => $id, 'ws_id' => $workspaceId]);
            
            if (!$stmt->fetch()) {
                Response::error('Group not found', 404);
                return;
            }
            
            // Check if new name conflicts with existing groups (excluding current group)
            $stmt = $db->prepare("
                SELECT id FROM groups 
                WHERE " . str_replace('?', ':ws_id', $scope['sql']) . " AND name = :name AND id != :id
            ");
            $stmt->execute([
                'ws_id' => $workspaceId,
                'name' => trim($input['name']),
                'id' => $id
            ]);
            
            if ($stmt->fetch()) {
                Response::error('A group with this name already exists', 400);
                return;
            }
            
            $stmt = $db->prepare("
                UPDATE groups 
                SET name = :name, description = :description, parent_id = :parent_id, updated_at = NOW()
                WHERE id = :id AND " . str_replace('?', ':ws_id', $scope['sql']) . "
            ");
            
            $stmt->execute([
                'id' => $id,
                'ws_id' => $workspaceId,
                'name' => trim($input['name']),
                'description' => isset($input['description']) ? trim($input['description']) : null,
                'parent_id' => isset($input['parent_id']) ? $input['parent_id'] : null
            ]);
            
            // Return the updated group
            $stmt = $db->prepare("
                SELECT id, name, description, parent_id, created_at, updated_at 
                FROM groups 
                WHERE id = :id AND " . str_replace('?', ':ws_id', $scope['sql'])
            );
            $stmt->execute(['id' => $id, 'ws_id' => $workspaceId]);
            $group = $stmt->fetch(PDO::FETCH_ASSOC);
            
            Response::json($group);
            
        } catch (Exception $e) {
            Response::error('Failed to update group: ' . $e->getMessage(), 500);
        }
    }
    
    public static function delete($id) {
        try {
            $userId = Auth::userIdOrFail();
            $db = Database::conn();
            $scope = self::workspaceWhere();
            $workspaceId = $scope['params'][0];
            
            // Check if group exists and belongs to user
            $stmt = $db->prepare("SELECT id FROM groups WHERE id = :id AND " . str_replace('?', ':ws_id', $scope['sql']));
            $stmt->execute(['id' => $id, 'ws_id' => $workspaceId]);
            
            if (!$stmt->fetch()) {
                Response::error('Group not found', 404);
                return;
            }
            
            // Check if group has any campaigns, sequences, or templates
            $stmt = $db->prepare("
                SELECT 
                    (SELECT COUNT(*) FROM sms_campaigns WHERE group_id = ? AND workspace_id = ?) as campaign_count,
                    (SELECT COUNT(*) FROM sms_sequences WHERE group_id = ? AND workspace_id = ?) as sequence_count,
                    (SELECT COUNT(*) FROM sms_templates WHERE group_id = ? AND workspace_id = ?) as template_count,
                    (SELECT COUNT(*) FROM sms_recipients WHERE group_id = ? AND workspace_id = ?) as recipient_count
            ");
            $stmt->execute([$id, $workspaceId, $id, $workspaceId, $id, $workspaceId, $id, $workspaceId]);
            $counts = $stmt->fetch(PDO::FETCH_ASSOC);
            
            $totalItems = $counts['campaign_count'] + $counts['sequence_count'] + $counts['template_count'] + $counts['recipient_count'];
            
            if ($totalItems > 0) {
                Response::error('Cannot delete group that contains items', 400, [
                    'details' => [
                        'campaigns' => $counts['campaign_count'],
                        'sequences' => $counts['sequence_count'],
                        'templates' => $counts['template_count'],
                        'recipients' => $counts['recipient_count']
                    ]
                ]);
                return;
            }
            
            // Delete the group
            $stmt = $db->prepare("DELETE FROM groups WHERE id = :id AND " . str_replace('?', ':ws_id', $scope['sql']));
            $stmt->execute(['id' => $id, 'ws_id' => $workspaceId]);
            
            Response::json(['message' => 'Group deleted successfully']);
            
        } catch (Exception $e) {
            Response::error('Failed to delete group: ' . $e->getMessage(), 500);
        }
    }

    public static function moveItem() {
        try {
            $userId = Auth::userIdOrFail();
            $input = json_decode(file_get_contents('php://input'), true);
            
            if (!isset($input['item_type']) || !isset($input['item_id'])) {
                Response::error('Item type and ID are required', 400);
                return;
            }
            
            $itemType = $input['item_type'];
            $itemId = $input['item_id'];
            $groupId = isset($input['group_id']) ? $input['group_id'] : null;
            
            $db = Database::conn();
            $scope = self::workspaceWhere();
            $workspaceId = $scope['params'][0];
            
            // If group_id is provided, verify it exists and belongs to workspace
            if ($groupId !== null) {
                $stmt = $db->prepare("SELECT id FROM groups WHERE id = :id AND " . str_replace('?', ':ws_id', $scope['sql']));
                $stmt->execute(['id' => $groupId, 'ws_id' => $workspaceId]);
                
                if (!$stmt->fetch()) {
                    Response::error('Group not found', 404);
                    return;
                }
            }
            
            // Update the item based on type
            switch ($itemType) {
                case 'campaign':
                    $stmt = $db->prepare("
                        UPDATE sms_campaigns 
                        SET group_id = :group_id, updated_at = NOW()
                        WHERE id = :item_id AND workspace_id = :ws_id
                    ");
                    break;
                    
                case 'sequence':
                    $stmt = $db->prepare("
                        UPDATE sms_sequences 
                        SET group_id = :group_id, updated_at = NOW()
                        WHERE id = :item_id AND workspace_id = :ws_id
                    ");
                    break;
                    
                case 'template':
                    $stmt = $db->prepare("
                        UPDATE sms_templates 
                        SET group_id = :group_id, updated_at = NOW()
                        WHERE id = :item_id AND workspace_id = :ws_id
                    ");
                    break;

                case 'recipient':
                    $stmt = $db->prepare("
                        UPDATE sms_recipients 
                        SET group_id = :group_id, updated_at = NOW()
                        WHERE id = :item_id AND workspace_id = :ws_id
                    ");
                    break;
                    
                default:
                    Response::error('Invalid item type', 400);
                    return;
            }
            
            $stmt->execute([
                'group_id' => $groupId,
                'item_id' => $itemId,
                'ws_id' => $workspaceId
            ]);
            
            if ($stmt->rowCount() === 0) {
                Response::error('Item not found or access denied', 404);
                return;
            }
            
            Response::json(['message' => 'Item moved successfully']);
            
        } catch (Exception $e) {
            Response::error('Failed to move item: ' . $e->getMessage(), 500);
        }
    }
    
    public static function bulkMoveItems() {
        try {
            $userId = Auth::userIdOrFail();
            $input = json_decode(file_get_contents('php://input'), true);
            
            if (!isset($input['item_type']) || !isset($input['item_ids']) || !is_array($input['item_ids'])) {
                Response::error('Item type and IDs array are required', 400);
                return;
            }
            
            $itemType = $input['item_type'];
            $itemIds = $input['item_ids'];
            $groupId = isset($input['group_id']) ? $input['group_id'] : null;
            
            if (empty($itemIds)) {
                Response::error('Item IDs array cannot be empty', 400);
                return;
            }
            
            $db = Database::conn();
            $scope = self::workspaceWhere();
            $workspaceId = $scope['params'][0];
            
            // Validate group exists if provided
            if ($groupId) {
                $stmt = $db->prepare("SELECT id FROM groups WHERE id = :id AND " . str_replace('?', ':ws_id', $scope['sql']));
                $stmt->execute(['id' => $groupId, 'ws_id' => $workspaceId]);
                
                if (!$stmt->fetch()) {
                    Response::error('Group not found', 404);
                    return;
                }
            }
            
            // Create placeholders for the IN clause
            $placeholders = str_repeat('?,', count($itemIds) - 1) . '?';
            
            // Update items based on type
            switch ($itemType) {
                case 'sms_recipient':
                    $stmt = $db->prepare("
                        UPDATE sms_recipients 
                        SET group_id = ?, updated_at = NOW()
                        WHERE id IN ($placeholders) AND workspace_id = ?
                    ");
                    $params = array_merge([$groupId], $itemIds, [$workspaceId]);
                    break;
                    
                case 'campaign':
                    $stmt = $db->prepare("
                        UPDATE sms_campaigns 
                        SET group_id = ?, updated_at = NOW()
                        WHERE id IN ($placeholders) AND workspace_id = ?
                    ");
                    $params = array_merge([$groupId], $itemIds, [$workspaceId]);
                    break;
                    
                case 'sequence':
                    $stmt = $db->prepare("
                        UPDATE sms_sequences 
                        SET group_id = ?, updated_at = NOW()
                        WHERE id IN ($placeholders) AND workspace_id = ?
                    ");
                    $params = array_merge([$groupId], $itemIds, [$workspaceId]);
                    break;
                    
                case 'template':
                    $stmt = $db->prepare("
                        UPDATE sms_templates 
                        SET group_id = ?, updated_at = NOW()
                        WHERE id IN ($placeholders) AND workspace_id = ?
                    ");
                    $params = array_merge([$groupId], $itemIds, [$workspaceId]);
                    break;
                    
                default:
                    Response::error('Invalid item type', 400);
                    return;
            }
            
            $stmt->execute($params);
            $affectedRows = $stmt->rowCount();
            
            Response::json(['message' => "Items moved successfully", 'affected' => $affectedRows]);
            
        } catch (Exception $e) {
            Response::error('Failed to move items: ' . $e->getMessage(), 500);
        }
    }
}