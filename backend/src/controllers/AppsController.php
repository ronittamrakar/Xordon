<?php
/**
 * ModulesController - Odoo-style Apps Manager
 * 
 * Handles module registry, installation, and workspace-level enable/disable.
 */

namespace App\Controllers;

class AppsController
{
    private static function tableExists(\PDO $pdo, string $table): bool
    {
        $stmt = $pdo->prepare(
            'SELECT 1 FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = ? LIMIT 1'
        );
        $stmt->execute([$table]);
        return (bool)$stmt->fetchColumn();
    }

    /**
     * Get all available modules
     * GET /api/modules
     */
    public static function index(): void
    {
        try {
            $pdo = \Database::conn();

            if (!self::tableExists($pdo, 'modules')) {
                http_response_code(200);
                echo json_encode(['modules' => []]);
                return;
            }
            
            $stmt = $pdo->query("
                SELECT module_key, name, description, icon, is_core, version, dependencies
                FROM modules
                ORDER BY is_core DESC, name ASC
            ");
            
            $modules = $stmt->fetchAll(\PDO::FETCH_ASSOC);
            
            // Parse JSON dependencies
            foreach ($modules as &$module) {
                $module['dependencies'] = $module['dependencies'] ? json_decode($module['dependencies'], true) : [];
                $module['is_core'] = (bool)$module['is_core'];
            }
            
            http_response_code(200);
            echo json_encode(['modules' => $modules]);
        } catch (\Exception $e) {
            error_log("ModulesController::index error: " . $e->getMessage());
            http_response_code(500);
            echo json_encode(['error' => 'Failed to fetch modules']);
        }
    }
    
    /**
     * Get modules installed/enabled for the current workspace
     * GET /api/modules/workspace
     */
    public static function workspaceModules(): void
    {
        error_log("AppsController::workspaceModules called");
        try {
            $ctx = $GLOBALS['tenantContext'] ?? null;
            $workspaceId = $ctx->workspaceId ?? null;
            
            if (!$workspaceId) {
                http_response_code(400);
                echo json_encode(['error' => 'Workspace context required']);
                return;
            }
            
            $pdo = \Database::conn();

            if (!self::tableExists($pdo, 'modules')) {
                error_log("AppsController::workspaceModules: modules table missing (migration not applied)");
                http_response_code(200);
                echo json_encode(['modules' => []]);
                return;
            }

            // If workspace_modules is missing, still return modules, defaulting non-core to not_installed
            $hasWorkspaceModules = self::tableExists($pdo, 'workspace_modules');
            
            // Get all modules with their workspace status
            if ($hasWorkspaceModules) {
                $stmt = $pdo->prepare("
                    SELECT 
                        m.module_key,
                        m.name,
                        m.description,
                        m.icon,
                        m.is_core,
                        m.version,
                        m.dependencies,
                        wm.status,
                        wm.installed_at,
                        wm.settings
                    FROM modules m
                    LEFT JOIN workspace_modules wm 
                        ON m.module_key = wm.module_key 
                        AND wm.workspace_id = ?
                    ORDER BY m.is_core DESC, m.name ASC
                ");
                $stmt->execute([$workspaceId]);
            } else {
                error_log("AppsController::workspaceModules: workspace_modules table missing (migration not applied)");
                $stmt = $pdo->query("
                    SELECT 
                        module_key,
                        name,
                        description,
                        icon,
                        is_core,
                        version,
                        dependencies,
                        NULL AS status,
                        NULL AS installed_at,
                        NULL AS settings
                    FROM modules
                    ORDER BY is_core DESC, name ASC
                ");
            }
            $modules = $stmt->fetchAll(\PDO::FETCH_ASSOC);
            
            // Process results
            foreach ($modules as &$module) {
                $module['dependencies'] = $module['dependencies'] ? json_decode($module['dependencies'], true) : [];
                $module['settings'] = $module['settings'] ? json_decode($module['settings'], true) : [];
                $module['is_core'] = (bool)$module['is_core'];
                // Core modules are always "installed"
                if ($module['is_core']) {
                    $module['status'] = 'installed';
                } else {
                    $module['status'] = $module['status'] ?? 'not_installed';
                }
            }
            
            http_response_code(200);
            echo json_encode(['modules' => $modules]);
        } catch (\Exception $e) {
            error_log("AppsController::workspaceModules error: " . $e->getMessage());
            error_log("AppsController::workspaceModules trace: " . $e->getTraceAsString());
            http_response_code(500);
            $payload = ['error' => 'Failed to fetch workspace modules'];
            if (getenv('APP_ENV') === 'development') {
                $payload['details'] = $e->getMessage();
            }
            echo json_encode($payload);
        }
    }
    
    /**
     * Install/enable a module for the current workspace
     * POST /api/modules/:moduleKey/install
     */
    public static function install(string $moduleKey): void
    {
        try {
            $ctx = $GLOBALS['tenantContext'] ?? null;
            $workspaceId = $ctx->workspaceId ?? null;
            $userId = \Auth::userId();
            
            if (!$workspaceId) {
                http_response_code(400);
                echo json_encode(['error' => 'Workspace context required']);
                return;
            }
            
            // Check workspace role (only owners/admins can install modules)
            $workspaceRole = $ctx->workspaceRole ?? 'member';
            if (!in_array($workspaceRole, ['owner', 'admin'])) {
                http_response_code(403);
                echo json_encode(['error' => 'Only workspace owners/admins can install modules']);
                return;
            }
            
            $pdo = \Database::conn();
            
            // Verify module exists
            $stmt = $pdo->prepare("SELECT module_key, is_core, dependencies FROM modules WHERE module_key = ?");
            $stmt->execute([$moduleKey]);
            $module = $stmt->fetch(\PDO::FETCH_ASSOC);
            
            if (!$module) {
                http_response_code(404);
                echo json_encode(['error' => 'Module not found']);
                return;
            }
            
            // Check dependencies
            $dependencies = $module['dependencies'] ? json_decode($module['dependencies'], true) : [];
            if (!empty($dependencies)) {
                $placeholders = implode(',', array_fill(0, count($dependencies), '?'));
                $stmt = $pdo->prepare("
                    SELECT module_key FROM workspace_modules 
                    WHERE workspace_id = ? AND module_key IN ($placeholders) AND status = 'installed'
                ");
                $stmt->execute(array_merge([$workspaceId], $dependencies));
                $installedDeps = $stmt->fetchAll(\PDO::FETCH_COLUMN);
                
                $missingDeps = array_diff($dependencies, $installedDeps);
                // Core is always installed
                $missingDeps = array_filter($missingDeps, fn($d) => $d !== 'core');
                
                if (!empty($missingDeps)) {
                    http_response_code(400);
                    echo json_encode([
                        'error' => 'Missing dependencies',
                        'missing' => array_values($missingDeps)
                    ]);
                    return;
                }
            }
            
            // Install or re-enable the module
            $stmt = $pdo->prepare("
                INSERT INTO workspace_modules (workspace_id, module_key, status, installed_at, installed_by)
                VALUES (?, ?, 'installed', NOW(), ?)
                ON DUPLICATE KEY UPDATE 
                    status = 'installed',
                    installed_at = NOW(),
                    installed_by = VALUES(installed_by),
                    disabled_at = NULL,
                    disabled_by = NULL
            ");
            $stmt->execute([$workspaceId, $moduleKey, $userId]);
            
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'message' => "Module '{$moduleKey}' installed successfully"
            ]);
        } catch (\Exception $e) {
            error_log("ModulesController::install error: " . $e->getMessage());
            http_response_code(500);
            echo json_encode(['error' => 'Failed to install module']);
        }
    }
    
    /**
     * Disable a module for the current workspace (keeps data)
     * POST /api/modules/:moduleKey/disable
     */
    public static function disable(string $moduleKey): void
    {
        try {
            $ctx = $GLOBALS['tenantContext'] ?? null;
            $workspaceId = $ctx->workspaceId ?? null;
            $userId = \Auth::userId();
            
            if (!$workspaceId) {
                http_response_code(400);
                echo json_encode(['error' => 'Workspace context required']);
                return;
            }
            
            // Check workspace role
            $workspaceRole = $ctx->workspaceRole ?? 'member';
            if (!in_array($workspaceRole, ['owner', 'admin'])) {
                http_response_code(403);
                echo json_encode(['error' => 'Only workspace owners/admins can disable modules']);
                return;
            }
            
            $pdo = \Database::conn();
            
            // Verify module exists and is not core
            $stmt = $pdo->prepare("SELECT module_key, is_core FROM modules WHERE module_key = ?");
            $stmt->execute([$moduleKey]);
            $module = $stmt->fetch(\PDO::FETCH_ASSOC);
            
            if (!$module) {
                http_response_code(404);
                echo json_encode(['error' => 'Module not found']);
                return;
            }
            
            if ($module['is_core']) {
                http_response_code(400);
                echo json_encode(['error' => 'Core modules cannot be disabled']);
                return;
            }
            
            // Check if other modules depend on this one
            $stmt = $pdo->prepare("
                SELECT m.module_key, m.name 
                FROM modules m
                JOIN workspace_modules wm ON m.module_key = wm.module_key
                WHERE wm.workspace_id = ? 
                    AND wm.status = 'installed'
                    AND JSON_CONTAINS(m.dependencies, ?)
            ");
            $stmt->execute([$workspaceId, json_encode($moduleKey)]);
            $dependents = $stmt->fetchAll(\PDO::FETCH_ASSOC);
            
            if (!empty($dependents)) {
                http_response_code(400);
                echo json_encode([
                    'error' => 'Cannot disable: other modules depend on this one',
                    'dependents' => array_column($dependents, 'name')
                ]);
                return;
            }
            
            // Disable the module
            $stmt = $pdo->prepare("
                UPDATE workspace_modules 
                SET status = 'disabled', disabled_at = NOW(), disabled_by = ?
                WHERE workspace_id = ? AND module_key = ?
            ");
            $stmt->execute([$userId, $workspaceId, $moduleKey]);
            
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'message' => "Module '{$moduleKey}' disabled successfully"
            ]);
        } catch (\Exception $e) {
            error_log("ModulesController::disable error: " . $e->getMessage());
            http_response_code(500);
            echo json_encode(['error' => 'Failed to disable module']);
        }
    }
    
    /**
     * Check if a module is enabled for the current workspace
     * Used by other controllers for access control
     */
    public static function isModuleEnabled(string $moduleKey): bool
    {
        try {
            $ctx = $GLOBALS['tenantContext'] ?? null;
            $workspaceId = $ctx->workspaceId ?? null;
            
            if (!$workspaceId) {
                return false;
            }
            
            $pdo = \Database::conn();
            
            // Check if module is core (always enabled)
            $stmt = $pdo->prepare("SELECT is_core FROM modules WHERE module_key = ?");
            $stmt->execute([$moduleKey]);
            $module = $stmt->fetch(\PDO::FETCH_ASSOC);
            
            if (!$module) {
                return false;
            }
            
            if ($module['is_core']) {
                return true;
            }
            
            // Check workspace_modules
            $stmt = $pdo->prepare("
                SELECT status FROM workspace_modules 
                WHERE workspace_id = ? AND module_key = ?
            ");
            $stmt->execute([$workspaceId, $moduleKey]);
            $wm = $stmt->fetch(\PDO::FETCH_ASSOC);
            
            return $wm && $wm['status'] === 'installed';
        } catch (\Exception $e) {
            error_log("ModulesController::isModuleEnabled error: " . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Middleware-style guard to check module access
     * Returns true if access allowed, sends 403 and returns false otherwise
     */
    public static function requireModule(string $moduleKey): bool
    {
        // Developer convenience: allow all modules in non-production or when explicitly overridden
        $appEnv = \Config::get('APP_ENV', 'development');
        $skipGuard = \Config::get('SKIP_MODULE_GUARD', 'false');
        if ($appEnv !== 'production' || filter_var($skipGuard, FILTER_VALIDATE_BOOL)) {
            return true;
        }

        if (!self::isModuleEnabled($moduleKey)) {
            http_response_code(403);
            header('Content-Type: application/json');
            echo json_encode([
                'error' => 'Module not enabled',
                'module' => $moduleKey,
                'message' => "The '{$moduleKey}' module is not enabled for this workspace"
            ]);
            return false;
        }
        return true;
    }
}
