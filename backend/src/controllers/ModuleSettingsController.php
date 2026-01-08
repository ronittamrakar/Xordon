<?php
require_once __DIR__ . '/../Database.php';
require_once __DIR__ . '/../traits/WorkspaceScoped.php';
require_once __DIR__ . '/../Response.php';

class ModuleSettingsController {
    use WorkspaceScoped;

    private $db;

    public function __construct() {
        $this->db = Database::getInstance();
    }

    public function getSettings($module) {
        $workspaceId = self::requireWorkspaceContext();

        // Whitelist allowed modules to prevent arbitrary data access
        $allowedModules = ['social_planner', 'communities', 'landing_pages', 'proposals'];
        if (!in_array($module, $allowedModules)) {
             Response::error("Invalid module: $module", 400);
             exit;
        }

        $stmt = $this->db->prepare("SELECT settings FROM module_settings WHERE workspace_id = ? AND module = ?");
        $stmt->execute([$workspaceId, $module]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        return $row ? json_decode($row['settings'], true) : new stdClass();
    }

    public function updateSettings($module) {
        $workspaceId = self::requireWorkspaceContext();

        // Whitelist allowed modules
        $allowedModules = ['social_planner', 'communities', 'landing_pages', 'proposals'];
        if (!in_array($module, $allowedModules)) {
             Response::error("Invalid module: $module", 400);
             exit;
        }

        $data = json_decode(file_get_contents('php://input'), true);
        if ($data === null) {
            Response::error("Invalid JSON body", 400);
            exit;
        }

        $stmt = $this->db->prepare("
            INSERT INTO module_settings (workspace_id, module, settings) 
            VALUES (?, ?, ?)
            ON DUPLICATE KEY UPDATE settings = VALUES(settings)
        ");
        
        try {
            $stmt->execute([$workspaceId, $module, json_encode($data)]);
            return ['message' => 'Settings saved successfully'];
        } catch (Exception $e) {
            Response::error("Failed to save settings: " . $e->getMessage(), 500);
            exit;
        }
    }
}
