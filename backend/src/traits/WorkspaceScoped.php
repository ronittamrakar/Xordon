<?php
/**
 * Trait for workspace-scoped query building
 * Use this in controllers to easily add workspace_id filtering
 * 
 * HIERARCHY ENFORCEMENT:
 * - Workspace (tenant boundary) - REQUIRED for all tenant-owned data
 * - Company/Client (optional sub-scope) - enforced when data is client-specific
 * - Team (grouping only, mode A) - does not restrict data access
 * - Users get access via workspace membership + company access + RBAC
 */
trait WorkspaceScoped {
    
    /**
     * Get the current tenant context from globals
     */
    protected static function getTenantContext(): ?object {
        return $GLOBALS['tenantContext'] ?? null;
    }
    
    /**
     * Get workspace_id for filtering, returns null if not available
     */
    protected static function getWorkspaceId(): ?int {
        $ctx = self::getTenantContext();
        return ($ctx && isset($ctx->workspaceId)) ? (int)$ctx->workspaceId : null;
    }
    
    /**
     * Get user_id from Auth
     */
    protected static function getUserId(): int {
        return Auth::userIdOrFail();
    }
    
    /**
     * STRICT: Require workspace context - returns workspace_id or terminates with 400
     * Use this at the start of tenant-owned endpoints to enforce hierarchy
     */
    protected static function requireWorkspaceContext(): int {
        $ctx = self::getTenantContext();
        if (!$ctx || !isset($ctx->workspaceId)) {
            Response::error('Workspace context required (X-Workspace-Id header missing)', 400);
            exit;
        }
        return (int)$ctx->workspaceId;
    }
    
    /**
     * Require workspace membership - validates user belongs to workspace
     * Call after requireWorkspaceContext() for full enforcement
     */
    protected static function requireWorkspaceMembership(): int {
        $workspaceId = self::requireWorkspaceContext();
        $userId = Auth::userIdOrFail();
        
        $pdo = Database::conn();
        $stmt = $pdo->prepare('SELECT 1 FROM workspace_members WHERE workspace_id = ? AND user_id = ? LIMIT 1');
        $stmt->execute([$workspaceId, $userId]);
        
        if (!$stmt->fetch()) {
            Response::forbidden('You are not a member of this workspace');
            exit;
        }
        
        return $workspaceId;
    }
    
    /**
     * Require company context - returns company_id or terminates with 400
     * Use for company-scoped endpoints
     */
    protected static function requireCompanyContext(): int {
        $ctx = self::getTenantContext();
        if (!$ctx || !isset($ctx->activeCompanyId) || !$ctx->activeCompanyId) {
            Response::error('Company context required (X-Company-Id header missing)', 400);
            exit;
        }
        return (int)$ctx->activeCompanyId;
    }
    
    /**
     * Require company access - validates user has access to the company within workspace
     * Call for company-scoped endpoints after workspace validation
     */
    protected static function requireCompanyAccess(?int $companyId = null): int {
        $workspaceId = self::requireWorkspaceContext();
        $companyId = $companyId ?? self::requireCompanyContext();
        $userId = Auth::userIdOrFail();
        
        $pdo = Database::conn();
        
        // Verify company belongs to workspace
        $stmt = $pdo->prepare('SELECT id FROM companies WHERE id = ? AND workspace_id = ? LIMIT 1');
        $stmt->execute([$companyId, $workspaceId]);
        if (!$stmt->fetch()) {
            Response::error('Company not found in this workspace', 404);
            exit;
        }
        
        // Verify user has access to company
        $stmt = $pdo->prepare('SELECT 1 FROM user_company_access WHERE user_id = ? AND company_id = ? LIMIT 1');
        $stmt->execute([$userId, $companyId]);
        if (!$stmt->fetch()) {
            Response::forbidden('You do not have access to this company');
            exit;
        }
        
        return $companyId;
    }
    
    /**
     * Build WHERE clause for workspace scoping (STRICT - no user_id fallback)
     * Returns ['sql' => 'workspace_id = ?', 'params' => [123]]
     * 
     * @param string $tableAlias Optional table alias (e.g., 'c' for 'c.workspace_id')
     * @param bool $strict If true, requires workspace context (default true)
     */
    protected static function workspaceWhere(string $tableAlias = '', bool $strict = true): array {
        $ctx = self::getTenantContext();
        $prefix = $tableAlias ? "$tableAlias." : '';
        
        if ($ctx && isset($ctx->workspaceId)) {
            return [
                'sql' => "{$prefix}workspace_id = ?",
                'params' => [(int)$ctx->workspaceId]
            ];
        }
        
        if ($strict) {
            // STRICT MODE: require workspace context, no fallback
            Response::error('Workspace context required for this operation', 400);
            exit;
        }
        
        // Legacy fallback to user_id (only if strict=false)
        return [
            'sql' => "{$prefix}user_id = ?",
            'params' => [Auth::userIdOrFail()]
        ];
    }
    
    /**
     * Add workspace scoping to an existing WHERE clause
     * 
     * @param array &$conditions Array of WHERE conditions to append to
     * @param array &$params Array of parameters to append to
     * @param string $tableAlias Optional table alias
     */
    protected static function addWorkspaceScope(array &$conditions, array &$params, string $tableAlias = ''): void {
        $scope = self::workspaceWhere($tableAlias);
        $conditions[] = $scope['sql'];
        $params = array_merge($params, $scope['params']);
    }
    
    /**
     * Get allowed company IDs for the current user
     */
    protected static function getAllowedCompanyIds(): array {
        $ctx = self::getTenantContext();
        return ($ctx && isset($ctx->allowedCompanyIds)) ? $ctx->allowedCompanyIds : [];
    }
    
    /**
     * Get active company ID
     */
    protected static function getActiveCompanyId(): ?int {
        $ctx = self::getTenantContext();
        return ($ctx && isset($ctx->activeCompanyId)) ? $ctx->activeCompanyId : null;
    }
    
    /**
     * Check if user has access to a specific company
     */
    protected static function hasCompanyAccess(int $companyId): bool {
        $allowed = self::getAllowedCompanyIds();
        return in_array($companyId, $allowed, true);
    }
    
    /**
     * Build company scope SQL for IN clause
     * Returns ['sql' => 'company_id IN (?,?)', 'params' => [1,2]] or '1=0' if no access
     */
    protected static function companyScopeSql(string $column = 'company_id'): array {
        $ctx = self::getTenantContext();
        if ($ctx && method_exists($ctx, 'companyScopeSql')) {
            return $ctx->companyScopeSql($column);
        }
        
        $allowed = self::getAllowedCompanyIds();
        if (empty($allowed)) {
            return ['sql' => '1=0', 'params' => []];
        }
        
        $placeholders = implode(',', array_fill(0, count($allowed), '?'));
        return ['sql' => "$column IN ($placeholders)", 'params' => $allowed];
    }
}
