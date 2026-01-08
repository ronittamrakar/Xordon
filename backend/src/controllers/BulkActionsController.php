<?php

/**
 * BulkActionsController
 * Receive and process bulk actions on tickets and record audit logs
 */

use Xordon\Database;
use Xordon\Response;

class BulkActionsController {

    // POST /helpdesk/bulk-actions
    // Body: { action_type: string, ticket_ids: [int], action_data: {...} }
    public static function process() {
        $db = getDBConnection();
        $user = requireAuth();
        $workspaceId = $user['workspace_id'];

        $data = json_decode(file_get_contents('php://input'), true);
        $actionType = $data['action_type'] ?? null;
        $ticketIds = $data['ticket_ids'] ?? [];
        $actionData = $data['action_data'] ?? null;

        if (!$actionType || !is_array($ticketIds) || count($ticketIds) === 0) {
            http_response_code(400);
            jsonResponse(['error' => 'Invalid payload']);
            return;
        }

        try {
            $db->beginTransaction();

            // Insert log entry (pending)
            $ins = $db->prepare("INSERT INTO ticket_bulk_actions_log (workspace_id, user_id, action_type, ticket_ids, action_data, tickets_affected, status, created_at) VALUES (?, ?, ?, ?, ?, 0, 'processing', NOW())");
            $ins->execute([
                $workspaceId,
                $user['id'],
                $actionType,
                json_encode(array_values($ticketIds)),
                $actionData ? json_encode($actionData) : null
            ]);
            $logId = $db->lastInsertId();

            $affected = 0;

            // Handle common actions
            switch ($actionType) {
                case 'assign':
                    $assignee = intval($actionData['user_id'] ?? 0);
                    if (!$assignee) throw new Exception('Missing assignee');
                    $stmt = $db->prepare("UPDATE tickets SET assigned_user_id = ?, updated_at = NOW() WHERE id = ? AND workspace_id = ?");
                    foreach ($ticketIds as $tid) {
                        $stmt->execute([$assignee, intval($tid), $workspaceId]);
                        if ($stmt->rowCount() > 0) {
                            $affected++;
                            // activity
                            $act = $db->prepare("INSERT INTO ticket_activities (workspace_id, ticket_id, user_id, action, data, created_at) VALUES (?, ?, ?, 'bulk_assign', ?, NOW())");
                            $act->execute([$workspaceId, intval($tid), $user['id'], json_encode(['assigned_to' => $assignee])]);
                        }
                    }
                    break;
                case 'status':
                    $status = $actionData['status'] ?? null;
                    if (!$status) throw new Exception('Missing status');
                    $stmt = $db->prepare("UPDATE tickets SET status = ?, updated_at = NOW() WHERE id = ? AND workspace_id = ?");
                    foreach ($ticketIds as $tid) {
                        $stmt->execute([$status, intval($tid), $workspaceId]);
                        if ($stmt->rowCount() > 0) {
                            $affected++;
                            $act = $db->prepare("INSERT INTO ticket_activities (workspace_id, ticket_id, user_id, action, data, created_at) VALUES (?, ?, ?, 'bulk_status', ?, NOW())");
                            $act->execute([$workspaceId, intval($tid), $user['id'], json_encode(['status' => $status])]);
                        }
                    }
                    break;
                case 'priority':
                    $priority = $actionData['priority'] ?? null;
                    if (!$priority) throw new Exception('Missing priority');
                    $stmt = $db->prepare("UPDATE tickets SET priority = ?, updated_at = NOW() WHERE id = ? AND workspace_id = ?");
                    foreach ($ticketIds as $tid) {
                        $stmt->execute([$priority, intval($tid), $workspaceId]);
                        if ($stmt->rowCount() > 0) {
                            $affected++;
                            $act = $db->prepare("INSERT INTO ticket_activities (workspace_id, ticket_id, user_id, action, data, created_at) VALUES (?, ?, ?, 'bulk_priority', ?, NOW())");
                            $act->execute([$workspaceId, intval($tid), $user['id'], json_encode(['priority' => $priority])]);
                        }
                    }
                    break;
                case 'tag':
                    $tags = $actionData['tags'] ?? [];
                    $stmt = $db->prepare("SELECT tags FROM tickets WHERE id = ? AND workspace_id = ?");
                    $ustmt = $db->prepare("UPDATE tickets SET tags = ?, updated_at = NOW() WHERE id = ? AND workspace_id = ?");
                    foreach ($ticketIds as $tid) {
                        $stmt->execute([intval($tid), $workspaceId]);
                        $row = $stmt->fetch(PDO::FETCH_ASSOC);
                        $existing = $row && $row['tags'] ? json_decode($row['tags'], true) : [];
                        $merged = array_values(array_unique(array_merge($existing, $tags)));
                        $ustmt->execute([json_encode($merged), intval($tid), $workspaceId]);
                        if ($ustmt->rowCount() > 0) {
                            $affected++;
                            $act = $db->prepare("INSERT INTO ticket_activities (workspace_id, ticket_id, user_id, action, data, created_at) VALUES (?, ?, ?, 'bulk_tag', ?, NOW())");
                            $act->execute([$workspaceId, intval($tid), $user['id'], json_encode(['tags' => $merged])]);
                        }
                    }
                    break;
                case 'close':
                    $stmt = $db->prepare("UPDATE tickets SET status = 'closed', closed_at = NOW(), updated_at = NOW() WHERE id = ? AND workspace_id = ?");
                    foreach ($ticketIds as $tid) {
                        $stmt->execute([intval($tid), $workspaceId]);
                        if ($stmt->rowCount() > 0) {
                            $affected++;
                            $act = $db->prepare("INSERT INTO ticket_activities (workspace_id, ticket_id, user_id, action, data, created_at) VALUES (?, ?, ?, 'bulk_close', ?, NOW())");
                            $act->execute([$workspaceId, intval($tid), $user['id'], json_encode(['closed_by_bulk' => true])]);
                        }
                    }
                    break;
                case 'delete':
                    $stmt = $db->prepare("DELETE FROM tickets WHERE id = ? AND workspace_id = ?");
                    foreach ($ticketIds as $tid) {
                        $stmt->execute([intval($tid), $workspaceId]);
                        if ($stmt->rowCount() > 0) {
                            $affected++;
                            $act = $db->prepare("INSERT INTO ticket_activities (workspace_id, ticket_id, user_id, action, data, created_at) VALUES (?, ?, ?, 'bulk_delete', ?, NOW())");
                            $act->execute([$workspaceId, intval($tid), $user['id'], json_encode(['deleted_by_bulk' => true])]);
                        }
                    }
                    break;
                case 'merge':
                    // For merge - use MergeSplitController::merge if available
                    if (!class_exists('MergeSplitController')) throw new Exception('MergeSplitController not available');
                    // Expect action_data.primary_ticket_id to be present
                    $primary = intval($actionData['primary_ticket_id'] ?? 0);
                    $toMerge = array_filter($ticketIds, function($id) use ($primary) { return intval($id) !== $primary; });
                    if ($primary && count($toMerge) > 0) {
                        // Call existing merge logic iteratively or trigger MergeSplitController
                        MergeSplitController::merge(); // Note: assumes same payload will be parsed
                        $affected = count($toMerge);
                    }
                    break;
                default:
                    throw new Exception('Unsupported action');
            }

            // Update log
            $upd = $db->prepare("UPDATE ticket_bulk_actions_log SET tickets_affected = ?, status = 'completed', completed_at = NOW() WHERE id = ?");
            $upd->execute([$affected, $logId]);

            $db->commit();

            jsonResponse(['processed' => (int)$affected, 'log_id' => (int)$logId]);
        } catch (Exception $e) {
            if ($db->inTransaction()) $db->rollBack();
            error_log('Bulk action error: ' . $e->getMessage());
            // mark log as failed
            try {
                $db->prepare("UPDATE ticket_bulk_actions_log SET status = 'failed', error_message = ?, completed_at = NOW() WHERE id = ?")->execute([$e->getMessage(), $logId ?? null]);
            } catch (Exception $ex) {
                // ignore
            }
            http_response_code(500);
            jsonResponse(['error' => 'Failed to process bulk action', 'details' => $e->getMessage()]);
        }
    }

    // GET /helpdesk/bulk-actions/logs
    public static function logs() {
        $db = getDBConnection();
        $user = requireAuth();
        $workspaceId = $user['workspace_id'];

        $stmt = $db->prepare("SELECT * FROM ticket_bulk_actions_log WHERE workspace_id = ? ORDER BY created_at DESC LIMIT 200");
        $stmt->execute([$workspaceId]);
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        jsonResponse($rows);
    }
}
