<?php

/**
 * CSATController
 * Manage CSAT survey CRUD and manual send
 */

use Xordon\Database;
use Xordon\Response;

class CSATController {

    /**
     * GET /helpdesk/csat-surveys
     */
    public static function list() {
        $userId = Auth::userIdOrFail();
        $workspace = Auth::resolveWorkspace($userId);
        if (!$workspace) Response::error('Workspace not found', 404);
        $workspaceId = $workspace['id'];

        $db = Database::conn();

        $stmt = $db->prepare("SELECT * FROM ticket_csat_surveys WHERE workspace_id = ? ORDER BY id DESC");
        $stmt->execute([$workspaceId]);
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        Response::json($rows);
    }

    /**
     * POST /helpdesk/csat-surveys
     */
    public static function create() {
        $userId = Auth::userIdOrFail();
        $workspace = Auth::resolveWorkspace($userId);
        if (!$workspace) Response::error('Workspace not found', 404);
        $workspaceId = $workspace['id'];

        $db = Database::conn();

        $data = json_decode(file_get_contents('php://input'), true);
        if (empty($data['name']) || empty($data['email_subject']) || empty($data['email_body']) || empty($data['survey_question'])) {
            Response::error('Missing required fields', 400);
            return;
        }

        $stmt = $db->prepare("INSERT INTO ticket_csat_surveys (workspace_id, name, description, is_active, trigger_event, delay_minutes, email_subject, email_body, survey_question, rating_scale, ask_comment, comment_required, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())");
        $stmt->execute([
            $workspaceId,
            $data['name'],
            $data['description'] ?? null,
            isset($data['is_active']) ? (bool)$data['is_active'] : true,
            $data['trigger_event'] ?? 'ticket_closed',
            intval($data['delay_minutes'] ?? 0),
            $data['email_subject'],
            $data['email_body'],
            $data['survey_question'],
            $data['rating_scale'] ?? '1-5',
            isset($data['ask_comment']) ? (bool)$data['ask_comment'] : true,
            isset($data['comment_required']) ? (bool)$data['comment_required'] : false,
        ]);

        Response::json(['id' => $db->lastInsertId()], 201);
    }

    /**
     * PUT /helpdesk/csat-surveys/:id
     */
    public static function update($id) {
        $userId = Auth::userIdOrFail();
        $workspace = Auth::resolveWorkspace($userId);
        if (!$workspace) Response::error('Workspace not found', 404);
        $workspaceId = $workspace['id'];

        $db = Database::conn();

        $data = json_decode(file_get_contents('php://input'), true);

        $stmt = $db->prepare("SELECT * FROM ticket_csat_surveys WHERE id = ? AND workspace_id = ?");
        $stmt->execute([$id, $workspaceId]);
        $existing = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$existing) {
            http_response_code(404);
            jsonResponse(['error' => 'Survey not found']);
            return;
        }

        $fields = [];
        $params = [];
        $allowed = ['name','description','is_active','trigger_event','delay_minutes','email_subject','email_body','survey_question','rating_scale','ask_comment','comment_required'];
        foreach ($allowed as $f) {
            if (array_key_exists($f, $data)) {
                $fields[] = "$f = ?";
                $params[] = $data[$f];
            }
        }
        if (empty($fields)) {
            jsonResponse(['message' => 'No changes']);
            return;
        }

        $sql = "UPDATE ticket_csat_surveys SET " . implode(', ', $fields) . ", updated_at = NOW() WHERE id = ? AND workspace_id = ?";
        $params[] = $id;
        $params[] = $workspaceId;
        $upd = $db->prepare($sql);
        $upd->execute($params);

        jsonResponse(['updated' => true]);
    }

    /**
     * DELETE /helpdesk/csat-surveys/:id
     */
    public static function delete($id) {
        $userId = Auth::userIdOrFail();
        $workspace = Auth::resolveWorkspace($userId);
        if (!$workspace) Response::error('Workspace not found', 404);
        $workspaceId = $workspace['id'];

        $db = Database::conn();

        $stmt = $db->prepare("DELETE FROM ticket_csat_surveys WHERE id = ? AND workspace_id = ?");
        $stmt->execute([$id, $workspaceId]);

        jsonResponse(['deleted' => true]);
    }

    /**
     * POST /helpdesk/csat-surveys/:id/send
     * Body: { ticket_id: int }
     */
    public static function send($id) {
        $userId = Auth::userIdOrFail();
        $workspace = Auth::resolveWorkspace($userId);
        if (!$workspace) Response::error('Workspace not found', 404);
        $workspaceId = $workspace['id'];

        $db = Database::conn();

        $data = json_decode(file_get_contents('php://input'), true);
        $ticketId = intval($data['ticket_id'] ?? 0);

        $stmt = $db->prepare("SELECT * FROM ticket_csat_surveys WHERE id = ? AND workspace_id = ?");
        $stmt->execute([$id, $workspaceId]);
        $survey = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$survey) {
            http_response_code(404);
            jsonResponse(['error' => 'Survey not found']);
            return;
        }

        $tstmt = $db->prepare("SELECT * FROM tickets WHERE id = ? AND workspace_id = ?");
        $tstmt->execute([$ticketId, $workspaceId]);
        $ticket = $tstmt->fetch(PDO::FETCH_ASSOC);
        if (!$ticket) {
            http_response_code(404);
            jsonResponse(['error' => 'Ticket not found']);
            return;
        }

        // Prepare and send email (simple implementation)
        $to = $ticket['requester_email'] ?? null;
        if (!$to) {
            http_response_code(400);
            jsonResponse(['error' => 'Ticket has no requester email']);
            return;
        }

        $subject = str_replace(['{{firstName}}','{{ticketNumber}}'], [$ticket['requester_name'] ?? '', $ticket['ticket_number']], $survey['email_subject']);
        $body = str_replace(['{{firstName}}','{{ticketNumber}}'], [$ticket['requester_name'] ?? '', $ticket['ticket_number']], $survey['email_body']);

        // Create unique response token
        $token = bin2hex(random_bytes(16));
        $ins = $db->prepare("INSERT INTO ticket_csat_survey_sends (workspace_id, survey_id, ticket_id, sent_to_email, response_token, sent_at) VALUES (?, ?, ?, ?, ?, NOW())");
        $ins->execute([$workspaceId, $id, $ticketId, $to, $token]);

        // Send mail via mailer service (simulate if Mailer not present)
        try {
            $mailerLink = (getenv('APP_BASE_URL') ?: '') . "/survey/respond/" . $token;
            if (class_exists('\\Mailer')) {
                Mailer::send($to, $subject, $body . "\n\nSurvey link: " . $mailerLink);
            } else {
                Logger::info("CSAT send simulated to $to", ['subject' => $subject, 'link' => $mailerLink]);
            }
        } catch (Exception $e) {
            Logger::error('CSAT send error: ' . $e->getMessage());
        }

        Response::json(['sent' => true]);
    }
}
