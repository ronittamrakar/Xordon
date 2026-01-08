<?php
/**
 * Permissions Controller
 * API endpoints for permission management
 */

require_once __DIR__ . '/../Database.php';
require_once __DIR__ . '/../Response.php';
require_once __DIR__ . '/../Auth.php';
require_once __DIR__ . '/../services/RBACService.php';

class PermissionsController {
    
    /**
     * Get all permissions
     * GET /permissions
     */
    public static function index(): void {
        $userId = Auth::userIdOrFail();
        $rbac = RBACService::getInstance();
        
        // Any authenticated user can view permissions list
        // (needed for UI to know what permissions exist)
        
        try {
            $permissions = $rbac->getAllPermissions();
            Response::json(['success' => true, 'data' => $permissions]);
        } catch (Exception $e) {
            Response::error($e->getMessage());
        }
    }
    
    /**
     * Get permissions grouped by category
     * GET /permissions/categories
     */
    public static function getByCategory(): void {
        $userId = Auth::userIdOrFail();
        $rbac = RBACService::getInstance();
        
        try {
            $categories = $rbac->getPermissionsByCategory();
            Response::json(['success' => true, 'data' => $categories]);
        } catch (Exception $e) {
            Response::error($e->getMessage());
        }
    }
    
    /**
     * Get the full permission matrix (all roles with their permissions)
     * GET /permissions/matrix
     */
    public static function getMatrix(): void {
        $userId = Auth::userIdOrFail();
        $rbac = RBACService::getInstance();
        
        // Only admins or users with roles.view can see the full matrix
        if (!$rbac->isAdmin($userId) && !$rbac->hasPermission($userId, 'roles.view')) {
            Response::forbidden('You do not have permission to view the permission matrix');
            return;
        }
        
        try {
            $matrix = $rbac->getPermissionMatrix();
            Response::json(['success' => true, 'data' => $matrix]);
        } catch (Exception $e) {
            Response::error($e->getMessage());
        }
    }
    
    /**
     * Export permission matrix as JSON
     * GET /permissions/export
     */
    public static function export(): void {
        $userId = Auth::userIdOrFail();
        $rbac = RBACService::getInstance();
        
        if (!$rbac->isAdmin($userId)) {
            Response::forbidden('Only administrators can export the permission matrix');
            return;
        }
        
        try {
            $json = $rbac->exportPermissionMatrix();
            
            // Log the export
            $rbac->logRBACAction('permission_matrix_exported', $userId, [
                'target_type' => 'system'
            ]);
            
            header('Content-Type: application/json');
            header('Content-Disposition: attachment; filename="permission-matrix-' . date('Y-m-d') . '.json"');
            echo $json;
            exit;
        } catch (Exception $e) {
            Response::error($e->getMessage());
        }
    }
    
    /**
     * Import permission matrix from JSON
     * POST /permissions/import
     */
    public static function import(): void {
        $userId = Auth::userIdOrFail();
        $rbac = RBACService::getInstance();
        
        if (!$rbac->isAdmin($userId)) {
            Response::forbidden('Only administrators can import the permission matrix');
            return;
        }
        
        $body = get_json_body();
        
        if (empty($body)) {
            Response::validationError('JSON data is required');
            return;
        }
        
        try {
            $json = json_encode($body);
            $rbac->importPermissionMatrix($json, $userId);
            
            Response::json(['success' => true, 'message' => 'Permission matrix imported successfully']);
        } catch (Exception $e) {
            Response::error($e->getMessage());
        }
    }
    
    /**
     * Get current user's permissions
     * GET /permissions/me
     */
    public static function myPermissions(): void {
        $userId = Auth::userIdOrFail();
        $rbac = RBACService::getInstance();
        
        try {
            $role = $rbac->getUserRole($userId);
            $permissions = $rbac->getUserPermissions($userId);
            
            Response::json([
                'success' => true,
                'data' => [
                    'role' => $role,
                    'permissions' => $permissions,
                    'is_admin' => $rbac->isAdmin($userId)
                ]
            ]);
        } catch (Exception $e) {
            Response::error($e->getMessage());
        }
    }
    
    /**
     * Check if current user has a specific permission
     * GET /permissions/check/:permission
     */
    public static function check(string $permission): void {
        $userId = Auth::userIdOrFail();
        $rbac = RBACService::getInstance();
        
        try {
            $hasPermission = $rbac->hasPermission($userId, $permission);
            
            Response::json([
                'success' => true,
                'data' => [
                    'permission' => $permission,
                    'has_permission' => $hasPermission
                ]
            ]);
        } catch (Exception $e) {
            Response::error($e->getMessage());
        }
    }
}
