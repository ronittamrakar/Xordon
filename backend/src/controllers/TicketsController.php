<?php

/**
 * Tickets Controller
 * Manages helpdesk tickets CRUD, assignment, status changes, and SLA tracking
 */

use Xordon\Database;
use Xordon\Response;

class TicketsController {
    
    /**
     * List tickets with filtering and pagination
     * GET /api/tickets
     */
    public function list() {
        $db = getDBConnection();
        $user = requireAuth();
        $workspaceId = $user['workspace_id'];
        
        // Query parameters
        $status = $_GET['status'] ?? null;
        $priority = $_GET['priority'] ?? null;
        $assignedTo = $_GET['assigned_to'] ?? null;
        $teamId = $_GET['team_id'] ?? null;
        $stageId = $_GET['stage_id'] ?? null;
        $search = $_GET['search'] ?? null;
        $page = max(1, intval($_GET['page'] ?? 1));
        $limit = min(100, max(10, intval($_GET['limit'] ?? 20)));
        $offset = ($page - 1) * $limit;
        
        // Build query
        $where = ['t.workspace_id = ?'];
        $params = [$workspaceId];
        
        if ($status) {
            $where[] = 'status = ?';
            $params[] = $status;
        }
        
        if ($priority) {
            $where[] = 'priority = ?';
            $params[] = $priority;
        }
        
        if ($assignedTo === 'me') {
            $where[] = 'assigned_user_id = ?';
            $params[] = $user['id'];
        } elseif ($assignedTo === 'unassigned') {
            $where[] = 'assigned_user_id IS NULL';
        } elseif ($assignedTo && is_numeric($assignedTo)) {
            $where[] = 'assigned_user_id = ?';
            $params[] = intval($assignedTo);
        }
        
        if ($teamId) {
            $where[] = 'team_id = ?';
            $params[] = intval($teamId);
        }
        
        if ($stageId) {
            $where[] = 'stage_id = ?';
            $params[] = intval($stageId);
        }
        
        if ($search) {
            $where[] = '(ticket_number LIKE ? OR subject LIKE ? OR description LIKE ? OR requester_email LIKE ?)';
            $searchTerm = '%' . $search . '%';
            $params[] = $searchTerm;
            $params[] = $searchTerm;
            $params[] = $searchTerm;
            $params[] = $searchTerm;
        }
        
        $whereClause = implode(' AND ', $where);
        
        // Get total count
        $countStmt = $db->prepare("SELECT COUNT(*) as total FROM tickets t WHERE $whereClause");
        $countStmt->execute($params);
        $total = $countStmt->fetch(PDO::FETCH_ASSOC)['total'];
        
        // Get tickets
        $sql = "
            SELECT 
                t.*,
                ts.name as stage_name,
                ts.color as stage_color,
                tt.name as team_name,
                ttype.name as type_name,
                ttype.icon as type_icon,
                u.name as assigned_user_name,
                (SELECT COUNT(*) FROM ticket_messages WHERE ticket_id = t.id) as message_count,
                (SELECT COUNT(*) FROM ticket_messages WHERE ticket_id = t.id AND is_private = FALSE AND direction = 'inbound' AND created_at > COALESCE(t.first_response_at, NOW())) as unread_count
            FROM tickets t
            LEFT JOIN ticket_stages ts ON t.stage_id = ts.id
            LEFT JOIN ticket_teams tt ON t.team_id = tt.id
            LEFT JOIN ticket_types ttype ON t.ticket_type_id = ttype.id
            LEFT JOIN users u ON t.assigned_user_id = u.id
            WHERE $whereClause
            ORDER BY 
                CASE WHEN t.priority = 'urgent' THEN 1 
                     WHEN t.priority = 'high' THEN 2 
                     WHEN t.priority = 'medium' THEN 3 
                     ELSE 4 END,
                t.created_at DESC
            LIMIT ? OFFSET ?
        ";
        
        $params[] = $limit;
        $params[] = $offset;
        
        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        $tickets = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Parse JSON fields
        foreach ($tickets as &$ticket) {
            $ticket['tags'] = $ticket['tags'] ? json_decode($ticket['tags'], true) : [];
            $ticket['custom_fields'] = $ticket['custom_fields'] ? json_decode($ticket['custom_fields'], true) : [];
        }
        
        jsonResponse([
            'data' => $tickets,
            'meta' => [
                'total' => intval($total),
                'page' => $page,
                'limit' => $limit,
                'pages' => ceil($total / $limit)
            ]
        ]);
    }
    
    /**
     * Get single ticket with messages
     * GET /api/tickets/:id
     */
    public function get($id) {
        $db = getDBConnection();
        $user = requireAuth();
        $workspaceId = $user['workspace_id'];
        
        $stmt = $db->prepare("
            SELECT 
                t.*,
                ts.name as stage_name,
                ts.color as stage_color,
                tt.name as team_name,
                ttype.name as type_name,
                ttype.icon as type_icon,
                u.name as assigned_user_name,
                u.email as assigned_user_email
            FROM tickets t
            LEFT JOIN ticket_stages ts ON t.stage_id = ts.id
            LEFT JOIN ticket_teams tt ON t.team_id = tt.id
            LEFT JOIN ticket_types ttype ON t.ticket_type_id = ttype.id
            LEFT JOIN users u ON t.assigned_user_id = u.id
            WHERE t.id = ? AND t.workspace_id = ?
        ");
        $stmt->execute([$id, $workspaceId]);
        $ticket = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$ticket) {
            http_response_code(404);
            jsonResponse(['error' => 'Ticket not found']);
            return;
        }
        
        // Parse JSON fields
        $ticket['tags'] = $ticket['tags'] ? json_decode($ticket['tags'], true) : [];
        $ticket['custom_fields'] = $ticket['custom_fields'] ? json_decode($ticket['custom_fields'], true) : [];
        
        // Get messages
        $msgStmt = $db->prepare("
            SELECT 
                tm.*,
                u.name as author_user_name,
                u.email as author_user_email
            FROM ticket_messages tm
            LEFT JOIN users u ON tm.author_user_id = u.id
            WHERE tm.ticket_id = ?
            ORDER BY tm.created_at ASC
        ");
        $msgStmt->execute([$id]);
        $messages = $msgStmt->fetchAll(PDO::FETCH_ASSOC);
        
        foreach ($messages as &$msg) {
            $msg['attachments'] = $msg['attachments'] ? json_decode($msg['attachments'], true) : [];
        }
        
        $ticket['messages'] = $messages;
        
        // Get activities
        $actStmt = $db->prepare("
            SELECT 
                ta.*,
                u.name as user_name
            FROM ticket_activities ta
            LEFT JOIN users u ON ta.user_id = u.id
            WHERE ta.ticket_id = ?
            ORDER BY ta.created_at DESC
            LIMIT 50
        ");
        $actStmt->execute([$id]);
        $ticket['activities'] = $actStmt->fetchAll(PDO::FETCH_ASSOC);
        
        jsonResponse($ticket);
    }

    /**
     * Get single ticket by ticket number
     * GET /api/tickets/number/:ticketNumber
     */
    public function getByNumber($ticketNumber) {
        $db = getDBConnection();
        $user = requireAuth();
        $workspaceId = $user['workspace_id'];
        
        $stmt = $db->prepare("
            SELECT 
                t.*,
                ts.name as stage_name,
                ts.color as stage_color,
                tt.name as team_name,
                ttype.name as type_name,
                ttype.icon as type_icon,
                u.name as assigned_user_name,
                u.email as assigned_user_email
            FROM tickets t
            LEFT JOIN ticket_stages ts ON t.stage_id = ts.id
            LEFT JOIN ticket_teams tt ON t.team_id = tt.id
            LEFT JOIN ticket_types ttype ON t.ticket_type_id = ttype.id
            LEFT JOIN users u ON t.assigned_user_id = u.id
            WHERE t.ticket_number = ? AND t.workspace_id = ?
        ");
        $stmt->execute([$ticketNumber, $workspaceId]);
        $ticket = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$ticket) {
            http_response_code(404);
            jsonResponse(['error' => 'Ticket not found']);
            return;
        }
        
        // Parse JSON fields
        $ticket['tags'] = $ticket['tags'] ? json_decode($ticket['tags'], true) : [];
        $ticket['custom_fields'] = $ticket['custom_fields'] ? json_decode($ticket['custom_fields'], true) : [];
        
        // Get messages
        $msgStmt = $db->prepare("
            SELECT 
                tm.*,
                u.name as author_user_name,
                u.email as author_user_email
            FROM ticket_messages tm
            LEFT JOIN users u ON tm.author_user_id = u.id
            WHERE tm.ticket_id = ?
            ORDER BY tm.created_at ASC
        ");
        $msgStmt->execute([$ticket['id']]);
        $messages = $msgStmt->fetchAll(PDO::FETCH_ASSOC);
        
        foreach ($messages as &$msg) {
            $msg['attachments'] = $msg['attachments'] ? json_decode($msg['attachments'], true) : [];
        }
        
        $ticket['messages'] = $messages;
        
        // Get activities
        $actStmt = $db->prepare("
            SELECT 
                ta.*,
                u.name as user_name
            FROM ticket_activities ta
            LEFT JOIN users u ON ta.user_id = u.id
            WHERE ta.ticket_id = ?
            ORDER BY ta.created_at DESC
            LIMIT 50
        ");
        $actStmt->execute([$ticket['id']]);
        $ticket['activities'] = $actStmt->fetchAll(PDO::FETCH_ASSOC);
        
        jsonResponse($ticket);
    }
    
    /**
     * Create new ticket
     * POST /api/tickets
     */
    public function create() {
        $db = getDBConnection();
        $user = requireAuth();
        $workspaceId = $user['workspace_id'];
        
        $data = json_decode(file_get_contents('php://input'), true);
        
        // Generate ticket number
        $stmt = $db->prepare("SELECT MAX(CAST(SUBSTRING(ticket_number, 2) AS UNSIGNED)) as max_num FROM tickets WHERE workspace_id = ? AND ticket_number LIKE 'T%'");
        $stmt->execute([$workspaceId]);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        $nextNum = ($result['max_num'] ?? 0) + 1;
        $ticketNumber = 'T' . str_pad($nextNum, 6, '0', STR_PAD_LEFT);
        
        // Get default stage
        $stageStmt = $db->prepare("SELECT id FROM ticket_stages WHERE workspace_id = ? AND stage_type = 'new' ORDER BY sequence LIMIT 1");
        $stageStmt->execute([$workspaceId]);
        $defaultStage = $stageStmt->fetch(PDO::FETCH_ASSOC);
        
        // Get default SLA policy
        $slaStmt = $db->prepare("SELECT id FROM sla_policies WHERE workspace_id = ? AND is_active = TRUE ORDER BY id LIMIT 1");
        $slaStmt->execute([$workspaceId]);
        $defaultSla = $slaStmt->fetch(PDO::FETCH_ASSOC);
        
        // Calculate SLA due dates if policy exists
        $firstResponseDue = null;
        $resolutionDue = null;
        if ($defaultSla) {
            $priority = $data['priority'] ?? 'medium';
            $responseMinutes = 240; // default medium
            $resolutionMinutes = 1440;
            
            // Get SLA times based on priority
            $slaDetails = $db->prepare("SELECT * FROM sla_policies WHERE id = ?");
            $slaDetails->execute([$defaultSla['id']]);
            $slaPolicy = $slaDetails->fetch(PDO::FETCH_ASSOC);
            
            if ($slaPolicy) {
                $responseMinutes = $slaPolicy["priority_{$priority}_response_time"] ?? 240;
                $resolutionMinutes = $slaPolicy["priority_{$priority}_resolution_time"] ?? 1440;
                
                $firstResponseDue = date('Y-m-d H:i:s', strtotime("+{$responseMinutes} minutes"));
                $resolutionDue = date('Y-m-d H:i:s', strtotime("+{$resolutionMinutes} minutes"));
            }
        }
        
        $stmt = $db->prepare("
            INSERT INTO tickets (
                workspace_id, ticket_number, subject, description, status, priority,
                stage_id, team_id, ticket_type_id, assigned_user_id,
                requester_name, requester_email, requester_phone, contact_id,
                source_channel, source_id, sla_policy_id,
                first_response_due_at, resolution_due_at,
                tags, custom_fields, created_by
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");
        
        $stmt->execute([
            $workspaceId,
            $ticketNumber,
            $data['subject'] ?? $data['title'] ?? 'Untitled Ticket',
            $data['description'] ?? null,
            $data['status'] ?? 'new',
            $data['priority'] ?? 'medium',
            $data['stage_id'] ?? $defaultStage['id'] ?? null,
            $data['team_id'] ?? null,
            $data['ticket_type_id'] ?? null,
            $data['assigned_user_id'] ?? null,
            $data['requester_name'] ?? null,
            $data['requester_email'] ?? null,
            $data['requester_phone'] ?? null,
            $data['contact_id'] ?? null,
            $data['source_channel'] ?? 'manual',
            $data['source_id'] ?? null,
            $defaultSla['id'] ?? null,
            $firstResponseDue,
            $resolutionDue,
            isset($data['tags']) ? json_encode($data['tags']) : null,
            isset($data['custom_fields']) ? json_encode($data['custom_fields']) : null,
            $user['id']
        ]);
        
        $ticketId = $db->lastInsertId();
        
        // Create initial message if provided
        if (!empty($data['initial_message'])) {
            $msgStmt = $db->prepare("
                INSERT INTO ticket_messages (
                    workspace_id, ticket_id, author_user_id, body, direction, message_type
                ) VALUES (?, ?, ?, ?, ?, ?)
            ");
            $msgStmt->execute([
                $workspaceId,
                $ticketId,
                $user['id'],
                $data['initial_message'],
                'outbound',
                'comment'
            ]);
        }
        
        // Log activity
        $this->logActivity($db, $workspaceId, $ticketId, $user['id'], 'created', 'Ticket created');
        
        // Trigger automation
        $this->triggerAutomation($workspaceId, $ticketId, 'ticket_created');
        
        jsonResponse(['id' => $ticketId, 'ticket_number' => $ticketNumber], 201);
    }
    
    /**
     * Update ticket
     * PUT /api/tickets/:id
     */
    public function update($id) {
        $db = getDBConnection();
        $user = requireAuth();
        $workspaceId = $user['workspace_id'];
        
        $data = json_decode(file_get_contents('php://input'), true);
        
        // Get current ticket
        $stmt = $db->prepare("SELECT * FROM tickets WHERE id = ? AND workspace_id = ?");
        $stmt->execute([$id, $workspaceId]);
        $currentTicket = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$currentTicket) {
            http_response_code(404);
            jsonResponse(['error' => 'Ticket not found']);
            return;
        }
        
        $fields = [];
        $params = [];
        
        // Track changes for activity log
        $changes = [];
        
        $allowedFields = [
            'subject', 'description', 'status', 'priority', 'stage_id', 
            'team_id', 'ticket_type_id', 'assigned_user_id',
            'requester_name', 'requester_email', 'requester_phone'
        ];
        
        foreach ($allowedFields as $field) {
            $val = $data[$field] ?? null;
            if ($field === 'subject' && $val === null) $val = $data['title'] ?? null;
            
            if ($val !== null && $val !== $currentTicket[$field]) {
                $fields[] = "$field = ?";
                $params[] = $val;
                $changes[$field] = ['old' => $currentTicket[$field], 'new' => $val];
            }
        }
        
        // Handle JSON fields
        if (isset($data['tags'])) {
            $fields[] = "tags = ?";
            $params[] = json_encode($data['tags']);
        }
        
        if (isset($data['custom_fields'])) {
            $fields[] = "custom_fields = ?";
            $params[] = json_encode($data['custom_fields']);
        }
        
        // Auto-set closed_at when status changes to closed
        if (isset($data['status']) && $data['status'] === 'closed' && $currentTicket['status'] !== 'closed') {
            $fields[] = "closed_at = NOW()";
            
            // Trigger CSAT survey
            $this->sendCSATSurvey($workspaceId, $id);
            $this->triggerAutomation($workspaceId, $id, 'ticket_closed');
        }
        
        // Auto-set resolved_at when status changes to resolved
        if (isset($data['status']) && $data['status'] === 'resolved' && $currentTicket['status'] !== 'resolved') {
            $fields[] = "resolved_at = NOW()";
        }
        
        if (empty($fields)) {
            jsonResponse(['message' => 'No changes']);
            return;
        }
        
        $fields[] = "updated_at = NOW()";
        $params[] = $id;
        $params[] = $workspaceId;
        
        $sql = "UPDATE tickets SET " . implode(', ', $fields) . " WHERE id = ? AND workspace_id = ?";
        $updateStmt = $db->prepare($sql);
        $updateStmt->execute($params);
        
        // Log activities
        foreach ($changes as $field => $change) {
            $activityType = $field === 'status' ? 'status_changed' : 
                           ($field === 'priority' ? 'priority_changed' : 
                           ($field === 'assigned_user_id' ? 'assigned' : 'custom_field_changed'));
            
            $this->logActivity(
                $db, 
                $workspaceId, 
                $id, 
                $user['id'], 
                $activityType, 
                ucfirst(str_replace('_', ' ', $field)) . ' changed',
                $field,
                $change['old'],
                $change['new']
            );
        }
        
        // Trigger assignment automation
        if (isset($changes['assigned_user_id'])) {
            $this->triggerAutomation($workspaceId, $id, 'ticket_assigned');
        }
        
        jsonResponse(['message' => 'Ticket updated']);
    }
    
    /**
     * Add message to ticket
     * POST /api/tickets/:id/messages
     */
    public function addMessage($id) {
        $db = getDBConnection();
        $user = requireAuth();
        $workspaceId = $user['workspace_id'];
        
        $data = json_decode(file_get_contents('php://input'), true);
        
        // Verify ticket exists
        $stmt = $db->prepare("SELECT * FROM tickets WHERE id = ? AND workspace_id = ?");
        $stmt->execute([$id, $workspaceId]);
        $ticket = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$ticket) {
            http_response_code(404);
            jsonResponse(['error' => 'Ticket not found']);
            return;
        }
        
        $msgStmt = $db->prepare("
            INSERT INTO ticket_messages (
                workspace_id, ticket_id, author_user_id, author_name, author_email,
                body, body_html, direction, message_type, is_private,
                from_email, to_email, subject, attachments
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");
        
        $msgStmt->execute([
            $workspaceId,
            $id,
            $user['id'],
            $user['name'] ?? null,
            $user['email'] ?? null,
            $data['body'] ?? '',
            $data['body_html'] ?? null,
            $data['direction'] ?? 'outbound',
            $data['message_type'] ?? 'comment',
            $data['is_private'] ?? false,
            $data['from_email'] ?? null,
            $data['to_email'] ?? null,
            $data['subject'] ?? null,
            isset($data['attachments']) ? json_encode($data['attachments']) : null
        ]);
        
        $messageId = $db->lastInsertId();
        
        // Update first_response_at if this is first outbound message
        if ($data['direction'] === 'outbound' && !$ticket['first_response_at']) {
            $updateStmt = $db->prepare("UPDATE tickets SET first_response_at = NOW() WHERE id = ?");
            $updateStmt->execute([$id]);
        }
        
        // Log activity
        $activityType = ($data['is_private'] ?? false) ? 'note_added' : 'commented';
        $this->logActivity($db, $workspaceId, $id, $user['id'], 'commented', 'Message added');
        
        jsonResponse(['id' => $messageId], 201);
    }
    
    /**
     * Get ticket statistics
     * GET /api/tickets/stats
     */
    public function stats() {
        $db = getDBConnection();
        $user = requireAuth();
        $workspaceId = $user['workspace_id'];
        
        $stats = [];
        
        // Total tickets
        $stmt = $db->prepare("SELECT COUNT(*) as count FROM tickets WHERE workspace_id = ?");
        $stmt->execute([$workspaceId]);
        $stats['total'] = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
        
        // Open tickets
        $stmt = $db->prepare("SELECT COUNT(*) as count FROM tickets WHERE workspace_id = ? AND status IN ('new', 'open', 'pending')");
        $stmt->execute([$workspaceId]);
        $stats['open'] = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
        
        // Unassigned
        $stmt = $db->prepare("SELECT COUNT(*) as count FROM tickets WHERE workspace_id = ? AND assigned_user_id IS NULL AND status NOT IN ('closed', 'resolved')");
        $stmt->execute([$workspaceId]);
        $stats['unassigned'] = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
        
        // Assigned to me
        $stmt = $db->prepare("SELECT COUNT(*) as count FROM tickets WHERE workspace_id = ? AND assigned_user_id = ? AND status NOT IN ('closed', 'resolved')");
        $stmt->execute([$workspaceId, $user['id']]);
        $stats['assigned_to_me'] = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
        
        // SLA breached
        $stmt = $db->prepare("SELECT COUNT(*) as count FROM tickets WHERE workspace_id = ? AND (sla_response_breached = TRUE OR sla_resolution_breached = TRUE)");
        $stmt->execute([$workspaceId]);
        $stats['sla_breached'] = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
        
        // Average resolution time (in hours)
        $stmt = $db->prepare("
            SELECT AVG(TIMESTAMPDIFF(HOUR, created_at, resolved_at)) as avg_hours 
            FROM tickets 
            WHERE workspace_id = ? AND resolved_at IS NOT NULL
        ");
        $stmt->execute([$workspaceId]);
        $stats['avg_resolution_hours'] = round($stmt->fetch(PDO::FETCH_ASSOC)['avg_hours'] ?? 0, 1);
        
        // CSAT average
        $stmt = $db->prepare("SELECT AVG(csat_score) as avg_csat FROM tickets WHERE workspace_id = ? AND csat_score IS NOT NULL");
        $stmt->execute([$workspaceId]);
        $stats['avg_csat'] = round($stmt->fetch(PDO::FETCH_ASSOC)['avg_csat'] ?? 0, 2);
        
        jsonResponse($stats);
    }

    /**
     * List all ticket stages
     * GET /api/ticket-stages
     */
    public function listStages() {
        $db = getDBConnection();
        $user = requireAuth();
        $workspaceId = $user['workspace_id'];
        
        $stmt = $db->prepare("SELECT * FROM ticket_stages WHERE workspace_id = ? ORDER BY sequence ASC");
        $stmt->execute([$workspaceId]);
        $stages = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        jsonResponse($stages);
    }

    /**
     * List all ticket types
     * GET /api/ticket-types
     */
    public function listTypes() {
        $db = getDBConnection();
        $user = requireAuth();
        $workspaceId = $user['workspace_id'];
        
        $stmt = $db->prepare("SELECT * FROM ticket_types WHERE workspace_id = ? AND is_active = TRUE ORDER BY name ASC");
        $stmt->execute([$workspaceId]);
        $types = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        jsonResponse($types);
    }

    /**
     * List all ticket teams
     * GET /api/ticket-teams
     */
    public function listTeams() {
        $db = getDBConnection();
        $user = requireAuth();
        $workspaceId = $user['workspace_id'];
        
        $stmt = $db->prepare("SELECT * FROM ticket_teams WHERE workspace_id = ? AND is_active = TRUE ORDER BY name ASC");
        $stmt->execute([$workspaceId]);
        $teams = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        jsonResponse($teams);
    }
    
    /**
     * Log ticket activity
     */
    private function logActivity($db, $workspaceId, $ticketId, $userId, $activityType, $description, $fieldName = null, $oldValue = null, $newValue = null) {
        $stmt = $db->prepare("
            INSERT INTO ticket_activities (
                workspace_id, ticket_id, user_id, activity_type, description,
                field_name, old_value, new_value
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ");
        $stmt->execute([
            $workspaceId,
            $ticketId,
            $userId,
            $activityType,
            $description,
            $fieldName,
            $oldValue,
            $newValue
        ]);
    }
    
    /**
     * Trigger automation events
     */
    private function triggerAutomation($workspaceId, $ticketId, $eventType) {
        // This would integrate with existing automation_queue table
        // For now, just a placeholder
        // Future: insert into automation_queue for processing
    }
    
    /**
     * Send CSAT survey
     */
    private function sendCSATSurvey($workspaceId, $ticketId) {
        // Placeholder for CSAT survey sending
        // Future: send email/SMS with CSAT survey link
    }
}

/**
 * Global compatibility functions for Helpdesk controllers
 */
if (!function_exists('getDBConnection')) {
    function getDBConnection() {
        return \Xordon\Database::conn();
    }
}

if (!function_exists('requireAuth')) {
    function requireAuth() {
        $userId = \Auth::userIdOrFail();
        $workspace = \Auth::resolveWorkspace($userId);
        if (!$workspace) {
            \Xordon\Response::error('Workspace not found', 404);
            exit;
        }
        return [
            'id' => $userId,
            'workspace_id' => $workspace['id']
        ];
    }
}

if (!function_exists('jsonResponse')) {
    function jsonResponse($data, $status = 200) {
        \Xordon\Response::json($data, $status);
    }
}

