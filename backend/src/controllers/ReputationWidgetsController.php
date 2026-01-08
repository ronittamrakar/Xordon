<?php
namespace Xordon\Controllers;

use Xordon\Database;
use Xordon\Response;
use PDO;

class ReputationWidgetsController {
    
    /**
     * Get all widgets for the workspace
     */
    public function index() {
        return self::getWidgets();
    }

    public static function getWidgets() {
        try {
            $db = Database::conn();
            $workspaceId = $_SESSION['workspace_id'] ?? 1;
            
            $stmt = $db->prepare("SELECT * FROM review_widgets WHERE workspace_id = ? ORDER BY created_at DESC");
            $stmt->execute([$workspaceId]);
            $widgets = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Decode the JSON strings
            foreach ($widgets as &$widget) {
                $widget['platforms'] = json_decode($widget['platforms'] ?? '[]', true);
                $widget['settings'] = json_decode($widget['settings'] ?? '{}', true);
                $widget['min_rating'] = (float)($widget['min_rating'] ?? 4.0);
                $widget['max_reviews'] = (int)($widget['max_reviews'] ?? 10);
                $widget['show_ai_summary'] = (bool)($widget['show_ai_summary'] ?? 0);
                $widget['is_active'] = (bool)($widget['is_active'] ?? 1);
            }
            
            return Response::json($widgets);
        } catch (\Exception $e) {
            return Response::json(['error' => $e->getMessage()], 500);
        }
    }
    
    /**
     * Get a single widget
     */
    public function show($id) {
        return self::getWidget($id);
    }

    public static function getWidget($id) {
        try {
            $db = Database::conn();
            $workspaceId = $_SESSION['workspace_id'] ?? 1;
            
            $stmt = $db->prepare("SELECT * FROM review_widgets WHERE id = ? AND workspace_id = ?");
            $stmt->execute([$id, $workspaceId]);
            $widget = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$widget) {
                return Response::json(['error' => 'Widget not found'], 404);
            }
            
            $widget['platforms'] = json_decode($widget['platforms'] ?? '[]', true);
            $widget['settings'] = json_decode($widget['settings'] ?? '{}', true);
            
            return Response::json($widget);
        } catch (\Exception $e) {
            return Response::json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Create a widget
     */
    public function create() {
        return self::saveWidget();
    }

    /**
     * Update a widget
     */
    public function update($id) {
        $_POST['id'] = $id; // Compatibility if saveWidget() expects ID in data
        return self::saveWidget();
    }

    /**
     * Internal save method (was saveWidget)
     */
    public static function saveWidget() {
        try {
            $db = Database::conn();
            $workspaceId = $_SESSION['workspace_id'] ?? 1;
            $data = json_decode(file_get_contents('php://input'), true);
            
            if (!isset($data['name']) || !isset($data['type'])) {
                return Response::json(['error' => 'Missing required fields'], 400);
            }
            
            $platforms = json_encode($data['platforms'] ?? []);
            $settings = json_encode($data['settings'] ?? []);
            
            $id = $data['id'] ?? $_POST['id'] ?? null;

            if ($id) {
                // Update
                $stmt = $db->prepare("
                    UPDATE review_widgets 
                    SET name = ?, type = ?, platforms = ?, min_rating = ?, 
                        max_reviews = ?, show_ai_summary = ?, settings = ?, 
                        embed_code = ?, is_active = ?, updated_at = NOW() 
                    WHERE id = ? AND workspace_id = ?
                ");
                $stmt->execute([
                    $data['name'],
                    $data['type'],
                    $platforms,
                    $data['min_rating'] ?? 4.0,
                    $data['max_reviews'] ?? 10,
                    $data['show_ai_summary'] ?? 0,
                    $settings,
                    $data['embed_code'] ?? '',
                    $data['is_active'] ?? 1,
                    $id,
                    $workspaceId
                ]);
            } else {
                // Create
                $stmt = $db->prepare("
                    INSERT INTO review_widgets (
                        workspace_id, name, type, platforms, min_rating, 
                        max_reviews, show_ai_summary, settings, embed_code, 
                        is_active, created_at, updated_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
                ");
                $stmt->execute([
                    $workspaceId,
                    $data['name'],
                    $data['type'],
                    $platforms,
                    $data['min_rating'] ?? 4.0,
                    $data['max_reviews'] ?? 10,
                    $data['show_ai_summary'] ?? 0,
                    $settings,
                    $data['embed_code'] ?? '',
                    $data['is_active'] ?? 1
                ]);
                $id = $db->lastInsertId();
            }
            
            return Response::json([
                'success' => true,
                'id' => (int)$id,
                'message' => 'Widget saved successfully'
            ]);
        } catch (\Exception $e) {
            return Response::json(['error' => $e->getMessage()], 500);
        }
    }
    
    /**
     * Delete a widget
     */
    public function delete($id) {
        return self::deleteWidget($id);
    }

    public static function deleteWidget($id) {
        try {
            $db = Database::conn();
            $workspaceId = $_SESSION['workspace_id'] ?? 1;
            
            $stmt = $db->prepare("DELETE FROM review_widgets WHERE id = ? AND workspace_id = ?");
            $stmt->execute([$id, $workspaceId]);
            
            return Response::json(['success' => true]);
        } catch (\Exception $e) {
            return Response::json(['error' => $e->getMessage()], 500);
        }
    }
}

