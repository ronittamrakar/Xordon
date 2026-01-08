<?php
/**
 * Workflow Execution Service
 * Processes workflow enrollments and executes actions
 */

require_once __DIR__ . '/../Database.php';
require_once __DIR__ . '/../Logger.php';
require_once __DIR__ . '/NotificationSender.php';
require_once __DIR__ . '/BusinessEventsService.php';

class WorkflowExecutionService {
    
    /**
     * Process pending workflow enrollments
     */
    public static function processPendingEnrollments(int $limit = 100): array {
        $db = Database::conn();
        
        // Get enrollments ready to process
        $stmt = $db->prepare("
            SELECT e.*, w.name as workflow_name, w.steps
            FROM workflow_enrollments e
            JOIN workflows w ON e.workflow_id = w.id
            WHERE e.status = 'active'
            AND (e.next_step_at IS NULL OR e.next_step_at <= NOW())
            ORDER BY e.next_step_at ASC, e.created_at ASC
            LIMIT ?
        ");
        $stmt->execute([$limit]);
        $enrollments = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        $processed = 0;
        $failed = 0;
        
        foreach ($enrollments as $enrollment) {
            try {
                self::processEnrollment($enrollment);
                $processed++;
            } catch (Exception $e) {
                Logger::error("Workflow enrollment {$enrollment['id']} failed: " . $e->getMessage());
                self::markEnrollmentFailed($enrollment['id'], $e->getMessage());
                $failed++;
            }
        }
        
        return [
            'processed' => $processed,
            'failed' => $failed,
            'total' => count($enrollments)
        ];
    }
    
    /**
     * Process a single enrollment
     */
    private static function processEnrollment(array $enrollment): void {
        $db = Database::conn();
        
        $steps = json_decode($enrollment['steps'], true) ?? [];
        $currentStepIndex = $enrollment['current_step_index'];
        
        // Check if workflow is complete
        if ($currentStepIndex >= count($steps)) {
            self::completeEnrollment($enrollment['id']);
            return;
        }
        
        $step = $steps[$currentStepIndex];
        
        // Log execution start
        self::logExecution($enrollment['id'], $currentStepIndex, 'started', null);
        
        // Check conditions if present
        if (!empty($step['conditions'])) {
            $conditionsMet = self::evaluateConditions($step['conditions'], $enrollment);
            if (!$conditionsMet) {
                self::logExecution($enrollment['id'], $currentStepIndex, 'skipped', 'Conditions not met');
                self::advanceToNextStep($enrollment['id'], $currentStepIndex);
                return;
            }
        }
        
        // Execute action
        $result = self::executeAction($step, $enrollment);
        
        if ($result['success']) {
            self::logExecution($enrollment['id'], $currentStepIndex, 'completed', $result['message'] ?? null);
            
            // Handle wait/delay
            if ($step['type'] === 'wait' && !empty($step['config']['duration'])) {
                $delay = self::parseDelay($step['config']['duration']);
                self::scheduleNextStep($enrollment['id'], $currentStepIndex, $delay);
            } else {
                self::advanceToNextStep($enrollment['id'], $currentStepIndex);
            }
        } else {
            self::logExecution($enrollment['id'], $currentStepIndex, 'failed', $result['error'] ?? 'Unknown error');
            self::markEnrollmentFailed($enrollment['id'], $result['error'] ?? 'Action execution failed');
        }
    }
    
    /**
     * Execute workflow action
     */
    private static function executeAction(array $step, array $enrollment): array {
        $db = Database::conn();
        $config = $step['config'] ?? [];
        
        switch ($step['type']) {
            case 'send_email':
                return self::executeSendEmail($config, $enrollment);
                
            case 'send_sms':
                return self::executeSendSms($config, $enrollment);
                
            case 'add_tag':
                return self::executeAddTag($config, $enrollment);
                
            case 'remove_tag':
                return self::executeRemoveTag($config, $enrollment);
                
            case 'update_field':
                return self::executeUpdateField($config, $enrollment);
                
            case 'create_task':
                return self::executeCreateTask($config, $enrollment);
                
            case 'add_to_sequence':
                return self::executeAddToSequence($config, $enrollment);
                
            case 'webhook':
                return self::executeWebhook($config, $enrollment);
                
            case 'wait':
                return ['success' => true, 'message' => 'Wait step scheduled'];
                
            case 'if_then':
                return ['success' => true, 'message' => 'Condition evaluated'];
                
            default:
                return ['success' => false, 'error' => 'Unknown action type: ' . $step['type']];
        }
    }
    
    /**
     * Execute send email action
     */
    private static function executeSendEmail(array $config, array $enrollment): array {
        $db = Database::conn();
        
        // Get contact details
        $stmt = $db->prepare("SELECT * FROM contacts WHERE id = ?");
        $stmt->execute([$enrollment['contact_id']]);
        $contact = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$contact || !$contact['email']) {
            return ['success' => false, 'error' => 'Contact email not found'];
        }
        
        $subject = self::replaceVariables($config['subject'] ?? 'Message from workflow', $contact);
        $body = self::replaceVariables($config['body'] ?? '', $contact);
        
        $result = NotificationSender::sendEmail(
            $enrollment['workspace_id'],
            $contact['email'],
            $subject,
            $body,
            strip_tags($body),
            $config['from_email'] ?? null,
            $config['from_name'] ?? null,
            ['workflow_id' => $enrollment['workflow_id'], 'enrollment_id' => $enrollment['id']]
        );
        
        return $result;
    }
    
    /**
     * Execute send SMS action
     */
    private static function executeSendSms(array $config, array $enrollment): array {
        $db = Database::conn();
        
        $stmt = $db->prepare("SELECT * FROM contacts WHERE id = ?");
        $stmt->execute([$enrollment['contact_id']]);
        $contact = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$contact || !$contact['phone']) {
            return ['success' => false, 'error' => 'Contact phone not found'];
        }
        
        $message = self::replaceVariables($config['message'] ?? '', $contact);
        
        $result = NotificationSender::sendSms(
            $enrollment['workspace_id'],
            $contact['phone'],
            $message,
            $config['from_number'] ?? null,
            ['workflow_id' => $enrollment['workflow_id'], 'enrollment_id' => $enrollment['id']]
        );
        
        return $result;
    }
    
    /**
     * Execute add tag action
     */
    private static function executeAddTag(array $config, array $enrollment): array {
        $db = Database::conn();
        
        if (empty($config['tag_id'])) {
            return ['success' => false, 'error' => 'Tag ID not specified'];
        }
        
        try {
            $stmt = $db->prepare("
                INSERT IGNORE INTO contact_tags (contact_id, tag_id)
                VALUES (?, ?)
            ");
            $stmt->execute([$enrollment['contact_id'], $config['tag_id']]);
            
            return ['success' => true, 'message' => 'Tag added'];
        } catch (Exception $e) {
            return ['success' => false, 'error' => $e->getMessage()];
        }
    }
    
    /**
     * Execute remove tag action
     */
    private static function executeRemoveTag(array $config, array $enrollment): array {
        $db = Database::conn();
        
        if (empty($config['tag_id'])) {
            return ['success' => false, 'error' => 'Tag ID not specified'];
        }
        
        try {
            $stmt = $db->prepare("
                DELETE FROM contact_tags 
                WHERE contact_id = ? AND tag_id = ?
            ");
            $stmt->execute([$enrollment['contact_id'], $config['tag_id']]);
            
            return ['success' => true, 'message' => 'Tag removed'];
        } catch (Exception $e) {
            return ['success' => false, 'error' => $e->getMessage()];
        }
    }
    
    /**
     * Execute update field action
     */
    private static function executeUpdateField(array $config, array $enrollment): array {
        $db = Database::conn();
        
        if (empty($config['field']) || !isset($config['value'])) {
            return ['success' => false, 'error' => 'Field or value not specified'];
        }
        
        $allowedFields = ['first_name', 'last_name', 'company', 'title', 'notes', 'status', 'lead_score'];
        
        if (!in_array($config['field'], $allowedFields)) {
            return ['success' => false, 'error' => 'Invalid field'];
        }
        
        try {
            $stmt = $db->prepare("
                UPDATE contacts 
                SET {$config['field']} = ?, updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            ");
            $stmt->execute([$config['value'], $enrollment['contact_id']]);
            
            return ['success' => true, 'message' => 'Field updated'];
        } catch (Exception $e) {
            return ['success' => false, 'error' => $e->getMessage()];
        }
    }
    
    /**
     * Execute create task action
     */
    private static function executeCreateTask(array $config, array $enrollment): array {
        $db = Database::conn();
        
        try {
            $stmt = $db->prepare("
                INSERT INTO tasks 
                (workspace_id, contact_id, title, description, due_date, priority, status, created_by)
                VALUES (?, ?, ?, ?, ?, ?, 'pending', ?)
            ");
            
            $dueDate = null;
            if (!empty($config['due_in_days'])) {
                $dueDate = date('Y-m-d', strtotime("+{$config['due_in_days']} days"));
            }
            
            $stmt->execute([
                $enrollment['workspace_id'],
                $enrollment['contact_id'],
                $config['title'] ?? 'Follow up',
                $config['description'] ?? '',
                $dueDate,
                $config['priority'] ?? 'medium',
                $enrollment['user_id'] ?? null
            ]);
            
            return ['success' => true, 'message' => 'Task created'];
        } catch (Exception $e) {
            return ['success' => false, 'error' => $e->getMessage()];
        }
    }
    
    /**
     * Execute add to sequence action
     */
    private static function executeAddToSequence(array $config, array $enrollment): array {
        $db = Database::conn();
        
        if (empty($config['sequence_id'])) {
            return ['success' => false, 'error' => 'Sequence ID not specified'];
        }
        
        try {
            $stmt = $db->prepare("
                INSERT INTO sequence_contacts 
                (sequence_id, contact_id, status, current_step)
                VALUES (?, ?, 'active', 0)
                ON DUPLICATE KEY UPDATE status = 'active', current_step = 0
            ");
            $stmt->execute([$config['sequence_id'], $enrollment['contact_id']]);
            
            return ['success' => true, 'message' => 'Added to sequence'];
        } catch (Exception $e) {
            return ['success' => false, 'error' => $e->getMessage()];
        }
    }
    
    /**
     * Execute webhook action
     */
    private static function executeWebhook(array $config, array $enrollment): array {
        if (empty($config['url'])) {
            return ['success' => false, 'error' => 'Webhook URL not specified'];
        }
        
        $db = Database::conn();
        $stmt = $db->prepare("SELECT * FROM contacts WHERE id = ?");
        $stmt->execute([$enrollment['contact_id']]);
        $contact = $stmt->fetch(PDO::FETCH_ASSOC);
        
        $payload = [
            'workflow_id' => $enrollment['workflow_id'],
            'enrollment_id' => $enrollment['id'],
            'contact' => $contact,
            'timestamp' => date('c')
        ];
        
        $ch = curl_init($config['url']);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
        curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
        curl_setopt($ch, CURLOPT_TIMEOUT, 10);
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        
        if ($httpCode >= 200 && $httpCode < 300) {
            return ['success' => true, 'message' => 'Webhook sent'];
        }
        
        return ['success' => false, 'error' => "Webhook failed: HTTP $httpCode"];
    }
    
    /**
     * Evaluate conditions
     */
    private static function evaluateConditions(array $conditions, array $enrollment): bool {
        $db = Database::conn();
        
        $stmt = $db->prepare("SELECT * FROM contacts WHERE id = ?");
        $stmt->execute([$enrollment['contact_id']]);
        $contact = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$contact) {
            return false;
        }
        
        foreach ($conditions as $condition) {
            $field = $condition['field'] ?? '';
            $operator = $condition['operator'] ?? 'equals';
            $value = $condition['value'] ?? '';
            
            $contactValue = $contact[$field] ?? null;
            
            $result = self::evaluateCondition($contactValue, $operator, $value);
            
            if (!$result) {
                return false;
            }
        }
        
        return true;
    }
    
    /**
     * Evaluate single condition
     */
    private static function evaluateCondition($contactValue, string $operator, $expectedValue): bool {
        switch ($operator) {
            case 'equals':
                return $contactValue == $expectedValue;
            case 'not_equals':
                return $contactValue != $expectedValue;
            case 'contains':
                return stripos($contactValue, $expectedValue) !== false;
            case 'not_contains':
                return stripos($contactValue, $expectedValue) === false;
            case 'greater_than':
                return $contactValue > $expectedValue;
            case 'less_than':
                return $contactValue < $expectedValue;
            case 'is_empty':
                return empty($contactValue);
            case 'is_not_empty':
                return !empty($contactValue);
            default:
                return false;
        }
    }
    
    /**
     * Replace variables in text
     */
    private static function replaceVariables(string $text, array $contact): string {
        $replacements = [
            '{{first_name}}' => $contact['first_name'] ?? '',
            '{{last_name}}' => $contact['last_name'] ?? '',
            '{{email}}' => $contact['email'] ?? '',
            '{{phone}}' => $contact['phone'] ?? '',
            '{{company}}' => $contact['company'] ?? '',
            '{{title}}' => $contact['title'] ?? ''
        ];
        
        return str_replace(array_keys($replacements), array_values($replacements), $text);
    }
    
    /**
     * Parse delay duration
     */
    private static function parseDelay(string $duration): int {
        preg_match('/(\d+)\s*(minute|hour|day|week)s?/', $duration, $matches);
        
        if (count($matches) < 3) {
            return 0;
        }
        
        $value = (int)$matches[1];
        $unit = $matches[2];
        
        switch ($unit) {
            case 'minute':
                return $value * 60;
            case 'hour':
                return $value * 3600;
            case 'day':
                return $value * 86400;
            case 'week':
                return $value * 604800;
            default:
                return 0;
        }
    }
    
    /**
     * Advance to next step
     */
    private static function advanceToNextStep(int $enrollmentId, int $currentStepIndex): void {
        $db = Database::conn();
        
        $stmt = $db->prepare("
            UPDATE workflow_enrollments 
            SET current_step_index = ?, next_step_at = NULL, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        ");
        $stmt->execute([$currentStepIndex + 1, $enrollmentId]);
    }
    
    /**
     * Schedule next step with delay
     */
    private static function scheduleNextStep(int $enrollmentId, int $currentStepIndex, int $delaySeconds): void {
        $db = Database::conn();
        
        $nextStepAt = date('Y-m-d H:i:s', time() + $delaySeconds);
        
        $stmt = $db->prepare("
            UPDATE workflow_enrollments 
            SET current_step_index = ?, next_step_at = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        ");
        $stmt->execute([$currentStepIndex + 1, $nextStepAt, $enrollmentId]);
    }
    
    /**
     * Complete enrollment
     */
    private static function completeEnrollment(int $enrollmentId): void {
        $db = Database::conn();
        
        $stmt = $db->prepare("
            UPDATE workflow_enrollments 
            SET status = 'completed', completed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        ");
        $stmt->execute([$enrollmentId]);
    }
    
    /**
     * Mark enrollment as failed
     */
    private static function markEnrollmentFailed(int $enrollmentId, string $error): void {
        $db = Database::conn();
        
        $stmt = $db->prepare("
            UPDATE workflow_enrollments 
            SET status = 'failed', error_message = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        ");
        $stmt->execute([$error, $enrollmentId]);
    }
    
    /**
     * Log execution
     */
    private static function logExecution(int $enrollmentId, int $stepIndex, string $status, ?string $details): void {
        try {
            $db = Database::conn();
            $stmt = $db->prepare("
                INSERT INTO workflow_execution_logs 
                (enrollment_id, step_index, status, details)
                VALUES (?, ?, ?, ?)
            ");
            $stmt->execute([$enrollmentId, $stepIndex, $status, $details]);
        } catch (Exception $e) {
            Logger::error('Failed to log workflow execution: ' . $e->getMessage());
        }
    }
}
