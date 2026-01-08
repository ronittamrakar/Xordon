<?php
require_once __DIR__ . '/../Database.php';
require_once __DIR__ . '/../Response.php';
require_once __DIR__ . '/../Auth.php';
require_once __DIR__ . '/../services/RBACService.php';

class TemplatesController {
    private static function getWorkspaceScope(): array {
        $ctx = $GLOBALS['tenantContext'] ?? null;
        if ($ctx && isset($ctx->workspaceId)) {
            return ['col' => 'workspace_id', 'val' => (int)$ctx->workspaceId];
        }
        return ['col' => 'user_id', 'val' => Auth::userIdOrFail()];
    }
    public static function index(): void {
        $userId = Auth::userIdOrFail();
        $rbac = RBACService::getInstance();
        
        // Check permission
        if (!$rbac->hasPermission($userId, 'email.templates.view')) {
            Response::forbidden('You do not have permission to view templates');
            return;
        }
        
        $pdo = Database::conn();
        $scope = self::getWorkspaceScope();
        $stmt = $pdo->prepare("SELECT * FROM templates WHERE {$scope['col']} = ? ORDER BY updated_at DESC");
        $stmt->execute([$scope['val']]);
        $rows = $stmt->fetchAll();
        Response::json(['items' => array_map(fn($t) => self::map($t), $rows)]);
    }
    public static function show(string $id): void {
        $userId = Auth::userIdOrFail();
        $rbac = RBACService::getInstance();
        
        // Check permission
        if (!$rbac->hasPermission($userId, 'email.templates.view')) {
            Response::forbidden('You do not have permission to view templates');
            return;
        }
        
        $pdo = Database::conn();
        $scope = self::getWorkspaceScope();
        $stmt = $pdo->prepare("SELECT * FROM templates WHERE id = ? AND {$scope['col']} = ?");
        $stmt->execute([$id, $scope['val']]);
        $row = $stmt->fetch();
        if (!$row) Response::error('Not found', 404);
        Response::json(self::map($row));
    }
    public static function create(): void {
        $userId = Auth::userIdOrFail();
        $rbac = RBACService::getInstance();
        
        // Check permission
        if (!$rbac->hasPermission($userId, 'email.templates.manage')) {
            Response::forbidden('You do not have permission to create templates');
            return;
        }
        
        $b = get_json_body();
        $name = trim($b['name'] ?? '');
        $subject = trim($b['subject'] ?? '');
        $html = $b['html_content'] ?? '';
        $blocks = $b['blocks'] ?? null;
        $globalStyles = $b['global_styles'] ?? null;
        if (!$name) Response::error('Missing name', 422);
        $pdo = Database::conn();
        $ctx = $GLOBALS['tenantContext'] ?? null;
        $workspaceId = ($ctx && isset($ctx->workspaceId)) ? (int)$ctx->workspaceId : null;
        $stmt = $pdo->prepare('INSERT INTO templates (user_id, workspace_id, name, subject, html_content, blocks, global_styles, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)');
        $stmt->execute([$userId, $workspaceId, $name, $subject, $html, $blocks, $globalStyles]);
        $id = (int)$pdo->lastInsertId();
        $stmt = $pdo->prepare('SELECT * FROM templates WHERE id = ?');
        $stmt->execute([$id]);
        Response::json(self::map($stmt->fetch()), 201);
    }
    public static function update(string $id): void {
        $userId = Auth::userIdOrFail();
        $rbac = RBACService::getInstance();
        
        // Check permission
        if (!$rbac->hasPermission($userId, 'email.templates.manage')) {
            Response::forbidden('You do not have permission to edit templates');
            return;
        }
        
        $b = get_json_body();
        $map = [
            'name' => 'name',
            'subject' => 'subject',
            'html_content' => 'html_content',
            'blocks' => 'blocks',
            'global_styles' => 'global_styles',
        ];
        $sets = [];
        $vals = [];
        foreach ($map as $k => $col) {
            if (array_key_exists($k, $b)) { $sets[] = "$col = ?"; $vals[] = $b[$k]; }
        }
        if (empty($sets)) Response::error('No changes', 422);
        $sets[] = 'updated_at = CURRENT_TIMESTAMP';
        $vals[] = $id;
        $scope = self::getWorkspaceScope();
        $vals[] = $scope['val'];
        $pdo = Database::conn();
        $sql = 'UPDATE templates SET ' . implode(', ', $sets) . " WHERE id = ? AND {$scope['col']} = ?";
        $stmt = $pdo->prepare($sql); $stmt->execute($vals);
        $stmt = $pdo->prepare('SELECT * FROM templates WHERE id = ?'); $stmt->execute([$id]);
        Response::json(self::map($stmt->fetch()));
    }
    public static function delete(string $id): void {
        Auth::userIdOrFail();
        $pdo = Database::conn();
        $scope = self::getWorkspaceScope();
        $stmt = $pdo->prepare("DELETE FROM templates WHERE id = ? AND {$scope['col']} = ?");
        $stmt->execute([$id, $scope['val']]);
        Response::json(['ok' => true]);
    }
    private static function map(array $t): array {
        return [
            'id' => (string)$t['id'],
            'name' => $t['name'],
            'subject' => $t['subject'] ?? '',
            'html_content' => $t['html_content'] ?? '',
            'blocks' => $t['blocks'] ?? null,
            'global_styles' => $t['global_styles'] ?? null,
            'created_at' => $t['created_at'] ?? '',
            'updated_at' => $t['updated_at'] ?? '',
        ];
    }
}