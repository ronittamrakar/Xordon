<?php
require_once __DIR__ . '/../Auth.php';
require_once __DIR__ . '/../Database.php';
require_once __DIR__ . '/../Response.php';
require_once __DIR__ . '/../Logger.php';

class FoldersController {
    private static function getWorkspaceScope(): array {
        $ctx = $GLOBALS['tenantContext'] ?? null;
        if ($ctx && isset($ctx->workspaceId)) {
            return ['col' => 'workspace_id', 'val' => (int)$ctx->workspaceId];
        }
        return ['col' => 'user_id', 'val' => Auth::userIdOrFail()];
    }
    
    public static function index() {
        error_log("FoldersController::index() called");
        $userId = Auth::userIdOrFail();
        error_log("FoldersController::index() - User ID: $userId");
        
        try {
            $pdo = Database::conn();
            $scope = self::getWorkspaceScope();
            $stmt = $pdo->prepare("
                SELECT id, name, parent_id, created_at, updated_at 
                FROM folders 
                WHERE {$scope['col']} = ? 
                ORDER BY name ASC
            ");
            $stmt->execute([$scope['val']]);
            $folders = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            Response::json($folders);
        } catch (Exception $e) {
            Logger::error('Failed to fetch folders', [
                'user_id' => $userId,
                'error' => $e->getMessage()
            ]);
            Response::error('Failed to fetch folders');
        }
    }
    
    public static function create() {
        $userId = Auth::userIdOrFail();
        $data = get_json_body();
        
        if (empty($data['name'])) {
            Response::error('Folder name is required', 400);
        }
        
        try {
            $pdo = Database::conn();
            $ctx = $GLOBALS['tenantContext'] ?? null;
            $workspaceId = ($ctx && isset($ctx->workspaceId)) ? (int)$ctx->workspaceId : null;
            $stmt = $pdo->prepare('
                INSERT INTO folders (user_id, workspace_id, name, parent_id, created_at, updated_at) 
                VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            ');
            $stmt->execute([
                $userId,
                $workspaceId,
                $data['name'], 
                $data['parent_id'] ?? null
            ]);
            
            $folderId = $pdo->lastInsertId();
            
            // Fetch the created folder
            $stmt = $pdo->prepare('SELECT id, name, parent_id, created_at, updated_at FROM folders WHERE id = ?');
            $stmt->execute([$folderId]);
            $folder = $stmt->fetch(PDO::FETCH_ASSOC);
            
            Logger::info('Folder created', [
                'user_id' => $userId,
                'folder_id' => $folderId,
                'folder_name' => $data['name']
            ]);
            
            Response::json($folder);
        } catch (Exception $e) {
            Logger::error('Failed to create folder', [
                'user_id' => $userId,
                'error' => $e->getMessage()
            ]);
            Response::error('Failed to create folder');
        }
    }
    
    public static function update($id) {
        $userId = Auth::userIdOrFail();
        $data = get_json_body();
        
        if (empty($data['name'])) {
            Response::error('Folder name is required', 400);
        }
        
        try {
            $pdo = Database::conn();
            
            // Check if folder belongs to user/workspace
            $scope = self::getWorkspaceScope();
            $stmt = $pdo->prepare("SELECT id FROM folders WHERE id = ? AND {$scope['col']} = ?");
            $stmt->execute([$id, $scope['val']]);
            if (!$stmt->fetch()) {
                Response::error('Folder not found', 404);
            }
            
            // Update folder
            $stmt = $pdo->prepare("
                UPDATE folders 
                SET name = ?, parent_id = ?, updated_at = CURRENT_TIMESTAMP 
                WHERE id = ? AND {$scope['col']} = ?
            ");
            $stmt->execute([
                $data['name'], 
                $data['parent_id'] ?? null, 
                $id, 
                $scope['val']
            ]);
            
            // Fetch updated folder
            $stmt = $pdo->prepare('SELECT id, name, parent_id, created_at, updated_at FROM folders WHERE id = ?');
            $stmt->execute([$id]);
            $folder = $stmt->fetch(PDO::FETCH_ASSOC);
            
            Logger::info('Folder updated', [
                'user_id' => $userId,
                'folder_id' => $id,
                'folder_name' => $data['name']
            ]);
            
            Response::json($folder);
        } catch (Exception $e) {
            Logger::error('Failed to update folder', [
                'user_id' => $userId,
                'folder_id' => $id,
                'error' => $e->getMessage()
            ]);
            Response::error('Failed to update folder');
        }
    }
    
    public static function delete($id) {
        $userId = Auth::userIdOrFail();
        
        try {
            $pdo = Database::conn();
            $scope = self::getWorkspaceScope();
            
            // Check if folder belongs to user/workspace
            $stmt = $pdo->prepare("SELECT id FROM folders WHERE id = ? AND {$scope['col']} = ?");
            $stmt->execute([$id, $scope['val']]);
            if (!$stmt->fetch()) {
                Response::error('Folder not found', 404);
            }
            
            // Check if folder has campaigns or forms
            $stmt = $pdo->prepare('SELECT COUNT(*) as count FROM campaigns WHERE folder_id = ?');
            $stmt->execute([$id]);
            $campaignCount = $stmt->fetch()['count'];
            
            $stmt = $pdo->prepare('SELECT COUNT(*) as count FROM forms WHERE folder_id = ?');
            $stmt->execute([$id]);
            $formCount = $stmt->fetch()['count'];
            
            if ($campaignCount > 0 || $formCount > 0) {
                Response::error('Cannot delete folder that contains campaigns or forms. Please move them first.', 400);
            }
            
            // Delete folder
            $stmt = $pdo->prepare("DELETE FROM folders WHERE id = ? AND {$scope['col']} = ?");
            $stmt->execute([$id, $scope['val']]);
            
            Logger::info('Folder deleted', [
                'user_id' => $userId,
                'folder_id' => $id
            ]);
            
            Response::json(['success' => true]);
        } catch (Exception $e) {
            Logger::error('Failed to delete folder', [
                'user_id' => $userId,
                'folder_id' => $id,
                'error' => $e->getMessage()
            ]);
            Response::error('Failed to delete folder');
        }
    }
    
    public static function moveCampaign() {
        $userId = Auth::userIdOrFail();
        $data = get_json_body();
        
        if (empty($data['campaign_id'])) {
            Response::error('Campaign ID is required', 400);
        }
        
        try {
            $pdo = Database::conn();
            
            // Verify campaign belongs to user
            $stmt = $pdo->prepare('SELECT id FROM campaigns WHERE id = ? AND user_id = ?');
            $stmt->execute([$data['campaign_id'], $userId]);
            if (!$stmt->fetch()) {
                Response::error('Campaign not found', 404);
            }
            
            // Verify folder belongs to user (if folder_id is provided)
            if (!empty($data['folder_id'])) {
                $stmt = $pdo->prepare('SELECT id FROM folders WHERE id = ? AND user_id = ?');
                $stmt->execute([$data['folder_id'], $userId]);
                if (!$stmt->fetch()) {
                    Response::error('Folder not found', 404);
                }
            }
            
            // Move campaign
            $stmt = $pdo->prepare('UPDATE campaigns SET folder_id = ? WHERE id = ? AND user_id = ?');
            $stmt->execute([$data['folder_id'] ?? null, $data['campaign_id'], $userId]);
            
            Logger::info('Campaign moved to folder', [
                'user_id' => $userId,
                'campaign_id' => $data['campaign_id'],
                'folder_id' => $data['folder_id'] ?? null
            ]);
            
            Response::json(['success' => true]);
        } catch (Exception $e) {
            Logger::error('Failed to move campaign', [
                'user_id' => $userId,
                'error' => $e->getMessage()
            ]);
            Response::error('Failed to move campaign');
        }
    }
    
    public static function moveForm() {
        $userId = Auth::userIdOrFail();
        $data = get_json_body();
        
        if (empty($data['form_id'])) {
            Response::error('Form ID is required', 400);
        }
        
        try {
            $pdo = Database::conn();
            
            // Verify form belongs to user
            $stmt = $pdo->prepare('SELECT id FROM forms WHERE id = ? AND user_id = ?');
            $stmt->execute([$data['form_id'], $userId]);
            if (!$stmt->fetch()) {
                Response::error('Form not found', 404);
            }
            
            // Verify folder belongs to user (if folder_id is provided)
            if (!empty($data['folder_id'])) {
                $stmt = $pdo->prepare('SELECT id FROM folders WHERE id = ? AND user_id = ?');
                $stmt->execute([$data['folder_id'], $userId]);
                if (!$stmt->fetch()) {
                    Response::error('Folder not found', 404);
                }
            }
            
            // Move form
            $stmt = $pdo->prepare('UPDATE forms SET folder_id = ? WHERE id = ? AND user_id = ?');
            $stmt->execute([$data['folder_id'] ?? null, $data['form_id'], $userId]);
            
            Logger::info('Form moved to folder', [
                'user_id' => $userId,
                'form_id' => $data['form_id'],
                'folder_id' => $data['folder_id'] ?? null
            ]);
            
            Response::json(['success' => true]);
        } catch (Exception $e) {
            Logger::error('Failed to move form', [
                'user_id' => $userId,
                'error' => $e->getMessage()
            ]);
            Response::error('Failed to move form');
        }
    }
}