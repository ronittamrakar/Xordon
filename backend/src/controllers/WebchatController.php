<?php

namespace Xordon\Controllers;

use Xordon\Core\Database;
use Xordon\Core\Auth;
use Xordon\Core\Response;

class WebchatController {
    
    public static function createWidget() {
        $data = json_decode(file_get_contents('php://input'), true);
        $ctx = $GLOBALS['tenantContext'] ?? null;
        
        if (!$ctx || !isset($ctx->workspaceId)) {
            return Response::error('Unauthorized', 401);
        }
        
        $db = Database::conn();
        
        $widgetKey = bin2hex(random_bytes(32));
        
        $stmt = $db->prepare("
            INSERT INTO webchat_widgets 
            (workspace_id, company_id, name, widget_key, theme_color, position, greeting_message, offline_message, auto_open, auto_open_delay)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");
        
        $stmt->execute([
            $ctx->workspaceId,
            $ctx->activeCompanyId ?? null,
            $data['name'] ?? 'Website Chat',
            $widgetKey,
            $data['theme_color'] ?? '#3b82f6',
            $data['position'] ?? 'bottom-right',
            $data['greeting_message'] ?? 'Hi! How can we help you today?',
            $data['offline_message'] ?? 'We\'re currently offline. Leave a message!',
            $data['auto_open'] ?? false,
            $data['auto_open_delay'] ?? 5
        ]);
        
        $widgetId = $db->lastInsertId();
        
        $stmt = $db->prepare("SELECT * FROM webchat_widgets WHERE id = ?");
        $stmt->execute([$widgetId]);
        $widget = $stmt->fetch(\PDO::FETCH_ASSOC);
        
        return Response::success($widget);
    }
    
    public static function listWidgets() {
        $ctx = $GLOBALS['tenantContext'] ?? null;
        if (!$ctx || !isset($ctx->workspaceId)) {
            return Response::error('Unauthorized', 401);
        }
        
        $db = Database::conn();
        
        $stmt = $db->prepare("SELECT * FROM webchat_widgets WHERE workspace_id = ? ORDER BY created_at DESC");
        $stmt->execute([$ctx->workspaceId]);
        $widgets = $stmt->fetchAll(\PDO::FETCH_ASSOC);
        
        return Response::success($widgets);
    }
    
    public static function getWidget($id) {
        $ctx = $GLOBALS['tenantContext'] ?? null;
        if (!$ctx || !isset($ctx->workspaceId)) {
            return Response::error('Unauthorized', 401);
        }
        
        $db = Database::conn();
        
        $stmt = $db->prepare("SELECT * FROM webchat_widgets WHERE id = ? AND workspace_id = ?");
        $stmt->execute([$id, $ctx->workspaceId]);
        $widget = $stmt->fetch(\PDO::FETCH_ASSOC);
        
        if (!$widget) {
            return Response::error('Widget not found', 404);
        }
        
        return Response::success($widget);
    }
    
    public static function updateWidget($id) {
        $data = json_decode(file_get_contents('php://input'), true);
        $ctx = $GLOBALS['tenantContext'] ?? null;
        
        if (!$ctx || !isset($ctx->workspaceId)) {
            return Response::error('Unauthorized', 401);
        }
        
        $db = Database::conn();
        
        $fields = [];
        $params = [];
        
        $allowedFields = ['name', 'theme_color', 'position', 'greeting_message', 'offline_message', 'auto_open', 'auto_open_delay', 'is_active'];
        
        foreach ($allowedFields as $field) {
            if (isset($data[$field])) {
                $fields[] = "$field = ?";
                $params[] = $data[$field];
            }
        }
        
        if (empty($fields)) {
            return Response::error('No fields to update', 400);
        }
        
        $params[] = $id;
        $params[] = $ctx->workspaceId;
        
        $sql = "UPDATE webchat_widgets SET " . implode(', ', $fields) . " WHERE id = ? AND workspace_id = ?";
        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        
        return self::getWidget($id);
    }
    
    public static function initSession() {
        $data = json_decode(file_get_contents('php://input'), true);
        
        $widgetKey = $data['widget_key'] ?? null;
        if (!$widgetKey) {
            return Response::error('Widget key required', 400);
        }
        
        $db = Database::conn();
        
        $stmt = $db->prepare("SELECT * FROM webchat_widgets WHERE widget_key = ? AND is_active = 1");
        $stmt->execute([$widgetKey]);
        $widget = $stmt->fetch(\PDO::FETCH_ASSOC);
        
        if (!$widget) {
            return Response::error('Widget not found or inactive', 404);
        }
        
        $sessionKey = bin2hex(random_bytes(32));
        
        $stmt = $db->prepare("
            INSERT INTO webchat_sessions 
            (widget_id, session_key, visitor_name, visitor_email, visitor_phone, ip_address, user_agent, referrer, current_page)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");
        
        $stmt->execute([
            $widget['id'],
            $sessionKey,
            $data['visitor_name'] ?? null,
            $data['visitor_email'] ?? null,
            $data['visitor_phone'] ?? null,
            $_SERVER['REMOTE_ADDR'] ?? null,
            $_SERVER['HTTP_USER_AGENT'] ?? null,
            $data['referrer'] ?? null,
            $data['current_page'] ?? null
        ]);
        
        $sessionId = $db->lastInsertId();
        
        return Response::success([
            'session_key' => $sessionKey,
            'session_id' => $sessionId,
            'widget' => $widget
        ]);
    }
    
    public static function sendMessage() {
        $data = json_decode(file_get_contents('php://input'), true);
        
        $sessionKey = $data['session_key'] ?? null;
        $message = $data['message'] ?? null;
        
        if (!$sessionKey || !$message) {
            return Response::error('Session key and message required', 400);
        }
        
        $db = Database::conn();
        
        $stmt = $db->prepare("SELECT * FROM webchat_sessions WHERE session_key = ?");
        $stmt->execute([$sessionKey]);
        $session = $stmt->fetch(\PDO::FETCH_ASSOC);
        
        if (!$session) {
            return Response::error('Session not found', 404);
        }
        
        // Get or create conversation
        $conversationId = $session['conversation_id'];
        
        if (!$conversationId) {
            $stmt = $db->prepare("SELECT * FROM webchat_widgets WHERE id = ?");
            $stmt->execute([$session['widget_id']]);
            $widget = $stmt->fetch(\PDO::FETCH_ASSOC);
            
            // Create conversation
            $stmt = $db->prepare("
                INSERT INTO conversations 
                (workspace_id, company_id, channel, channel_identifier, status)
                VALUES (?, ?, 'webchat', ?, 'open')
            ");
            $stmt->execute([
                $widget['workspace_id'],
                $widget['company_id'],
                $sessionKey
            ]);
            
            $conversationId = $db->lastInsertId();
            
            // Update session
            $stmt = $db->prepare("UPDATE webchat_sessions SET conversation_id = ? WHERE id = ?");
            $stmt->execute([$conversationId, $session['id']]);
        }
        
        // Add message
        $stmt = $db->prepare("
            INSERT INTO conversation_messages 
            (conversation_id, direction, channel, content, created_at)
            VALUES (?, 'inbound', 'webchat', ?, NOW())
        ");
        $stmt->execute([$conversationId, $message]);
        
        $messageId = $db->lastInsertId();
        
        // Update conversation unread count
        $stmt = $db->prepare("UPDATE conversations SET unread_count = unread_count + 1, updated_at = NOW() WHERE id = ?");
        $stmt->execute([$conversationId]);
        
        // Emit webhook
        self::emitWebhookEvent($widget['workspace_id'], 'chat.message_received', [
            'conversation_id' => $conversationId,
            'message_id' => $messageId,
            'session_key' => $sessionKey,
            'message' => $message
        ]);
        
        return Response::success(['message_id' => $messageId, 'conversation_id' => $conversationId]);
    }
    
    private static function emitWebhookEvent($workspaceId, $eventType, $payload) {
        $db = Database::conn();
        
        $stmt = $db->prepare("SELECT * FROM webhook_endpoints WHERE workspace_id = ? AND is_active = 1");
        $stmt->execute([$workspaceId]);
        $endpoints = $stmt->fetchAll(\PDO::FETCH_ASSOC);
        
        foreach ($endpoints as $endpoint) {
            $events = json_decode($endpoint['events'], true);
            if (in_array($eventType, $events) || in_array('*', $events)) {
                $stmt = $db->prepare("
                    INSERT INTO webhook_deliveries (endpoint_id, event_type, payload, status)
                    VALUES (?, ?, ?, 'pending')
                ");
                $stmt->execute([$endpoint['id'], $eventType, json_encode($payload)]);
            }
        }
    }
}
