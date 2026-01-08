<?php
/**
 * Permissions Service
 * Centralized permission checking for workspace roles and module-specific permissions
 * 
 * Architecture:
 * - Growth modules (Social, Listings, Ads) = company-scoped
 * - HR modules (Time Tracking, Expenses, Commissions) = workspace-scoped
 * 
 * Roles:
 * - owner: Full access to everything
 * - admin: Full access except billing/workspace deletion
 * - manager: Can view all + approve in HR; standard access in Growth
 * - member: Self-only in HR; standard access in Growth
 */

require_once __DIR__ . '/Database.php';
require_once __DIR__ . '/Auth.php';
require_once __DIR__ . '/Response.php';

class Permissions {
    // Role hierarchy (higher = more permissions)
    private const ROLE_HIERARCHY = [
        'owner' => 100,
        'admin' => 80,
        'manager' => 60,
        'member' => 20,
    ];

    // Permission definitions
    // Format: 'permission.key' => minimum_role_level
    private const PERMISSION_DEFINITIONS = [
        // HR Time Tracking
        'hr.time.view_own' => 20,        // member+
        'hr.time.create_own' => 20,      // member+
        'hr.time.view_all' => 60,        // manager+
        'hr.time.approve' => 60,         // manager+
        'hr.time.manage_settings' => 80, // admin+
        
        // HR Leave
        'hr.leave.view_own' => 20,
        'hr.leave.create_own' => 20,
        'hr.leave.view_all' => 60,
        'hr.leave.approve' => 60,
        'hr.leave.manage_settings' => 80,
        
        // HR Expenses
        'hr.expenses.view_own' => 20,
        'hr.expenses.create_own' => 20,
        'hr.expenses.view_all' => 60,
        'hr.expenses.approve' => 60,
        'hr.expenses.manage_categories' => 80,
        'hr.expenses.manage_settings' => 80,
        
        // HR Commissions
        'hr.commissions.view_own' => 20,
        'hr.commissions.view_all' => 60,
        'hr.commissions.approve' => 60,
        'hr.commissions.manage_plans' => 80,
        'hr.commissions.manage_settings' => 80,
        
        // HR Scheduling
        'hr.scheduling.view_own' => 20,
        'hr.scheduling.view_all' => 60,
        'hr.scheduling.manage' => 80,

        // HR Payroll
        'hr.payroll.view' => 60,
        'hr.payroll.view_all' => 60,
        'hr.payroll.manage' => 80,
        'hr.payroll.approve' => 80,

        // HR Compensation
        'hr.compensation.view' => 60,
        'hr.compensation.manage' => 80,

        // HR Employees
        'hr.employees.view' => 20,       // member+
        'hr.employees.manage' => 80,     // admin+
        
        // Growth Social
        'growth.social.view' => 20,
        'growth.social.create' => 20,
        'growth.social.publish' => 60,   // manager+ can publish directly
        'growth.social.manage_accounts' => 80,
        'growth.social.manage_settings' => 80,
        
        // Growth Listings/SEO
        'growth.listings.view' => 20,
        'growth.listings.manage' => 60,
        'growth.listings.manage_settings' => 80,
        
        // Growth Ads
        'growth.ads.view' => 20,
        'growth.ads.manage_budgets' => 60,
        'growth.ads.manage_campaigns' => 60,
        'growth.ads.manage_conversions' => 60,
        'growth.ads.manage_accounts' => 80,
        'growth.ads.manage_settings' => 80,
        
        // Settings
        'settings.view' => 60,
        'settings.manage' => 80,
        'settings.billing' => 100,       // owner only
    ];

    /**
     * Get the current user's workspace role
     */
    public static function getWorkspaceRole(): string {
        $ctx = $GLOBALS['tenantContext'] ?? null;
        if ($ctx && isset($ctx->workspaceRole)) {
            return $ctx->workspaceRole;
        }
        return 'member';
    }

    /**
     * Get the current user's role level (numeric)
     */
    public static function getRoleLevel(?string $role = null): int {
        $role = $role ?? self::getWorkspaceRole();
        return self::ROLE_HIERARCHY[$role] ?? 0;
    }

    /**
     * Check if current user is at least a specific role
     */
    public static function isAtLeast(string $minimumRole): bool {
        $currentLevel = self::getRoleLevel();
        $requiredLevel = self::ROLE_HIERARCHY[$minimumRole] ?? 100;
        return $currentLevel >= $requiredLevel;
    }

    /**
     * Check if current user is owner
     */
    public static function isOwner(): bool {
        return self::getWorkspaceRole() === 'owner';
    }

    /**
     * Check if current user is admin or owner
     */
    public static function isAdmin(): bool {
        return self::isAtLeast('admin');
    }

    /**
     * Check if current user is manager or higher
     */
    public static function isManager(): bool {
        return self::isAtLeast('manager');
    }

    /**
     * Check if user has a specific permission
     */
    public static function has(string $permission): bool {
        $requiredLevel = self::PERMISSION_DEFINITIONS[$permission] ?? 100;
        return self::getRoleLevel() >= $requiredLevel;
    }

    /**
     * Check if user has any of the given permissions
     */
    public static function hasAny(array $permissions): bool {
        foreach ($permissions as $p) {
            if (self::has($p)) return true;
        }
        return false;
    }

    /**
     * Require a permission or return 403
     */
    public static function require(string $permission): void {
        if (!self::has($permission)) {
            Response::error('Permission denied: ' . $permission, 403);
        }
    }

    /**
     * Require at least a specific role or return 403
     */
    public static function requireRole(string $minimumRole): void {
        if (!self::isAtLeast($minimumRole)) {
            Response::error('Insufficient role. Required: ' . $minimumRole, 403);
        }
    }

    /**
     * For HR modules: Check if user can access another user's data
     * Returns true if:
     * - Target user is self
     * - Current user is manager/admin/owner
     */
    public static function canAccessUserData(int $targetUserId): bool {
        $currentUserId = Auth::userIdOrFail();
        
        // Self access always allowed
        if ($targetUserId === $currentUserId) {
            return true;
        }
        
        // Manager+ can access others
        return self::isManager();
    }

    /**
     * For HR modules: Enforce user data access or 403
     */
    public static function requireUserDataAccess(int $targetUserId): void {
        if (!self::canAccessUserData($targetUserId)) {
            Response::error('Cannot access other user\'s data', 403);
        }
    }

    /**
     * For HR modules: Filter user_id parameter
     * If user is not manager+, force user_id to be current user
     */
    public static function filterUserIdParam(?int $requestedUserId = null): int {
        $currentUserId = Auth::userIdOrFail();
        
        // If no specific user requested, use current user
        if ($requestedUserId === null) {
            return $currentUserId;
        }
        
        // If manager+, allow requested user
        if (self::isManager()) {
            return $requestedUserId;
        }
        
        // Otherwise, force current user (silently ignore the request)
        return $currentUserId;
    }

    /**
     * For Growth modules: Require active company or 403
     */
    public static function requireActiveCompany(): int {
        $ctx = $GLOBALS['tenantContext'] ?? null;
        if (!$ctx || !$ctx->activeCompanyId) {
            Response::error('Active company required for this operation', 400);
        }
        return $ctx->activeCompanyId;
    }

    /**
     * Get current active company ID (may be null)
     */
    public static function getActiveCompanyId(): ?int {
        $ctx = $GLOBALS['tenantContext'] ?? null;
        return $ctx->activeCompanyId ?? null;
    }

    /**
     * Get current workspace ID
     */
    public static function getWorkspaceId(): int {
        $ctx = $GLOBALS['tenantContext'] ?? null;
        if (!$ctx || !$ctx->workspaceId) {
            Response::error('Workspace context required', 403);
        }
        return $ctx->workspaceId;
    }

    /**
     * Get current user ID
     */
    public static function getUserId(): int {
        return Auth::userIdOrFail();
    }

    /**
     * Get all permissions for current user (for frontend)
     */
    public static function getAllPermissions(): array {
        $currentLevel = self::getRoleLevel();
        $permissions = [];
        
        foreach (self::PERMISSION_DEFINITIONS as $permission => $requiredLevel) {
            $permissions[$permission] = $currentLevel >= $requiredLevel;
        }
        
        return $permissions;
    }

    /**
     * Get role info for current user (for frontend)
     */
    public static function getRoleInfo(): array {
        return [
            'role' => self::getWorkspaceRole(),
            'level' => self::getRoleLevel(),
            'is_owner' => self::isOwner(),
            'is_admin' => self::isAdmin(),
            'is_manager' => self::isManager(),
        ];
    }
}
