<?php

namespace Xordon\Controllers;

use Xordon\Core\Database;
use Xordon\Core\Auth;
use Xordon\Core\Response;

class ClientPortalController {
    
    public static function uploadDocument() {
        $ctx = $GLOBALS['tenantContext'] ?? null;
        
        if (!$ctx || !isset($ctx->workspaceId)) {
            return Response::error('Unauthorized', 401);
        }
        
        $data = json_decode(file_get_contents('php://input'), true);
        
        $db = Database::conn();
        
        $stmt = $db->prepare("
            INSERT INTO portal_documents 
            (workspace_id, company_id, contact_id, document_type, title, description,
             file_url, file_name, file_size, file_type, requires_signature, is_visible_to_client)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");
        
        $stmt->execute([
            $ctx->workspaceId,
            $ctx->activeCompanyId ?? null,
            $data['contact_id'],
            $data['document_type'] ?? 'other',
            $data['title'],
            $data['description'] ?? null,
            $data['file_url'],
            $data['file_name'],
            $data['file_size'] ?? null,
            $data['file_type'] ?? null,
            $data['requires_signature'] ?? false,
            $data['is_visible_to_client'] ?? true
        ]);
        
        return Response::success(['document_id' => $db->lastInsertId()]);
    }
    
    public static function listDocuments() {
        $ctx = $GLOBALS['tenantContext'] ?? null;
        if (!$ctx || !isset($ctx->workspaceId)) {
            return Response::error('Unauthorized', 401);
        }
        
        $contactId = $_GET['contact_id'] ?? null;
        
        $db = Database::conn();
        
        $sql = "SELECT * FROM portal_documents WHERE workspace_id = ?";
        $params = [$ctx->workspaceId];
        
        if ($contactId) {
            $sql .= " AND contact_id = ?";
            $params[] = $contactId;
        }
        
        $sql .= " ORDER BY created_at DESC";
        
        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        $documents = $stmt->fetchAll(\PDO::FETCH_ASSOC);
        
        return Response::success($documents);
    }
    
    public static function signDocument($id) {
        $data = json_decode(file_get_contents('php://input'), true);
        $ctx = $GLOBALS['tenantContext'] ?? null;
        
        if (!$ctx || !isset($ctx->workspaceId)) {
            return Response::error('Unauthorized', 401);
        }
        
        $db = Database::conn();
        
        $stmt = $db->prepare("
            UPDATE portal_documents 
            SET signature_status = 'signed', 
                signed_at = NOW(), 
                signature_data = ?
            WHERE id = ? AND workspace_id = ?
        ");
        
        $stmt->execute([
            json_encode($data['signature_data']),
            $id,
            $ctx->workspaceId
        ]);
        
        return Response::success(['message' => 'Document signed successfully']);
    }
    
    public static function sendMessage() {
        $data = json_decode(file_get_contents('php://input'), true);
        $ctx = $GLOBALS['tenantContext'] ?? null;
        
        if (!$ctx || !isset($ctx->workspaceId)) {
            return Response::error('Unauthorized', 401);
        }
        
        $db = Database::conn();
        
        $threadId = $data['thread_id'] ?? md5(uniqid());
        
        $stmt = $db->prepare("
            INSERT INTO portal_messages 
            (workspace_id, company_id, contact_id, thread_id, direction, sender_type, 
             sender_id, subject, message, attachments)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");
        
        $stmt->execute([
            $ctx->workspaceId,
            $ctx->activeCompanyId ?? null,
            $data['contact_id'],
            $threadId,
            $data['direction'] ?? 'outbound',
            $data['sender_type'] ?? 'staff',
            $data['sender_id'] ?? null,
            $data['subject'] ?? null,
            $data['message'],
            json_encode($data['attachments'] ?? [])
        ]);
        
        return Response::success(['message_id' => $db->lastInsertId()]);
    }
    
    public static function listMessages() {
        $ctx = $GLOBALS['tenantContext'] ?? null;
        if (!$ctx || !isset($ctx->workspaceId)) {
            return Response::error('Unauthorized', 401);
        }
        
        $contactId = $_GET['contact_id'] ?? null;
        $threadId = $_GET['thread_id'] ?? null;
        
        $db = Database::conn();
        
        $sql = "SELECT * FROM portal_messages WHERE workspace_id = ?";
        $params = [$ctx->workspaceId];
        
        if ($contactId) {
            $sql .= " AND contact_id = ?";
            $params[] = $contactId;
        }
        
        if ($threadId) {
            $sql .= " AND thread_id = ?";
            $params[] = $threadId;
        }
        
        $sql .= " ORDER BY created_at DESC";
        
        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        $messages = $stmt->fetchAll(\PDO::FETCH_ASSOC);
        
        return Response::success($messages);
    }
    
    public static function markMessageRead($id) {
        $ctx = $GLOBALS['tenantContext'] ?? null;
        
        if (!$ctx || !isset($ctx->workspaceId)) {
            return Response::error('Unauthorized', 401);
        }
        
        $db = Database::conn();
        
        $stmt = $db->prepare("
            UPDATE portal_messages 
            SET is_read = 1, read_at = NOW()
            WHERE id = ? AND workspace_id = ?
        ");
        
        $stmt->execute([$id, $ctx->workspaceId]);
        
        return Response::success(['message' => 'Message marked as read']);
    }
}
