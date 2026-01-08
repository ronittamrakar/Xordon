<?php
/**
 * Call Dispositions Controller
 * Manages call outcome/disposition types
 */

require_once __DIR__ . '/../Auth.php';
require_once __DIR__ . '/../Database.php';
require_once __DIR__ . '/../Response.php';
require_once __DIR__ . '/../traits/WorkspaceScoped.php';

class CallDispositionsController {
    use WorkspaceScoped;
    
    /**
     * Get all dispositions for the user (including defaults)
     */
    public static function index(): void {
        $userId = Auth::userIdOrFail();
        $pdo = Database::conn();
        $isAdmin = Auth::isAdmin();
        
        if ($isAdmin) {
            // Admins see all dispositions
            $stmt = $pdo->prepare('
                SELECT * FROM call_dispositions_types 
                WHERE is_active = 1
                ORDER BY sort_order ASC, name ASC
            ');
            $stmt->execute();
        } else {
            // Use workspace scoping for tenant isolation
            $scope = self::workspaceWhere();
            $workspaceId = $scope['params'][0];

            // Get workspace's custom dispositions and default ones (user_id = 0 or workspace_id IS NULL)
            $stmt = $pdo->prepare('
                SELECT * FROM call_dispositions_types 
                WHERE (workspace_id = ? OR user_id = 0 OR workspace_id IS NULL OR workspace_id = 0) AND is_active = 1
                ORDER BY sort_order ASC, name ASC
            ');
            $stmt->execute([$workspaceId]);
        }
        
        $dispositions = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        Response::json(array_map([self::class, 'mapDisposition'], $dispositions));
    }
    
    /**
     * Create a custom disposition
     */
    public static function create(): void {
        $userId = Auth::userIdOrFail();
        $body = get_json_body();
        
        $name = trim($body['name'] ?? '');
        if (!$name) {
            Response::error('Name is required', 422);
        }
        
        $pdo = Database::conn();
        
        // Use workspace scoping
        $scope = self::workspaceWhere();
        $workspaceId = $scope['params'][0];
        
        $stmt = $pdo->prepare('
            INSERT INTO call_dispositions_types 
            (user_id, workspace_id, name, description, category, color, icon, requires_callback, requires_notes, sort_order, is_active, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, CURRENT_TIMESTAMP)
        ');
        
        $stmt->execute([
            $userId,
            $workspaceId,
            $name,
            $body['description'] ?? null,
            $body['category'] ?? 'neutral',
            $body['color'] ?? '#6B7280',
            $body['icon'] ?? null,
            isset($body['requires_callback']) ? ($body['requires_callback'] ? 1 : 0) : 0,
            isset($body['requires_notes']) ? ($body['requires_notes'] ? 1 : 0) : 0,
            (int)($body['sort_order'] ?? 100),
        ]);
        
        $id = $pdo->lastInsertId();
        
        $stmt = $pdo->prepare('SELECT * FROM call_dispositions_types WHERE id = ?');
        $stmt->execute([$id]);
        $disposition = $stmt->fetch(PDO::FETCH_ASSOC);
        
        Response::json(self::mapDisposition($disposition), 201);
    }
    
    /**
     * Update a disposition
     */
    public static function update(string $id): void {
        $userId = Auth::userIdOrFail();
        $body = get_json_body();
        $pdo = Database::conn();
        
        // Use workspace scoping
        $scope = self::workspaceWhere();
        $workspaceId = $scope['params'][0];
        
        // Check ownership via workspace (can\'t edit default dispositions)
        $isAdmin = Auth::isAdmin();
        if ($isAdmin) {
            $stmt = $pdo->prepare('SELECT * FROM call_dispositions_types WHERE id = ?');
            $stmt->execute([$id]);
        } else {
            $stmt = $pdo->prepare('SELECT * FROM call_dispositions_types WHERE id = ? AND (workspace_id = ? OR workspace_id IS NULL OR workspace_id = 0)');
            $stmt->execute([$id, $workspaceId]);
        }
        
        $disposition = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$disposition) {
            Response::error('Disposition not found or cannot be edited', 404);
        }
        
        $updates = [];
        $params = [];
        
        $allowedFields = ['name', 'description', 'category', 'color', 'icon', 'requires_callback', 'requires_notes', 'sort_order', 'is_active'];
        
        foreach ($allowedFields as $field) {
            if (isset($body[$field])) {
                $value = $body[$field];
                
                if (in_array($field, ['requires_callback', 'requires_notes', 'is_active'])) {
                    $value = $value ? 1 : 0;
                } elseif ($field === 'sort_order') {
                    $value = (int)$value;
                }
                
                $updates[] = "$field = ?";
                $params[] = $value;
            }
        }
        
        if (empty($updates)) {
            Response::error('No fields to update', 422);
        }
        
        $params[] = $id;
        
        $sql = 'UPDATE call_dispositions_types SET ' . implode(', ', $updates) . ' WHERE id = ?';
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        
        $stmt = $pdo->prepare('SELECT * FROM call_dispositions_types WHERE id = ?');
        $stmt->execute([$id]);
        $disposition = $stmt->fetch(PDO::FETCH_ASSOC);
        
        Response::json(self::mapDisposition($disposition));
    }
    
    /**
     * Delete a disposition
     */
    public static function delete(string $id): void {
        $userId = Auth::userIdOrFail();
        $pdo = Database::conn();
        
        // Use workspace scoping
        $scope = self::workspaceWhere();
        $workspaceId = $scope['params'][0];
        
        // Check ownership via workspace (can\'t delete default dispositions)
        $isAdmin = Auth::isAdmin();
        if ($isAdmin) {
            $stmt = $pdo->prepare('SELECT id FROM call_dispositions_types WHERE id = ?');
            $stmt->execute([$id]);
        } else {
            $stmt = $pdo->prepare('SELECT id FROM call_dispositions_types WHERE id = ? AND (workspace_id = ? OR workspace_id IS NULL OR workspace_id = 0)');
            $stmt->execute([$id, $workspaceId]);
        }
        
        if (!$stmt->fetch()) {
            Response::error('Disposition not found or cannot be deleted', 404);
        }
        
        $stmt = $pdo->prepare('DELETE FROM call_dispositions_types WHERE id = ?');
        $stmt->execute([$id]);
        
        Response::json(['success' => true]);
    }
    
    /**
     * Map disposition record to API response
     */
    private static function mapDisposition(array $d): array {
        return [
            'id' => (string)$d['id'],
            'name' => $d['name'],
            'description' => $d['description'],
            'category' => $d['category'],
            'color' => $d['color'],
            'icon' => $d['icon'],
            'is_default' => (bool)$d['is_default'],
            'requires_callback' => (bool)$d['requires_callback'],
            'requires_notes' => (bool)$d['requires_notes'],
            'sort_order' => (int)$d['sort_order'],
            'is_active' => (bool)$d['is_active'],
            'is_system' => $d['user_id'] == 0,
        ];
    }
}
