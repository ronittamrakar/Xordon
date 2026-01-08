<?php
/**
 * Module Controller
 * 
 * REST API endpoints for module management
 * Requirements: 10.1, 10.3
 */

require_once __DIR__ . '/../services/ModuleManager.php';

class ModuleController {
    private $moduleManager;
    private $pdo;
    
    public function __construct() {
        $this->pdo = Database::conn();
        $this->moduleManager = new ModuleManager($this->pdo);
    }
    
    /**
     * GET /api/modules - List all modules
     */
    public function index(): void {
        try {
            $userId = $this->getAuthenticatedUserId();
            $modules = $this->moduleManager->getAllModules();
            
            // Add enabled status for current user
            foreach ($modules as &$module) {
                $module['enabled_for_user'] = $this->moduleManager->isModuleEnabled($module['id'], $userId);
                $module['rollout'] = $this->moduleManager->getRolloutConfig($module['id']);
            }
            
            Response::json(['success' => true, 'data' => $modules]);
        } catch (Exception $e) {
            Response::json(['success' => false, 'error' => $e->getMessage()], 500);
        }
    }
    
    /**
     * GET /api/modules/{id} - Get single module
     */
    public function show(string $moduleId): void {
        try {
            $module = $this->moduleManager->getModule($moduleId);
            
            if (!$module) {
                Response::json(['success' => false, 'error' => 'Module not found'], 404);
                return;
            }
            
            $userId = $this->getAuthenticatedUserId();
            $module['enabled_for_user'] = $this->moduleManager->isModuleEnabled($moduleId, $userId);
            $module['rollout'] = $this->moduleManager->getRolloutConfig($moduleId);
            
            Response::json(['success' => true, 'data' => $module]);
        } catch (Exception $e) {
            Response::json(['success' => false, 'error' => $e->getMessage()], 500);
        }
    }

    
    /**
     * POST /api/modules/{id}/enable - Enable a module
     */
    public function enable(string $moduleId): void {
        try {
            // Check admin permission
            if (!$this->isAdmin()) {
                Response::json(['success' => false, 'error' => 'Admin access required'], 403);
                return;
            }
            
            $data = $this->getRequestBody();
            $rolloutConfig = [];
            
            if (isset($data['rollout_type'])) {
                $rolloutConfig = [
                    'type' => $data['rollout_type'],
                    'targets' => $data['targets'] ?? null,
                    'percentage' => $data['percentage'] ?? null
                ];
            }
            
            $this->moduleManager->enableModule($moduleId, $rolloutConfig);
            
            Response::json([
                'success' => true,
                'message' => "Module '$moduleId' enabled successfully",
                'data' => $this->moduleManager->getModule($moduleId)
            ]);
        } catch (InvalidArgumentException $e) {
            Response::json(['success' => false, 'error' => $e->getMessage()], 400);
        } catch (Exception $e) {
            Response::json(['success' => false, 'error' => $e->getMessage()], 500);
        }
    }
    
    /**
     * POST /api/modules/{id}/disable - Disable a module
     */
    public function disable(string $moduleId): void {
        try {
            // Check admin permission
            if (!$this->isAdmin()) {
                Response::json(['success' => false, 'error' => 'Admin access required'], 403);
                return;
            }
            
            $this->moduleManager->disableModule($moduleId);
            
            Response::json([
                'success' => true,
                'message' => "Module '$moduleId' disabled successfully"
            ]);
        } catch (Exception $e) {
            Response::json(['success' => false, 'error' => $e->getMessage()], 500);
        }
    }
    
    /**
     * PUT /api/modules/{id}/rollout - Update rollout configuration
     */
    public function updateRollout(string $moduleId): void {
        try {
            if (!$this->isAdmin()) {
                Response::json(['success' => false, 'error' => 'Admin access required'], 403);
                return;
            }
            
            $data = $this->getRequestBody();
            
            if (!isset($data['rollout_type'])) {
                Response::json(['success' => false, 'error' => 'rollout_type is required'], 400);
                return;
            }
            
            $rolloutConfig = [
                'type' => $data['rollout_type'],
                'targets' => $data['targets'] ?? null,
                'percentage' => $data['percentage'] ?? null
            ];
            
            $this->moduleManager->enableModule($moduleId, $rolloutConfig);
            
            Response::json([
                'success' => true,
                'message' => 'Rollout configuration updated',
                'data' => $this->moduleManager->getRolloutConfig($moduleId)
            ]);
        } catch (InvalidArgumentException $e) {
            Response::json(['success' => false, 'error' => $e->getMessage()], 400);
        } catch (Exception $e) {
            Response::json(['success' => false, 'error' => $e->getMessage()], 500);
        }
    }
    
    /**
     * GET /api/modules/user/{userId} - Get modules enabled for a user
     */
    public function userModules(int $userId): void {
        try {
            $modules = $this->moduleManager->getEnabledModulesForUser($userId);
            Response::json(['success' => true, 'data' => $modules]);
        } catch (Exception $e) {
            Response::json(['success' => false, 'error' => $e->getMessage()], 500);
        }
    }
    
    /**
     * GET /api/modules/{id}/check - Check if module is enabled for current user
     */
    public function checkAccess(string $moduleId): void {
        try {
            $userId = $this->getAuthenticatedUserId();
            $enabled = $this->moduleManager->isModuleEnabled($moduleId, $userId);
            
            Response::json([
                'success' => true,
                'data' => [
                    'module_id' => $moduleId,
                    'enabled' => $enabled
                ]
            ]);
        } catch (Exception $e) {
            Response::json(['success' => false, 'error' => $e->getMessage()], 500);
        }
    }
    
    /**
     * POST /api/modules - Register a new module (admin only)
     */
    public function store(): void {
        try {
            if (!$this->isAdmin()) {
                Response::json(['success' => false, 'error' => 'Admin access required'], 403);
                return;
            }
            
            $data = $this->getRequestBody();
            
            if (empty($data['id']) || empty($data['name'])) {
                Response::json(['success' => false, 'error' => 'id and name are required'], 400);
                return;
            }
            
            $this->moduleManager->registerModule($data);
            
            Response::json([
                'success' => true,
                'message' => 'Module registered successfully',
                'data' => $this->moduleManager->getModule($data['id'])
            ], 201);
        } catch (InvalidArgumentException $e) {
            Response::json(['success' => false, 'error' => $e->getMessage()], 400);
        } catch (Exception $e) {
            Response::json(['success' => false, 'error' => $e->getMessage()], 500);
        }
    }
    
    // Helper methods
    
    private function getAuthenticatedUserId(): int {
        // Get from Auth context
        $userId = Auth::userId();
        if (!$userId) {
            throw new Exception('User not authenticated');
        }
        return $userId;
    }
    
    private function isAdmin(): bool {
        try {
            $userId = $this->getAuthenticatedUserId();
            $stmt = $this->pdo->prepare("
                SELECT r.name FROM users u
                LEFT JOIN roles r ON u.role_id = r.id
                WHERE u.id = ?
            ");
            $stmt->execute([$userId]);
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            return $result && strtolower($result['name']) === 'admin';
        } catch (Exception $e) {
            return false;
        }
    }
    
    private function getRequestBody(): array {
        $json = file_get_contents('php://input');
        return json_decode($json, true) ?? [];
    }
}
