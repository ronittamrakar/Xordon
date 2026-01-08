<?php
/**
 * RBAC Middleware
 * Central authorization enforcement for all routes
 * 
 * Usage:
 *   RBACMiddleware::require('campaigns.view');
 *   RBACMiddleware::requireAny(['campaigns.view', 'campaigns.manage']);
 *   RBACMiddleware::requireRole('admin');
 */

namespace Xordon;

class RBACMiddleware {
    
    /**
     * Permission definitions with required role levels
     * Levels: owner=100, admin=80, manager=60, member=20
     */
    private const PERMISSIONS = [
        // Dashboard
        'dashboard.view' => 20,
        'dashboard.customize' => 60,
        
        // Contacts/CRM
        'contacts.view' => 20,
        'contacts.create' => 20,
        'contacts.edit' => 20,
        'contacts.delete' => 60,
        'contacts.export' => 60,
        'contacts.import' => 60,
        'contacts.bulk_actions' => 60,
        
        // Campaigns
        'campaigns.view' => 20,
        'campaigns.create' => 20,
        'campaigns.edit' => 20,
        'campaigns.delete' => 60,
        'campaigns.send' => 60,
        'campaigns.analytics' => 20,
        
        // Automations
        'automations.view' => 20,
        'automations.create' => 60,
        'automations.edit' => 60,
        'automations.delete' => 80,
        'automations.activate' => 60,
        
        // Helpdesk
        'tickets.view' => 20,
        'tickets.create' => 20,
        'tickets.edit' => 20,
        'tickets.delete' => 60,
        'tickets.assign' => 60,
        'tickets.close' => 20,
        
        // Messages
        'messages.view' => 20,
        'messages.send' => 20,
        'messages.delete' => 60,
        'messages.bulk_send' => 60,
        
        // Invoices & Billing
        'invoices.view' => 20,
        'invoices.create' => 60,
        'invoices.edit' => 60,
        'invoices.delete' => 80,
        'invoices.send' => 60,
        'billing.view' => 80,
        'billing.manage' => 100,
        
        // Analytics
        'analytics.view' => 20,
        'analytics.export' => 60,
        'analytics.advanced' => 60,
        
        // Settings
        'settings.view' => 60,
        'settings.edit' => 80,
        'settings.billing' => 100,
        'settings.integrations' => 80,
        'settings.team' => 80,
        
        // Team/Users
        'users.view' => 60,
        'users.create' => 80,
        'users.edit' => 80,
        'users.delete' => 100,
        'users.change_role' => 100,
        
        // HR Module
        'hr.time.view_own' => 20,
        'hr.time.view_all' => 60,
        'hr.time.approve' => 60,
        'hr.time.manage' => 80,
        'hr.expenses.view_own' => 20,
        'hr.expenses.view_all' => 60,
        'hr.expenses.approve' => 60,
        'hr.payroll.view' => 80,
        'hr.payroll.manage' => 80,
        
        // Ecommerce
        'products.view' => 20,
        'products.create' => 60,
        'products.edit' => 60,
        'products.delete' => 80,
        'orders.view' => 20,
        'orders.edit' => 60,
        'orders.refund' => 80,
        
        // AI Features
        'ai.view' => 20,
        'ai.generate' => 20,
        'ai.settings' => 80,
        'ai.workforce' => 60,
        
        // Social Media
        'social.view' => 20,
        'social.post' => 20,
        'social.schedule' => 20,
        'social.publish' => 60,
        'social.accounts' => 80,
        
        // Forms & Websites
        'forms.view' => 20,
        'forms.create' => 20,
        'forms.edit' => 20,
        'forms.delete' => 60,
        'websites.view' => 20,
        'websites.edit' => 60,
        'websites.publish' => 60,
    ];
    
    private const ROLE_LEVELS = [
        'owner' => 100,
        'admin' => 80,
        'manager' => 60,
        'member' => 20,
        'guest' => 0,
    ];
    
    /**
     * Get current user's role level
     */
    private static function getUserRoleLevel(): int {
        $ctx = $GLOBALS['tenantContext'] ?? null;
        if (!$ctx) {
            return 0; // No context = no access
        }
        
        $role = $ctx->workspaceRole ?? 'member';
        return self::ROLE_LEVELS[$role] ?? 0;
    }
    
    /**
     * Check if user has a specific permission
     */
    public static function hasPermission(string $permission): bool {
        $requiredLevel = self::PERMISSIONS[$permission] ?? 100; // Default to owner-only
        $userLevel = self::getUserRoleLevel();
        
        return $userLevel >= $requiredLevel;
    }
    
    /**
     * Require a permission - stops execution if not authorized
     */
    public static function require(string $permission): void {
        if (!self::hasPermission($permission)) {
            \Response::error("Access denied. Required permission: $permission", 403);
            exit;
        }
    }
    
    /**
     * Require any one of multiple permissions
     */
    public static function requireAny(array $permissions): void {
        foreach ($permissions as $permission) {
            if (self::hasPermission($permission)) {
                return; // User has at least one permission
            }
        }
        
        $permList = implode(', ', $permissions);
        \Response::error("Access denied. Required one of: $permList", 403);
        exit;
    }
    
    /**
     * Require all of multiple permissions
     */
    public static function requireAll(array $permissions): void {
        $missing = [];
        foreach ($permissions as $permission) {
            if (!self::hasPermission($permission)) {
                $missing[] = $permission;
            }
        }
        
        if (count($missing) > 0) {
            $permList = implode(', ', $missing);
            \Response::error("Access denied. Missing permissions: $permList", 403);
            exit;
        }
    }
    
    /**
     * Require a minimum role level
     */
    public static function requireRole(string $minimumRole): void {
        $requiredLevel = self::ROLE_LEVELS[$minimumRole] ?? 100;
        $userLevel = self::getUserRoleLevel();
        
        if ($userLevel < $requiredLevel) {
            \Response::error("Access denied. Required role: $minimumRole or higher", 403);
            exit;
        }
    }
    
    /**
     * Check if user is owner
     */
    public static function isOwner(): bool {
        return self::getUserRoleLevel() >= self::ROLE_LEVELS['owner'];
    }
    
    /**
     * Check if user is admin or owner
     */
    public static function isAdmin(): bool {
        return self::getUserRoleLevel() >= self::ROLE_LEVELS['admin'];
    }
    
    /**
     * Check if user is manager or higher
     */
    public static function isManager(): bool {
        return self::getUserRoleLevel() >= self::ROLE_LEVELS['manager'];
    }
    
    /**
     * Log access attempt for audit trail
     */
    public static function logAccess(string $resource, string $action, bool $allowed): void {
        $ctx = $GLOBALS['tenantContext'] ?? null;
        $userId = $ctx ? $ctx->userId : 0;
        $workspaceId = $ctx ? $ctx->workspaceId : 0;
        $role = $ctx ? $ctx->workspaceRole : 'unknown';
        
        $logEntry = [
            'timestamp' => date('Y-m-d H:i:s'),
            'user_id' => $userId,
            'workspace_id' => $workspaceId,
            'role' => $role,
            'resource' => $resource,
            'action' => $action,
            'allowed' => $allowed,
            'ip' => $_SERVER['REMOTE_ADDR'] ?? 'unknown',
        ];
        
        // Log to audit file (can be extended to database)
        $logFile = __DIR__ . '/../logs/access_audit.log';
        $logLine = json_encode($logEntry) . "\n";
        file_put_contents($logFile, $logLine, FILE_APPEND | LOCK_EX);
    }
}
