<?php
require_once __DIR__ . '/../Database.php';
require_once __DIR__ . '/../Response.php';
require_once __DIR__ . '/../Auth.php';
require_once __DIR__ . '/../TenantContext.php';

class CRMController {
    
    private static function getUserId(): int {
        return Auth::userIdOrFail();
    }
    
    /**
     * Get workspace scope for multi-tenant queries
     */
    private static function getWorkspaceScope(): array {
        $ctx = $GLOBALS['tenantContext'] ?? null;
        if ($ctx && isset($ctx->workspaceId)) {
            return ['col' => 'workspace_id', 'val' => (int)$ctx->workspaceId];
        }
        return ['col' => 'user_id', 'val' => Auth::userIdOrFail()];
    }
    
    /**
     * Get company scope for multi-company queries
     */
    private static function getCompanyScope(): ?int {
        $ctx = $GLOBALS['tenantContext'] ?? null;
        return $ctx->activeCompanyId ?? null;
    }

    /**
     * Normalize incoming data from camelCase to snake_case
     */
    private static function normalizeData(array $data): array {
        $normalized = [];
        foreach ($data as $key => $value) {
            // Convert camelCase to snake_case
            $snakeKey = strtolower(preg_replace('/[A-Z]/', '_$0', $key));
            $normalized[$snakeKey] = $value;
        }
        return $normalized;
    }
    
    /**
     * Get CRM dashboard data
     */
    public static function getDashboard(): void {
        try {
            $userId = self::getUserId();
            $db = Database::conn();
            
            // Get workspace scope
            $scope = self::getWorkspaceScope();
            $companyId = self::getCompanyScope();
            
            // Get dashboard metrics
            $whereConditions = ["l.{$scope['col']} = ?"];
            $params = [$scope['val']];
            
            if ($companyId) {
                $whereConditions[] = "l.company_id = ?";
                $params[] = $companyId;
            }
            
            $whereClause = implode(' AND ', $whereConditions);
            
            $query = "
                SELECT 
                    COUNT(DISTINCT l.id) as total_leads,
                    COUNT(DISTINCT CASE WHEN l.lead_stage = 'new' THEN l.id END) as new_leads,
                    COUNT(DISTINCT CASE WHEN l.lead_stage = 'qualified' THEN l.id END) as qualified_leads,
                    COUNT(DISTINCT CASE WHEN l.lead_stage = 'closed_won' THEN l.id END) as won_deals,
                    COUNT(DISTINCT CASE WHEN l.lead_stage = 'closed_lost' THEN l.id END) as lost_deals,
                    COALESCE(SUM(CASE WHEN l.lead_stage = 'closed_won' THEN l.lead_value ELSE 0 END), 0) as total_value,
                    COALESCE(AVG(l.lead_score), 0) as avg_lead_score,
                    COUNT(DISTINCT la.id) as total_activities,
                    COUNT(DISTINCT CASE WHEN la.activity_date >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN la.id END) as activities_this_week
                FROM leads l
                LEFT JOIN lead_activities la ON l.id = la.lead_id
                WHERE $whereClause
            ";
            
            $stmt = $db->prepare($query);
            $stmt->execute($params);
            $metrics = $stmt->fetch(PDO::FETCH_ASSOC);
            
            // Get recent activities
            $activitiesQuery = "
                SELECT la.*, r.first_name, r.last_name, r.email, l.lead_stage
                FROM lead_activities la
                JOIN leads l ON la.lead_id = l.id
                JOIN recipients r ON la.contact_id = r.id
                WHERE $whereClause
                ORDER BY la.activity_date DESC
                LIMIT 10
            ";
            
            $stmt = $db->prepare($activitiesQuery);
            $stmt->execute($params);
            $recentActivities = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Get pipeline data
            $pipelineQuery = "
                SELECT l.lead_stage, COUNT(*) as count, COALESCE(SUM(l.lead_value), 0) as total_value
                FROM leads l
                WHERE $whereClause
                GROUP BY l.lead_stage
                ORDER BY FIELD(l.lead_stage, 'new', 'contacted', 'qualified', 'proposal', 'negotiation', 'closed_won', 'closed_lost')
            ";
            
            $stmt = $db->prepare($pipelineQuery);
            $stmt->execute($params);
            $pipelineData = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            Response::success([
                'metrics' => $metrics,
                'recentActivities' => $recentActivities,
                'pipelineData' => $pipelineData
            ]);
            
        } catch (Exception $e) {
            error_log('CRMController::getDashboard error: ' . $e->getMessage());
            Response::error('Failed to load CRM dashboard: ' . $e->getMessage());
        }
    }
    
    /**
     * Get all leads for the current user
     */
    public static function getLeads(): void {
        try {
            $userId = self::getUserId();
            $db = Database::conn();
            
            $page = max(1, intval($_GET['page'] ?? 1));
            $limit = max(1, min(100, intval($_GET['limit'] ?? 20)));
            $offset = ($page - 1) * $limit;
            
            $filters = [
                'stage' => $_GET['stage'] ?? null,
                'source' => $_GET['source'] ?? null,
                'score_min' => $_GET['score_min'] ?? null,
                'score_max' => $_GET['score_max'] ?? null,
                'search' => $_GET['search'] ?? null
            ];
            
            // Get workspace scope
            $scope = self::getWorkspaceScope();
            $companyId = self::getCompanyScope();
            
            $whereConditions = ["l.{$scope['col']} = ?"];
            $params = [$scope['val']];
            
            if ($companyId) {
                $whereConditions[] = "l.company_id = ?";
                $params[] = $companyId;
            }
            
            if ($filters['stage']) {
                $whereConditions[] = "l.lead_stage = ?";
                $params[] = $filters['stage'];
            }
            
            if ($filters['source']) {
                $whereConditions[] = "l.source = ?";
                $params[] = $filters['source'];
            }
            
            if ($filters['score_min']) {
                $whereConditions[] = "l.lead_score >= ?";
                $params[] = $filters['score_min'];
            }
            
            if ($filters['score_max']) {
                $whereConditions[] = "l.lead_score <= ?";
                $params[] = $filters['score_max'];
            }
            
            if ($filters['search']) {
                $whereConditions[] = "(CONCAT(r.first_name, ' ', r.last_name) LIKE ? OR r.email LIKE ? OR r.company LIKE ?)";
                $searchTerm = '%' . $filters['search'] . '%';
                $params[] = $searchTerm;
                $params[] = $searchTerm;
                $params[] = $searchTerm;
            }
            
            $whereClause = implode(' AND ', $whereConditions);
            
            // Get total count
            $countQuery = "SELECT COUNT(*) as total FROM leads l JOIN recipients r ON l.contact_id = r.id WHERE $whereClause";
            $stmt = $db->prepare($countQuery);
            $stmt->execute($params);
            $total = $stmt->fetch(PDO::FETCH_ASSOC)['total'];
            
            // Get leads
            $query = "
                SELECT 
                    l.*,
                    r.first_name, r.last_name, r.email, r.phone, r.company, r.lead_status, r.lead_rating,
                    CONCAT(r.first_name, ' ', r.last_name) as contact_name,
                    ua.name as assigned_agent_name,
                    c.name as campaign_name,
                    GROUP_CONCAT(DISTINCT lt.name) as tags
                FROM leads l
                JOIN recipients r ON l.contact_id = r.id
                LEFT JOIN users ua ON l.assigned_agent_id = ua.id
                LEFT JOIN campaigns c ON l.campaign_id = c.id
                LEFT JOIN lead_tag_relations ltr ON l.id = ltr.lead_id
                LEFT JOIN lead_tags lt ON ltr.tag_id = lt.id
                WHERE $whereClause
                GROUP BY l.id
                ORDER BY l.lead_score DESC, l.updated_at DESC
                LIMIT ? OFFSET ?
            ";
            
            $params[] = $limit;
            $params[] = $offset;
            
            $stmt = $db->prepare($query);
            $stmt->execute($params);
            $leads = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Format leads
            foreach ($leads as &$lead) {
                $lead['tags'] = $lead['tags'] ? explode(',', $lead['tags']) : [];
                $lead['lead_value'] = floatval($lead['lead_value']);
            }
            
            Response::success([
                'leads' => $leads,
                'pagination' => [
                    'page' => $page,
                    'limit' => $limit,
                    'total' => $total,
                    'totalPages' => ceil($total / $limit)
                ]
            ]);
            
        } catch (Exception $e) {
            Response::error('Failed to get leads: ' . $e->getMessage());
        }
    }
    
    /**
     * Create a new lead
     */
    public static function createLead(): void {
        try {
            $userId = self::getUserId();
            $db = Database::conn();
            
            $data = json_decode(file_get_contents('php://input'), true);
        $data = self::normalizeData($data);
            
            // Validate required fields
            if (empty($data['contact_id'])) {
                Response::error('Contact ID is required');
                return;
            }
            
            // Get workspace scope
            $scope = self::getWorkspaceScope();
            $companyId = self::getCompanyScope();
            
            // Check if lead already exists for this contact
            $checkQuery = "SELECT id FROM leads WHERE contact_id = ? AND {$scope['col']} = ?";
            $stmt = $db->prepare($checkQuery);
            $stmt->execute([$data['contact_id'], $scope['val']]);
            if ($stmt->fetch()) {
                Response::error('Lead already exists for this contact');
                return;
            }
            
            // Insert lead
            $query = "
                INSERT INTO leads (
                    contact_id, user_id, workspace_id, company_id, lead_score, lead_stage, lead_value, 
                    probability, expected_close_date, assigned_agent_id, source, campaign_id
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ";
            
            $stmt = $db->prepare($query);
            $stmt->execute([
                $data['contact_id'],
                $userId,
                $scope['col'] === 'workspace_id' ? $scope['val'] : null,
                $companyId,
                $data['lead_score'] ?? 0,
                $data['lead_stage'] ?? 'new',
                $data['lead_value'] ?? null,
                $data['probability'] ?? 0,
                $data['expected_close_date'] ?? null,
                $data['assigned_agent_id'] ?? null,
                $data['source'] ?? null,
                $data['campaign_id'] ?? null
            ]);
            
            $leadId = $db->lastInsertId();
            
            // Update recipient lead status
            $updateQuery = "UPDATE recipients SET lead_status = 'lead' WHERE id = ?";
            $stmt = $db->prepare($updateQuery);
            $stmt->execute([$data['contact_id']]);
            
            Response::success(['lead_id' => $leadId, 'message' => 'Lead created successfully']);
            
        } catch (Exception $e) {
            Response::error('Failed to create lead: ' . $e->getMessage());
        }
    }
    
    /**
     * Update a lead
     */
    public static function updateLead(int $leadId): void {
        try {
            $userId = self::getUserId();
            $db = Database::conn();
            
            // Get workspace/user scope
            $scope = self::getWorkspaceScope();
            
            // Check if lead belongs to user/workspace
            $checkQuery = "SELECT id FROM leads WHERE id = ? AND {$scope['col']} = ?";
            $stmt = $db->prepare($checkQuery);
            $stmt->execute([$leadId, $scope['val']]);
            if (!$stmt->fetch()) {
                Response::error('Lead not found', 404);
                return;
            }
            
            $data = json_decode(file_get_contents('php://input'), true);
            $data = self::normalizeData($data);
            
            $updateFields = [];
            $params = [];
            
            $allowedFields = ['lead_score', 'lead_stage', 'lead_value', 'probability', 
                             'expected_close_date', 'assigned_agent_id', 'source'];
            
            foreach ($allowedFields as $field) {
                if (array_key_exists($field, $data)) {
                    $updateFields[] = "$field = ?";
                    $params[] = $data[$field];
                }
            }
            
            if (empty($updateFields)) {
                Response::error('No valid fields to update');
                return;
            }
            
            $params[] = $leadId;
            $params[] = $scope['val'];
            
            $query = "UPDATE leads SET " . implode(', ', $updateFields) . " WHERE id = ? AND {$scope['col']} = ?";
            $stmt = $db->prepare($query);
            $stmt->execute($params);
            
            Response::success(['message' => 'Lead updated successfully']);
            
        } catch (Exception $e) {
            Response::error('Failed to update lead: ' . $e->getMessage());
        }
    }
    
    /**
     * Get lead activities
     */
    public static function getLeadActivities(int $leadId): void {
        try {
            $userId = self::getUserId();
            $db = Database::conn();
            
            // Get workspace/user scope
            $scope = self::getWorkspaceScope();
            
            // Check if lead belongs to user/workspace
            $checkQuery = "SELECT id FROM leads WHERE id = ? AND {$scope['col']} = ?";
            $stmt = $db->prepare($checkQuery);
            $stmt->execute([$leadId, $scope['val']]);
            if (!$stmt->fetch()) {
                Response::error('Lead not found', 404);
                return;
            }
            
            $query = "
                SELECT 
                    la.*,
                    u.name as user_name,
                    CONCAT(r.first_name, ' ', r.last_name) as contact_name,
                    r.email as contact_email
                FROM lead_activities la
                JOIN users u ON la.user_id = u.id
                JOIN recipients r ON la.contact_id = r.id
                WHERE la.lead_id = ?
                ORDER BY la.activity_date DESC
            ";
            
            $stmt = $db->prepare($query);
            $stmt->execute([$leadId]);
            $activities = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            Response::success(['activities' => $activities]);
            
        } catch (Exception $e) {
            Response::error('Failed to get lead activities: ' . $e->getMessage());
        }
    }
    
    /**
     * Add lead activity
     */
    public static function addLeadActivity(int $leadId): void {
        try {
            $userId = self::getUserId();
            $db = Database::conn();
            
            // Get workspace/user scope
            $scope = self::getWorkspaceScope();
            
            // Check if lead belongs to user/workspace
            $checkQuery = "SELECT id, contact_id FROM leads WHERE id = ? AND {$scope['col']} = ?";
            $stmt = $db->prepare($checkQuery);
            $stmt->execute([$leadId, $scope['val']]);
            $lead = $stmt->fetch();
            if (!$lead) {
                Response::error('Lead not found', 404);
                return;
            }
            
            $data = json_decode(file_get_contents('php://input'), true);
            $data = self::normalizeData($data);
            
            // Validate required fields
            if (empty($data['activity_type']) || empty($data['activity_title'])) {
                Response::error('Activity type and title are required');
                return;
            }
            
            $query = "
                INSERT INTO lead_activities (
                    lead_id, contact_id, user_id, activity_type, activity_title, 
                    activity_description, activity_date, duration_minutes, outcome, 
                    next_action, next_action_date, campaign_id
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ";
            
            $stmt = $db->prepare($query);
            $stmt->execute([
                $leadId,
                $lead['contact_id'],
                $userId,
                $data['activity_type'],
                $data['activity_title'],
                $data['activity_description'] ?? null,
                $data['activity_date'] ?? date('Y-m-d H:i:s'),
                $data['duration_minutes'] ?? null,
                $data['outcome'] ?? null,
                $data['next_action'] ?? null,
                $data['next_action_date'] ?? null,
                $data['campaign_id'] ?? null
            ]);
            
            // Update lead's last activity
            $updateQuery = "UPDATE leads SET last_activity_at = NOW() WHERE id = ?";
            $stmt = $db->prepare($updateQuery);
            $stmt->execute([$leadId]);
            
            Response::success(['activity_id' => $db->lastInsertId(), 'message' => 'Activity added successfully']);
            
        } catch (Exception $e) {
            Response::error('Failed to add activity: ' . $e->getMessage());
        }
    }
    
    /**
     * Get CRM tasks
     */
    public static function getTasks(): void {
        try {
            $userId = self::getUserId();
            $db = Database::conn();
            
            $filters = [
                'status' => $_GET['status'] ?? null,
                'priority' => $_GET['priority'] ?? null,
                'assigned_to' => $_GET['assigned_to'] ?? null,
                'overdue' => $_GET['overdue'] === 'true'
            ];
            
            $whereConditions = ["(t.assigned_to = ? OR t.created_by = ?)"];
            $params = [$userId, $userId];
            
            if ($filters['status']) {
                $whereConditions[] = "t.status = ?";
                $params[] = $filters['status'];
            }
            
            if ($filters['priority']) {
                $whereConditions[] = "t.priority = ?";
                $params[] = $filters['priority'];
            }
            
            if ($filters['assigned_to']) {
                $whereConditions[] = "t.assigned_to = ?";
                $params[] = $filters['assigned_to'];
            }
            
            if ($filters['overdue']) {
                $whereConditions[] = "t.due_date < NOW() AND t.status != 'completed'";
            }
            
            $whereClause = implode(' AND ', $whereConditions);
            
            $query = "
                SELECT 
                    t.*,
                    CONCAT(r.first_name, ' ', r.last_name) as contact_name,
                    r.email as contact_email,
                    l.lead_stage,
                    creator.name as created_by_name,
                    assignee.name as assigned_to_name
                FROM crm_tasks t
                JOIN recipients r ON t.contact_id = r.id
                JOIN leads l ON t.lead_id = l.id
                JOIN users creator ON t.created_by = creator.id
                LEFT JOIN users assignee ON t.assigned_to = assignee.id
                WHERE $whereClause
                ORDER BY t.priority DESC, t.due_date ASC
            ";
            
            $stmt = $db->prepare($query);
            $stmt->execute($params);
            $tasks = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            Response::success(['tasks' => $tasks]);
            
        } catch (Exception $e) {
            Response::error('Failed to get tasks: ' . $e->getMessage());
        }
    }
    
    /**
     * Create CRM task
     */
    public static function createTask(): void {
        try {
            $userId = self::getUserId();
            $db = Database::conn();
            
            $data = json_decode(file_get_contents('php://input'), true);
            $data = self::normalizeData($data);
            
            // Validate required fields
            if (empty($data['lead_id']) || empty($data['contact_id']) || empty($data['title'])) {
                Response::error('Lead ID, Contact ID, and Title are required');
                return;
            }
            
            // Get workspace/user scope
            $scope = self::getWorkspaceScope();
            
            // Check if lead belongs to user/workspace
            $checkQuery = "SELECT id FROM leads WHERE id = ? AND {$scope['col']} = ?";
            $stmt = $db->prepare($checkQuery);
            $stmt->execute([$data['lead_id'], $scope['val']]);
            if (!$stmt->fetch()) {
                Response::error('Lead not found', 404);
                return;
            }
            
            $query = "
                INSERT INTO crm_tasks (
                    lead_id, contact_id, assigned_to, created_by, title, description,
                    task_type, status, priority, due_date
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ";
            
            $stmt = $db->prepare($query);
            $stmt->execute([
                $data['lead_id'],
                $data['contact_id'],
                $data['assigned_to'] ?? $userId,
                $userId,
                $data['title'],
                $data['description'] ?? null,
                $data['task_type'] ?? 'follow_up',
                $data['status'] ?? 'pending',
                $data['priority'] ?? 'medium',
                $data['due_date'] ?? null
            ]);
            
            Response::success(['task_id' => $db->lastInsertId(), 'message' => 'Task created successfully']);
            
        } catch (Exception $e) {
            Response::error('Failed to create task: ' . $e->getMessage());
        }
    }
    
    /**
     * Update task status
     */
    public static function updateTaskStatus(int $taskId): void {
        try {
            $userId = self::getUserId();
            $db = Database::conn();
            
            // Check if task belongs to user
            $checkQuery = "SELECT id FROM crm_tasks WHERE id = ? AND (assigned_to = ? OR created_by = ?)";
            $stmt = $db->prepare($checkQuery);
            $stmt->execute([$taskId, $userId, $userId]);
            if (!$stmt->fetch()) {
                Response::error('Task not found', 404);
                return;
            }
            
            $data = json_decode(file_get_contents('php://input'), true);
            $status = $data['status'] ?? null;
            
            if (!$status) {
                Response::error('Status is required');
                return;
            }
            
            $updateQuery = "UPDATE crm_tasks SET status = ?, completed_at = ? WHERE id = ?";
            $stmt = $db->prepare($updateQuery);
            $stmt->execute([
                $status,
                $status === 'completed' ? date('Y-m-d H:i:s') : null,
                $taskId
            ]);
            
            Response::success(['message' => 'Task updated successfully']);
            
        } catch (Exception $e) {
            Response::error('Failed to update task: ' . $e->getMessage());
        }
    }
    
    /**
     * Get all activities across all leads
     */
    public static function getAllActivities(): void {
        try {
            $userId = self::getUserId();
            $db = Database::conn();
            
            $page = max(1, intval($_GET['page'] ?? 1));
            $limit = max(1, min(100, intval($_GET['limit'] ?? 50)));
            $offset = ($page - 1) * $limit;
            
            $filters = [
                'type' => $_GET['type'] ?? null,
                'search' => $_GET['search'] ?? null,
                'date_from' => $_GET['date_from'] ?? null,
                'date_to' => $_GET['date_to'] ?? null
            ];
            
            $whereConditions = ["l.user_id = ?"];
            $params = [$userId];
            
            if ($filters['type'] && $filters['type'] !== 'all') {
                $whereConditions[] = "la.activity_type = ?";
                $params[] = $filters['type'];
            }
            
            if ($filters['search']) {
                $whereConditions[] = "(la.activity_title LIKE ? OR la.activity_description LIKE ? OR CONCAT(r.first_name, ' ', r.last_name) LIKE ? OR r.email LIKE ?)";
                $searchTerm = '%' . $filters['search'] . '%';
                $params[] = $searchTerm;
                $params[] = $searchTerm;
                $params[] = $searchTerm;
                $params[] = $searchTerm;
            }
            
            if ($filters['date_from']) {
                $whereConditions[] = "la.activity_date >= ?";
                $params[] = $filters['date_from'];
            }
            
            if ($filters['date_to']) {
                $whereConditions[] = "la.activity_date <= ?";
                $params[] = $filters['date_to'];
            }
            
            $whereClause = implode(' AND ', $whereConditions);
            
            // Get total count
            $countQuery = "
                SELECT COUNT(*) as total 
                FROM lead_activities la
                JOIN leads l ON la.lead_id = l.id
                JOIN recipients r ON la.contact_id = r.id
                WHERE $whereClause
            ";
            $stmt = $db->prepare($countQuery);
            $stmt->execute($params);
            $total = $stmt->fetch(PDO::FETCH_ASSOC)['total'];
            
            // Get activities
            $query = "
                SELECT 
                    la.*,
                    r.first_name, r.last_name, r.email, r.phone, r.company,
                    l.lead_stage, l.lead_value, l.lead_score,
                    u.name as user_name,
                    c.name as campaign_name
                FROM lead_activities la
                JOIN leads l ON la.lead_id = l.id
                JOIN recipients r ON la.contact_id = r.id
                JOIN users u ON la.user_id = u.id
                LEFT JOIN campaigns c ON la.campaign_id = c.id
                WHERE $whereClause
                ORDER BY la.activity_date DESC
                LIMIT ? OFFSET ?
            ";
            
            $params[] = $limit;
            $params[] = $offset;
            
            $stmt = $db->prepare($query);
            $stmt->execute($params);
            $activities = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Get activity type counts for filters
            $typeCountQuery = "
                SELECT la.activity_type, COUNT(*) as count
                FROM lead_activities la
                JOIN leads l ON la.lead_id = l.id
                WHERE l.user_id = ?
                GROUP BY la.activity_type
            ";
            $stmt = $db->prepare($typeCountQuery);
            $stmt->execute([$userId]);
            $typeCounts = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            Response::success([
                'activities' => $activities,
                'typeCounts' => $typeCounts,
                'pagination' => [
                    'page' => $page,
                    'limit' => $limit,
                    'total' => $total,
                    'totalPages' => ceil($total / $limit)
                ]
            ]);
            
        } catch (Exception $e) {
            error_log('CRMController::getAllActivities error: ' . $e->getMessage());
            Response::error('Failed to get activities: ' . $e->getMessage());
        }
    }
    
    /**
     * Get CRM statistics for analytics
     */
    public static function getAnalytics(): void {
        try {
            $userId = self::getUserId();
            $db = Database::conn();
            
            $scope = self::getWorkspaceScope();
            $companyScope = self::getCompanyScope();
            
            $whereConditions = ["l.{$scope['col']} = ?"];
            $params = [$scope['val']];
            
            if ($companyScope) {
                $whereConditions[] = "l.company_id = ?";
                $params[] = $companyScope;
            }

            $whereClause = implode(' AND ', $whereConditions);

            // Pipeline metrics
            $pipelineQuery = "
                SELECT 
                    lead_stage,
                    COUNT(*) as count,
                    COALESCE(SUM(lead_value), 0) as total_value,
                    COALESCE(AVG(lead_score), 0) as avg_score
                FROM leads l
                WHERE $whereClause
                GROUP BY lead_stage
                ORDER BY FIELD(lead_stage, 'new', 'contacted', 'qualified', 'proposal', 'negotiation', 'closed_won', 'closed_lost')
            ";
            $stmt = $db->prepare($pipelineQuery);
            $stmt->execute($params);
            $pipelineData = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Conversion funnel
            $funnelQuery = "
                SELECT 
                    COUNT(DISTINCT CASE WHEN lead_stage IN ('new', 'contacted', 'qualified', 'proposal', 'negotiation', 'closed_won', 'closed_lost') THEN id END) as total_leads,
                    COUNT(DISTINCT CASE WHEN lead_stage IN ('contacted', 'qualified', 'proposal', 'negotiation', 'closed_won', 'closed_lost') THEN id END) as contacted,
                    COUNT(DISTINCT CASE WHEN lead_stage IN ('qualified', 'proposal', 'negotiation', 'closed_won', 'closed_lost') THEN id END) as qualified,
                    COUNT(DISTINCT CASE WHEN lead_stage IN ('proposal', 'negotiation', 'closed_won', 'closed_lost') THEN id END) as proposal,
                    COUNT(DISTINCT CASE WHEN lead_stage IN ('negotiation', 'closed_won', 'closed_lost') THEN id END) as negotiation,
                    COUNT(DISTINCT CASE WHEN lead_stage = 'closed_won' THEN id END) as closed_won,
                    COUNT(DISTINCT CASE WHEN lead_stage = 'closed_lost' THEN id END) as closed_lost
                FROM leads l
                WHERE $whereClause
            ";
            $stmt = $db->prepare($funnelQuery);
            $stmt->execute($params);
            $funnelData = $stmt->fetch(PDO::FETCH_ASSOC);
            
            $period = $_GET['period'] ?? '30'; // days
            $periodDays = intval($period);

            // Activity trends (last N days)
            $activityTrendQuery = "
                SELECT 
                    DATE(la.activity_date) as date,
                    la.activity_type,
                    COUNT(*) as count
                FROM lead_activities la
                JOIN leads l ON la.lead_id = l.id
                WHERE $whereClause AND la.activity_date >= DATE_SUB(NOW(), INTERVAL ? DAY)
                GROUP BY DATE(la.activity_date), la.activity_type
                ORDER BY date ASC
            ";
            $stmt = $db->prepare($activityTrendQuery);
            $activityParams = array_merge($params, [$periodDays]);
            $stmt->execute($activityParams);
            $activityTrends = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Lead sources breakdown
            $sourcesQuery = "
                SELECT 
                    COALESCE(source, 'Unknown') as source,
                    COUNT(*) as count,
                    COALESCE(SUM(lead_value), 0) as total_value,
                    COUNT(CASE WHEN lead_stage = 'closed_won' THEN 1 END) as won_count
                FROM leads l
                WHERE $whereClause
                GROUP BY source
                ORDER BY count DESC
                LIMIT 10
            ";
            $stmt = $db->prepare($sourcesQuery);
            $stmt->execute($params);
            $sourcesData = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Top performers (leads with highest values)
            $topLeadsQuery = "
                SELECT 
                    l.id, l.lead_value, l.lead_score, l.lead_stage, l.source,
                    r.first_name, r.last_name, r.email, r.company
                FROM leads l
                JOIN recipients r ON l.contact_id = r.id
                WHERE $whereClause AND l.lead_stage NOT IN ('closed_won', 'closed_lost')
                ORDER BY l.lead_value DESC
                LIMIT 10
            ";
            $stmt = $db->prepare($topLeadsQuery);
            $stmt->execute($params);
            $topLeads = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Win/Loss ratio over time
            $winLossQuery = "
                SELECT 
                    DATE_FORMAT(updated_at, '%Y-%m') as month,
                    COUNT(CASE WHEN lead_stage = 'closed_won' THEN 1 END) as won,
                    COUNT(CASE WHEN lead_stage = 'closed_lost' THEN 1 END) as lost,
                    COALESCE(SUM(CASE WHEN lead_stage = 'closed_won' THEN lead_value ELSE 0 END), 0) as won_value
                FROM leads l
                WHERE $whereClause AND lead_stage IN ('closed_won', 'closed_lost')
                    AND updated_at >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
                GROUP BY DATE_FORMAT(updated_at, '%Y-%m')
                ORDER BY month ASC
            ";
            $stmt = $db->prepare($winLossQuery);
            $stmt->execute($params);
            $winLossData = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Average time in each stage
            $stageTimeQuery = "
                SELECT 
                    lead_stage,
                    AVG(DATEDIFF(updated_at, created_at)) as avg_days
                FROM leads l
                WHERE $whereClause
                GROUP BY lead_stage
            ";
            $stmt = $db->prepare($stageTimeQuery);
            $stmt->execute($params);
            $stageTimeData = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            Response::success([
                'pipeline' => $pipelineData,
                'funnel' => $funnelData,
                'activityTrends' => $activityTrends,
                'sources' => $sourcesData,
                'topLeads' => $topLeads,
                'winLoss' => $winLossData,
                'stageTime' => $stageTimeData
            ]);
            
        } catch (Exception $e) {
            error_log('CRMController::getAnalytics error: ' . $e->getMessage());
            Response::error('Failed to get analytics: ' . $e->getMessage());
        }
    }
    
    // =====================================================
    // GOALS MANAGEMENT
    // =====================================================
    
    /**
     * Get daily goals for the current user
     */
    public static function getDailyGoals(): void {
        try {
            $userId = self::getUserId();
            $db = Database::conn();
            $scope = self::getWorkspaceScope();
            
            $today = date('Y-m-d');
            
            // Get or create today's goal
            $query = "
                SELECT * FROM crm_goals 
                WHERE user_id = ? AND goal_type = 'daily' 
                AND period_start = ? AND period_end = ?
                LIMIT 1
            ";
            
            $stmt = $db->prepare($query);
            $stmt->execute([$userId, $today, $today]);
            $goal = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$goal) {
                // Create default daily goal
                $insertQuery = "
                    INSERT INTO crm_goals (
                        user_id, workspace_id, goal_type, period_start, period_end,
                        calls_goal, emails_goal, meetings_goal, tasks_goal
                    ) VALUES (?, ?, 'daily', ?, ?, 20, 50, 5, 10)
                ";
                $stmt = $db->prepare($insertQuery);
                $stmt->execute([
                    $userId,
                    $scope['col'] === 'workspace_id' ? $scope['val'] : null,
                    $today,
                    $today
                ]);
                
                $goalId = $db->lastInsertId();
                $stmt = $db->prepare($query);
                $stmt->execute([$userId, $today, $today]);
                $goal = $stmt->fetch(PDO::FETCH_ASSOC);
            }
            
            Response::success($goal);
            
        } catch (Exception $e) {
            error_log('CRMController::getDailyGoals error: ' . $e->getMessage());
            Response::error('Failed to get daily goals: ' . $e->getMessage());
        }
    }
    
    /**
     * Update daily goals
     */
    public static function updateDailyGoals(): void {
        try {
            $userId = self::getUserId();
            $db = Database::conn();
            $data = json_decode(file_get_contents('php://input'), true);
            
            $today = date('Y-m-d');
            
            $updateQuery = "
                UPDATE crm_goals SET
                    calls_goal = ?,
                    emails_goal = ?,
                    meetings_goal = ?,
                    tasks_goal = ?
                WHERE user_id = ? AND goal_type = 'daily' 
                AND period_start = ? AND period_end = ?
            ";
            
            $stmt = $db->prepare($updateQuery);
            $stmt->execute([
                $data['calls_goal'] ?? 20,
                $data['emails_goal'] ?? 50,
                $data['meetings_goal'] ?? 5,
                $data['tasks_goal'] ?? 10,
                $userId,
                $today,
                $today
            ]);
            
            Response::success(['message' => 'Goals updated successfully']);
            
        } catch (Exception $e) {
            Response::error('Failed to update goals: ' . $e->getMessage());
        }
    }
    
    // =====================================================
    // FORECASTING
    // =====================================================
    
    /**
     * Get revenue forecast
     */
    public static function getForecast(): void {
        try {
            $userId = self::getUserId();
            $db = Database::conn();
            $scope = self::getWorkspaceScope();
            
            $period = $_GET['period'] ?? 'monthly';
            $startDate = $_GET['start_date'] ?? date('Y-m-01');
            $endDate = $_GET['end_date'] ?? date('Y-m-t');
            
            // Get existing forecast (if table exists). If table missing, fall back to calculation.
            $query = "
                SELECT * FROM crm_forecasts 
                WHERE user_id = ? AND forecast_period = ?
                AND period_start = ? AND period_end = ?
                LIMIT 1
            ";
            try {
                $stmt = $db->prepare($query);
                $stmt->execute([$userId, $period, $startDate, $endDate]);
                $forecast = $stmt->fetch(PDO::FETCH_ASSOC);
            } catch (PDOException $e) {
                // If crm_forecasts table doesn't exist or has schema issues, fall back to computed forecast
                if (strpos($e->getMessage(), 'Base table or view not found') !== false || $e->getCode() === '42S02') {
                    $forecast = null;
                } else {
                    throw $e;
                }
            }

            if (!$forecast) {
                // Calculate forecast
                $forecast = self::calculateForecast($userId, $scope, $startDate, $endDate);
            }
            
            Response::success($forecast);
            
        } catch (Exception $e) {
            error_log('CRMController::getForecast error: ' . $e->getMessage());
            Response::error('Failed to get forecast: ' . $e->getMessage());
        }
    }
    
    private static function calculateForecast(int $userId, array $scope, string $startDate, string $endDate): array {
        $db = Database::conn();
        
        $whereConditions = ["l.{$scope['col']} = ?"];
        $params = [$scope['val']];
        
        $whereClause = implode(' AND ', $whereConditions);
        
        // Calculate weighted pipeline
        $pipelineQuery = "
            SELECT 
                SUM(l.lead_value * (l.probability / 100)) as weighted_pipeline,
                SUM(CASE WHEN l.lead_stage = 'closed_won' THEN l.lead_value ELSE 0 END) as actual_revenue,
                COUNT(CASE WHEN l.lead_stage = 'closed_won' THEN 1 END) as deals_closed
            FROM leads l
            WHERE $whereClause
        ";
        
        $stmt = $db->prepare($pipelineQuery);
        $stmt->execute($params);
        $pipelineData = $stmt->fetch(PDO::FETCH_ASSOC);
        
        return [
            'expected_revenue' => $pipelineData['weighted_pipeline'] ?? 0,
            'weighted_pipeline' => $pipelineData['weighted_pipeline'] ?? 0,
            'actual_revenue' => $pipelineData['actual_revenue'] ?? 0,
            'deals_closed' => $pipelineData['deals_closed'] ?? 0,
            'confidence_score' => 75, // Default confidence
            'period_start' => $startDate,
            'period_end' => $endDate
        ];
    }
    
    // =====================================================
    // PLAYBOOKS
    // =====================================================
    
    /**
     * Get all playbooks
     */
    public static function getPlaybooks(): void {
        try {
            $userId = self::getUserId();
            $db = Database::conn();
            $scope = self::getWorkspaceScope();
            
            $query = "
                SELECT * FROM crm_playbooks 
                WHERE user_id = ? OR is_shared = TRUE
                ORDER BY times_used DESC, created_at DESC
            ";
            
            $stmt = $db->prepare($query);
            $stmt->execute([$userId]);
            $playbooks = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Decode JSON fields
            foreach ($playbooks as &$playbook) {
                $playbook['steps'] = json_decode($playbook['steps'] ?? '[]', true);
                $playbook['email_templates'] = json_decode($playbook['email_templates'] ?? '[]', true);
                $playbook['call_scripts'] = json_decode($playbook['call_scripts'] ?? '[]', true);
                $playbook['objection_handlers'] = json_decode($playbook['objection_handlers'] ?? '[]', true);
            }
            
            Response::success(['playbooks' => $playbooks]);
            
        } catch (Exception $e) {
            error_log('CRMController::getPlaybooks error: ' . $e->getMessage());
            Response::error('Failed to get playbooks: ' . $e->getMessage());
        }
    }
    
    /**
     * Create a new playbook
     */
    public static function createPlaybook(): void {
        try {
            $userId = self::getUserId();
            $db = Database::conn();
            $scope = self::getWorkspaceScope();
            $data = json_decode(file_get_contents('php://input'), true);
            
            $query = "
                INSERT INTO crm_playbooks (
                    user_id, workspace_id, name, description, playbook_type,
                    target_persona, steps, email_templates, call_scripts,
                    objection_handlers, status, created_by
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ";
            
            $stmt = $db->prepare($query);
            $stmt->execute([
                $userId,
                $scope['col'] === 'workspace_id' ? $scope['val'] : null,
                $data['name'],
                $data['description'] ?? null,
                $data['playbook_type'] ?? 'custom',
                $data['target_persona'] ?? null,
                json_encode($data['steps'] ?? []),
                json_encode($data['email_templates'] ?? []),
                json_encode($data['call_scripts'] ?? []),
                json_encode($data['objection_handlers'] ?? []),
                $data['status'] ?? 'draft',
                $userId
            ]);
            
            Response::success(['playbook_id' => $db->lastInsertId(), 'message' => 'Playbook created successfully']);
            
        } catch (Exception $e) {
            Response::error('Failed to create playbook: ' . $e->getMessage());
        }
    }
    
    // =====================================================
    // SETTINGS
    // =====================================================
    
    /**
     * Get CRM settings
     */
    public static function getSettings(): void {
        try {
            $userId = self::getUserId();
            $db = Database::conn();
            $scope = self::getWorkspaceScope();
            
            $settingType = $_GET['type'] ?? 'user';
            
            $query = "
                SELECT setting_key, setting_value, data_type 
                FROM crm_settings 
                WHERE setting_type = ? AND (
                    (setting_type = 'user' AND user_id = ?) OR
                    (setting_type = 'workspace' AND workspace_id = ?) OR
                    (setting_type = 'system')
                )
            ";
            
            $stmt = $db->prepare($query);
            $stmt->execute([
                $settingType,
                $userId,
                $scope['col'] === 'workspace_id' ? $scope['val'] : null
            ]);
            $settings = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Format settings as key-value pairs
            $formattedSettings = [];
            foreach ($settings as $setting) {
                $value = $setting['setting_value'];
                
                // Parse based on data type
                switch ($setting['data_type']) {
                    case 'number':
                        $value = floatval($value);
                        break;
                    case 'boolean':
                        $value = $value === 'true' || $value === '1';
                        break;
                    case 'json':
                        $value = json_decode($value, true);
                        break;
                }
                
                $formattedSettings[$setting['setting_key']] = $value;
            }
            
            Response::success(['settings' => $formattedSettings]);
            
        } catch (Exception $e) {
            error_log('CRMController::getSettings error: ' . $e->getMessage());
            Response::error('Failed to get settings: ' . $e->getMessage());
        }
    }
    
    /**
     * Update CRM settings
     */
    public static function updateSettings(): void {
        try {
            $userId = self::getUserId();
            $db = Database::conn();
            $scope = self::getWorkspaceScope();
            $data = json_decode(file_get_contents('php://input'), true);
            
            foreach ($data as $key => $value) {
                // Determine data type
                $dataType = 'string';
                $stringValue = $value;
                
                if (is_bool($value)) {
                    $dataType = 'boolean';
                    $stringValue = $value ? 'true' : 'false';
                } elseif (is_numeric($value)) {
                    $dataType = 'number';
                    $stringValue = strval($value);
                } elseif (is_array($value)) {
                    $dataType = 'json';
                    $stringValue = json_encode($value);
                }
                
                $query = "
                    INSERT INTO crm_settings (
                        user_id, workspace_id, setting_key, setting_value, 
                        setting_type, data_type
                    ) VALUES (?, ?, ?, ?, 'user', ?)
                    ON DUPLICATE KEY UPDATE 
                        setting_value = VALUES(setting_value),
                        data_type = VALUES(data_type)
                ";
                
                $stmt = $db->prepare($query);
                $stmt->execute([
                    $userId,
                    $scope['col'] === 'workspace_id' ? $scope['val'] : null,
                    $key,
                    $stringValue,
                    $dataType
                ]);
            }
            
            Response::success(['message' => 'Settings updated successfully']);
            
        } catch (Exception $e) {
            Response::error('Failed to update settings: ' . $e->getMessage());
        }
    }
    
    // =====================================================
    // PRODUCTS
    // =====================================================
    
    /**
     * Get all products
     */
    public static function getProducts(): void {
        try {
            $userId = self::getUserId();
            $db = Database::conn();
            $scope = self::getWorkspaceScope();
            
            $query = "
                SELECT * FROM crm_products 
                WHERE {$scope['col']} = ? AND is_active = TRUE
                ORDER BY name ASC
            ";
            
            $stmt = $db->prepare($query);
            $stmt->execute([$scope['val']]);
            $products = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            Response::success(['products' => $products]);
            
        } catch (Exception $e) {
            error_log('CRMController::getProducts error: ' . $e->getMessage());
            Response::error('Failed to get products: ' . $e->getMessage());
        }
    }
}
