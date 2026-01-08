<?php

require_once __DIR__ . '/../Database.php';
require_once __DIR__ . '/../Response.php';
require_once __DIR__ . '/../Auth.php';

class FormTemplatesController
{
    public static function getTemplates(): void
    {
        try {
            $userId = Auth::userIdOrFail();
            $pdo = Database::conn();
            $stmt = $pdo->prepare("SELECT * FROM form_templates WHERE user_id = ? ORDER BY created_at DESC");
            $stmt->execute([$userId]);
            $templates = $stmt->fetchAll(\PDO::FETCH_ASSOC);
            
            foreach ($templates as &$template) {
                $template['fields'] = json_decode($template['fields'], true);
                if ($template['steps']) {
                    $template['steps'] = json_decode($template['steps'], true);
                }
            }
            
            Response::json(['items' => $templates]);
        } catch (\Exception $e) {
            error_log("Error fetching form templates: " . $e->getMessage());
            Response::json(['error' => 'Failed to fetch form templates'], 500);
        }
    }

    public static function getTemplate($id): void
    {
        try {
            $userId = Auth::userIdOrFail();
            $pdo = Database::conn();
            $stmt = $pdo->prepare("SELECT * FROM form_templates WHERE id = ? AND user_id = ?");
            $stmt->execute([$id, $userId]);
            $template = $stmt->fetch(\PDO::FETCH_ASSOC);
            
            if (!$template) {
                Response::json(['error' => 'Template not found'], 404);
                return;
            }

            $template['fields'] = json_decode($template['fields'], true);
            if ($template['steps']) {
                $template['steps'] = json_decode($template['steps'], true);
            }

            Response::json($template);
        } catch (\Exception $e) {
            error_log("Error fetching form template: " . $e->getMessage());
            Response::json(['error' => 'Failed to fetch form template'], 500);
        }
    }

    public static function createTemplate(): void
    {
        try {
            $userId = Auth::userIdOrFail();
            $data = get_json_body();

            if (empty($data['name']) || empty($data['fields'])) {
                Response::json(['error' => 'Name and fields are required'], 400);
                return;
            }

            $templateId = self::generateUuid();
            $pdo = Database::conn();
            $stmt = $pdo->prepare("
                INSERT INTO form_templates (id, user_id, name, description, fields, is_multi_step, steps, category, usage_count)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0)
            ");
            
            $stmt->execute([
                $templateId,
                $userId,
                $data['name'],
                $data['description'] ?? null,
                json_encode($data['fields']),
                $data['is_multi_step'] ?? false,
                isset($data['steps']) ? json_encode($data['steps']) : null,
                $data['category'] ?? 'other'
            ]);

            self::getTemplate($templateId);
        } catch (\Exception $e) {
            error_log("Error creating form template: " . $e->getMessage());
            Response::json(['error' => 'Failed to create form template'], 500);
        }
    }

    public static function updateTemplate($id): void
    {
        try {
            $userId = Auth::userIdOrFail();
            $data = get_json_body();
            $pdo = Database::conn();

            $stmt = $pdo->prepare("SELECT id FROM form_templates WHERE id = ? AND user_id = ?");
            $stmt->execute([$id, $userId]);
            if (!$stmt->fetch()) {
                Response::json(['error' => 'Template not found'], 404);
                return;
            }

            $updates = [];
            $values = [];

            if (isset($data['name'])) {
                $updates[] = 'name = ?';
                $values[] = $data['name'];
            }
            if (isset($data['description'])) {
                $updates[] = 'description = ?';
                $values[] = $data['description'];
            }
            if (isset($data['fields'])) {
                $updates[] = 'fields = ?';
                $values[] = json_encode($data['fields']);
            }
            if (isset($data['is_multi_step'])) {
                $updates[] = 'is_multi_step = ?';
                $values[] = $data['is_multi_step'];
            }
            if (isset($data['steps'])) {
                $updates[] = 'steps = ?';
                $values[] = json_encode($data['steps']);
            }
            if (isset($data['category'])) {
                $updates[] = 'category = ?';
                $values[] = $data['category'];
            }

            if (empty($updates)) {
                Response::json(['error' => 'No valid fields to update'], 400);
                return;
            }

            $values[] = $id;
            $stmt = $pdo->prepare("
                UPDATE form_templates 
                SET " . implode(', ', $updates) . ", updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            ");
            $stmt->execute($values);

            self::getTemplate($id);
        } catch (\Exception $e) {
            error_log("Error updating form template: " . $e->getMessage());
            Response::json(['error' => 'Failed to update form template'], 500);
        }
    }

    public static function deleteTemplate($id): void
    {
        try {
            $userId = Auth::userIdOrFail();
            $pdo = Database::conn();
            
            $stmt = $pdo->prepare("DELETE FROM form_templates WHERE id = ? AND user_id = ?");
            $stmt->execute([$id, $userId]);

            if ($stmt->rowCount() === 0) {
                Response::json(['error' => 'Template not found'], 404);
                return;
            }

            Response::json(['message' => 'Template deleted successfully']);
        } catch (\Exception $e) {
            error_log("Error deleting form template: " . $e->getMessage());
            Response::json(['error' => 'Failed to delete form template'], 500);
        }
    }

    public static function incrementUsage($id): void
    {
        try {
            $userId = Auth::userIdOrFail();
            $pdo = Database::conn();
            
            $stmt = $pdo->prepare("
                UPDATE form_templates 
                SET usage_count = usage_count + 1 
                WHERE id = ? AND user_id = ?
            ");
            $stmt->execute([$id, $userId]);

            if ($stmt->rowCount() === 0) {
                Response::json(['error' => 'Template not found'], 404);
                return;
            }

            self::getTemplate($id);
        } catch (\Exception $e) {
            error_log("Error incrementing form template usage: " . $e->getMessage());
            Response::json(['error' => 'Failed to increment template usage'], 500);
        }
    }

    private static function generateUuid()
    {
        $data = random_bytes(16);
        $data[6] = chr(ord($data[6]) & 0x0f | 0x40);
        $data[8] = chr(ord($data[8]) & 0x3f | 0x80);
        return vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex($data), 4));
    }
}