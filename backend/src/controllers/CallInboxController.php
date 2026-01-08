<?php
/**
 * CallInboxController - Handles inbound call management, voicemails, and callbacks
 */

require_once __DIR__ . '/../Database.php';
require_once __DIR__ . '/../Response.php';
require_once __DIR__ . '/../Auth.php';

class CallInboxController {
    
    private static function getWorkspaceScope(): array {
        $ctx = $GLOBALS['tenantContext'] ?? null;
        if ($ctx && isset($ctx->workspaceId)) {
            return ['col' => 'workspace_id', 'val' => (int)$ctx->workspaceId];
        }
        return ['col' => 'user_id', 'val' => Auth::userIdOrFail()];
    }
    
    /**
     * Get inbox items (missed calls, voicemails, callbacks)
     */
    public static function getInboxItems(): void {
        $pdo = Database::conn();
        $scope = self::getWorkspaceScope();
        
        $status = $_GET['status'] ?? null;
        $type = $_GET['type'] ?? null; // 'inbound', 'missed', 'voicemail', 'callback'
        $priority = $_GET['priority'] ?? null;
        $limit = min((int)($_GET['limit'] ?? 50), 100);
        $offset = (int)($_GET['offset'] ?? 0);
        
        // Build query for call logs + voicemails
        $sql = "
            SELECT 
                cl.id,
                cl.from_number as caller_phone,
                cl.to_number as to_number,
                cl.direction,
                cl.status as call_status,
                cl.duration_seconds,
                cl.started_at as call_time,
                cl.recording_url,
                cl.transcription,
                cl.notes,
                cl.tracking_campaign,
                COALESCE(ci.status, 'new') as inbox_status,
                COALESCE(ci.priority, 'medium') as priority,
                ci.assigned_to,
                ci.callback_scheduled_at,
                c.id as contact_id,
                c.first_name as caller_first_name,
                c.last_name as caller_last_name,
                c.email as caller_email,
                comp.name as caller_company,
                u.name as assigned_to_name,
                CASE 
                    WHEN cl.status = 'no-answer' THEN 'missed'
                    WHEN cl.recording_url IS NOT NULL AND cl.duration_seconds > 10 THEN 'voicemail'
                    WHEN ci.callback_scheduled_at IS NOT NULL THEN 'callback'
                    ELSE 'inbound'
                END as call_type
            FROM phone_call_logs cl
            LEFT JOIN call_inbox ci ON cl.id = ci.call_log_id
            LEFT JOIN contacts c ON cl.contact_id = c.id
            LEFT JOIN companies comp ON c.company_id = comp.id
            LEFT JOIN users u ON ci.assigned_to = u.id
            WHERE cl.{$scope['col']} = ?
            AND cl.direction = 'inbound'
        ";
        $params = [$scope['val']];
        
        if ($status && $status !== 'all') {
            $sql .= " AND COALESCE(ci.status, 'new') = ?";
            $params[] = $status;
        }
        
        if ($type && $type !== 'all') {
            switch ($type) {
                case 'missed':
                    $sql .= " AND cl.status = 'no-answer'";
                    break;
                case 'voicemail':
                    $sql .= " AND cl.recording_url IS NOT NULL AND cl.duration_seconds > 10";
                    break;
                case 'callback':
                    $sql .= " AND ci.callback_scheduled_at IS NOT NULL";
                    break;
                case 'inbound':
                    $sql .= " AND cl.status = 'completed'";
                    break;
            }
        }
        
        if ($priority && $priority !== 'all') {
            $sql .= " AND COALESCE(ci.priority, 'medium') = ?";
            $params[] = $priority;
        }
        
        $sql .= " ORDER BY cl.started_at DESC LIMIT ? OFFSET ?";
        $params[] = $limit;
        $params[] = $offset;
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $items = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Format items for frontend
        $formattedItems = array_map(function($item) {
            return [
                'id' => $item['id'],
                'callerName' => trim(($item['caller_first_name'] ?? '') . ' ' . ($item['caller_last_name'] ?? '')) ?: 'Unknown Caller',
                'callerPhone' => $item['caller_phone'],
                'callerCompany' => $item['caller_company'],
                'callerEmail' => $item['caller_email'],
                'callType' => $item['call_type'],
                'callTime' => $item['call_time'],
                'duration' => (int)$item['duration_seconds'],
                'priority' => $item['priority'],
                'status' => $item['inbox_status'],
                'notes' => $item['notes'],
                'assignedTo' => $item['assigned_to_name'],
                'assignedToId' => $item['assigned_to'],
                'campaignName' => $item['tracking_campaign'],
                'recordingUrl' => $item['recording_url'],
                'transcription' => $item['transcription'],
                'callbackScheduledAt' => $item['callback_scheduled_at'],
                'contactId' => $item['contact_id']
            ];
        }, $items);
        
        // Get counts for summary
        $countSql = "
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN COALESCE(ci.status, 'new') = 'new' THEN 1 ELSE 0 END) as new_count,
                SUM(CASE WHEN COALESCE(ci.status, 'new') = 'in-progress' THEN 1 ELSE 0 END) as in_progress_count,
                SUM(CASE WHEN COALESCE(ci.priority, 'medium') = 'high' THEN 1 ELSE 0 END) as high_priority_count,
                SUM(CASE WHEN ci.callback_scheduled_at IS NOT NULL AND ci.status != 'completed' THEN 1 ELSE 0 END) as follow_up_count
            FROM phone_call_logs cl
            LEFT JOIN call_inbox ci ON cl.id = ci.call_log_id
            WHERE cl.{$scope['col']} = ?
            AND cl.direction = 'inbound'
        ";
        $stmt = $pdo->prepare($countSql);
        $stmt->execute([$scope['val']]);
        $counts = $stmt->fetch(PDO::FETCH_ASSOC);
        
        Response::json([
            'items' => $formattedItems,
            'counts' => [
                'total' => (int)$counts['total'],
                'new' => (int)$counts['new_count'],
                'inProgress' => (int)$counts['in_progress_count'],
                'highPriority' => (int)$counts['high_priority_count'],
                'followUp' => (int)$counts['follow_up_count']
            ]
        ]);
    }
    
    /**
     * Update inbox item status/priority/assignment
     */
    public static function updateInboxItem(string $id): void {
        $pdo = Database::conn();
        $scope = self::getWorkspaceScope();
        $body = get_json_body();
        
        // Verify ownership
        $stmt = $pdo->prepare("SELECT id FROM phone_call_logs WHERE id = ? AND {$scope['col']} = ?");
        $stmt->execute([$id, $scope['val']]);
        if (!$stmt->fetch()) {
            Response::notFound('Call not found');
            return;
        }
        
        // Check if inbox record exists
        $stmt = $pdo->prepare("SELECT id FROM call_inbox WHERE call_log_id = ?");
        $stmt->execute([$id]);
        $existing = $stmt->fetch();
        
        if ($existing) {
            // Update existing
            $updates = [];
            $params = [];
            
            $fields = ['status', 'priority', 'assigned_to', 'notes', 'callback_scheduled_at'];
            foreach ($fields as $field) {
                if (isset($body[$field])) {
                    $updates[] = "$field = ?";
                    $params[] = $body[$field];
                }
            }
            
            if (!empty($updates)) {
                $updates[] = "updated_at = NOW()";
                $params[] = $id;
                $stmt = $pdo->prepare("UPDATE call_inbox SET " . implode(', ', $updates) . " WHERE call_log_id = ?");
                $stmt->execute($params);
            }
        } else {
            // Insert new
            $stmt = $pdo->prepare("
                INSERT INTO call_inbox (call_log_id, status, priority, assigned_to, notes, callback_scheduled_at, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())
            ");
            $stmt->execute([
                $id,
                $body['status'] ?? 'new',
                $body['priority'] ?? 'medium',
                $body['assigned_to'] ?? null,
                $body['notes'] ?? null,
                $body['callback_scheduled_at'] ?? null
            ]);
        }
        
        // Also update notes in call log if provided
        if (isset($body['notes'])) {
            $stmt = $pdo->prepare("UPDATE phone_call_logs SET notes = ? WHERE id = ?");
            $stmt->execute([$body['notes'], $id]);
        }
        
        Response::json(['success' => true, 'message' => 'Inbox item updated']);
    }
    
    /**
     * Schedule a callback
     */
    public static function scheduleCallback(string $id): void {
        $pdo = Database::conn();
        $scope = self::getWorkspaceScope();
        $body = get_json_body();
        
        if (empty($body['scheduled_at'])) {
            Response::validationError('Callback date/time is required');
            return;
        }
        
        // Verify ownership
        $stmt = $pdo->prepare("SELECT id, from_number FROM phone_call_logs WHERE id = ? AND {$scope['col']} = ?");
        $stmt->execute([$id, $scope['val']]);
        $call = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$call) {
            Response::notFound('Call not found');
            return;
        }
        
        // Upsert inbox record with callback
        $stmt = $pdo->prepare("
            INSERT INTO call_inbox (call_log_id, status, callback_scheduled_at, assigned_to, notes, created_at, updated_at)
            VALUES (?, 'follow-up', ?, ?, ?, NOW(), NOW())
            ON DUPLICATE KEY UPDATE
                status = 'follow-up',
                callback_scheduled_at = VALUES(callback_scheduled_at),
                assigned_to = COALESCE(VALUES(assigned_to), assigned_to),
                notes = COALESCE(VALUES(notes), notes),
                updated_at = NOW()
        ");
        $stmt->execute([
            $id,
            $body['scheduled_at'],
            $body['assigned_to'] ?? Auth::userId(),
            $body['notes'] ?? null
        ]);
        
        Response::json([
            'success' => true,
            'message' => 'Callback scheduled',
            'callbackAt' => $body['scheduled_at']
        ]);
    }
    
    /**
     * Get voicemails specifically
     */
    public static function getVoicemails(): void {
        $pdo = Database::conn();
        $scope = self::getWorkspaceScope();
        
        $status = $_GET['status'] ?? null;
        $limit = min((int)($_GET['limit'] ?? 50), 100);
        
        $sql = "
            SELECT 
                v.*,
                p.phone_number,
                p.friendly_name as phone_name,
                c.first_name,
                c.last_name,
                c.email as contact_email
            FROM voicemails v
            JOIN phone_numbers p ON v.phone_number_id = p.id
            LEFT JOIN contacts c ON v.contact_id = c.id
            WHERE v.{$scope['col']} = ?
        ";
        $params = [$scope['val']];
        
        if ($status && $status !== 'all') {
            $sql .= " AND v.status = ?";
            $params[] = $status;
        }
        
        $sql .= " ORDER BY v.received_at DESC LIMIT ?";
        $params[] = $limit;
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $voicemails = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        Response::json(['items' => $voicemails]);
    }
    
    /**
     * Get live/active calls for monitoring
     */
    public static function getLiveCalls(): void {
        $pdo = Database::conn();
        $scope = self::getWorkspaceScope();
        
        $sql = "
            SELECT 
                cl.id,
                cl.call_sid,
                cl.from_number,
                cl.to_number,
                cl.direction,
                cl.status,
                cl.started_at,
                TIMESTAMPDIFF(SECOND, cl.started_at, NOW()) as duration_seconds,
                ca.id as agent_id,
                ca.name as agent_name,
                ca.status as agent_status,
                c.first_name,
                c.last_name,
                comp.name as company
            FROM phone_call_logs cl
            LEFT JOIN call_agents ca ON cl.agent_id = ca.id
            LEFT JOIN contacts c ON cl.contact_id = c.id
            LEFT JOIN companies comp ON c.company_id = comp.id
            WHERE cl.{$scope['col']} = ?
            AND cl.status IN ('ringing', 'in-progress', 'queued')
            AND cl.started_at > DATE_SUB(NOW(), INTERVAL 2 HOUR)
            ORDER BY cl.started_at DESC
        ";
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute([$scope['val']]);
        $calls = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Get queue stats
        $queueSql = "
            SELECT 
                COUNT(*) as total_queued,
                AVG(TIMESTAMPDIFF(SECOND, started_at, NOW())) as avg_wait_time,
                MAX(TIMESTAMPDIFF(SECOND, started_at, NOW())) as max_wait_time
            FROM phone_call_logs
            WHERE {$scope['col']} = ?
            AND status = 'queued'
            AND started_at > DATE_SUB(NOW(), INTERVAL 1 HOUR)
        ";
        $stmt = $pdo->prepare($queueSql);
        $stmt->execute([$scope['val']]);
        $queueStats = $stmt->fetch(PDO::FETCH_ASSOC);
        
        Response::json([
            'calls' => $calls,
            'queue' => [
                'totalQueued' => (int)($queueStats['total_queued'] ?? 0),
                'avgWaitTime' => (int)($queueStats['avg_wait_time'] ?? 0),
                'maxWaitTime' => (int)($queueStats['max_wait_time'] ?? 0)
            ]
        ]);
    }
    
    /**
     * Get agent availability/presence
     */
    public static function getAgentPresence(): void {
        $pdo = Database::conn();
        $scope = self::getWorkspaceScope();
        
        $sql = "
            SELECT 
                ca.id,
                ca.name,
                ca.email,
                ca.status,
                ca.last_active_at,
                ca.current_call_id,
                COUNT(DISTINCT cl.id) as active_calls,
                (SELECT COUNT(*) FROM phone_call_logs WHERE agent_id = ca.id AND DATE(started_at) = CURDATE()) as calls_today
            FROM call_agents ca
            LEFT JOIN phone_call_logs cl ON ca.id = cl.agent_id AND cl.status IN ('ringing', 'in-progress')
            WHERE ca.{$scope['col']} = ?
            GROUP BY ca.id
            ORDER BY ca.status = 'available' DESC, ca.name ASC
        ";
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute([$scope['val']]);
        $agents = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        Response::json(['agents' => $agents]);
    }
    
    /**
     * Update agent status (available/busy/away)
     */
    public static function updateAgentStatus(): void {
        $userId = Auth::userIdOrFail();
        $pdo = Database::conn();
        $body = get_json_body();
        
        if (empty($body['status'])) {
            Response::validationError('Status is required');
            return;
        }
        
        $validStatuses = ['available', 'busy', 'away', 'offline', 'on-call'];
        if (!in_array($body['status'], $validStatuses)) {
            Response::validationError('Invalid status');
            return;
        }
        
        // Update agent status by user_id
        $stmt = $pdo->prepare("
            UPDATE call_agents 
            SET status = ?, last_active_at = NOW() 
            WHERE user_id = ?
        ");
        $stmt->execute([$body['status'], $userId]);
        
        if ($stmt->rowCount() === 0) {
            Response::notFound('Agent record not found for this user');
            return;
        }
        
        Response::json(['success' => true, 'status' => $body['status']]);
    }
}
