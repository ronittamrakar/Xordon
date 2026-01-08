<?php

namespace Xordon\Controllers;

use Xordon\Core\Database;
use Xordon\Core\Auth;
use Xordon\Core\Response;

class WebhooksController {
    
    public static function listEndpoints() {
        $ctx = $GLOBALS['tenantContext'] ?? null;
        if (!$ctx || !isset($ctx->workspaceId)) {
            return Response::error('Unauthorized', 401);
        }
        
        $db = Database::conn();
        
        $stmt = $db->prepare("SELECT * FROM webhook_endpoints WHERE workspace_id = ? ORDER BY created_at DESC");
        $stmt->execute([$ctx->workspaceId]);
        $endpoints = $stmt->fetchAll(\PDO::FETCH_ASSOC);
        
        foreach ($endpoints as &$endpoint) {
            $endpoint['events'] = json_decode($endpoint['events'], true);
            $endpoint['custom_headers'] = json_decode($endpoint['custom_headers'], true);
        }
        
        return Response::success($endpoints);
    }
    
    public static function createEndpoint() {
        $data = json_decode(file_get_contents('php://input'), true);
        $ctx = $GLOBALS['tenantContext'] ?? null;
        
        if (!$ctx || !isset($ctx->workspaceId)) {
            return Response::error('Unauthorized', 401);
        }
        
        $name = $data['name'] ?? null;
        $url = $data['url'] ?? null;
        $events = $data['events'] ?? [];
        
        if (!$name || !$url || empty($events)) {
            return Response::error('Name, URL, and events required', 400);
        }
        
        $db = Database::conn();
        
        $secret = bin2hex(random_bytes(32));
        
        $stmt = $db->prepare("
            INSERT INTO webhook_endpoints 
            (workspace_id, name, url, secret, events, is_active, retry_failed, max_retries, custom_headers)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");
        
        $stmt->execute([
            $ctx->workspaceId,
            $name,
            $url,
            $secret,
            json_encode($events),
            $data['is_active'] ?? true,
            $data['retry_failed'] ?? true,
            $data['max_retries'] ?? 3,
            json_encode($data['custom_headers'] ?? [])
        ]);
        
        $endpointId = $db->lastInsertId();
        
        $stmt = $db->prepare("SELECT * FROM webhook_endpoints WHERE id = ?");
        $stmt->execute([$endpointId]);
        $endpoint = $stmt->fetch(\PDO::FETCH_ASSOC);
        $endpoint['events'] = json_decode($endpoint['events'], true);
        $endpoint['custom_headers'] = json_decode($endpoint['custom_headers'], true);
        
        return Response::success($endpoint);
    }
    
    public static function getEndpoint($id) {
        $ctx = $GLOBALS['tenantContext'] ?? null;
        if (!$ctx || !isset($ctx->workspaceId)) {
            return Response::error('Unauthorized', 401);
        }
        
        $db = Database::conn();
        
        $stmt = $db->prepare("SELECT * FROM webhook_endpoints WHERE id = ? AND workspace_id = ?");
        $stmt->execute([$id, $ctx->workspaceId]);
        $endpoint = $stmt->fetch(\PDO::FETCH_ASSOC);
        
        if (!$endpoint) {
            return Response::error('Endpoint not found', 404);
        }
        
        $endpoint['events'] = json_decode($endpoint['events'], true);
        $endpoint['custom_headers'] = json_decode($endpoint['custom_headers'], true);
        
        return Response::success($endpoint);
    }
    
    public static function updateEndpoint($id) {
        $data = json_decode(file_get_contents('php://input'), true);
        $ctx = $GLOBALS['tenantContext'] ?? null;
        
        if (!$ctx || !isset($ctx->workspaceId)) {
            return Response::error('Unauthorized', 401);
        }
        
        $db = Database::conn();
        
        $fields = [];
        $params = [];
        
        if (isset($data['name'])) {
            $fields[] = "name = ?";
            $params[] = $data['name'];
        }
        if (isset($data['url'])) {
            $fields[] = "url = ?";
            $params[] = $data['url'];
        }
        if (isset($data['events'])) {
            $fields[] = "events = ?";
            $params[] = json_encode($data['events']);
        }
        if (isset($data['is_active'])) {
            $fields[] = "is_active = ?";
            $params[] = $data['is_active'];
        }
        if (isset($data['retry_failed'])) {
            $fields[] = "retry_failed = ?";
            $params[] = $data['retry_failed'];
        }
        if (isset($data['max_retries'])) {
            $fields[] = "max_retries = ?";
            $params[] = $data['max_retries'];
        }
        if (isset($data['custom_headers'])) {
            $fields[] = "custom_headers = ?";
            $params[] = json_encode($data['custom_headers']);
        }
        
        if (empty($fields)) {
            return Response::error('No fields to update', 400);
        }
        
        $params[] = $id;
        $params[] = $ctx->workspaceId;
        
        $sql = "UPDATE webhook_endpoints SET " . implode(', ', $fields) . " WHERE id = ? AND workspace_id = ?";
        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        
        return self::getEndpoint($id);
    }
    
    public static function deleteEndpoint($id) {
        $ctx = $GLOBALS['tenantContext'] ?? null;
        if (!$ctx || !isset($ctx->workspaceId)) {
            return Response::error('Unauthorized', 401);
        }
        
        $db = Database::conn();
        
        $stmt = $db->prepare("DELETE FROM webhook_endpoints WHERE id = ? AND workspace_id = ?");
        $stmt->execute([$id, $ctx->workspaceId]);
        
        return Response::success(['deleted' => true]);
    }
    
    public static function listDeliveries($endpointId = null) {
        $ctx = $GLOBALS['tenantContext'] ?? null;
        if (!$ctx || !isset($ctx->workspaceId)) {
            return Response::error('Unauthorized', 401);
        }
        
        $limit = (int)($_GET['limit'] ?? 50);
        $offset = (int)($_GET['offset'] ?? 0);
        
        $db = Database::conn();
        
        if ($endpointId) {
            $stmt = $db->prepare("
                SELECT d.*, e.name as endpoint_name, e.url as endpoint_url
                FROM webhook_deliveries d
                JOIN webhook_endpoints e ON e.id = d.endpoint_id
                WHERE e.workspace_id = ? AND d.endpoint_id = ?
                ORDER BY d.created_at DESC
                LIMIT ? OFFSET ?
            ");
            $stmt->execute([$ctx->workspaceId, $endpointId, $limit, $offset]);
        } else {
            $stmt = $db->prepare("
                SELECT d.*, e.name as endpoint_name, e.url as endpoint_url
                FROM webhook_deliveries d
                JOIN webhook_endpoints e ON e.id = d.endpoint_id
                WHERE e.workspace_id = ?
                ORDER BY d.created_at DESC
                LIMIT ? OFFSET ?
            ");
            $stmt->execute([$ctx->workspaceId, $limit, $offset]);
        }
        
        $deliveries = $stmt->fetchAll(\PDO::FETCH_ASSOC);
        
        foreach ($deliveries as &$delivery) {
            $delivery['payload'] = json_decode($delivery['payload'], true);
        }
        
        return Response::success($deliveries);
    }
    
    public static function getDelivery($id) {
        $ctx = $GLOBALS['tenantContext'] ?? null;
        if (!$ctx || !isset($ctx->workspaceId)) {
            return Response::error('Unauthorized', 401);
        }
        
        $db = Database::conn();
        
        $stmt = $db->prepare("
            SELECT d.*, e.name as endpoint_name, e.url as endpoint_url
            FROM webhook_deliveries d
            JOIN webhook_endpoints e ON e.id = d.endpoint_id
            WHERE d.id = ? AND e.workspace_id = ?
        ");
        $stmt->execute([$id, $ctx->workspaceId]);
        $delivery = $stmt->fetch(\PDO::FETCH_ASSOC);
        
        if (!$delivery) {
            return Response::error('Delivery not found', 404);
        }
        
        $delivery['payload'] = json_decode($delivery['payload'], true);
        
        return Response::success($delivery);
    }
    
    public static function retryDelivery($id) {
        $ctx = $GLOBALS['tenantContext'] ?? null;
        if (!$ctx || !isset($ctx->workspaceId)) {
            return Response::error('Unauthorized', 401);
        }
        
        $db = Database::conn();
        
        $stmt = $db->prepare("
            SELECT d.*, e.workspace_id
            FROM webhook_deliveries d
            JOIN webhook_endpoints e ON e.id = d.endpoint_id
            WHERE d.id = ? AND e.workspace_id = ?
        ");
        $stmt->execute([$id, $ctx->workspaceId]);
        $delivery = $stmt->fetch(\PDO::FETCH_ASSOC);
        
        if (!$delivery) {
            return Response::error('Delivery not found', 404);
        }
        
        $stmt = $db->prepare("UPDATE webhook_deliveries SET status = 'pending', next_retry_at = NOW() WHERE id = ?");
        $stmt->execute([$id]);
        
        return Response::success(['retried' => true]);
    }
    
    public static function testEndpoint($id) {
        $ctx = $GLOBALS['tenantContext'] ?? null;
        if (!$ctx || !isset($ctx->workspaceId)) {
            return Response::error('Unauthorized', 401);
        }
        
        $db = Database::conn();
        
        $stmt = $db->prepare("SELECT * FROM webhook_endpoints WHERE id = ? AND workspace_id = ?");
        $stmt->execute([$id, $ctx->workspaceId]);
        $endpoint = $stmt->fetch(\PDO::FETCH_ASSOC);
        
        if (!$endpoint) {
            return Response::error('Endpoint not found', 404);
        }
        
        $testPayload = [
            'event' => 'test',
            'timestamp' => time(),
            'data' => [
                'message' => 'This is a test webhook delivery'
            ]
        ];
        
        $stmt = $db->prepare("
            INSERT INTO webhook_deliveries (endpoint_id, event_type, payload, status)
            VALUES (?, 'test', ?, 'pending')
        ");
        $stmt->execute([$id, json_encode($testPayload)]);
        
        $deliveryId = $db->lastInsertId();
        
        // Attempt immediate delivery
        $result = self::deliverWebhook($endpoint, $testPayload, $deliveryId);
        
        return Response::success([
            'delivery_id' => $deliveryId,
            'success' => $result['success'],
            'http_status' => $result['http_status'] ?? null,
            'response' => $result['response'] ?? null
        ]);
    }
    
    public static function getEventCatalog() {
        return Response::success([
            'events' => [
                ['name' => '*', 'description' => 'All events'],
                ['name' => 'form.submitted', 'description' => 'Form submission received'],
                ['name' => 'payment.received', 'description' => 'Payment recorded'],
                ['name' => 'payment.succeeded', 'description' => 'Payment succeeded'],
                ['name' => 'payment.failed', 'description' => 'Payment failed'],
                ['name' => 'invoice.created', 'description' => 'Invoice created'],
                ['name' => 'invoice.sent', 'description' => 'Invoice sent'],
                ['name' => 'invoice.paid', 'description' => 'Invoice paid'],
                ['name' => 'invoice.overdue', 'description' => 'Invoice overdue'],
                ['name' => 'chat.message_received', 'description' => 'Chat message received'],
                ['name' => 'chat.started', 'description' => 'Chat conversation started'],
                ['name' => 'contact.created', 'description' => 'Contact created'],
                ['name' => 'contact.updated', 'description' => 'Contact updated'],
                ['name' => 'appointment.booked', 'description' => 'Appointment booked'],
                ['name' => 'appointment.completed', 'description' => 'Appointment completed'],
                ['name' => 'appointment.cancelled', 'description' => 'Appointment cancelled'],
                ['name' => 'review.received', 'description' => 'Review received'],
                ['name' => 'opportunity.created', 'description' => 'Opportunity created'],
                ['name' => 'opportunity.won', 'description' => 'Opportunity won'],
                ['name' => 'opportunity.lost', 'description' => 'Opportunity lost']
            ]
        ]);
    }
    
    private static function deliverWebhook($endpoint, $payload, $deliveryId) {
        $db = Database::conn();
        
        try {
            $ch = curl_init($endpoint['url']);
            
            $headers = [
                'Content-Type: application/json',
                'X-Webhook-Signature: ' . hash_hmac('sha256', json_encode($payload), $endpoint['secret'])
            ];
            
            if ($endpoint['custom_headers']) {
                $customHeaders = json_decode($endpoint['custom_headers'], true);
                foreach ($customHeaders as $key => $value) {
                    $headers[] = "$key: $value";
                }
            }
            
            curl_setopt_array($ch, [
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_POST => true,
                CURLOPT_POSTFIELDS => json_encode($payload),
                CURLOPT_HTTPHEADER => $headers,
                CURLOPT_TIMEOUT => 10
            ]);
            
            $response = curl_exec($ch);
            $httpStatus = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            $error = curl_error($ch);
            curl_close($ch);
            
            $success = $httpStatus >= 200 && $httpStatus < 300;
            
            $stmt = $db->prepare("
                UPDATE webhook_deliveries 
                SET status = ?, http_status = ?, response_body = ?, error_message = ?, delivered_at = NOW(), attempt_count = attempt_count + 1
                WHERE id = ?
            ");
            $stmt->execute([
                $success ? 'success' : 'failed',
                $httpStatus,
                substr($response, 0, 1000),
                $error ?: null,
                $deliveryId
            ]);
            
            return [
                'success' => $success,
                'http_status' => $httpStatus,
                'response' => $response
            ];
            
        } catch (\Exception $e) {
            $stmt = $db->prepare("
                UPDATE webhook_deliveries 
                SET status = 'failed', error_message = ?, attempt_count = attempt_count + 1
                WHERE id = ?
            ");
            $stmt->execute([$e->getMessage(), $deliveryId]);
            
            return [
                'success' => false,
                'error' => $e->getMessage()
            ];
        }
    }
}
