<?php
/**
 * Roles Controller
 * API endpoints for role management
 */

require_once __DIR__ . '/../Database.php';
require_once __DIR__ . '/../Response.php';
require_once __DIR__ . '/../Auth.php';
require_once __DIR__ . '/../services/RBACService.php';

class RolesController {
    
    /**
     * Get all roles
     * GET /roles
     */
    public static function index(): void {
        $userId = Auth::userIdOrFail();
        $rbac = RBACService::getInstance();
        
        // Check permission (admin or roles.view)
        if (!$rbac->isAdmin($userId) && !$rbac->hasPermission($userId, 'roles.view')) {
            Response::forbidden('You do not have permission to view roles');
            return;
        }
        
        try {
            $roles = $rbac->getAllRoles();
            Response::json(['success' => true, 'data' => $roles]);
        } catch (Exception $e) {
            Response::error($e->getMessage());
        }
    }
    
    /**
     * Get a single role
     * GET /roles/:id
     */
    public static function show(int $id): void {
        $userId = Auth::userIdOrFail();
        $rbac = RBACService::getInstance();
        
        if (!$rbac->isAdmin($userId) && !$rbac->hasPermission($userId, 'roles.view')) {
            Response::forbidden('You do not have permission to view roles');
            return;
        }
        
        try {
            $role = $rbac->getRoleById($id);
            if (!$role) {
                Response::notFound('Role not found');
                return;
            }
            Response::json(['success' => true, 'data' => $role]);
        } catch (Exception $e) {
            Response::error($e->getMessage());
        }
    }
    
    /**
     * Create a new role
     * POST /roles
     */
    public static function create(): void {
        $userId = Auth::userIdOrFail();
        $rbac = RBACService::getInstance();
        
        if (!$rbac->isAdmin($userId) && !$rbac->hasPermission($userId, 'roles.create')) {
            Response::forbidden('You do not have permission to create roles');
            return;
        }
        
        $body = get_json_body();
        
        if (empty($body['name'])) {
            Response::validationError('Role name is required', ['name' => 'Name is required']);
            return;
        }
        
        try {
            $role = $rbac->createRole(
                $body['name'],
                $body['description'] ?? '',
                $body['permissions'] ?? []
            );
            
            // Log the action
            $rbac->logRBACAction('role_created', $userId, [
                'target_type' => 'role',
                'target_id' => $role['id'],
                'new_value' => ['name' => $role['name'], 'permissions' => $role['permissions']]
            ]);
            
            Response::json(['success' => true, 'data' => $role], 201);
        } catch (Exception $e) {
            Response::error($e->getMessage());
        }
    }
    
    /**
     * Update a role
     * PUT /roles/:id
     */
    public static function update(int $id): void {
        $userId = Auth::userIdOrFail();
        $rbac = RBACService::getInstance();
        
        if (!$rbac->isAdmin($userId) && !$rbac->hasPermission($userId, 'roles.edit')) {
            Response::forbidden('You do not have permission to edit roles');
            return;
        }
        
        $body = get_json_body();
        
        try {
            $oldRole = $rbac->getRoleById($id);
            if (!$oldRole) {
                Response::notFound('Role not found');
                return;
            }
            
            $role = $rbac->updateRole($id, $body);
            
            // Log the action
            $rbac->logRBACAction('role_updated', $userId, [
                'target_type' => 'role',
                'target_id' => $id,
                'old_value' => ['name' => $oldRole['name'], 'permissions' => $oldRole['permissions']],
                'new_value' => ['name' => $role['name'], 'permissions' => $role['permissions']]
            ]);
            
            Response::json(['success' => true, 'data' => $role]);
        } catch (Exception $e) {
            Response::error($e->getMessage());
        }
    }
    
    /**
     * Delete a role
     * DELETE /roles/:id
     */
    public static function delete(int $id): void {
        $userId = Auth::userIdOrFail();
        $rbac = RBACService::getInstance();
        
        if (!$rbac->isAdmin($userId) && !$rbac->hasPermission($userId, 'roles.delete')) {
            Response::forbidden('You do not have permission to delete roles');
            return;
        }
        
        try {
            $role = $rbac->getRoleById($id);
            if (!$role) {
                Response::notFound('Role not found');
                return;
            }
            
            $rbac->deleteRole($id);
            
            // Log the action
            $rbac->logRBACAction('role_deleted', $userId, [
                'target_type' => 'role',
                'target_id' => $id,
                'old_value' => ['name' => $role['name']]
            ]);
            
            Response::json(['success' => true, 'message' => 'Role deleted successfully']);
        } catch (Exception $e) {
            Response::error($e->getMessage());
        }
    }
    
    /**
     * Get role permissions
     * GET /roles/:id/permissions
     */
    public static function getPermissions(int $id): void {
        $userId = Auth::userIdOrFail();
        $rbac = RBACService::getInstance();
        
        if (!$rbac->isAdmin($userId) && !$rbac->hasPermission($userId, 'roles.view')) {
            Response::forbidden('You do not have permission to view role permissions');
            return;
        }
        
        try {
            $role = $rbac->getRoleById($id);
            if (!$role) {
                Response::notFound('Role not found');
                return;
            }
            
            $permissions = $rbac->getRolePermissions($id);
            Response::json(['success' => true, 'data' => $permissions]);
        } catch (Exception $e) {
            Response::error($e->getMessage());
        }
    }
    
    /**
     * Set role permissions
     * PUT /roles/:id/permissions
     */
    public static function setPermissions(int $id): void {
        $userId = Auth::userIdOrFail();
        $rbac = RBACService::getInstance();
        
        if (!$rbac->isAdmin($userId) && !$rbac->hasPermission($userId, 'roles.edit')) {
            Response::forbidden('You do not have permission to edit role permissions');
            return;
        }
        
        $body = get_json_body();
        
        if (!isset($body['permissions']) || !is_array($body['permissions'])) {
            Response::validationError('Permissions array is required', ['permissions' => 'Must be an array']);
            return;
        }
        
        try {
            $oldRole = $rbac->getRoleById($id);
            if (!$oldRole) {
                Response::notFound('Role not found');
                return;
            }
            
            $rbac->setRolePermissions($id, $body['permissions']);
            $role = $rbac->getRoleById($id);
            
            // Log the action
            $rbac->logRBACAction('role_permissions_updated', $userId, [
                'target_type' => 'role',
                'target_id' => $id,
                'old_value' => ['permissions' => $oldRole['permissions']],
                'new_value' => ['permissions' => $role['permissions']]
            ]);
            
            Response::json(['success' => true, 'data' => $role]);
        } catch (Exception $e) {
            Response::error($e->getMessage());
        }
    }
    
    /**
     * Get users with a specific role
     * GET /roles/:id/users
     */
    public static function getUsersWithRole(int $id): void {
        $userId = Auth::userIdOrFail();
        $rbac = RBACService::getInstance();
        
        if (!$rbac->isAdmin($userId) && !$rbac->hasPermission($userId, 'roles.view')) {
            Response::forbidden('You do not have permission to view role users');
            return;
        }
        
        try {
            $role = $rbac->getRoleById($id);
            if (!$role) {
                Response::notFound('Role not found');
                return;
            }
            
            $users = $rbac->getUsersWithRole($id);
            Response::json(['success' => true, 'data' => $users]);
        } catch (Exception $e) {
            Response::error($e->getMessage());
        }
    }
}
