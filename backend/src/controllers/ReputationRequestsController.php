<?php
namespace Xordon\Controllers;

use Xordon\Database;
use Xordon\Response;
use PDO;

class ReputationRequestsController {
    
    /**
     * Get review requests with stats
     */
    public function index() {
        return self::getRequests();
    }

    public static function getRequests() {
        try {
            $db = Database::conn();
            $workspaceId = $_SESSION['workspace_id'] ?? 1;
            
            $stmt = $db->prepare("
                SELECT r.*, c.name as contact_name, c.email as contact_email, c.phone as contact_phone
                FROM review_requests r
                LEFT JOIN contacts c ON r.contact_id = c.id
                WHERE r.workspace_id = ?
                ORDER BY r.created_at DESC
            ");
            $stmt->execute([$workspaceId]);
            $requests = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Get stats
            $statsStmt = $db->prepare("
                SELECT 
                    COUNT(*) as total,
                    SUM(CASE WHEN status = 'sent' THEN 1 ELSE 0 END) as sent,
                    SUM(CASE WHEN status = 'opened' THEN 1 ELSE 0 END) as opened,
                    SUM(CASE WHEN status = 'clicked' THEN 1 ELSE 0 END) as clicked,
                    SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed
                FROM review_requests
                WHERE workspace_id = ?
            ");
            $statsStmt->execute([$workspaceId]);
            $stats = $statsStmt->fetch(PDO::FETCH_ASSOC);
            
            return Response::json([
                'requests' => $requests,
                'stats' => $stats ?: [
                    'total' => 0,
                    'sent' => 0,
                    'opened' => 0,
                    'clicked' => 0,
                    'completed' => 0
                ]
            ]);
        } catch (\Exception $e) {
            return Response::json(['error' => $e->getMessage()], 500);
        }
    }
    
    /**
     * Create/Send a new review request
     */
    public function create() {
        return self::sendRequest();
    }

    public static function sendRequest() {
        try {
            $db = Database::conn();
            $workspaceId = $_SESSION['workspace_id'] ?? 1;
            $data = json_decode(file_get_contents('php://input'), true);
            
            if (!isset($data['contact_id'])) {
                return Response::json(['error' => 'Missing contact_id'], 400);
            }
            
            // Get contact info
            $contactStmt = $db->prepare("SELECT name, email, phone FROM contacts WHERE id = ?");
            $contactStmt->execute([$data['contact_id']]);
            $contact = $contactStmt->fetch(PDO::FETCH_ASSOC);
            
            $stmt = $db->prepare("
                INSERT INTO review_requests (
                    workspace_id, contact_id, contact_name, contact_email, contact_phone,
                    channel, status, template_id, sent_at, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, 'sent', ?, NOW(), NOW(), NOW())
            ");
            
            $stmt->execute([
                $workspaceId,
                $data['contact_id'],
                $contact['name'] ?? 'Unknown',
                $contact['email'] ?? null,
                $contact['phone'] ?? null,
                $data['channel'] ?? $data['type'] ?? 'email',
                $data['template_id'] ?? null
            ]);
            
            $requestId = $db->lastInsertId();
            
            return Response::json([
                'success' => true,
                'message' => 'Review request sent successfully',
                'id' => (int)$requestId
            ]);
        } catch (\Exception $e) {
            return Response::json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Send an existing request
     */
    public function send($id) {
        try {
            $db = Database::conn();
            $workspaceId = $_SESSION['workspace_id'] ?? 1;
            
            $stmt = $db->prepare("UPDATE review_requests SET status = 'sent', sent_at = NOW(), updated_at = NOW() WHERE id = ? AND workspace_id = ?");
            $stmt->execute([$id, $workspaceId]);
            
            return Response::json([
                'success' => true,
                'message' => 'Review request sent'
            ]);
        } catch (\Exception $e) {
            return Response::json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Delete a request record
     */
    public function delete($id) {
        return self::deleteRequest($id);
    }

    public static function deleteRequest($id) {
        try {
            $db = Database::conn();
            $workspaceId = $_SESSION['workspace_id'] ?? 1;
            
            $stmt = $db->prepare("DELETE FROM review_requests WHERE id = ? AND workspace_id = ?");
            $stmt->execute([$id, $workspaceId]);
            
            return Response::json(['success' => true]);
        } catch (\Exception $e) {
            return Response::json(['error' => $e->getMessage()], 500);
        }
    }
}

