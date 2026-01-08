<?php
namespace Xordon\Controllers;

use Xordon\Database;
use Xordon\Response;
use Xordon\Auth;
use PDO;

class HelpdeskSettingsController {
    
    // Allow keys for helpdesk settings
    private static $allowedKeys = [
        'vendor_widget_enabled',
        'vendor_widget_provider',
        'vendor_widget_app_id',
        'vendor_widget_settings'
    ];

    public static function get() {
        try {
            $userId = Auth::userIdOrFail();
            $workspaceId = $_SESSION['workspace_id'] ?? 1; 
            
            $pdo = Database::conn();
            $stmt = $pdo->prepare('SELECT data FROM settings WHERE workspace_id = ? LIMIT 1');
            $stmt->execute([$workspaceId]);
            $row = $stmt->fetch();
            
            $data = $row ? json_decode($row['data'], true) : [];
            if (!is_array($data)) $data = [];
            
            $response = [];
            foreach (self::$allowedKeys as $k) {
                $response[$k] = $data[$k] ?? null;
            }
            
            // Ensure types
            $response['vendor_widget_enabled'] = (bool)($response['vendor_widget_enabled'] ?? false);
            $response['vendor_widget_settings'] = $response['vendor_widget_settings'] ?? [];
            
            Response::json($response);

        } catch (\Exception $e) {
            header('HTTP/1.1 500 Internal Server Error');
            echo json_encode(['error' => $e->getMessage()]);
        }
    }
    
    public static function update() {
        try {
            $userId = Auth::userIdOrFail();
            $workspaceId = $_SESSION['workspace_id'] ?? 1;
            
            $input = json_decode(file_get_contents('php://input'), true);
            if (!$input) {
                Response::json(['error' => 'Invalid JSON'], 400);
                return;
            }
            
            $pdo = Database::conn();
            // Fetch existing
            $stmt = $pdo->prepare('SELECT data FROM settings WHERE workspace_id = ? LIMIT 1');
            $stmt->execute([$workspaceId]);
            $row = $stmt->fetch();
            
            $data = $row ? json_decode($row['data'], true) : [];
            if (!is_array($data)) $data = [];
            
            // Update only allowed keys
            foreach (self::$allowedKeys as $k) {
                if (array_key_exists($k, $input)) {
                    $data[$k] = $input[$k];
                }
            }
            
            // Save back
            $json = json_encode($data);
            if ($row) {
                $update = $pdo->prepare('UPDATE settings SET data = ?, updated_at = NOW() WHERE workspace_id = ?');
                $update->execute([$json, $workspaceId]);
            } else {
                $insert = $pdo->prepare('INSERT INTO settings (workspace_id, user_id, data, created_at, updated_at) VALUES (?, ?, ?, NOW(), NOW())');
                $insert->execute([$workspaceId, $userId, $json]);
            }
            
            // Return updated subset
            $response = [];
            foreach (self::$allowedKeys as $k) {
                $response[$k] = $data[$k] ?? null;
            }
            $response['vendor_widget_enabled'] = (bool)($response['vendor_widget_enabled'] ?? false);
            Response::json($response);

        } catch (\Exception $e) {
            header('HTTP/1.1 500 Internal Server Error');
            echo json_encode(['error' => $e->getMessage()]);
        }
    }
}
