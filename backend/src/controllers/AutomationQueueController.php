<?php
/**
 * Automation Queue Controller
 * API endpoints for managing the automation execution queue
 */

require_once __DIR__ . '/../Auth.php';
require_once __DIR__ . '/../Database.php';
require_once __DIR__ . '/../Response.php';
require_once __DIR__ . '/../services/AutomationQueueProcessor.php';

class AutomationQueueController {
    
    /**
     * Process pending queue items (called by cron/worker)
     * POST /automation-queue/process
     */
    public static function process(): void {
        // This can be called by cron without auth, or by admin with auth
        $cronKey = $_GET['key'] ?? $_POST['key'] ?? null;
        $expectedKey = getenv('CRON_SECRET_KEY') ?: 'automation-cron-key';
        
        // Allow either cron key or authenticated admin
        if ($cronKey !== $expectedKey) {
            try {
                $userId = Auth::userIdOrFail();
                // TODO: Check if user is admin
            } catch (Exception $e) {
                Response::error('Unauthorized', 401);
                return;
            }
        }
        
        $processor = new AutomationQueueProcessor();
        $results = $processor->processPending();
        
        Response::json([
            'success' => true,
            'results' => $results
        ]);
    }
    
    /**
     * Get queue stats for current user
     * GET /automation-queue/stats
     */
    public static function stats(): void {
        $userId = Auth::userIdOrFail();
        $stats = AutomationQueueProcessor::getQueueStats($userId);
        
        Response::json(['stats' => $stats]);
    }
    
    /**
     * Get pending queue items for current user
     * GET /automation-queue
     */
    public static function index(): void {
        $userId = Auth::userIdOrFail();
        $pdo = Database::conn();
        
        $status = $_GET['status'] ?? 'pending';
        $limit = min((int)($_GET['limit'] ?? 50), 100);
        $offset = (int)($_GET['offset'] ?? 0);
        
        $stmt = $pdo->prepare('
            SELECT q.*, 
                   a.name as automation_name,
                   f.name as flow_name,
                   c.first_name, c.last_name, c.email as contact_email
            FROM automation_queue q
            LEFT JOIN followup_automations a ON q.automation_id = a.id
            LEFT JOIN campaign_flows f ON q.flow_id = f.id
            LEFT JOIN contacts c ON q.contact_id = c.id
            WHERE q.user_id = ? AND q.status = ?
            ORDER BY q.scheduled_for ASC
            LIMIT ? OFFSET ?
        ');
        $stmt->execute([$userId, $status, $limit, $offset]);
        $items = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Format items
        foreach ($items as &$item) {
            $item['action_config'] = json_decode($item['action_config'], true);
            $item['result'] = json_decode($item['result'], true);
            $item['contact_name'] = trim(($item['first_name'] ?? '') . ' ' . ($item['last_name'] ?? ''));
        }
        
        Response::json(['items' => $items]);
    }
    
    /**
     * Cancel a queued item
     * POST /automation-queue/:id/cancel
     */
    public static function cancel(string $id): void {
        $userId = Auth::userIdOrFail();
        $pdo = Database::conn();
        
        $stmt = $pdo->prepare('
            UPDATE automation_queue 
            SET status = "cancelled" 
            WHERE id = ? AND user_id = ? AND status = "pending"
        ');
        $stmt->execute([$id, $userId]);
        
        if ($stmt->rowCount() === 0) {
            Response::error('Queue item not found or cannot be cancelled', 404);
            return;
        }
        
        Response::json(['success' => true]);
    }
    
    /**
     * Retry a failed item
     * POST /automation-queue/:id/retry
     */
    public static function retry(string $id): void {
        $userId = Auth::userIdOrFail();
        $pdo = Database::conn();
        
        $stmt = $pdo->prepare('
            UPDATE automation_queue 
            SET status = "pending", attempts = 0, scheduled_for = NOW(), error_message = NULL
            WHERE id = ? AND user_id = ? AND status = "failed"
        ');
        $stmt->execute([$id, $userId]);
        
        if ($stmt->rowCount() === 0) {
            Response::error('Queue item not found or cannot be retried', 404);
            return;
        }
        
        Response::json(['success' => true]);
    }
    
    /**
     * Get execution logs
     * GET /automation-queue/logs
     */
    public static function logs(): void {
        $userId = Auth::userIdOrFail();
        $pdo = Database::conn();
        
        $automationId = $_GET['automation_id'] ?? null;
        $flowId = $_GET['flow_id'] ?? null;
        $contactId = $_GET['contact_id'] ?? null;
        $limit = min((int)($_GET['limit'] ?? 50), 100);
        $offset = (int)($_GET['offset'] ?? 0);
        
        $sql = '
            SELECT l.*, 
                   a.name as automation_name,
                   f.name as flow_name,
                   c.first_name, c.last_name, c.email as contact_email
            FROM automation_logs l
            LEFT JOIN followup_automations a ON l.automation_id = a.id
            LEFT JOIN campaign_flows f ON l.flow_id = f.id
            LEFT JOIN contacts c ON l.contact_id = c.id
            WHERE l.user_id = ?
        ';
        $params = [$userId];
        
        if ($automationId) {
            $sql .= ' AND l.automation_id = ?';
            $params[] = $automationId;
        }
        if ($flowId) {
            $sql .= ' AND l.flow_id = ?';
            $params[] = $flowId;
        }
        if ($contactId) {
            $sql .= ' AND l.contact_id = ?';
            $params[] = $contactId;
        }
        
        $sql .= ' ORDER BY l.created_at DESC LIMIT ? OFFSET ?';
        $params[] = $limit;
        $params[] = $offset;
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $logs = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        foreach ($logs as &$log) {
            $log['event_data'] = json_decode($log['event_data'], true);
            $log['contact_name'] = trim(($log['first_name'] ?? '') . ' ' . ($log['last_name'] ?? ''));
        }
        
        Response::json(['logs' => $logs]);
    }
    
    /**
     * Manually queue an action (for testing)
     * POST /automation-queue
     */
    public static function create(): void {
        $userId = Auth::userIdOrFail();
        $body = get_json_body();
        
        $contactId = $body['contact_id'] ?? null;
        $actionType = $body['action_type'] ?? null;
        $actionConfig = $body['action_config'] ?? [];
        
        if (!$contactId || !$actionType) {
            Response::error('contact_id and action_type are required', 422);
            return;
        }
        
        $queueId = AutomationQueueProcessor::queueAction(
            $userId,
            (int)$contactId,
            $actionType,
            $actionConfig,
            $body['automation_id'] ?? null,
            $body['flow_id'] ?? null,
            $body['scheduled_for'] ?? null,
            (int)($body['priority'] ?? 0)
        );
        
        Response::json(['success' => true, 'queue_id' => $queueId], 201);
    }
}
