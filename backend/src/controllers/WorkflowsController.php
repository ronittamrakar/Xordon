<?php
/**
 * Workflows Controller
 * Visual workflow builder for GHL-style automations
 * Supports: triggers, conditions, waits, actions, branching
 */

require_once __DIR__ . '/../Database.php';
require_once __DIR__ . '/../Response.php';
require_once __DIR__ . '/../Auth.php';

class WorkflowsController {
    private static function getWorkspaceId(): int {
        $ctx = $GLOBALS['tenantContext'] ?? null;
        if ($ctx && isset($ctx->workspaceId)) {
            return (int)$ctx->workspaceId;
        }
        throw new Exception('Workspace context required');
    }

    // Available trigger types
    private static $triggerTypes = [
        'contact.created' => 'Contact Created',
        'contact.tag_added' => 'Tag Added to Contact',
        'contact.tag_removed' => 'Tag Removed from Contact',
        'form.submitted' => 'Form Submitted',
        'appointment.booked' => 'Appointment Booked',
        'appointment.cancelled' => 'Appointment Cancelled',
        'appointment.completed' => 'Appointment Completed',
        'opportunity.created' => 'Opportunity Created',
        'opportunity.stage_changed' => 'Opportunity Stage Changed',
        'opportunity.won' => 'Opportunity Won',
        'opportunity.lost' => 'Opportunity Lost',
        'invoice.created' => 'Invoice Created',
        'invoice.paid' => 'Invoice Paid',
        'invoice.overdue' => 'Invoice Overdue',
        'call.completed' => 'Call Completed',
        'email.opened' => 'Email Opened',
        'email.clicked' => 'Email Link Clicked',
        'email.replied' => 'Email Replied',
        'sms.received' => 'SMS Received',
        'review.received' => 'Review Received',
        'job.created' => 'Job Created',
        'job.completed' => 'Job Completed',
        'custom.webhook' => 'Custom Webhook',
        'manual' => 'Manual Trigger',
    ];

    // Available action types
    private static $actionTypes = [
        'send_email' => 'Send Email',
        'send_sms' => 'Send SMS',
        'create_task' => 'Create Task',
        'add_tag' => 'Add Tag',
        'remove_tag' => 'Remove Tag',
        'update_contact' => 'Update Contact Field',
        'move_opportunity' => 'Move Opportunity to Stage',
        'create_opportunity' => 'Create Opportunity',
        'assign_user' => 'Assign to User',
        'send_notification' => 'Send Internal Notification',
        'webhook' => 'Call Webhook',
        'add_to_campaign' => 'Add to Campaign',
        'remove_from_campaign' => 'Remove from Campaign',
        'schedule_appointment' => 'Schedule Appointment',
        'send_review_request' => 'Send Review Request',
        'create_invoice' => 'Create Invoice',
        'enroll_in_workflow' => 'Enroll in Another Workflow',
        'exit_workflow' => 'Exit Workflow',
    ];

    /**
     * List all workflows
     */
    public static function index() {
        try {
            $workspaceId = self::getWorkspaceId();
            $db = Database::conn();
            
            $status = $_GET['status'] ?? null;
            
            $sql = "
                SELECT w.*,
                       (SELECT COUNT(*) FROM workflow_steps ws WHERE ws.workflow_id = w.id) as step_count,
                       (SELECT COUNT(*) FROM workflow_enrollments we WHERE we.workflow_id = w.id AND we.status = 'active') as active_enrollments
                FROM workflows w
                WHERE w.workspace_id = ?
            ";
            $params = [$workspaceId];
            
            if ($status === 'active') {
                $sql .= " AND w.is_active = 1";
            } elseif ($status === 'inactive') {
                $sql .= " AND w.is_active = 0";
            }
            
            $sql .= " ORDER BY w.updated_at DESC";
            
            $stmt = $db->prepare($sql);
            $stmt->execute($params);
            
            return Response::json([
                'data' => $stmt->fetchAll(PDO::FETCH_ASSOC),
                'trigger_types' => self::$triggerTypes,
                'action_types' => self::$actionTypes
            ]);
        } catch (Exception $e) {
            return Response::error('Failed to fetch workflows: ' . $e->getMessage());
        }
    }

    /**
     * Get single workflow with steps
     */
    public static function show($id) {
        try {
            $workspaceId = self::getWorkspaceId();
            $db = Database::conn();
            
            $stmt = $db->prepare("SELECT * FROM workflows WHERE id = ? AND workspace_id = ?");
            $stmt->execute([$id, $workspaceId]);
            $workflow = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$workflow) {
                return Response::error('Workflow not found', 404);
            }
            
            // Parse trigger config
            if ($workflow['trigger_config']) {
                $workflow['trigger_config'] = json_decode($workflow['trigger_config'], true);
            }
            
            // Get steps
            $stmt = $db->prepare("SELECT * FROM workflow_steps WHERE workflow_id = ? ORDER BY id");
            $stmt->execute([$id]);
            $steps = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Parse step configs
            foreach ($steps as &$step) {
                if ($step['config']) {
                    $step['config'] = json_decode($step['config'], true);
                }
            }
            
            $workflow['steps'] = $steps;
            
            // Get stats
            $stmt = $db->prepare("
                SELECT 
                    COUNT(*) as total_enrolled,
                    SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active,
                    SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
                    SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed,
                    SUM(CASE WHEN status = 'exited' THEN 1 ELSE 0 END) as exited
                FROM workflow_enrollments
                WHERE workflow_id = ?
            ");
            $stmt->execute([$id]);
            $workflow['stats'] = $stmt->fetch(PDO::FETCH_ASSOC);
            
            return Response::json(['data' => $workflow]);
        } catch (Exception $e) {
            return Response::error('Failed to fetch workflow: ' . $e->getMessage());
        }
    }

    /**
     * Create workflow
     */
    public static function store() {
        try {
            $workspaceId = self::getWorkspaceId();
            $db = Database::conn();
            $data = json_decode(file_get_contents('php://input'), true);
            
            if (empty($data['name'])) {
                return Response::error('Name is required', 400);
            }
            
            if (empty($data['trigger_type'])) {
                return Response::error('Trigger type is required', 400);
            }
            
            if (!isset(self::$triggerTypes[$data['trigger_type']])) {
                return Response::error('Invalid trigger type', 400);
            }
            
            $stmt = $db->prepare("
                INSERT INTO workflows 
                (workspace_id, name, description, trigger_type, trigger_config, is_active, run_once_per_contact)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            ");
            
            $stmt->execute([
                $workspaceId,
                $data['name'],
                $data['description'] ?? null,
                $data['trigger_type'],
                json_encode($data['trigger_config'] ?? []),
                $data['is_active'] ?? 0,
                $data['run_once_per_contact'] ?? 0
            ]);
            
            $id = $db->lastInsertId();
            
            // Create steps if provided
            if (!empty($data['steps'])) {
                self::saveSteps($db, $id, $data['steps']);
            }
            
            return self::show($id);
        } catch (Exception $e) {
            return Response::error('Failed to create workflow: ' . $e->getMessage());
        }
    }

    /**
     * Update workflow
     */
    public static function update($id) {
        try {
            $workspaceId = self::getWorkspaceId();
            $db = Database::conn();
            $data = json_decode(file_get_contents('php://input'), true);
            
            // Verify ownership
            $stmt = $db->prepare("SELECT id, is_active FROM workflows WHERE id = ? AND workspace_id = ?");
            $stmt->execute([$id, $workspaceId]);
            $workflow = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$workflow) {
                return Response::error('Workflow not found', 404);
            }
            
            $fields = [];
            $params = [];
            
            $allowedFields = ['name', 'description', 'trigger_type', 'is_active', 'run_once_per_contact'];
            
            foreach ($allowedFields as $field) {
                if (array_key_exists($field, $data)) {
                    $fields[] = "$field = ?";
                    $params[] = $data[$field];
                }
            }
            
            if (array_key_exists('trigger_config', $data)) {
                $fields[] = "trigger_config = ?";
                $params[] = json_encode($data['trigger_config']);
            }
            
            if (!empty($fields)) {
                $params[] = $id;
                $params[] = $workspaceId;
                $stmt = $db->prepare("UPDATE workflows SET " . implode(', ', $fields) . " WHERE id = ? AND workspace_id = ?");
                $stmt->execute($params);
            }
            
            // Update steps if provided
            if (isset($data['steps'])) {
                // Delete existing steps
                $db->prepare("DELETE FROM workflow_steps WHERE workflow_id = ?")->execute([$id]);
                
                if (!empty($data['steps'])) {
                    self::saveSteps($db, $id, $data['steps']);
                }
            }
            
            return self::show($id);
        } catch (Exception $e) {
            return Response::error('Failed to update workflow: ' . $e->getMessage());
        }
    }

    /**
     * Delete workflow
     */
    public static function destroy($id) {
        try {
            $workspaceId = self::getWorkspaceId();
            $db = Database::conn();
            
            $stmt = $db->prepare("DELETE FROM workflows WHERE id = ? AND workspace_id = ?");
            $stmt->execute([$id, $workspaceId]);
            
            if ($stmt->rowCount() === 0) {
                return Response::error('Workflow not found', 404);
            }
            
            return Response::json(['success' => true]);
        } catch (Exception $e) {
            return Response::error('Failed to delete workflow: ' . $e->getMessage());
        }
    }

    /**
     * Toggle workflow active status
     */
    public static function toggle($id) {
        try {
            $workspaceId = self::getWorkspaceId();
            $db = Database::conn();
            
            $stmt = $db->prepare("SELECT is_active FROM workflows WHERE id = ? AND workspace_id = ?");
            $stmt->execute([$id, $workspaceId]);
            $workflow = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$workflow) {
                return Response::error('Workflow not found', 404);
            }
            
            $newStatus = $workflow['is_active'] ? 0 : 1;
            
            $stmt = $db->prepare("UPDATE workflows SET is_active = ? WHERE id = ?");
            $stmt->execute([$newStatus, $id]);
            
            return Response::json(['data' => ['is_active' => (bool)$newStatus]]);
        } catch (Exception $e) {
            return Response::error('Failed to toggle workflow: ' . $e->getMessage());
        }
    }

    /**
     * Manually enroll a contact in a workflow
     */
    public static function enroll($id) {
        try {
            $workspaceId = self::getWorkspaceId();
            $db = Database::conn();
            $data = json_decode(file_get_contents('php://input'), true);
            
            $contactId = $data['contact_id'] ?? null;
            
            if (!$contactId) {
                return Response::error('contact_id is required', 400);
            }
            
            // Verify workflow exists and is active
            $stmt = $db->prepare("SELECT * FROM workflows WHERE id = ? AND workspace_id = ? AND is_active = 1");
            $stmt->execute([$id, $workspaceId]);
            $workflow = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$workflow) {
                return Response::error('Workflow not found or inactive', 404);
            }
            
            // Check if already enrolled (if run_once_per_contact)
            if ($workflow['run_once_per_contact']) {
                $stmt = $db->prepare("SELECT id FROM workflow_enrollments WHERE workflow_id = ? AND contact_id = ?");
                $stmt->execute([$id, $contactId]);
                if ($stmt->fetch()) {
                    return Response::error('Contact already enrolled in this workflow', 400);
                }
            }
            
            // Get first step
            $stmt = $db->prepare("SELECT id FROM workflow_steps WHERE workflow_id = ? ORDER BY id LIMIT 1");
            $stmt->execute([$id]);
            $firstStep = $stmt->fetch(PDO::FETCH_ASSOC);
            
            // Create enrollment
            $stmt = $db->prepare("
                INSERT INTO workflow_enrollments 
                (workflow_id, contact_id, current_step_id, status, enrolled_at)
                VALUES (?, ?, ?, 'active', NOW())
            ");
            $stmt->execute([$id, $contactId, $firstStep ? $firstStep['id'] : null]);
            
            $enrollmentId = $db->lastInsertId();
            
            // Update workflow stats
            $db->prepare("UPDATE workflows SET total_enrolled = total_enrolled + 1 WHERE id = ?")->execute([$id]);
            
            return Response::json(['data' => ['enrollment_id' => (int)$enrollmentId]]);
        } catch (Exception $e) {
            return Response::error('Failed to enroll contact: ' . $e->getMessage());
        }
    }

    /**
     * Get workflow enrollments
     */
    public static function getEnrollments($id) {
        try {
            $workspaceId = self::getWorkspaceId();
            $db = Database::conn();
            
            // Verify ownership
            $stmt = $db->prepare("SELECT id FROM workflows WHERE id = ? AND workspace_id = ?");
            $stmt->execute([$id, $workspaceId]);
            if (!$stmt->fetch()) {
                return Response::error('Workflow not found', 404);
            }
            
            $status = $_GET['status'] ?? null;
            $limit = min((int)($_GET['limit'] ?? 50), 100);
            $offset = (int)($_GET['offset'] ?? 0);
            
            $sql = "
                SELECT we.*, c.first_name, c.last_name, c.email,
                       ws.step_type, ws.action_type
                FROM workflow_enrollments we
                LEFT JOIN contacts c ON we.contact_id = c.id
                LEFT JOIN workflow_steps ws ON we.current_step_id = ws.id
                WHERE we.workflow_id = ?
            ";
            $params = [$id];
            
            if ($status) {
                $sql .= " AND we.status = ?";
                $params[] = $status;
            }
            
            $sql .= " ORDER BY we.enrolled_at DESC LIMIT ? OFFSET ?";
            $params[] = $limit;
            $params[] = $offset;
            
            $stmt = $db->prepare($sql);
            $stmt->execute($params);
            
            return Response::json(['data' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
        } catch (Exception $e) {
            return Response::error('Failed to fetch enrollments: ' . $e->getMessage());
        }
    }

    /**
     * Get execution logs for an enrollment
     */
    public static function getExecutionLogs($workflowId, $enrollmentId) {
        try {
            $workspaceId = self::getWorkspaceId();
            $db = Database::conn();
            
            // Verify ownership
            $stmt = $db->prepare("
                SELECT we.id FROM workflow_enrollments we
                JOIN workflows w ON we.workflow_id = w.id
                WHERE we.id = ? AND w.id = ? AND w.workspace_id = ?
            ");
            $stmt->execute([$enrollmentId, $workflowId, $workspaceId]);
            if (!$stmt->fetch()) {
                return Response::error('Enrollment not found', 404);
            }
            
            $stmt = $db->prepare("
                SELECT wel.*, ws.step_type, ws.action_type
                FROM workflow_execution_logs wel
                JOIN workflow_steps ws ON wel.step_id = ws.id
                WHERE wel.enrollment_id = ?
                ORDER BY wel.created_at DESC
            ");
            $stmt->execute([$enrollmentId]);
            
            $logs = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            foreach ($logs as &$log) {
                if ($log['result']) {
                    $log['result'] = json_decode($log['result'], true);
                }
            }
            
            return Response::json(['data' => $logs]);
        } catch (Exception $e) {
            return Response::error('Failed to fetch logs: ' . $e->getMessage());
        }
    }

    /**
     * Get available options for workflow builder
     */
    public static function getOptions() {
        return Response::json([
            'trigger_types' => self::$triggerTypes,
            'action_types' => self::$actionTypes,
            'condition_operators' => [
                'equals' => 'Equals',
                'not_equals' => 'Does Not Equal',
                'contains' => 'Contains',
                'not_contains' => 'Does Not Contain',
                'starts_with' => 'Starts With',
                'ends_with' => 'Ends With',
                'greater_than' => 'Greater Than',
                'less_than' => 'Less Than',
                'is_empty' => 'Is Empty',
                'is_not_empty' => 'Is Not Empty',
                'is_true' => 'Is True',
                'is_false' => 'Is False',
            ],
            'wait_types' => [
                'delay' => 'Wait for Duration',
                'until_time' => 'Wait Until Specific Time',
                'until_day' => 'Wait Until Day of Week',
                'until_event' => 'Wait Until Event',
            ],
            'delay_units' => [
                'minutes' => 'Minutes',
                'hours' => 'Hours',
                'days' => 'Days',
                'weeks' => 'Weeks',
            ]
        ]);
    }

    // ==================== HELPER METHODS ====================

    private static function saveSteps(PDO $db, int $workflowId, array $steps): void {
        $stmt = $db->prepare("
            INSERT INTO workflow_steps 
            (workflow_id, step_type, action_type, config, position_x, position_y, next_step_id, true_step_id, false_step_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");
        
        // First pass: create all steps
        $stepIdMap = [];
        foreach ($steps as $index => $step) {
            $stmt->execute([
                $workflowId,
                $step['step_type'],
                $step['action_type'] ?? null,
                json_encode($step['config'] ?? []),
                $step['position_x'] ?? ($index * 200),
                $step['position_y'] ?? 100,
                null, // Will update in second pass
                null,
                null
            ]);
            $stepIdMap[$step['temp_id'] ?? $index] = $db->lastInsertId();
        }
        
        // Second pass: update connections
        foreach ($steps as $index => $step) {
            $stepId = $stepIdMap[$step['temp_id'] ?? $index];
            $updates = [];
            $params = [];
            
            if (isset($step['next_step_temp_id']) && isset($stepIdMap[$step['next_step_temp_id']])) {
                $updates[] = "next_step_id = ?";
                $params[] = $stepIdMap[$step['next_step_temp_id']];
            }
            
            if (isset($step['true_step_temp_id']) && isset($stepIdMap[$step['true_step_temp_id']])) {
                $updates[] = "true_step_id = ?";
                $params[] = $stepIdMap[$step['true_step_temp_id']];
            }
            
            if (isset($step['false_step_temp_id']) && isset($stepIdMap[$step['false_step_temp_id']])) {
                $updates[] = "false_step_id = ?";
                $params[] = $stepIdMap[$step['false_step_temp_id']];
            }
            
            if (!empty($updates)) {
                $params[] = $stepId;
                $db->prepare("UPDATE workflow_steps SET " . implode(', ', $updates) . " WHERE id = ?")->execute($params);
            }
        }
    }
}
