<?php
/**
 * Automation Engine Service
 * 
 * Handles automation creation, trigger evaluation, and action execution.
 * 
 * **Feature: crm-enhancements**
 * **Requirements: 11.1, 11.2, 11.3, 11.4, 11.5**
 */

require_once __DIR__ . '/../Database.php';

class AutomationEngineService {
    private PDO $db;
    
    public function __construct(PDO $pdo) {
        $this->db = $pdo;
    }
    
    /**
     * Create a new automation
     * **Requirement 11.1**: Automation creation with conditions
     */
    public function createAutomation(int $userId, array $data): int {
        if (empty($data['name'])) {
            throw new InvalidArgumentException('Automation name is required');
        }
        
        if (empty($data['trigger_type'])) {
            throw new InvalidArgumentException('Trigger type is required');
        }
        
        if (empty($data['actions'])) {
            throw new InvalidArgumentException('At least one action is required');
        }
        
        // Validate trigger config
        $this->validateTriggerConfig($data['trigger_type'], $data['trigger_config'] ?? []);
        
        // Validate conditions
        if (!empty($data['conditions'])) {
            $this->validateConditions($data['conditions']);
        }
        
        // Validate actions
        $this->validateActions($data['actions']);
        
        $stmt = $this->db->prepare("
            INSERT INTO crm_automations (
                user_id, name, description, trigger_type, trigger_config, 
                conditions, actions, is_active, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
        ");
        
        $stmt->execute([
            $userId,
            $data['name'],
            $data['description'] ?? null,
            $data['trigger_type'],
            json_encode($data['trigger_config'] ?? []),
            json_encode($data['conditions'] ?? []),
            json_encode($data['actions']),
            $data['is_active'] ?? true
        ]);
        
        return (int) $this->db->lastInsertId();
    }
    
    /**
     * Evaluate trigger conditions
     * **Requirement 11.1, 11.2**: Condition evaluation with AND/OR logic
     */
    public function evaluateTrigger(int $automationId, array $context): bool {
        $automation = $this->getAutomationById($automationId);
        
        if (!$automation || !$automation['is_active']) {
            return false;
        }
        
        $conditions = $automation['conditions'];
        
        // No conditions means always trigger
        if (empty($conditions)) {
            return true;
        }
        
        return $this->evaluateConditions($conditions, $context);
    }
    
    /**
     * Evaluate conditions recursively with AND/OR logic
     */
    private function evaluateConditions(array $conditions, array $context): bool {
        // Check for compound conditions
        if (isset($conditions['operator'])) {
            $operator = strtolower($conditions['operator']);
            $subConditions = $conditions['conditions'] ?? [];
            
            if ($operator === 'and') {
                foreach ($subConditions as $condition) {
                    if (!$this->evaluateConditions($condition, $context)) {
                        return false;
                    }
                }
                return true;
            } elseif ($operator === 'or') {
                foreach ($subConditions as $condition) {
                    if ($this->evaluateConditions($condition, $context)) {
                        return true;
                    }
                }
                return false;
            }
        }
        
        // Single condition evaluation
        return $this->evaluateSingleCondition($conditions, $context);
    }
    
    /**
     * Evaluate a single condition
     */
    private function evaluateSingleCondition(array $condition, array $context): bool {
        $field = $condition['field'] ?? null;
        $operator = $condition['operator'] ?? 'equals';
        $value = $condition['value'] ?? null;
        
        if (!$field) {
            return true;
        }
        
        $contextValue = $this->getNestedValue($context, $field);
        
        switch ($operator) {
            case 'equals':
            case '=':
                return $contextValue == $value;
                
            case 'not_equals':
            case '!=':
                return $contextValue != $value;
                
            case 'greater_than':
            case '>':
                return $contextValue > $value;
                
            case 'less_than':
            case '<':
                return $contextValue < $value;
                
            case 'greater_or_equal':
            case '>=':
                return $contextValue >= $value;
                
            case 'less_or_equal':
            case '<=':
                return $contextValue <= $value;
                
            case 'contains':
                return strpos((string) $contextValue, (string) $value) !== false;
                
            case 'not_contains':
                return strpos((string) $contextValue, (string) $value) === false;
                
            case 'starts_with':
                return strpos((string) $contextValue, (string) $value) === 0;
                
            case 'ends_with':
                return substr((string) $contextValue, -strlen((string) $value)) === (string) $value;
                
            case 'is_empty':
                return empty($contextValue);
                
            case 'is_not_empty':
                return !empty($contextValue);
                
            case 'in':
                return in_array($contextValue, (array) $value);
                
            case 'not_in':
                return !in_array($contextValue, (array) $value);
                
            default:
                return false;
        }
    }
    
    /**
     * Get nested value from context using dot notation
     */
    private function getNestedValue(array $context, string $field) {
        $keys = explode('.', $field);
        $value = $context;
        
        foreach ($keys as $key) {
            if (is_array($value) && isset($value[$key])) {
                $value = $value[$key];
            } else {
                return null;
            }
        }
        
        return $value;
    }
    
    /**
     * Execute automation actions with chaining support
     * **Requirement 11.3**: Action chaining
     */
    public function executeActions(int $automationId, array $context, ?int $contactId = null): array {
        $automation = $this->getAutomationById($automationId);
        
        if (!$automation) {
            throw new Exception('Automation not found');
        }
        
        $startTime = microtime(true);
        $actions = $automation['actions'];
        $results = [];
        $status = 'success';
        $errorDetails = null;
        
        // Create execution log
        $executionId = $this->createExecutionLog($automationId, $contactId, $context);
        
        try {
            foreach ($actions as $index => $action) {
                // Queue action for execution
                $this->queueAction($executionId, $index, $action);
                
                // Execute action
                $result = $this->executeAction($action, $context, $contactId);
                $results[] = $result;
                
                // Update context with action result for chaining
                $context['previous_action_result'] = $result;
                
                // Check for conditional next action
                if (isset($action['on_success']) && $result['success']) {
                    $chainResult = $this->executeAction($action['on_success'], $context, $contactId);
                    $results[] = $chainResult;
                }
                
                if (isset($action['on_failure']) && !$result['success']) {
                    $chainResult = $this->executeAction($action['on_failure'], $context, $contactId);
                    $results[] = $chainResult;
                }
            }
        } catch (Exception $e) {
            $status = 'failed';
            $errorDetails = $e->getMessage();
        }
        
        $executionTime = (int) ((microtime(true) - $startTime) * 1000);
        
        // Update execution log
        $this->updateExecutionLog($executionId, $status, $results, $errorDetails, $executionTime);
        
        // Update automation stats
        $this->updateAutomationStats($automationId);
        
        return [
            'execution_id' => $executionId,
            'status' => $status,
            'results' => $results,
            'execution_time_ms' => $executionTime
        ];
    }
    
    /**
     * Execute a single action
     * **Requirement 11.5**: Error resilience
     */
    private function executeAction(array $action, array $context, ?int $contactId): array {
        $type = $action['type'] ?? 'unknown';
        
        try {
            switch ($type) {
                case 'send_email':
                    return $this->executeSendEmail($action, $context, $contactId);
                    
                case 'send_sms':
                    return $this->executeSendSms($action, $context, $contactId);
                    
                case 'update_contact':
                    return $this->executeUpdateContact($action, $context, $contactId);
                    
                case 'add_tag':
                    return $this->executeAddTag($action, $context, $contactId);
                    
                case 'remove_tag':
                    return $this->executeRemoveTag($action, $context, $contactId);
                    
                case 'create_task':
                    return $this->executeCreateTask($action, $context, $contactId);
                    
                case 'update_score':
                    return $this->executeUpdateScore($action, $context, $contactId);
                    
                case 'add_to_sequence':
                    return $this->executeAddToSequence($action, $context, $contactId);
                    
                case 'webhook':
                    return $this->executeWebhook($action, $context);
                    
                case 'delay':
                    return $this->executeDelay($action);
                    
                default:
                    return ['success' => false, 'error' => "Unknown action type: {$type}"];
            }
        } catch (Exception $e) {
            // Error resilience - log error but don't stop execution
            return ['success' => false, 'error' => $e->getMessage(), 'type' => $type];
        }
    }
    
    // Action implementations
    private function executeSendEmail(array $action, array $context, ?int $contactId): array {
        // Placeholder - would integrate with email service
        return ['success' => true, 'type' => 'send_email', 'message' => 'Email queued'];
    }
    
    private function executeSendSms(array $action, array $context, ?int $contactId): array {
        return ['success' => true, 'type' => 'send_sms', 'message' => 'SMS queued'];
    }
    
    private function executeUpdateContact(array $action, array $context, ?int $contactId): array {
        if (!$contactId) {
            return ['success' => false, 'error' => 'No contact ID'];
        }
        
        $updates = $action['updates'] ?? [];
        if (empty($updates)) {
            return ['success' => true, 'type' => 'update_contact', 'message' => 'No updates'];
        }
        
        $setClauses = [];
        $params = [];
        foreach ($updates as $field => $value) {
            $setClauses[] = "{$field} = ?";
            $params[] = $value;
        }
        $params[] = $contactId;
        
        $sql = "UPDATE contacts SET " . implode(', ', $setClauses) . " WHERE id = ?";
        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        
        return ['success' => true, 'type' => 'update_contact', 'updated_fields' => array_keys($updates)];
    }
    
    private function executeAddTag(array $action, array $context, ?int $contactId): array {
        return ['success' => true, 'type' => 'add_tag', 'tag' => $action['tag'] ?? 'unknown'];
    }
    
    private function executeRemoveTag(array $action, array $context, ?int $contactId): array {
        return ['success' => true, 'type' => 'remove_tag', 'tag' => $action['tag'] ?? 'unknown'];
    }
    
    private function executeCreateTask(array $action, array $context, ?int $contactId): array {
        return ['success' => true, 'type' => 'create_task', 'task' => $action['task'] ?? 'Follow up'];
    }
    
    private function executeUpdateScore(array $action, array $context, ?int $contactId): array {
        return ['success' => true, 'type' => 'update_score', 'adjustment' => $action['adjustment'] ?? 0];
    }
    
    private function executeAddToSequence(array $action, array $context, ?int $contactId): array {
        return ['success' => true, 'type' => 'add_to_sequence', 'sequence_id' => $action['sequence_id'] ?? null];
    }
    
    private function executeWebhook(array $action, array $context): array {
        $url = $action['url'] ?? null;
        if (!$url) {
            return ['success' => false, 'error' => 'No webhook URL'];
        }
        
        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => json_encode($context),
            CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => 10
        ]);
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        
        return [
            'success' => $httpCode >= 200 && $httpCode < 300,
            'type' => 'webhook',
            'http_code' => $httpCode
        ];
    }
    
    private function executeDelay(array $action): array {
        $seconds = $action['seconds'] ?? 0;
        return ['success' => true, 'type' => 'delay', 'seconds' => $seconds];
    }
    
    /**
     * Create execution log
     * **Requirement 11.4**: Execution logging
     */
    private function createExecutionLog(int $automationId, ?int $contactId, array $context): int {
        $stmt = $this->db->prepare("
            INSERT INTO automation_executions (
                automation_id, contact_id, trigger_context, status, executed_at
            ) VALUES (?, ?, ?, 'success', NOW())
        ");
        $stmt->execute([$automationId, $contactId, json_encode($context)]);
        
        return (int) $this->db->lastInsertId();
    }
    
    private function updateExecutionLog(int $executionId, string $status, array $results, ?string $error, int $executionTime): void {
        $stmt = $this->db->prepare("
            UPDATE automation_executions SET
                status = ?,
                actions_taken = ?,
                error_details = ?,
                execution_time_ms = ?
            WHERE id = ?
        ");
        $stmt->execute([$status, json_encode($results), $error, $executionTime, $executionId]);
    }
    
    private function queueAction(int $executionId, int $index, array $action): void {
        $stmt = $this->db->prepare("
            INSERT INTO automation_action_queue (
                execution_id, action_index, action_type, action_config, status, scheduled_at
            ) VALUES (?, ?, ?, ?, 'pending', NOW())
        ");
        $stmt->execute([$executionId, $index, $action['type'] ?? 'unknown', json_encode($action)]);
    }
    
    private function updateAutomationStats(int $automationId): void {
        $stmt = $this->db->prepare("
            UPDATE crm_automations SET
                execution_count = execution_count + 1,
                last_executed_at = NOW()
            WHERE id = ?
        ");
        $stmt->execute([$automationId]);
    }
    
    /**
     * Get automation by ID
     */
    public function getAutomationById(int $automationId): ?array {
        $stmt = $this->db->prepare("SELECT * FROM crm_automations WHERE id = ?");
        $stmt->execute([$automationId]);
        $automation = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($automation) {
            $automation['trigger_config'] = json_decode($automation['trigger_config'], true) ?? [];
            $automation['conditions'] = json_decode($automation['conditions'], true) ?? [];
            $automation['actions'] = json_decode($automation['actions'], true) ?? [];
        }
        
        return $automation ?: null;
    }
    
    /**
     * Get execution logs for automation
     */
    public function getExecutionLogs(int $automationId, int $limit = 50): array {
        $stmt = $this->db->prepare("
            SELECT ae.*, c.name as contact_name, c.email as contact_email
            FROM automation_executions ae
            LEFT JOIN contacts c ON ae.contact_id = c.id
            WHERE ae.automation_id = ?
            ORDER BY ae.executed_at DESC
            LIMIT ?
        ");
        $stmt->execute([$automationId, $limit]);
        $logs = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        foreach ($logs as &$log) {
            $log['trigger_context'] = json_decode($log['trigger_context'], true) ?? [];
            $log['conditions_evaluated'] = json_decode($log['conditions_evaluated'], true) ?? [];
            $log['actions_taken'] = json_decode($log['actions_taken'], true) ?? [];
        }
        
        return $logs;
    }
    
    /**
     * Get user's automations
     */
    public function getUserAutomations(int $userId): array {
        $stmt = $this->db->prepare("
            SELECT * FROM crm_automations 
            WHERE user_id = ? 
            ORDER BY created_at DESC
        ");
        $stmt->execute([$userId]);
        $automations = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        foreach ($automations as &$automation) {
            $automation['trigger_config'] = isset($automation['trigger_config']) ? (json_decode($automation['trigger_config'], true) ?? []) : [];
            $automation['conditions'] = isset($automation['conditions']) ? (json_decode($automation['conditions'], true) ?? []) : [];
            $automation['actions'] = isset($automation['actions']) ? (json_decode($automation['actions'], true) ?? []) : [];
        }
        
        return $automations;
    }
    
    // Validation methods
    private function validateTriggerConfig(string $type, array $config): void {
        $validTypes = ['contact_created', 'contact_updated', 'email_opened', 'email_clicked', 
                       'form_submitted', 'call_completed', 'deal_stage_changed', 'score_changed',
                       'tag_added', 'tag_removed', 'scheduled', 'webhook'];
        
        if (!in_array($type, $validTypes)) {
            throw new InvalidArgumentException("Invalid trigger type: {$type}");
        }
    }
    
    private function validateConditions(array $conditions): void {
        // Basic validation - conditions should have field, operator, value or be compound
        if (isset($conditions['operator'])) {
            if (!in_array(strtolower($conditions['operator']), ['and', 'or'])) {
                throw new InvalidArgumentException('Invalid condition operator');
            }
        }
    }
    
    private function validateActions(array $actions): void {
        $validTypes = ['send_email', 'send_sms', 'update_contact', 'add_tag', 'remove_tag',
                       'create_task', 'update_score', 'add_to_sequence', 'webhook', 'delay'];
        
        foreach ($actions as $action) {
            if (!isset($action['type']) || !in_array($action['type'], $validTypes)) {
                throw new InvalidArgumentException('Invalid action type');
            }
        }
    }

    /**
     * Toggle automation active status
     */
    public function toggleAutomation(int $id, bool $enabled, ?int $userId = null): array {
        $sql = "UPDATE crm_automations SET is_active = ?, updated_at = NOW() WHERE id = ?";
        $params = [$enabled ? 1 : 0, $id];
        
        if ($userId) {
            $sql .= " AND user_id = ?";
            $params[] = $userId;
        }
        
        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        
        if ($stmt->rowCount() === 0) {
            // Check if automation exists but user mismatch for better error debugging if needed
            // But relying on simple catch in controller.
            // Just return empty array to signal failure or throw exception
             throw new Exception('Automation not found or no change made');
        }
        
        return [
            'id' => $id,
            'is_active' => $enabled
        ];
    }
    
    /**
     * Delete automation
     */
    public function deleteAutomation(int $id, int $userId): bool {
        // First delete associated executions to prevent FK violations
        $stmt = $this->db->prepare("DELETE FROM automation_executions WHERE automation_id = ?");
        $stmt->execute([$id]);
        
        // Delete automation
        $stmt = $this->db->prepare("DELETE FROM crm_automations WHERE id = ? AND user_id = ?");
        $stmt->execute([$id, $userId]);
        
        return $stmt->rowCount() > 0;
    }
}
