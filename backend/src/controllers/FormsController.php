<?php
require_once __DIR__ . '/../Database.php';
require_once __DIR__ . '/../Response.php';
require_once __DIR__ . '/../Auth.php';
require_once __DIR__ . '/../services/RBACService.php';

class FormsController {
    private $db;
    private $rbac;

    public function __construct() {
        $this->db = Database::conn();
        $this->rbac = RBACService::getInstance();
    }
    
    private function getWorkspaceScope(): array {
        $ctx = $GLOBALS['tenantContext'] ?? null;
        if ($ctx && isset($ctx->workspaceId)) {
            return ['col' => 'workspace_id', 'val' => (int)$ctx->workspaceId];
        }
        return ['col' => 'user_id', 'val' => Auth::userIdOrFail()];
    }

    public function handleRequest($method, $path) {
        switch ($method) {
            case 'GET':
                if (preg_match('/^\/forms\/(\d+)\/public$/', $path, $matches)) {
                    return $this->getPublicForm($matches[1]);
                } elseif (preg_match('/^\/forms\/(\d+)$/', $path, $matches)) {
                    return $this->getForm($matches[1]);
                } elseif (preg_match('/^\/forms\/(\d+)\/responses$/', $path, $matches)) {
                    return $this->getFormResponses($matches[1]);
                } else {
                    return $this->getForms();
                }
            case 'POST':
                if (preg_match('/^\/forms\/(\d+)\/submit$/', $path, $matches)) {
                    return $this->submitFormResponse($matches[1]);
                } else {
                    return $this->createForm();
                }
            case 'PUT':
                if (preg_match('/^\/forms\/(\d+)$/', $path, $matches)) {
                    return $this->updateForm($matches[1]);
                }
                break;
            case 'DELETE':
                if (preg_match('/^\/forms\/(\d+)$/', $path, $matches)) {
                    return $this->deleteForm($matches[1]);
                }
                break;
        }
        
        return Response::error('Not found', 404);
    }

    public function getForms() {
        try {
            $userId = Auth::userIdOrFail();
            
            // Check permission
            if (!$this->rbac->hasPermission($userId, 'forms.view')) {
                return Response::forbidden('You do not have permission to view forms');
            }

            $scope = $this->getWorkspaceScope();
            
            // Get forms with response counts
            $stmt = $this->db->prepare("
                SELECT f.*, 
                       COALESCE((SELECT COUNT(*) FROM form_responses fr WHERE fr.form_id = f.id), 0) as response_count,
                       (SELECT MAX(created_at) FROM form_responses fr WHERE fr.form_id = f.id) as last_response_at
                FROM forms f 
                WHERE f.{$scope['col']} = ? 
                ORDER BY f.created_at DESC
            ");
            $stmt->execute([$scope['val']]);
            $forms = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // Decode JSON fields
            foreach ($forms as &$form) {
                $form['fields'] = json_decode($form['fields'], true) ?: [];
                $form['steps'] = $form['steps'] ? json_decode($form['steps'], true) : [];
                $form['settings'] = $form['settings'] ? json_decode($form['settings'], true) : null;
                $form['is_multi_step'] = (bool)($form['is_multi_step'] ?? false);
                $form['response_count'] = (int)$form['response_count'];
            }

            return Response::json(['items' => $forms]);
        } catch (Exception $e) {
            return Response::error('Failed to fetch forms: ' . $e->getMessage());
        }
    }

    public function getPublicForm($id) {
        try {
            $stmt = $this->db->prepare("SELECT id, name, title, description, fields, status FROM forms WHERE id = ? AND status = 'active'");
            $stmt->execute([$id]);
            $form = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$form) {
                return Response::error('Form not found or inactive', 404);
            }

            $form['fields'] = json_decode($form['fields'], true);
            return Response::success($form);
        } catch (Exception $e) {
            return Response::error('Failed to fetch form: ' . $e->getMessage());
        }
    }

    public function getForm($id) {
        try {
            $userId = Auth::userIdOrFail();

            $scope = $this->getWorkspaceScope();
            $stmt = $this->db->prepare("
                SELECT f.*, 
                       COALESCE((SELECT COUNT(*) FROM form_responses fr WHERE fr.form_id = f.id), 0) as response_count,
                       (SELECT MAX(created_at) FROM form_responses fr WHERE fr.form_id = f.id) as last_response_at
                FROM forms f 
                WHERE f.id = ? AND f.{$scope['col']} = ?
            ");
            $stmt->execute([$id, $scope['val']]);
            $form = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$form) {
                return Response::error('Form not found', 404);
            }

            $form['fields'] = json_decode($form['fields'], true) ?: [];
            $form['steps'] = $form['steps'] ? json_decode($form['steps'], true) : [];
            $form['settings'] = $form['settings'] ? json_decode($form['settings'], true) : null;
            $form['is_multi_step'] = (bool)($form['is_multi_step'] ?? false);
            $form['response_count'] = (int)$form['response_count'];
            
            return Response::success($form);
        } catch (Exception $e) {
            return Response::error('Failed to fetch form: ' . $e->getMessage());
        }
    }

    public function createForm() {
        try {
            $userId = Auth::userIdOrFail();
            
            // Check permission
            if (!$this->rbac->hasPermission($userId, 'forms.create')) {
                return Response::forbidden('You do not have permission to create forms');
            }

            $rawInput = file_get_contents('php://input');
            $input = json_decode($rawInput, true);
            
            if (!$input || !isset($input['name']) || !isset($input['title']) || !isset($input['fields'])) {
                return Response::error('Missing required fields');
            }

            $ctx = $GLOBALS['tenantContext'] ?? null;
            $workspaceId = ($ctx && isset($ctx->workspaceId)) ? (int)$ctx->workspaceId : null;
            
            $stmt = $this->db->prepare("
                INSERT INTO forms (
                    user_id, workspace_id, name, title, description, fields, status,
                    group_id, is_multi_step, steps, settings, campaign_id
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ");
            $stmt->execute([
                $userId,
                $workspaceId,
                $input['name'],
                $input['title'],
                $input['description'] ?? '',
                json_encode($input['fields']),
                $input['status'] ?? 'draft',
                $input['group_id'] ?? null,
                $input['is_multi_step'] ?? false,
                isset($input['steps']) ? json_encode($input['steps']) : null,
                isset($input['settings']) ? json_encode($input['settings']) : null,
                $input['campaign_id'] ?? null
            ]);

            $formId = $this->db->lastInsertId();
            
            // Return the full form object
            return $this->getForm($formId);
        } catch (Exception $e) {
            return Response::error('Failed to create form: ' . $e->getMessage());
        }
    }

    public function updateForm($id) {
        try {
            $userId = Auth::userIdOrFail();
            
            // Check permission
            if (!$this->rbac->hasPermission($userId, 'forms.edit')) {
                return Response::forbidden('You do not have permission to edit forms');
            }

            $input = json_decode(file_get_contents('php://input'), true);
            
            if (!$input) {
                return Response::error('Invalid input');
            }

            // Check if form exists and belongs to user/workspace
            $scope = $this->getWorkspaceScope();
            $stmt = $this->db->prepare("SELECT id FROM forms WHERE id = ? AND {$scope['col']} = ?");
            $stmt->execute([$id, $scope['val']]);
            if (!$stmt->fetch()) {
                return Response::error('Form not found', 404);
            }

            $updateFields = [];
            $params = [];
            
            if (isset($input['name'])) {
                $updateFields[] = 'name = ?';
                $params[] = $input['name'];
            }
            if (isset($input['title'])) {
                $updateFields[] = 'title = ?';
                $params[] = $input['title'];
            }
            if (isset($input['description'])) {
                $updateFields[] = 'description = ?';
                $params[] = $input['description'];
            }
            if (isset($input['fields'])) {
                $updateFields[] = 'fields = ?';
                $params[] = json_encode($input['fields']);
            }
            if (isset($input['status'])) {
                $updateFields[] = 'status = ?';
                $params[] = $input['status'];
            }
            if (array_key_exists('group_id', $input)) {
                $updateFields[] = 'group_id = ?';
                $params[] = $input['group_id'];
            }
            if (isset($input['is_multi_step'])) {
                $updateFields[] = 'is_multi_step = ?';
                $params[] = $input['is_multi_step'] ? 1 : 0;
            }
            if (isset($input['steps'])) {
                $updateFields[] = 'steps = ?';
                $params[] = json_encode($input['steps']);
            }
            if (isset($input['settings'])) {
                $updateFields[] = 'settings = ?';
                $params[] = json_encode($input['settings']);
            }
            if (array_key_exists('campaign_id', $input)) {
                $updateFields[] = 'campaign_id = ?';
                $params[] = $input['campaign_id'];
            }

            if (empty($updateFields)) {
                return Response::error('No fields to update');
            }

            $params[] = $id;
            $params[] = $scope['val'];

            $sql = "UPDATE forms SET " . implode(', ', $updateFields) . " WHERE id = ? AND {$scope['col']} = ?";
            $stmt = $this->db->prepare($sql);
            $stmt->execute($params);

            // Return the full updated form
            return $this->getForm($id);
        } catch (Exception $e) {
            return Response::error('Failed to update form: ' . $e->getMessage());
        }
    }

    public function deleteForm($id) {
        try {
            $userId = Auth::userIdOrFail();
            
            // Check permission
            if (!$this->rbac->hasPermission($userId, 'forms.delete')) {
                return Response::forbidden('You do not have permission to delete forms');
            }

            $scope = $this->getWorkspaceScope();
            $stmt = $this->db->prepare("DELETE FROM forms WHERE id = ? AND {$scope['col']} = ?");
            $stmt->execute([$id, $scope['val']]);

            if ($stmt->rowCount() === 0) {
                return Response::error('Form not found', 404);
            }

            return Response::success(['message' => 'Form deleted successfully']);
        } catch (Exception $e) {
            return Response::error('Failed to delete form: ' . $e->getMessage());
        }
    }

    public function submitFormResponse($formId) {
        try {
            // Check if form exists and is active
            $stmt = $this->db->prepare("SELECT id, name, user_id, fields FROM forms WHERE id = ? AND status = 'active'");
            $stmt->execute([$formId]);
            $form = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$form) {
                return Response::error('Form not found or inactive', 404);
            }

            $input = json_decode(file_get_contents('php://input'), true);
            
            if (!$input || !isset($input['response_data'])) {
                return Response::error('Missing response data');
            }

            // Get client IP and user agent
            $ipAddress = $_SERVER['HTTP_X_FORWARDED_FOR'] ?? $_SERVER['REMOTE_ADDR'] ?? null;
            $userAgent = $_SERVER['HTTP_USER_AGENT'] ?? null;

            $stmt = $this->db->prepare("INSERT INTO form_responses (form_id, response_data, ip_address, user_agent) VALUES (?, ?, ?, ?)");
            $stmt->execute([
                $formId,
                json_encode($input['response_data']),
                $ipAddress,
                $userAgent
            ]);

            $responseId = $this->db->lastInsertId();

            // Dispatch webhook for form submission
            try {
                require_once __DIR__ . '/../services/WebhookService.php';
                WebhookService::triggerFormSubmission((int)$form['user_id'], [
                    'form_id' => $formId,
                    'form_name' => $form['name'] ?? 'Unnamed Form',
                    'submission_id' => $responseId,
                    'fields' => $input['response_data'],
                    'email' => $input['response_data']['email'] ?? null,
                    'name' => $input['response_data']['name'] ?? $input['response_data']['first_name'] ?? null,
                    'ip_address' => $ipAddress,
                    'submitted_at' => date('c')
                ]);
            } catch (Exception $webhookError) {
                // Log webhook error but don't fail the submission
                error_log('Webhook dispatch failed: ' . $webhookError->getMessage());
            }

            return Response::success(['id' => $responseId, 'message' => 'Response submitted successfully']);
        } catch (Exception $e) {
            return Response::error('Failed to submit response: ' . $e->getMessage());
        }
    }

    public function getFormResponses($formId) {
        try {
            $userId = Auth::userIdOrFail();
            
            // Check permission
            if (!$this->rbac->hasPermission($userId, 'forms.responses.view')) {
                return Response::forbidden('You do not have permission to view form responses');
            }

            // Check if form belongs to user
            $scope = $this->getWorkspaceScope();
            $stmt = $this->db->prepare("SELECT id FROM forms WHERE id = ? AND {$scope['col']} = ?");
            $stmt->execute([$formId, $scope['val']]);
            if (!$stmt->fetch()) {
                return Response::error('Form not found', 404);
            }

            $stmt = $this->db->prepare("SELECT * FROM form_responses WHERE form_id = ? ORDER BY created_at DESC");
            $stmt->execute([$formId]);
            $responses = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // Decode JSON response data
            foreach ($responses as &$response) {
                $response['response_data'] = json_decode($response['response_data'], true);
            }

            return Response::success($responses);
        } catch (Exception $e) {
            return Response::error('Failed to fetch responses: ' . $e->getMessage());
        }
    }

    /**
     * Get all form responses across all forms (for FormReplies page)
     * Supports filtering by form_id, group_id, date range, search
     */
    public function getAllResponses() {
        try {
            $userId = Auth::userIdOrFail();
            
            // Check permission
            if (!$this->rbac->hasPermission($userId, 'forms.responses.view')) {
                return Response::forbidden('You do not have permission to view form responses');
            }

            $scope = $this->getWorkspaceScope();
            
            // Get query parameters
            $formId = $_GET['form_id'] ?? null;
            $groupId = $_GET['group_id'] ?? null;
            $search = $_GET['q'] ?? null;
            $dateFrom = $_GET['date_from'] ?? null;
            $dateTo = $_GET['date_to'] ?? null;
            $isRead = isset($_GET['is_read']) ? $_GET['is_read'] : null;
            $isStarred = isset($_GET['is_starred']) ? $_GET['is_starred'] : null;
            $limit = min((int)($_GET['limit'] ?? 100), 500);
            $offset = (int)($_GET['offset'] ?? 0);

            $whereConditions = ["f.{$scope['col']} = ?"];
            $params = [$scope['val']];

            if ($formId) {
                $whereConditions[] = "fr.form_id = ?";
                $params[] = $formId;
            }
            if ($groupId) {
                $whereConditions[] = "f.group_id = ?";
                $params[] = $groupId;
            }
            if ($dateFrom) {
                $whereConditions[] = "fr.created_at >= ?";
                $params[] = $dateFrom;
            }
            if ($dateTo) {
                $whereConditions[] = "fr.created_at <= ?";
                $params[] = $dateTo . ' 23:59:59';
            }
            if ($isRead !== null) {
                $whereConditions[] = "fr.is_read = ?";
                $params[] = $isRead === 'true' || $isRead === '1' ? 1 : 0;
            }
            if ($isStarred !== null) {
                $whereConditions[] = "fr.is_starred = ?";
                $params[] = $isStarred === 'true' || $isStarred === '1' ? 1 : 0;
            }

            $whereClause = implode(' AND ', $whereConditions);

            // Get total count
            $countSql = "
                SELECT COUNT(*) 
                FROM form_responses fr
                JOIN forms f ON fr.form_id = f.id
                WHERE {$whereClause}
            ";
            $stmt = $this->db->prepare($countSql);
            $stmt->execute($params);
            $total = (int)$stmt->fetchColumn();

            // Get responses with form info
            $sql = "
                SELECT 
                    fr.*,
                    f.name as form_name,
                    f.title as form_title,
                    f.group_id as form_group_id
                FROM form_responses fr
                JOIN forms f ON fr.form_id = f.id
                WHERE {$whereClause}
                ORDER BY fr.created_at DESC
                LIMIT ? OFFSET ?
            ";
            $params[] = $limit;
            $params[] = $offset;
            
            $stmt = $this->db->prepare($sql);
            $stmt->execute($params);
            $responses = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // Decode JSON and filter by search if needed
            $filteredResponses = [];
            foreach ($responses as &$response) {
                $response['response_data'] = json_decode($response['response_data'], true) ?: [];
                $response['is_read'] = (bool)($response['is_read'] ?? false);
                $response['is_starred'] = (bool)($response['is_starred'] ?? false);
                
                // Search filter (search in response_data JSON)
                if ($search) {
                    $searchLower = strtolower($search);
                    $found = false;
                    foreach ($response['response_data'] as $key => $value) {
                        if (stripos((string)$value, $searchLower) !== false || stripos($key, $searchLower) !== false) {
                            $found = true;
                            break;
                        }
                    }
                    if (!$found && stripos($response['form_name'], $searchLower) === false && stripos($response['form_title'], $searchLower) === false) {
                        continue;
                    }
                }
                $filteredResponses[] = $response;
            }

            return Response::json([
                'items' => $filteredResponses,
                'total' => $total,
                'limit' => $limit,
                'offset' => $offset
            ]);
        } catch (Exception $e) {
            return Response::error('Failed to fetch responses: ' . $e->getMessage());
        }
    }

    /**
     * Update a form response (mark as read, starred, move to folder)
     */
    public function updateResponse($responseId) {
        try {
            $userId = Auth::userIdOrFail();
            $scope = $this->getWorkspaceScope();
            
            // Check if response belongs to user's form
            $stmt = $this->db->prepare("
                SELECT fr.id FROM form_responses fr
                JOIN forms f ON fr.form_id = f.id
                WHERE fr.id = ? AND f.{$scope['col']} = ?
            ");
            $stmt->execute([$responseId, $scope['val']]);
            if (!$stmt->fetch()) {
                return Response::error('Response not found', 404);
            }

            $input = json_decode(file_get_contents('php://input'), true);
            
            $updateFields = [];
            $params = [];
            
            if (isset($input['is_read'])) {
                $updateFields[] = 'is_read = ?';
                $params[] = $input['is_read'] ? 1 : 0;
            }
            if (isset($input['is_starred'])) {
                $updateFields[] = 'is_starred = ?';
                $params[] = $input['is_starred'] ? 1 : 0;
            }

            if (empty($updateFields)) {
                return Response::error('No fields to update');
            }

            $params[] = $responseId;
            $sql = "UPDATE form_responses SET " . implode(', ', $updateFields) . " WHERE id = ?";
            $stmt = $this->db->prepare($sql);
            $stmt->execute($params);

            return Response::success(['message' => 'Response updated successfully']);
        } catch (Exception $e) {
            return Response::error('Failed to update response: ' . $e->getMessage());
        }
    }

    /**
     * Delete a form response
     */
    public function deleteResponse($responseId) {
        try {
            $userId = Auth::userIdOrFail();
            $scope = $this->getWorkspaceScope();
            
            // Check if response belongs to user's form
            $stmt = $this->db->prepare("
                SELECT fr.id FROM form_responses fr
                JOIN forms f ON fr.form_id = f.id
                WHERE fr.id = ? AND f.{$scope['col']} = ?
            ");
            $stmt->execute([$responseId, $scope['val']]);
            if (!$stmt->fetch()) {
                return Response::error('Response not found', 404);
            }

            $stmt = $this->db->prepare("DELETE FROM form_responses WHERE id = ?");
            $stmt->execute([$responseId]);

            return Response::success(['message' => 'Response deleted successfully']);
        } catch (Exception $e) {
            return Response::error('Failed to delete response: ' . $e->getMessage());
        }
    }

    /**
     * Bulk update responses (mark as read, starred, delete)
     */
    public function bulkUpdateResponses() {
        try {
            $userId = Auth::userIdOrFail();
            $scope = $this->getWorkspaceScope();
            
            $input = json_decode(file_get_contents('php://input'), true);
            
            if (!isset($input['response_ids']) || !is_array($input['response_ids']) || empty($input['response_ids'])) {
                return Response::error('Response IDs are required');
            }

            $responseIds = $input['response_ids'];
            $action = $input['action'] ?? null;

            // Verify all responses belong to user's forms
            $placeholders = implode(',', array_fill(0, count($responseIds), '?'));
            $stmt = $this->db->prepare("
                SELECT fr.id FROM form_responses fr
                JOIN forms f ON fr.form_id = f.id
                WHERE fr.id IN ({$placeholders}) AND f.{$scope['col']} = ?
            ");
            $stmt->execute([...$responseIds, $scope['val']]);
            $validIds = $stmt->fetchAll(PDO::FETCH_COLUMN);

            if (count($validIds) !== count($responseIds)) {
                return Response::error('Some responses not found or not accessible');
            }

            switch ($action) {
                case 'mark_read':
                    $stmt = $this->db->prepare("UPDATE form_responses SET is_read = 1 WHERE id IN ({$placeholders})");
                    $stmt->execute($responseIds);
                    break;
                case 'mark_unread':
                    $stmt = $this->db->prepare("UPDATE form_responses SET is_read = 0 WHERE id IN ({$placeholders})");
                    $stmt->execute($responseIds);
                    break;
                case 'star':
                    $stmt = $this->db->prepare("UPDATE form_responses SET is_starred = 1 WHERE id IN ({$placeholders})");
                    $stmt->execute($responseIds);
                    break;
                case 'unstar':
                    $stmt = $this->db->prepare("UPDATE form_responses SET is_starred = 0 WHERE id IN ({$placeholders})");
                    $stmt->execute($responseIds);
                    break;
                case 'delete':
                    $stmt = $this->db->prepare("DELETE FROM form_responses WHERE id IN ({$placeholders})");
                    $stmt->execute($responseIds);
                    break;
                default:
                    return Response::error('Invalid action');
            }

            return Response::success(['message' => 'Responses updated successfully', 'count' => count($responseIds)]);
        } catch (Exception $e) {
            return Response::error('Failed to update responses: ' . $e->getMessage());
        }
    }

    public static function getAnalytics() {
        try {
            $userId = Auth::userIdOrFail();
            $db = Database::conn();

            // Get total forms count
            $stmt = $db->prepare("SELECT COUNT(*) as total FROM forms WHERE user_id = ?");
            $stmt->execute([$userId]);
            $totalForms = (int)$stmt->fetchColumn();

            // Get total responses and views (assuming views are tracked in a separate table or we can use response count as proxy)
            $stmt = $db->prepare("
                SELECT 
                    COUNT(DISTINCT fr.id) as total_responses,
                    COUNT(DISTINCT fr.form_id) as forms_with_responses
                FROM form_responses fr
                JOIN forms f ON fr.form_id = f.id
                WHERE f.user_id = ?
            ");
            $stmt->execute([$userId]);
            $responseStats = $stmt->fetch(PDO::FETCH_ASSOC);

            $totalResponses = (int)$responseStats['total_responses'];
            $formsWithResponses = (int)$responseStats['forms_with_responses'];

            // Calculate conversion rate (forms with responses / total forms)
            $conversionRate = $totalForms > 0 ? round(($formsWithResponses / $totalForms) * 100, 2) : 0;

            // Get average response time (time between form creation and first response)
            $stmt = $db->prepare("
                SELECT 
                    AVG(TIMESTAMPDIFF(HOUR, f.created_at, fr.created_at)) as avg_response_hours
                FROM forms f
                JOIN form_responses fr ON f.id = fr.form_id
                WHERE f.user_id = ? AND fr.created_at = (
                    SELECT MIN(created_at) 
                    FROM form_responses 
                    WHERE form_id = f.id
                )
            ");
            $stmt->execute([$userId]);
            $avgResponseHours = $stmt->fetchColumn();
            $avgResponseTime = $avgResponseHours ? round((float)$avgResponseHours, 1) : 0;

            // Get daily responses for the last 30 days
            $stmt = $db->prepare("
                SELECT 
                    DATE(fr.created_at) as date,
                    COUNT(*) as responses,
                    COUNT(DISTINCT fr.form_id) as views
                FROM form_responses fr
                JOIN forms f ON fr.form_id = f.id
                WHERE f.user_id = ? AND fr.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
                GROUP BY DATE(fr.created_at)
                ORDER BY date ASC
            ");
            $stmt->execute([$userId]);
            $dailyResponses = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // Get top performing forms
            $stmt = $db->prepare("
                SELECT 
                    f.id,
                    f.name,
                    COUNT(fr.id) as responses,
                    COUNT(DISTINCT DATE(fr.created_at)) as unique_days,
                    ROUND(COUNT(fr.id) / GREATEST(COUNT(DISTINCT DATE(fr.created_at)), 1), 2) as avg_daily_responses
                FROM forms f
                LEFT JOIN form_responses fr ON f.id = fr.form_id
                WHERE f.user_id = ?
                GROUP BY f.id, f.name
                HAVING responses > 0
                ORDER BY responses DESC
                LIMIT 5
            ");
            $stmt->execute([$userId]);
            $topForms = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // Calculate conversion rates for top forms
            foreach ($topForms as &$form) {
                // For simplicity, assume each form view is counted when it gets a response
                // In a real implementation, you'd track actual views separately
                $form['conversionRate'] = round(($form['responses'] / max($form['responses'], 1)) * 100, 2);
            }

            // Get response sources (based on user agent patterns)
            $stmt = $db->prepare("
                SELECT 
                    CASE 
                        WHEN user_agent LIKE '%Mobile%' THEN 'Mobile'
                        WHEN user_agent LIKE '%Chrome%' THEN 'Chrome'
                        WHEN user_agent LIKE '%Firefox%' THEN 'Firefox'
                        WHEN user_agent LIKE '%Safari%' THEN 'Safari'
                        WHEN user_agent LIKE '%Edge%' THEN 'Edge'
                        ELSE 'Other'
                    END as source,
                    COUNT(*) as count
                FROM form_responses fr
                JOIN forms f ON fr.form_id = f.id
                WHERE f.user_id = ? AND fr.user_agent IS NOT NULL
                GROUP BY source
                ORDER BY count DESC
            ");
            $stmt->execute([$userId]);
            $responseSources = $stmt->fetchAll(PDO::FETCH_ASSOC);

            return Response::success([
                'totalForms' => $totalForms,
                'totalViews' => $totalResponses, // Using responses as proxy for views
                'totalResponses' => $totalResponses,
                'conversionRate' => $conversionRate,
                'avgResponseTime' => $avgResponseTime,
                'dailyResponses' => $dailyResponses,
                'topForms' => $topForms,
                'responseSources' => $responseSources
            ]);

        } catch (Exception $e) {
            return Response::error('Failed to fetch form analytics: ' . $e->getMessage());
        }
    }
}