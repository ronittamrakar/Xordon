<?php

class TagsController {
    private static function getWorkspaceScope(): array {
        $ctx = $GLOBALS['tenantContext'] ?? null;
        if ($ctx && isset($ctx->workspaceId)) {
            return ['col' => 'workspace_id', 'val' => (int)$ctx->workspaceId];
        }
        return ['col' => 'user_id', 'val' => Auth::userIdOrFail()];
    }
    
    public static function index() {
        Auth::userIdOrFail();

        try {
            $pdo = Database::conn();
            $scope = self::getWorkspaceScope();
            $stmt = $pdo->prepare("SELECT * FROM tags WHERE {$scope['col']} = ? ORDER BY name ASC");
            $stmt->execute([$scope['val']]);
            $tags = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            Response::json($tags);
        } catch (Exception $e) {
            Response::error('Failed to fetch tags: ' . $e->getMessage(), 500);
        }
    }

    public static function create() {
        $userId = Auth::userIdOrFail();

        $input = json_decode(file_get_contents('php://input'), true);
        $name = trim($input['name'] ?? '');
        $color = trim($input['color'] ?? '#3b82f6');

        if (empty($name)) {
            Response::error('Tag name is required', 400);
            return;
        }

        try {
            $pdo = Database::conn();
            
            // Check if tag already exists for this user/workspace
            $scope = self::getWorkspaceScope();
            $stmt = $pdo->prepare("SELECT id FROM tags WHERE {$scope['col']} = ? AND name = ?");
            $stmt->execute([$scope['val'], $name]);
            if ($stmt->fetch()) {
                Response::error('Tag with this name already exists', 400);
                return;
            }

            $ctx = $GLOBALS['tenantContext'] ?? null;
            $workspaceId = ($ctx && isset($ctx->workspaceId)) ? (int)$ctx->workspaceId : null;
            $stmt = $pdo->prepare('INSERT INTO tags (user_id, workspace_id, name, color) VALUES (?, ?, ?, ?)');
            $stmt->execute([$userId, $workspaceId, $name, $color]);
            
            $tagId = $pdo->lastInsertId();
            
            // Fetch the created tag
            $stmt = $pdo->prepare('SELECT * FROM tags WHERE id = ?');
            $stmt->execute([$tagId]);
            $tag = $stmt->fetch(PDO::FETCH_ASSOC);
            
            Response::json($tag);
        } catch (Exception $e) {
            Response::error('Failed to create tag: ' . $e->getMessage(), 500);
        }
    }

    public static function update($id) {
        $userId = Auth::userIdOrFail();

        $input = json_decode(file_get_contents('php://input'), true);
        $name = trim($input['name'] ?? '');
        $color = trim($input['color'] ?? '');

        if (empty($name)) {
            Response::error('Tag name is required', 400);
            return;
        }

        try {
            $pdo = Database::conn();
            
            // Check if tag exists and belongs to user/workspace
            $scope = self::getWorkspaceScope();
            $stmt = $pdo->prepare("SELECT id FROM tags WHERE id = ? AND {$scope['col']} = ?");
            $stmt->execute([$id, $scope['val']]);
            if (!$stmt->fetch()) {
                Response::error('Tag not found', 404);
                return;
            }

            // Check if another tag with this name already exists
            $stmt = $pdo->prepare("SELECT id FROM tags WHERE {$scope['col']} = ? AND name = ? AND id != ?");
            $stmt->execute([$scope['val'], $name, $id]);
            if ($stmt->fetch()) {
                Response::error('Tag with this name already exists', 400);
                return;
            }

            $stmt = $pdo->prepare("UPDATE tags SET name = ?, color = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND {$scope['col']} = ?");
            $stmt->execute([$name, $color, $id, $scope['val']]);
            
            // Fetch the updated tag
            $stmt = $pdo->prepare('SELECT * FROM tags WHERE id = ?');
            $stmt->execute([$id]);
            $tag = $stmt->fetch(PDO::FETCH_ASSOC);
            
            Response::json($tag);
        } catch (Exception $e) {
            Response::error('Failed to update tag: ' . $e->getMessage(), 500);
        }
    }

    public static function delete($id) {
        Auth::userIdOrFail();

        try {
            $pdo = Database::conn();
            $scope = self::getWorkspaceScope();
            
            // Check if tag exists and belongs to user/workspace
            $stmt = $pdo->prepare("SELECT id FROM tags WHERE id = ? AND {$scope['col']} = ?");
            $stmt->execute([$id, $scope['val']]);
            if (!$stmt->fetch()) {
                Response::error('Tag not found', 404);
                return;
            }

            // Delete the tag (recipient_tags will be deleted automatically due to foreign key constraint)
            $stmt = $pdo->prepare("DELETE FROM tags WHERE id = ? AND {$scope['col']} = ?");
            $stmt->execute([$id, $scope['val']]);
            
            Response::json(['message' => 'Tag deleted successfully']);
        } catch (Exception $e) {
            Response::error('Failed to delete tag: ' . $e->getMessage(), 500);
        }
    }

    public static function addToRecipient() {
        $userId = Auth::userIdOrFail();

        $input = json_decode(file_get_contents('php://input'), true);
        $recipientId = (int)($input['recipient_id'] ?? 0);
        $tagId = (int)($input['tag_id'] ?? 0);

        if (!$recipientId || !$tagId) {
            Response::error('Recipient ID and Tag ID are required', 400);
            return;
        }

        try {
            $pdo = Database::conn();
            
            // Verify recipient belongs to user (through campaign)
            $stmt = $pdo->prepare('
                SELECT r.id 
                FROM recipients r 
                JOIN campaigns c ON r.campaign_id = c.id 
                WHERE r.id = ? AND c.user_id = ?
            ');
            $stmt->execute([$recipientId, $userId]);
            if (!$stmt->fetch()) {
                Response::error('Recipient not found', 404);
                return;
            }

            // Verify tag belongs to user
            $stmt = $pdo->prepare('SELECT id FROM tags WHERE id = ? AND user_id = ?');
            $stmt->execute([$tagId, $userId]);
            if (!$stmt->fetch()) {
                Response::error('Tag not found', 404);
                return;
            }

            // Add tag to recipient (ignore if already exists)
            $stmt = $pdo->prepare('INSERT IGNORE INTO recipient_tags (recipient_id, tag_id) VALUES (?, ?)');
            $stmt->execute([$recipientId, $tagId]);
            
            Response::json(['message' => 'Tag added to recipient successfully']);
        } catch (Exception $e) {
            Response::error('Failed to add tag to recipient: ' . $e->getMessage(), 500);
        }
    }

    public static function removeFromRecipient() {
        $userId = Auth::userIdOrFail();

        $input = json_decode(file_get_contents('php://input'), true);
        $recipientId = (int)($input['recipient_id'] ?? 0);
        $tagId = (int)($input['tag_id'] ?? 0);

        if (!$recipientId || !$tagId) {
            Response::error('Recipient ID and Tag ID are required', 400);
            return;
        }

        try {
            $pdo = Database::conn();
            
            // Verify recipient belongs to user (through campaign)
            $stmt = $pdo->prepare('
                SELECT r.id 
                FROM recipients r 
                JOIN campaigns c ON r.campaign_id = c.id 
                WHERE r.id = ? AND c.user_id = ?
            ');
            $stmt->execute([$recipientId, $userId]);
            if (!$stmt->fetch()) {
                Response::error('Recipient not found', 404);
                return;
            }

            // Remove tag from recipient
            $stmt = $pdo->prepare('DELETE FROM recipient_tags WHERE recipient_id = ? AND tag_id = ?');
            $stmt->execute([$recipientId, $tagId]);
            
            Response::json(['message' => 'Tag removed from recipient successfully']);
        } catch (Exception $e) {
            Response::error('Failed to remove tag from recipient: ' . $e->getMessage(), 500);
        }
    }

    public static function bulkAddToRecipients() {
        $userId = Auth::userIdOrFail();

        $input = json_decode(file_get_contents('php://input'), true);
        $recipientIds = $input['recipient_ids'] ?? [];
        $tagId = (int)($input['tag_id'] ?? 0);

        if (empty($recipientIds) || !$tagId) {
            Response::error('Recipient IDs and Tag ID are required', 400);
            return;
        }

        try {
            $pdo = Database::conn();
            
            // Verify tag belongs to user
            $stmt = $pdo->prepare('SELECT id FROM tags WHERE id = ? AND user_id = ?');
            $stmt->execute([$tagId, $userId]);
            if (!$stmt->fetch()) {
                Response::error('Tag not found', 404);
                return;
            }

            // Verify all recipients belong to user (through campaigns)
            $placeholders = str_repeat('?,', count($recipientIds) - 1) . '?';
            $stmt = $pdo->prepare("
                SELECT r.id 
                FROM recipients r 
                JOIN campaigns c ON r.campaign_id = c.id 
                WHERE r.id IN ($placeholders) AND c.user_id = ?
            ");
            $stmt->execute([...$recipientIds, $userId]);
            $validRecipients = $stmt->fetchAll(PDO::FETCH_COLUMN);

            if (count($validRecipients) !== count($recipientIds)) {
                Response::error('Some recipients not found or do not belong to you', 400);
                return;
            }

            // Add tag to all recipients
            $stmt = $pdo->prepare('INSERT IGNORE INTO recipient_tags (recipient_id, tag_id) VALUES (?, ?)');
            foreach ($recipientIds as $recipientId) {
                $stmt->execute([$recipientId, $tagId]);
            }
            
            Response::json(['message' => 'Tag added to recipients successfully']);
        } catch (Exception $e) {
            Response::error('Failed to add tag to recipients: ' . $e->getMessage(), 500);
        }
    }
}
?>