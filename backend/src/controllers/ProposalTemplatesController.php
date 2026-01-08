<?php
require_once __DIR__ . '/../Database.php';
require_once __DIR__ . '/../Response.php';
require_once __DIR__ . '/../Auth.php';

class ProposalTemplatesController {
    
    public static function getAll(): void {
        $user = Auth::user();
        if (!$user) {
            Response::json(['error' => 'Unauthorized'], 401);
            return;
        }
        
        $db = Database::conn();
        $category = $_GET['category'] ?? null;
        $status = $_GET['status'] ?? 'active';
        $includeDefaults = filter_var($_GET['include_defaults'] ?? 'true', FILTER_VALIDATE_BOOLEAN);
        
        $where = ['(pt.user_id = ?' . ($includeDefaults ? ' OR pt.is_default = TRUE' : '') . ')'];
        $params = [$user['id']];
        
        if ($category && $category !== 'all') {
            $where[] = 'pt.category = ?';
            $params[] = $category;
        }
        
        if ($status && $status !== 'all') {
            $where[] = 'pt.status = ?';
            $params[] = $status;
        }
        
        $whereClause = implode(' AND ', $where);
        
        $stmt = $db->prepare("
            SELECT pt.*, 
                   (SELECT COUNT(*) FROM proposals p WHERE p.template_id = pt.id) as usage_count
            FROM proposal_templates pt 
            WHERE $whereClause 
            ORDER BY pt.is_default DESC, pt.name ASC
        ");
        $stmt->execute($params);
        $templates = $stmt->fetchAll();
        
        // Parse JSON fields
        foreach ($templates as &$template) {
            $template['sections'] = json_decode($template['sections'] ?? '[]', true);
            $template['variables'] = json_decode($template['variables'] ?? '[]', true);
            $template['styling'] = json_decode($template['styling'] ?? '{}', true);
        }
        
        Response::json(['items' => $templates]);
    }
    
    public static function getOne(int $id): void {
        $user = Auth::user();
        if (!$user) {
            Response::json(['error' => 'Unauthorized'], 401);
            return;
        }
        
        $db = Database::conn();
        $stmt = $db->prepare("
            SELECT * FROM proposal_templates 
            WHERE id = ? AND (user_id = ? OR is_default = TRUE)
        ");
        $stmt->execute([$id, $user['id']]);
        $template = $stmt->fetch();
        
        if (!$template) {
            Response::json(['error' => 'Template not found'], 404);
            return;
        }
        
        // Parse JSON fields
        $template['sections'] = json_decode($template['sections'] ?? '[]', true);
        $template['variables'] = json_decode($template['variables'] ?? '[]', true);
        $template['styling'] = json_decode($template['styling'] ?? '{}', true);
        
        Response::json($template);
    }
    
    public static function create(): void {
        $user = Auth::user();
        if (!$user) {
            Response::json(['error' => 'Unauthorized'], 401);
            return;
        }
        
        $data = json_decode(file_get_contents('php://input'), true);
        
        if (empty($data['name'])) {
            Response::json(['error' => 'Template name is required'], 400);
            return;
        }
        
        $db = Database::conn();
        
        $stmt = $db->prepare("
            INSERT INTO proposal_templates (
                user_id, name, description, category, content, cover_image,
                sections, variables, styling, is_default, status, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, FALSE, ?, NOW(), NOW())
        ");
        
        $stmt->execute([
            $user['id'],
            $data['name'],
            $data['description'] ?? null,
            $data['category'] ?? 'general',
            $data['content'] ?? '',
            $data['cover_image'] ?? null,
            json_encode($data['sections'] ?? []),
            json_encode($data['variables'] ?? []),
            json_encode($data['styling'] ?? []),
            $data['status'] ?? 'active'
        ]);
        
        $templateId = $db->lastInsertId();
        
        Response::json(['id' => $templateId, 'message' => 'Template created successfully'], 201);
    }
    
    public static function update(int $id): void {
        $user = Auth::user();
        if (!$user) {
            Response::json(['error' => 'Unauthorized'], 401);
            return;
        }
        
        $db = Database::conn();
        
        // Check ownership (can't edit default templates)
        $checkStmt = $db->prepare("SELECT id, is_default FROM proposal_templates WHERE id = ? AND user_id = ?");
        $checkStmt->execute([$id, $user['id']]);
        $template = $checkStmt->fetch();
        
        if (!$template) {
            Response::json(['error' => 'Template not found or cannot be edited'], 404);
            return;
        }
        
        $data = json_decode(file_get_contents('php://input'), true);
        
        $fields = [];
        $params = [];
        
        $allowedFields = ['name', 'description', 'category', 'content', 'cover_image', 'status'];
        
        foreach ($allowedFields as $field) {
            if (array_key_exists($field, $data)) {
                $fields[] = "$field = ?";
                $params[] = $data[$field];
            }
        }
        
        // Handle JSON fields
        $jsonFields = ['sections', 'variables', 'styling'];
        foreach ($jsonFields as $field) {
            if (array_key_exists($field, $data)) {
                $fields[] = "$field = ?";
                $params[] = json_encode($data[$field]);
            }
        }
        
        if (empty($fields)) {
            Response::json(['error' => 'No fields to update'], 400);
            return;
        }
        
        $fields[] = "updated_at = NOW()";
        $params[] = $id;
        
        $sql = "UPDATE proposal_templates SET " . implode(', ', $fields) . " WHERE id = ?";
        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        
        Response::json(['message' => 'Template updated successfully']);
    }
    
    public static function delete(int $id): void {
        $user = Auth::user();
        if (!$user) {
            Response::json(['error' => 'Unauthorized'], 401);
            return;
        }
        
        $db = Database::conn();
        
        // Can't delete default templates
        $stmt = $db->prepare("DELETE FROM proposal_templates WHERE id = ? AND user_id = ? AND is_default = FALSE");
        $stmt->execute([$id, $user['id']]);
        
        if ($stmt->rowCount() === 0) {
            Response::json(['error' => 'Template not found or cannot be deleted'], 404);
            return;
        }
        
        Response::json(['message' => 'Template deleted successfully']);
    }
    
    public static function duplicate(int $id): void {
        $user = Auth::user();
        if (!$user) {
            Response::json(['error' => 'Unauthorized'], 401);
            return;
        }
        
        $db = Database::conn();
        
        // Get original template (including defaults)
        $stmt = $db->prepare("SELECT * FROM proposal_templates WHERE id = ? AND (user_id = ? OR is_default = TRUE)");
        $stmt->execute([$id, $user['id']]);
        $original = $stmt->fetch();
        
        if (!$original) {
            Response::json(['error' => 'Template not found'], 404);
            return;
        }
        
        // Create duplicate
        $newName = $original['name'] . ' (Copy)';
        $insertStmt = $db->prepare("
            INSERT INTO proposal_templates (
                user_id, name, description, category, content, cover_image,
                sections, variables, styling, is_default, status, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, FALSE, 'active', NOW(), NOW())
        ");
        
        $insertStmt->execute([
            $user['id'],
            $newName,
            $original['description'],
            $original['category'],
            $original['content'],
            $original['cover_image'],
            $original['sections'],
            $original['variables'],
            $original['styling']
        ]);
        
        $newId = $db->lastInsertId();
        
        Response::json(['id' => $newId, 'message' => 'Template duplicated successfully'], 201);
    }
    
    public static function getCategories(): void {
        $user = Auth::user();
        if (!$user) {
            Response::json(['error' => 'Unauthorized'], 401);
            return;
        }
        
        $db = Database::conn();
        $stmt = $db->prepare("
            SELECT DISTINCT category, COUNT(*) as count 
            FROM proposal_templates 
            WHERE user_id = ? OR is_default = TRUE 
            GROUP BY category 
            ORDER BY category
        ");
        $stmt->execute([$user['id']]);
        $categories = $stmt->fetchAll();
        
        Response::json(['categories' => $categories]);
    }
}
