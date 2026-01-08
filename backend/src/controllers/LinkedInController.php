<?php
/**
 * LinkedIn Controller
 * Handles LinkedIn integration (compliant approach - tasks, templates, lead sync)
 */

require_once __DIR__ . '/../Auth.php';
require_once __DIR__ . '/../Database.php';
require_once __DIR__ . '/../Response.php';

class LinkedInController {
    
    private static function getWorkspaceScope(): array {
        $ctx = $GLOBALS['tenantContext'] ?? null;
        if ($ctx && isset($ctx->workspaceId)) {
            return ['col' => 'workspace_id', 'val' => (int)$ctx->workspaceId];
        }
        return ['col' => 'user_id', 'val' => Auth::userIdOrFail()];
    }
    
    // ==================== LINKEDIN ACCOUNTS ====================

    /**
     * Get all LinkedIn accounts
     * GET /api/channels/linkedin/accounts
     */
    public static function getAccounts(): void {
        $userId = Auth::userIdOrFail();
        $pdo = Database::conn();
        $scope = self::getWorkspaceScope();
        
        $stmt = $pdo->prepare("
            SELECT id, name, description, status, status_message, provider,
                   external_id, external_name, created_at, updated_at
            FROM channel_accounts 
            WHERE {$scope['col']} = ? AND channel = 'linkedin'
            ORDER BY created_at DESC
        ");
        $stmt->execute([$scope['val']]);
        $accounts = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        Response::json(['accounts' => $accounts]);
    }

    /**
     * Connect a LinkedIn account (manual/tracking)
     * POST /api/channels/linkedin/connect
     */
    public static function connect(): void {
        $userId = Auth::userIdOrFail();
        $body = json_decode(file_get_contents('php://input'), true);
        $pdo = Database::conn();
        $scope = self::getWorkspaceScope();
        
        $name = trim($body['name'] ?? '');
        $profileUrl = trim($body['profile_url'] ?? '');
        
        if (!$name) {
            Response::error('Name is required', 422);
            return;
        }
        
        $stmt = $pdo->prepare("
            INSERT INTO channel_accounts (
                user_id, workspace_id, channel, name, external_id, status, provider
            ) VALUES (?, ?, 'linkedin', ?, ?, 'active', 'manual')
        ");
        
        $workspaceId = $scope['col'] === 'workspace_id' ? $scope['val'] : null;
        $stmt->execute([$userId, $workspaceId, $name, $profileUrl]);
        
        Response::json(['success' => true, 'id' => $pdo->lastInsertId()]);
    }

    /**
     * Disconnect a LinkedIn account
     * POST /api/channels/linkedin/accounts/:id/disconnect
     */
    public static function disconnect(string $id): void {
        $userId = Auth::userIdOrFail();
        $pdo = Database::conn();
        $scope = self::getWorkspaceScope();
        
        $stmt = $pdo->prepare("
            DELETE FROM channel_accounts 
            WHERE id = ? AND {$scope['col']} = ? AND channel = 'linkedin'
        ");
        $stmt->execute([$id, $scope['val']]);
        
        Response::json(['success' => true]);
    }

    // ==================== LINKEDIN TASKS ====================
    
    /**
     * Get all LinkedIn tasks
     * GET /api/channels/linkedin/tasks
     */
    public static function getTasks(): void {
        $userId = Auth::userIdOrFail();
        $pdo = Database::conn();
        $scope = self::getWorkspaceScope();
        
        $status = $_GET['status'] ?? null;
        $taskType = $_GET['task_type'] ?? null;
        $assignedTo = $_GET['assigned_to'] ?? null;
        $priority = $_GET['priority'] ?? null;
        $limit = min((int)($_GET['limit'] ?? 50), 100);
        $offset = (int)($_GET['offset'] ?? 0);
        
        $sql = "SELECT t.*, c.first_name, c.last_name, c.email as contact_email, c.company as contact_company_name
                FROM linkedin_tasks t
                LEFT JOIN contacts c ON t.contact_id = c.id
                WHERE t.{$scope['col']} = ?";
        $params = [$scope['val']];
        
        if ($status) {
            $sql .= " AND t.status = ?";
            $params[] = $status;
        }
        if ($taskType) {
            $sql .= " AND t.task_type = ?";
            $params[] = $taskType;
        }
        if ($assignedTo) {
            $sql .= " AND t.assigned_user_id = ?";
            $params[] = $assignedTo;
        }
        if ($priority) {
            $sql .= " AND t.priority = ?";
            $params[] = $priority;
        }
        
        $sql .= " ORDER BY 
                  CASE t.priority 
                    WHEN 'urgent' THEN 1 
                    WHEN 'high' THEN 2 
                    WHEN 'medium' THEN 3 
                    WHEN 'low' THEN 4 
                  END,
                  t.due_date ASC, t.created_at DESC
                  LIMIT ? OFFSET ?";
        $params[] = $limit;
        $params[] = $offset;
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $tasks = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Get counts by status
        $stmt = $pdo->prepare("
            SELECT status, COUNT(*) as count 
            FROM linkedin_tasks 
            WHERE {$scope['col']} = ?
            GROUP BY status
        ");
        $stmt->execute([$scope['val']]);
        $statusCounts = [];
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $statusCounts[$row['status']] = (int)$row['count'];
        }
        
        Response::json([
            'tasks' => $tasks,
            'counts' => $statusCounts,
        ]);
    }
    
    /**
     * Get a single task
     * GET /api/channels/linkedin/tasks/:id
     */
    public static function getTask(string $id): void {
        $userId = Auth::userIdOrFail();
        $pdo = Database::conn();
        $scope = self::getWorkspaceScope();
        
        $stmt = $pdo->prepare("
            SELECT t.*, c.first_name, c.last_name, c.email, c.phone, c.company,
                   lt.name as template_name, lt.message as template_message
            FROM linkedin_tasks t
            LEFT JOIN contacts c ON t.contact_id = c.id
            LEFT JOIN linkedin_templates lt ON t.template_id = lt.id
            WHERE t.id = ? AND t.{$scope['col']} = ?
        ");
        $stmt->execute([$id, $scope['val']]);
        $task = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$task) {
            Response::error('Task not found', 404);
            return;
        }
        
        Response::json(['task' => $task]);
    }
    
    /**
     * Create a LinkedIn task
     * POST /api/channels/linkedin/tasks
     */
    public static function createTask(): void {
        $userId = Auth::userIdOrFail();
        $body = json_decode(file_get_contents('php://input'), true);
        $pdo = Database::conn();
        $scope = self::getWorkspaceScope();
        
        $title = trim($body['title'] ?? '');
        if (!$title) {
            Response::error('Task title is required', 422);
            return;
        }
        
        $workspaceId = $scope['col'] === 'workspace_id' ? $scope['val'] : null;
        
        $stmt = $pdo->prepare("
            INSERT INTO linkedin_tasks 
            (user_id, workspace_id, company_id, contact_id, linkedin_url, contact_name, contact_title, contact_company,
             task_type, title, description, template_id, suggested_message, status, priority, due_date, reminder_at,
             automation_id, automation_execution_id, assigned_user_id, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        ");
        $stmt->execute([
            $userId,
            $workspaceId,
            $body['company_id'] ?? null,
            $body['contact_id'] ?? null,
            $body['linkedin_url'] ?? null,
            $body['contact_name'] ?? null,
            $body['contact_title'] ?? null,
            $body['contact_company'] ?? null,
            $body['task_type'] ?? 'send_message',
            $title,
            $body['description'] ?? null,
            $body['template_id'] ?? null,
            $body['suggested_message'] ?? null,
            $body['priority'] ?? 'medium',
            $body['due_date'] ?? null,
            $body['reminder_at'] ?? null,
            $body['automation_id'] ?? null,
            $body['automation_execution_id'] ?? null,
            $body['assigned_user_id'] ?? $userId,
        ]);
        
        $taskId = $pdo->lastInsertId();
        
        // Return the created task
        self::getTask($taskId);
    }
    
    /**
     * Update a LinkedIn task
     * PUT /api/channels/linkedin/tasks/:id
     */
    public static function updateTask(string $id): void {
        $userId = Auth::userIdOrFail();
        $body = json_decode(file_get_contents('php://input'), true);
        $pdo = Database::conn();
        $scope = self::getWorkspaceScope();
        
        // Verify ownership
        $stmt = $pdo->prepare("SELECT id FROM linkedin_tasks WHERE id = ? AND {$scope['col']} = ?");
        $stmt->execute([$id, $scope['val']]);
        if (!$stmt->fetch()) {
            Response::error('Task not found', 404);
            return;
        }
        
        $allowedFields = [
            'title', 'description', 'task_type', 'linkedin_url', 'contact_name', 
            'contact_title', 'contact_company', 'template_id', 'suggested_message',
            'status', 'priority', 'due_date', 'reminder_at', 'assigned_user_id',
            'completion_notes'
        ];
        
        $updates = [];
        $params = [];
        
        foreach ($allowedFields as $field) {
            if (array_key_exists($field, $body)) {
                $updates[] = "$field = ?";
                $params[] = $body[$field];
            }
        }
        
        // Handle status change to completed
        if (isset($body['status']) && $body['status'] === 'completed') {
            $updates[] = "completed_at = CURRENT_TIMESTAMP";
            $updates[] = "completed_by = ?";
            $params[] = $userId;
        }
        
        if (empty($updates)) {
            Response::error('No fields to update', 422);
            return;
        }
        
        $updates[] = "updated_at = CURRENT_TIMESTAMP";
        $params[] = $id;
        
        $sql = "UPDATE linkedin_tasks SET " . implode(', ', $updates) . " WHERE id = ?";
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        
        self::getTask($id);
    }
    
    /**
     * Delete a LinkedIn task
     * DELETE /api/channels/linkedin/tasks/:id
     */
    public static function deleteTask(string $id): void {
        $userId = Auth::userIdOrFail();
        $pdo = Database::conn();
        $scope = self::getWorkspaceScope();
        
        $stmt = $pdo->prepare("DELETE FROM linkedin_tasks WHERE id = ? AND {$scope['col']} = ?");
        $stmt->execute([$id, $scope['val']]);
        
        if ($stmt->rowCount() === 0) {
            Response::error('Task not found', 404);
            return;
        }
        
        Response::json(['success' => true]);
    }
    
    /**
     * Complete a task
     * POST /api/channels/linkedin/tasks/:id/complete
     */
    public static function completeTask(string $id): void {
        $userId = Auth::userIdOrFail();
        $body = json_decode(file_get_contents('php://input'), true);
        $pdo = Database::conn();
        $scope = self::getWorkspaceScope();
        
        $stmt = $pdo->prepare("
            UPDATE linkedin_tasks SET
                status = 'completed',
                completed_at = CURRENT_TIMESTAMP,
                completed_by = ?,
                completion_notes = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ? AND {$scope['col']} = ?
        ");
        $stmt->execute([
            $userId,
            $body['notes'] ?? null,
            $id,
            $scope['val'],
        ]);
        
        if ($stmt->rowCount() === 0) {
            Response::error('Task not found', 404);
            return;
        }
        
        // Update template usage count if template was used
        $stmt = $pdo->prepare("SELECT template_id FROM linkedin_tasks WHERE id = ?");
        $stmt->execute([$id]);
        $task = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($task && $task['template_id']) {
            $stmt = $pdo->prepare("
                UPDATE linkedin_templates SET usage_count = usage_count + 1, last_used_at = CURRENT_TIMESTAMP
                WHERE id = ?
            ");
            $stmt->execute([$task['template_id']]);
        }
        
        Response::json(['success' => true]);
    }
    
    // ==================== LINKEDIN TEMPLATES ====================
    
    /**
     * Get all LinkedIn templates
     * GET /api/channels/linkedin/templates
     */
    public static function getTemplates(): void {
        $userId = Auth::userIdOrFail();
        $pdo = Database::conn();
        $scope = self::getWorkspaceScope();
        
        $category = $_GET['category'] ?? null;
        $messageType = $_GET['message_type'] ?? null;
        $search = $_GET['search'] ?? null;
        
        $sql = "SELECT * FROM linkedin_templates WHERE {$scope['col']} = ?";
        $params = [$scope['val']];
        
        if ($category) {
            $sql .= " AND category = ?";
            $params[] = $category;
        }
        if ($messageType) {
            $sql .= " AND message_type = ?";
            $params[] = $messageType;
        }
        if ($search) {
            $sql .= " AND (name LIKE ? OR message LIKE ?)";
            $params[] = "%{$search}%";
            $params[] = "%{$search}%";
        }
        
        $sql .= " ORDER BY is_favorite DESC, usage_count DESC, name ASC";
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $templates = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Parse JSON fields
        foreach ($templates as &$template) {
            $template['variables'] = json_decode($template['variables'], true);
        }
        
        Response::json(['templates' => $templates]);
    }
    
    /**
     * Get a single template
     * GET /api/channels/linkedin/templates/:id
     */
    public static function getTemplate(string $id): void {
        $userId = Auth::userIdOrFail();
        $pdo = Database::conn();
        $scope = self::getWorkspaceScope();
        
        $stmt = $pdo->prepare("SELECT * FROM linkedin_templates WHERE id = ? AND {$scope['col']} = ?");
        $stmt->execute([$id, $scope['val']]);
        $template = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$template) {
            Response::error('Template not found', 404);
            return;
        }
        
        $template['variables'] = json_decode($template['variables'], true);
        
        Response::json(['template' => $template]);
    }
    
    /**
     * Create a LinkedIn template
     * POST /api/channels/linkedin/templates
     */
    public static function createTemplate(): void {
        $userId = Auth::userIdOrFail();
        $body = json_decode(file_get_contents('php://input'), true);
        $pdo = Database::conn();
        $scope = self::getWorkspaceScope();
        
        $name = trim($body['name'] ?? '');
        $message = trim($body['message'] ?? '');
        
        if (!$name) {
            Response::error('Template name is required', 422);
            return;
        }
        if (!$message) {
            Response::error('Template message is required', 422);
            return;
        }
        
        // Extract variables from message (e.g., {{first_name}}, {{company}})
        preg_match_all('/\{\{(\w+)\}\}/', $message, $matches);
        $variables = array_unique($matches[1] ?? []);
        
        $workspaceId = $scope['col'] === 'workspace_id' ? $scope['val'] : null;
        
        $stmt = $pdo->prepare("
            INSERT INTO linkedin_templates 
            (user_id, workspace_id, name, description, category, message_type, subject, message, variables, is_favorite, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        ");
        $stmt->execute([
            $userId,
            $workspaceId,
            $name,
            $body['description'] ?? null,
            $body['category'] ?? 'general',
            $body['message_type'] ?? 'direct_message',
            $body['subject'] ?? null,
            $message,
            json_encode($variables),
            $body['is_favorite'] ?? false,
        ]);
        
        $templateId = $pdo->lastInsertId();
        self::getTemplate($templateId);
    }
    
    /**
     * Update a LinkedIn template
     * PUT /api/channels/linkedin/templates/:id
     */
    public static function updateTemplate(string $id): void {
        $userId = Auth::userIdOrFail();
        $body = json_decode(file_get_contents('php://input'), true);
        $pdo = Database::conn();
        $scope = self::getWorkspaceScope();
        
        // Verify ownership
        $stmt = $pdo->prepare("SELECT id FROM linkedin_templates WHERE id = ? AND {$scope['col']} = ?");
        $stmt->execute([$id, $scope['val']]);
        if (!$stmt->fetch()) {
            Response::error('Template not found', 404);
            return;
        }
        
        $allowedFields = ['name', 'description', 'category', 'message_type', 'subject', 'message', 'is_favorite'];
        $updates = [];
        $params = [];
        
        foreach ($allowedFields as $field) {
            if (array_key_exists($field, $body)) {
                $updates[] = "$field = ?";
                $params[] = $body[$field];
            }
        }
        
        // Re-extract variables if message changed
        if (isset($body['message'])) {
            preg_match_all('/\{\{(\w+)\}\}/', $body['message'], $matches);
            $variables = array_unique($matches[1] ?? []);
            $updates[] = "variables = ?";
            $params[] = json_encode($variables);
        }
        
        if (empty($updates)) {
            Response::error('No fields to update', 422);
            return;
        }
        
        $updates[] = "updated_at = CURRENT_TIMESTAMP";
        $params[] = $id;
        
        $sql = "UPDATE linkedin_templates SET " . implode(', ', $updates) . " WHERE id = ?";
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        
        self::getTemplate($id);
    }
    
    /**
     * Delete a LinkedIn template
     * DELETE /api/channels/linkedin/templates/:id
     */
    public static function deleteTemplate(string $id): void {
        $userId = Auth::userIdOrFail();
        $pdo = Database::conn();
        $scope = self::getWorkspaceScope();
        
        $stmt = $pdo->prepare("DELETE FROM linkedin_templates WHERE id = ? AND {$scope['col']} = ?");
        $stmt->execute([$id, $scope['val']]);
        
        if ($stmt->rowCount() === 0) {
            Response::error('Template not found', 404);
            return;
        }
        
        Response::json(['success' => true]);
    }
    
    /**
     * Render a template with variables
     * POST /api/channels/linkedin/templates/:id/render
     */
    public static function renderTemplate(string $id): void {
        $userId = Auth::userIdOrFail();
        $body = json_decode(file_get_contents('php://input'), true);
        $pdo = Database::conn();
        $scope = self::getWorkspaceScope();
        
        $stmt = $pdo->prepare("SELECT * FROM linkedin_templates WHERE id = ? AND {$scope['col']} = ?");
        $stmt->execute([$id, $scope['val']]);
        $template = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$template) {
            Response::error('Template not found', 404);
            return;
        }
        
        $variables = $body['variables'] ?? [];
        $message = $template['message'];
        $subject = $template['subject'];
        
        // Replace variables
        foreach ($variables as $key => $value) {
            $message = str_replace("{{{$key}}}", $value, $message);
            if ($subject) {
                $subject = str_replace("{{{$key}}}", $value, $subject);
            }
        }
        
        Response::json([
            'rendered_message' => $message,
            'rendered_subject' => $subject,
        ]);
    }
    
    // ==================== LINKEDIN LEAD GEN FORMS ====================
    
    /**
     * Get LinkedIn Lead Gen Forms
     * GET /api/channels/linkedin/lead-forms
     */
    public static function getLeadForms(): void {
        $userId = Auth::userIdOrFail();
        $pdo = Database::conn();
        $scope = self::getWorkspaceScope();
        
        $stmt = $pdo->prepare("
            SELECT * FROM linkedin_lead_forms 
            WHERE {$scope['col']} = ?
            ORDER BY created_at DESC
        ");
        $stmt->execute([$scope['val']]);
        $forms = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        foreach ($forms as &$form) {
            $form['fields'] = json_decode($form['fields'], true);
        }
        
        Response::json(['forms' => $forms]);
    }
    
    /**
     * Get leads from a form
     * GET /api/channels/linkedin/lead-forms/:id/leads
     */
    public static function getLeads(string $formId): void {
        $userId = Auth::userIdOrFail();
        $pdo = Database::conn();
        $scope = self::getWorkspaceScope();
        
        // Verify form ownership
        $stmt = $pdo->prepare("SELECT id FROM linkedin_lead_forms WHERE id = ? AND {$scope['col']} = ?");
        $stmt->execute([$formId, $scope['val']]);
        if (!$stmt->fetch()) {
            Response::error('Form not found', 404);
            return;
        }
        
        $status = $_GET['status'] ?? null;
        $limit = min((int)($_GET['limit'] ?? 50), 100);
        $offset = (int)($_GET['offset'] ?? 0);
        
        $sql = "SELECT * FROM linkedin_leads WHERE form_id = ?";
        $params = [$formId];
        
        if ($status) {
            $sql .= " AND status = ?";
            $params[] = $status;
        }
        
        $sql .= " ORDER BY submitted_at DESC LIMIT ? OFFSET ?";
        $params[] = $limit;
        $params[] = $offset;
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $leads = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        foreach ($leads as &$lead) {
            $lead['form_data'] = json_decode($lead['form_data'], true);
        }
        
        Response::json(['leads' => $leads]);
    }
    
    /**
     * Sync a lead to CRM (create contact)
     * POST /api/channels/linkedin/leads/:id/sync
     */
    public static function syncLead(string $leadId): void {
        $userId = Auth::userIdOrFail();
        $pdo = Database::conn();
        $scope = self::getWorkspaceScope();
        
        // Get the lead
        $stmt = $pdo->prepare("
            SELECT l.*, f.{$scope['col']} as scope_val
            FROM linkedin_leads l
            JOIN linkedin_lead_forms f ON l.form_id = f.id
            WHERE l.id = ? AND f.{$scope['col']} = ?
        ");
        $stmt->execute([$leadId, $scope['val']]);
        $lead = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$lead) {
            Response::error('Lead not found', 404);
            return;
        }
        
        if ($lead['contact_id']) {
            Response::error('Lead already synced to contact', 400);
            return;
        }
        
        $workspaceId = $scope['col'] === 'workspace_id' ? $scope['val'] : null;
        
        // Create contact
        $stmt = $pdo->prepare("
            INSERT INTO contacts 
            (user_id, workspace_id, email, first_name, last_name, phone, company, job_title, linkedin_url, source, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'linkedin_lead_form', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        ");
        $stmt->execute([
            $userId,
            $workspaceId,
            $lead['email'],
            $lead['first_name'],
            $lead['last_name'],
            $lead['phone'],
            $lead['company'],
            $lead['job_title'],
            $lead['linkedin_url'],
        ]);
        $contactId = $pdo->lastInsertId();
        
        // Update lead
        $stmt = $pdo->prepare("
            UPDATE linkedin_leads SET contact_id = ?, status = 'synced_to_crm', processed_at = CURRENT_TIMESTAMP
            WHERE id = ?
        ");
        $stmt->execute([$contactId, $leadId]);
        
        Response::json([
            'success' => true,
            'contact_id' => $contactId,
        ]);
    }
    
    // ==================== CHANNEL SETTINGS ====================
    
    /**
     * Get LinkedIn settings
     * GET /api/channels/linkedin/settings
     */
    public static function getSettings(): void {
        $userId = Auth::userIdOrFail();
        $pdo = Database::conn();
        $scope = self::getWorkspaceScope();
        
        $workspaceId = $scope['col'] === 'workspace_id' ? $scope['val'] : null;
        
        $stmt = $pdo->prepare("
            SELECT settings FROM channel_settings 
            WHERE channel = 'linkedin' AND (workspace_id = ? OR workspace_id IS NULL)
            ORDER BY workspace_id DESC LIMIT 1
        ");
        $stmt->execute([$workspaceId]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        
        $settings = $row ? json_decode($row['settings'], true) : [
            'task_default_priority' => 'medium',
            'task_reminder_hours' => 24,
            'auto_create_contact' => true,
            'lead_sync_enabled' => false,
        ];
        
        Response::json(['settings' => $settings]);
    }
    
    /**
     * Update LinkedIn settings
     * PUT /api/channels/linkedin/settings
     */
    public static function updateSettings(): void {
        $userId = Auth::userIdOrFail();
        $body = json_decode(file_get_contents('php://input'), true);
        $pdo = Database::conn();
        $scope = self::getWorkspaceScope();
        
        $workspaceId = $scope['col'] === 'workspace_id' ? $scope['val'] : null;
        
        $stmt = $pdo->prepare("
            INSERT INTO channel_settings (user_id, workspace_id, channel, settings, created_at, updated_at)
            VALUES (?, ?, 'linkedin', ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            ON DUPLICATE KEY UPDATE settings = ?, updated_at = CURRENT_TIMESTAMP
        ");
        $settingsJson = json_encode($body);
        $stmt->execute([$userId, $workspaceId, $settingsJson, $settingsJson]);
        
        Response::json(['success' => true]);
    }
}
