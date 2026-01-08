<?php

namespace Xordon\Controllers;

use Xordon\Core\Database;
use Xordon\Core\Auth;
use Xordon\Core\Response;

class CheckoutController {
    
    public static function createCheckoutForm() {
        $data = json_decode(file_get_contents('php://input'), true);
        $ctx = $GLOBALS['tenantContext'] ?? null;
        
        if (!$ctx || !isset($ctx->workspaceId)) {
            return Response::error('Unauthorized', 401);
        }
        
        $db = Database::conn();
        
        $stmt = $db->prepare("
            INSERT INTO checkout_forms 
            (workspace_id, company_id, name, form_type, products, upsells, downsells, 
             payment_methods, shipping_enabled, tax_enabled, tax_rate, currency)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");
        
        $stmt->execute([
            $ctx->workspaceId,
            $ctx->activeCompanyId ?? null,
            $data['name'],
            $data['form_type'] ?? 'one-step',
            json_encode($data['products'] ?? []),
            json_encode($data['upsells'] ?? []),
            json_encode($data['downsells'] ?? []),
            json_encode($data['payment_methods'] ?? ['stripe']),
            $data['shipping_enabled'] ?? false,
            $data['tax_enabled'] ?? false,
            $data['tax_rate'] ?? 0,
            $data['currency'] ?? 'USD'
        ]);
        
        return Response::success(['checkout_form_id' => $db->lastInsertId()]);
    }
    
    public static function listCheckoutForms() {
        $ctx = $GLOBALS['tenantContext'] ?? null;
        if (!$ctx || !isset($ctx->workspaceId)) {
            return Response::error('Unauthorized', 401);
        }
        
        $db = Database::conn();
        
        $stmt = $db->prepare("
            SELECT c.*, COUNT(o.id) as order_count, SUM(o.total) as total_revenue
            FROM checkout_forms c
            LEFT JOIN orders o ON o.checkout_form_id = c.id
            WHERE c.workspace_id = ?
            GROUP BY c.id
            ORDER BY c.created_at DESC
        ");
        $stmt->execute([$ctx->workspaceId]);
        $forms = $stmt->fetchAll(\PDO::FETCH_ASSOC);
        
        foreach ($forms as &$form) {
            $form['products'] = json_decode($form['products'], true);
            $form['upsells'] = json_decode($form['upsells'], true);
            $form['downsells'] = json_decode($form['downsells'], true);
        }
        
        return Response::success($forms);
    }
    
    public static function createOrder() {
        $data = json_decode(file_get_contents('php://input'), true);
        
        $db = Database::conn();
        
        // Generate order number
        $orderNumber = 'ORD-' . strtoupper(substr(md5(uniqid()), 0, 8));
        
        $stmt = $db->prepare("
            INSERT INTO orders 
            (workspace_id, company_id, checkout_form_id, contact_id, order_number,
             customer_email, customer_name, customer_phone,
             subtotal, tax_amount, shipping_amount, discount_amount, total,
             payment_method, shipping_address, billing_address)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");
        
        $stmt->execute([
            $data['workspace_id'],
            $data['company_id'] ?? null,
            $data['checkout_form_id'] ?? null,
            $data['contact_id'] ?? null,
            $orderNumber,
            $data['customer_email'],
            $data['customer_name'] ?? null,
            $data['customer_phone'] ?? null,
            $data['subtotal'],
            $data['tax_amount'] ?? 0,
            $data['shipping_amount'] ?? 0,
            $data['discount_amount'] ?? 0,
            $data['total'],
            $data['payment_method'] ?? 'stripe',
            json_encode($data['shipping_address'] ?? null),
            json_encode($data['billing_address'] ?? null)
        ]);
        
        $orderId = $db->lastInsertId();
        
        // Add order items
        foreach ($data['items'] as $item) {
            $stmt = $db->prepare("
                INSERT INTO order_items 
                (order_id, product_id, product_name, product_type, quantity, unit_price, total_price)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            ");
            $stmt->execute([
                $orderId,
                $item['product_id'] ?? null,
                $item['product_name'],
                $item['product_type'] ?? 'physical',
                $item['quantity'],
                $item['unit_price'],
                $item['total_price']
            ]);
        }
        
        return Response::success([
            'order_id' => $orderId,
            'order_number' => $orderNumber
        ]);
    }
    
    public static function listOrders() {
        $ctx = $GLOBALS['tenantContext'] ?? null;
        if (!$ctx || !isset($ctx->workspaceId)) {
            return Response::error('Unauthorized', 401);
        }
        
        $status = $_GET['status'] ?? null;
        $limit = (int)($_GET['limit'] ?? 50);
        $offset = (int)($_GET['offset'] ?? 0);
        
        $db = Database::conn();
        
        $sql = "SELECT * FROM orders WHERE workspace_id = ?";
        $params = [$ctx->workspaceId];
        
        if ($status) {
            $sql .= " AND payment_status = ?";
            $params[] = $status;
        }
        
        $sql .= " ORDER BY created_at DESC LIMIT ? OFFSET ?";
        $params[] = $limit;
        $params[] = $offset;
        
        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        $orders = $stmt->fetchAll(\PDO::FETCH_ASSOC);
        
        return Response::success($orders);
    }
    
    public static function getOrder($id) {
        $ctx = $GLOBALS['tenantContext'] ?? null;
        if (!$ctx || !isset($ctx->workspaceId)) {
            return Response::error('Unauthorized', 401);
        }
        
        $db = Database::conn();
        
        $stmt = $db->prepare("SELECT * FROM orders WHERE id = ? AND workspace_id = ?");
        $stmt->execute([$id, $ctx->workspaceId]);
        $order = $stmt->fetch(\PDO::FETCH_ASSOC);
        
        if (!$order) {
            return Response::error('Order not found', 404);
        }
        
        // Get order items
        $stmt = $db->prepare("SELECT * FROM order_items WHERE order_id = ?");
        $stmt->execute([$id]);
        $order['items'] = $stmt->fetchAll(\PDO::FETCH_ASSOC);
        
        return Response::success($order);
    }
    
    public static function updateOrderStatus($id) {
        $data = json_decode(file_get_contents('php://input'), true);
        $ctx = $GLOBALS['tenantContext'] ?? null;
        
        if (!$ctx || !isset($ctx->workspaceId)) {
            return Response::error('Unauthorized', 401);
        }
        
        $db = Database::conn();
        
        $fields = [];
        $params = [];
        
        if (isset($data['payment_status'])) {
            $fields[] = "payment_status = ?";
            $params[] = $data['payment_status'];
        }
        
        if (isset($data['shipping_status'])) {
            $fields[] = "shipping_status = ?";
            $params[] = $data['shipping_status'];
        }
        
        if (isset($data['tracking_number'])) {
            $fields[] = "tracking_number = ?";
            $params[] = $data['tracking_number'];
        }
        
        if (empty($fields)) {
            return Response::error('No fields to update', 400);
        }
        
        $params[] = $id;
        $params[] = $ctx->workspaceId;
        
        $sql = "UPDATE orders SET " . implode(', ', $fields) . " WHERE id = ? AND workspace_id = ?";
        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        
        return self::getOrder($id);
    }
}
