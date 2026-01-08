<?php

require_once __DIR__ . '/../Database.php';
require_once __DIR__ . '/../Response.php';
require_once __DIR__ . '/../Auth.php';

use Xordon\Database;
use Xordon\Response;
use Xordon\Auth;

class AutomationController
{
    private $pdo;

    public function __construct()
    {
        $this->pdo = Database::conn();
    }

    /**
     * GET /api/automations - List all automations from followup_automations
     * Scopped to workspace members.
     */
    public function index(): void
    {
        try {
            $userId = $GLOBALS['tenantContext']->userId ?? null;
            $workspaceId = $GLOBALS['tenantContext']->workspaceId ?? null;
            
            if (!$userId || !$workspaceId) {
                Response::error('Unauthorized', 401);
                return;
            }
            
            $channel = $_GET['channel'] ?? null;
            $isActive = isset($_GET['is_active']) ? ($_GET['is_active'] === 'true' || $_GET['is_active'] === '1') : null;
            
            // Scope to workspace members to show team-wide automations
            $sql = "SELECT DISTINCT fa.* FROM followup_automations fa 
                    JOIN workspace_members wm ON wm.user_id = fa.user_id 
                    WHERE wm.workspace_id = ?";
            $params = [$workspaceId];
            
            if ($channel) {
                $sql .= " AND fa.channel = ?";
                $params[] = $channel;
            }
            
            if ($isActive !== null) {
                $sql .= " AND fa.is_active = ?";
                $params[] = $isActive ? 1 : 0;
            }
            
            $sql .= " ORDER BY fa.updated_at DESC, fa.created_at DESC";
            
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute($params);
            $automations = $stmt->fetchAll(\PDO::FETCH_ASSOC);
            
            // Decode JSON fields and map to expected frontend format
            foreach ($automations as &$automation) {
                $automation['trigger_config'] = isset($automation['trigger_conditions']) 
                    ? (json_decode($automation['trigger_conditions'], true) ?? []) 
                    : [];
                
                $automation['actions'] = isset($automation['action_config']) 
                    ? (json_decode($automation['action_config'], true) ?? []) 
                    : [];
                
                $automation['conditions'] = [];
            }
            
            Response::json([
                'success' => true,
                'automations' => $automations
            ]);
        } catch (\Exception $e) {
            Response::json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * GET /api/automations/{id} - Get a specific automation
     */
    public function show(int $id): void
    {
        try {
            $workspaceId = $GLOBALS['tenantContext']->workspaceId ?? null;
            
            // Ensure automation belongs to workspace
            $stmt = $this->pdo->prepare("
                SELECT fa.* FROM followup_automations fa
                JOIN workspace_members wm ON wm.user_id = fa.user_id
                WHERE fa.id = ? AND wm.workspace_id = ?
            ");
            $stmt->execute([$id, $workspaceId]);
            $automation = $stmt->fetch(\PDO::FETCH_ASSOC);
            
            if (!$automation) {
                Response::error('Automation not found', 404);
                return;
            }
            
            $automation['trigger_config'] = isset($automation['trigger_conditions']) 
                ? (json_decode($automation['trigger_conditions'], true) ?? []) 
                : [];
            $automation['actions'] = isset($automation['action_config']) 
                ? (json_decode($automation['action_config'], true) ?? []) 
                : [];
            $automation['conditions'] = [];
            
            Response::json([
                'success' => true,
                'automation' => $automation
            ]);
        } catch (\Exception $e) {
            Response::json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * POST /api/automations - Create new automation
     */
    public function create(): void
    {
        try {
            $data = json_decode(file_get_contents('php://input'), true);
            $userId = $GLOBALS['tenantContext']->userId ?? null;
            
            if (!$userId) {
                Response::error('Unauthorized', 401);
                return;
            }
            
            $stmt = $this->pdo->prepare("
                INSERT INTO followup_automations 
                (user_id, name, description, channel, trigger_type, trigger_conditions, action_type, action_config, is_active, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
            ");
            
            $stmt->execute([
                $userId,
                $data['name'] ?? 'Untitled Automation',
                $data['description'] ?? '',
                $data['channel'] ?? 'email',
                $data['trigger_type'] ?? 'form_submission',
                json_encode($data['trigger_config'] ?? $data['trigger_conditions'] ?? []),
                $data['action_type'] ?? 'send_email',
                json_encode($data['actions'] ?? $data['action_config'] ?? []),
                isset($data['is_active']) ? ($data['is_active'] ? 1 : 0) : 1
            ]);
            
            $automationId = $this->pdo->lastInsertId();
            
            Response::json([
                'success' => true,
                'automation_id' => $automationId,
                'id' => $automationId
            ], 201);
        } catch (\Exception $e) {
            Response::json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * PUT /api/automations/{id} - Update automation
     */
    public function update(int $id): void
    {
        try {
            $data = json_decode(file_get_contents('php://input'), true);
            $userId = $GLOBALS['tenantContext']->userId ?? null;
            $workspaceId = $GLOBALS['tenantContext']->workspaceId ?? null;
            
            if (!$userId) {
                Response::error('Unauthorized', 401);
                return;
            }
            
            // Check ownership/workspace
            $check = $this->pdo->prepare("
                SELECT fa.id FROM followup_automations fa
                JOIN workspace_members wm ON wm.user_id = fa.user_id
                WHERE fa.id = ? AND wm.workspace_id = ?
            ");
            $check->execute([$id, $workspaceId]);
            if (!$check->fetch()) {
                Response::error('Automation not found or no permission', 404);
                return;
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
            if (isset($data['channel'])) {
                $updates[] = "channel = ?";
                $params[] = $data['channel'];
            }
            if (isset($data['trigger_type'])) {
                $updates[] = "trigger_type = ?";
                $params[] = $data['trigger_type'];
            }
            if (isset($data['trigger_config']) || isset($data['trigger_conditions'])) {
                $updates[] = "trigger_conditions = ?";
                $params[] = json_encode($data['trigger_config'] ?? $data['trigger_conditions']);
            }
            if (isset($data['action_type'])) {
                $updates[] = "action_type = ?";
                $params[] = $data['action_type'];
            }
            if (isset($data['actions']) || isset($data['action_config'])) {
                $updates[] = "action_config = ?";
                $params[] = json_encode($data['actions'] ?? $data['action_config']);
            }
            if (isset($data['is_active'])) {
                $updates[] = "is_active = ?";
                $params[] = $data['is_active'] ? 1 : 0;
            }
            
            if (empty($updates)) {
                Response::error('No fields to update', 400);
                return;
            }
            
            $updates[] = "updated_at = NOW()";
            $params[] = $id;
            
            $sql = "UPDATE followup_automations SET " . implode(", ", $updates) . " WHERE id = ?";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute($params);
            
            Response::json(['success' => true]);
        } catch (\Exception $e) {
            Response::json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * DELETE /api/automations/{id} - Delete automation
     */
    public function delete(int $id): void
    {
        try {
            $workspaceId = $GLOBALS['tenantContext']->workspaceId ?? null;
            
            // Check ownership via workspace
            $check = $this->pdo->prepare("
                SELECT fa.id FROM followup_automations fa
                JOIN workspace_members wm ON wm.user_id = fa.user_id
                WHERE fa.id = ? AND wm.workspace_id = ?
            ");
            $check->execute([$id, $workspaceId]);
            if (!$check->fetch()) {
                Response::error('Automation not found', 404);
                return;
            }
            
            $stmt = $this->pdo->prepare("DELETE FROM followup_automations WHERE id = ?");
            $stmt->execute([$id]);
            
            Response::json(['success' => true]);
        } catch (\Exception $e) {
            Response::json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * POST /api/automations/{id}/toggle - Toggle active status
     */
    public function toggle(int $id): void
    {
        try {
            $workspaceId = $GLOBALS['tenantContext']->workspaceId ?? null;
            $data = json_decode(file_get_contents('php://input'), true);
            $enabled = isset($data['enabled']) ? ($data['enabled'] ? 1 : 0) : 1;
            
            // Check workspace permission
            $check = $this->pdo->prepare("
                SELECT fa.id FROM followup_automations fa
                JOIN workspace_members wm ON wm.user_id = fa.user_id
                WHERE fa.id = ? AND wm.workspace_id = ?
            ");
            $check->execute([$id, $workspaceId]);
            if (!$check->fetch()) {
                Response::error('Automation not found', 404);
                return;
            }
            
            $stmt = $this->pdo->prepare("UPDATE followup_automations SET is_active = ?, updated_at = NOW() WHERE id = ?");
            $stmt->execute([$enabled, $id]);
            
            Response::json([
                'success' => true,
                'enabled' => (bool)$enabled
            ]);
        } catch (\Exception $e) {
            Response::json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * GET /api/automations/{id}/logs - Get execution logs
     */
    public function getLogs(int $id): void
    {
        try {
            $limit = (int)($_GET['limit'] ?? 50);
            
            $stmt = $this->pdo->prepare("
                SELECT * FROM automation_executions 
                WHERE automation_id = ? 
                ORDER BY created_at DESC 
                LIMIT ?
            ");
            $stmt->execute([$id, $limit]);
            $logs = $stmt->fetchAll(\PDO::FETCH_ASSOC);
            
            Response::json([
                'success' => true,
                'logs' => $logs
            ]);
        } catch (\Exception $e) {
            Response::json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * GET /api/automations/triggers - Get available trigger types
     */
    public function getTriggers(): void
    {
        $triggers = [
            ['id' => 'form_submission', 'name' => 'Form Submission', 'description' => 'Triggered when a form is submitted'],
            ['id' => 'contact_created', 'name' => 'Contact Created', 'description' => 'Triggered when a new contact is created'],
            ['id' => 'contact_updated', 'name' => 'Contact Updated', 'description' => 'Triggered when a contact is updated'],
            ['id' => 'tag_added', 'name' => 'Tag Added', 'description' => 'Triggered when a tag is added to a contact'],
            ['id' => 'tag_removed', 'name' => 'Tag Removed', 'description' => 'Triggered when a tag is removed from a contact'],
            ['id' => 'email_opened', 'name' => 'Email Opened', 'description' => 'Triggered when an email is opened'],
            ['id' => 'email_clicked', 'name' => 'Email Link Clicked', 'description' => 'Triggered when a link in an email is clicked'],
            ['id' => 'appointment_booked', 'name' => 'Appointment Booked', 'description' => 'Triggered when an appointment is booked'],
            ['id' => 'appointment_cancelled', 'name' => 'Appointment Cancelled', 'description' => 'Triggered when an appointment is cancelled'],
            ['id' => 'invoice_paid', 'name' => 'Invoice Paid', 'description' => 'Triggered when an invoice is paid'],
            ['id' => 'custom_webhook', 'name' => 'Custom Webhook', 'description' => 'Triggered by external webhook']
        ];
        
        Response::json(['success' => true, 'triggers' => $triggers]);
    }

    /**
     * GET /api/automations/actions - Get available action types
     */
    public function getActions(): void
    {
        $actions = [
            ['id' => 'send_email', 'name' => 'Send Email', 'description' => 'Send an email to the contact'],
            ['id' => 'send_sms', 'name' => 'Send SMS', 'description' => 'Send an SMS message'],
            ['id' => 'add_tag', 'name' => 'Add Tag', 'description' => 'Add a tag to the contact'],
            ['id' => 'remove_tag', 'name' => 'Remove Tag', 'description' => 'Remove a tag from the contact'],
            ['id' => 'update_contact', 'name' => 'Update Contact', 'description' => 'Update contact fields'],
            ['id' => 'create_task', 'name' => 'Create Task', 'description' => 'Create a task for follow-up'],
            ['id' => 'send_webhook', 'name' => 'Send Webhook', 'description' => 'Send data to external URL'],
            ['id' => 'delay', 'name' => 'Wait/Delay', 'description' => 'Wait for a specified time'],
            ['id' => 'condition', 'name' => 'If/Else Condition', 'description' => 'Add conditional logic']
        ];
        
        Response::json(['success' => true, 'actions' => $actions]);
    }
}
