<?php
require_once __DIR__ . '/../Database.php';
require_once __DIR__ . '/../Response.php';
require_once __DIR__ . '/../Auth.php';
require_once __DIR__ . '/../services/RBACService.php';

class CompaniesController {
    
    /**
     * Get workspace scope for queries
     * Returns workspace_id condition if tenantContext exists, otherwise user_id fallback
     */
    private static function getWorkspaceScope(): array {
        $ctx = $GLOBALS['tenantContext'] ?? null;
        if ($ctx && isset($ctx->workspaceId)) {
            return ['col' => 'workspace_id', 'val' => (int)$ctx->workspaceId];
        }
        return ['col' => 'user_id', 'val' => Auth::userIdOrFail()];
    }
    
    /**
     * Get current workspace ID or null
     */
    private static function getWorkspaceId(): ?int {
        $ctx = $GLOBALS['tenantContext'] ?? null;
        return ($ctx && isset($ctx->workspaceId)) ? (int)$ctx->workspaceId : null;
    }
    
    /**
     * Convert database row to camelCase format for frontend
     */
    private static function formatCompany(array $row): array {
        return [
            'id' => (string)$row['id'],
            'userId' => (string)($row['user_id'] ?? null),
            'name' => $row['name'],
            'domain' => $row['domain'] ?? null,
            'industry' => $row['industry'] ?? null,
            'size' => $row['size'] ?? null,
            'annualRevenue' => $row['annual_revenue'] ?? null,
            'phone' => $row['phone'] ?? null,
            'email' => $row['email'] ?? null,
            'website' => $row['website'] ?? null,
            'address' => $row['address'] ?? null,
            'city' => $row['city'] ?? null,
            'state' => $row['state'] ?? null,
            'country' => $row['country'] ?? null,
            'postalCode' => $row['postal_code'] ?? null,
            'linkedin' => $row['linkedin'] ?? null,
            'twitter' => $row['twitter'] ?? null,
            'description' => $row['description'] ?? null,
            'logoUrl' => $row['logo_url'] ?? null,
            'status' => $row['status'] ?? 'active',
            'contactCount' => (int)($row['contact_count'] ?? 0),
            'tags' => $row['tags'] ?? [],
            'createdAt' => $row['created_at'] ?? null,
            'updatedAt' => $row['updated_at'] ?? null,
        ];
    }
    
    public static function index(): void {
        $userId = Auth::userIdOrFail();
        $ctx = $GLOBALS['tenantContext'] ?? null;
        $rbac = RBACService::getInstance();
        
        // Check permission
        if (!$rbac->hasPermission($userId, 'contacts.view')) {
            Response::forbidden('You do not have permission to view companies');
            return;
        }
        
        $search = get_query('search');
        $status = get_query('status');
        $industry = get_query('industry');
        $page = (int)(get_query('page') ?? 1);
        $limit = (int)(get_query('limit') ?? 50);
        $offset = ($page - 1) * $limit;
        
        $pdo = Database::conn();
        
        // Build query
        $whereConditions = [];
        $params = [];
        if ($ctx && isset($ctx->workspaceId)) {
            $whereConditions[] = 'c.workspace_id = ?';
            $params[] = (int)$ctx->workspaceId;
        } else {
            $whereConditions[] = 'c.user_id = ?';
            $params[] = $userId;
        }
        
        // Apply search filter
        if (!empty($search)) {
            $whereConditions[] = '(c.name LIKE ? OR c.domain LIKE ? OR c.industry LIKE ?)';
            $params[] = "%$search%";
            $params[] = "%$search%";
            $params[] = "%$search%";
        }

        // Enforce allowed companies if available
        if ($ctx && isset($ctx->allowedCompanyIds) && is_array($ctx->allowedCompanyIds) && count($ctx->allowedCompanyIds) > 0) {
            $scope = $ctx->companyScopeSql('c.id');
            $whereConditions[] = $scope['sql'];
            $params = array_merge($params, $scope['params']);
        }
        
        if ($status) {
            $whereConditions[] = 'c.status = ?';
            $params[] = $status;
        }
        
        if ($industry) {
            $whereConditions[] = 'c.industry = ?';
            $params[] = $industry;
        }
        
        $whereClause = implode(' AND ', $whereConditions);
        
        // Get total count
        $countStmt = $pdo->prepare("SELECT COUNT(*) as total FROM companies c WHERE $whereClause");
        $countStmt->execute($params);
        $total = $countStmt->fetch()['total'];
        
        // Performance: Use LEFT JOIN with grouped counts instead of correlated subquery per row
        $stmt = $pdo->prepare("
            SELECT c.*, COALESCE(rc.cnt, 0) as contact_count
            FROM companies c 
            LEFT JOIN (
                SELECT company_id, COUNT(*) as cnt 
                FROM recipients 
                GROUP BY company_id
            ) rc ON rc.company_id = c.id
            WHERE $whereClause 
            ORDER BY c.name ASC
            LIMIT ? OFFSET ?
        ");
        $stmt->execute([...$params, $limit, $offset]);
        $rows = $stmt->fetchAll();
        
        // Fetch tags for all companies
        if (!empty($rows)) {
            $companyIds = array_column($rows, 'id');
            $placeholders = str_repeat('?,', count($companyIds) - 1) . '?';
            $tagStmt = $pdo->prepare("
                SELECT ct.company_id, t.id, t.name, t.color 
                FROM company_tags ct 
                JOIN tags t ON ct.tag_id = t.id 
                WHERE ct.company_id IN ($placeholders)
                ORDER BY t.name
            ");
            $tagStmt->execute($companyIds);
            $tagRows = $tagStmt->fetchAll();
            
            // Group tags by company_id
            $tagsByCompany = [];
            foreach ($tagRows as $tagRow) {
                $companyId = $tagRow['company_id'];
                if (!isset($tagsByCompany[$companyId])) {
                    $tagsByCompany[$companyId] = [];
                }
                $tagsByCompany[$companyId][] = [
                    'id' => $tagRow['id'],
                    'name' => $tagRow['name'],
                    'color' => $tagRow['color']
                ];
            }
            
            // Format companies
            $formattedCompanies = [];
            foreach ($rows as $row) {
                $row['tags'] = $tagsByCompany[$row['id']] ?? [];
                $formattedCompanies[] = self::formatCompany($row);
            }
        } else {
            $formattedCompanies = [];
        }
        
        Response::json([
            'companies' => $formattedCompanies,
            'pagination' => [
                'total' => (int)$total,
                'page' => $page,
                'limit' => $limit,
                'totalPages' => ceil($total / $limit),
                'hasNext' => $page * $limit < $total,
                'hasPrev' => $page > 1
            ]
        ]);
    }
    
    public static function show(string $id): void {
        $userId = Auth::userIdOrFail();
        $pdo = Database::conn();
        $scope = self::getWorkspaceScope();
        
        // Performance: Use LEFT JOIN instead of correlated subquery
        $stmt = $pdo->prepare("
            SELECT c.*, COALESCE(rc.cnt, 0) as contact_count
            FROM companies c 
            LEFT JOIN (
                SELECT company_id, COUNT(*) as cnt 
                FROM recipients 
                WHERE company_id = ?
                GROUP BY company_id
            ) rc ON rc.company_id = c.id
            WHERE c.id = ? AND c.{$scope['col']} = ?
        ");
        $stmt->execute([$id, $id, $scope['val']]);
        $company = $stmt->fetch();
        
        if (!$company) {
            Response::json(['error' => 'Company not found'], 404);
            return;
        }
        
        // Fetch tags
        $tagStmt = $pdo->prepare("
            SELECT t.id, t.name, t.color 
            FROM company_tags ct 
            JOIN tags t ON ct.tag_id = t.id 
            WHERE ct.company_id = ?
            ORDER BY t.name
        ");
        $tagStmt->execute([$id]);
        $company['tags'] = $tagStmt->fetchAll();
        
        Response::json(self::formatCompany($company));
    }
    
    public static function create(): void {
        $userId = Auth::userIdOrFail();
        $rbac = RBACService::getInstance();
        
        if (!$rbac->hasPermission($userId, 'contacts.create')) {
            Response::forbidden('You do not have permission to create companies');
            return;
        }
        
        $data = get_json_input();
        
        if (empty($data['name'])) {
            Response::json(['error' => 'Company name is required'], 400);
            return;
        }
        
        $pdo = Database::conn();
        $workspaceId = self::getWorkspaceId();
        
        $stmt = $pdo->prepare("
            INSERT INTO companies (
                user_id, workspace_id, name, domain, industry, size, annual_revenue,
                phone, email, website, address, city, state, country, postal_code,
                linkedin, twitter, description, logo_url, status, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
        ");
        
        $result = $stmt->execute([
            $userId,
            $workspaceId,
            $data['name'],
            $data['domain'] ?? null,
            $data['industry'] ?? null,
            $data['size'] ?? null,
            $data['annualRevenue'] ?? null,
            $data['phone'] ?? null,
            $data['email'] ?? null,
            $data['website'] ?? null,
            $data['address'] ?? null,
            $data['city'] ?? null,
            $data['state'] ?? null,
            $data['country'] ?? null,
            $data['postalCode'] ?? null,
            $data['linkedin'] ?? null,
            $data['twitter'] ?? null,
            $data['description'] ?? null,
            $data['logoUrl'] ?? null,
            $data['status'] ?? 'active'
        ]);
        
        if ($result) {
            $companyId = $pdo->lastInsertId();
            
            // Handle tags if provided
            if (!empty($data['tags']) && is_array($data['tags'])) {
                self::syncCompanyTags($companyId, $data['tags'], $pdo);
            }
            
            Response::json(['id' => $companyId, 'message' => 'Company created successfully'], 201);
        } else {
            Response::json(['error' => 'Failed to create company'], 500);
        }
    }
    
    public static function update(string $id): void {
        $userId = Auth::userIdOrFail();
        $rbac = RBACService::getInstance();
        
        if (!$rbac->hasPermission($userId, 'contacts.edit')) {
            Response::forbidden('You do not have permission to edit companies');
            return;
        }
        
        $data = get_json_input();
        $pdo = Database::conn();
        $scope = self::getWorkspaceScope();
        
        // Verify access within workspace
        $checkStmt = $pdo->prepare("SELECT id FROM companies WHERE id = ? AND {$scope['col']} = ?");
        $checkStmt->execute([$id, $scope['val']]);
        if (!$checkStmt->fetch()) {
            Response::json(['error' => 'Company not found'], 404);
            return;
        }
        
        // Build update query
        $updateFields = [];
        $params = [];
        
        $fieldMapping = [
            'name' => 'name',
            'domain' => 'domain',
            'industry' => 'industry',
            'size' => 'size',
            'annualRevenue' => 'annual_revenue',
            'phone' => 'phone',
            'email' => 'email',
            'website' => 'website',
            'address' => 'address',
            'city' => 'city',
            'state' => 'state',
            'country' => 'country',
            'postalCode' => 'postal_code',
            'linkedin' => 'linkedin',
            'twitter' => 'twitter',
            'description' => 'description',
            'logoUrl' => 'logo_url',
            'status' => 'status'
        ];
        
        foreach ($data as $key => $value) {
            if (isset($fieldMapping[$key])) {
                $updateFields[] = $fieldMapping[$key] . " = ?";
                $params[] = $value;
            }
        }
        
        if (empty($updateFields)) {
            Response::json(['error' => 'No valid fields to update'], 400);
            return;
        }
        
        $params[] = $id;
        $updateQuery = "UPDATE companies SET " . implode(', ', $updateFields) . ", updated_at = NOW() WHERE id = ?";
        
        $stmt = $pdo->prepare($updateQuery);
        $result = $stmt->execute($params);
        
        if ($result) {
            // Handle tags if provided
            if (isset($data['tags']) && is_array($data['tags'])) {
                self::syncCompanyTags($id, $data['tags'], $pdo);
            }
            
            Response::json(['message' => 'Company updated successfully']);
        } else {
            Response::json(['error' => 'Failed to update company'], 500);
        }
    }
    
    public static function delete(string $id): void {
        $userId = Auth::userIdOrFail();
        $rbac = RBACService::getInstance();
        
        if (!$rbac->hasPermission($userId, 'contacts.delete')) {
            Response::forbidden('You do not have permission to delete companies');
            return;
        }
        
        $pdo = Database::conn();
        $scope = self::getWorkspaceScope();
        
        // Verify access within workspace
        $checkStmt = $pdo->prepare("SELECT id FROM companies WHERE id = ? AND {$scope['col']} = ?");
        $checkStmt->execute([$id, $scope['val']]);
        if (!$checkStmt->fetch()) {
            Response::json(['error' => 'Company not found'], 404);
            return;
        }
        
        $stmt = $pdo->prepare("DELETE FROM companies WHERE id = ? AND {$scope['col']} = ?");
        $result = $stmt->execute([$id, $scope['val']]);
        
        if ($result) {
            Response::json(['message' => 'Company deleted successfully']);
        } else {
            Response::json(['error' => 'Failed to delete company'], 500);
        }
    }
    
    public static function getContacts(string $id): void {
        $userId = Auth::userIdOrFail();
        $pdo = Database::conn();
        $scope = self::getWorkspaceScope();
        
        // Verify access within workspace
        $checkStmt = $pdo->prepare("SELECT id FROM companies WHERE id = ? AND {$scope['col']} = ?");
        $checkStmt->execute([$id, $scope['val']]);
        if (!$checkStmt->fetch()) {
            Response::json(['error' => 'Company not found'], 404);
            return;
        }
        
        $stmt = $pdo->prepare("
            SELECT r.id, r.email, r.first_name, r.last_name, r.phone, r.title, r.status
            FROM recipients r
            WHERE r.company_id = ? AND r.{$scope['col']} = ?
            ORDER BY r.first_name, r.last_name
        ");
        $stmt->execute([$id, $scope['val']]);
        $contacts = $stmt->fetchAll();
        
        $formattedContacts = array_map(function($row) {
            return [
                'id' => (string)$row['id'],
                'email' => $row['email'],
                'firstName' => $row['first_name'],
                'lastName' => $row['last_name'],
                'phone' => $row['phone'],
                'title' => $row['title'],
                'status' => $row['status']
            ];
        }, $contacts);
        
        Response::json(['contacts' => $formattedContacts]);
    }
    
    public static function addContact(string $id): void {
        $userId = Auth::userIdOrFail();
        $data = get_json_input();
        $pdo = Database::conn();
        $scope = self::getWorkspaceScope();
        
        if (empty($data['contactId'])) {
            Response::json(['error' => 'Contact ID is required'], 400);
            return;
        }
        
        // Verify company access within workspace
        $checkStmt = $pdo->prepare("SELECT id FROM companies WHERE id = ? AND {$scope['col']} = ?");
        $checkStmt->execute([$id, $scope['val']]);
        if (!$checkStmt->fetch()) {
            Response::json(['error' => 'Company not found'], 404);
            return;
        }
        
        // Update contact's company_id (contact must also be in same workspace)
        $stmt = $pdo->prepare("UPDATE recipients SET company_id = ? WHERE id = ? AND {$scope['col']} = ?");
        $result = $stmt->execute([$id, $data['contactId'], $scope['val']]);
        
        if ($result) {
            Response::json(['message' => 'Contact added to company']);
        } else {
            Response::json(['error' => 'Failed to add contact to company'], 500);
        }
    }
    
    public static function removeContact(string $id): void {
        $userId = Auth::userIdOrFail();
        $data = get_json_input();
        $pdo = Database::conn();
        $scope = self::getWorkspaceScope();
        
        if (empty($data['contactId'])) {
            Response::json(['error' => 'Contact ID is required'], 400);
            return;
        }
        
        // Verify company access within workspace
        $checkStmt = $pdo->prepare("SELECT id FROM companies WHERE id = ? AND {$scope['col']} = ?");
        $checkStmt->execute([$id, $scope['val']]);
        if (!$checkStmt->fetch()) {
            Response::json(['error' => 'Company not found'], 404);
            return;
        }
        
        // Remove contact from company (contact must also be in same workspace)
        $stmt = $pdo->prepare("UPDATE recipients SET company_id = NULL WHERE id = ? AND company_id = ? AND {$scope['col']} = ?");
        $result = $stmt->execute([$data['contactId'], $id, $scope['val']]);
        
        if ($result) {
            Response::json(['message' => 'Contact removed from company']);
        } else {
            Response::json(['error' => 'Failed to remove contact from company'], 500);
        }
    }
    
    private static function syncCompanyTags(string $companyId, array $tags, PDO $pdo): void {
        // Remove existing tags
        $deleteStmt = $pdo->prepare("DELETE FROM company_tags WHERE company_id = ?");
        $deleteStmt->execute([$companyId]);
        
        // Add new tags
        foreach ($tags as $tag) {
            $tagId = null;
            
            if (is_array($tag) && isset($tag['id'])) {
                $tagId = $tag['id'];
            } elseif (is_array($tag) && isset($tag['name'])) {
                // Find or create tag by name
                $findStmt = $pdo->prepare("SELECT id FROM tags WHERE name = ?");
                $findStmt->execute([$tag['name']]);
                $existing = $findStmt->fetch();
                
                if ($existing) {
                    $tagId = $existing['id'];
                } else {
                    $createStmt = $pdo->prepare("INSERT INTO tags (name, color, created_at) VALUES (?, ?, NOW())");
                    $createStmt->execute([$tag['name'], $tag['color'] ?? '#3b82f6']);
                    $tagId = $pdo->lastInsertId();
                }
            }
            
            if ($tagId) {
                $insertStmt = $pdo->prepare("INSERT IGNORE INTO company_tags (company_id, tag_id, created_at) VALUES (?, ?, NOW())");
                $insertStmt->execute([$companyId, $tagId]);
            }
        }
    }
    
    public static function getNotes(string $id): void {
        $userId = Auth::userIdOrFail();
        $pdo = Database::conn();
        $scope = self::getWorkspaceScope();
        
        // Verify access within workspace
        $checkStmt = $pdo->prepare("SELECT id FROM companies WHERE id = ? AND {$scope['col']} = ?");
        $checkStmt->execute([$id, $scope['val']]);
        if (!$checkStmt->fetch()) {
            Response::json(['error' => 'Company not found'], 404);
            return;
        }
        
        $stmt = $pdo->prepare("
            SELECT cn.*, u.name as author_name
            FROM company_notes cn
            JOIN users u ON cn.user_id = u.id
            WHERE cn.company_id = ?
            ORDER BY cn.created_at DESC
        ");
        $stmt->execute([$id]);
        $notes = $stmt->fetchAll();
        
        $formattedNotes = array_map(function($row) {
            return [
                'id' => (string)$row['id'],
                'companyId' => (string)$row['company_id'],
                'userId' => (string)$row['user_id'],
                'authorName' => $row['author_name'],
                'content' => $row['content'],
                'createdAt' => $row['created_at'],
                'updatedAt' => $row['updated_at']
            ];
        }, $notes);
        
        Response::json(['notes' => $formattedNotes]);
    }
    
    public static function addNote(string $id): void {
        $userId = Auth::userIdOrFail();
        $data = get_json_input();
        $pdo = Database::conn();
        $scope = self::getWorkspaceScope();
        
        if (empty($data['content'])) {
            Response::json(['error' => 'Note content is required'], 400);
            return;
        }
        
        // Verify access within workspace
        $checkStmt = $pdo->prepare("SELECT id FROM companies WHERE id = ? AND {$scope['col']} = ?");
        $checkStmt->execute([$id, $scope['val']]);
        if (!$checkStmt->fetch()) {
            Response::json(['error' => 'Company not found'], 404);
            return;
        }
        
        $stmt = $pdo->prepare("INSERT INTO company_notes (company_id, user_id, content, created_at, updated_at) VALUES (?, ?, ?, NOW(), NOW())");
        $result = $stmt->execute([$id, $userId, $data['content']]);
        
        if ($result) {
            Response::json(['id' => $pdo->lastInsertId(), 'message' => 'Note added successfully'], 201);
        } else {
            Response::json(['error' => 'Failed to add note'], 500);
        }
    }
    
    public static function getActivities(string $id): void {
        $userId = Auth::userIdOrFail();
        $pdo = Database::conn();
        $scope = self::getWorkspaceScope();
        
        // Verify access within workspace
        $checkStmt = $pdo->prepare("SELECT id FROM companies WHERE id = ? AND {$scope['col']} = ?");
        $checkStmt->execute([$id, $scope['val']]);
        if (!$checkStmt->fetch()) {
            Response::json(['error' => 'Company not found'], 404);
            return;
        }
        
        $stmt = $pdo->prepare("
            SELECT ca.*, u.name as author_name
            FROM company_activities ca
            JOIN users u ON ca.user_id = u.id
            WHERE ca.company_id = ?
            ORDER BY ca.created_at DESC
            LIMIT 50
        ");
        $stmt->execute([$id]);
        $activities = $stmt->fetchAll();
        
        $formattedActivities = array_map(function($row) {
            return [
                'id' => (string)$row['id'],
                'companyId' => (string)$row['company_id'],
                'userId' => (string)$row['user_id'],
                'authorName' => $row['author_name'],
                'activityType' => $row['activity_type'],
                'title' => $row['title'],
                'description' => $row['description'],
                'metadata' => $row['metadata'] ? json_decode($row['metadata'], true) : null,
                'createdAt' => $row['created_at']
            ];
        }, $activities);
        
        Response::json(['activities' => $formattedActivities]);
    }
    
    /**
     * List companies the current user has access to within their workspace.
     * This is the primary endpoint for populating company selectors in the frontend.
     */
    public static function allowedCompanies(): void {
        // In dev mode, allow graceful fallback
        $appEnv = \Config::get('APP_ENV', 'development');
        $isDev = ($appEnv !== 'production');
        
        $userId = $isDev ? (Auth::userId() ?? 1) : Auth::userIdOrFail();
        $ctx = $GLOBALS['tenantContext'] ?? null;
        $pdo = Database::conn();
        
        if (!$ctx || !isset($ctx->workspaceId)) {
            Response::json(['companies' => [], 'activeCompanyId' => null, 'workspaceId' => '1', 'accountType' => 'individual']);
            return;
        }
        
        $workspaceId = (int)$ctx->workspaceId;
        $allowedIds = $ctx->allowedCompanyIds ?? [];
        
        if (empty($allowedIds)) {
            Response::json(['companies' => [], 'activeCompanyId' => null, 'workspaceId' => (string)$workspaceId, 'accountType' => $ctx->accountType ?? 'individual']);
            return;
        }
        
        $placeholders = implode(',', array_fill(0, count($allowedIds), '?'));
        $stmt = $pdo->prepare("
            SELECT c.id, c.name, c.domain, c.logo_url, c.status, c.is_client,
                   uca.role as user_role
            FROM companies c
            LEFT JOIN user_company_access uca ON uca.company_id = c.id AND uca.user_id = ? AND uca.workspace_id = ?
            WHERE c.id IN ($placeholders) AND c.workspace_id = ?
            ORDER BY c.name ASC
        ");
        $stmt->execute([$userId, $workspaceId, ...$allowedIds, $workspaceId]);
        $rows = $stmt->fetchAll();
        
        $companies = array_map(function($row) {
            return [
                'id' => (string)$row['id'],
                'name' => $row['name'],
                'domain' => $row['domain'],
                'logoUrl' => $row['logo_url'],
                'status' => $row['status'],
                'isClient' => (bool)($row['is_client'] ?? true),
                'userRole' => $row['user_role'] ?? 'member'
            ];
        }, $rows);
        
        Response::json([
            'companies' => $companies,
            'activeCompanyId' => $ctx->activeCompanyId ? (string)$ctx->activeCompanyId : null,
            'activeCompany' => $ctx->activeCompany ? self::formatCompanyBasic($ctx->activeCompany) : null,
            'workspaceId' => (string)$workspaceId,
            'accountType' => $ctx->accountType ?? 'individual'
        ]);
    }

    /**
     * Format company for basic display (used in headers/selectors)
     */
    private static function formatCompanyBasic(array $row): array {
        return [
            'id' => (string)$row['id'],
            'name' => $row['name'],
            'domain' => $row['domain'] ?? null,
            'logoUrl' => $row['logo_url'] ?? null,
            'status' => $row['status'] ?? 'active',
            'isClient' => (bool)($row['is_client'] ?? true),
        ];
    }

    /**
     * Get workspace info including account type
     */
    public static function workspaceInfo(): void {
        $userId = Auth::userIdOrFail();
        $ctx = $GLOBALS['tenantContext'] ?? null;
        $pdo = Database::conn();
        
        if (!$ctx || !isset($ctx->workspaceId)) {
            Response::error('No workspace context', 400);
            return;
        }
        
        $workspaceId = (int)$ctx->workspaceId;
        
        // Get workspace details
        $stmt = $pdo->prepare("SELECT * FROM workspaces WHERE id = ?");
        $stmt->execute([$workspaceId]);
        $workspace = $stmt->fetch();
        
        if (!$workspace) {
            Response::error('Workspace not found', 404);
            return;
        }
        
        // Get company counts
        $countStmt = $pdo->prepare("
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN is_client = 1 THEN 1 ELSE 0 END) as clients,
                SUM(CASE WHEN archived_at IS NOT NULL THEN 1 ELSE 0 END) as archived
            FROM companies WHERE workspace_id = ?
        ");
        $countStmt->execute([$workspaceId]);
        $counts = $countStmt->fetch();
        
        // Get team member count
        $memberStmt = $pdo->prepare("SELECT COUNT(*) as count FROM workspace_members WHERE workspace_id = ?");
        $memberStmt->execute([$workspaceId]);
        $memberCount = $memberStmt->fetch()['count'];
        
        Response::json([
            'workspace' => [
                'id' => (string)$workspace['id'],
                'name' => $workspace['name'],
                'slug' => $workspace['slug'],
                'accountType' => $workspace['account_type'] ?? 'individual',
                'logoUrl' => $workspace['logo_url'] ?? null,
                'primaryColor' => $workspace['primary_color'] ?? '#6366f1',
                'settings' => $workspace['settings'] ? json_decode($workspace['settings'], true) : null,
                'createdAt' => $workspace['created_at'],
            ],
            'stats' => [
                'totalCompanies' => (int)$counts['total'],
                'clientCompanies' => (int)$counts['clients'],
                'archivedCompanies' => (int)$counts['archived'],
                'teamMembers' => (int)$memberCount,
            ],
            'userRole' => $ctx->workspaceRole,
            'activeCompanyId' => $ctx->activeCompanyId ? (string)$ctx->activeCompanyId : null,
        ]);
    }

    /**
     * Update workspace settings (including account type)
     */
    public static function updateWorkspace(): void {
        $userId = Auth::userIdOrFail();
        $ctx = $GLOBALS['tenantContext'] ?? null;
        $pdo = Database::conn();
        
        if (!$ctx || !isset($ctx->workspaceId)) {
            Response::error('No workspace context', 400);
            return;
        }
        
        // Only owners/admins can update workspace
        if (!in_array($ctx->workspaceRole, ['owner', 'admin'])) {
            Response::forbidden('Only workspace owners/admins can update workspace settings');
            return;
        }
        
        $data = get_json_input();
        $workspaceId = (int)$ctx->workspaceId;
        
        $updateFields = [];
        $params = [];
        
        if (isset($data['name'])) {
            $updateFields[] = 'name = ?';
            $params[] = $data['name'];
        }
        
        if (isset($data['accountType']) && in_array($data['accountType'], ['agency', 'individual'])) {
            $updateFields[] = 'account_type = ?';
            $params[] = $data['accountType'];
        }
        
        if (isset($data['logoUrl'])) {
            $updateFields[] = 'logo_url = ?';
            $params[] = $data['logoUrl'];
        }
        
        if (isset($data['primaryColor'])) {
            $updateFields[] = 'primary_color = ?';
            $params[] = $data['primaryColor'];
        }
        
        if (isset($data['settings'])) {
            $updateFields[] = 'settings = ?';
            $params[] = json_encode($data['settings']);
        }
        
        if (empty($updateFields)) {
            Response::json(['message' => 'No changes']);
            return;
        }
        
        $params[] = $workspaceId;
        $sql = "UPDATE workspaces SET " . implode(', ', $updateFields) . ", updated_at = NOW() WHERE id = ?";
        
        $stmt = $pdo->prepare($sql);
        $result = $stmt->execute($params);
        
        if ($result) {
            Response::json(['message' => 'Workspace updated successfully']);
        } else {
            Response::error('Failed to update workspace', 500);
        }
    }

    /**
     * Create a new client company (agency feature)
     */
    public static function createClient(): void {
        $userId = Auth::userIdOrFail();
        $ctx = $GLOBALS['tenantContext'] ?? null;
        $pdo = Database::conn();
        
        if (!$ctx || !isset($ctx->workspaceId)) {
            Response::error('No workspace context', 400);
            return;
        }
        
        $data = get_json_input();
        
        if (empty($data['name'])) {
            Response::error('Client name is required', 400);
            return;
        }
        
        $workspaceId = (int)$ctx->workspaceId;
        
        $stmt = $pdo->prepare("
            INSERT INTO companies (
                user_id, workspace_id, name, domain, industry, 
                phone, email, website, address, city, state, country, postal_code,
                description, logo_url, status, is_client, client_since, 
                monthly_retainer, billing_email, notes, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, TRUE, ?, ?, ?, ?, NOW(), NOW())
        ");
        
        $result = $stmt->execute([
            $userId,
            $workspaceId,
            $data['name'],
            $data['domain'] ?? null,
            $data['industry'] ?? null,
            $data['phone'] ?? null,
            $data['email'] ?? null,
            $data['website'] ?? null,
            $data['address'] ?? null,
            $data['city'] ?? null,
            $data['state'] ?? null,
            $data['country'] ?? null,
            $data['postalCode'] ?? null,
            $data['description'] ?? null,
            $data['logoUrl'] ?? null,
            $data['status'] ?? 'active',
            $data['clientSince'] ?? date('Y-m-d'),
            $data['monthlyRetainer'] ?? null,
            $data['billingEmail'] ?? null,
            $data['notes'] ?? null,
        ]);
        
        if ($result) {
            $companyId = $pdo->lastInsertId();
            
            // Grant creator access
            $accessStmt = $pdo->prepare("
                INSERT INTO user_company_access (workspace_id, user_id, company_id, role, created_at)
                VALUES (?, ?, ?, 'owner', NOW())
            ");
            $accessStmt->execute([$workspaceId, $userId, $companyId]);
            
            Response::json([
                'id' => $companyId,
                'message' => 'Client created successfully'
            ], 201);
        } else {
            Response::error('Failed to create client', 500);
        }
    }

    /**
     * List all clients (agency view)
     */
    public static function listClients(): void {
        $userId = Auth::userIdOrFail();
        $ctx = $GLOBALS['tenantContext'] ?? null;
        $pdo = Database::conn();
        
        if (!$ctx || !isset($ctx->workspaceId)) {
            Response::json(['clients' => []]);
            return;
        }
        
        $workspaceId = (int)$ctx->workspaceId;
        $includeArchived = get_query('includeArchived') === 'true';
        $search = get_query('search');
        
        $whereConditions = ['c.workspace_id = ?', 'c.is_client = TRUE'];
        $params = [$workspaceId];
        
        if (!$includeArchived) {
            $whereConditions[] = 'c.archived_at IS NULL';
        }
        
        if ($search) {
            $whereConditions[] = '(c.name LIKE ? OR c.domain LIKE ? OR c.email LIKE ?)';
            $params[] = "%$search%";
            $params[] = "%$search%";
            $params[] = "%$search%";
        }
        
        $whereClause = implode(' AND ', $whereConditions);
        
        $stmt = $pdo->prepare("
            SELECT c.*,
                   (SELECT COUNT(*) FROM recipients r WHERE r.company_id = c.id) as contact_count,
                   (SELECT COUNT(*) FROM campaigns ca WHERE ca.company_id = c.id) as campaign_count,
                   (SELECT COUNT(*) FROM user_company_access uca WHERE uca.company_id = c.id) as team_member_count
            FROM companies c
            WHERE $whereClause
            ORDER BY c.name ASC
        ");
        $stmt->execute($params);
        $rows = $stmt->fetchAll();
        
        $clients = array_map(function($row) {
            return [
                'id' => (string)$row['id'],
                'name' => $row['name'],
                'domain' => $row['domain'],
                'industry' => $row['industry'],
                'phone' => $row['phone'],
                'email' => $row['email'],
                'website' => $row['website'],
                'logoUrl' => $row['logo_url'],
                'status' => $row['status'],
                'clientSince' => $row['client_since'],
                'monthlyRetainer' => $row['monthly_retainer'] ? (float)$row['monthly_retainer'] : null,
                'billingEmail' => $row['billing_email'],
                'notes' => $row['notes'],
                'archivedAt' => $row['archived_at'],
                'contactCount' => (int)$row['contact_count'],
                'campaignCount' => (int)$row['campaign_count'],
                'teamMemberCount' => (int)$row['team_member_count'],
                'createdAt' => $row['created_at'],
            ];
        }, $rows);
        
        Response::json(['clients' => $clients]);
    }

    /**
     * Archive a client (soft delete)
     */
    public static function archiveClient(string $id): void {
        $userId = Auth::userIdOrFail();
        $ctx = $GLOBALS['tenantContext'] ?? null;
        $pdo = Database::conn();
        
        if (!$ctx || !isset($ctx->workspaceId)) {
            Response::error('No workspace context', 400);
            return;
        }
        
        $workspaceId = (int)$ctx->workspaceId;
        
        $stmt = $pdo->prepare("
            UPDATE companies SET archived_at = NOW(), updated_at = NOW()
            WHERE id = ? AND workspace_id = ? AND is_client = TRUE
        ");
        $result = $stmt->execute([$id, $workspaceId]);
        
        if ($result && $stmt->rowCount() > 0) {
            Response::json(['message' => 'Client archived successfully']);
        } else {
            Response::error('Client not found or already archived', 404);
        }
    }

    /**
     * Restore an archived client
     */
    public static function restoreClient(string $id): void {
        $userId = Auth::userIdOrFail();
        $ctx = $GLOBALS['tenantContext'] ?? null;
        $pdo = Database::conn();
        
        if (!$ctx || !isset($ctx->workspaceId)) {
            Response::error('No workspace context', 400);
            return;
        }
        
        $workspaceId = (int)$ctx->workspaceId;
        
        $stmt = $pdo->prepare("
            UPDATE companies SET archived_at = NULL, updated_at = NOW()
            WHERE id = ? AND workspace_id = ? AND is_client = TRUE
        ");
        $result = $stmt->execute([$id, $workspaceId]);
        
        if ($result && $stmt->rowCount() > 0) {
            Response::json(['message' => 'Client restored successfully']);
        } else {
            Response::error('Client not found', 404);
        }
    }

    /**
     * Grant a team member access to a client
     */
    public static function grantClientAccess(string $companyId): void {
        $userId = Auth::userIdOrFail();
        $ctx = $GLOBALS['tenantContext'] ?? null;
        $pdo = Database::conn();
        
        if (!$ctx || !isset($ctx->workspaceId)) {
            Response::error('No workspace context', 400);
            return;
        }
        
        // Only owners/admins can grant access
        if (!in_array($ctx->workspaceRole, ['owner', 'admin'])) {
            Response::forbidden('Only workspace owners/admins can manage client access');
            return;
        }
        
        $data = get_json_input();
        
        if (empty($data['userId'])) {
            Response::error('User ID is required', 400);
            return;
        }
        
        $workspaceId = (int)$ctx->workspaceId;
        $targetUserId = (int)$data['userId'];
        $role = $data['role'] ?? 'member';
        
        // Verify company exists in workspace
        $checkStmt = $pdo->prepare("SELECT id FROM companies WHERE id = ? AND workspace_id = ?");
        $checkStmt->execute([$companyId, $workspaceId]);
        if (!$checkStmt->fetch()) {
            Response::error('Company not found', 404);
            return;
        }
        
        // Verify user is a workspace member
        $memberStmt = $pdo->prepare("SELECT id FROM workspace_members WHERE workspace_id = ? AND user_id = ?");
        $memberStmt->execute([$workspaceId, $targetUserId]);
        if (!$memberStmt->fetch()) {
            Response::error('User is not a workspace member', 400);
            return;
        }
        
        // Insert or update access
        $stmt = $pdo->prepare("
            INSERT INTO user_company_access (workspace_id, user_id, company_id, role, created_at)
            VALUES (?, ?, ?, ?, NOW())
            ON DUPLICATE KEY UPDATE role = VALUES(role)
        ");
        $result = $stmt->execute([$workspaceId, $targetUserId, $companyId, $role]);
        
        if ($result) {
            Response::json(['message' => 'Access granted successfully']);
        } else {
            Response::error('Failed to grant access', 500);
        }
    }

    /**
     * Revoke a team member's access to a client
     */
    public static function revokeClientAccess(string $companyId): void {
        $userId = Auth::userIdOrFail();
        $ctx = $GLOBALS['tenantContext'] ?? null;
        $pdo = Database::conn();
        
        if (!$ctx || !isset($ctx->workspaceId)) {
            Response::error('No workspace context', 400);
            return;
        }
        
        // Only owners/admins can revoke access
        if (!in_array($ctx->workspaceRole, ['owner', 'admin'])) {
            Response::forbidden('Only workspace owners/admins can manage client access');
            return;
        }
        
        $data = get_json_input();
        
        if (empty($data['userId'])) {
            Response::error('User ID is required', 400);
            return;
        }
        
        $workspaceId = (int)$ctx->workspaceId;
        $targetUserId = (int)$data['userId'];
        
        $stmt = $pdo->prepare("
            DELETE FROM user_company_access 
            WHERE workspace_id = ? AND user_id = ? AND company_id = ?
        ");
        $result = $stmt->execute([$workspaceId, $targetUserId, $companyId]);
        
        if ($result) {
            Response::json(['message' => 'Access revoked successfully']);
        } else {
            Response::error('Failed to revoke access', 500);
        }
    }

    /**
     * Get team members with access to a specific client
     */
    public static function getClientTeam(string $companyId): void {
        $userId = Auth::userIdOrFail();
        $ctx = $GLOBALS['tenantContext'] ?? null;
        $pdo = Database::conn();
        
        if (!$ctx || !isset($ctx->workspaceId)) {
            Response::error('No workspace context', 400);
            return;
        }
        
        $workspaceId = (int)$ctx->workspaceId;
        
        // Verify company exists in workspace
        $checkStmt = $pdo->prepare("SELECT id FROM companies WHERE id = ? AND workspace_id = ?");
        $checkStmt->execute([$companyId, $workspaceId]);
        if (!$checkStmt->fetch()) {
            Response::error('Company not found', 404);
            return;
        }
        
        $stmt = $pdo->prepare("
            SELECT u.id, u.name, u.email, uca.role, uca.created_at as granted_at
            FROM user_company_access uca
            JOIN users u ON u.id = uca.user_id
            WHERE uca.workspace_id = ? AND uca.company_id = ?
            ORDER BY u.name ASC
        ");
        $stmt->execute([$workspaceId, $companyId]);
        $rows = $stmt->fetchAll();
        
        $team = array_map(function($row) {
            return [
                'id' => (string)$row['id'],
                'name' => $row['name'],
                'email' => $row['email'],
                'role' => $row['role'],
                'grantedAt' => $row['granted_at'],
            ];
        }, $rows);
        
        Response::json(['team' => $team]);
    }
}
