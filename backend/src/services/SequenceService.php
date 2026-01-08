<?php
/**
 * SequenceService - Multi-channel outreach sequence management
 * Requirements: 2.1, 2.3, 2.4
 */

require_once __DIR__ . '/../Database.php';

class SequenceService {
    private PDO $db;
    
    public function __construct(PDO $pdo) {
        $this->db = $pdo;
    }
    
    /**
     * Create a new multi-channel sequence with step validation
     * Requirements: 2.1, 2.4
     * 
     * @param int $userId
     * @param string $name
     * @param array $steps
     * @param array|null $conditions
     * @param string|null $description
     * @return int Sequence ID
     */
    public function createSequence(int $userId, string $name, array $steps, ?array $conditions = null, ?string $description = null): int {
        // Validate steps
        $this->validateSteps($steps);
        
        // Validate conditions if provided
        if ($conditions !== null) {
            $this->validateConditions($conditions);
        }
        
        $stmt = $this->db->prepare("
            INSERT INTO sequences (user_id, name, description, steps, conditions, status, created_at)
            VALUES (?, ?, ?, ?, ?, 'active', NOW())
        ");
        
        $stmt->execute([
            $userId,
            $name,
            $description,
            json_encode($steps),
            $conditions ? json_encode($conditions) : null
        ]);
        
        return (int) $this->db->lastInsertId();
    }
    
    /**
     * Validate sequence steps configuration
     * Requirements: 2.1
     */
    private function validateSteps(array $steps): void {
        if (empty($steps)) {
            throw new InvalidArgumentException('Sequence must have at least one step');
        }
        
        $validTypes = ['email', 'sms', 'linkedin_connect', 'linkedin_message', 'call'];
        
        foreach ($steps as $index => $step) {
            if (!isset($step['type'])) {
                throw new InvalidArgumentException("Step {$index} missing required 'type' field");
            }
            
            if (!in_array($step['type'], $validTypes)) {
                throw new InvalidArgumentException("Step {$index} has invalid type: {$step['type']}");
            }
            
            // Validate delay if present
            if (isset($step['delay'])) {
                if (!is_array($step['delay']) || !isset($step['delay']['value']) || !isset($step['delay']['unit'])) {
                    throw new InvalidArgumentException("Step {$index} has invalid delay format");
                }
            }
        }
    }
    
    /**
     * Validate conditions configuration
     * Requirements: 2.4
     */
    private function validateConditions(array $conditions): void {
        $validConditionTypes = ['no_reply', 'opened', 'clicked', 'replied', 'bounced'];
        $validOperators = ['and', 'or'];
        
        foreach ($conditions as $condition) {
            if (isset($condition['type']) && !in_array($condition['type'], $validConditionTypes)) {
                throw new InvalidArgumentException("Invalid condition type: {$condition['type']}");
            }
            
            if (isset($condition['operator']) && !in_array(strtolower($condition['operator']), $validOperators)) {
                throw new InvalidArgumentException("Invalid condition operator: {$condition['operator']}");
            }
        }
    }
    
    /**
     * Execute the next step in a sequence for a contact
     * Requirements: 2.1, 2.4
     * 
     * @param int $sequenceId
     * @param int $contactId
     * @return array Execution result
     */
    public function executeStep(int $sequenceId, int $contactId): array {
        // Get sequence
        $sequence = $this->getSequenceById($sequenceId);
        if (!$sequence) {
            throw new RuntimeException('Sequence not found');
        }
        
        if ($sequence['status'] !== 'active') {
            throw new RuntimeException('Sequence is not active');
        }
        
        // Get or create execution record
        $execution = $this->getOrCreateExecution($sequenceId, $contactId);
        
        $steps = json_decode($sequence['steps'], true);
        $currentStep = $execution['current_step'];
        
        // Check if sequence is complete
        if ($currentStep >= count($steps)) {
            $this->completeExecution($execution['id']);
            return [
                'status' => 'completed',
                'message' => 'Sequence completed'
            ];
        }
        
        $step = $steps[$currentStep];
        
        // Evaluate conditions for this step
        $conditions = isset($step['conditions']) ? $step['conditions'] : [];
        if (!empty($conditions) && !$this->evaluateCondition($conditions, $execution['id'])) {
            // Skip this step and move to next
            $this->advanceStep($execution['id'], $currentStep + 1);
            return $this->executeStep($sequenceId, $contactId);
        }
        
        // Execute the step based on type
        $userId = (int) $sequence['user_id'];
        $result = $this->executeStepByType($step, $contactId, $execution['id'], $currentStep, $userId);
        
        // Log the step execution
        $this->logStepExecution($execution['id'], $currentStep, $step['type'], $result);
        
        // Advance to next step
        $this->advanceStep($execution['id'], $currentStep + 1);
        
        return $result;
    }
    
    /**
     * Evaluate conditional logic for sequence steps
     * Requirements: 2.4
     * 
     * @param array $conditions
     * @param int $executionId
     * @return bool
     */
    public function evaluateCondition(array $conditions, int $executionId): bool {
        if (empty($conditions)) {
            return true;
        }
        
        // Get previous step logs for this execution
        $stmt = $this->db->prepare("
            SELECT * FROM sequence_step_logs 
            WHERE execution_id = ? 
            ORDER BY step_index DESC 
            LIMIT 1
        ");
        $stmt->execute([$executionId]);
        $lastStep = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$lastStep) {
            return true; // No previous steps, proceed
        }
        
        $operator = isset($conditions['operator']) ? strtolower($conditions['operator']) : 'and';
        $conditionList = isset($conditions['conditions']) ? $conditions['conditions'] : [$conditions];
        
        $results = [];
        foreach ($conditionList as $condition) {
            $results[] = $this->evaluateSingleCondition($condition, $lastStep);
        }
        
        if ($operator === 'or') {
            return in_array(true, $results);
        }
        
        // Default to AND
        return !in_array(false, $results);
    }
    
    /**
     * Evaluate a single condition
     */
    private function evaluateSingleCondition(array $condition, array $lastStep): bool {
        $type = $condition['type'] ?? '';
        $duration = $condition['duration'] ?? null;
        
        switch ($type) {
            case 'no_reply':
                $hasReply = $lastStep['status'] === 'replied';
                if ($duration && !$hasReply) {
                    $stepTime = strtotime($lastStep['executed_at']);
                    $waitTime = $this->parseDuration($duration);
                    return (time() - $stepTime) >= $waitTime;
                }
                return !$hasReply;
                
            case 'opened':
                return $lastStep['status'] === 'opened' || $lastStep['status'] === 'clicked' || $lastStep['status'] === 'replied';
                
            case 'clicked':
                return $lastStep['status'] === 'clicked' || $lastStep['status'] === 'replied';
                
            case 'replied':
                return $lastStep['status'] === 'replied';
                
            case 'bounced':
                return $lastStep['status'] === 'failed';
                
            default:
                return true;
        }
    }
    
    /**
     * Parse duration object to seconds
     */
    private function parseDuration(array $duration): int {
        $value = $duration['value'] ?? 0;
        $unit = $duration['unit'] ?? 'hours';
        
        switch ($unit) {
            case 'minutes':
                return $value * 60;
            case 'hours':
                return $value * 3600;
            case 'days':
                return $value * 86400;
            default:
                return $value * 3600;
        }
    }
    
    /**
     * Execute step based on channel type
     */
    private function executeStepByType(array $step, int $contactId, int $executionId, int $stepIndex, int $userId = 1): array {
        $type = $step['type'];
        
        switch ($type) {
            case 'email':
                return $this->executeEmailStep($step, $contactId);
                
            case 'sms':
                return $this->executeSmsStep($step, $contactId);
                
            case 'linkedin_connect':
                return $this->executeLinkedInConnectStep($step, $contactId, $userId);
                
            case 'linkedin_message':
                return $this->executeLinkedInMessageStep($step, $contactId, $userId);
                
            case 'call':
                return $this->executeCallStep($step, $contactId);
                
            default:
                throw new RuntimeException("Unknown step type: {$type}");
        }
    }
    
    /**
     * Execute email step
     */
    private function executeEmailStep(array $step, int $contactId): array {
        // Get contact email
        $stmt = $this->db->prepare("SELECT email, name FROM contacts WHERE id = ?");
        $stmt->execute([$contactId]);
        $contact = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$contact || !$contact['email']) {
            return [
                'status' => 'failed',
                'channel' => 'email',
                'error' => 'Contact has no email address'
            ];
        }
        
        // In production, this would integrate with email service
        return [
            'status' => 'sent',
            'channel' => 'email',
            'recipient' => $contact['email'],
            'template' => $step['template'] ?? null,
            'timestamp' => date('Y-m-d H:i:s')
        ];
    }
    
    /**
     * Execute SMS step
     */
    private function executeSmsStep(array $step, int $contactId): array {
        $stmt = $this->db->prepare("SELECT phone, name FROM contacts WHERE id = ?");
        $stmt->execute([$contactId]);
        $contact = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$contact || !$contact['phone']) {
            return [
                'status' => 'failed',
                'channel' => 'sms',
                'error' => 'Contact has no phone number'
            ];
        }
        
        return [
            'status' => 'sent',
            'channel' => 'sms',
            'recipient' => $contact['phone'],
            'template' => $step['template'] ?? null,
            'timestamp' => date('Y-m-d H:i:s')
        ];
    }
    
    /**
     * Execute LinkedIn connection request step
     * Requirements: 2.2, 2.3
     */
    private function executeLinkedInConnectStep(array $step, int $contactId, int $userId): array {
        // Get LinkedIn profile for contact
        $stmt = $this->db->prepare("
            SELECT lp.*, c.name 
            FROM linkedin_profiles lp
            JOIN contacts c ON c.id = lp.contact_id
            WHERE lp.contact_id = ?
        ");
        $stmt->execute([$contactId]);
        $profile = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$profile || !$profile['linkedin_url']) {
            return [
                'status' => 'failed',
                'channel' => 'linkedin',
                'error' => 'Contact has no LinkedIn profile'
            ];
        }
        
        // Log LinkedIn message
        $this->logLinkedInMessage($contactId, $userId, 'connection_request', $step['message'] ?? '');
        
        return [
            'status' => 'sent',
            'channel' => 'linkedin',
            'type' => 'connection_request',
            'profile_url' => $profile['linkedin_url'],
            'profile_data' => [
                'name' => $profile['name'],
                'title' => $profile['title'],
                'company' => $profile['company']
            ],
            'timestamp' => date('Y-m-d H:i:s')
        ];
    }
    
    /**
     * Execute LinkedIn message step
     * Requirements: 2.2, 2.3
     */
    private function executeLinkedInMessageStep(array $step, int $contactId, int $userId): array {
        $stmt = $this->db->prepare("
            SELECT lp.*, c.name 
            FROM linkedin_profiles lp
            JOIN contacts c ON c.id = lp.contact_id
            WHERE lp.contact_id = ?
        ");
        $stmt->execute([$contactId]);
        $profile = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$profile) {
            return [
                'status' => 'failed',
                'channel' => 'linkedin',
                'error' => 'Contact has no LinkedIn profile'
            ];
        }
        
        // Log LinkedIn message
        $this->logLinkedInMessage($contactId, $userId, 'message', $step['message'] ?? '');
        
        return [
            'status' => 'sent',
            'channel' => 'linkedin',
            'type' => 'message',
            'profile_url' => $profile['linkedin_url'],
            'timestamp' => date('Y-m-d H:i:s')
        ];
    }
    
    /**
     * Execute call step
     */
    private function executeCallStep(array $step, int $contactId): array {
        $stmt = $this->db->prepare("SELECT phone, name FROM contacts WHERE id = ?");
        $stmt->execute([$contactId]);
        $contact = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$contact || !$contact['phone']) {
            return [
                'status' => 'failed',
                'channel' => 'call',
                'error' => 'Contact has no phone number'
            ];
        }
        
        return [
            'status' => 'scheduled',
            'channel' => 'call',
            'recipient' => $contact['phone'],
            'script' => $step['script'] ?? null,
            'timestamp' => date('Y-m-d H:i:s')
        ];
    }
    
    /**
     * Log LinkedIn message for timeline tracking
     * Requirements: 2.3
     */
    private function logLinkedInMessage(int $contactId, int $userId, string $type, string $content): void {
        $stmt = $this->db->prepare("
            INSERT INTO linkedin_messages (contact_id, user_id, message_type, content, status, created_at)
            VALUES (?, ?, ?, ?, 'sent', NOW())
        ");
        $stmt->execute([$contactId, $userId, $type, $content]);
    }

    
    /**
     * Get or create execution record for a sequence/contact pair
     */
    private function getOrCreateExecution(int $sequenceId, int $contactId): array {
        $stmt = $this->db->prepare("
            SELECT * FROM sequence_executions 
            WHERE sequence_id = ? AND contact_id = ?
        ");
        $stmt->execute([$sequenceId, $contactId]);
        $execution = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($execution) {
            return $execution;
        }
        
        // Create new execution
        $stmt = $this->db->prepare("
            INSERT INTO sequence_executions (sequence_id, contact_id, current_step, status, started_at)
            VALUES (?, ?, 0, 'active', NOW())
        ");
        $stmt->execute([$sequenceId, $contactId]);
        
        return [
            'id' => (int) $this->db->lastInsertId(),
            'sequence_id' => $sequenceId,
            'contact_id' => $contactId,
            'current_step' => 0,
            'status' => 'active'
        ];
    }
    
    /**
     * Advance execution to next step
     */
    private function advanceStep(int $executionId, int $nextStep): void {
        $stmt = $this->db->prepare("
            UPDATE sequence_executions 
            SET current_step = ?, last_step_at = NOW()
            WHERE id = ?
        ");
        $stmt->execute([$nextStep, $executionId]);
    }
    
    /**
     * Mark execution as completed
     */
    private function completeExecution(int $executionId): void {
        $stmt = $this->db->prepare("
            UPDATE sequence_executions 
            SET status = 'completed', completed_at = NOW()
            WHERE id = ?
        ");
        $stmt->execute([$executionId]);
    }
    
    /**
     * Log step execution
     */
    private function logStepExecution(int $executionId, int $stepIndex, string $stepType, array $result): void {
        $status = $result['status'] ?? 'pending';
        $statusMap = [
            'sent' => 'sent',
            'scheduled' => 'pending',
            'failed' => 'failed',
            'completed' => 'delivered'
        ];
        
        $stmt = $this->db->prepare("
            INSERT INTO sequence_step_logs (execution_id, step_index, step_type, status, metadata, executed_at)
            VALUES (?, ?, ?, ?, ?, NOW())
        ");
        $stmt->execute([
            $executionId,
            $stepIndex,
            $stepType,
            $statusMap[$status] ?? 'pending',
            json_encode($result)
        ]);
    }
    
    /**
     * Get sequence by ID
     */
    public function getSequenceById(int $sequenceId): ?array {
        $stmt = $this->db->prepare("SELECT * FROM sequences WHERE id = ?");
        $stmt->execute([$sequenceId]);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        return $result ?: null;
    }
    
    /**
     * Get all sequences for a user
     */
    public function getSequences(int $userId, ?string $status = null): array {
        $sql = "SELECT * FROM sequences WHERE user_id = ?";
        $params = [$userId];
        
        if ($status) {
            $sql .= " AND status = ?";
            $params[] = $status;
        }
        
        $sql .= " ORDER BY created_at DESC";
        
        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    
    /**
     * Get execution status for a sequence/contact
     */
    public function getExecutionStatus(int $sequenceId, int $contactId): ?array {
        $stmt = $this->db->prepare("
            SELECT se.*, s.name as sequence_name, s.steps
            FROM sequence_executions se
            JOIN sequences s ON s.id = se.sequence_id
            WHERE se.sequence_id = ? AND se.contact_id = ?
        ");
        $stmt->execute([$sequenceId, $contactId]);
        $execution = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$execution) {
            return null;
        }
        
        // Get step logs
        $stmt = $this->db->prepare("
            SELECT * FROM sequence_step_logs 
            WHERE execution_id = ? 
            ORDER BY step_index ASC
        ");
        $stmt->execute([$execution['id']]);
        $execution['step_logs'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        return $execution;
    }
    
    /**
     * Update sequence
     */
    public function updateSequence(int $sequenceId, int $userId, array $data): bool {
        // Verify ownership
        $stmt = $this->db->prepare("SELECT id FROM sequences WHERE id = ? AND user_id = ?");
        $stmt->execute([$sequenceId, $userId]);
        if (!$stmt->fetch()) {
            throw new RuntimeException('Sequence not found or access denied');
        }
        
        $updates = [];
        $params = [];
        
        if (isset($data['name'])) {
            $updates[] = "name = ?";
            $params[] = $data['name'];
        }
        
        if (isset($data['description'])) {
            $updates[] = "description = ?";
            $params[] = $data['description'];
        }
        
        if (isset($data['steps'])) {
            $this->validateSteps($data['steps']);
            $updates[] = "steps = ?";
            $params[] = json_encode($data['steps']);
        }
        
        if (isset($data['conditions'])) {
            if ($data['conditions'] !== null) {
                $this->validateConditions($data['conditions']);
            }
            $updates[] = "conditions = ?";
            $params[] = $data['conditions'] ? json_encode($data['conditions']) : null;
        }
        
        if (isset($data['status'])) {
            $updates[] = "status = ?";
            $params[] = $data['status'];
        }
        
        if (empty($updates)) {
            return false;
        }
        
        $params[] = $sequenceId;
        
        $stmt = $this->db->prepare("
            UPDATE sequences SET " . implode(', ', $updates) . ", updated_at = NOW() WHERE id = ?
        ");
        
        return $stmt->execute($params);
    }
    
    /**
     * Delete sequence
     */
    public function deleteSequence(int $sequenceId, int $userId): bool {
        $stmt = $this->db->prepare("DELETE FROM sequences WHERE id = ? AND user_id = ?");
        return $stmt->execute([$sequenceId, $userId]);
    }
    
    /**
     * Pause sequence execution for a contact
     */
    public function pauseExecution(int $sequenceId, int $contactId): bool {
        $stmt = $this->db->prepare("
            UPDATE sequence_executions 
            SET status = 'paused'
            WHERE sequence_id = ? AND contact_id = ?
        ");
        return $stmt->execute([$sequenceId, $contactId]);
    }
    
    /**
     * Resume sequence execution for a contact
     */
    public function resumeExecution(int $sequenceId, int $contactId): bool {
        $stmt = $this->db->prepare("
            UPDATE sequence_executions 
            SET status = 'active'
            WHERE sequence_id = ? AND contact_id = ? AND status = 'paused'
        ");
        return $stmt->execute([$sequenceId, $contactId]);
    }
}
