<?php
require_once __DIR__ . '/../Database.php';
require_once __DIR__ . '/../Response.php';
require_once __DIR__ . '/../Auth.php';
require_once __DIR__ . '/../traits/WorkspaceScoped.php';

class SMSSequencesController {
    use WorkspaceScoped;
    
    public function getSequences() {
        try {
            $userId = Auth::userIdOrFail();
            $db = Database::conn();
            
            // Use workspace scoping for tenant isolation
            $scope = self::workspaceWhere();
            $workspaceId = $scope['params'][0];
            
            $page = (int)($_GET['page'] ?? 1);
            $limit = (int)($_GET['limit'] ?? 20);
            $search = $_GET['search'] ?? '';
            $offset = ($page - 1) * $limit;
            
            $whereConditions = ['workspace_id = :ws_id'];
            $params = ['ws_id' => $workspaceId];
            
            if (!empty($search)) {
                $whereConditions[] = '(name LIKE :search OR description LIKE :search)';
                $params['search'] = '%' . $search . '%';
            }
            
            $whereClause = implode(' AND ', $whereConditions);
            
            // Get total count
            $countStmt = $db->prepare("SELECT COUNT(*) FROM sms_sequences WHERE $whereClause");
            $countStmt->execute($params);
            $total = $countStmt->fetchColumn();
            
            // Get sequences with step count
            $stmt = $db->prepare("
                SELECT s.*, 
                    COUNT(ss.id) as step_count,
                    (SELECT COUNT(*) FROM sms_campaigns WHERE sequence_id = s.id) as campaign_count
                FROM sms_sequences s
                LEFT JOIN sms_sequence_steps ss ON s.id = ss.sequence_id
                WHERE $whereClause 
                GROUP BY s.id
                ORDER BY s.created_at DESC 
                LIMIT :limit OFFSET :offset
            ");
            
            foreach ($params as $key => $value) {
                $stmt->bindValue($key, $value);
            }
            $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
            $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
            
            $stmt->execute();
            $sequences = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Transform sequences to match frontend expectations
            $transformedSequences = array_map(function($sequence) {
                // Convert is_active boolean to status string
                $sequence['status'] = $sequence['is_active'] ? 'active' : 'inactive';
                
                // Add default values for missing fields
                $sequence['subscriber_count'] = $sequence['subscriber_count'] ?? 0;
                $sequence['completion_rate'] = $sequence['completion_rate'] ?? 0;
                $sequence['group_id'] = $sequence['group_id'] ?? null;
                
                return $sequence;
            }, $sequences);
            
            Response::json([
                'sequences' => $transformedSequences,
                'pagination' => [
                    'page' => $page,
                    'limit' => $limit,
                    'total' => $total,
                    'pages' => ceil($total / $limit)
                ]
            ]);
            
        } catch (Exception $e) {
            Response::error('Failed to fetch sequences: ' . $e->getMessage(), 500);
        }
    }
    
    public function getSequence($id) {
        try {
            $userId = Auth::userIdOrFail();
            $db = Database::conn();
            
            // Use workspace scoping
            $scope = self::workspaceWhere();
            $workspaceId = $scope['params'][0];
            
            // Get sequence
            $stmt = $db->prepare("SELECT * FROM sms_sequences WHERE id = :id AND workspace_id = :ws_id");
            $stmt->execute(['id' => $id, 'ws_id' => $workspaceId]);
            $sequence = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$sequence) {
                http_response_code(404);
                return ['error' => 'Sequence not found'];
            }
            
            // Get sequence steps
            $stmt = $db->prepare("
                SELECT * FROM sms_sequence_steps 
                WHERE sequence_id = :sequence_id 
                ORDER BY step_order ASC
            ");
            $stmt->execute(['sequence_id' => $id]);
            $steps = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Convert delay_amount/delay_unit to delay_hours for frontend compatibility
            foreach ($steps as &$step) {
                if ($step['delay_unit'] === 'hours') {
                    $step['delay_hours'] = (int)$step['delay_amount'];
                } elseif ($step['delay_unit'] === 'minutes') {
                    $step['delay_hours'] = (int)($step['delay_amount'] / 60);
                } elseif ($step['delay_unit'] === 'days') {
                    $step['delay_hours'] = (int)($step['delay_amount'] * 24);
                } else {
                    $step['delay_hours'] = (int)$step['delay_amount'];
                }
                unset($step['delay_amount']);
                unset($step['delay_unit']);
            }
            
            $sequence['steps'] = $steps;
            
            // Transform sequence to match frontend expectations
            $sequence['status'] = $sequence['is_active'] ? 'active' : 'inactive';
            $sequence['subscriber_count'] = $sequence['subscriber_count'] ?? 0;
            $sequence['completion_rate'] = $sequence['completion_rate'] ?? 0;
            $sequence['group_id'] = $sequence['group_id'] ?? null;
            
            return Response::json(['sequence' => $sequence]);
            
        } catch (Exception $e) {
            return Response::json(['error' => 'Failed to fetch sequence: ' . $e->getMessage()], 500);
        }
    }
    
    public function createSequence() {
        try {
            $userId = Auth::userIdOrFail();
            $data = json_decode(file_get_contents('php://input'), true);
            
            // Validate required fields
            if (empty($data['name'])) {
                http_response_code(400);
                return Response::json(['error' => 'Sequence name is required']);
            }
            
            $db = Database::conn();
            $db->beginTransaction();
            
            try {
                // Handle status field (convert string status to is_active boolean)
                $isActive = 1; // Default to active
                if (isset($data['status'])) {
                    $isActive = ($data['status'] === 'active' || $data['status'] === 'paused') ? 1 : 0;
                } elseif (isset($data['is_active'])) {
                    $isActive = $data['is_active'] ? 1 : 0;
                }
                
                // Use workspace scoping
                $scope = self::workspaceWhere();
                $workspaceId = $scope['params'][0];
                
                // Create sequence
                $stmt = $db->prepare("
                    INSERT INTO sms_sequences (
                        user_id, workspace_id, name, description, is_active, created_at, updated_at
                    ) VALUES (
                        :user_id, :workspace_id, :name, :description, :is_active, NOW(), NOW()
                    )
                ");
                
                $stmt->execute([
                    'user_id' => $userId,
                    'workspace_id' => $workspaceId,
                    'name' => $data['name'],
                    'description' => $data['description'] ?? '',
                    'is_active' => $isActive
                ]);
                
                $sequenceId = $db->lastInsertId();
                
                // Create sequence steps if provided
                if (!empty($data['steps']) && is_array($data['steps'])) {
                    foreach ($data['steps'] as $index => $step) {
                        if (empty($step['message'])) {
                            continue; // Skip empty steps
                        }
                        
                        // Handle both delay_hours (frontend) and delay_amount/delay_unit (backend) formats
                        $delayAmount = $step['delay_hours'] ?? $step['delay_amount'] ?? 0;
                        $delayUnit = 'hours'; // Default to hours since frontend uses delay_hours
                        if (isset($step['delay_amount']) && isset($step['delay_unit'])) {
                            $delayAmount = $step['delay_amount'];
                            $delayUnit = $step['delay_unit'];
                        }
                        
                        $stmt = $db->prepare("
                            INSERT INTO sms_sequence_steps (
                                sequence_id, step_order, message, delay_amount, delay_unit, created_at, updated_at
                            ) VALUES (
                                :sequence_id, :step_order, :message, :delay_amount, :delay_unit, NOW(), NOW()
                            )
                        ");
                        
                        $stmt->execute([
                            'sequence_id' => $sequenceId,
                            'step_order' => $index + 1,
                            'message' => $step['message'],
                            'delay_amount' => $delayAmount,
                            'delay_unit' => $delayUnit
                        ]);
                    }
                }
                
                $db->commit();
                
                // Get the created sequence with steps and return it wrapped in sequence property
                $result = $this->getSequence($sequenceId);
                return $result;
                
            } catch (Exception $e) {
                $db->rollBack();
                throw $e;
            }
            
        } catch (Exception $e) {
            http_response_code(500);
            return Response::json(['error' => 'Failed to create sequence: ' . $e->getMessage()]);
        }
    }
    
    public function updateSequence($id) {
        try {
            $userId = Auth::userIdOrFail();
            $data = json_decode(file_get_contents('php://input'), true);
            
            $db = Database::conn();
            
            // Use workspace scoping
            $scope = self::workspaceWhere();
            $workspaceId = $scope['params'][0];
            
            // Verify ownership via workspace
            $stmt = $db->prepare("SELECT id FROM sms_sequences WHERE id = :id AND workspace_id = :ws_id");
            $stmt->execute(['id' => $id, 'ws_id' => $workspaceId]);
            
            if (!$stmt->fetch()) {
                http_response_code(404);
                return Response::json(['error' => 'Sequence not found']);
            }
            
            $db->beginTransaction();
            
            try {
                // Update sequence
                $updateFields = [];
                $params = ['id' => $id];
                
                $allowedFields = ['name', 'description', 'is_active'];
                foreach ($allowedFields as $field) {
                    if (isset($data[$field])) {
                        $updateFields[] = "$field = :$field";
                        $params[$field] = $data[$field];
                    }
                }
                
                // Handle status field (convert string status to is_active boolean)
                if (isset($data['status'])) {
                    $isActive = ($data['status'] === 'active' || $data['status'] === 'paused') ? 1 : 0;
                    $updateFields[] = "is_active = :is_active";
                    $params['is_active'] = $isActive;
                }
                
                if (!empty($updateFields)) {
                    $updateFields[] = "updated_at = NOW()";
                    $stmt = $db->prepare("UPDATE sms_sequences SET " . implode(', ', $updateFields) . " WHERE id = :id");
                    $stmt->execute($params);
                }
                
                // Update steps if provided
                if (isset($data['steps']) && is_array($data['steps'])) {
                    // Delete existing steps
                    $stmt = $db->prepare("DELETE FROM sms_sequence_steps WHERE sequence_id = :sequence_id");
                    $stmt->execute(['sequence_id' => $id]);
                    
                    // Create new steps
                    foreach ($data['steps'] as $index => $step) {
                        if (empty($step['message'])) {
                            continue; // Skip empty steps
                        }
                        
                        // Handle both delay_hours (frontend) and delay_amount/delay_unit (backend) formats
                        $delayAmount = $step['delay_hours'] ?? $step['delay_amount'] ?? 0;
                        $delayUnit = 'hours'; // Default to hours since frontend uses delay_hours
                        if (isset($step['delay_amount']) && isset($step['delay_unit'])) {
                            $delayAmount = $step['delay_amount'];
                            $delayUnit = $step['delay_unit'];
                        }
                        
                        $stmt = $db->prepare("
                            INSERT INTO sms_sequence_steps (
                                sequence_id, step_order, message, delay_amount, delay_unit, created_at, updated_at
                            ) VALUES (
                                :sequence_id, :step_order, :message, :delay_amount, :delay_unit, NOW(), NOW()
                            )
                        ");
                        
                        $stmt->execute([
                            'sequence_id' => $id,
                            'step_order' => $index + 1,
                            'message' => $step['message'],
                            'delay_amount' => $delayAmount,
                            'delay_unit' => $delayUnit
                        ]);
                    }
                }
                
                $db->commit();
                
                // Get updated sequence and return it wrapped in sequence property
                $result = $this->getSequence($id);
                return $result;
                
            } catch (Exception $e) {
                $db->rollBack();
                throw $e;
            }
            
        } catch (Exception $e) {
            http_response_code(500);
            return ['error' => 'Failed to update sequence: ' . $e->getMessage()];
        }
    }
    
    public function deleteSequence($id) {
        try {
            $userId = Auth::userIdOrFail();
            $db = Database::conn();
            
            // Use workspace scoping
            $scope = self::workspaceWhere();
            $workspaceId = $scope['params'][0];
            
            // Verify ownership via workspace
            $stmt = $db->prepare("SELECT id FROM sms_sequences WHERE id = :id AND workspace_id = :ws_id");
            $stmt->execute(['id' => $id, 'ws_id' => $workspaceId]);
            
            if (!$stmt->fetch()) {
                http_response_code(404);
                return ['error' => 'Sequence not found'];
            }
            
            // Check if sequence is used in any campaigns
            $stmt = $db->prepare("SELECT COUNT(*) FROM sms_campaigns WHERE sequence_id = :sequence_id");
            $stmt->execute(['sequence_id' => $id]);
            $campaignCount = $stmt->fetchColumn();
            
            if ($campaignCount > 0) {
                http_response_code(409);
                return ['error' => 'Cannot delete sequence that is used in campaigns'];
            }
            
            $db->beginTransaction();
            
            try {
                // Delete sequence steps
                $stmt = $db->prepare("DELETE FROM sms_sequence_steps WHERE sequence_id = :sequence_id");
                $stmt->execute(['sequence_id' => $id]);
                
                // Delete sequence
                $stmt = $db->prepare("DELETE FROM sms_sequences WHERE id = :id");
                $stmt->execute(['id' => $id]);
                
                $db->commit();
                
                return ['message' => 'Sequence deleted successfully'];
                
            } catch (Exception $e) {
                $db->rollBack();
                throw $e;
            }
            
        } catch (Exception $e) {
            http_response_code(500);
            return ['error' => 'Failed to delete sequence: ' . $e->getMessage()];
        }
    }
    
    public function duplicateSequence($id) {
        try {
            $userId = Auth::userIdOrFail();
            $db = Database::conn();
            
            // Use workspace scoping
            $scope = self::workspaceWhere();
            $workspaceId = $scope['params'][0];
            
            // Get original sequence
            $stmt = $db->prepare("SELECT * FROM sms_sequences WHERE id = :id AND workspace_id = :ws_id");
            $stmt->execute(['id' => $id, 'ws_id' => $workspaceId]);
            $sequence = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$sequence) {
                http_response_code(404);
                return ['error' => 'Sequence not found'];
            }
            
            // Get sequence steps
            $stmt = $db->prepare("SELECT * FROM sms_sequence_steps WHERE sequence_id = :sequence_id ORDER BY step_order ASC");
            $stmt->execute(['sequence_id' => $id]);
            $steps = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            $db->beginTransaction();
            
            try {
                // Create new sequence
                $stmt = $db->prepare("
                    INSERT INTO sms_sequences (
                        user_id, workspace_id, name, description, is_active, created_at, updated_at
                    ) VALUES (
                        :user_id, :workspace_id, :name, :description, :is_active, NOW(), NOW()
                    )
                ");
                
                $stmt->execute([
                    'user_id' => $userId,
                    'workspace_id' => $workspaceId,
                    'name' => $sequence['name'] . ' (Copy)',
                    'description' => $sequence['description'],
                    'is_active' => 0 // Duplicated sequences start as inactive
                ]);
                
                $newSequenceId = $db->lastInsertId();
                
                // Duplicate steps
                foreach ($steps as $step) {
                    $stmt = $db->prepare("
                        INSERT INTO sms_sequence_steps (
                            sequence_id, step_order, message, delay_amount, delay_unit, created_at, updated_at
                        ) VALUES (
                            :sequence_id, :step_order, :message, :delay_amount, :delay_unit, NOW(), NOW()
                        )
                    ");
                    
                    $stmt->execute([
                        'sequence_id' => $newSequenceId,
                        'step_order' => $step['step_order'],
                        'message' => $step['message'],
                        'delay_amount' => $step['delay_amount'],
                        'delay_unit' => $step['delay_unit']
                    ]);
                }
                
                $db->commit();
                
                // Get the duplicated sequence and return it wrapped in sequence property
                $result = $this->getSequence($newSequenceId);
                return $result;
                
            } catch (Exception $e) {
                $db->rollBack();
                throw $e;
            }
            
        } catch (Exception $e) {
            http_response_code(500);
            return ['error' => 'Failed to duplicate sequence: ' . $e->getMessage()];
        }
    }
    
    public function getSequenceTemplates() {
        try {
            $userId = Auth::userIdOrFail();
            $db = Database::conn();
            
            // Use workspace scoping
            $scope = self::workspaceWhere();
            $workspaceId = $scope['params'][0];
            
            // Get workspace's sequences that can be used as templates
            $stmt = $db->prepare("
                SELECT s.*, COUNT(ss.id) as step_count
                FROM sms_sequences s
                LEFT JOIN sms_sequence_steps ss ON s.id = ss.sequence_id
                WHERE s.workspace_id = :ws_id AND s.is_active = 1
                GROUP BY s.id
                ORDER BY s.name ASC
            ");
            $stmt->execute(['ws_id' => $workspaceId]);
            $templates = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            return ['templates' => $templates];
            
        } catch (Exception $e) {
            http_response_code(500);
            return ['error' => 'Failed to fetch sequence templates: ' . $e->getMessage()];
        }
    }
    
    public function previewSequence($id) {
        $userId = Auth::userIdOrFail();
        
        // Debug output
        file_put_contents('php://stderr', "previewSequence called with ID: $id\n");
        
        // Get the sequence using the existing getSequence method
        $sequenceResult = $this->getSequence($id);
        if (isset($sequenceResult['error'])) {
            return Response::json(['error' => $sequenceResult['error']], 404);
        }
        
        $sequence = $sequenceResult['sequence'];
        
        // Get sample recipient data from request
        $data = Request::json();
        $sampleRecipient = [
            'firstName' => $data['firstName'] ?? 'John',
            'lastName' => $data['lastName'] ?? 'Doe',
            'name' => ($data['firstName'] ?? 'John') . ' ' . ($data['lastName'] ?? 'Doe'),
            'email' => $data['email'] ?? 'john@example.com',
            'company' => $data['company'] ?? 'Example Company'
        ];
        
        // Process steps with sample data
        $steps = [];
        foreach ($sequence['steps'] as $step) {
            $processedStep = $step;
            $processedStep['message'] = $this->replaceVariables($step['message'], $sampleRecipient);
            $steps[] = $processedStep;
        }
        
        return Response::json(['steps' => $steps]);
    }
    
    private function replaceVariables($message, $recipient) {
        $variables = [
            '{{firstName}}' => $recipient['firstName'] ?? '',
            '{{lastName}}' => $recipient['lastName'] ?? '',
            '{{name}}' => $recipient['name'] ?? '',
            '{{email}}' => $recipient['email'] ?? '',
            '{{company}}' => $recipient['company'] ?? '',
        ];
        
        return str_replace(array_keys($variables), array_values($variables), $message);
    }
}
