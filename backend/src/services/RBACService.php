<?php
/**
 * RBAC Service - Role-Based Access Control
 * Core service for managing roles, permissions, and access control
 */

require_once __DIR__ . '/../Database.php';
require_once __DIR__ . '/../Logger.php';

class RBACService {
    private static ?RBACService $instance = null;
    private PDO $pdo;
    private array $permissionCache = [];
    private array $roleCache = [];

    private function __construct() {
        $this->pdo = \Xordon\Database::conn();
    }

    public static function getInstance(): RBACService {
        if (self::$instance === null) {
            self::$instance = new RBACService();
        }
        return self::$instance;
    }

    // ==================== ROLE MANAGEMENT ====================

    /**
     * Get all roles
     */
    public function getAllRoles(): array {
        $stmt = $this->pdo->query('
            SELECT r.*, 
                   (SELECT COUNT(*) FROM users WHERE role_id = r.id) as user_count
            FROM roles r 
            ORDER BY r.is_system DESC, r.name ASC
        ');
        $roles = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Add permissions to each role
        foreach ($roles as &$role) {
            $role['permissions'] = $this->getRolePermissionKeys((int)$role['id']);
        }
        
        return $roles;
    }

    /**
     * Get role by ID
     */
    public function getRoleById(int $id): ?array {
        if (isset($this->roleCache[$id])) {
            return $this->roleCache[$id];
        }

        $stmt = $this->pdo->prepare('
            SELECT r.*, 
                   (SELECT COUNT(*) FROM users WHERE role_id = r.id) as user_count
            FROM roles r 
            WHERE r.id = ?
        ');
        $stmt->execute([$id]);
        $role = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($role) {
            $role['permissions'] = $this->getRolePermissionKeys((int)$role['id']);
            $this->roleCache[$id] = $role;
        }
        
        return $role ?: null;
    }

    /**
     * Get role by name
     */
    public function getRoleByName(string $name): ?array {
        $stmt = $this->pdo->prepare('SELECT * FROM roles WHERE LOWER(name) = LOWER(?)');
        $stmt->execute([$name]);
        $role = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($role) {
            $role['permissions'] = $this->getRolePermissionKeys((int)$role['id']);
        }
        
        return $role ?: null;
    }

    /**
     * Create a new role
     */
    public function createRole(string $name, string $description, array $permissions = [], bool $isSystem = false): array {
        // Check for duplicate name
        if ($this->getRoleByName($name)) {
            throw new Exception("Role with name '$name' already exists");
        }

        $this->pdo->beginTransaction();
        try {
            $stmt = $this->pdo->prepare('
                INSERT INTO roles (name, description, is_system, created_at, updated_at) 
                VALUES (?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            ');
            $stmt->execute([$name, $description, $isSystem ? 1 : 0]);
            $roleId = (int)$this->pdo->lastInsertId();

            // Assign permissions
            if (!empty($permissions)) {
                $this->setRolePermissions($roleId, $permissions);
            }

            $this->pdo->commit();
            $this->clearCache();

            return $this->getRoleById($roleId);
        } catch (Exception $e) {
            $this->pdo->rollBack();
            throw $e;
        }
    }

    /**
     * Update a role
     */
    public function updateRole(int $id, array $data): array {
        $role = $this->getRoleById($id);
        if (!$role) {
            throw new Exception("Role not found");
        }

        // Check for duplicate name if name is being changed
        if (isset($data['name']) && strtolower($data['name']) !== strtolower($role['name'])) {
            if ($this->getRoleByName($data['name'])) {
                throw new Exception("Role with name '{$data['name']}' already exists");
            }
        }

        $updates = [];
        $params = [];

        if (isset($data['name'])) {
            $updates[] = 'name = ?';
            $params[] = $data['name'];
        }
        if (isset($data['description'])) {
            $updates[] = 'description = ?';
            $params[] = $data['description'];
        }

        if (!empty($updates)) {
            $params[] = $id;
            $sql = 'UPDATE roles SET ' . implode(', ', $updates) . ', updated_at = CURRENT_TIMESTAMP WHERE id = ?';
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute($params);
        }

        // Update permissions if provided
        if (isset($data['permissions'])) {
            $this->setRolePermissions($id, $data['permissions']);
        }

        $this->clearCache();
        return $this->getRoleById($id);
    }

    /**
     * Delete a role
     */
    public function deleteRole(int $id): bool {
        $role = $this->getRoleById($id);
        if (!$role) {
            throw new Exception("Role not found");
        }

        if ($role['is_system']) {
            throw new Exception("Cannot delete system role");
        }

        // Check if any users have this role
        $stmt = $this->pdo->prepare('SELECT COUNT(*) FROM users WHERE role_id = ?');
        $stmt->execute([$id]);
        if ($stmt->fetchColumn() > 0) {
            throw new Exception("Cannot delete role that is assigned to users");
        }

        $stmt = $this->pdo->prepare('DELETE FROM roles WHERE id = ?');
        $result = $stmt->execute([$id]);
        
        $this->clearCache();
        return $result;
    }

    // ==================== PERMISSION MANAGEMENT ====================

    /**
     * Get all permissions
     */
    public function getAllPermissions(): array {
        $stmt = $this->pdo->query('SELECT * FROM permissions ORDER BY category, name');
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Get permissions grouped by category
     */
    public function getPermissionsByCategory(): array {
        $permissions = $this->getAllPermissions();
        $grouped = [];
        
        foreach ($permissions as $permission) {
            $category = $permission['category'];
            if (!isset($grouped[$category])) {
                $grouped[$category] = [
                    'name' => $category,
                    'permissions' => []
                ];
            }
            $grouped[$category]['permissions'][] = $permission;
        }
        
        return array_values($grouped);
    }

    /**
     * Get permission by key
     */
    public function getPermissionByKey(string $key): ?array {
        $stmt = $this->pdo->prepare('SELECT * FROM permissions WHERE `key` = ?');
        $stmt->execute([$key]);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        return $result ?: null;
    }

    /**
     * Get role permissions (full objects)
     */
    public function getRolePermissions(int $roleId): array {
        $stmt = $this->pdo->prepare('
            SELECT p.* FROM permissions p
            INNER JOIN role_permissions rp ON p.id = rp.permission_id
            WHERE rp.role_id = ?
            ORDER BY p.category, p.name
        ');
        $stmt->execute([$roleId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Get role permission keys only
     */
    public function getRolePermissionKeys(int $roleId): array {
        $stmt = $this->pdo->prepare('
            SELECT p.`key` FROM permissions p
            INNER JOIN role_permissions rp ON p.id = rp.permission_id
            WHERE rp.role_id = ?
        ');
        $stmt->execute([$roleId]);
        return $stmt->fetchAll(PDO::FETCH_COLUMN);
    }

    /**
     * Set role permissions (replaces existing)
     */
    public function setRolePermissions(int $roleId, array $permissionKeys): bool {
        // Validate all permission keys exist
        foreach ($permissionKeys as $key) {
            if ($key === '*') continue; // Wildcard for admin
            if (!$this->getPermissionByKey($key)) {
                throw new Exception("Invalid permission key: $key");
            }
        }

        // Check if we're already in a transaction
        $inTransaction = $this->pdo->inTransaction();
        
        if (!$inTransaction) {
            $this->pdo->beginTransaction();
        }
        
        try {
            // Remove existing permissions
            $stmt = $this->pdo->prepare('DELETE FROM role_permissions WHERE role_id = ?');
            $stmt->execute([$roleId]);

            // Add new permissions
            if (!empty($permissionKeys) && !in_array('*', $permissionKeys)) {
                $stmt = $this->pdo->prepare('
                    INSERT INTO role_permissions (role_id, permission_id)
                    SELECT ?, id FROM permissions WHERE `key` = ?
                ');
                foreach ($permissionKeys as $key) {
                    $stmt->execute([$roleId, $key]);
                }
            } elseif (in_array('*', $permissionKeys)) {
                // Admin role - assign all permissions
                $stmt = $this->pdo->prepare('
                    INSERT INTO role_permissions (role_id, permission_id)
                    SELECT ?, id FROM permissions
                ');
                $stmt->execute([$roleId]);
            }

            if (!$inTransaction) {
                $this->pdo->commit();
            }
            $this->clearCache();
            return true;
        } catch (Exception $e) {
            if (!$inTransaction) {
                $this->pdo->rollBack();
            }
            throw $e;
        }
    }

    // ==================== USER ROLE MANAGEMENT ====================

    /**
     * Get user's role
     */
    public function getUserRole(int $userId): ?array {
        $stmt = $this->pdo->prepare('
            SELECT r.* FROM roles r
            INNER JOIN users u ON u.role_id = r.id
            WHERE u.id = ?
        ');
        $stmt->execute([$userId]);
        $role = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($role) {
            $role['permissions'] = $this->getRolePermissionKeys((int)$role['id']);
        }
        
        return $role ?: null;
    }

    /**
     * Set user's role
     */
    public function setUserRole(int $userId, int $roleId, int $actorId = null): bool {
        // Verify role exists
        $role = $this->getRoleById($roleId);
        if (!$role) {
            throw new Exception("Role not found");
        }

        // Get current role for audit
        $currentRole = $this->getUserRole($userId);

        // Check last admin protection
        if ($currentRole && strtolower($currentRole['name']) === 'admin') {
            if (strtolower($role['name']) !== 'admin') {
                // User is being demoted from admin
                $stmt = $this->pdo->prepare('
                    SELECT COUNT(*) FROM users u
                    INNER JOIN roles r ON u.role_id = r.id
                    WHERE LOWER(r.name) = "admin" AND u.id != ?
                ');
                $stmt->execute([$userId]);
                if ($stmt->fetchColumn() == 0) {
                    throw new Exception("Cannot remove admin role from the last admin user");
                }
            }
        }

        $stmt = $this->pdo->prepare('UPDATE users SET role_id = ? WHERE id = ?');
        $result = $stmt->execute([$roleId, $userId]);

        // Log the change
        if ($actorId) {
            $this->logRBACAction('role_assignment', $actorId, [
                'target_type' => 'user',
                'target_id' => $userId,
                'old_value' => $currentRole ? ['role_id' => $currentRole['id'], 'role_name' => $currentRole['name']] : null,
                'new_value' => ['role_id' => $roleId, 'role_name' => $role['name']]
            ]);
        }

        $this->clearCache();
        return $result;
    }

    /**
     * Get users with a specific role
     */
    public function getUsersWithRole(int $roleId): array {
        $stmt = $this->pdo->prepare('
            SELECT id, email, name, created_at FROM users WHERE role_id = ?
        ');
        $stmt->execute([$roleId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }


    // ==================== PERMISSION CHECKING ====================

    /**
     * Check if user has a specific permission
     */
    public function hasPermission(int $userId, string $permissionKey): bool {
        // Debug logging
        \Logger::debug('RBAC: Permission check', [
            'user_id' => $userId,
            'permission' => $permissionKey,
        ]);
        

        // Check if user is admin (has all permissions)
        if ($this->isAdmin($userId)) {
            return true;
        }

        $cacheKey = "{$userId}:{$permissionKey}";
        if (isset($this->permissionCache[$cacheKey])) {
            return $this->permissionCache[$cacheKey];
        }

        $stmt = $this->pdo->prepare('
            SELECT COUNT(*) FROM role_permissions rp
            INNER JOIN permissions p ON rp.permission_id = p.id
            INNER JOIN users u ON u.role_id = rp.role_id
            WHERE u.id = ? AND p.`key` = ?
        ');
        $stmt->execute([$userId, $permissionKey]);
        $hasPermission = $stmt->fetchColumn() > 0;

        $this->permissionCache[$cacheKey] = $hasPermission;
        return $hasPermission;
    }

    /**
     * Check if user has any of the specified permissions
     */
    public function hasAnyPermission(int $userId, array $permissionKeys): bool {
        if ($this->isAdmin($userId)) {
            return true;
        }

        foreach ($permissionKeys as $key) {
            if ($this->hasPermission($userId, $key)) {
                return true;
            }
        }
        return false;
    }

    /**
     * Check if user has all of the specified permissions
     */
    public function hasAllPermissions(int $userId, array $permissionKeys): bool {
        if ($this->isAdmin($userId)) {
            return true;
        }

        foreach ($permissionKeys as $key) {
            if (!$this->hasPermission($userId, $key)) {
                return false;
            }
        }
        return true;
    }

    /**
     * Check if user is an admin
     */
    public function isAdmin(int $userId): bool {
        $role = $this->getUserRole($userId);
        $isAdmin = $role && strtolower($role['name']) === 'admin';
        
        if (!$isAdmin) {
            \Logger::debug("RBAC: Admin check failed", [
                'user_id' => $userId,
                'role_found' => $role ? $role['name'] : 'none'
            ]);
        }
        
        return $isAdmin;
    }

    /**
     * Get all permissions for a user
     */
    public function getUserPermissions(int $userId): array {
        $role = $this->getUserRole($userId);
        if (!$role) {
            return [];
        }

        // Admin has all permissions
        if (strtolower($role['name']) === 'admin') {
            $stmt = $this->pdo->query('SELECT `key` FROM permissions');
            return $stmt->fetchAll(PDO::FETCH_COLUMN);
        }

        return $this->getRolePermissionKeys((int)$role['id']);
    }

    // ==================== AUDIT LOGGING ====================

    /**
     * Log an RBAC action
     */
    public function logRBACAction(string $action, int $actorId, array $details): void {
        try {
            $stmt = $this->pdo->prepare('
                INSERT INTO rbac_audit_log 
                (action, actor_id, target_type, target_id, old_value, new_value, ip_address, user_agent, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
            ');
            $stmt->execute([
                $action,
                $actorId,
                $details['target_type'] ?? null,
                $details['target_id'] ?? null,
                isset($details['old_value']) ? json_encode($details['old_value']) : null,
                isset($details['new_value']) ? json_encode($details['new_value']) : null,
                $_SERVER['REMOTE_ADDR'] ?? null,
                $_SERVER['HTTP_USER_AGENT'] ?? null
            ]);
        } catch (Exception $e) {
            \Logger::error('Failed to log RBAC action', [
                'action' => $action,
                'actor_id' => $actorId,
                'error' => $e->getMessage()
            ]);
        }
    }

    /**
     * Get audit log entries
     */
    public function getAuditLog(array $filters = [], int $limit = 100, int $offset = 0): array {
        $where = ['1=1'];
        $params = [];

        if (!empty($filters['action'])) {
            $where[] = 'action = ?';
            $params[] = $filters['action'];
        }
        if (!empty($filters['actor_id'])) {
            $where[] = 'actor_id = ?';
            $params[] = $filters['actor_id'];
        }
        if (!empty($filters['target_type'])) {
            $where[] = 'target_type = ?';
            $params[] = $filters['target_type'];
        }
        if (!empty($filters['date_from'])) {
            $where[] = 'created_at >= ?';
            $params[] = $filters['date_from'];
        }
        if (!empty($filters['date_to'])) {
            $where[] = 'created_at <= ?';
            $params[] = $filters['date_to'];
        }

        $sql = '
            SELECT al.*, u.name as actor_name, u.email as actor_email
            FROM rbac_audit_log al
            LEFT JOIN users u ON al.actor_id = u.id
            WHERE ' . implode(' AND ', $where) . '
            ORDER BY al.created_at DESC
            LIMIT ? OFFSET ?
        ';
        $params[] = $limit;
        $params[] = $offset;

        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($params);
        $entries = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Decode JSON values
        foreach ($entries as &$entry) {
            $entry['old_value'] = $entry['old_value'] ? json_decode($entry['old_value'], true) : null;
            $entry['new_value'] = $entry['new_value'] ? json_decode($entry['new_value'], true) : null;
        }

        return $entries;
    }

    // ==================== PERMISSION MATRIX ====================

    /**
     * Get the full permission matrix (all roles with their permissions)
     */
    public function getPermissionMatrix(): array {
        $roles = $this->getAllRoles();
        $permissions = $this->getPermissionsByCategory();
        
        return [
            'roles' => $roles,
            'permissions' => $permissions
        ];
    }

    /**
     * Export permission matrix as JSON
     */
    public function exportPermissionMatrix(): string {
        return json_encode($this->getPermissionMatrix(), JSON_PRETTY_PRINT);
    }

    /**
     * Import permission matrix from JSON
     */
    public function importPermissionMatrix(string $json, int $actorId): bool {
        $data = json_decode($json, true);
        if (!$data || !isset($data['roles'])) {
            throw new Exception("Invalid permission matrix format");
        }

        $this->pdo->beginTransaction();
        try {
            foreach ($data['roles'] as $roleData) {
                $existingRole = $this->getRoleByName($roleData['name']);
                
                if ($existingRole) {
                    // Update existing role permissions
                    if (isset($roleData['permissions'])) {
                        $this->setRolePermissions((int)$existingRole['id'], $roleData['permissions']);
                    }
                } else {
                    // Create new role
                    $this->createRole(
                        $roleData['name'],
                        $roleData['description'] ?? '',
                        $roleData['permissions'] ?? [],
                        $roleData['is_system'] ?? false
                    );
                }
            }

            $this->logRBACAction('permission_matrix_import', $actorId, [
                'target_type' => 'system',
                'new_value' => ['roles_count' => count($data['roles'])]
            ]);

            $this->pdo->commit();
            return true;
        } catch (Exception $e) {
            $this->pdo->rollBack();
            throw $e;
        }
    }

    // ==================== DEFAULT ROLE ====================

    /**
     * Get the default role for new users
     */
    public function getDefaultRole(): ?array {
        // Default to Outreach Specialist if exists, otherwise first non-admin role
        $role = $this->getRoleByName('Outreach Specialist');
        if ($role) {
            return $role;
        }

        $stmt = $this->pdo->prepare('
            SELECT * FROM roles WHERE LOWER(name) != "admin" ORDER BY id LIMIT 1
        ');
        $stmt->execute();
        $role = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($role) {
            $role['permissions'] = $this->getRolePermissionKeys((int)$role['id']);
        }
        
        return $role ?: null;
    }

    /**
     * Assign default role to a user
     */
    public function assignDefaultRole(int $userId): bool {
        $defaultRole = $this->getDefaultRole();
        if (!$defaultRole) {
            return false;
        }
        
        $stmt = $this->pdo->prepare('UPDATE users SET role_id = ? WHERE id = ? AND role_id IS NULL');
        return $stmt->execute([$defaultRole['id'], $userId]);
    }

    // ==================== CACHE MANAGEMENT ====================

    /**
     * Clear all caches
     */
    private function clearCache(): void {
        $this->permissionCache = [];
        $this->roleCache = [];
    }
}
