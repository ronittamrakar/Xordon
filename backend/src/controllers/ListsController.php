<?php
require_once __DIR__ . '/../Database.php';
require_once __DIR__ . '/../Response.php';
require_once __DIR__ . '/../Auth.php';
require_once __DIR__ . '/../services/RBACService.php';

class ListsController {
    private static array $columnCache = [];

    private static function tableHasColumn(PDO $pdo, string $table, string $column): bool {
        $cacheKey = $table . ':' . $column;
        if (array_key_exists($cacheKey, self::$columnCache)) {
            return self::$columnCache[$cacheKey];
        }

        try {
            // Use information_schema for reliable column checking with parameters
            $stmt = $pdo->prepare("SELECT count(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = ? AND column_name = ?");
            $stmt->execute([$table, $column]);
            $exists = (bool)$stmt->fetchColumn();
            self::$columnCache[$cacheKey] = $exists;
            return $exists;
        } catch (Exception $e) {
            self::$columnCache[$cacheKey] = false;
            return false;
        }
    }

    private static function getWorkspaceScope(PDO $pdo): array {
        $ctx = $GLOBALS['tenantContext'] ?? null;
        if ($ctx && isset($ctx->workspaceId) && self::tableHasColumn($pdo, 'contact_lists', 'workspace_id')) {
            return ['col' => 'workspace_id', 'val' => (int)$ctx->workspaceId];
        }
        return ['col' => 'user_id', 'val' => Auth::userIdOrFail()];
    }
    
    /**
     * Convert database row to camelCase format for frontend
     */
    private static function formatList(array $row): array {
        return [
            'id' => (string)$row['id'],
            'userId' => (string)($row['user_id'] ?? null),
            'name' => $row['name'],
            'description' => $row['description'] ?? null,
            'color' => $row['color'] ?? '#3b82f6',
            'icon' => $row['icon'] ?? 'users',
            'isDefault' => (bool)($row['is_default'] ?? false),
            'contactCount' => (int)($row['contact_count'] ?? 0),
            'createdAt' => $row['created_at'] ?? null,
            'updatedAt' => $row['updated_at'] ?? null,
            // Folder structure support
            'parentId' => isset($row['parent_id']) ? (string)$row['parent_id'] : null,
            'isFolder' => (bool)($row['is_folder'] ?? false),
            'campaignType' => $row['campaign_type'] ?? null,
            'folderPath' => $row['folder_path'] ?? null,
            'childCount' => (int)($row['child_count'] ?? 0),
        ];
    }
    
    public static function index(): void {
        try {
            $userId = Auth::userIdOrFail();
            $rbac = RBACService::getInstance();

            if (!$rbac->hasPermission($userId, 'contacts.view')) {
                Response::forbidden('You do not have permission to view lists');
                return;
            }

            $search = get_query('search');
            $pdo = Database::conn();
            $scope = self::getWorkspaceScope($pdo);

            // Build query with workspace scoping (falls back to user_id if workspace_id column missing)
            $whereConditions = ["cl.{$scope['col']} = ?"];
            $params = [$scope['val']];

            if ($search) {
                $whereConditions[] = '(cl.name LIKE ? OR cl.description LIKE ?)';
                $searchParam = "%$search%";
                $params[] = $searchParam;
                $params[] = $searchParam;
            }

            $whereClause = implode(' AND ', $whereConditions);

            // Fetch lists with contact count and child count
            $stmt = $pdo->prepare("
                SELECT cl.*, 
                       (SELECT COUNT(*) FROM contact_list_members clm WHERE clm.list_id = cl.id) as contact_count,
                       (SELECT COUNT(*) FROM contact_lists cl2 WHERE cl2.parent_id = cl.id) as child_count
                FROM contact_lists cl 
                WHERE $whereClause 
                ORDER BY cl.is_default DESC, cl.name ASC
            ");
            $stmt->execute($params);
            $rows = $stmt->fetchAll();

            $formattedLists = array_map([self::class, 'formatList'], $rows);

            Response::json(['lists' => $formattedLists]);
        } catch (Exception $e) {
            Response::error('Failed to fetch lists: ' . $e->getMessage(), 500);
        }
    }
    
    public static function show(string $id): void {
        $userId = Auth::userIdOrFail();
        $pdo = Database::conn();

        $scope = self::getWorkspaceScope($pdo);
        $stmt = $pdo->prepare("
            SELECT cl.*, 
                   (SELECT COUNT(*) FROM contact_list_members clm WHERE clm.list_id = cl.id) as contact_count
            FROM contact_lists cl 
            WHERE cl.id = ? AND cl.{$scope['col']} = ?
        ");
        $stmt->execute([$id, $scope['val']]);
        $list = $stmt->fetch();
        
        if (!$list) {
            Response::json(['error' => 'List not found'], 404);
            return;
        }
        
        Response::json(self::formatList($list));
    }
    
    public static function create(): void {
        $userId = Auth::userIdOrFail();
        $rbac = RBACService::getInstance();
        
        if (!$rbac->hasPermission($userId, 'contacts.create')) {
            Response::forbidden('You do not have permission to create lists');
            return;
        }
        
        $data = get_json_input();
        
        if (empty($data['name'])) {
            Response::json(['error' => 'List name is required'], 400);
            return;
        }
        
        $pdo = Database::conn();
        
        // Ensure columns exist (self-healing schema)
        if (!self::tableHasColumn($pdo, 'contact_lists', 'is_folder')) {
            $pdo->exec("ALTER TABLE contact_lists ADD COLUMN is_folder BOOLEAN DEFAULT FALSE");
        }
        if (!self::tableHasColumn($pdo, 'contact_lists', 'parent_id')) {
            $pdo->exec("ALTER TABLE contact_lists ADD COLUMN parent_id INT NULL, ADD INDEX (parent_id)");
        }
        if (!self::tableHasColumn($pdo, 'contact_lists', 'campaign_type')) {
            $pdo->exec("ALTER TABLE contact_lists ADD COLUMN campaign_type VARCHAR(50) NULL");
        }

        // Check for duplicate name IN THE SAME FOLDER
        $scope = self::getWorkspaceScope($pdo);
        $parentId = !empty($data['parentId']) ? (int)$data['parentId'] : null;
        
        $dupQuery = "SELECT id FROM contact_lists WHERE {$scope['col']} = ? AND name = ?";
        $dupParams = [$scope['val'], $data['name']];
        
        if ($parentId === null) {
            $dupQuery .= " AND parent_id IS NULL";
        } else {
            $dupQuery .= " AND parent_id = ?";
            $dupParams[] = $parentId;
        }
        
        $checkStmt = $pdo->prepare($dupQuery);
        $checkStmt->execute($dupParams);
        if ($checkStmt->fetch()) {
            Response::json(['error' => 'A list or folder with this name already exists in this folder'], 400);
            return;
        }
        
        // Prevent folders inside lists
        if ($parentId !== null) {
            $parentStmt = $pdo->prepare("SELECT is_folder FROM contact_lists WHERE id = ?");
            $parentStmt->execute([$parentId]);
            $parent = $parentStmt->fetch();
            if ($parent && !$parent['is_folder']) {
                Response::json(['error' => 'Folders and lists can only be placed inside other folders, not inside lists'], 400);
                return;
            }
        }

        $ctx = $GLOBALS['tenantContext'] ?? null;
        $workspaceId = ($ctx && isset($ctx->workspaceId)) ? (int)$ctx->workspaceId : null;
        $stmt = $pdo->prepare("
            INSERT INTO contact_lists (user_id, workspace_id, name, description, color, icon, is_default, parent_id, is_folder, campaign_type, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
        ");
        
        $result = $stmt->execute([
            $userId,
            $workspaceId,
            $data['name'],
            $data['description'] ?? null,
            $data['color'] ?? '#3b82f6',
            $data['icon'] ?? (!empty($data['isFolder']) ? 'folder' : 'users'),
            !empty($data['isDefault']) ? 1 : 0,
            $parentId,
            (!empty($data['isFolder']) || !empty($data['is_folder'])) ? 1 : 0,
            (!empty($data['isFolder']) || !empty($data['is_folder'])) ? null : ($data['campaignType'] ?? 'email'),
        ]);
        
        if ($result) {
            $listId = $pdo->lastInsertId();
            
            // If this is set as default, unset other defaults
            if (!empty($data['isDefault'])) {
                $pdo->prepare("UPDATE contact_lists SET is_default = FALSE WHERE user_id = ? AND id != ?")
                    ->execute([$userId, $listId]);
            }
            
            Response::json(['id' => $listId, 'message' => 'List created successfully'], 201);
        } else {
            Response::json(['error' => 'Failed to create list'], 500);
        }
    }
    
    public static function update(string $id): void {
        $userId = Auth::userIdOrFail();
        $rbac = RBACService::getInstance();
        
        if (!$rbac->hasPermission($userId, 'contacts.edit')) {
            Response::forbidden('You do not have permission to edit lists');
            return;
        }
        
        $data = get_json_input();
        $pdo = Database::conn();
        
        // Verify ownership with workspace scoping
        $scope = self::getWorkspaceScope($pdo);
        $checkStmt = $pdo->prepare("SELECT id FROM contact_lists WHERE id = ? AND {$scope['col']} = ?");
        $checkStmt->execute([$id, $scope['val']]);
        if (!$checkStmt->fetch()) {
            Response::json(['error' => 'List not found'], 404);
            return;
        }

        // Prevent folders inside lists
        if (!empty($data['parentId'])) {
            $parentStmt = $pdo->prepare("SELECT is_folder FROM contact_lists WHERE id = ?");
            $parentStmt->execute([$data['parentId']]);
            $parent = $parentStmt->fetch();
            if ($parent && !$parent['is_folder']) {
                Response::json(['error' => 'Folders and lists can only be placed inside other folders, not inside lists'], 400);
                return;
            }
        }
        
        // Check for duplicate name if name is being changed
        if (!empty($data['name'])) {
            $dupStmt = $pdo->prepare("SELECT id FROM contact_lists WHERE {$scope['col']} = ? AND name = ? AND id != ?");
            $dupStmt->execute([$scope['val'], $data['name'], $id]);
            if ($dupStmt->fetch()) {
                Response::json(['error' => 'A list with this name already exists'], 400);
                return;
            }
        }
        
        // Build update query
        $updateFields = [];
        $params = [];
        
        $allowedFields = ['name', 'description', 'color', 'icon', 'is_default', 'parent_id', 'is_folder', 'campaign_type'];
        $fieldMapping = [
            'isDefault' => 'is_default',
            'parentId' => 'parent_id',
            'isFolder' => 'is_folder',
            'campaignType' => 'campaign_type',
        ];
        
        foreach ($data as $key => $value) {
            $dbField = $fieldMapping[$key] ?? $key;
            if (in_array($dbField, $allowedFields)) {
                $updateFields[] = "$dbField = ?";
                if ($dbField === 'parent_id') {
                    $params[] = ($value === 'root' || $value === '' || $value === 0) ? null : $value;
                } elseif ($dbField === 'is_folder' || $dbField === 'is_default') {
                    $params[] = !empty($value) ? 1 : 0;
                } else {
                    $params[] = $value;
                }
            }
        }
        
        if (empty($updateFields)) {
            Response::json(['error' => 'No valid fields to update'], 400);
            return;
        }
        
        $params[] = $id;
        $updateQuery = "UPDATE contact_lists SET " . implode(', ', $updateFields) . ", updated_at = NOW() WHERE id = ?";
        
        $stmt = $pdo->prepare($updateQuery);
        $result = $stmt->execute($params);
        
        if ($result) {
            // If this is set as default, unset other defaults
            if (!empty($data['isDefault'])) {
                $pdo->prepare("UPDATE contact_lists SET is_default = FALSE WHERE user_id = ? AND id != ?")
                    ->execute([$userId, $id]);
            }
            
            Response::json(['message' => 'List updated successfully']);
        } else {
            Response::json(['error' => 'Failed to update list'], 500);
        }
    }
    
    public static function delete(string $id): void {
        $userId = Auth::userIdOrFail();
        $rbac = RBACService::getInstance();
        
        if (!$rbac->hasPermission($userId, 'contacts.delete')) {
            Response::forbidden('You do not have permission to delete lists');
            return;
        }
        
        $pdo = Database::conn();
        
        // Verify ownership and check if default with workspace scoping
        $scope = self::getWorkspaceScope($pdo);
        $checkStmt = $pdo->prepare("SELECT id, is_default FROM contact_lists WHERE id = ? AND {$scope['col']} = ?");
        $checkStmt->execute([$id, $scope['val']]);
        $list = $checkStmt->fetch();
        
        if (!$list) {
            Response::json(['error' => 'List not found'], 404);
            return;
        }
        
        if ($list['is_default']) {
            Response::json(['error' => 'Cannot delete the default list'], 400);
            return;
        }
        
        $stmt = $pdo->prepare("DELETE FROM contact_lists WHERE id = ? AND {$scope['col']} = ?");
        $result = $stmt->execute([$id, $scope['val']]);
        
        if ($result) {
            Response::json(['message' => 'List deleted successfully']);
        } else {
            Response::json(['error' => 'Failed to delete list'], 500);
        }
    }
    
    public static function getContacts(string $id): void {
        Auth::userIdOrFail();
        $pdo = Database::conn();
        
        // Verify ownership with workspace scoping
        $scope = self::getWorkspaceScope($pdo);
        $checkStmt = $pdo->prepare("SELECT id FROM contact_lists WHERE id = ? AND {$scope['col']} = ?");
        $checkStmt->execute([$id, $scope['val']]);
        if (!$checkStmt->fetch()) {
            Response::json(['error' => 'List not found'], 404);
            return;
        }
        
        $page = (int)(get_query('page') ?? 1);
        $limit = (int)(get_query('limit') ?? 50);
        $offset = ($page - 1) * $limit;
        
        // Get total count
        $countStmt = $pdo->prepare("SELECT COUNT(*) as total FROM contact_list_members WHERE list_id = ?");
        $countStmt->execute([$id]);
        $total = $countStmt->fetch()['total'];
        
        $stmt = $pdo->prepare("
            SELECT r.id, r.email, r.first_name, r.last_name, r.phone, r.company, r.title, r.status,
                   clm.added_at, clm.added_by
            FROM contact_list_members clm
            JOIN recipients r ON clm.contact_id = r.id
            WHERE clm.list_id = ?
            ORDER BY clm.added_at DESC
            LIMIT ? OFFSET ?
        ");
        $stmt->execute([$id, $limit, $offset]);
        $contacts = $stmt->fetchAll();
        
        $formattedContacts = array_map(function($row) {
            return [
                'id' => (string)$row['id'],
                'email' => $row['email'],
                'firstName' => $row['first_name'],
                'lastName' => $row['last_name'],
                'name' => trim(($row['first_name'] ?? '') . ' ' . ($row['last_name'] ?? '')),
                'phone' => $row['phone'],
                'company' => $row['company'],
                'title' => $row['title'],
                'status' => $row['status'],
                'addedAt' => $row['added_at'],
                'addedBy' => $row['added_by']
            ];
        }, $contacts);
        
        Response::json([
            'contacts' => $formattedContacts,
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
    
    public static function addContacts(string $id): void {
        $userId = Auth::userIdOrFail();
        $data = get_json_input();
        $pdo = Database::conn();
        
        if (empty($data['contactIds']) || !is_array($data['contactIds'])) {
            Response::json(['error' => 'Contact IDs are required'], 400);
            return;
        }
        
        // Verify list ownership
        $scope = self::getWorkspaceScope($pdo);
        $checkStmt = $pdo->prepare("SELECT id FROM contact_lists WHERE id = ? AND {$scope['col']} = ?");
        $checkStmt->execute([$id, $scope['val']]);
        if (!$checkStmt->fetch()) {
            Response::json(['error' => 'List not found'], 404);
            return;
        }
        
        $addedCount = 0;
        $addedBy = $data['addedBy'] ?? 'manual';
        $ctx = $GLOBALS['tenantContext'] ?? null;
        
        foreach ($data['contactIds'] as $contactId) {
            // Verify contact ownership with workspace scoping
            $contactScopeCol = self::tableHasColumn($pdo, 'recipients', 'workspace_id') ? 'workspace_id' : 'user_id';
            $contactScopeVal = ($contactScopeCol === 'workspace_id' && $ctx && isset($ctx->workspaceId)) ? (int)$ctx->workspaceId : $userId;
            
            $contactCheck = $pdo->prepare("SELECT id FROM recipients WHERE id = ? AND $contactScopeCol = ?");
            $contactCheck->execute([$contactId, $contactScopeVal]);
            if (!$contactCheck->fetch()) {
                continue;
            }
            
            // Insert (ignore duplicates)
            $insertStmt = $pdo->prepare("
                INSERT IGNORE INTO contact_list_members (contact_id, list_id, added_at, added_by)
                VALUES (?, ?, NOW(), ?)
            ");
            if ($insertStmt->execute([$contactId, $id, $addedBy])) {
                if ($insertStmt->rowCount() > 0) {
                    $addedCount++;
                }
            }
        }
        
        // Update cached count
        self::updateListCount($id, $pdo);
        
        Response::json(['message' => "Added $addedCount contacts to list", 'addedCount' => $addedCount]);
    }
    
    public static function removeContacts(string $id): void {
        Auth::userIdOrFail();
        $data = get_json_input();
        $pdo = Database::conn();
        
        if (empty($data['contactIds']) || !is_array($data['contactIds'])) {
            Response::json(['error' => 'Contact IDs are required'], 400);
            return;
        }
        
        // Verify list ownership
        $scope = self::getWorkspaceScope($pdo);
        $checkStmt = $pdo->prepare("SELECT id FROM contact_lists WHERE id = ? AND {$scope['col']} = ?");
        $checkStmt->execute([$id, $scope['val']]);
        if (!$checkStmt->fetch()) {
            Response::json(['error' => 'List not found'], 404);
            return;
        }
        
        $placeholders = str_repeat('?,', count($data['contactIds']) - 1) . '?';
        $stmt = $pdo->prepare("DELETE FROM contact_list_members WHERE list_id = ? AND contact_id IN ($placeholders)");
        $stmt->execute([$id, ...$data['contactIds']]);
        $removedCount = $stmt->rowCount();
        
        // Update cached count
        self::updateListCount($id, $pdo);
        
        Response::json(['message' => "Removed $removedCount contacts from list", 'removedCount' => $removedCount]);
    }
    
    private static function updateListCount(string $listId, PDO $pdo): void {
        $stmt = $pdo->prepare("
            UPDATE contact_lists 
            SET contact_count = (SELECT COUNT(*) FROM contact_list_members WHERE list_id = ?)
            WHERE id = ?
        ");
        $stmt->execute([$listId, $listId]);
    }
    
    public static function bulkAddToList(): void {
        $userId = Auth::userIdOrFail();
        $data = get_json_input();
        $pdo = Database::conn();
        
        if (empty($data['listId']) || empty($data['contactIds'])) {
            Response::json(['error' => 'List ID and contact IDs are required'], 400);
            return;
        }
        
        // Verify list ownership
        $scope = self::getWorkspaceScope($pdo);
        $checkStmt = $pdo->prepare("SELECT id FROM contact_lists WHERE id = ? AND {$scope['col']} = ?");
        $checkStmt->execute([$data['listId'], $scope['val']]);
        if (!$checkStmt->fetch()) {
            Response::json(['error' => 'List not found'], 404);
            return;
        }
        
        $addedCount = 0;
        $ctx = $GLOBALS['tenantContext'] ?? null;
        foreach ($data['contactIds'] as $contactId) {
            // Verify contact ownership with workspace scoping
            $contactScopeCol = self::tableHasColumn($pdo, 'recipients', 'workspace_id') ? 'workspace_id' : 'user_id';
            $contactScopeVal = ($contactScopeCol === 'workspace_id' && $ctx && isset($ctx->workspaceId)) ? (int)$ctx->workspaceId : $userId;
            
            $contactCheck = $pdo->prepare("SELECT id FROM recipients WHERE id = ? AND $contactScopeCol = ?");
            $contactCheck->execute([$contactId, $contactScopeVal]);
            if (!$contactCheck->fetch()) {
                continue;
            }

            $insertStmt = $pdo->prepare("
                INSERT IGNORE INTO contact_list_members (contact_id, list_id, added_at, added_by)
                VALUES (?, ?, NOW(), 'manual')
            ");
            if ($insertStmt->execute([$contactId, $data['listId']])) {
                if ($insertStmt->rowCount() > 0) {
                    $addedCount++;
                }
            }
        }
        
        self::updateListCount($data['listId'], $pdo);
        
        Response::json(['message' => "Added $addedCount contacts to list", 'addedCount' => $addedCount]);
    }
}
