<?php
/**
 * Resource Ownership Verification
 * Prevents IDOR (Insecure Direct Object Reference) attacks
 * 
 * Usage:
 *   $contact = OwnershipCheck::verify('contacts', $contactId);
 *   OwnershipCheck::requireOwnership('campaigns', $campaignId);
 */

namespace Xordon;

class OwnershipCheck {
    
    /**
     * Tables and their workspace_id column name
     * Most tables use 'workspace_id', but some may differ
     */
    private const TABLE_WORKSPACE_COLUMN = [
        'contacts' => 'workspace_id',
        'campaigns' => 'workspace_id',
        'email_campaigns' => 'workspace_id',
        'automations' => 'workspace_id',
        'tickets' => 'workspace_id',
        'messages' => 'workspace_id',
        'tasks' => 'workspace_id',
        'appointments' => 'workspace_id',
        'deals' => 'workspace_id',
        'invoices' => 'workspace_id',
        'orders' => 'workspace_id',
        'products' => 'workspace_id',
        'forms' => 'workspace_id',
        'lists' => 'workspace_id',
        'templates' => 'workspace_id',
        'proposals' => 'workspace_id',
        'social_posts' => 'workspace_id',
        'social_accounts' => 'workspace_id',
        'ai_agents' => 'workspace_id',
        'ai_employees' => 'workspace_id',
        'loyalty_programs' => 'workspace_id',
        'financing_plans' => 'workspace_id',
        'financing_applications' => 'workspace_id',
        'blog_posts' => 'workspace_id',
        'kb_articles' => 'workspace_id',
        'staff' => 'workspace_id',
        'companies' => 'workspace_id',
        'projects' => 'workspace_id',
        'notes' => 'workspace_id',
        'canned_responses' => 'workspace_id',
        'pipelines' => 'workspace_id',
        'pipeline_stages' => 'workspace_id',
        'media' => 'workspace_id',
        'folders' => 'workspace_id',
        'tags' => 'workspace_id',
        'custom_fields' => 'workspace_id',
        'webforms' => 'workspace_id',
        'webhooks' => 'workspace_id',
        'integrations' => 'workspace_id',
        'sending_accounts' => 'workspace_id',
        'call_scripts' => 'workspace_id',
        'call_dispositions' => 'workspace_id',
        'bookings' => 'workspace_id',
        'certificates' => 'workspace_id',
        'courses' => 'workspace_id',
        'webinars' => 'workspace_id',
        'reviews' => 'workspace_id',
        'listings' => 'workspace_id',
    ];
    
    /**
     * Get the current workspace ID from tenant context
     */
    private static function getWorkspaceId(): ?int {
        $ctx = $GLOBALS['tenantContext'] ?? null;
        return $ctx ? $ctx->workspaceId : null;
    }
    
    /**
     * Get the workspace column name for a table
     */
    private static function getWorkspaceColumn(string $table): string {
        return self::TABLE_WORKSPACE_COLUMN[$table] ?? 'workspace_id';
    }
    
    /**
     * Verify that a resource belongs to the current workspace
     * Returns the resource if found, null if not
     * 
     * @param string $table Table name
     * @param int|string $id Resource ID
     * @param array $additionalColumns Extra columns to select
     * @return array|null Resource data or null
     */
    public static function verify(string $table, $id, array $additionalColumns = []): ?array {
        $workspaceId = self::getWorkspaceId();
        if ($workspaceId === null) {
            return null;
        }
        
        $workspaceColumn = self::getWorkspaceColumn($table);
        $columns = array_merge(['*'], $additionalColumns);
        $columnStr = implode(',', $columns);
        
        $pdo = \Database::conn();
        
        // Safely build the query with proper escaping for the table name
        $table = preg_replace('/[^a-zA-Z0-9_]/', '', $table); // Sanitize table name
        $sql = "SELECT $columnStr FROM `$table` WHERE id = ? AND `$workspaceColumn` = ?";
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute([$id, $workspaceId]);
        
        $result = $stmt->fetch(\PDO::FETCH_ASSOC);
        return $result ?: null;
    }
    
    /**
     * Require ownership - stops execution if resource doesn't belong to workspace
     * 
     * @param string $table Table name
     * @param int|string $id Resource ID
     * @return array Resource data
     */
    public static function requireOwnership(string $table, $id): array {
        $resource = self::verify($table, $id);
        
        if ($resource === null) {
            \Response::error("Resource not found or access denied", 404);
            exit;
        }
        
        return $resource;
    }
    
    /**
     * Verify ownership of multiple resources
     * Returns only resources that belong to the current workspace
     * 
     * @param string $table Table name
     * @param array $ids Resource IDs
     * @return array Array of valid resource IDs
     */
    public static function verifyMultiple(string $table, array $ids): array {
        if (empty($ids)) {
            return [];
        }
        
        $workspaceId = self::getWorkspaceId();
        if ($workspaceId === null) {
            return [];
        }
        
        $workspaceColumn = self::getWorkspaceColumn($table);
        $table = preg_replace('/[^a-zA-Z0-9_]/', '', $table);
        
        $pdo = \Database::conn();
        $placeholders = implode(',', array_fill(0, count($ids), '?'));
        
        $sql = "SELECT id FROM `$table` WHERE id IN ($placeholders) AND `$workspaceColumn` = ?";
        
        $params = array_merge($ids, [$workspaceId]);
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        
        return array_column($stmt->fetchAll(\PDO::FETCH_ASSOC), 'id');
    }
    
    /**
     * Get a scoped query builder for a table
     * Returns SQL WHERE clause and params that enforce workspace isolation
     * 
     * @param string $table Table name (or alias)
     * @return array ['sql' => 'workspace_id = ?', 'params' => [1]]
     */
    public static function scopeQuery(string $table = ''): array {
        $workspaceId = self::getWorkspaceId();
        if ($workspaceId === null) {
            // No workspace = no results
            return ['sql' => '1 = 0', 'params' => []];
        }
        
        $prefix = $table ? "`$table`." : '';
        return [
            'sql' => "{$prefix}workspace_id = ?",
            'params' => [$workspaceId]
        ];
    }
    
    /**
     * Check if current user can access a resource based on additional criteria
     * 
     * @param string $table Table name
     * @param int|string $id Resource ID
     * @param string $userColumn Column containing user ID (for owner checks)
     * @return bool
     */
    public static function isOwnerOrAdmin(string $table, $id, string $userColumn = 'user_id'): bool {
        $resource = self::verify($table, $id, [$userColumn]);
        if ($resource === null) {
            return false;
        }
        
        $ctx = $GLOBALS['tenantContext'] ?? null;
        if ($ctx === null) {
            return false;
        }
        
        // Admins and owners can access anything in the workspace
        if (in_array($ctx->workspaceRole, ['owner', 'admin'])) {
            return true;
        }
        
        // Regular users can only access their own resources
        return isset($resource[$userColumn]) && $resource[$userColumn] == $ctx->userId;
    }
}
