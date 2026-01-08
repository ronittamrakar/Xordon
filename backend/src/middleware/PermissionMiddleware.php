<?php
/**
 * Permission Middleware
 * Middleware for enforcing RBAC permissions on API routes
 */

require_once __DIR__ . '/../Auth.php';
require_once __DIR__ . '/../Response.php';
require_once __DIR__ . '/../Logger.php';
require_once __DIR__ . '/../services/RBACService.php';

class PermissionMiddleware {
    
    /**
     * Check if user has a specific permission
     * Returns true if authorized, sends 403 response and returns false if not
     */
    public static function require(string $permission): bool {
        $userId = Auth::userId();
        
        if ($userId === null) {
            Response::unauthorized('Authentication required');
            return false;
        }
        
        $rbac = RBACService::getInstance();
        
        if (!$rbac->hasPermission($userId, $permission)) {
            self::logAccessDenied($userId, $permission);
            Response::forbidden("Permission denied: $permission required");
            return false;
        }
        
        return true;
    }
    
    /**
     * Check if user has any of the specified permissions
     */
    public static function requireAny(array $permissions): bool {
        $userId = Auth::userId();
        
        if ($userId === null) {
            Response::unauthorized('Authentication required');
            return false;
        }
        
        $rbac = RBACService::getInstance();
        
        if (!$rbac->hasAnyPermission($userId, $permissions)) {
            self::logAccessDenied($userId, implode(' OR ', $permissions));
            Response::forbidden("Permission denied: one of [" . implode(', ', $permissions) . "] required");
            return false;
        }
        
        return true;
    }
    
    /**
     * Check if user has all of the specified permissions
     */
    public static function requireAll(array $permissions): bool {
        $userId = Auth::userId();
        
        if ($userId === null) {
            Response::unauthorized('Authentication required');
            return false;
        }
        
        $rbac = RBACService::getInstance();
        
        if (!$rbac->hasAllPermissions($userId, $permissions)) {
            self::logAccessDenied($userId, implode(' AND ', $permissions));
            Response::forbidden("Permission denied: all of [" . implode(', ', $permissions) . "] required");
            return false;
        }
        
        return true;
    }
    
    /**
     * Check if user is an admin
     */
    public static function adminOnly(): bool {
        $userId = Auth::userId();
        
        if ($userId === null) {
            Response::unauthorized('Authentication required');
            return false;
        }
        
        $rbac = RBACService::getInstance();
        
        if (!$rbac->isAdmin($userId)) {
            self::logAccessDenied($userId, 'admin_only');
            Response::forbidden("Permission denied: administrator access required");
            return false;
        }
        
        return true;
    }
    
    /**
     * Log access denial for audit purposes
     */
    private static function logAccessDenied(int $userId, string $permission): void {
        try {
            $rbac = RBACService::getInstance();
            $rbac->logRBACAction('access_denied', $userId, [
                'target_type' => 'permission',
                'new_value' => [
                    'permission' => $permission,
                    'path' => $_SERVER['REQUEST_URI'] ?? 'unknown',
                    'method' => $_SERVER['REQUEST_METHOD'] ?? 'unknown'
                ]
            ]);
            
            Logger::warning('Access denied', [
                'user_id' => $userId,
                'permission' => $permission,
                'path' => $_SERVER['REQUEST_URI'] ?? 'unknown',
                'method' => $_SERVER['REQUEST_METHOD'] ?? 'unknown',
                'ip' => $_SERVER['REMOTE_ADDR'] ?? 'unknown'
            ]);
        } catch (Exception $e) {
            Logger::error('Failed to log access denial', [
                'error' => $e->getMessage()
            ]);
        }
    }
    
    /**
     * Helper to check permission and return user ID if authorized
     * Returns user ID if authorized, null if not (and sends appropriate response)
     */
    public static function authorizeAndGetUserId(string $permission): ?int {
        $userId = Auth::userId();
        
        if ($userId === null) {
            Response::unauthorized('Authentication required');
            return null;
        }
        
        $rbac = RBACService::getInstance();
        
        if (!$rbac->hasPermission($userId, $permission)) {
            self::logAccessDenied($userId, $permission);
            Response::forbidden("Permission denied: $permission required");
            return null;
        }
        
        return $userId;
    }
}
