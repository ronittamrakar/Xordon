<?php
require_once __DIR__ . '/../Database.php';
require_once __DIR__ . '/../Response.php';
require_once __DIR__ . '/../Auth.php';
require_once __DIR__ . '/../bootstrap.php';
require_once __DIR__ . '/../traits/WorkspaceScoped.php';

class SMSTemplatesController {
    use WorkspaceScoped;
    
    public function getTemplates() {
        try {
            error_log("SMSTemplatesController::getTemplates() - Starting");
            $userId = Auth::userIdOrFail();
            error_log("SMSTemplatesController::getTemplates() - Got userId: $userId");
            $db = Database::conn();
            error_log("SMSTemplatesController::getTemplates() - Got database connection");
            
            $page = (int)($_GET['page'] ?? 1);
            $limit = (int)($_GET['limit'] ?? 20);
            $search = $_GET['search'] ?? '';
            $category = $_GET['category'] ?? '';
            $offset = ($page - 1) * $limit;
            
            // Use workspace scoping for tenant isolation
            $scope = self::workspaceWhere();
            $whereConditions = [str_replace('?', ':ws_id', $scope['sql'])];
            $params = ['ws_id' => $scope['params'][0]];
            
            if (!empty($search)) {
                $whereConditions[] = '(name LIKE :search OR message LIKE :search OR description LIKE :search)';
                $params['search'] = '%' . $search . '%';
            }
            
            if (!empty($category)) {
                $whereConditions[] = 'category = :category';
                $params['category'] = $category;
            }
            
            $whereClause = implode(' AND ', $whereConditions);
            error_log("SMSTemplatesController::getTemplates() - Where clause: $whereClause");
            error_log("SMSTemplatesController::getTemplates() - Params: " . json_encode($params));
            
            // Get total count
            $countStmt = $db->prepare("SELECT COUNT(*) FROM sms_templates WHERE $whereClause");
            $countStmt->execute($params);
            $total = $countStmt->fetchColumn();
            error_log("SMSTemplatesController::getTemplates() - Total count: $total");
            
            // Get templates
            $stmt = $db->prepare("
                SELECT *, 
                    LENGTH(message) as character_count
                FROM sms_templates 
                WHERE $whereClause 
                ORDER BY created_at DESC 
                LIMIT :limit OFFSET :offset
            ");
            error_log("SMSTemplatesController::getTemplates() - About to execute main query");
            
            foreach ($params as $key => $value) {
                $stmt->bindValue($key, $value);
            }
            $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
            $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
            
            error_log("SMSTemplatesController::getTemplates() - About to execute statement");
            $stmt->execute();
            error_log("SMSTemplatesController::getTemplates() - Statement executed successfully");
            $templates = $stmt->fetchAll(PDO::FETCH_ASSOC);
            error_log("SMSTemplatesController::getTemplates() - Fetched " . count($templates) . " templates");
            
            // Map content to message for frontend compatibility
            foreach ($templates as &$template) {
                $template['content'] = $template['message'];
            }
            
            $result = [
                'templates' => $templates,
                'pagination' => [
                    'page' => $page,
                    'limit' => $limit,
                    'total' => $total,
                    'pages' => ceil($total / $limit)
                ]
            ];
            
            error_log("SMSTemplatesController::getTemplates() - About to return result");
            return Response::json($result);
            
        } catch (Exception $e) {
            error_log("SMSTemplatesController::getTemplates() - Exception: " . $e->getMessage());
            http_response_code(500);
            return Response::json(['error' => 'Failed to fetch templates: ' . $e->getMessage()]);
        }
    }
    
    public function getTemplate($id) {
        try {
            $userId = Auth::userIdOrFail();
            $db = Database::conn();
            
            // Use workspace scoping
            $scope = self::workspaceWhere();
            $workspaceId = $scope['params'][0];
            
            $stmt = $db->prepare("SELECT * FROM sms_templates WHERE id = :id AND " . str_replace('?', ':ws_id', $scope['sql']));
            $stmt->execute([
                'id' => $id,
                'ws_id' => $workspaceId
            ]);
            $template = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$template) {
                http_response_code(404);
                return Response::json(['error' => 'Template not found']);
            }
            
            // Add character count and usage statistics
            $template['character_count'] = strlen($template['message']);
            
            // Get usage count
            $stmt = $db->prepare("SELECT COUNT(*) FROM sms_campaigns WHERE template_id = :id");
            $stmt->execute(['id' => $id]);
            $template['usage_count'] = $stmt->fetchColumn();
            
            // Map message to content for frontend compatibility
            $template['content'] = $template['message'];
            
            return Response::json($template);
            
        } catch (Exception $e) {
            http_response_code(500);
            return Response::json(['error' => 'Failed to fetch template: ' . $e->getMessage()]);
        }
    }
    
    public function createTemplate() {
        try {
            $userId = Auth::userIdOrFail();
            $data = json_decode(file_get_contents('php://input'), true);
            
            // Validate required fields
            if (empty($data['name'])) {
                http_response_code(400);
                return Response::json(['error' => 'Template name is required']);
            }
            
            // Handle both 'message' (frontend) and 'content' (backend) fields
            $content = $data['message'] ?? $data['content'] ?? '';
            if (empty($content)) {
                http_response_code(400);
                return Response::json(['error' => 'Template content is required']);
            }
            
            // Validate SMS length (160 characters for single SMS, 1600 for concatenated)
            $contentLength = strlen($content);
            if ($contentLength > 1600) {
                http_response_code(400);
                return Response::json(['error' => 'Template content is too long (max 1600 characters)']);
            }
            
            $db = Database::conn();
            
            // Use workspace scoping
            $scope = self::workspaceWhere();
            $workspaceId = $scope['params'][0];
            
            // Check for duplicate name
            $stmt = $db->prepare("SELECT id FROM sms_templates WHERE " . str_replace('?', ':ws_id', $scope['sql']) . " AND name = :name");
            $stmt->execute([
                'ws_id' => $workspaceId,
                'name' => $data['name']
            ]);
            
            if ($stmt->fetch()) {
                http_response_code(409);
                return Response::json(['error' => 'Template name already exists']);
            }
            
            $stmt = $db->prepare("
                INSERT INTO sms_templates (
                    user_id, workspace_id, name, description, message, category, is_favorite, created_at, updated_at
                ) VALUES (
                    :user_id, :workspace_id, :name, :description, :message, :category, :is_favorite, NOW(), NOW()
                )
            ");
            
            $stmt->execute([
                'user_id' => $userId,
                'workspace_id' => $workspaceId,
                'name' => $data['name'],
                'description' => $data['description'] ?? '',
                'message' => $content,
                'category' => $data['category'] ?? 'general',
                'is_favorite' => $data['is_favorite'] ?? 0
            ]);
            
            $templateId = $db->lastInsertId();
            
            // Get the created template
            return $this->getTemplate($templateId);
            
        } catch (Exception $e) {
            http_response_code(500);
            return Response::json(['error' => 'Failed to create template: ' . $e->getMessage()]);
        }
    }
    
    public function updateTemplate($id) {
        try {
            $userId = Auth::userIdOrFail();
            $data = json_decode(file_get_contents('php://input'), true);
            
            $db = Database::conn();
            
            // Use workspace scoping
            $scope = self::workspaceWhere();
            $workspaceId = $scope['params'][0];
            
            // Verify ownership via workspace
            $stmt = $db->prepare("SELECT id FROM sms_templates WHERE id = :id AND " . str_replace('?', ':ws_id', $scope['sql']));
            $stmt->execute(['id' => $id, 'ws_id' => $workspaceId]);
            
            if (!$stmt->fetch()) {
                http_response_code(404);
                return Response::json(['error' => 'Template not found']);
            }
            
            // Validate message length if provided
            if (isset($data['message']) && strlen($data['message']) > 1600) {
                http_response_code(400);
                return Response::json(['error' => 'Template message is too long (max 1600 characters)']);
            }
            
            // Check for duplicate name if name is being updated
            if (isset($data['name'])) {
                $stmt = $db->prepare("SELECT id FROM sms_templates WHERE " . str_replace('?', ':ws_id', $scope['sql']) . " AND name = :name AND id != :id");
                $stmt->execute([
                    'ws_id' => $workspaceId,
                    'name' => $data['name'],
                    'id' => $id
                ]);
                
                if ($stmt->fetch()) {
                    http_response_code(409);
                    return Response::json(['error' => 'Template name already exists']);
                }
            }
            
            $updateFields = [];
            $params = ['id' => $id, 'ws_id' => $workspaceId];
            
            $allowedFields = ['name', 'description', 'message', 'category', 'is_favorite'];
            foreach ($allowedFields as $field) {
                if (isset($data[$field])) {
                    $updateFields[] = "$field = :$field";
                    $params[$field] = $data[$field];
                }
            }
            
            if (empty($updateFields)) {
                http_response_code(400);
                return Response::json(['error' => 'No fields to update']);
            }
            
            $updateFields[] = "updated_at = NOW()";
            
            $stmt = $db->prepare("UPDATE sms_templates SET " . implode(', ', $updateFields) . " WHERE id = :id AND " . str_replace('?', ':ws_id', $scope['sql']));
            $stmt->execute($params);
            
            // Get updated template
            return $this->getTemplate($id);
            
        } catch (Exception $e) {
            http_response_code(500);
            return Response::json(['error' => 'Failed to update template: ' . $e->getMessage()]);
        }
    }
    
    public function deleteTemplate($id) {
        try {
            $userId = Auth::userIdOrFail();
            $db = Database::conn();
            
            // Use workspace scoping
            $scope = self::workspaceWhere();
            $workspaceId = $scope['params'][0];
            
            // Verify ownership via workspace
            $stmt = $db->prepare("SELECT id FROM sms_templates WHERE id = :id AND workspace_id = :ws_id");
            $stmt->execute(['id' => $id, 'ws_id' => $workspaceId]);
            
            if (!$stmt->fetch()) {
                http_response_code(404);
                return Response::json(['error' => 'Template not found']);
            }
            
            // Check if template is used in any campaigns
            $stmt = $db->prepare("SELECT COUNT(*) FROM sms_campaigns WHERE template_id = :id");
            $stmt->execute(['id' => $id]);
            $campaignCount = $stmt->fetchColumn();
            
            if ($campaignCount > 0) {
                http_response_code(409);
                return Response::json(['error' => 'Cannot delete template that is used in campaigns']);
            }
            
            // Delete template
            $stmt = $db->prepare("DELETE FROM sms_templates WHERE id = :id AND workspace_id = :ws_id");
            $stmt->execute(['id' => $id, 'ws_id' => $workspaceId]);
            
            return Response::json(['message' => 'Template deleted successfully']);
            
        } catch (Exception $e) {
            http_response_code(500);
            return Response::json(['error' => 'Failed to delete template: ' . $e->getMessage()]);
        }
    }
    
    public function duplicateTemplate($id) {
        try {
            $userId = Auth::userIdOrFail();
            $db = Database::conn();
            
            // Use workspace scoping
            $scope = self::workspaceWhere();
            $workspaceId = $scope['params'][0];
            
            // Get original template
            $stmt = $db->prepare("SELECT * FROM sms_templates WHERE id = :id AND workspace_id = :ws_id");
            $stmt->execute(['id' => $id, 'ws_id' => $workspaceId]);
            $template = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$template) {
                http_response_code(404);
                return ['error' => 'Template not found'];
            }
            
            // Create duplicate
            $stmt = $db->prepare("
                INSERT INTO sms_templates (
                    user_id, workspace_id, name, description, message, category, group_id, is_active, created_at, updated_at
                ) VALUES (
                    :user_id, :workspace_id, :name, :description, :message, :category, :group_id, :is_active, NOW(), NOW()
                )
            ");
            
            $stmt->execute([
                'user_id' => $userId,
                'workspace_id' => $workspaceId,
                'name' => $template['name'] . ' (Copy)',
                'description' => $template['description'],
                'message' => $template['message'],
                'category' => $template['category'],
                'group_id' => $template['group_id'],
                'is_active' => 0 // Duplicated templates start as inactive
            ]);
            
            $newTemplateId = $db->lastInsertId();
            
            // Get the duplicated template
            return $this->getTemplate($newTemplateId);
            
        } catch (Exception $e) {
            http_response_code(500);
            return ['error' => 'Failed to duplicate template: ' . $e->getMessage()];
        }
    }
    
    public function previewTemplate($id) {
        try {
            $userId = Auth::userIdOrFail();
            $data = json_decode(file_get_contents('php://input'), true);
            
            $db = Database::conn();
            
            // Use workspace scoping
            $scope = self::workspaceWhere();
            $workspaceId = $scope['params'][0];
            
            // Get template
            $stmt = $db->prepare("SELECT * FROM sms_templates WHERE id = :id AND workspace_id = :ws_id");
            $stmt->execute(['id' => $id, 'ws_id' => $workspaceId]);
            $template = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$template) {
                http_response_code(404);
                return ['error' => 'Template not found'];
            }
            
            // Sample recipient data for preview
            $sampleRecipient = [
                'firstName' => $data['firstName'] ?? 'John',
                'lastName' => $data['lastName'] ?? 'Doe',
                'name' => ($data['firstName'] ?? 'John') . ' ' . ($data['lastName'] ?? 'Doe'),
                'company' => $data['company'] ?? 'Acme Corp',
                'phone_number' => $data['phone_number'] ?? '+1234567890'
            ];
            
            // Replace variables in message
            $previewContent = $template['message'];
            foreach ($sampleRecipient as $key => $value) {
                $previewContent = str_replace('{{' . $key . '}}', $value, $previewContent);
            }
            
            // Calculate SMS segments
            $characterCount = strlen($previewContent);
            $smsSegments = 1;
            if ($characterCount > 160) {
                $smsSegments = ceil($characterCount / 153); // 153 chars per segment for concatenated SMS
            }
            
            return [
                'template' => [
                    'id' => $template['id'],
                    'name' => $template['name'],
                    'description' => $template['description'],
                    'category' => $template['category']
                ],
                'original_content' => $template['message'],
                'preview_content' => $previewContent,
                'sample_recipient' => $sampleRecipient,
                'statistics' => [
                    'character_count' => $characterCount,
                    'sms_segments' => $smsSegments,
                    'estimated_cost' => $smsSegments * 0.01 // Rough estimate
                ]
            ];
            
        } catch (Exception $e) {
            return ['error' => 'Failed to fetch categories: ' . $e->getMessage()];
        }
    }
    
    public function validateTemplate() {
        try {
            $data = json_decode(file_get_contents('php://input'), true);
            
            if (empty($data['message'])) {
                http_response_code(400);
                return ['error' => 'Template message is required'];
            }
            
            $content = $data['message'];
            $characterCount = strlen($content);
            
            // Check length limits
            if ($characterCount > 1600) {
                return [
                    'valid' => false,
                    'error' => 'Template content is too long (max 1600 characters)',
                    'character_count' => $characterCount
                ];
            }
            
            // Calculate SMS segments
            $smsSegments = 1;
            if ($characterCount > 160) {
                $smsSegments = ceil($characterCount / 153);
            }
            
            // Find variables in template
            preg_match_all('/\{\{(\w+)\}\}/', $content, $matches);
            $variables = array_unique($matches[1]);
            $variables = array_unique($matches[1]);
            
            // Check for valid variables
            $validVariables = ['firstName', 'lastName', 'name', 'company', 'phone_number'];
            $invalidVariables = array_diff($variables, $validVariables);
            
            return [
                'valid' => empty($invalidVariables),
                'character_count' => $characterCount,
                'sms_segments' => $smsSegments,
                'estimated_cost' => $smsSegments * 0.01,
                'variables' => $variables,
                'invalid_variables' => $invalidVariables,
                'warnings' => $characterCount > 160 ? ['Message will be sent as multiple SMS segments'] : []
            ];
            
        } catch (Exception $e) {
            http_response_code(500);
            return ['error' => 'Failed to validate template: ' . $e->getMessage()];
        }
    }
}