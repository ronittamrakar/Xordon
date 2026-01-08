<?php

require_once __DIR__ . '/../Auth.php';
require_once __DIR__ . '/../Database.php';
require_once __DIR__ . '/../Response.php';
require_once __DIR__ . '/../traits/WorkspaceScoped.php';

class CallScriptsController {
    use WorkspaceScoped;

    public static function listScripts(): void {
        $userId = Auth::userIdOrFail();
        try {
            $pdo = Database::conn();
            $isAdmin = Auth::isAdmin();

            if ($isAdmin) {
                // Admins see everything
                $stmt = $pdo->prepare("SELECT * FROM call_scripts ORDER BY created_at DESC");
                $stmt->execute();
            } else {
                $scope = self::workspaceWhere();
                $workspaceId = $scope['params'][0];
                // Users see their workspace scripts or scripts with no workspace (global)
                $stmt = $pdo->prepare("SELECT * FROM call_scripts WHERE workspace_id = ? OR workspace_id IS NULL OR workspace_id = 0 ORDER BY created_at DESC");
                $stmt->execute([$workspaceId]);
            }
            
            $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

            $items = array_map(function($row) {
                return [
                    'id' => (string)$row['id'],
                    'name' => $row['name'],
                    'description' => $row['description'],
                    'script' => $row['script'], 
                    'content' => $row['script'], // providing both to be safe
                    'category' => $row['category'],
                    'tags' => json_decode($row['tags'] ?? '[]'),
                    'variables' => json_decode($row['variables'] ?? '[]'),
                    'created_at' => $row['created_at'],
                    'updated_at' => $row['updated_at']
                ];
            }, $rows);

            Response::json($items);
        } catch (Exception $e) {
            error_log('Failed to fetch call scripts: ' . $e->getMessage());
            Response::json([]); 
        }
    }

    public static function createScript(): void {
        $userId = Auth::userIdOrFail();
        $b = get_json_body();
        
        if (empty($b['name']) || (empty($b['content']) && empty($b['script']))) {
            Response::validationError('Name and script content are required');
            return;
        }

        $content = $b['content'] ?? $b['script'];

        try {
            $pdo = Database::conn();
            $scope = self::workspaceWhere();
            $workspaceId = $scope['params'][0];

            $stmt = $pdo->prepare("
                INSERT INTO call_scripts 
                (user_id, workspace_id, name, description, script, category, tags, variables, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
            ");
            
            $stmt->execute([
                $userId,
                $workspaceId,
                $b['name'],
                $b['description'] ?? '',
                $content,
                $b['category'] ?? '',
                json_encode($b['tags'] ?? []),
                json_encode($b['variables'] ?? [])
            ]);

            $id = $pdo->lastInsertId();
            Response::json(['id' => (string)$id, 'success' => true]);
        } catch (Exception $e) {
            Response::error('Failed to create script: ' . $e->getMessage(), 500);
        }
    }

    public static function updateScript(string $id): void {
        $userId = Auth::userIdOrFail();
        $b = get_json_body();
        
        try {
            $pdo = Database::conn();
            $scope = self::workspaceWhere();
            $workspaceId = $scope['params'][0];

            // Verify ownership
            $isAdmin = Auth::isAdmin();
            if ($isAdmin) {
                $stmt = $pdo->prepare("SELECT id FROM call_scripts WHERE id = ?");
                $stmt->execute([$id]);
            } else {
                $stmt = $pdo->prepare("SELECT id FROM call_scripts WHERE id = ? AND (workspace_id = ? OR workspace_id IS NULL OR workspace_id = 0)");
                $stmt->execute([$id, $workspaceId]);
            }
            
            if (!$stmt->fetch()) {
                Response::notFound('Script not found');
                return;
            }

            $fields = [];
            $params = [];

            if (isset($b['name'])) { $fields[] = "name = ?"; $params[] = $b['name']; }
            if (isset($b['description'])) { $fields[] = "description = ?"; $params[] = $b['description']; }
            if (isset($b['content'])) { $fields[] = "script = ?"; $params[] = $b['content']; }
            if (isset($b['script'])) { $fields[] = "script = ?"; $params[] = $b['script']; }
            if (isset($b['category'])) { $fields[] = "category = ?"; $params[] = $b['category']; }
            if (isset($b['tags'])) { $fields[] = "tags = ?"; $params[] = json_encode($b['tags']); }
            if (isset($b['variables'])) { $fields[] = "variables = ?"; $params[] = json_encode($b['variables']); }

            if (empty($fields)) {
                Response::json(['success' => true]);
                return;
            }

            $fields[] = "updated_at = NOW()";
            $params[] = $id;

            $sql = "UPDATE call_scripts SET " . implode(', ', $fields) . " WHERE id = ?";
            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);

            Response::json(['success' => true]);
        } catch (Exception $e) {
            Response::error('Failed to update script: ' . $e->getMessage(), 500);
        }
    }

    public static function getScript(string $id): void {
        $userId = Auth::userIdOrFail();
        try {
            $pdo = Database::conn();
            $scope = self::workspaceWhere();
            $workspaceId = $scope['params'][0];
            $isAdmin = Auth::isAdmin();

            if ($isAdmin) {
                $stmt = $pdo->prepare("SELECT * FROM call_scripts WHERE id = ?");
                $stmt->execute([$id]);
            } else {
                $stmt = $pdo->prepare("SELECT * FROM call_scripts WHERE id = ? AND (workspace_id = ? OR workspace_id IS NULL OR workspace_id = 0)");
                $stmt->execute([$id, $workspaceId]);
            }
            
            $row = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$row) {
                Response::notFound('Script not found');
                return;
            }

            $item = [
                'id' => (string)$row['id'],
                'name' => $row['name'],
                'description' => $row['description'],
                'script' => $row['script'], 
                'content' => $row['script'],
                'category' => $row['category'],
                'tags' => json_decode($row['tags'] ?? '[]'),
                'variables' => json_decode($row['variables'] ?? '[]'),
                'created_at' => $row['created_at'],
                'updated_at' => $row['updated_at']
            ];

            Response::json($item);
        } catch (Exception $e) {
            Response::error('Failed to fetch script: ' . $e->getMessage(), 500);
        }
    }

    public static function deleteScript(string $id): void {
        $userId = Auth::userIdOrFail();
        try {
            $pdo = Database::conn();
            $scope = self::workspaceWhere();
            $workspaceId = $scope['params'][0];
            $isAdmin = Auth::isAdmin();

            if ($isAdmin) {
                $stmt = $pdo->prepare("DELETE FROM call_scripts WHERE id = ?");
                $stmt->execute([$id]);
            } else {
                $stmt = $pdo->prepare("DELETE FROM call_scripts WHERE id = ? AND (workspace_id = ? OR workspace_id IS NULL OR workspace_id = 0)");
                $stmt->execute([$id, $workspaceId]);
            }
            
            Response::json(['success' => true]);
        } catch (Exception $e) {
            Response::error('Failed to delete script: ' . $e->getMessage(), 500);
        }
    }
}
