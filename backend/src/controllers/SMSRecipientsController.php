<?php

require_once __DIR__ . '/../Response.php';
require_once __DIR__ . '/../Database.php';
require_once __DIR__ . '/../Auth.php';
require_once __DIR__ . '/../traits/WorkspaceScoped.php';

class SMSRecipientsController {
    use WorkspaceScoped;
    
    public function getRecipients() {
        try {
            $userId = Auth::userIdOrFail();
            $db = Database::conn();
            
            $page = (int)($_GET['page'] ?? 1);
            $limit = (int)($_GET['limit'] ?? 50);
            $search = $_GET['search'] ?? '';
            $tag = $_GET['tag'] ?? '';
            $status = $_GET['status'] ?? '';
            $groupId = $_GET['group_id'] ?? '';
            $offset = ($page - 1) * $limit;
            
            // Use workspace scoping for tenant isolation
            $scope = self::workspaceWhere('sr');
            $whereConditions = [str_replace('?', ':ws_id', $scope['sql'])];
            $params = ['ws_id' => $scope['params'][0]];
            
            if (!empty($search)) {
                $whereConditions[] = '(sr.first_name LIKE :search OR sr.last_name LIKE :search OR sr.phone_number LIKE :search OR sr.company LIKE :search)';
                $params['search'] = '%' . $search . '%';
            }
            
            if (!empty($tag)) {
                $whereConditions[] = 'JSON_CONTAINS(sr.tags, :tag)';
                $params['tag'] = '"' . $tag . '"';
            }
            
            if (!empty($status)) {
                $whereConditions[] = 'sr.opt_in_status = :status';
                $params['status'] = $status;
            }
            
            if (!empty($groupId)) {
                $whereConditions[] = 'sr.group_id = :group_id';
                $params['group_id'] = $groupId;
            }
            
            $whereClause = implode(' AND ', $whereConditions);
            
            // Get total count
            $countStmt = $db->prepare("SELECT COUNT(*) FROM sms_recipients sr WHERE $whereClause");
            $countStmt->execute($params);
            $total = $countStmt->fetchColumn();
            
            // Get recipients
            $stmt = $db->prepare("
                SELECT sr.*, 
                    (SELECT COUNT(*) FROM sms_messages WHERE recipient_id = sr.id) as message_count,
                    (SELECT MAX(created_at) FROM sms_messages WHERE recipient_id = sr.id) as last_message_sent,
                    g.name as group_name
                FROM sms_recipients sr
                LEFT JOIN groups g ON sr.group_id = g.id
                WHERE $whereClause 
                ORDER BY sr.created_at DESC 
                LIMIT :limit OFFSET :offset
            ");
            
            foreach ($params as $key => $value) {
                $stmt->bindValue($key, $value);
            }
            $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
            $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
            
            $stmt->execute();
            $recipients = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Parse JSON fields
            foreach ($recipients as &$recipient) {
                $recipient['tags'] = json_decode($recipient['tags'] ?? '[]', true);
                $recipient['custom_fields'] = json_decode($recipient['custom_fields'] ?? '{}', true);
            }
            
            Response::json([
                'recipients' => $recipients,
                'pagination' => [
                    'page' => $page,
                    'limit' => $limit,
                    'total' => $total,
                    'pages' => ceil($total / $limit)
                ]
            ]);
            
        } catch (Exception $e) {
            Response::error('Failed to fetch recipients: ' . $e->getMessage(), 500);
        }
    }
    
    public function createRecipient() {
        try {
            $userId = Auth::userIdOrFail();
            $data = json_decode(file_get_contents('php://input'), true);
            
            // Validate required fields
            if (empty($data['phone_number'])) {
                Response::error('Phone number is required', 400);
                return;
            }
            
            // Validate phone number format
            $smsService = new SMSService();
            if (!$smsService->validatePhoneNumber($data['phone_number'])) {
                Response::error('Invalid phone number format', 400);
                return;
            }
            
            $db = Database::conn();
            
            // Use workspace scoping
            $scope = self::workspaceWhere();
            $workspaceId = $scope['params'][0];
            
            // Check for duplicate phone number
            $stmt = $db->prepare("SELECT id FROM sms_recipients WHERE " . str_replace('?', ':ws_id', $scope['sql']) . " AND phone_number = :phone");
            $stmt->execute([
                'ws_id' => $workspaceId,
                'phone' => $data['phone_number']
            ]);
            
            if ($stmt->fetch()) {
                Response::error('Phone number already exists', 409);
                return;
            }
            
            $stmt = $db->prepare("
                INSERT INTO sms_recipients (
                    user_id, workspace_id, first_name, last_name, phone_number, company, group_id,
                    tags, custom_fields, opt_in_status, opt_in_date, created_at, updated_at
                ) VALUES (
                    :user_id, :workspace_id, :first_name, :last_name, :phone_number, :company, :group_id,
                    :tags, :custom_fields, :opt_in_status, NOW(), NOW(), NOW()
                )
            ");
            
            $stmt->execute([
                'user_id' => $userId,
                'workspace_id' => $workspaceId,
                'first_name' => $data['first_name'] ?? '',
                'last_name' => $data['last_name'] ?? '',
                'phone_number' => $data['phone_number'],
                'company' => $data['company'] ?? '',
                'group_id' => $data['group_id'] ?? null,
                'tags' => json_encode($data['tags'] ?? []),
                'custom_fields' => json_encode($data['custom_fields'] ?? []),
                'opt_in_status' => $data['opt_in_status'] ?? 'opted_in'
            ]);
            
            $recipientId = $db->lastInsertId();
            
            // Get the created recipient
            $stmt = $db->prepare("SELECT * FROM sms_recipients WHERE id = :id");
            $stmt->execute(['id' => $recipientId]);
            $recipient = $stmt->fetch(PDO::FETCH_ASSOC);
            
            $recipient['tags'] = json_decode($recipient['tags'] ?? '[]', true);
            $recipient['custom_fields'] = json_decode($recipient['custom_fields'] ?? '{}', true);
            
            Response::json(['recipient' => $recipient]);
            
        } catch (Exception $e) {
            Response::error('Failed to create recipient: ' . $e->getMessage(), 500);
        }
    }
    
    public function updateRecipient($id) {
        try {
            $userId = Auth::userIdOrFail();
            $data = json_decode(file_get_contents('php://input'), true);
            
            $db = Database::conn();
            
            // Use workspace scoping
            $scope = self::workspaceWhere();
            $workspaceId = $scope['params'][0];
            
            // Verify ownership via workspace
            $stmt = $db->prepare("SELECT id FROM sms_recipients WHERE id = :id AND " . str_replace('?', ':ws_id', $scope['sql']));
            $stmt->execute(['id' => $id, 'ws_id' => $workspaceId]);
            
            if (!$stmt->fetch()) {
                http_response_code(404);
                return Response::json(['error' => 'Recipient not found']);
            }
            
            // Validate phone number if provided
            if (!empty($data['phone_number'])) {
                $smsService = new SMSService();
                if (!$smsService->validatePhoneNumber($data['phone_number'])) {
                    http_response_code(400);
                    return Response::json(['error' => 'Invalid phone number format']);
                }
                
                // Check for duplicate phone number (excluding current recipient)
                $stmt = $db->prepare("SELECT id FROM sms_recipients WHERE " . str_replace('?', ':ws_id', $scope['sql']) . " AND phone_number = :phone AND id != :id");
                $stmt->execute([
                    'ws_id' => $workspaceId,
                    'phone' => $data['phone_number'],
                    'id' => $id
                ]);
                
                if ($stmt->fetch()) {
                    http_response_code(409);
                    return Response::json(['error' => 'Phone number already exists']);
                }
            }
            
            $updateFields = [];
            $params = ['id' => $id];
            
            $allowedFields = ['first_name', 'last_name', 'phone_number', 'company', 'opt_in_status'];
            foreach ($allowedFields as $field) {
                if (isset($data[$field])) {
                    $updateFields[] = "$field = :$field";
                    $params[$field] = $data[$field];
                }
            }
            
            if (isset($data['tags'])) {
                $updateFields[] = "tags = :tags";
                $params['tags'] = json_encode($data['tags']);
            }
            
            if (isset($data['custom_fields'])) {
                $updateFields[] = "custom_fields = :custom_fields";
                $params['custom_fields'] = json_encode($data['custom_fields']);
            }
            
            // Handle opt-out date
            if (isset($data['opt_in_status'])) {
                if ($data['opt_in_status'] === 'opted_out') {
                    $updateFields[] = "opt_out_date = NOW()";
                } else {
                    $updateFields[] = "opt_out_date = NULL";
                }
            }
            
            $updateFields[] = "updated_at = NOW()";
            
            if (empty($updateFields)) {
                http_response_code(400);
                return Response::json(['error' => 'No fields to update']);
            }
            
            $stmt = $db->prepare("UPDATE sms_recipients SET " . implode(', ', $updateFields) . " WHERE id = :id");
            $stmt->execute($params);
            
            // Get updated recipient
            $stmt = $db->prepare("SELECT * FROM sms_recipients WHERE id = :id");
            $stmt->execute(['id' => $id]);
            $recipient = $stmt->fetch(PDO::FETCH_ASSOC);
            
            $recipient['tags'] = json_decode($recipient['tags'] ?? '[]', true);
            $recipient['custom_fields'] = json_decode($recipient['custom_fields'] ?? '{}', true);
            
            return Response::json(['recipient' => $recipient]);
            
        } catch (Exception $e) {
            http_response_code(500);
            return Response::json(['error' => 'Failed to update recipient: ' . $e->getMessage()]);
        }
    }
    
    public function deleteRecipient($id) {
        try {
            $userId = Auth::userIdOrFail();
            $db = Database::conn();
            
            // Use workspace scoping
            $scope = self::workspaceWhere();
            $workspaceId = $scope['params'][0];
            
            // Verify ownership via workspace
            $stmt = $db->prepare("SELECT id FROM sms_recipients WHERE id = :id AND " . str_replace('?', ':ws_id', $scope['sql']));
            $stmt->execute(['id' => $id, 'ws_id' => $workspaceId]);
            
            if (!$stmt->fetch()) {
                http_response_code(404);
                return Response::json(['error' => 'Recipient not found']);
            }
            
            // Delete recipient (messages will be kept for analytics)
            $stmt = $db->prepare("DELETE FROM sms_recipients WHERE id = :id AND " . str_replace('?', ':ws_id', $scope['sql']));
            $stmt->execute(['id' => $id, 'ws_id' => $workspaceId]);
            
            return Response::json(['message' => 'Recipient deleted successfully']);
            
        } catch (Exception $e) {
            http_response_code(500);
            return Response::json(['error' => 'Failed to delete recipient: ' . $e->getMessage()]);
        }
    }
    
    public function bulkImport() {
        try {
            $userId = Auth::userIdOrFail();
            
            if (!isset($_FILES['file']) || $_FILES['file']['error'] !== UPLOAD_ERR_OK) {
                http_response_code(400);
                return Response::json(['error' => 'No file uploaded or upload error']);
            }
            
            $file = $_FILES['file'];
            $mapping = json_decode($_POST['mapping'] ?? '{}', true);
            
            if (empty($mapping)) {
                http_response_code(400);
                return Response::json(['error' => 'Field mapping is required']);
            }
            
            // Read CSV file
            $handle = fopen($file['tmp_name'], 'r');
            if (!$handle) {
                http_response_code(400);
                return Response::json(['error' => 'Failed to read file']);
            }
            
            $headers = fgetcsv($handle);
            $recipients = [];
            $errors = [];
            $lineNumber = 2; // Start from line 2 (after headers)
            
            $smsService = new SMSService();
            $db = Database::conn();
            
            while (($row = fgetcsv($handle)) !== false) {
                $recipient = [];
                $hasPhone = false;
                
                foreach ($mapping as $csvColumn => $dbField) {
                    $columnIndex = array_search($csvColumn, $headers);
                    if ($columnIndex !== false && isset($row[$columnIndex])) {
                        $value = trim($row[$columnIndex]);
                        
                        if ($dbField === 'phone_number') {
                            if (!empty($value)) {
                                if ($smsService->validatePhoneNumber($value)) {
                                    $recipient[$dbField] = $value;
                                    $hasPhone = true;
                                } else {
                                    $errors[] = "Line $lineNumber: Invalid phone number format";
                                    continue 2;
                                }
                            }
                        } elseif ($dbField === 'tags') {
                            $recipient[$dbField] = !empty($value) ? explode(',', $value) : [];
                        } else {
                            $recipient[$dbField] = $value;
                        }
                    }
                }
                
                if (!$hasPhone) {
                    $errors[] = "Line $lineNumber: Phone number is required";
                    $lineNumber++;
                    continue;
                }
                
                $recipient['user_id'] = $userId;
                $recipient['opt_in_status'] = 'opted_in';
                $recipients[] = $recipient;
                $lineNumber++;
            }
            
            fclose($handle);
            
            if (empty($recipients)) {
                http_response_code(400);
                return ['error' => 'No valid recipients found', 'errors' => $errors];
            }
            
            // Insert recipients
            $imported = 0;
            $duplicates = 0;
            
            foreach ($recipients as $recipient) {
                try {
                    // Check for duplicate using workspace scoping
                    $scope = self::workspaceWhere();
                    $workspaceId = $scope['params'][0];
                    $stmt = $db->prepare("SELECT id FROM sms_recipients WHERE workspace_id = :ws_id AND phone_number = :phone");
                    $stmt->execute([
                        'ws_id' => $workspaceId,
                        'phone' => $recipient['phone_number']
                    ]);
                    
                    if ($stmt->fetch()) {
                        $duplicates++;
                        continue;
                    }
                    
                    $stmt = $db->prepare("
                        INSERT INTO sms_recipients (
                            user_id, workspace_id, first_name, last_name, phone_number, company,
                            tags, custom_fields, opt_in_status, opt_in_date, created_at, updated_at
                        ) VALUES (
                            :user_id, :workspace_id, :first_name, :last_name, :phone_number, :company,
                            :tags, :custom_fields, :opt_in_status, NOW(), NOW(), NOW()
                        )
                    ");
                    
                    $stmt->execute([
                        'user_id' => $recipient['user_id'],
                        'workspace_id' => $workspaceId,
                        'first_name' => $recipient['first_name'] ?? '',
                        'last_name' => $recipient['last_name'] ?? '',
                        'phone_number' => $recipient['phone_number'],
                        'company' => $recipient['company'] ?? '',
                        'tags' => json_encode($recipient['tags'] ?? []),
                        'custom_fields' => json_encode([]),
                        'opt_in_status' => $recipient['opt_in_status']
                    ]);
                    
                    $imported++;
                    
                } catch (Exception $e) {
                    $errors[] = "Failed to import recipient {$recipient['phone_number']}: " . $e->getMessage();
                }
            }
            
            return [
                'imported' => $imported,
                'duplicates' => $duplicates,
                'errors' => $errors
            ];
            
        } catch (Exception $e) {
            http_response_code(500);
            return ['error' => 'Import failed: ' . $e->getMessage()];
        }
    }
    
    public function bulkAction() {
        try {
            $userId = Auth::userIdOrFail();
            $data = json_decode(file_get_contents('php://input'), true);
            
            $action = $data['action'] ?? '';
            $recipientIds = $data['recipient_ids'] ?? [];
            
            if (empty($action) || empty($recipientIds)) {
                http_response_code(400);
                return ['error' => 'Action and recipient IDs are required'];
            }
            
            $db = Database::conn();
            $placeholders = str_repeat('?,', count($recipientIds) - 1) . '?';
            
            switch ($action) {
                case 'delete':
                    $stmt = $db->prepare("DELETE FROM sms_recipients WHERE user_id = ? AND id IN ($placeholders)");
                    $params = array_merge([$userId], $recipientIds);
                    $stmt->execute($params);
                    $affected = $stmt->rowCount();
                    return ['message' => "$affected recipients deleted"];
                    
                case 'opt_out':
                    $stmt = $db->prepare("UPDATE sms_recipients SET opt_in_status = 'opted_out', opt_out_date = NOW(), updated_at = NOW() WHERE user_id = ? AND id IN ($placeholders)");
                    $params = array_merge([$userId], $recipientIds);
                    $stmt->execute($params);
                    $affected = $stmt->rowCount();
                    return ['message' => "$affected recipients opted out"];
                    
                case 'opt_in':
                    $stmt = $db->prepare("UPDATE sms_recipients SET opt_in_status = 'opted_in', opt_out_date = NULL, updated_at = NOW() WHERE user_id = ? AND id IN ($placeholders)");
                    $params = array_merge([$userId], $recipientIds);
                    $stmt->execute($params);
                    $affected = $stmt->rowCount();
                    return ['message' => "$affected recipients opted in"];
                    
                case 'add_tag':
                    $tag = $data['tag'] ?? '';
                    if (empty($tag)) {
                        http_response_code(400);
                        return ['error' => 'Tag is required'];
                    }
                    
                    // Get recipients and update tags
                    $stmt = $db->prepare("SELECT id, tags FROM sms_recipients WHERE user_id = ? AND id IN ($placeholders)");
                    $params = array_merge([$userId], $recipientIds);
                    $stmt->execute($params);
                    $recipients = $stmt->fetchAll(PDO::FETCH_ASSOC);
                    
                    $affected = 0;
                    foreach ($recipients as $recipient) {
                        $tags = json_decode($recipient['tags'] ?? '[]', true);
                        if (!in_array($tag, $tags)) {
                            $tags[] = $tag;
                            $stmt = $db->prepare("UPDATE sms_recipients SET tags = ?, updated_at = NOW() WHERE id = ?");
                            $stmt->execute([json_encode($tags), $recipient['id']]);
                            $affected++;
                        }
                    }
                    
                    return ['message' => "Tag added to $affected recipients"];
                    
                case 'remove_tag':
                    $tag = $data['tag'] ?? '';
                    if (empty($tag)) {
                        http_response_code(400);
                        return ['error' => 'Tag is required'];
                    }
                    
                    // Get recipients and update tags
                    $stmt = $db->prepare("SELECT id, tags FROM sms_recipients WHERE user_id = ? AND id IN ($placeholders)");
                    $params = array_merge([$userId], $recipientIds);
                    $stmt->execute($params);
                    $recipients = $stmt->fetchAll(PDO::FETCH_ASSOC);
                    
                    $affected = 0;
                    foreach ($recipients as $recipient) {
                        $tags = json_decode($recipient['tags'] ?? '[]', true);
                        $index = array_search($tag, $tags);
                        if ($index !== false) {
                            unset($tags[$index]);
                            $tags = array_values($tags); // Reindex array
                            $stmt = $db->prepare("UPDATE sms_recipients SET tags = ?, updated_at = NOW() WHERE id = ?");
                            $stmt->execute([json_encode($tags), $recipient['id']]);
                            $affected++;
                        }
                    }
                    
                    return ['message' => "Tag removed from $affected recipients"];
                    
                default:
                    http_response_code(400);
                    return ['error' => 'Invalid action'];
            }
            
        } catch (Exception $e) {
            http_response_code(500);
            return ['error' => 'Bulk action failed: ' . $e->getMessage()];
        }
    }
    
    public function getUnsubscribedRecipients() {
        try {
            $userId = Auth::userIdOrFail();
            $db = Database::conn();
            
            // Use workspace scoping
            $scope = self::workspaceWhere();
            $workspaceId = $scope['params'][0];
            
            $campaignId = $_GET['campaignId'] ?? '';
            
            $whereConditions = ['sr.workspace_id = :ws_id', "sr.opt_in_status = 'opted_out'"];
            $params = ['ws_id' => $workspaceId];
            
            if (!empty($campaignId)) {
                $whereConditions[] = 'sr.campaign_id = :campaign_id';
                $params['campaign_id'] = $campaignId;
            }
            
            $whereClause = implode(' AND ', $whereConditions);
            
            $stmt = $db->prepare("
                SELECT 
                    sr.*,
                    sr.opt_out_date as unsubscribed_at,
                    1 as unsubscribes,
                    NULL as campaign_name
                FROM sms_recipients sr
                WHERE $whereClause
                ORDER BY sr.opt_out_date DESC
            ");
            $stmt->execute($params);
            $recipients = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Parse JSON fields and format data
            foreach ($recipients as &$recipient) {
                $recipient['tags'] = json_decode($recipient['tags'] ?? '[]', true);
                $recipient['custom_fields'] = json_decode($recipient['custom_fields'] ?? '{}', true);
                $recipient['phone'] = $recipient['phone_number']; // Add phone alias for frontend compatibility
                $recipient['name'] = trim(($recipient['first_name'] ?? '') . ' ' . ($recipient['last_name'] ?? ''));
                if (empty($recipient['name'])) {
                    $recipient['name'] = null;
                }
            }
            
            Response::json(['items' => $recipients]);
            
        } catch (Exception $e) {
            Response::error('Failed to fetch unsubscribed recipients: ' . $e->getMessage(), 500);
        }
    }

    public function bulkUnsubscribe() {
        try {
            $userId = Auth::userIdOrFail();
            $data = json_decode(file_get_contents('php://input'), true);
            
            $phones = $data['phones'] ?? [];
            
            if (!is_array($phones) || empty($phones)) {
                http_response_code(400);
                return ['error' => 'Phone numbers array is required'];
            }
            
            $db = Database::conn();
            $success = [];
            $failed = [];
            
            foreach ($phones as $phone) {
                $phone = trim($phone);
                if (empty($phone)) {
                    $failed[] = $phone;
                    continue;
                }
                
                try {
                    // Find recipients with this phone number that belong to the user
                    $stmt = $db->prepare("
                        SELECT id, phone_number 
                        FROM sms_recipients 
                        WHERE user_id = ? AND phone_number = ? AND opt_in_status != 'opted_out'
                    ");
                    $stmt->execute([$userId, $phone]);
                    $recipients = $stmt->fetchAll(PDO::FETCH_ASSOC);
                    
                    if (empty($recipients)) {
                        $failed[] = $phone;
                        continue;
                    }
                    
                    // Update all matching recipients to opted_out
                    $recipientIds = array_column($recipients, 'id');
                    $placeholders = str_repeat('?,', count($recipientIds) - 1) . '?';
                    
                    $updateStmt = $db->prepare("
                        UPDATE sms_recipients 
                        SET opt_in_status = 'opted_out', opt_out_date = NOW(), updated_at = NOW() 
                        WHERE user_id = ? AND id IN ($placeholders)
                    ");
                    $params = array_merge([$userId], $recipientIds);
                    $updateStmt->execute($params);
                    
                    if ($updateStmt->rowCount() > 0) {
                        $success[] = $phone;
                    } else {
                        $failed[] = $phone;
                    }
                    
                } catch (Exception $e) {
                    error_log("Failed to unsubscribe phone $phone: " . $e->getMessage());
                    $failed[] = $phone;
                }
            }
            
            return [
                'success' => $success,
                'failed' => $failed,
                'message' => count($success) . ' phone numbers unsubscribed successfully, ' . count($failed) . ' failed'
            ];
            
        } catch (Exception $e) {
            http_response_code(500);
            return ['error' => 'Bulk unsubscribe failed: ' . $e->getMessage()];
        }
    }

    public function getTags() {
        try {
            $userId = Auth::userIdOrFail();
            $db = Database::conn();
            
            // Use workspace scoping
            $scope = self::workspaceWhere();
            $workspaceId = $scope['params'][0];
            
            $stmt = $db->prepare("SELECT tags FROM sms_recipients WHERE workspace_id = :ws_id AND tags IS NOT NULL AND tags != '[]'");
            $stmt->execute(['ws_id' => $workspaceId]);
            $results = $stmt->fetchAll(PDO::FETCH_COLUMN);
            
            $allTags = [];
            foreach ($results as $tagsJson) {
                $tags = json_decode($tagsJson, true);
                if (is_array($tags)) {
                    $allTags = array_merge($allTags, $tags);
                }
            }
            
            $uniqueTags = array_unique($allTags);
            sort($uniqueTags);
            
            return ['tags' => $uniqueTags];
            
        } catch (Exception $e) {
            http_response_code(500);
            return ['error' => 'Failed to fetch tags: ' . $e->getMessage()];
        }
    }

    public function exportRecipients() {
        try {
            $userId = Auth::userIdOrFail();
            $db = Database::conn();
            
            // Use workspace scoping
            $scope = self::workspaceWhere();
            $workspaceId = $scope['params'][0];
            
            // Get all recipients for the workspace
            $stmt = $db->prepare("
                SELECT 
                    first_name, 
                    last_name, 
                    phone_number, 
                    company, 
                    tags, 
                    opt_in_status,
                    created_at
                FROM sms_recipients 
                WHERE workspace_id = :ws_id 
                ORDER BY created_at DESC
            ");
            $stmt->execute(['ws_id' => $workspaceId]);
            $recipients = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            if (empty($recipients)) {
                return ['error' => 'No recipients found'];
            }
            
            // Create CSV content
            $csv = "First Name,Last Name,Phone Number,Company,Tags,Opt-in Status,Created At\n";
            
            foreach ($recipients as $recipient) {
                $tags = json_decode($recipient['tags'] ?? '[]', true);
                $tagsString = is_array($tags) ? implode(';', $tags) : '';
                
                $csv .= sprintf(
                    '"%s","%s","%s","%s","%s","%s","%s"' . "\n",
                    addslashes($recipient['first_name'] ?? ''),
                    addslashes($recipient['last_name'] ?? ''),
                    addslashes($recipient['phone_number'] ?? ''),
                    addslashes($recipient['company'] ?? ''),
                    addslashes($tagsString),
                    addslashes($recipient['opt_in_status'] ?? ''),
                    addslashes($recipient['created_at'] ?? '')
                );
            }
            
            // Set headers for CSV download
            header('Content-Type: text/csv');
            header('Content-Disposition: attachment; filename="sms-recipients-' . date('Y-m-d') . '.csv"');
            
            return $csv;
            
        } catch (Exception $e) {
            http_response_code(500);
            return ['error' => 'Export failed: ' . $e->getMessage()];
        }
    }
}
