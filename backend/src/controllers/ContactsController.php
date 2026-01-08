<?php
require_once __DIR__ . '/../Database.php';
require_once __DIR__ . '/../Response.php';
require_once __DIR__ . '/../Auth.php';
require_once __DIR__ . '/../services/RBACService.php';

class ContactsController {
    
    /**
     * Convert database row to camelCase format for frontend
     */
    private static function formatContact(array $row): array {
        $firstName = $row['first_name'] ?? null;
        $lastName = $row['last_name'] ?? null;
        $name = trim(($firstName ?? '') . ' ' . ($lastName ?? ''));
        
        return [
            'id' => $row['id'],
            'email' => $row['email'] ?? null,
            'phone' => $row['phone'] ?? null,
            'name' => $name ?: null,
            'firstName' => $firstName,
            'lastName' => $lastName,
            'company' => $row['company'] ?? null,
            'title' => $row['title'] ?? null,
            'address' => $row['address'] ?? null,
            'city' => $row['city'] ?? null,
            'state' => $row['state'] ?? null,
            'country' => $row['country'] ?? null,
            'postalCode' => $row['postal_code'] ?? null,
            'website' => $row['website'] ?? null,
            'linkedin' => $row['linkedin'] ?? null,
            'twitter' => $row['twitter'] ?? null,
            'notes' => $row['notes'] ?? null,
            'additionalDetails' => $row['additional_details'] ?? null,
            'birthday' => $row['birthday'] ?? null,
            'leadSource' => $row['lead_source'] ?? null,
            'industry' => $row['industry'] ?? null,
            'companySize' => $row['company_size'] ?? null,
            'companySizeSelection' => $row['company_size_selection'] ?? null,
            'annualRevenue' => $row['annual_revenue'] ?? null,
            'technology' => $row['technology'] ?? null,
            'type' => $row['type'] ?? 'email',
            'status' => $row['status'] ?? 'active',
            // CRM/Stage-style status for this contact (lead/prospect/client etc.)
            'stage' => $row['lead_status'] ?? null,
            'campaignId' => $row['campaign_id'] ?? null,
            'campaign_id' => $row['campaign_id'] ?? null,
            'campaign_name' => $row['campaign_name'] ?? null,
            'campaign_type' => $row['campaign_type'] ?? null,
            'tags' => $row['tags'] ?? [],
            'createdAt' => $row['created_at'] ?? null,
            'sentAt' => $row['sent_at'] ?? null,
            'openedAt' => $row['opened_at'] ?? null,
            'clickedAt' => $row['clicked_at'] ?? null,
            'unsubscribed_at' => $row['unsubscribed_at'] ?? null,
            'updated_at' => $row['updated_at'] ?? null,
            'proposalCount' => (int)($row['proposal_count'] ?? 0),
            'acceptedProposals' => (int)($row['accepted_proposals'] ?? 0),
            'totalRevenue' => (float)($row['total_revenue'] ?? 0),
            'lastContacted' => $row['last_contacted'] ?? null,
        ];
    }
    
    public static function index(): void {
        $userId = Auth::userIdOrFail();
        $ctx = $GLOBALS['tenantContext'] ?? null;
        $rbac = RBACService::getInstance();
        
        // Check permission
        if (!$rbac->hasPermission($userId, 'contacts.view')) {
            Response::forbidden('You do not have permission to view contacts');
            return;
        }
        
        $type = get_query('type'); // 'email', 'sms', 'call', or null for all
        $campaignId = get_query('campaign_id');
        $search = get_query('search');
        $page = (int)(get_query('page') ?? 1);
        $limit = (int)(get_query('limit') ?? 50);
        $offset = ($page - 1) * $limit;
        
        $pdo = Database::conn();
        
        // Build query with workspace scoping
        $whereConditions = [];
        $params = [];
        
        if ($ctx && isset($ctx->workspaceId)) {
            $whereConditions[] = 'r.workspace_id = ?';
            $params[] = (int)$ctx->workspaceId;
        } else {
            $whereConditions[] = 'r.user_id = ?';
            $params[] = $userId;
        }
        
        if ($type) {
            $whereConditions[] = 'r.type = ?';
            $params[] = $type;
        }
        
        if ($campaignId) {
            $whereConditions[] = 'r.campaign_id = ?';
            $params[] = $campaignId;
        }
        
        if ($search) {
            $whereConditions[] = '(r.first_name LIKE ? OR r.last_name LIKE ? OR r.email LIKE ? OR r.company LIKE ?)';
            $searchParam = "%$search%";
            $params[] = $searchParam;
            $params[] = $searchParam;
            $params[] = $searchParam;
            $params[] = $searchParam;
        }
        
        $whereClause = implode(' AND ', $whereConditions);
        
        // Get total count for pagination
        $countStmt = $pdo->prepare("
            SELECT COUNT(*) as total 
            FROM recipients r 
            LEFT JOIN campaigns c ON r.campaign_id = c.id 
            WHERE $whereClause
        ");
        $countStmt->execute($params);
        $total = $countStmt->fetch()['total'];
        
        $workspaceId = ($ctx && isset($ctx->workspaceId)) ? (int)$ctx->workspaceId : null;
        
        // Fetch paginated contacts with proposal stats
        $stmt = $pdo->prepare("
            SELECT r.*, c.name as campaign_name, r.type as campaign_type,
                   p_stats.proposal_count, p_stats.accepted_proposals, p_stats.total_revenue, p_stats.last_contacted
            FROM recipients r 
            LEFT JOIN campaigns c ON r.campaign_id = c.id 
            LEFT JOIN (
                SELECT client_email, 
                       COUNT(*) as proposal_count,
                       SUM(CASE WHEN status = 'accepted' THEN 1 ELSE 0 END) as accepted_proposals,
                       SUM(CASE WHEN status = 'accepted' THEN total_amount ELSE 0 END) as total_revenue,
                       MAX(updated_at) as last_contacted
                FROM proposals
                WHERE workspace_id = ?
                GROUP BY client_email
            ) p_stats ON r.email = p_stats.client_email
            WHERE $whereClause 
            ORDER BY r.id DESC
            LIMIT ? OFFSET ?
        ");
        $stmt->execute([$workspaceId ?: $userId, ...$params, $limit, $offset]);
        $rows = $stmt->fetchAll();
        
        // Fetch tags for all contacts
        if (!empty($rows)) {
            $contactIds = array_column($rows, 'id');
            $placeholders = str_repeat('?,', count($contactIds) - 1) . '?';
            $tagStmt = $pdo->prepare("
                SELECT rt.recipient_id, t.id, t.name, t.color 
                FROM recipient_tags rt 
                JOIN tags t ON rt.tag_id = t.id 
                WHERE rt.recipient_id IN ($placeholders)
                ORDER BY t.name
            ");
            $tagStmt->execute($contactIds);
            $tagRows = $tagStmt->fetchAll();
            
            // Group tags by contact_id
            $tagsByContact = [];
            foreach ($tagRows as $tagRow) {
                $contactId = $tagRow['recipient_id'];
                if (!isset($tagsByContact[$contactId])) {
                    $tagsByContact[$contactId] = [];
                }
                $tagsByContact[$contactId][] = [
                    'id' => $tagRow['id'],
                    'name' => $tagRow['name'],
                    'color' => $tagRow['color']
                ];
            }
            
            // Add tags to each contact and format
            $formattedContacts = [];
            foreach ($rows as $row) {
                $row['tags'] = $tagsByContact[$row['id']] ?? [];
                $formattedContacts[] = self::formatContact($row);
            }
        } else {
            $formattedContacts = [];
        }
        
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
    
    public static function show(string $id): void {
        $userId = Auth::userIdOrFail();
        $ctx = $GLOBALS['tenantContext'] ?? null;
        $pdo = Database::conn();
        
        // Build query with workspace scoping
        $whereConditions = ['r.id = ?'];
        $params = [$id];
        
        if ($ctx && isset($ctx->workspaceId)) {
            $whereConditions[] = 'r.workspace_id = ?';
            $params[] = (int)$ctx->workspaceId;
        } else {
            $whereConditions[] = 'r.user_id = ?';
            $params[] = $userId;
        }
        
        $workspaceId = ($ctx && isset($ctx->workspaceId)) ? (int)$ctx->workspaceId : null;
        $whereClause = implode(' AND ', $whereConditions);

        $stmt = $pdo->prepare("
            SELECT r.*, c.name as campaign_name, r.type as campaign_type,
                   p_stats.proposal_count, p_stats.accepted_proposals, p_stats.total_revenue, p_stats.last_contacted
            FROM recipients r 
            LEFT JOIN campaigns c ON r.campaign_id = c.id 
            LEFT JOIN (
                SELECT client_email, 
                       COUNT(*) as proposal_count,
                       SUM(CASE WHEN status = 'accepted' THEN 1 ELSE 0 END) as accepted_proposals,
                       SUM(CASE WHEN status = 'accepted' THEN total_amount ELSE 0 END) as total_revenue,
                       MAX(updated_at) as last_contacted
                FROM proposals
                WHERE workspace_id = ?
                GROUP BY client_email
            ) p_stats ON r.email = p_stats.client_email
            WHERE $whereClause
        ");
        $stmt->execute([$workspaceId ?: $userId, ...$params]);
        $contact = $stmt->fetch();
        
        if (!$contact) {
            Response::json(['error' => 'Contact not found'], 404);
            return;
        }
        
        // Fetch tags for this contact
        $tagStmt = $pdo->prepare("
            SELECT t.id, t.name, t.color 
            FROM recipient_tags rt 
            JOIN tags t ON rt.tag_id = t.id 
            WHERE rt.recipient_id = ?
            ORDER BY t.name
        ");
        $tagStmt->execute([$id]);
        $contact['tags'] = $tagStmt->fetchAll();
        
        Response::json(self::formatContact($contact));
    }
    
    public static function create(): void {
        $userId = Auth::userIdOrFail();
        $ctx = $GLOBALS['tenantContext'] ?? null;
        $rbac = RBACService::getInstance();
        
        // Check permission
        if (!$rbac->hasPermission($userId, 'contacts.create')) {
            Response::forbidden('You do not have permission to create contacts');
            return;
        }
        
        $data = get_json_input();
        
        $requiredFields = ['email', 'firstName', 'lastName'];
        foreach ($requiredFields as $field) {
            if (empty($data[$field])) {
                Response::json(['error' => "Missing required field: $field"], 400);
                return;
            }
        }
        
        $pdo = Database::conn();
        $workspaceId = ($ctx && isset($ctx->workspaceId)) ? (int)$ctx->workspaceId : null;
        
        // Verify campaign ownership if campaign_id is provided (with workspace scoping)
        if (!empty($data['campaign_id'])) {
            $campaignWhere = 'id = ?';
            $campaignParams = [$data['campaign_id']];
            if ($workspaceId) {
                $campaignWhere .= ' AND workspace_id = ?';
                $campaignParams[] = $workspaceId;
            } else {
                $campaignWhere .= ' AND user_id = ?';
                $campaignParams[] = $userId;
            }
            $campaignStmt = $pdo->prepare("SELECT id FROM campaigns WHERE $campaignWhere");
            $campaignStmt->execute($campaignParams);
            if (!$campaignStmt->fetch()) {
                Response::json(['error' => 'Campaign not found'], 404);
                return;
            }
        }
        
        // Insert contact with workspace_id
        $stmt = $pdo->prepare("
            INSERT INTO recipients (
                email, first_name, last_name, company, title, phone, 
                address, city, state, country, postal_code,
                website, linkedin, twitter, notes, additional_details, birthday,
                lead_source, industry, company_size, company_size_selection, annual_revenue, technology,
                campaign_id, type, status, user_id, workspace_id, created_at, updated_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
        ");
        
        $result = $stmt->execute([
            $data['email'],
            $data['firstName'],
            $data['lastName'],
            $data['company'] ?? null,
            $data['title'] ?? null,
            $data['phone'] ?? null,
            $data['address'] ?? null,
            $data['city'] ?? null,
            $data['state'] ?? null,
            $data['country'] ?? null,
            $data['postalCode'] ?? null,
            $data['website'] ?? null,
            $data['linkedin'] ?? null,
            $data['twitter'] ?? null,
            $data['notes'] ?? null,
            $data['additionalDetails'] ?? null,
            $data['birthday'] ?? null,
            $data['leadSource'] ?? null,
            $data['industry'] ?? null,
            $data['companySize'] ?? null,
            $data['companySizeSelection'] ?? null,
            $data['annualRevenue'] ?? null,
            $data['technology'] ?? null,
            $data['campaign_id'] ?? null,
            $data['type'] ?? 'email',
            'active',
            $userId,
            $workspaceId
        ]);
        
        if ($result) {
            $contactId = $pdo->lastInsertId();
            
            // Handle tags if provided
            if (!empty($data['tags']) && is_array($data['tags'])) {
                self::syncContactTags($contactId, $data['tags'], $pdo);
            }
            
            Response::json(['id' => $contactId, 'message' => 'Contact created successfully'], 201);
        } else {
            Response::json(['error' => 'Failed to create contact'], 500);
        }
    }
    
    public static function update(string $id): void {
        $userId = Auth::userIdOrFail();
        $ctx = $GLOBALS['tenantContext'] ?? null;
        $rbac = RBACService::getInstance();
        
        // Check permission
        if (!$rbac->hasPermission($userId, 'contacts.edit')) {
            Response::forbidden('You do not have permission to edit contacts');
            return;
        }
        
        $data = get_json_input();
        $pdo = Database::conn();
        
        // Verify contact access with workspace scoping
        $whereConditions = ['id = ?'];
        $params = [$id];
        
        if ($ctx && isset($ctx->workspaceId)) {
            $whereConditions[] = 'workspace_id = ?';
            $params[] = (int)$ctx->workspaceId;
        } else {
            $whereConditions[] = 'user_id = ?';
            $params[] = $userId;
        }
        
        $whereClause = implode(' AND ', $whereConditions);
        $contactStmt = $pdo->prepare("SELECT id FROM recipients WHERE $whereClause");
        $contactStmt->execute($params);
        if (!$contactStmt->fetch()) {
            Response::json(['error' => 'Contact not found'], 404);
            return;
        }
        
        // Build update query
        $updateFields = [];
        $params = [];
        
        // Map camelCase to snake_case
        $fieldMapping = [
            'firstName' => 'first_name',
            'lastName' => 'last_name',
            'postalCode' => 'postal_code',
            'additionalDetails' => 'additional_details',
            'leadSource' => 'lead_source',
            'companySize' => 'company_size',
            'companySizeSelection' => 'company_size_selection',
            'annualRevenue' => 'annual_revenue',
            'campaignId' => 'campaign_id',
            // Map frontend stage field onto CRM-oriented lead_status column
            'stage' => 'lead_status',
        ];
        
        $allowedFields = [
            'email', 'first_name', 'last_name', 'company', 'title', 'phone', 
            'address', 'city', 'state', 'country', 'postal_code',
            'website', 'linkedin', 'twitter', 'notes', 'additional_details', 'birthday',
            'lead_source', 'industry', 'company_size', 'company_size_selection', 'annual_revenue', 'technology',
            'status', 'campaign_id', 'lead_status', 'type'
        ];
        
        foreach ($data as $key => $value) {
            // Convert camelCase to snake_case if needed
            $dbField = $fieldMapping[$key] ?? $key;
            
            if (in_array($dbField, $allowedFields)) {
                $updateFields[] = "$dbField = ?";
                $params[] = $value;
            }
        }
        
        if (empty($updateFields)) {
            Response::json(['error' => 'No valid fields to update'], 400);
            return;
        }
        
        $params[] = $id; // Add ID for WHERE clause
        $updateQuery = "UPDATE recipients SET " . implode(', ', $updateFields) . ", updated_at = NOW() WHERE id = ?";
        
        $stmt = $pdo->prepare($updateQuery);
        $result = $stmt->execute($params);
        
        if ($result) {
            // Handle tags if provided
            if (isset($data['tags']) && is_array($data['tags'])) {
                self::syncContactTags($id, $data['tags'], $pdo);
            }
            
            Response::json(['message' => 'Contact updated successfully']);
        } else {
            Response::json(['error' => 'Failed to update contact'], 500);
        }
    }
    
    public static function delete(string $id): void {
        $userId = Auth::userIdOrFail();
        $ctx = $GLOBALS['tenantContext'] ?? null;
        $rbac = RBACService::getInstance();
        
        // Check permission
        if (!$rbac->hasPermission($userId, 'contacts.delete')) {
            Response::forbidden('You do not have permission to delete contacts');
            return;
        }
        
        $pdo = Database::conn();
        
        // Verify contact access with workspace scoping
        $whereConditions = ['id = ?'];
        $params = [$id];
        
        if ($ctx && isset($ctx->workspaceId)) {
            $whereConditions[] = 'workspace_id = ?';
            $params[] = (int)$ctx->workspaceId;
        } else {
            $whereConditions[] = 'user_id = ?';
            $params[] = $userId;
        }
        
        $whereClause = implode(' AND ', $whereConditions);
        $contactStmt = $pdo->prepare("SELECT id FROM recipients WHERE $whereClause");
        $contactStmt->execute($params);
        if (!$contactStmt->fetch()) {
            Response::json(['error' => 'Contact not found'], 404);
            return;
        }
        
        // Delete contact and related tags (scoped)
        $pdo->beginTransaction();
        try {
            $pdo->prepare('DELETE FROM recipient_tags WHERE recipient_id = ?')->execute([$id]);
            $pdo->prepare("DELETE FROM recipients WHERE $whereClause")->execute($params);
            $pdo->commit();
            
            Response::json(['message' => 'Contact deleted successfully']);
        } catch (Exception $e) {
            $pdo->rollBack();
            Response::json(['error' => 'Failed to delete contact'], 500);
        }
    }
    
    public static function import(): void {
        $userId = Auth::userIdOrFail();
        $ctx = $GLOBALS['tenantContext'] ?? null;
        $rbac = RBACService::getInstance();
        
        // Check permission
        if (!$rbac->hasPermission($userId, 'contacts.import')) {
            Response::forbidden('You do not have permission to import contacts');
            return;
        }
        
        $data = get_json_input();
        
        if (empty($data['contacts']) || !is_array($data['contacts'])) {
            Response::json(['error' => 'No contacts provided'], 400);
            return;
        }
        
        $pdo = Database::conn();
        $workspaceId = ($ctx && isset($ctx->workspaceId)) ? (int)$ctx->workspaceId : null;
        $importedCount = 0;
        $errors = [];
        
        foreach ($data['contacts'] as $index => $contact) {
            try {
                // Validate required fields
                if (empty($contact['email']) || empty($contact['firstName']) || empty($contact['lastName']) || empty($contact['campaign_id']) || empty($contact['type'])) {
                    $errors[] = "Row $index: Missing required fields";
                    continue;
                }
                
                // Verify campaign access with workspace scoping
                $campaignWhere = 'id = ?';
                $campaignParams = [$contact['campaign_id']];
                if ($workspaceId) {
                    $campaignWhere .= ' AND workspace_id = ?';
                    $campaignParams[] = $workspaceId;
                } else {
                    $campaignWhere .= ' AND user_id = ?';
                    $campaignParams[] = $userId;
                }
                $campaignStmt = $pdo->prepare("SELECT id FROM campaigns WHERE $campaignWhere");
                $campaignStmt->execute($campaignParams);
                if (!$campaignStmt->fetch()) {
                    $errors[] = "Row $index: Campaign not found";
                    continue;
                }
                
                // Insert contact with workspace_id
                $stmt = $pdo->prepare("
                    INSERT INTO recipients (
                        email, first_name, last_name, company, title, phone, 
                        address, city, state, country, postal_code,
                        website, linkedin, twitter, notes, additional_details, birthday,
                        lead_source, industry, company_size, company_size_selection, annual_revenue, technology,
                        campaign_id, type, status, user_id, workspace_id, created_at, updated_at
                    )
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
                ");
                
                $stmt->execute([
                    $contact['email'],
                    $contact['firstName'],
                    $contact['lastName'],
                    $contact['company'] ?? null,
                    $contact['title'] ?? null,
                    $contact['phone'] ?? null,
                    $contact['address'] ?? null,
                    $contact['city'] ?? null,
                    $contact['state'] ?? null,
                    $contact['country'] ?? null,
                    $contact['postalCode'] ?? null,
                    $contact['website'] ?? null,
                    $contact['linkedin'] ?? null,
                    $contact['twitter'] ?? null,
                    $contact['notes'] ?? null,
                    $contact['additionalDetails'] ?? null,
                    $contact['birthday'] ?? null,
                    $contact['leadSource'] ?? null,
                    $contact['industry'] ?? null,
                    $contact['companySize'] ?? null,
                    $contact['companySizeSelection'] ?? null,
                    $contact['annualRevenue'] ?? null,
                    $contact['technology'] ?? null,
                    $contact['campaign_id'],
                    $contact['type'],
                    'active',
                    $userId,
                    $workspaceId
                ]);
                
                $contactId = $pdo->lastInsertId();
                $importedCount++;
                
                // Handle tags if provided
                if (!empty($contact['tags']) && is_array($contact['tags'])) {
                    self::syncContactTags($contactId, $contact['tags'], $pdo);
                }
                
            } catch (Exception $e) {
                $errors[] = "Row $index: " . $e->getMessage();
            }
        }
        
        Response::json([
            'message' => "Imported $importedCount contacts successfully",
            'imported_count' => $importedCount,
            'errors' => $errors
        ]);
    }
    
    public static function upload(): void {
        // Handle file upload for CSV imports
        if (empty($_FILES['file'])) {
            Response::json(['error' => 'No file uploaded'], 400);
            return;
        }
        
        $file = $_FILES['file'];
        $type = $_POST['type'] ?? 'email'; // email, sms, or call
        
        if ($file['error'] !== UPLOAD_ERR_OK) {
            Response::json(['error' => 'File upload failed'], 400);
            return;
        }
        
        // Process CSV file (similar to existing recipient import logic)
        // This would need to be implemented based on your CSV processing requirements
        Response::json(['message' => 'File upload processed', 'uploaded_count' => 0]);
    }
    
    public static function bulkAction(): void {
        $userId = Auth::userIdOrFail();
        $ctx = $GLOBALS['tenantContext'] ?? null;
        $data = get_json_input();
        
        if (empty($data['action']) || empty($data['contact_ids']) || !is_array($data['contact_ids'])) {
            Response::json(['error' => 'Missing required fields'], 400);
            return;
        }
        
        $action = $data['action'];
        $contactIds = $data['contact_ids'];
        $pdo = Database::conn();
        
        // Verify contact access with workspace scoping
        $placeholders = str_repeat('?,', count($contactIds) - 1) . '?';
        $scopeCol = ($ctx && isset($ctx->workspaceId)) ? 'workspace_id' : 'user_id';
        $scopeVal = ($ctx && isset($ctx->workspaceId)) ? (int)$ctx->workspaceId : $userId;
        $verifyStmt = $pdo->prepare("
            SELECT id FROM recipients WHERE id IN ($placeholders) AND $scopeCol = ?
        ");
        $verifyStmt->execute(array_merge($contactIds, [$scopeVal]));
        $allowedIds = array_column($verifyStmt->fetchAll(), 'id');
        
        if (count($allowedIds) !== count($contactIds)) {
            Response::json(['error' => 'Some contacts not found or unauthorized'], 403);
            return;
        }
        
        $affectedCount = 0;
        
        switch ($action) {
            case 'delete':
                $placeholders = str_repeat('?,', count($allowedIds) - 1) . '?';
                $pdo->prepare("DELETE FROM recipient_tags WHERE recipient_id IN ($placeholders)")->execute($allowedIds);
                $stmt = $pdo->prepare("DELETE FROM recipients WHERE id IN ($placeholders)");
                $stmt->execute($allowedIds);
                $affectedCount = $stmt->rowCount();
                break;
                
            case 'add_to_campaign':
                if (empty($data['campaign_id'])) {
                    Response::json(['error' => 'Campaign ID required'], 400);
                    return;
                }
                
                // Verify campaign access with workspace scoping
                $campaignStmt = $pdo->prepare("SELECT id FROM campaigns WHERE id = ? AND $scopeCol = ?");
                $campaignStmt->execute([$data['campaign_id'], $scopeVal]);
                if (!$campaignStmt->fetch()) {
                    Response::json(['error' => 'Campaign not found'], 404);
                    return;
                }
                
                $stmt = $pdo->prepare('UPDATE recipients SET campaign_id = ?, updated_at = NOW() WHERE id = ?');
                foreach ($allowedIds as $contactId) {
                    $stmt->execute([$data['campaign_id'], $contactId]);
                    $affectedCount += $stmt->rowCount();
                }
                break;
                
            case 'add_tag':
                if (empty($data['tag'])) {
                    Response::json(['error' => 'Tag name required'], 400);
                    return;
                }
                
                // Get or create tag with workspace scoping
                $tagStmt = $pdo->prepare("SELECT id FROM tags WHERE name = ? AND $scopeCol = ?");
                $tagStmt->execute([$data['tag'], $scopeVal]);
                $tag = $tagStmt->fetch();
                
                if (!$tag) {
                    $workspaceId = ($ctx && isset($ctx->workspaceId)) ? (int)$ctx->workspaceId : null;
                    $pdo->prepare('INSERT INTO tags (name, color, user_id, workspace_id, created_at) VALUES (?, ?, ?, ?, NOW())')->execute([$data['tag'], '#6B7280', $userId, $workspaceId]);
                    $tagId = $pdo->lastInsertId();
                } else {
                    $tagId = $tag['id'];
                }
                
                // Add tag to contacts
                $stmt = $pdo->prepare('INSERT IGNORE INTO recipient_tags (recipient_id, tag_id) VALUES (?, ?)');
                foreach ($allowedIds as $contactId) {
                    $stmt->execute([$contactId, $tagId]);
                    $affectedCount += $stmt->rowCount();
                }
                break;
                
            case 'remove_tag':
                if (empty($data['tag'])) {
                    Response::json(['error' => 'Tag name required'], 400);
                    return;
                }
                
                // Get tag with workspace scoping
                $tagStmt = $pdo->prepare("SELECT id FROM tags WHERE name = ? AND $scopeCol = ?");
                $tagStmt->execute([$data['tag'], $scopeVal]);
                $tag = $tagStmt->fetch();
                
                if ($tag) {
                    $placeholders = str_repeat('?,', count($allowedIds) - 1) . '?';
                    $stmt = $pdo->prepare("DELETE FROM recipient_tags WHERE recipient_id IN ($placeholders) AND tag_id = ?");
                    $stmt->execute(array_merge($allowedIds, [$tag['id']]));
                    $affectedCount = $stmt->rowCount();
                }
                break;
                
            default:
                Response::json(['error' => 'Invalid action'], 400);
                return;
        }
        
        Response::json(['message' => 'Bulk action completed', 'affected_count' => $affectedCount]);
    }
    
    public static function getTags(): void {
        $userId = Auth::userIdOrFail();
        $ctx = $GLOBALS['tenantContext'] ?? null;
        $pdo = Database::conn();
        
        $scopeCol = ($ctx && isset($ctx->workspaceId)) ? 'workspace_id' : 'user_id';
        $scopeVal = ($ctx && isset($ctx->workspaceId)) ? (int)$ctx->workspaceId : $userId;
        
        $stmt = $pdo->prepare("
            SELECT DISTINCT t.name, t.color 
            FROM tags t
            JOIN recipient_tags rt ON t.id = rt.tag_id
            JOIN recipients r ON rt.recipient_id = r.id
            WHERE r.$scopeCol = ?
            ORDER BY t.name
        ");
        $stmt->execute([$scopeVal]);
        $tags = $stmt->fetchAll();
        
        Response::json(['tags' => array_column($tags, 'name')]);
    }
    
    private static function syncContactTags(int $contactId, array $tagNames, $pdo): void {
        // Get existing tags
        $existingStmt = $pdo->prepare('SELECT t.id, t.name FROM recipient_tags rt JOIN tags t ON rt.tag_id = t.id WHERE rt.recipient_id = ?');
        $existingStmt->execute([$contactId]);
        $existingTags = $existingStmt->fetchAll(PDO::FETCH_KEY_PAIR);
        
        // Determine tags to add and remove
        $tagsToAdd = array_diff($tagNames, array_keys($existingTags));
        $tagsToRemove = array_diff(array_keys($existingTags), $tagNames);
        
        // Remove tags
        if (!empty($tagsToRemove)) {
            $placeholders = str_repeat('?,', count($tagsToRemove) - 1) . '?';
            $removeStmt = $pdo->prepare("DELETE FROM recipient_tags WHERE recipient_id = ? AND tag_id IN ($placeholders)");
            $removeStmt->execute(array_merge([$contactId], array_values($tagsToRemove)));
        }
        
        // Add new tags
        foreach ($tagsToAdd as $tagName) {
            // Get or create tag
            $tagStmt = $pdo->prepare('SELECT id FROM tags WHERE name = ?');
            $tagStmt->execute([$tagName]);
            $tag = $tagStmt->fetch();
            
            if (!$tag) {
                $pdo->prepare('INSERT INTO tags (name, color, created_at) VALUES (?, ?, NOW())')->execute([$tagName, '#6B7280']);
                $tagId = $pdo->lastInsertId();
            } else {
                $tagId = $tag['id'];
            }
            
            // Add tag to contact
            $pdo->prepare('INSERT IGNORE INTO recipient_tags (recipient_id, tag_id) VALUES (?, ?)')->execute([$contactId, $tagId]);
        }
    }
    
    /**
     * Find duplicate contacts based on email or phone
     */
    public static function findDuplicates(): void {
        $userId = Auth::userIdOrFail();
        $pdo = Database::conn();
        $criteria = get_query('criteria') ?? 'email'; // 'email', 'phone', or 'both'
        
        // Use workspace scoping
        $ctx = $GLOBALS['tenantContext'] ?? null;
        $scopeCol = ($ctx && isset($ctx->workspaceId)) ? 'workspace_id' : 'user_id';
        $scopeVal = ($ctx && isset($ctx->workspaceId)) ? (int)$ctx->workspaceId : $userId;
        
        $duplicates = [];
        
        if ($criteria === 'email' || $criteria === 'both') {
            // Find duplicates by email
            $stmt = $pdo->prepare("
                SELECT email, GROUP_CONCAT(id) as ids, COUNT(*) as count
                FROM recipients 
                WHERE {$scopeCol} = ? AND email IS NOT NULL AND email != ''
                GROUP BY LOWER(email)
                HAVING COUNT(*) > 1
                ORDER BY count DESC
            ");
            $stmt->execute([$scopeVal]);
            $emailDupes = $stmt->fetchAll();
            
            foreach ($emailDupes as $dupe) {
                $ids = explode(',', $dupe['ids']);
                $contactsStmt = $pdo->prepare("
                    SELECT r.*, c.name as campaign_name 
                    FROM recipients r 
                    LEFT JOIN campaigns c ON r.campaign_id = c.id 
                    WHERE r.id IN (" . implode(',', array_fill(0, count($ids), '?')) . ")
                    ORDER BY r.created_at ASC
                ");
                $contactsStmt->execute($ids);
                $contacts = $contactsStmt->fetchAll();
                
                $duplicates[] = [
                    'type' => 'email',
                    'value' => $dupe['email'],
                    'count' => (int)$dupe['count'],
                    'contacts' => array_map([self::class, 'formatContact'], $contacts)
                ];
            }
        }
        
        if ($criteria === 'phone' || $criteria === 'both') {
            // Find duplicates by phone (normalize phone numbers)
            $stmt = $pdo->prepare("
                SELECT REPLACE(REPLACE(REPLACE(REPLACE(phone, ' ', ''), '-', ''), '(', ''), ')', '') as normalized_phone,
                       GROUP_CONCAT(id) as ids, COUNT(*) as count
                FROM recipients 
                WHERE {$scopeCol} = ? AND phone IS NOT NULL AND phone != ''
                GROUP BY normalized_phone
                HAVING COUNT(*) > 1
                ORDER BY count DESC
            ");
            $stmt->execute([$scopeVal]);
            $phoneDupes = $stmt->fetchAll();
            
            foreach ($phoneDupes as $dupe) {
                $ids = explode(',', $dupe['ids']);
                $contactsStmt = $pdo->prepare("
                    SELECT r.*, c.name as campaign_name 
                    FROM recipients r 
                    LEFT JOIN campaigns c ON r.campaign_id = c.id 
                    WHERE r.id IN (" . implode(',', array_fill(0, count($ids), '?')) . ")
                    ORDER BY r.created_at ASC
                ");
                $contactsStmt->execute($ids);
                $contacts = $contactsStmt->fetchAll();
                
                // Check if this group is already in duplicates (from email check)
                $alreadyExists = false;
                foreach ($duplicates as &$existing) {
                    $existingIds = array_column($existing['contacts'], 'id');
                    if (count(array_intersect($ids, $existingIds)) > 0) {
                        // Merge the groups
                        $existing['type'] = 'email_and_phone';
                        $alreadyExists = true;
                        break;
                    }
                }
                
                if (!$alreadyExists) {
                    $duplicates[] = [
                        'type' => 'phone',
                        'value' => $contacts[0]['phone'] ?? $dupe['normalized_phone'],
                        'count' => (int)$dupe['count'],
                        'contacts' => array_map([self::class, 'formatContact'], $contacts)
                    ];
                }
            }
        }
        
        // Calculate summary
        $totalDuplicateGroups = count($duplicates);
        $totalDuplicateContacts = array_sum(array_column($duplicates, 'count'));
        $removableContacts = $totalDuplicateContacts - $totalDuplicateGroups; // Keep one from each group
        
        Response::json([
            'duplicates' => $duplicates,
            'summary' => [
                'totalGroups' => $totalDuplicateGroups,
                'totalDuplicates' => $totalDuplicateContacts,
                'removableCount' => $removableContacts
            ]
        ]);
    }
    
    /**
     * Remove duplicate contacts, keeping the oldest (or specified) one
     */
    public static function removeDuplicates(): void {
        $userId = Auth::userIdOrFail();
        $data = get_json_input();
        $pdo = Database::conn();
        
        $keepStrategy = $data['keepStrategy'] ?? 'oldest'; // 'oldest', 'newest', or 'specific'
        $specificKeepIds = $data['keepIds'] ?? []; // IDs to keep when strategy is 'specific'
        $criteria = $data['criteria'] ?? 'email'; // 'email', 'phone', or 'both'
        
        $removedCount = 0;
        $errors = [];
        
        $pdo->beginTransaction();
        
        try {
            // Find duplicate groups
            $duplicateGroups = [];
            
            // Use workspace scoping
            $ctx = $GLOBALS['tenantContext'] ?? null;
            $scopeCol = ($ctx && isset($ctx->workspaceId)) ? 'workspace_id' : 'user_id';
            $scopeVal = ($ctx && isset($ctx->workspaceId)) ? (int)$ctx->workspaceId : $userId;
            
            if ($criteria === 'email' || $criteria === 'both') {
                $stmt = $pdo->prepare("
                    SELECT email, GROUP_CONCAT(id ORDER BY created_at ASC) as ids
                    FROM recipients 
                    WHERE {$scopeCol} = ? AND email IS NOT NULL AND email != ''
                    GROUP BY LOWER(email)
                    HAVING COUNT(*) > 1
                ");
                $stmt->execute([$scopeVal]);
                $emailDupes = $stmt->fetchAll();
                
                foreach ($emailDupes as $dupe) {
                    $duplicateGroups[] = explode(',', $dupe['ids']);
                }
            }
            
            if ($criteria === 'phone' || $criteria === 'both') {
                $stmt = $pdo->prepare("
                    SELECT REPLACE(REPLACE(REPLACE(REPLACE(phone, ' ', ''), '-', ''), '(', ''), ')', '') as normalized_phone,
                           GROUP_CONCAT(id ORDER BY created_at ASC) as ids
                    FROM recipients 
                    WHERE {$scopeCol} = ? AND phone IS NOT NULL AND phone != ''
                    GROUP BY normalized_phone
                    HAVING COUNT(*) > 1
                ");
                $stmt->execute([$scopeVal]);
                $phoneDupes = $stmt->fetchAll();
                
                foreach ($phoneDupes as $dupe) {
                    $ids = explode(',', $dupe['ids']);
                    // Check if these IDs are already in a group
                    $alreadyGrouped = false;
                    foreach ($duplicateGroups as $group) {
                        if (count(array_intersect($ids, $group)) > 0) {
                            $alreadyGrouped = true;
                            break;
                        }
                    }
                    if (!$alreadyGrouped) {
                        $duplicateGroups[] = $ids;
                    }
                }
            }
            
            // Process each duplicate group
            foreach ($duplicateGroups as $group) {
                $idsToRemove = [];
                
                if ($keepStrategy === 'oldest') {
                    // Keep first (oldest), remove rest
                    $idsToRemove = array_slice($group, 1);
                } elseif ($keepStrategy === 'newest') {
                    // Keep last (newest), remove rest
                    $idsToRemove = array_slice($group, 0, -1);
                } elseif ($keepStrategy === 'specific') {
                    // Keep specified IDs, remove others
                    $idsToRemove = array_diff($group, $specificKeepIds);
                }
                
                if (!empty($idsToRemove)) {
                    $placeholders = str_repeat('?,', count($idsToRemove) - 1) . '?';
                    
                    // Delete tags first
                    $pdo->prepare("DELETE FROM recipient_tags WHERE recipient_id IN ($placeholders)")->execute($idsToRemove);
                    
                    // Delete contacts
                    $stmt = $pdo->prepare("DELETE FROM recipients WHERE id IN ($placeholders) AND {$scopeCol} = ?");
                    $stmt->execute(array_merge($idsToRemove, [$scopeVal]));
                    $removedCount += $stmt->rowCount();
                }
            }
            
            $pdo->commit();
            
            Response::json([
                'message' => "Successfully removed $removedCount duplicate contacts",
                'removedCount' => $removedCount
            ]);
            
        } catch (Exception $e) {
            $pdo->rollBack();
            Response::json(['error' => 'Failed to remove duplicates: ' . $e->getMessage()], 500);
        }
    }
    
    /**
     * Merge duplicate contacts into one
     */
    public static function mergeDuplicates(): void {
        $userId = Auth::userIdOrFail();
        $data = get_json_input();
        $pdo = Database::conn();
        
        if (empty($data['contactIds']) || !is_array($data['contactIds']) || count($data['contactIds']) < 2) {
            Response::json(['error' => 'At least 2 contact IDs required for merge'], 400);
            return;
        }
        
        $contactIds = $data['contactIds'];
        $primaryId = $data['primaryId'] ?? $contactIds[0]; // The contact to keep
        
        // Use workspace scoping
        $ctx = $GLOBALS['tenantContext'] ?? null;
        $scopeCol = ($ctx && isset($ctx->workspaceId)) ? 'workspace_id' : 'user_id';
        $scopeVal = ($ctx && isset($ctx->workspaceId)) ? (int)$ctx->workspaceId : $userId;

        // Verify all contacts belong to user
        $placeholders = str_repeat('?,', count($contactIds) - 1) . '?';
        $stmt = $pdo->prepare("SELECT * FROM recipients WHERE id IN ($placeholders) AND {$scopeCol} = ?");
        $stmt->execute(array_merge($contactIds, [$scopeVal]));
        $contacts = $stmt->fetchAll();
        
        if (count($contacts) !== count($contactIds)) {
            Response::json(['error' => 'Some contacts not found'], 404);
            return;
        }
        
        // Find primary contact
        $primaryContact = null;
        $secondaryContacts = [];
        foreach ($contacts as $contact) {
            if ($contact['id'] == $primaryId) {
                $primaryContact = $contact;
            } else {
                $secondaryContacts[] = $contact;
            }
        }
        
        if (!$primaryContact) {
            Response::json(['error' => 'Primary contact not found'], 404);
            return;
        }
        
        $pdo->beginTransaction();
        
        try {
            // Merge data from secondary contacts into primary (fill empty fields)
            $fieldsToMerge = [
                'first_name', 'last_name', 'email', 'phone', 'company', 'title',
                'address', 'city', 'state', 'country', 'postal_code',
                'website', 'linkedin', 'twitter', 'notes', 'additional_details',
                'birthday', 'lead_source', 'industry', 'company_size', 'annual_revenue',
                'type', 'lead_status'
            ];
            
            $updates = [];
            $updateParams = [];
            
            foreach ($fieldsToMerge as $field) {
                if (empty($primaryContact[$field])) {
                    // Find first non-empty value from secondary contacts
                    foreach ($secondaryContacts as $secondary) {
                        if (!empty($secondary[$field])) {
                            $updates[] = "$field = ?";
                            $updateParams[] = $secondary[$field];
                            break;
                        }
                    }
                }
            }
            
            // Update primary contact with merged data
            if (!empty($updates)) {
                $updateParams[] = $primaryId;
                $updateParams[] = $scopeVal;
                $stmt = $pdo->prepare("UPDATE recipients SET " . implode(', ', $updates) . ", updated_at = NOW() WHERE id = ? AND {$scopeCol} = ?");
                $stmt->execute($updateParams);
            }
            
            // Merge tags from all contacts
            $secondaryIds = array_column($secondaryContacts, 'id');
            $allIds = array_merge([$primaryId], $secondaryIds);
            $placeholders = str_repeat('?,', count($allIds) - 1) . '?';
            
            $tagStmt = $pdo->prepare("SELECT DISTINCT tag_id FROM recipient_tags WHERE recipient_id IN ($placeholders)");
            $tagStmt->execute($allIds);
            $allTags = array_column($tagStmt->fetchAll(), 'tag_id');
            
            // Add all tags to primary contact
            foreach ($allTags as $tagId) {
                $pdo->prepare("INSERT IGNORE INTO recipient_tags (recipient_id, tag_id) VALUES (?, ?)")->execute([$primaryId, $tagId]);
            }
            
            // Delete secondary contacts
            if (!empty($secondaryIds)) {
                $secondaryPlaceholders = str_repeat('?,', count($secondaryIds) - 1) . '?';
                $pdo->prepare("DELETE FROM recipient_tags WHERE recipient_id IN ($secondaryPlaceholders)")->execute($secondaryIds);
                $stmt = $pdo->prepare("DELETE FROM recipients WHERE id IN ($secondaryPlaceholders) AND {$scopeCol} = ?");
                $stmt->execute(array_merge($secondaryIds, [$scopeVal]));
            }
            
            $pdo->commit();
            
            Response::json([
                'message' => 'Contacts merged successfully',
                'primaryId' => $primaryId,
                'mergedCount' => count($secondaryIds)
            ]);
            
        } catch (Exception $e) {
            $pdo->rollBack();
            Response::json(['error' => 'Failed to merge contacts: ' . $e->getMessage()], 500);
        }
    }
}