<?php
require_once __DIR__ . '/../Database.php';
require_once __DIR__ . '/../Response.php';
require_once __DIR__ . '/../Auth.php';
require_once __DIR__ . '/../services/RBACService.php';

class SegmentsController {
    private static function getWorkspaceScope(): array {
        $ctx = $GLOBALS['tenantContext'] ?? null;
        if ($ctx && isset($ctx->workspaceId)) {
            return ['col' => 'workspace_id', 'val' => (int)$ctx->workspaceId];
        }
        return ['col' => 'user_id', 'val' => Auth::userIdOrFail()];
    }
    
    /**
     * Convert database row to camelCase format for frontend
     */
    private static function formatSegment(array $row): array {
        return [
            'id' => (string)$row['id'],
            'userId' => (string)($row['user_id'] ?? null),
            'name' => $row['name'],
            'description' => $row['description'] ?? null,
            'color' => $row['color'] ?? '#8b5cf6',
            'icon' => $row['icon'] ?? 'filter',
            'filterCriteria' => json_decode($row['filter_criteria'] ?? '[]', true),
            'matchType' => $row['match_type'] ?? 'all',
            'contactCount' => (int)($row['contact_count'] ?? 0),
            'lastCalculatedAt' => $row['last_calculated_at'] ?? null,
            'isActive' => (bool)($row['is_active'] ?? true),
            'createdAt' => $row['created_at'] ?? null,
            'updatedAt' => $row['updated_at'] ?? null,
        ];
    }
    
    public static function index(): void {
        $userId = Auth::userIdOrFail();
        $rbac = RBACService::getInstance();
        
        if (!$rbac->hasPermission($userId, 'contacts.view')) {
            Response::forbidden('You do not have permission to view segments');
            return;
        }
        
        $search = get_query('search');
        $activeOnly = get_query('active') === 'true';
        $pdo = Database::conn();
        
        // Build query with workspace scoping
        $scope = self::getWorkspaceScope();
        $whereConditions = ["s.{$scope['col']} = ?"];
        $params = [$scope['val']];
        
        if ($search) {
            $whereConditions[] = '(s.name LIKE ? OR s.description LIKE ?)';
            $searchParam = "%$search%";
            $params[] = $searchParam;
            $params[] = $searchParam;
        }
        
        if ($activeOnly) {
            $whereConditions[] = 's.is_active = TRUE';
        }
        
        $whereClause = implode(' AND ', $whereConditions);
        
        $stmt = $pdo->prepare("
            SELECT s.* FROM segments s 
            WHERE $whereClause 
            ORDER BY s.name ASC
        ");
        $stmt->execute($params);
        $rows = $stmt->fetchAll();
        
        $formattedSegments = array_map([self::class, 'formatSegment'], $rows);
        
        Response::json(['segments' => $formattedSegments]);
    }
    
    public static function show(string $id): void {
        Auth::userIdOrFail();
        $pdo = Database::conn();
        
        $scope = self::getWorkspaceScope();
        $stmt = $pdo->prepare("SELECT * FROM segments WHERE id = ? AND {$scope['col']} = ?");
        $stmt->execute([$id, $scope['val']]);
        $segment = $stmt->fetch();
        
        if (!$segment) {
            Response::json(['error' => 'Segment not found'], 404);
            return;
        }
        
        Response::json(self::formatSegment($segment));
    }
    
    public static function create(): void {
        $userId = Auth::userIdOrFail();
        $rbac = RBACService::getInstance();
        
        if (!$rbac->hasPermission($userId, 'contacts.create')) {
            Response::forbidden('You do not have permission to create segments');
            return;
        }
        
        $data = get_json_input();
        
        if (empty($data['name'])) {
            Response::json(['error' => 'Segment name is required'], 400);
            return;
        }
        
        if (empty($data['filterCriteria']) || !is_array($data['filterCriteria'])) {
            Response::json(['error' => 'Filter criteria are required'], 400);
            return;
        }
        
        $pdo = Database::conn();
        
        // Check for duplicate name
        $scope = self::getWorkspaceScope();
        $checkStmt = $pdo->prepare("SELECT id FROM segments WHERE {$scope['col']} = ? AND name = ?");
        $checkStmt->execute([$scope['val'], $data['name']]);
        if ($checkStmt->fetch()) {
            Response::json(['error' => 'A segment with this name already exists'], 400);
            return;
        }

        $insertColumns = ['user_id', 'name', 'description', 'color', 'icon', 'filter_criteria', 'match_type', 'is_active', 'created_at', 'updated_at'];
        $insertValues = [
            $userId,
            $data['name'],
            $data['description'] ?? null,
            $data['color'] ?? '#8b5cf6',
            $data['icon'] ?? 'filter',
            json_encode($data['filterCriteria']),
            $data['matchType'] ?? 'all',
            $data['isActive'] ?? true,
            date('Y-m-d H:i:s'),
            date('Y-m-d H:i:s')
        ];

        // Add workspace_id if present in scope
        if ($scope['col'] === 'workspace_id') {
            $insertColumns[] = 'workspace_id';
            $insertValues[] = $scope['val'];
        }

        $colString = implode(', ', $insertColumns);
        $valString = implode(', ', array_fill(0, count($insertValues), '?'));
        
        $stmt = $pdo->prepare("INSERT INTO segments ($colString) VALUES ($valString)");
        
        $result = $stmt->execute($insertValues);
        
        if ($result) {
            $segmentId = $pdo->lastInsertId();
            
            // Calculate initial contact count
            self::recalculateSegmentCount($segmentId, $userId, $pdo);
            
            Response::json(['id' => $segmentId, 'message' => 'Segment created successfully'], 201);
        } else {
            Response::json(['error' => 'Failed to create segment'], 500);
        }
    }
    
    public static function update(string $id): void {
        $userId = Auth::userIdOrFail();
        $rbac = RBACService::getInstance();
        
        if (!$rbac->hasPermission($userId, 'contacts.edit')) {
            Response::forbidden('You do not have permission to edit segments');
            return;
        }
        
        $data = get_json_input();
        $pdo = Database::conn();
        
        // Verify ownership with workspace scoping
        $scope = self::getWorkspaceScope();
        $checkStmt = $pdo->prepare("SELECT id FROM segments WHERE id = ? AND {$scope['col']} = ?");
        $checkStmt->execute([$id, $scope['val']]);
        if (!$checkStmt->fetch()) {
            Response::json(['error' => 'Segment not found'], 404);
            return;
        }
        
        // Check for duplicate name if name is being changed
        if (!empty($data['name'])) {
            $dupStmt = $pdo->prepare("SELECT id FROM segments WHERE {$scope['col']} = ? AND name = ? AND id != ?");
            $dupStmt->execute([$scope['val'], $data['name'], $id]);
            if ($dupStmt->fetch()) {
                Response::json(['error' => 'A segment with this name already exists'], 400);
                return;
            }
        }
        
        // Build update query
        $updateFields = [];
        $params = [];
        
        $fieldMapping = [
            'name' => 'name',
            'description' => 'description',
            'color' => 'color',
            'icon' => 'icon',
            'filterCriteria' => 'filter_criteria',
            'matchType' => 'match_type',
            'isActive' => 'is_active'
        ];
        
        foreach ($data as $key => $value) {
            if (isset($fieldMapping[$key])) {
                $dbField = $fieldMapping[$key];
                $updateFields[] = "$dbField = ?";
                
                if ($key === 'filterCriteria') {
                    $params[] = json_encode($value);
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
        $updateQuery = "UPDATE segments SET " . implode(', ', $updateFields) . ", updated_at = NOW() WHERE id = ?";
        
        $stmt = $pdo->prepare($updateQuery);
        $result = $stmt->execute($params);
        
        if ($result) {
            // Recalculate count if filter criteria changed
            if (isset($data['filterCriteria'])) {
                self::recalculateSegmentCount($id, $userId, $pdo);
            }
            
            Response::json(['message' => 'Segment updated successfully']);
        } else {
            Response::json(['error' => 'Failed to update segment'], 500);
        }
    }
    
    public static function delete(string $id): void {
        Auth::userIdOrFail();
        $rbac = RBACService::getInstance();
        
        if (!$rbac->hasPermission(Auth::userIdOrFail(), 'contacts.delete')) {
            Response::forbidden('You do not have permission to delete segments');
            return;
        }
        
        $pdo = Database::conn();
        $scope = self::getWorkspaceScope();
        
        // Verify ownership with workspace scoping
        $checkStmt = $pdo->prepare("SELECT id FROM segments WHERE id = ? AND {$scope['col']} = ?");
        $checkStmt->execute([$id, $scope['val']]);
        if (!$checkStmt->fetch()) {
            Response::json(['error' => 'Segment not found'], 404);
            return;
        }
        
        $stmt = $pdo->prepare("DELETE FROM segments WHERE id = ? AND {$scope['col']} = ?");
        $result = $stmt->execute([$id, $scope['val']]);
        
        if ($result) {
            Response::json(['message' => 'Segment deleted successfully']);
        } else {
            Response::json(['error' => 'Failed to delete segment'], 500);
        }
    }
    
    public static function getContacts(string $id): void {
        $userId = Auth::userIdOrFail();
        $pdo = Database::conn();
        $scope = self::getWorkspaceScope();
        
        // Get segment with workspace scoping
        $stmt = $pdo->prepare("SELECT * FROM segments WHERE id = ? AND {$scope['col']} = ?");
        $stmt->execute([$id, $scope['val']]);
        $segment = $stmt->fetch();
        
        if (!$segment) {
            Response::json(['error' => 'Segment not found'], 404);
            return;
        }
        
        $filterCriteria = json_decode($segment['filter_criteria'], true);
        $matchType = $segment['match_type'];
        
        $page = (int)(get_query('page') ?? 1);
        $limit = (int)(get_query('limit') ?? 50);
        $offset = ($page - 1) * $limit;
        
        // Build dynamic query based on filter criteria
        $query = self::buildFilterQuery($filterCriteria, $matchType, $userId);
        
        // Get total count
        $countQuery = "SELECT COUNT(*) as total FROM recipients r WHERE r.user_id = ? AND " . $query['where'];
        $countStmt = $pdo->prepare($countQuery);
        $countStmt->execute([$userId, ...$query['params']]);
        $total = $countStmt->fetch()['total'];
        
        // Get contacts
        $selectQuery = "
            SELECT r.id, r.email, r.first_name, r.last_name, r.phone, r.company, r.title, r.status, r.created_at
            FROM recipients r
            WHERE r.user_id = ? AND " . $query['where'] . "
            ORDER BY r.created_at DESC
            LIMIT ? OFFSET ?
        ";
        $selectStmt = $pdo->prepare($selectQuery);
        $selectStmt->execute([$userId, ...$query['params'], $limit, $offset]);
        $contacts = $selectStmt->fetchAll();
        
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
                'createdAt' => $row['created_at']
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
    
    public static function recalculate(string $id): void {
        $userId = Auth::userIdOrFail();
        $pdo = Database::conn();
        
        // Verify ownership
        $checkStmt = $pdo->prepare("SELECT id FROM segments WHERE id = ? AND user_id = ?");
        $checkStmt->execute([$id, $userId]);
        if (!$checkStmt->fetch()) {
            Response::json(['error' => 'Segment not found'], 404);
            return;
        }
        
        $count = self::recalculateSegmentCount($id, $userId, $pdo);
        
        Response::json(['message' => 'Segment recalculated', 'contactCount' => $count]);
    }
    
    public static function preview(): void {
        $userId = Auth::userIdOrFail();
        $data = get_json_input();
        
        if (empty($data['filterCriteria']) || !is_array($data['filterCriteria'])) {
            Response::json(['error' => 'Filter criteria are required'], 400);
            return;
        }
        
        $pdo = Database::conn();
        $matchType = $data['matchType'] ?? 'all';
        
        // Build dynamic query
        $query = self::buildFilterQuery($data['filterCriteria'], $matchType, $userId);
        
        // Get count
        $countQuery = "SELECT COUNT(*) as total FROM recipients r WHERE r.user_id = ? AND " . $query['where'];
        $countStmt = $pdo->prepare($countQuery);
        $countStmt->execute([$userId, ...$query['params']]);
        $total = $countStmt->fetch()['total'];
        
        // Get sample contacts (first 10)
        $selectQuery = "
            SELECT r.id, r.email, r.first_name, r.last_name, r.company
            FROM recipients r
            WHERE r.user_id = ? AND " . $query['where'] . "
            ORDER BY r.created_at DESC
            LIMIT 10
        ";
        $selectStmt = $pdo->prepare($selectQuery);
        $selectStmt->execute([$userId, ...$query['params']]);
        $sampleContacts = $selectStmt->fetchAll();
        
        $formattedSample = array_map(function($row) {
            return [
                'id' => (string)$row['id'],
                'email' => $row['email'],
                'name' => trim(($row['first_name'] ?? '') . ' ' . ($row['last_name'] ?? '')),
                'company' => $row['company']
            ];
        }, $sampleContacts);
        
        Response::json([
            'contactCount' => (int)$total,
            'sampleContacts' => $formattedSample
        ]);
    }
    
    private static function recalculateSegmentCount(string $segmentId, string $userId, PDO $pdo): int {
        // Get segment filter criteria
        $stmt = $pdo->prepare("SELECT filter_criteria, match_type FROM segments WHERE id = ?");
        $stmt->execute([$segmentId]);
        $segment = $stmt->fetch();
        
        if (!$segment) {
            return 0;
        }
        
        $filterCriteria = json_decode($segment['filter_criteria'], true);
        $matchType = $segment['match_type'];
        
        // Build and execute count query
        $query = self::buildFilterQuery($filterCriteria, $matchType, $userId);
        $countQuery = "SELECT COUNT(*) as total FROM recipients r WHERE r.user_id = ? AND " . $query['where'];
        $countStmt = $pdo->prepare($countQuery);
        $countStmt->execute([$userId, ...$query['params']]);
        $count = (int)$countStmt->fetch()['total'];
        
        // Update segment
        $updateStmt = $pdo->prepare("UPDATE segments SET contact_count = ?, last_calculated_at = NOW() WHERE id = ?");
        $updateStmt->execute([$count, $segmentId]);
        
        return $count;
    }
    
    private static function buildFilterQuery(array $filterCriteria, string $matchType, string $userId): array {
        $conditions = [];
        $params = [];
        
        // Field mapping from frontend to database
        $fieldMapping = [
            'email' => 'r.email',
            'firstName' => 'r.first_name',
            'lastName' => 'r.last_name',
            'phone' => 'r.phone',
            'company' => 'r.company',
            'title' => 'r.title',
            'city' => 'r.city',
            'state' => 'r.state',
            'country' => 'r.country',
            'industry' => 'r.industry',
            'leadSource' => 'r.lead_source',
            'stage' => 'r.lead_status',
            'status' => 'r.status',
            'type' => 'r.type',
            'createdAt' => 'r.created_at',
            'updatedAt' => 'r.updated_at',
            'sentAt' => 'r.sent_at',
            'openedAt' => 'r.opened_at',
            'clickedAt' => 'r.clicked_at',
            'birthday' => 'r.birthday',
            'companyId' => 'r.company_id',
            'campaignId' => 'r.campaign_id'
        ];
        
        foreach ($filterCriteria as $filter) {
            if (empty($filter['field']) || empty($filter['operator'])) {
                continue;
            }
            
            $field = $fieldMapping[$filter['field']] ?? null;
            if (!$field) {
                continue;
            }
            
            $operator = $filter['operator'];
            $value = $filter['value'] ?? null;
            
            switch ($operator) {
                case 'equals':
                    $conditions[] = "$field = ?";
                    $params[] = $value;
                    break;
                    
                case 'not_equals':
                    $conditions[] = "$field != ?";
                    $params[] = $value;
                    break;
                    
                case 'contains':
                    $conditions[] = "$field LIKE ?";
                    $params[] = "%$value%";
                    break;
                    
                case 'not_contains':
                    $conditions[] = "$field NOT LIKE ?";
                    $params[] = "%$value%";
                    break;
                    
                case 'starts_with':
                    $conditions[] = "$field LIKE ?";
                    $params[] = "$value%";
                    break;
                    
                case 'ends_with':
                    $conditions[] = "$field LIKE ?";
                    $params[] = "%$value";
                    break;
                    
                case 'is_empty':
                    $conditions[] = "($field IS NULL OR $field = '')";
                    break;
                    
                case 'is_not_empty':
                    $conditions[] = "($field IS NOT NULL AND $field != '')";
                    break;
                    
                case 'greater_than':
                    $conditions[] = "$field > ?";
                    $params[] = $value;
                    break;
                    
                case 'less_than':
                    $conditions[] = "$field < ?";
                    $params[] = $value;
                    break;
                    
                case 'greater_than_or_equal':
                    $conditions[] = "$field >= ?";
                    $params[] = $value;
                    break;
                    
                case 'less_than_or_equal':
                    $conditions[] = "$field <= ?";
                    $params[] = $value;
                    break;
                    
                case 'in':
                    if (is_array($value) && !empty($value)) {
                        $placeholders = str_repeat('?,', count($value) - 1) . '?';
                        $conditions[] = "$field IN ($placeholders)";
                        $params = array_merge($params, $value);
                    }
                    break;
                    
                case 'not_in':
                    if (is_array($value) && !empty($value)) {
                        $placeholders = str_repeat('?,', count($value) - 1) . '?';
                        $conditions[] = "$field NOT IN ($placeholders)";
                        $params = array_merge($params, $value);
                    }
                    break;
                    
                case 'before':
                    $conditions[] = "$field < ?";
                    $params[] = $value;
                    break;
                    
                case 'after':
                    $conditions[] = "$field > ?";
                    $params[] = $value;
                    break;
                    
                case 'between':
                    if (is_array($value) && count($value) >= 2) {
                        $conditions[] = "$field BETWEEN ? AND ?";
                        $params[] = $value[0];
                        $params[] = $value[1];
                    }
                    break;
                    
                case 'has_tag':
                    $conditions[] = "EXISTS (SELECT 1 FROM recipient_tags rt JOIN tags t ON rt.tag_id = t.id WHERE rt.recipient_id = r.id AND t.name = ?)";
                    $params[] = $value;
                    break;
                    
                case 'not_has_tag':
                    $conditions[] = "NOT EXISTS (SELECT 1 FROM recipient_tags rt JOIN tags t ON rt.tag_id = t.id WHERE rt.recipient_id = r.id AND t.name = ?)";
                    $params[] = $value;
                    break;
                    
                case 'in_list':
                    $conditions[] = "EXISTS (SELECT 1 FROM contact_list_members clm WHERE clm.contact_id = r.id AND clm.list_id = ?)";
                    $params[] = $value;
                    break;
                    
                case 'not_in_list':
                    $conditions[] = "NOT EXISTS (SELECT 1 FROM contact_list_members clm WHERE clm.contact_id = r.id AND clm.list_id = ?)";
                    $params[] = $value;
                    break;
                    
                case 'in_company':
                    $conditions[] = "r.company_id = ?";
                    $params[] = $value;
                    break;
                    
                case 'not_in_company':
                    $conditions[] = "(r.company_id IS NULL OR r.company_id != ?)";
                    $params[] = $value;
                    break;
            }
        }
        
        if (empty($conditions)) {
            return ['where' => '1=1', 'params' => []];
        }
        
        $connector = $matchType === 'any' ? ' OR ' : ' AND ';
        $whereClause = '(' . implode($connector, $conditions) . ')';
        
        return ['where' => $whereClause, 'params' => $params];
    }
}
