<?php
/**
 * Module Manager Service
 * 
 * Handles module registration, enabling/disabling, and access control
 * with support for phased rollout (user, role, team, percentage-based).
 * 
 * Requirements: 10.1, 10.3, 10.4
 */

class ModuleManager {
    private $pdo;
    private static $instance = null;
    private $accessCache = [];
    
    public function __construct($pdo = null) {
        $this->pdo = $pdo ?? Database::conn();
    }
    
    public static function getInstance($pdo = null): self {
        if (self::$instance === null) {
            self::$instance = new self($pdo);
        }
        return self::$instance;
    }
    
    /**
     * Register a new module in the system
     * Requirements: 10.1
     */
    public function registerModule(array $moduleData): bool {
        $required = ['id', 'name'];
        foreach ($required as $field) {
            if (empty($moduleData[$field])) {
                throw new InvalidArgumentException("Missing required field: $field");
            }
        }
        
        $stmt = $this->pdo->prepare("
            INSERT INTO modules (id, name, description, version, permissions, default_roles, status)
            VALUES (:id, :name, :description, :version, :permissions, :default_roles, :status)
            ON DUPLICATE KEY UPDATE
                name = VALUES(name),
                description = VALUES(description),
                version = VALUES(version),
                permissions = VALUES(permissions),
                default_roles = VALUES(default_roles),
                updated_at = CURRENT_TIMESTAMP
        ");
        
        return $stmt->execute([
            'id' => $moduleData['id'],
            'name' => $moduleData['name'],
            'description' => $moduleData['description'] ?? null,
            'version' => $moduleData['version'] ?? '1.0.0',
            'permissions' => json_encode($moduleData['permissions'] ?? []),
            'default_roles' => json_encode($moduleData['default_roles'] ?? []),
            'status' => $moduleData['status'] ?? 'active'
        ]);
    }

    
    /**
     * Enable a module with rollout configuration
     * Requirements: 10.3
     */
    public function enableModule(string $moduleId, array $rolloutConfig = []): bool {
        // Verify module exists
        $module = $this->getModule($moduleId);
        if (!$module) {
            throw new InvalidArgumentException("Module not found: $moduleId");
        }
        
        // Update module status
        $stmt = $this->pdo->prepare("UPDATE modules SET status = 'active' WHERE id = ?");
        $stmt->execute([$moduleId]);
        
        // Create rollout configuration if provided
        if (!empty($rolloutConfig)) {
            $rolloutType = $rolloutConfig['type'] ?? 'all';
            $targets = $rolloutConfig['targets'] ?? null;
            $percentage = $rolloutConfig['percentage'] ?? null;
            
            // Validate rollout type
            $validTypes = ['user', 'role', 'team', 'percentage', 'all'];
            if (!in_array($rolloutType, $validTypes)) {
                throw new InvalidArgumentException("Invalid rollout type: $rolloutType");
            }
            
            // Deactivate existing rollouts for this module
            $stmt = $this->pdo->prepare("UPDATE module_rollouts SET is_active = 0 WHERE module_id = ?");
            $stmt->execute([$moduleId]);
            
            // Create new rollout
            $stmt = $this->pdo->prepare("
                INSERT INTO module_rollouts (module_id, rollout_type, targets, percentage, is_active)
                VALUES (?, ?, ?, ?, 1)
            ");
            $stmt->execute([
                $moduleId,
                $rolloutType,
                $targets ? json_encode($targets) : null,
                $percentage
            ]);
        }
        
        // Clear access cache
        $this->clearAccessCache($moduleId);
        
        return true;
    }
    
    /**
     * Disable a module
     * Requirements: 10.4
     */
    public function disableModule(string $moduleId): bool {
        $stmt = $this->pdo->prepare("UPDATE modules SET status = 'inactive' WHERE id = ?");
        $result = $stmt->execute([$moduleId]);
        
        // Deactivate all rollouts
        $stmt = $this->pdo->prepare("UPDATE module_rollouts SET is_active = 0 WHERE module_id = ?");
        $stmt->execute([$moduleId]);
        
        // Clear access cache
        $this->clearAccessCache($moduleId);
        
        return $result;
    }
    
    /**
     * Check if a module is enabled for a specific user
     * Requirements: 10.2, 10.3, 10.4
     */
    public function isModuleEnabled(string $moduleId, int $userId): bool {
        // Check cache first
        $cacheKey = "{$moduleId}_{$userId}";
        if (isset($this->accessCache[$cacheKey])) {
            return $this->accessCache[$cacheKey];
        }
        
        // Check if module exists and is active
        $module = $this->getModule($moduleId);
        if (!$module || $module['status'] !== 'active') {
            $this->accessCache[$cacheKey] = false;
            return false;
        }
        
        // Get active rollout configuration
        $stmt = $this->pdo->prepare("
            SELECT * FROM module_rollouts 
            WHERE module_id = ? AND is_active = 1 
            ORDER BY created_at DESC LIMIT 1
        ");
        $stmt->execute([$moduleId]);
        $rollout = $stmt->fetch(PDO::FETCH_ASSOC);
        
        // If no rollout config, module is enabled for all
        if (!$rollout) {
            $this->accessCache[$cacheKey] = true;
            $this->updateAccessCache($moduleId, $userId, true);
            return true;
        }
        
        $hasAccess = $this->evaluateRollout($rollout, $userId);
        $this->accessCache[$cacheKey] = $hasAccess;
        $this->updateAccessCache($moduleId, $userId, $hasAccess);
        
        return $hasAccess;
    }
    
    /**
     * Evaluate rollout configuration for a user
     */
    private function evaluateRollout(array $rollout, int $userId): bool {
        $type = $rollout['rollout_type'];
        $targets = $rollout['targets'] ? json_decode($rollout['targets'], true) : [];
        $percentage = $rollout['percentage'];
        
        switch ($type) {
            case 'all':
                return true;
                
            case 'user':
                return in_array($userId, $targets);
                
            case 'role':
                $userRole = $this->getUserRole($userId);
                return in_array($userRole, $targets);
                
            case 'team':
                $userTeam = $this->getUserTeam($userId);
                return in_array($userTeam, $targets);
                
            case 'percentage':
                // Use consistent hashing for percentage rollout
                $hash = crc32($rollout['module_id'] . '_' . $userId);
                $userPercentile = abs($hash) % 100;
                return $userPercentile < $percentage;
                
            default:
                return false;
        }
    }
    
    /**
     * Get user's role ID
     */
    private function getUserRole(int $userId): ?int {
        $stmt = $this->pdo->prepare("SELECT role_id FROM users WHERE id = ?");
        $stmt->execute([$userId]);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        return $result ? $result['role_id'] : null;
    }
    
    /**
     * Get user's team ID
     */
    private function getUserTeam(int $userId): ?int {
        $stmt = $this->pdo->prepare("SELECT team_id FROM users WHERE id = ?");
        $stmt->execute([$userId]);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        return $result ? $result['team_id'] : null;
    }
    
    /**
     * Get module by ID
     */
    public function getModule(string $moduleId): ?array {
        $stmt = $this->pdo->prepare("SELECT * FROM modules WHERE id = ?");
        $stmt->execute([$moduleId]);
        $module = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($module) {
            $module['permissions'] = json_decode($module['permissions'], true) ?? [];
            $module['default_roles'] = json_decode($module['default_roles'], true) ?? [];
        }
        
        return $module ?: null;
    }
    
    /**
     * Get all modules
     */
    public function getAllModules(): array {
        $stmt = $this->pdo->query("SELECT * FROM modules ORDER BY name");
        $modules = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        foreach ($modules as &$module) {
            $module['permissions'] = json_decode($module['permissions'], true) ?? [];
            $module['default_roles'] = json_decode($module['default_roles'], true) ?? [];
        }
        
        return $modules;
    }
    
    /**
     * Get modules enabled for a user
     */
    public function getEnabledModulesForUser(int $userId): array {
        $allModules = $this->getAllModules();
        $enabledModules = [];
        
        foreach ($allModules as $module) {
            if ($this->isModuleEnabled($module['id'], $userId)) {
                $enabledModules[] = $module;
            }
        }
        
        return $enabledModules;
    }
    
    /**
     * Update access cache in database
     */
    private function updateAccessCache(string $moduleId, int $userId, bool $hasAccess): void {
        try {
            $stmt = $this->pdo->prepare("
                INSERT INTO module_user_access (module_id, user_id, has_access, computed_at)
                VALUES (?, ?, ?, CURRENT_TIMESTAMP)
                ON DUPLICATE KEY UPDATE has_access = VALUES(has_access), computed_at = CURRENT_TIMESTAMP
            ");
            $stmt->execute([$moduleId, $userId, $hasAccess ? 1 : 0]);
        } catch (PDOException $e) {
            // Silently fail if user doesn't exist - cache is optional
            error_log("ModuleManager: Could not update access cache: " . $e->getMessage());
        }
    }
    
    /**
     * Clear access cache for a module
     */
    private function clearAccessCache(string $moduleId): void {
        $this->accessCache = array_filter($this->accessCache, function($key) use ($moduleId) {
            return strpos($key, $moduleId) !== 0;
        }, ARRAY_FILTER_USE_KEY);
        
        $stmt = $this->pdo->prepare("DELETE FROM module_user_access WHERE module_id = ?");
        $stmt->execute([$moduleId]);
    }
    
    /**
     * Get rollout configuration for a module
     */
    public function getRolloutConfig(string $moduleId): ?array {
        $stmt = $this->pdo->prepare("
            SELECT * FROM module_rollouts 
            WHERE module_id = ? AND is_active = 1 
            ORDER BY created_at DESC LIMIT 1
        ");
        $stmt->execute([$moduleId]);
        $rollout = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($rollout) {
            $rollout['targets'] = json_decode($rollout['targets'], true);
        }
        
        return $rollout ?: null;
    }
    
    /**
     * Check if user has specific permission for a module
     * Requirements: 10.2, 10.5
     */
    public function hasModulePermission(string $moduleId, int $userId, string $permission): bool {
        // First check if module is enabled for user
        if (!$this->isModuleEnabled($moduleId, $userId)) {
            return false;
        }
        
        // Get module permissions
        $module = $this->getModule($moduleId);
        if (!$module) {
            // Fail-safe: deny access if module not found (Requirement 10.5)
            return false;
        }
        
        // Check if permission exists in module
        $modulePermissions = $module['permissions'];
        if (!in_array($permission, $modulePermissions)) {
            // Fail-safe: deny access if permission not configured (Requirement 10.5)
            return false;
        }
        
        // Check user's role permissions via RBAC
        $userRole = $this->getUserRole($userId);
        if (!$userRole) {
            // Fail-safe: deny access if no role assigned
            return false;
        }
        
        // Check if role has the permission
        $stmt = $this->pdo->prepare("
            SELECT COUNT(*) FROM role_permissions rp
            JOIN permissions p ON rp.permission_id = p.id
            WHERE rp.role_id = ? AND p.`key` = ?
        ");
        $stmt->execute([$userRole, $permission]);
        
        return $stmt->fetchColumn() > 0;
    }
}
