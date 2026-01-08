<?php

/**
 * MergeSplitController
 * Handles ticket merge and undo operations and history
 */

use Xordon\Database;
use Xordon\Response;
use PDO;
use Exception;

class MergeSplitController {

    /**
     * POST /helpdesk/tickets/merge
     * Body: { primary_ticket_id: int, merged_ticket_ids: [int], reason: string }
     */
    public static function merge() {
        $db = getDBConnection();
        $user = requireAuth();
        $workspaceId = $user['workspace_id'];

        $data = json_decode(file_get_contents('php://input'), true);
        $primaryId = intval($data['primary_ticket_id'] ?? 0);
        $mergedIds = $data['merged_ticket_ids'] ?? [];
        $reason = $data['reason'] ?? null;

        if (!$primaryId || !is_array($mergedIds) || count($mergedIds) < 1) {
            http_response_code(400);
            jsonResponse(['error' => 'Invalid payload']);
            return;
        }

        // Ensure primary is part of selected tickets
        if (!in_array($primaryId, $mergedIds)) {
            http_response_code(400);
            jsonResponse(['error' => 'Primary ticket must be one of the selected tickets']);
            return;
        }

        try {
            $db->beginTransaction();

            // Validate primary ticket
            $pstmt = $db->prepare("SELECT id, ticket_number, workspace_id FROM tickets WHERE id = ? AND workspace_id = ? FOR UPDATE");
            $pstmt->execute([$primaryId, $workspaceId]);
            $primary = $pstmt->fetch(PDO::FETCH_ASSOC);
            if (!$primary) {
                $db->rollBack();
                http_response_code(404);
                jsonResponse(['error' => 'Primary ticket not found']);
                return;
            }

            $mergedCount = 0;
            foreach ($mergedIds as $mid) {
                $mid = intval($mid);
                if ($mid === $primaryId) continue; // skip primary

                // Validate merged ticket
                $mstmt = $db->prepare("SELECT id, ticket_number, subject, workspace_id FROM tickets WHERE id = ? AND workspace_id = ? FOR UPDATE");
                $mstmt->execute([$mid, $workspaceId]);
                $mergedTicket = $mstmt->fetch(PDO::FETCH_ASSOC);
                if (!$mergedTicket) {
                    continue;
                }

                // Copy messages from merged ticket into primary ticket with a prefix
                $msgStmt = $db->prepare("SELECT * FROM ticket_messages WHERE ticket_id = ? ORDER BY created_at ASC");
                $msgStmt->execute([$mid]);
                $messages = $msgStmt->fetchAll(PDO::FETCH_ASSOC);

                foreach ($messages as $msg) {
                    $body = "[Merged from {$mergedTicket['ticket_number']}]\n" . $msg['body'];
                    $insertMsg = $db->prepare("INSERT INTO ticket_messages (workspace_id, ticket_id, author_user_id, body, attachments, direction, message_type, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
                    $insertMsg->execute([
                        $workspaceId,
                        $primaryId,
                        $msg['author_user_id'] ?? null,
                        $body,
                        $msg['attachments'] ?? null,
                        $msg['direction'] ?? 'inbound',
                        $msg['message_type'] ?? 'comment',
                        $msg['created_at'] ?? date('Y-m-d H:i:s')
                    ]);
                }

                // Insert merge history record per merged ticket
                $ins = $db->prepare("INSERT INTO ticket_merge_history (workspace_id, primary_ticket_id, merged_ticket_id, merged_ticket_number, merged_by_user_id, merge_reason, merged_at) VALUES (?, ?, ?, ?, ?, ?, NOW())");
                $ins->execute([$workspaceId, $primaryId, $mid, $mergedTicket['ticket_number'], $user['id'], $reason]);

                // Close/mark merged ticket
                $upd = $db->prepare("UPDATE tickets SET status = 'merged', closed_at = NOW(), updated_at = NOW() WHERE id = ? AND workspace_id = ?");
                $upd->execute([$mid, $workspaceId]);

                // Log activity
                $act = $db->prepare("INSERT INTO ticket_activities (workspace_id, ticket_id, user_id, action, data, created_at) VALUES (?, ?, ?, ?, ?, NOW())");
                $act->execute([$workspaceId, $primaryId, $user['id'], 'merged', json_encode(['merged_ticket' => $mid, 'merged_ticket_number' => $mergedTicket['ticket_number']])]);

                $mergedCount++;
            }

            $db->commit();

            jsonResponse(['merged' => $mergedCount]);
        } catch (Exception $e) {
            if ($db->inTransaction()) $db->rollBack();
            error_log('Merge error: ' . $e->getMessage());
            http_response_code(500);
            jsonResponse(['error' => 'Failed to merge tickets']);
        }
    }

    /**
     * GET /helpdesk/merge-history
     */
    public static function history() {
        $db = getDBConnection();
        $user = requireAuth();
        $workspaceId = $user['workspace_id'];

        $stmt = $db->prepare("SELECT tmh.*, pt.ticket_number as primary_ticket_number, pt.subject as primary_subject FROM ticket_merge_history tmh LEFT JOIN tickets pt ON tmh.primary_ticket_id = pt.id WHERE tmh.workspace_id = ? ORDER BY tmh.merged_at DESC LIMIT 200");
        $stmt->execute([$workspaceId]);
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        jsonResponse($rows);
    }

    /**
     * POST /helpdesk/merge-history/{id}/undo
     */
    public static function undo($id) {
        $db = getDBConnection();
        $user = requireAuth();
        $workspaceId = $user['workspace_id'];

        $stmt = $db->prepare("SELECT * FROM ticket_merge_history WHERE id = ? AND workspace_id = ?");
        $stmt->execute([$id, $workspaceId]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$row) {
            http_response_code(404);
            jsonResponse(['error' => 'Merge record not found']);
            return;
        }

        try {
            $db->beginTransaction();

            // Reopen merged ticket
            $upd = $db->prepare("UPDATE tickets SET status = 'open', updated_at = NOW() WHERE id = ? AND workspace_id = ?");
            $upd->execute([$row['merged_ticket_id'], $workspaceId]);

            // Log activity
            $act = $db->prepare("INSERT INTO ticket_activities (workspace_id, ticket_id, user_id, action, data, created_at) VALUES (?, ?, ?, ?, ?, NOW())");
            $act->execute([$workspaceId, $row['merged_ticket_id'], $user['id'], 'undo_merge', json_encode(['restored_to' => $row['primary_ticket_id']])]);

            // Optionally record split history
            $ins = $db->prepare("INSERT INTO ticket_split_history (workspace_id, original_ticket_id, new_ticket_id, split_by_user_id, split_reason, split_at) VALUES (?, ?, ?, ?, ?, NOW())");
            // original_ticket_id in this context is the primary, new_ticket_id is the re-opened merged ticket
            $ins->execute([$workspaceId, $row['primary_ticket_id'], $row['merged_ticket_id'], $user['id'], 'Undo merge: ' . ($row['merge_reason'] ?? '')]);

            // Remove merge history row (or mark undone) - we'll delete to keep history clear
            $del = $db->prepare("DELETE FROM ticket_merge_history WHERE id = ?");
            $del->execute([$id]);

            $db->commit();

            jsonResponse(['undone' => true]);
        } catch (Exception $e) {
            if ($db->inTransaction()) $db->rollBack();
            error_log('Undo merge error: ' . $e->getMessage());
            http_response_code(500);
            jsonResponse(['error' => 'Failed to undo merge']);
        }
    }
}
