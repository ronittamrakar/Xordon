<?php
namespace Xordon;

use Exception;
use PDO;
use PDOException;

class TenantContext {
    public int $userId;
    public int $workspaceId;
    public string $workspaceRole;
    public string $accountType; // 'agency' or 'individual'
    public array $workspace;
    public ?int $activeCompanyId;
    public array $allowedCompanyIds;
    public ?array $activeCompany; // Full company record when loaded

    // Performance: Static cache for allowed companies per request
    private static array $allowedCompaniesCache = [];

    public function __construct(int $userId, array $workspace, array $allowedCompanyIds, ?int $activeCompanyId, ?array $activeCompany = null) {
        $this->userId = $userId;
        $this->workspace = $workspace;
        $this->workspaceId = (int)($workspace['id'] ?? 0);
        $this->workspaceRole = (string)($workspace['role'] ?? 'member');
        $this->accountType = (string)($workspace['account_type'] ?? 'individual');
        $this->allowedCompanyIds = $allowedCompanyIds;
        $this->activeCompanyId = $activeCompanyId;
        $this->activeCompany = $activeCompany;
    }

    /**
     * Check if this is an agency account
     */
    public function isAgency(): bool {
        return $this->accountType === 'agency';
    }

    /**
     * Check if this is an individual/freelancer account
     */
    public function isIndividual(): bool {
        return $this->accountType === 'individual';
    }

    /**
     * Get company scope for SQL queries - returns array with 'sql' and 'params'
     * Use this when you need to filter by the active company
     */
    public function activeCompanyScopeSql(string $column = 'company_id'): array {
        if ($this->activeCompanyId === null) {
            return ['sql' => '1=0', 'params' => []];
        }
        return ['sql' => "$column = ?", 'params' => [$this->activeCompanyId]];
    }

    /**
     * Require an active company - fail if none selected
     */
    public function requireActiveCompany(): int {
        if ($this->activeCompanyId === null) {
            Response::error('No active client/company selected', 400);
        }
        return $this->activeCompanyId;
    }

    private static function getHeader(string $name): ?string {
        if (function_exists('getallheaders')) {
            $headers = getallheaders();
            foreach ($headers as $k => $v) {
                if (strtolower($k) === strtolower($name)) return $v;
            }
        }
        $serverKey = 'HTTP_' . strtoupper(str_replace('-', '_', $name));
        if (!empty($_SERVER[$serverKey])) return $_SERVER[$serverKey];
        return null;
    }

    public static function resolveOrFail(): self {
        // Developer mode bypass: requires BOTH non-production env AND explicit bypass flag
        // SECURITY: This prevents accidental bypasses if APP_ENV is misconfigured
        $appEnv = \Config::get('APP_ENV', 'production'); // Default to production for safety
        $allowDevBypass = getenv('ALLOW_DEV_BYPASS') === 'true';
        $isDev = ($appEnv !== 'production') && $allowDevBypass;

        if ($isDev) {
            $userId = Auth::userId();
            
            // If no user from token, try to find the default admin user (same as Auth::userIdOrFail)
            if ($userId === null) {
                try {
                    $pdo = Database::conn();
                    $stmt = $pdo->query("
                        SELECT u.id 
                        FROM users u
                        INNER JOIN roles r ON u.role_id = r.id
                        WHERE LOWER(r.name) = 'admin'
                        ORDER BY u.id ASC
                        LIMIT 1
                    ");
                    $adminUser = $stmt->fetch(PDO::FETCH_ASSOC);
                    if ($adminUser) {
                        $userId = (int)$adminUser['id'];
                    } else {
                        $userId = 1; // Fallback if no admin found
                    }
                } catch (Exception $e) {
                    $userId = 1;
                }
            }
            
            $workspace = Auth::resolveWorkspace($userId, null);
            if (!$workspace || !isset($workspace['id'])) {
                // SECURITY: Only fabricate workspace in explicit dev mode, and log warning
                error_log("SECURITY_WARNING: TenantContext fabricating workspace for user $userId in dev mode - this should NEVER happen in production");
                $workspace = [
                    'id' => 1,
                    'role' => 'owner',
                    'account_type' => 'agency',
                    'name' => 'Development Workspace',
                    'slug' => 'dev-workspace'
                ];
                // Skip the rest of the workspace resolution and return a minimal context
                return new self($userId, $workspace, [1], 1, null);
            }
        } else {
            $userId = Auth::userIdOrFail();
            $workspace = Auth::resolveWorkspace($userId, null);
            if (!$workspace || !isset($workspace['id'])) {
                Response::error('No workspace access. Ensure the request includes the X-Workspace-Id header or authenticate as a user with workspace membership.', 403);
            }
        }

        $workspaceId = (int)$workspace['id'];
        $workspaceRole = $workspace['role'] ?? 'member';
        
        $pdo = Database::conn();
        
        // Performance: Check cache first to avoid repeated DB queries
        $cacheKey = "{$userId}:{$workspaceId}:{$workspaceRole}";
        if (isset(self::$allowedCompaniesCache[$cacheKey])) {
            $allowedCompanyIds = self::$allowedCompaniesCache[$cacheKey];
        } else {
            $allowedCompanyIds = [];
            
            try {
                // Workspace owners and admins can access all companies in the workspace
                if ($workspaceRole === 'owner' || $workspaceRole === 'admin') {
                    $stmt = $pdo->prepare('SELECT id FROM companies WHERE workspace_id = ?');
                    $stmt->execute([$workspaceId]);
                    $allowedCompanyIds = array_map('intval', array_column($stmt->fetchAll(\PDO::FETCH_ASSOC), 'id'));
                } else {
                    // Performance: Removed SHOW TABLES check - assume table exists (multitenancy is implemented)
                    // Query user_company_access directly, handle missing table gracefully
                    try {
                        $stmt = $pdo->prepare('SELECT company_id FROM user_company_access WHERE workspace_id = ? AND user_id = ?');
                        $stmt->execute([$workspaceId, $userId]);
                        $allowedCompanyIds = array_map('intval', array_column($stmt->fetchAll(\PDO::FETCH_ASSOC), 'company_id'));
                    } catch (\PDOException $e) {
                        // Table doesn't exist - fall through to legacy check
                    }
                }
                
                // Fallback: if no companies found via access table, check legacy ownership
                if (empty($allowedCompanyIds)) {
                    $stmt = $pdo->prepare('SELECT id FROM companies WHERE workspace_id = ? AND user_id = ?');
                    $stmt->execute([$workspaceId, $userId]);
                    $allowedCompanyIds = array_map('intval', array_column($stmt->fetchAll(PDO::FETCH_ASSOC), 'id'));
                }
                
                // DEV MODE: Auto-create a company if none exist to unblock development
                // SECURITY: Only runs when ALLOW_DEV_BYPASS=true is explicitly set
                if ($isDev && empty($allowedCompanyIds)) {
                    try {
                        error_log("SECURITY_WARNING: Auto-creating dev company for workspace {$workspaceId} - ensure ALLOW_DEV_BYPASS is disabled in production");
                        $stmt = $pdo->prepare('INSERT INTO companies (workspace_id, user_id, name, status, is_client, created_at) VALUES (?, ?, ?, ?, 0, NOW())');
                        $stmt->execute([$workspaceId, $userId, 'Development Company', 'active']);
                        $newCompanyId = (int)$pdo->lastInsertId();
                        $allowedCompanyIds = [$newCompanyId];
                        error_log("TenantContext: Auto-created development company ID {$newCompanyId} for workspace {$workspaceId}");
                    } catch (Exception $devEx) {
                        error_log('TenantContext: Failed to auto-create dev company: ' . $devEx->getMessage());
                    }
                }
            } catch (Exception $e) {
                error_log('TenantContext: Failed to resolve allowed companies: ' . $e->getMessage());
                $allowedCompanyIds = [];
            }
            
            // Cache for this request
            self::$allowedCompaniesCache[$cacheKey] = $allowedCompanyIds;
        }

        $activeCompanyId = null;

        $headerCompany = self::getHeader('X-Company-Id');
        if ($headerCompany && ctype_digit($headerCompany)) {
            $candidate = (int)$headerCompany;
            if (in_array($candidate, $allowedCompanyIds, true)) {
                $activeCompanyId = $candidate;
            } else {
                // Log suspected tenant leak attempt
                error_log(sprintf(
                    'TENANT_LEAK_ATTEMPT: user_id=%d workspace_id=%d requested_company_id=%d allowed_companies=%s',
                    $userId,
                    $workspaceId,
                    $candidate,
                    implode(',', $allowedCompanyIds)
                ));
                Response::error('Company access denied', 403);
            }
        }

        // Legacy header fallback
        $legacyClient = self::getHeader('X-Client-Id');
        if ($activeCompanyId === null && $legacyClient && ctype_digit($legacyClient)) {
            $candidate = (int)$legacyClient;
            if (in_array($candidate, $allowedCompanyIds, true)) {
                $activeCompanyId = $candidate;
            }
        }

        // If no active company specified, choose the first allowed (if any)
        if ($activeCompanyId === null && count($allowedCompanyIds) > 0) {
            $activeCompanyId = (int)$allowedCompanyIds[0];
        }

        // Load active company details if we have one
        $activeCompany = null;
        if ($activeCompanyId !== null) {
            try {
                $stmt = $pdo->prepare('SELECT * FROM companies WHERE id = ? AND workspace_id = ?');
                $stmt->execute([$activeCompanyId, $workspaceId]);
                $activeCompany = $stmt->fetch(PDO::FETCH_ASSOC) ?: null;
            } catch (Exception $e) {
                error_log('TenantContext: Failed to load active company: ' . $e->getMessage());
            }
        }

        return new self($userId, $workspace, $allowedCompanyIds, $activeCompanyId, $activeCompany);
    }

    public function companyScopeSql(string $column = 'company_id'): array {
        if (count($this->allowedCompanyIds) === 0) {
            return ['sql' => '1=0', 'params' => []];
        }
        $placeholders = implode(',', array_fill(0, count($this->allowedCompanyIds), '?'));
        return ['sql' => "$column IN ($placeholders)", 'params' => $this->allowedCompanyIds];
    }
}

// Global alias for compatibility
if (!class_exists('\\TenantContext')) {
    class_alias('\\Xordon\\TenantContext', '\\TenantContext');
}
